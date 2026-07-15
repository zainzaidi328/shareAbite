"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, Soup } from "lucide-react";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Spinner, EmptyState } from "@/components/ui/misc";

interface Entry {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  city: string;
  donations: number;
  mealsFed: number;
  rating: number | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api<{ leaderboard: Entry[] }>("/api/stats/leaderboard"),
  });

  const entries = data?.leaderboard ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <Trophy size={32} strokeWidth={1.5} className="mx-auto text-amber-500" />
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
          Community leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The donors and NGOs feeding the most people.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <EmptyState title="No completed donations yet" hint="The first completed pickup starts the board." />
      ) : (
        <div className="space-y-3">
          {entries.map((e, i) => (
            <div
              key={e.id}
              className={cn(
                "glass glass-hover flex items-center gap-4 rounded-lg p-4",
                i === 0 && "border-amber-500/25 shadow-border-glow"
              )}
            >
              <span className="w-8 text-center font-display text-lg font-bold text-zinc-500">
                {MEDALS[i] ?? i + 1}
              </span>
              <Avatar name={e.fullName} src={e.avatarUrl} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold">{e.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {e.city} · {e.donations} completed donation{e.donations === 1 ? "" : "s"}
                  {e.rating != null && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-400">
                      <Star size={10} fill="currentColor" /> {e.rating.toFixed(1)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Soup size={16} strokeWidth={1.5} />
                <span className="font-display text-lg font-bold">{e.mealsFed}</span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">meals</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
