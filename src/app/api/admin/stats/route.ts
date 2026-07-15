import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { KG_PER_SERVING, MEALS_PER_SERVING } from "@/lib/constants";
import { format, startOfMonth, subMonths } from "date-fns";

export async function GET() {
  try {
    await requireUser(["ADMIN"]);

    const [users, donations, completedAgg, pendingNgos, requests] =
      await Promise.all([
        prisma.user.count(),
        prisma.foodDonation.count(),
        prisma.foodDonation.aggregate({
          where: { status: "COMPLETED" },
          _sum: { quantity: true },
          _count: true,
        }),
        prisma.ngoProfile.count({ where: { approved: false } }),
        prisma.donationRequest.count(),
      ]);

    // Monthly growth for the last 6 months.
    const months: { month: string; users: number; donations: number; completed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = startOfMonth(subMonths(new Date(), i - 1));
      const [u, d, c] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.foodDonation.count({
          where: { createdAt: { gte: start, lt: end } },
        }),
        prisma.foodDonation.count({
          where: { status: "COMPLETED", updatedAt: { gte: start, lt: end } },
        }),
      ]);
      months.push({ month: format(start, "MMM"), users: u, donations: d, completed: c });
    }

    const byCategory = await prisma.foodDonation.groupBy({
      by: ["category"],
      _count: true,
    });

    const servings = completedAgg._sum.quantity ?? 0;
    return NextResponse.json({
      totals: {
        users,
        donations,
        completedDonations: completedAgg._count,
        mealsFed: servings * MEALS_PER_SERVING,
        kgSaved: Math.round(servings * KG_PER_SERVING),
        pendingNgos,
        requests,
      },
      months,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
