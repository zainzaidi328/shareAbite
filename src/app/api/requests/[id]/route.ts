import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";
import { generatePickupCode } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/requests/[id]
// Actions: accept | reject | cancel | complete (with { code })
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = (await req.json()) as { action?: string; code?: string };

    const request = await prisma.donationRequest.findUnique({
      where: { id },
      include: { donation: true, requester: true },
    });
    if (!request) return jsonError("Request not found", 404);

    const isDonor = request.donation.donorId === user.id;
    const isRequester = request.requesterId === user.id;

    switch (body.action) {
      case "accept": {
        if (!isDonor) return jsonError("Only the donor can accept", 403);
        if (request.status !== "PENDING")
          return jsonError("This request was already handled", 409);

        const pickupCode = generatePickupCode();
        const [updated] = await prisma.$transaction([
          prisma.donationRequest.update({
            where: { id },
            data: { status: "ACCEPTED", pickupCode },
          }),
          prisma.foodDonation.update({
            where: { id: request.donationId },
            data: { status: "RESERVED" },
          }),
          // Reject other pending requests for the same donation.
          prisma.donationRequest.updateMany({
            where: {
              donationId: request.donationId,
              status: "PENDING",
              id: { not: id },
            },
            data: { status: "REJECTED" },
          }),
        ]);

        await notify(
          request.requesterId,
          "REQUEST_ACCEPTED",
          "Request accepted 🎉",
          `Your request for "${request.donation.title}" was accepted. Your pickup code is ${pickupCode}.`,
          "/dashboard/my-requests"
        );
        return NextResponse.json({ request: updated });
      }

      case "reject": {
        if (!isDonor) return jsonError("Only the donor can reject", 403);
        if (request.status !== "PENDING")
          return jsonError("This request was already handled", 409);
        const updated = await prisma.donationRequest.update({
          where: { id },
          data: { status: "REJECTED" },
        });
        await notify(
          request.requesterId,
          "REQUEST_REJECTED",
          "Request declined",
          `Your request for "${request.donation.title}" was declined.`,
          "/dashboard/browse"
        );
        return NextResponse.json({ request: updated });
      }

      case "cancel": {
        if (!isRequester) return jsonError("Only the requester can cancel", 403);
        if (!["PENDING", "ACCEPTED"].includes(request.status))
          return jsonError("This request can no longer be cancelled", 409);
        const wasAccepted = request.status === "ACCEPTED";
        const [updated] = await prisma.$transaction([
          prisma.donationRequest.update({
            where: { id },
            data: { status: "CANCELLED" },
          }),
          ...(wasAccepted
            ? [
                prisma.foodDonation.update({
                  where: { id: request.donationId },
                  data: { status: "ACTIVE" },
                }),
              ]
            : []),
        ]);
        return NextResponse.json({ request: updated });
      }

      case "complete": {
        // Donor confirms handover by entering (or scanning) the pickup code.
        if (!isDonor) return jsonError("Only the donor can complete pickup", 403);
        if (request.status !== "ACCEPTED")
          return jsonError("This request is not awaiting pickup", 409);
        if (!body.code || body.code !== request.pickupCode)
          return jsonError("Incorrect pickup code", 400);

        const [updated] = await prisma.$transaction([
          prisma.donationRequest.update({
            where: { id },
            data: { status: "COMPLETED", completedAt: new Date() },
          }),
          prisma.foodDonation.update({
            where: { id: request.donationId },
            data: { status: "COMPLETED" },
          }),
        ]);
        await notify(
          request.requesterId,
          "DONATION_COMPLETED",
          "Pickup completed ✅",
          `"${request.donation.title}" is complete. Leave the donor a review!`,
          `/dashboard/my-requests`
        );
        return NextResponse.json({ request: updated });
      }

      default:
        return jsonError("Unknown action");
    }
  } catch (err) {
    return handleApiError(err);
  }
}
