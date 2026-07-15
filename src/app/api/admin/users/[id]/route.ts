import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] — { action: "toggleActive" | "approveNgo" }
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireUser(["ADMIN"]);
    const { id } = await params;
    const { action } = (await req.json()) as { action?: string };

    const user = await prisma.user.findUnique({
      where: { id },
      include: { ngoProfile: true },
    });
    if (!user) return jsonError("User not found", 404);
    if (user.id === admin.id) return jsonError("You cannot modify yourself", 400);

    if (action === "toggleActive") {
      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
      });
      return NextResponse.json({ user: { id: updated.id, isActive: updated.isActive } });
    }

    if (action === "approveNgo") {
      if (!user.ngoProfile) return jsonError("User has no NGO profile", 400);
      await prisma.ngoProfile.update({
        where: { id: user.ngoProfile.id },
        data: { approved: true },
      });
      await notify(
        user.id,
        "NGO_APPROVED",
        "NGO approved 🎉",
        "Your organization has been verified. You can now claim large donations.",
        "/dashboard/ngo"
      );
      return NextResponse.json({ ok: true });
    }

    return jsonError("Unknown action");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const admin = await requireUser(["ADMIN"]);
    const { id } = await params;
    if (id === admin.id) return jsonError("You cannot delete yourself", 400);
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
