import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requestSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";

// GET /api/requests?role=requester|donor — list requests I've made, or
// requests on my donations (for donors).
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const asDonor = req.nextUrl.searchParams.get("role") === "donor";

    const requests = await prisma.donationRequest.findMany({
      where: asDonor
        ? { donation: { donorId: user.id } }
        : { requesterId: user.id },
      include: {
        donation: {
          include: {
            donor: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        requester: {
          select: { id: true, fullName: true, avatarUrl: true, city: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/requests — recipient/NGO requests a donation.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(["RECIPIENT", "NGO"]);
    if (!rateLimit(`request:${clientIp(req)}`, 10, 60_000).ok)
      return jsonError("Too many requests. Try again shortly.", 429);

    const { donationId, message } = requestSchema.parse(await req.json());
    const donation = await prisma.foodDonation.findUnique({
      where: { id: donationId },
    });
    if (!donation) return jsonError("Donation not found", 404);
    if (donation.status !== "ACTIVE")
      return jsonError("This donation is no longer available", 409);
    if (donation.expiresAt < new Date())
      return jsonError("This donation has expired", 409);
    if (donation.donorId === user.id)
      return jsonError("You cannot request your own donation", 400);

    const existing = await prisma.donationRequest.findUnique({
      where: {
        donationId_requesterId: { donationId, requesterId: user.id },
      },
    });
    if (existing) return jsonError("You already requested this donation", 409);

    const request = await prisma.donationRequest.create({
      data: { donationId, requesterId: user.id, message },
    });

    await notify(
      donation.donorId,
      "REQUEST_RECEIVED",
      "New pickup request",
      `${user.fullName} requested "${donation.title}"`,
      "/dashboard/requests"
    );

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
