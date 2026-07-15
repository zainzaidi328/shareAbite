import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Local image upload (dev / self-hosted). On Vercel, configure Cloudinary
// via NEXT_PUBLIC_CLOUDINARY_* and the client uploads directly instead.
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("No file provided");
    if (!ALLOWED.includes(file.type))
      return jsonError("Only JPEG, PNG, WEBP or GIF images are allowed");
    if (file.size > MAX_BYTES) return jsonError("Image must be under 5 MB");

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const name = `${crypto.randomBytes(12).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (err) {
    return handleApiError(err);
  }
}
