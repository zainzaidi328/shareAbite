import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";

// POST /api/messages — send a message. Creates the conversation on first
// contact when `recipientId` is provided instead of `conversationId`.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!rateLimit(`msg:${clientIp(req)}`, 30, 60_000).ok)
      return jsonError("Sending too fast — slow down a little.", 429);

    const data = messageSchema.parse(await req.json());

    let conversationId = data.conversationId;
    let otherId: string;

    if (conversationId) {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!conv || (conv.userAId !== user.id && conv.userBId !== user.id))
        return jsonError("Conversation not found", 404);
      otherId = conv.userAId === user.id ? conv.userBId : conv.userAId;
    } else {
      if (!data.recipientId) return jsonError("recipientId required");
      if (data.recipientId === user.id)
        return jsonError("You cannot message yourself");
      const other = await prisma.user.findUnique({
        where: { id: data.recipientId },
      });
      if (!other) return jsonError("User not found", 404);
      otherId = other.id;
      // Canonical ordering avoids duplicate A↔B / B↔A pairs.
      const [a, b] = [user.id, otherId].sort();
      const conv = await prisma.conversation.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        create: { userAId: a, userBId: b },
        update: {},
      });
      conversationId = conv.id;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        body: data.body,
        imageUrl: data.imageUrl || undefined,
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    await notify(
      otherId,
      "NEW_MESSAGE",
      `Message from ${user.fullName}`,
      data.body.slice(0, 80),
      `/dashboard/messages?c=${conversationId}`
    );

    return NextResponse.json({ message, conversationId }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
