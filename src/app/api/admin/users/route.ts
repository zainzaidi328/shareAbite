import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireUser(["ADMIN"]);
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { city: { contains: q } },
            ],
          }
        : {},
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        city: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        ngoProfile: true,
        _count: { select: { donations: true, requests: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
