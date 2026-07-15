import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { donationSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { distanceKm } from "@/lib/utils";

// GET /api/donations — search & filter listings.
// Query: q, category, veg, halal, maxKm, lat, lng, minQuantity, mine, status
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const category = sp.get("category");
    const mine = sp.get("mine") === "1";
    const status = sp.get("status");
    const minQuantity = Number(sp.get("minQuantity") ?? 0);
    const maxKm = Number(sp.get("maxKm") ?? 0);
    const lat = Number(sp.get("lat") ?? user?.latitude ?? 0);
    const lng = Number(sp.get("lng") ?? user?.longitude ?? 0);

    const donations = await prisma.foodDonation.findMany({
      where: {
        ...(mine && user ? { donorId: user.id } : {}),
        ...(status
          ? { status }
          : mine
            ? {}
            : { status: "ACTIVE", expiresAt: { gt: new Date() } }),
        ...(category && category !== "All" ? { category } : {}),
        ...(sp.get("veg") === "1" ? { isVegetarian: true } : {}),
        ...(sp.get("halal") === "1" ? { isHalal: true } : {}),
        ...(minQuantity > 0 ? { quantity: { gte: minQuantity } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { city: { contains: q } },
                { address: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        donor: { select: { id: true, fullName: true, avatarUrl: true, city: true } },
        requests: { select: { id: true, status: true, requesterId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    let results = donations.map((d) => ({
      ...d,
      distanceKm:
        lat && lng ? distanceKm(lat, lng, d.latitude, d.longitude) : null,
    }));
    if (maxKm > 0 && lat && lng)
      results = results.filter((d) => (d.distanceKm ?? 0) <= maxKm);
    results.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    return NextResponse.json({ donations: results });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/donations — create a listing (donors & NGOs).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(["DONOR", "NGO", "ADMIN"]);
    if (!rateLimit(`post-donation:${clientIp(req)}`, 15, 60_000).ok)
      return jsonError("Too many listings created. Slow down a little.", 429);

    const data = donationSchema.parse(await req.json());
    const donation = await prisma.foodDonation.create({
      data: {
        donorId: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        quantity: data.quantity,
        servingSize: data.servingSize,
        cookedAt: data.cookedAt ? new Date(data.cookedAt) : undefined,
        expiresAt: new Date(data.expiresAt),
        pickupStart: new Date(data.pickupStart),
        pickupEnd: new Date(data.pickupEnd),
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        imageUrl: data.imageUrl || undefined,
        instructions: data.instructions,
        isVegetarian: data.isVegetarian ?? false,
        isHalal: data.isHalal ?? false,
      },
    });
    return NextResponse.json({ donation }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
