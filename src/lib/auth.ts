import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, type Role } from "@/lib/constants";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sharebite-dev-secret"
);

export interface SessionPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      role: payload.role as Role,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Full current user record, or null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { ngoProfile: true },
  });
  if (!user || !user.isActive) return null;
  return user;
}

/** Throws a Response-friendly error object when unauthenticated/unauthorized. */
export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Not authenticated");
  if (roles && !roles.includes(user.role as Role))
    throw new AuthError(403, "Not authorized for this action");
  return user;
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
