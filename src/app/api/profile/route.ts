import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = profileSchema.parse(await req.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        bio: data.bio,
        foodPrefs: data.foodPrefs,
        avatarUrl: data.avatarUrl || null,
      },
    });
    const { passwordHash: _ph, ...safe } = updated;
    void _ph;
    return NextResponse.json({ user: safe });
  } catch (err) {
    return handleApiError(err);
  }
}
