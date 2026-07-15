"use client";

// My Requests (recipient/NGO) — track status, show pickup code + QR when
// accepted, cancel, and review the donor after completion.

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Star, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/badge";
import { Spinner, EmptyState } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/dialog";
import { Textarea, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { PickupQr } from "@/components/pickup-qr";
import { cn } from "@/lib/utils";

interface Req {
  id: string;
  status: string;
  pickupCode: string | null;
  createdAt: string;
  donation: {
    id: string;
    title: string;
    imageUrl: string | null;
    address: string;
    city: string;
    donor: { id: string; fullName: string };
  };
}

export default function MyRequestsPage() {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<Req | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => api<{ requests: Req[] }>("/api/requests"),
    refetchInterval: 20_000,
  });

  const cancel = useMutation({
    mutationFn: (id: string) =>
      api(`/api/requests/${id}`, { method: "PATCH", json: { action: "cancel" } }),
    onSuccess: () => {
      toast("Request cancelled.");
      qc.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed", "error"),
  });

  const review = useMutation({
    mutationFn: () =>
      api("/api/reviews", {
        method: "POST",
        json: { donationId: reviewing!.donation.id, rating, comment },
      }),
    onSuccess: () => {
      toast("Review posted. Thanks for the feedback!");
      setReviewing(null);
      setComment("");
      setRating(5);
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Review failed", "error"),
  });

  const requests = data?.requests ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">My requests</h1>

      {isLoading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState
          title="You haven't requested anything yet"
          hint="Browse nearby donations and send your first request."
          action={
            <Link href="/dashboard/browse">
              <Button size="sm">Find food</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="glass rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  {r.donation.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.donation.imageUrl}
                      alt=""
                      className="hidden h-20 w-20 rounded-lg border border-line object-cover sm:block"
                    />
                  )}
                  <div>
                    <Link
                      href={`/dashboard/donations/${r.donation.id}`}
                      className="font-display font-semibold hover:text-amber-400"
                    >
                      {r.donation.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      from {r.donation.donor.fullName} · {r.donation.address}, {r.donation.city}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-zinc-600">
                      requested {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>

              {r.status === "ACCEPTED" && r.pickupCode && (
                <div className="mt-4 flex flex-wrap items-center gap-6 rounded-lg border border-amber-500/20 bg-accent-muted/50 p-4 shadow-glow-sm">
                  <PickupQr code={r.pickupCode} size={110} />
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-amber-500">
                      Your pickup code
                    </p>
                    <p className="font-display text-4xl font-bold tracking-[0.25em] text-amber-400">
                      {r.pickupCode}
                    </p>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      Show this code (or the QR) to the donor at handover. They confirm it
                      to complete the donation.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {["PENDING", "ACCEPTED"].includes(r.status) && (
                  <Button size="sm" variant="danger" onClick={() => cancel.mutate(r.id)}>
                    <XCircle size={15} strokeWidth={1.5} /> Cancel
                  </Button>
                )}
                {r.status === "COMPLETED" && (
                  <Button size="sm" variant="outline" onClick={() => setReviewing(r)}>
                    <Star size={15} strokeWidth={1.5} /> Review donor
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!reviewing} onClose={() => setReviewing(null)} title="Review the donor">
        <p className="mb-3 text-sm text-muted-foreground">
          How was your experience with {reviewing?.donation.donor.fullName}?
        </p>
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={26}
                strokeWidth={1.5}
                className={cn(n <= rating ? "text-amber-500" : "text-zinc-700")}
                fill={n <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="The food was fresh and pickup was easy…"
        />
        <Button className="mt-4 w-full" loading={review.isPending} onClick={() => review.mutate()}>
          Post review
        </Button>
      </Dialog>
    </div>
  );
}
