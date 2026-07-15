import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET messages in a conversation; marks incoming messages read.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        userA: { select: { id: true, fullName: true, avatarUrl: true } },
        userB: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    if (
      !conversation ||
      (conversation.userAId !== user.id && conversation.userBId !== user.id)
    )
      return jsonError("Conversation not found", 404);

    await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json({
      conversation: {
        ...conversation,
        other:
          conversation.userAId === user.id
            ? conversation.userB
            : conversation.userA,
      },
      messages,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
