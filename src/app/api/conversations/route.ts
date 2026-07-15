import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await requireUser();
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      include: {
        userA: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        userB: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    const withUnread = await Promise.all(
      conversations.map(async (c) => ({
        ...c,
        other: c.userAId === user.id ? c.userB : c.userA,
        unread: await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: user.id },
            readAt: null,
          },
        }),
      }))
    );

    return NextResponse.json({ conversations: withUnread });
  } catch (err) {
    return handleApiError(err);
  }
}
