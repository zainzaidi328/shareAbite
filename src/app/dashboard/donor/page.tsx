"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  PlusCircle,
  Inbox,
  MessageSquare,
  History,
  Flame,
  Soup,
  Leaf,
} from "lucide-react";
import { api } from "@/lib/fetcher";
import { timeUntil } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { Badge, statusTone } from "@/components/ui/badge";
import { StatCard, Spinner, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Donation {
  id: string;
  title: string;
  category: string;
  quantity: number;
  servingSize: string;
  status: string;
  expiresAt: string;
  pickupStart: string;
  pickupEnd: string;
  address: string;
  city: string;
  requests: { id: string; status: string }[];
}

interface Impact {
  mealsFed: number;
  kgSaved: number;
  streakWeeks: number;
  completedCount: number;
  achievements: { id: string; label: string; earned: boolean }[];
}

const QUICK_ACTIONS = [
  { href: "/dashboard/post-food", label: "Post New Food", icon: PlusCircle },
  { href: "/dashboard/requests", label: "View Requests", icon: Inbox },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/donor/history", label: "History", icon: History },
];

export default function DonorDashboard() {
  const { data: me } = useMe();
  const { data, isLoading } = useQuery({
    queryKey: ["my-donations"],
    queryFn: () => api<{ donations: Donation[] }>("/api/donations?mine=1"),
  });
  const { data: impact } = useQuery({
    queryKey: ["impact"],
    queryFn: () => api<Impact>("/api/stats/impact"),
  });

  const donations = data?.donations ?? [];
  const active = donations.filter((d) => d.status === "ACTIVE").length;
  const completed = donations.filter((d) => d.status === "COMPLETED").length;
  const pendingRequests = donations.reduce(
    (s, d) => s + d.requests.filter((r) => r.status === "PENDING").length,
    0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Salam, {me?.fullName?.split(" ")[0] ?? "friend"} 👋
        </h1>
        {impact && impact.mealsFed > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Soup size={14} className="text-amber-500" />
            You have helped feed{" "}
            <span className="font-semibold text-amber-400">{impact.mealsFed}</span>{" "}
            people so far.
            {impact.streakWeeks > 1 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-500">
                <Flame size={14} /> {impact.streakWeeks}-week streak
              </span>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Donations" value={donations.length} />
        <StatCard label="Active" value={active} accent />
        <StatCard label="Completed" value={completed} />
        <StatCard label="Pending Requests" value={pendingRequests} />
      </div>

      {impact && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Meals Fed"
            value={impact.mealsFed}
            icon={<Soup size={16} strokeWidth={1.5} className="text-amber-500" />}
          />
          <StatCard
            label="Food Saved"
            value={`${impact.kgSaved} kg`}
            icon={<Leaf size={16} strokeWidth={1.5} className="text-emerald-400" />}
          />
          <StatCard
            label="Week Streak"
            value={impact.streakWeeks}
            icon={<Flame size={16} strokeWidth={1.5} className="text-amber-500" />}
          />
          <div className="glass rounded-lg p-5">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Achievements
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {impact.achievements.map((a) => (
                <Badge key={a.id} tone={a.earned ? "amber" : "neutral"}>
                  {a.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUICK_ACTIONS.map((qa) => (
          <Link key={qa.href} href={qa.href}>
            <div className="glass glass-hover flex items-center gap-3 rounded-lg p-4 hover:scale-[1.02]">
              <qa.icon size={20} strokeWidth={1.5} className="text-amber-500" />
              <span className="text-sm font-medium">{qa.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Your food listings
          </h2>
          <Link href="/dashboard/post-food">
            <Button size="sm">
              <PlusCircle size={15} strokeWidth={1.5} /> Post Food
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <Spinner />
        ) : donations.length === 0 ? (
          <EmptyState
            title="No listings yet"
            hint="Got surplus food? Post it and someone nearby will pick it up."
            action={
              <Link href="/dashboard/post-food">
                <Button size="sm">Post your first donation</Button>
              </Link>
            }
          />
        ) : (
          <div className="glass overflow-x-auto rounded-lg">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Food</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Pickup Window</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-line/50 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/donations/${d.id}`}
                        className="font-medium hover:text-amber-400"
                      >
                        {d.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{d.servingSize}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{d.category}</td>
                    <td className="px-4 py-3">{d.quantity}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {d.status === "ACTIVE" ? timeUntil(d.expiresAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {format(new Date(d.pickupStart), "MMM d, h:mma")} –{" "}
                      {format(new Date(d.pickupEnd), "h:mma")}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-zinc-400">
                      {d.address}, {d.city}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
