import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = resetPasswordSchema.parse(await req.json());

    const record = await prisma.authToken.findUnique({ where: { token } });
    if (
      !record ||
      record.kind !== "PASSWORD_RESET" ||
      record.expiresAt < new Date()
    )
      return jsonError("This reset link is invalid or has expired", 400);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      }),
      prisma.authToken.deleteMany({
        where: { userId: record.userId, kind: "PASSWORD_RESET" },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
