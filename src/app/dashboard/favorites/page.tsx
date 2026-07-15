"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, HeartOff } from "lucide-react";
import { api } from "@/lib/fetcher";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner, EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toaster";

interface Fav {
  id: string;
  donor: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    city: string;
    reviewsReceived: { rating: number }[];
    donations: { id: string }[];
  };
}

export default function FavoritesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api<{ favorites: Fav[] }>("/api/favorites"),
  });

  const toggle = useMutation({
    mutationFn: (donorId: string) =>
      api("/api/favorites", { method: "POST", json: { donorId } }),
    onSuccess: () => {
      toast("Removed from favorites");
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const favorites = data?.favorites ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Favorite donors</h1>
      {isLoading ? (
        <Spinner />
      ) : favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          hint="Tap the heart on a donation to keep track of donors you trust."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favorites.map((f) => {
            const ratings = f.donor.reviewsReceived;
            const avg =
              ratings.length > 0
                ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
                : null;
            return (
              <div key={f.id} className="glass glass-hover flex items-center gap-4 rounded-lg p-5">
                <Avatar name={f.donor.fullName} src={f.donor.avatarUrl} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold">{f.donor.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.donor.city} · {f.donor.donations.length} active listing
                    {f.donor.donations.length === 1 ? "" : "s"}
                  </p>
                  {avg && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-400">
                      <Star size={11} fill="currentColor" /> {avg}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove favorite"
                  onClick={() => toggle.mutate(f.donor.id)}
                >
                  <HeartOff size={16} strokeWidth={1.5} className="text-zinc-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
