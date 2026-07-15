"use client";

// NGO overview — verification status, large donations to claim,
// claim tracking, volunteers, and impact analytics.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, ShieldCheck, ShieldAlert, Soup, Leaf, Search } from "lucide-react";
import { api } from "@/lib/fetcher";
import { useMe } from "@/hooks/use-me";
import { formatDistance, timeUntil } from "@/lib/utils";
import { StatCard, Spinner, EmptyState } from "@/components/ui/misc";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Listing {
  id: string;
  title: string;
  quantity: number;
  servingSize: string;
  city: string;
  expiresAt: string;
  distanceKm: number | null;
  donor: { fullName: string };
}

interface Req {
  id: string;
  status: string;
  donation: { id: string; title: string };
}

interface Impact {
  mealsFed: number;
  kgSaved: number;
  completedCount: number;
}

export default function NgoDashboard() {
  const { data: me } = useMe();
  const { data: large, isLoading } = useQuery({
    queryKey: ["large-donations"],
    queryFn: () => api<{ donations: Listing[] }>("/api/donations?minQuantity=15"),
  });
  const { data: claims } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => api<{ requests: Req[] }>("/api/requests"),
  });
  const { data: impact } = useQuery({
    queryKey: ["impact"],
    queryFn: () => api<Impact>("/api/stats/impact"),
  });

  const approved = me?.ngoProfile?.approved;
  const activeClaims = (claims?.requests ?? []).filter((r) =>
    ["PENDING", "ACCEPTED"].includes(r.status)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {me?.ngoProfile?.organizationName ?? "NGO Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Coordinate large-scale food rescue for your community.
          </p>
        </div>
        {approved ? (
          <Badge tone="green">
            <ShieldCheck size={12} /> Verified NGO
          </Badge>
        ) : (
          <Badge tone="amber">
            <ShieldAlert size={12} /> Pending approval
          </Badge>
        )}
      </div>

      {!approved && (
        <div className="glass rounded-lg border-amber-500/20 p-4 text-sm text-zinc-300 shadow-glow-sm">
          Your organization is awaiting admin verification. You can browse
          donations now; claiming works once you&apos;re approved.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Meals Delivered"
          value={impact?.mealsFed ?? 0}
          icon={<Soup size={16} strokeWidth={1.5} className="text-amber-500" />}
          accent
        />
        <StatCard
          label="Food Rescued"
          value={`${impact?.kgSaved ?? 0} kg`}
          icon={<Leaf size={16} strokeWidth={1.5} className="text-emerald-400" />}
        />
        <StatCard label="Active Claims" value={activeClaims.length} />
        <StatCard
          label="Volunteers"
          value={me?.ngoProfile?.volunteers ?? 0}
          icon={<Users size={16} strokeWidth={1.5} className="text-zinc-400" />}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Large donations available
          </h2>
          <Link href="/dashboard/browse">
            <Button variant="outline" size="sm">
              <Search size={15} strokeWidth={1.5} /> Browse all
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (large?.donations ?? []).length === 0 ? (
          <EmptyState
            title="No large donations right now"
            hint="Listings with 15+ servings appear here for coordinated pickups."
          />
        ) : (
          <div className="space-y-3">
            {(large?.donations ?? []).map((d) => (
              <Link key={d.id} href={`/dashboard/donations/${d.id}`} className="block">
                <div className="glass glass-hover flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.donor.fullName} · {d.city}
                      {d.distanceKm != null && ` · ${formatDistance(d.distanceKm)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="amber">{d.quantity} servings</Badge>
                    <span className="font-mono text-xs text-amber-500">{timeUntil(d.expiresAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {activeClaims.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">
            Your active claims
          </h2>
          <div className="space-y-3">
            {activeClaims.map((r) => (
              <Link key={r.id} href="/dashboard/my-requests" className="block">
                <div className="glass glass-hover flex items-center justify-between rounded-lg p-4">
                  <p className="font-medium">{r.donation.title}</p>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
