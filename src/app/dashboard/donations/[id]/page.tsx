"use client";

// Donation detail — request flow for recipients/NGOs, management for the donor.

import { use, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Clock,
  MapPin,
  Users,
  Star,
  Heart,
  MessageSquare,
  Trash2,
  Leaf,
  MoonStar,
} from "lucide-react";
import { api, ApiError } from "@/lib/fetcher";
import { timeUntil } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/dialog";
import { Textarea, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

const DonationsMap = dynamic(() => import("@/components/map/donations-map"), {
  ssr: false,
});

interface Detail {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  servingSize: string;
  cookedAt: string | null;
  expiresAt: string;
  pickupStart: string;
  pickupEnd: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  instructions: string | null;
  status: string;
  isVegetarian: boolean;
  isHalal: boolean;
  donor: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    city: string;
    createdAt: string;
    reviewsReceived: { rating: number }[];
  };
  requests?: {
    id: string;
    status: string;
    requesterId: string;
    requester?: { id: string; fullName: string };
  }[];
}

export default function DonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [requestOpen, setRequestOpen] = useState(false);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["donation", id],
    queryFn: () => api<{ donation: Detail }>(`/api/donations/${id}`),
  });

  const request = useMutation({
    mutationFn: () =>
      api("/api/requests", { method: "POST", json: { donationId: id, message: note } }),
    onSuccess: () => {
      toast("Request sent! You'll be notified when the donor responds.");
      setRequestOpen(false);
      qc.invalidateQueries({ queryKey: ["donation", id] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Request failed", "error"),
  });

  const favorite = useMutation({
    mutationFn: () =>
      api<{ favorited: boolean }>("/api/favorites", {
        method: "POST",
        json: { donorId: data?.donation.donor.id },
      }),
    onSuccess: (d) =>
      toast(d.favorited ? "Donor added to favorites ❤" : "Removed from favorites"),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/donations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast("Listing removed.");
      router.push("/dashboard/donor");
    },
  });

  if (isLoading || !data) return <Spinner />;
  const d = data.donation;
  const isOwner = me?.id === d.donor.id;
  const canRequest =
    me && !isOwner && (me.role === "RECIPIENT" || me.role === "NGO");
  const myRequest = d.requests?.find((r) => r.requesterId === me?.id);
  const ratings = d.donor.reviewsReceived;
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {d.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={d.imageUrl}
              alt={d.title}
              className="h-72 w-full rounded-xl border border-line object-cover shadow-elev-lg"
            />
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(d.status)}>{d.status}</Badge>
              <Badge tone="neutral">{d.category}</Badge>
              {d.isVegetarian && (
                <Badge tone="green">
                  <Leaf size={11} /> Vegetarian
                </Badge>
              )}
              {d.isHalal && (
                <Badge tone="amber">
                  <MoonStar size={11} /> Halal
                </Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
              {d.title}
            </h1>
            <p className="mt-3 leading-relaxed text-zinc-300">{d.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-lg p-4">
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <Users size={12} /> Quantity
              </p>
              <p className="mt-1 font-medium">
                {d.quantity} · {d.servingSize}
              </p>
            </div>
            <div className="glass rounded-lg p-4">
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <Clock size={12} /> Expires
              </p>
              <p className="mt-1 font-medium text-amber-400">{timeUntil(d.expiresAt)}</p>
            </div>
            <div className="glass rounded-lg p-4">
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <Clock size={12} /> Pickup window
              </p>
              <p className="mt-1 text-sm font-medium">
                {format(new Date(d.pickupStart), "MMM d, h:mma")} –{" "}
                {format(new Date(d.pickupEnd), "h:mma")}
              </p>
            </div>
            <div className="glass rounded-lg p-4">
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <MapPin size={12} /> Location
              </p>
              <p className="mt-1 text-sm font-medium">
                {d.address}, {d.city}
              </p>
            </div>
          </div>

          {d.instructions && (
            <div className="glass rounded-lg border-amber-500/20 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-amber-500">
                Pickup instructions
              </p>
              <p className="mt-1 text-sm text-zinc-300">{d.instructions}</p>
            </div>
          )}

          <DonationsMap
            donations={[{ ...d, distanceKm: null, donor: { fullName: d.donor.fullName } }]}
            me={me ? { lat: me.latitude, lng: me.longitude } : null}
            height={280}
          />
          <a
            href={`https://www.openstreetmap.org/directions?to=${d.latitude},${d.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-amber-500 hover:text-amber-400"
          >
            Get directions on OpenStreetMap →
          </a>
        </div>

        {/* Side panel */}
        <div className="space-y-4 lg:col-span-2">
          <div className="glass rounded-xl p-5">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Shared by
            </p>
            <div className="flex items-center gap-3">
              <Avatar name={d.donor.fullName} src={d.donor.avatarUrl} size={48} />
              <div>
                <p className="font-display font-semibold">{d.donor.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {d.donor.city} · member since {format(new Date(d.donor.createdAt), "MMM yyyy")}
                </p>
                {avgRating && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-400">
                    <Star size={12} fill="currentColor" /> {avgRating} ({ratings.length} reviews)
                  </p>
                )}
              </div>
            </div>

            {canRequest && (
              <div className="mt-5 space-y-2">
                {myRequest ? (
                  <div className="rounded-lg bg-accent-muted p-3 text-center">
                    <p className="text-sm text-amber-400">
                      Request {myRequest.status.toLowerCase()}
                    </p>
                    <Link href="/dashboard/my-requests" className="text-xs text-amber-500 underline-offset-2 hover:underline">
                      View in My Requests
                    </Link>
                  </div>
                ) : d.status === "ACTIVE" ? (
                  <Button className="w-full" onClick={() => setRequestOpen(true)}>
                    Request this food
                  </Button>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    No longer available
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      const res = await api<{ conversationId: string }>("/api/messages", {
                        method: "POST",
                        json: { recipientId: d.donor.id, body: `Hi! I'm interested in "${d.title}".` },
                      });
                      router.push(`/dashboard/messages?c=${res.conversationId}`);
                    }}
                  >
                    <MessageSquare size={15} strokeWidth={1.5} /> Message
                  </Button>
                  <Button variant="outline" onClick={() => favorite.mutate()} aria-label="Favorite donor">
                    <Heart size={15} strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="mt-5 space-y-2">
                <Link href="/dashboard/requests">
                  <Button variant="outline" className="w-full">
                    View requests ({d.requests?.length ?? 0})
                  </Button>
                </Link>
                {d.status === "ACTIVE" && (
                  <Button
                    variant="danger"
                    className="w-full"
                    loading={remove.isPending}
                    onClick={() => {
                      if (confirm("Remove this listing?")) remove.mutate();
                    }}
                  >
                    <Trash2 size={15} strokeWidth={1.5} /> Remove listing
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={requestOpen} onClose={() => setRequestOpen(false)} title="Request this food">
        <Label htmlFor="note">Message to the donor (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Introduce yourself — when could you pick it up?"
        />
        <Button className="mt-4 w-full" loading={request.isPending} onClick={() => request.mutate()}>
          Send request
        </Button>
      </Dialog>
    </div>
  );
}
