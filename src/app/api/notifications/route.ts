import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await requireUser();
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
    ]);
    return NextResponse.json({ notifications, unread });
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/notifications — mark all (or one) read.
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const { id } = (await req.json().catch(() => ({}))) as { id?: string };
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null, ...(id ? { id } : {}) },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
