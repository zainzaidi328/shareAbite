import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await requireUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            city: true,
            reviewsReceived: { select: { rating: true } },
            donations: { where: { status: "ACTIVE" }, select: { id: true } },
          },
        },
      },
    });
    return NextResponse.json({ favorites });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/favorites — toggle a favorite donor.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { donorId } = (await req.json()) as { donorId?: string };
    if (!donorId) return jsonError("donorId required");

    const existing = await prisma.favorite.findUnique({
      where: { userId_donorId: { userId: user.id, donorId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }
    await prisma.favorite.create({ data: { userId: user.id, donorId } });
    return NextResponse.json({ favorited: true });
  } catch (err) {
    return handleApiError(err);
  }
}
