import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wraps a route handler with uniform error handling. */
export function handleApiError(err: unknown) {
  if (err instanceof AuthError) return jsonError(err.message, err.status);
  if (err instanceof ZodError)
    return jsonError(err.errors[0]?.message ?? "Invalid input", 422);
  console.error("[api]", err);
  return jsonError("Something went wrong", 500);
}
