"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/fetcher";
import { Badge, statusTone } from "@/components/ui/badge";
import { Spinner, EmptyState } from "@/components/ui/misc";
import Link from "next/link";

interface Donation {
  id: string;
  title: string;
  category: string;
  quantity: number;
  status: string;
  createdAt: string;
}

export default function DonorHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-donations"],
    queryFn: () => api<{ donations: Donation[] }>("/api/donations?mine=1"),
  });

  const past = (data?.donations ?? []).filter((d) =>
    ["COMPLETED", "EXPIRED", "REMOVED"].includes(d.status)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Donation history</h1>
      {isLoading ? (
        <Spinner />
      ) : past.length === 0 ? (
        <EmptyState title="No past donations yet" hint="Completed and expired donations will appear here." />
      ) : (
        <div className="space-y-3">
          {past.map((d) => (
            <Link key={d.id} href={`/dashboard/donations/${d.id}`} className="block">
              <div className="glass glass-hover flex items-center justify-between rounded-lg p-4">
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.category} · {d.quantity} servings ·{" "}
                    {format(new Date(d.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge tone={statusTone(d.status)}>{d.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
