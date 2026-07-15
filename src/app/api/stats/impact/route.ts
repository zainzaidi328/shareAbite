import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { KG_PER_SERVING, MEALS_PER_SERVING } from "@/lib/constants";
import { differenceInCalendarDays } from "date-fns";

// Personal impact: meals fed, kg saved, streak, achievements.
export async function GET() {
  try {
    const user = await requireUser();
    const isDonorSide = user.role === "DONOR" || user.role === "NGO";

    const completed = await prisma.foodDonation.findMany({
      where: isDonorSide
        ? { donorId: user.id, status: "COMPLETED" }
        : {
            status: "COMPLETED",
            requests: { some: { requesterId: user.id, status: "COMPLETED" } },
          },
      select: { quantity: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const servings = completed.reduce((s, d) => s + d.quantity, 0);

    // Streak: consecutive weeks with at least one completed donation.
    let streakWeeks = 0;
    const weeks = new Set(
      completed.map((d) =>
        Math.floor(differenceInCalendarDays(new Date(), d.updatedAt) / 7)
      )
    );
    while (weeks.has(streakWeeks)) streakWeeks++;

    const mealsFed = servings * MEALS_PER_SERVING;
    const achievements = [
      { id: "first", label: "First Share", earned: completed.length >= 1 },
      { id: "five", label: "5 Donations", earned: completed.length >= 5 },
      { id: "hundred", label: "100 Meals", earned: mealsFed >= 100 },
      { id: "streak4", label: "4-Week Streak", earned: streakWeeks >= 4 },
    ];

    return NextResponse.json({
      completedCount: completed.length,
      mealsFed,
      kgSaved: Math.round(servings * KG_PER_SERVING * 10) / 10,
      streakWeeks,
      achievements,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
