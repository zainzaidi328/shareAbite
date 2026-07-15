"use client";

// Find Food — searchable, filterable, map-aware donation browser.

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Search, MapIcon, LayoutGrid, Clock, MapPin, Users } from "lucide-react";
import { api } from "@/lib/fetcher";
import { CATEGORIES } from "@/lib/constants";
import { cn, formatDistance, timeUntil } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner, EmptyState } from "@/components/ui/misc";

const DonationsMap = dynamic(() => import("@/components/map/donations-map"), {
  ssr: false,
  loading: () => (
    <div className="glass flex h-[420px] items-center justify-center rounded-lg text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

interface Listing {
  id: string;
  title: string;
  category: string;
  quantity: number;
  servingSize: string;
  expiresAt: string;
  pickupStart: string;
  pickupEnd: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  isVegetarian: boolean;
  isHalal: boolean;
  distanceKm: number | null;
  donor: { id: string; fullName: string; avatarUrl: string | null };
}

const DISTANCES = [
  { value: 0, label: "Any distance" },
  { value: 2, label: "Within 2 km" },
  { value: 5, label: "Within 5 km" },
  { value: 10, label: "Within 10 km" },
  { value: 25, label: "Within 25 km" },
];

export default function BrowsePage() {
  const { data: me } = useMe();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [maxKm, setMaxKm] = useState(0);
  const [veg, setVeg] = useState(false);
  const [halal, setHalal] = useState(false);
  const [view, setView] = useState<"grid" | "map">("grid");

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category !== "All") sp.set("category", category);
    if (maxKm) sp.set("maxKm", String(maxKm));
    if (veg) sp.set("veg", "1");
    if (halal) sp.set("halal", "1");
    return sp.toString();
  }, [q, category, maxKm, veg, halal]);

  const { data, isLoading } = useQuery({
    queryKey: ["browse", params],
    queryFn: () => api<{ donations: Listing[] }>(`/api/donations?${params}`),
    refetchInterval: 30_000,
  });

  const donations = data?.donations ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Food near you
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {donations.length} available donation{donations.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="glass flex rounded-lg p-1">
          {(["grid", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all duration-200",
                view === v ? "bg-accent-muted text-amber-400" : "text-zinc-400 hover:text-foreground"
              )}
            >
              {v === "grid" ? <LayoutGrid size={15} strokeWidth={1.5} /> : <MapIcon size={15} strokeWidth={1.5} />}
              {v === "grid" ? "Cards" : "Map"}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search food, city, area…"
            className="pl-10"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={maxKm} onChange={(e) => setMaxKm(Number(e.target.value))} className="w-40">
          {DISTANCES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </Select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} className="h-4 w-4 accent-amber-500" />
          Vegetarian
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={halal} onChange={(e) => setHalal(e.target.checked)} className="h-4 w-4 accent-amber-500" />
          Halal
        </label>
      </div>

      {isLoading ? (
        <Spinner />
      ) : view === "map" ? (
        <DonationsMap
          donations={donations}
          me={me ? { lat: me.latitude, lng: me.longitude } : null}
        />
      ) : donations.length === 0 ? (
        <EmptyState
          title="No food matches your filters"
          hint="Try widening the distance or clearing the search."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {donations.map((d) => (
            <Link key={d.id} href={`/dashboard/donations/${d.id}`} className="group">
              <article className="glass glass-hover h-full overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="relative h-40 overflow-hidden bg-muted">
                  {d.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.imageUrl}
                      alt={d.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🍽</div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Badge tone="amber" className="backdrop-blur-md">{d.category}</Badge>
                  </div>
                  {d.distanceKm != null && (
                    <span className="glass absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] text-amber-400">
                      <MapPin size={11} /> {formatDistance(d.distanceKm)}
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="font-display font-semibold leading-snug group-hover:text-amber-400">
                    {d.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">by {d.donor.fullName} · {d.city}</p>
                  <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Users size={12} strokeWidth={1.5} /> {d.servingSize}
                    </span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <Clock size={12} strokeWidth={1.5} /> {timeUntil(d.expiresAt)}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
