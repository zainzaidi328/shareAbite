"use client";

// Admin — review all listings, remove fake/expired ones.

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/fetcher";
import { DONATION_STATUSES } from "@/lib/constants";
import { Input, Select } from "@/components/ui/input";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner, EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toaster";

interface Listing {
  id: string;
  title: string;
  category: string;
  quantity: number;
  status: string;
  city: string;
  createdAt: string;
  donor: { id: string; fullName: string };
}

export default function AdminDonationsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-donations", q, status],
    queryFn: () =>
      api<{ donations: Listing[] }>(
        `/api/donations?q=${encodeURIComponent(q)}&status=${status}`
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/donations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-donations"] });
      toast("Listing deleted.");
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed", "error"),
  });

  const donations = data?.donations ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Manage donations</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, city…" className="pl-10" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          {DONATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : donations.length === 0 ? (
        <EmptyState title="No listings with this status" />
      ) : (
        <div className="glass overflow-x-auto rounded-lg">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Posted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-b border-line/50 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/donations/${d.id}`} className="font-medium hover:text-amber-400">
                      {d.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{d.city}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{d.donor.fullName}</td>
                  <td className="px-4 py-3 text-zinc-400">{d.category}</td>
                  <td className="px-4 py-3">{d.quantity}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {format(new Date(d.createdAt), "MMM d")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete "${d.title}"?`)) remove.mutate(d.id);
                        }}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
