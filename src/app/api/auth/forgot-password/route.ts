import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`forgot:${clientIp(req)}`, 5, 60_000).ok)
      return jsonError("Too many attempts. Try again in a minute.", 429);

    const { email } = forgotPasswordSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to avoid leaking which emails exist.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.authToken.create({
        data: {
          userId: user.id,
          kind: "PASSWORD_RESET",
          token,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendEmail(
        user.email,
        "Reset your ShareBite password",
        `<p>Reset your password (valid 1 hour): <a href="${appUrl}/reset-password?token=${token}">${appUrl}/reset-password?token=${token}</a></p>`
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
