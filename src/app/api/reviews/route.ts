import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-helpers";

// GET /api/reviews?userId=... — reviews received by a user.
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return jsonError("userId required");
    const reviews = await prisma.review.findMany({
      where: { targetId: userId },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        donation: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const avg =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : null;
    return NextResponse.json({ reviews, average: avg });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/reviews — review the donor after a completed pickup.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = reviewSchema.parse(await req.json());

    const request = await prisma.donationRequest.findFirst({
      where: {
        donationId: data.donationId,
        requesterId: user.id,
        status: "COMPLETED",
      },
      include: { donation: true },
    });
    if (!request)
      return jsonError("You can only review donations you completed", 403);

    const existing = await prisma.review.findUnique({
      where: {
        donationId_authorId: { donationId: data.donationId, authorId: user.id },
      },
    });
    if (existing) return jsonError("You already reviewed this donation", 409);

    const review = await prisma.review.create({
      data: {
        donationId: data.donationId,
        authorId: user.id,
        targetId: request.donation.donorId,
        rating: data.rating,
        comment: data.comment,
      },
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
