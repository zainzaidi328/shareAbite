"use client";

// Admin analytics dashboard.
// Chart palette validated (dataviz six checks) on surface #12121A:
//   #D97706 (users) · #0284C7 (donations) · #DB2777 (completed)

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Users, UtensilsCrossed, Soup, Leaf, Inbox } from "lucide-react";
import { api } from "@/lib/fetcher";
import { StatCard, Spinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

const SERIES = {
  users: "#D97706",
  donations: "#0284C7",
  completed: "#DB2777",
} as const;

const AXIS_TICK = { fill: "#71717A", fontSize: 12 };
const GRID_STROKE = "rgba(255,255,255,0.06)";

interface Stats {
  totals: {
    users: number;
    donations: number;
    completedDonations: number;
    mealsFed: number;
    kgSaved: number;
    pendingNgos: number;
    requests: number;
  };
  months: { month: string; users: number; donations: number; completed: number }[];
  byCategory: { category: string; count: number }[];
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-elev-lg">
      <p className="mb-1 font-mono uppercase tracking-wide text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api<Stats>("/api/admin/stats"),
  });

  if (isLoading || !data) return <Spinner />;
  const { totals, months, byCategory } = data;
  const maxCategory = Math.max(...byCategory.map((c) => c.count), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Admin panel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform health at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">Manage users</Button>
          </Link>
          <Link href="/admin/donations">
            <Button variant="outline" size="sm">Manage donations</Button>
          </Link>
        </div>
      </div>

      {totals.pendingNgos > 0 && (
        <Link href="/admin/users?filter=ngo" className="block">
          <div className="glass glass-hover flex items-center justify-between rounded-lg border-amber-500/20 p-4 shadow-glow-sm">
            <p className="text-sm">
              <span className="font-semibold text-amber-400">{totals.pendingNgos}</span>{" "}
              NGO{totals.pendingNgos === 1 ? "" : "s"} awaiting verification
            </p>
            <span className="text-sm text-amber-500">Review →</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Users" value={totals.users} icon={<Users size={16} strokeWidth={1.5} className="text-zinc-400" />} />
        <StatCard label="Donations" value={totals.donations} icon={<UtensilsCrossed size={16} strokeWidth={1.5} className="text-zinc-400" />} />
        <StatCard label="Completed" value={totals.completedDonations} />
        <StatCard label="Meals Fed" value={totals.mealsFed} icon={<Soup size={16} strokeWidth={1.5} className="text-amber-500" />} accent />
        <StatCard label="Food Saved" value={`${totals.kgSaved} kg`} icon={<Leaf size={16} strokeWidth={1.5} className="text-emerald-400" />} />
        <StatCard label="Requests" value={totals.requests} icon={<Inbox size={16} strokeWidth={1.5} className="text-zinc-400" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly growth */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Monthly growth
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            New users, listings and completed pickups per month
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID_STROKE }} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span style={{ color: "#A1A1AA", fontSize: 12 }}>{v}</span>
                )}
              />
              <Line type="monotone" dataKey="users" name="Users" stroke={SERIES.users} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#12121A" }} />
              <Line type="monotone" dataKey="donations" name="Donations" stroke={SERIES.donations} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#12121A" }} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke={SERIES.completed} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#12121A" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution — single series, single hue */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Donations by category
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">All-time listing counts</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={byCategory}
              layout="vertical"
              margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
              barCategoryGap={6}
            >
              <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="category" width={92} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" name="Listings" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {byCategory.map((c) => (
                  <Cell
                    key={c.category}
                    fill={SERIES.users}
                    opacity={0.45 + 0.55 * (c.count / maxCategory)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table view of the monthly data (accessibility fallback) */}
      <details className="glass rounded-xl p-6">
        <summary className="cursor-pointer font-display text-sm font-semibold text-zinc-300">
          View monthly data as a table
        </summary>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-4">Month</th>
              <th className="py-2 pr-4">New users</th>
              <th className="py-2 pr-4">Donations</th>
              <th className="py-2">Completed</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month} className="border-b border-line/50 last:border-0">
                <td className="py-2 pr-4">{m.month}</td>
                <td className="py-2 pr-4">{m.users}</td>
                <td className="py-2 pr-4">{m.donations}</td>
                <td className="py-2">{m.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
