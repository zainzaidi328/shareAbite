import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { signSession, setAuthCookie } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`register:${clientIp(req)}`, 5, 60_000).ok)
      return jsonError("Too many attempts. Try again in a minute.", 429);

    const data = registerSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) return jsonError("An account with this email already exists", 409);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash,
        role: data.role,
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        ...(data.role === "NGO"
          ? {
              ngoProfile: {
                create: {
                  organizationName: data.organizationName!,
                  registrationNo: data.registrationNo!,
                },
              },
            }
          : {}),
      },
    });

    // Email verification link (logged to console when SMTP is unset).
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.authToken.create({
      data: {
        userId: user.id,
        kind: "EMAIL_VERIFY",
        token,
        expiresAt: new Date(Date.now() + 24 * 3_600_000),
      },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendEmail(
      user.email,
      "Verify your ShareBite email",
      `<p>Welcome to ShareBite! Verify your email: <a href="${appUrl}/verify-email?token=${token}">${appUrl}/verify-email?token=${token}</a></p>`
    );

    const jwt = await signSession({
      sub: user.id,
      role: user.role as never,
      email: user.email,
    });
    await setAuthCookie(jwt);

    return NextResponse.json({
      user: { id: user.id, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
