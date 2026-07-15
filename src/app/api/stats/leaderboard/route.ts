import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-helpers";
import { MEALS_PER_SERVING } from "@/lib/constants";

export async function GET() {
  try {
    const donors = await prisma.user.findMany({
      where: { role: { in: ["DONOR", "NGO"] }, isActive: true },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        city: true,
        donations: {
          where: { status: "COMPLETED" },
          select: { quantity: true },
        },
        reviewsReceived: { select: { rating: true } },
      },
    });

    const leaderboard = donors
      .map((d) => ({
        id: d.id,
        fullName: d.fullName,
        avatarUrl: d.avatarUrl,
        city: d.city,
        donations: d.donations.length,
        mealsFed:
          d.donations.reduce((s, x) => s + x.quantity, 0) * MEALS_PER_SERVING,
        rating:
          d.reviewsReceived.length > 0
            ? d.reviewsReceived.reduce((s, r) => s + r.rating, 0) /
              d.reviewsReceived.length
            : null,
      }))
      .filter((d) => d.donations > 0)
      .sort((a, b) => b.mealsFed - a.mealsFed)
      .slice(0, 20);

    return NextResponse.json({ leaderboard });
  } catch (err) {
    return handleApiError(err);
  }
}
