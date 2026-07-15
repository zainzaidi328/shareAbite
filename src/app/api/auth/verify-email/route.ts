import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token) return jsonError("Missing token");

    const record = await prisma.authToken.findUnique({ where: { token } });
    if (
      !record ||
      record.kind !== "EMAIL_VERIFY" ||
      record.expiresAt < new Date()
    )
      return jsonError("This verification link is invalid or has expired", 400);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.authToken.deleteMany({
        where: { userId: record.userId, kind: "EMAIL_VERIFY" },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
