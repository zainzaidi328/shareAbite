import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const donation = await prisma.foodDonation.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            city: true,
            createdAt: true,
            reviewsReceived: { select: { rating: true } },
          },
        },
        requests: user
          ? {
              where:
                user.role === "DONOR" || user.role === "ADMIN"
                  ? {}
                  : { requesterId: user.id },
              include: {
                requester: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            }
          : false,
      },
    });
    if (!donation) return jsonError("Donation not found", 404);
    return NextResponse.json({ donation });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const donation = await prisma.foodDonation.findUnique({ where: { id } });
    if (!donation) return jsonError("Donation not found", 404);
    if (donation.donorId !== user.id && user.role !== "ADMIN")
      return jsonError("Not authorized", 403);

    const body = await req.json();
    const allowed = [
      "title",
      "description",
      "quantity",
      "servingSize",
      "instructions",
      "status",
      "imageUrl",
    ] as const;
    const data: Record<string, unknown> = {};
    for (const key of allowed) if (key in body) data[key] = body[key];

    const updated = await prisma.foodDonation.update({ where: { id }, data });
    return NextResponse.json({ donation: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const donation = await prisma.foodDonation.findUnique({ where: { id } });
    if (!donation) return jsonError("Donation not found", 404);
    if (donation.donorId !== user.id && user.role !== "ADMIN")
      return jsonError("Not authorized", 403);

    await prisma.foodDonation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
