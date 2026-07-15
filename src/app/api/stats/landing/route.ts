import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-helpers";
import { MEALS_PER_SERVING } from "@/lib/constants";

export async function GET() {
  try {
    const [completed, donors, ngos, cities] = await Promise.all([
      prisma.foodDonation.aggregate({
        where: { status: "COMPLETED" },
        _sum: { quantity: true },
        _count: true,
      }),
      prisma.user.count({ where: { role: "DONOR", isActive: true } }),
      prisma.ngoProfile.count({ where: { approved: true } }),
      prisma.user.findMany({ select: { city: true }, distinct: ["city"] }),
    ]);
    return NextResponse.json({
      mealsShared: (completed._sum.quantity ?? 0) * MEALS_PER_SERVING,
      activeDonors: donors,
      ngos,
      cities: cities.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
