import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { signSession, setAuthCookie } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000).ok)
      return jsonError("Too many attempts. Try again in a minute.", 429);

    const { email, password } = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return jsonError("Invalid email or password", 401);
    if (!user.isActive)
      return jsonError("This account has been deactivated", 403);

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
