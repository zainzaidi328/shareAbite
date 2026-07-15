"use client";

// Admin — manage users, approve NGOs, deactivate/delete accounts.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, ShieldCheck, Ban, Trash2, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/fetcher";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { toast } from "@/components/ui/toaster";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  city: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  ngoProfile: { organizationName: string; approved: boolean } | null;
  _count: { donations: number; requests: number };
}

const roleTone = (role: string) =>
  role === "ADMIN" ? "red" : role === "NGO" ? "blue" : role === "DONOR" ? "amber" : "neutral";

function UsersInner() {
  const qc = useQueryClient();
  const initialFilter = useSearchParams().get("filter") ?? "";
  const [q, setQ] = useState("");
  const [ngoOnly, setNgoOnly] = useState(initialFilter === "ngo");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: () => api<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api(`/api/admin/users/${id}`, { method: "PATCH", json: { action } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast("Updated.");
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed", "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast("User deleted.");
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed", "error"),
  });

  let users = data?.users ?? [];
  if (ngoOnly) users = users.filter((u) => u.ngoProfile && !u.ngoProfile.approved);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Manage users</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, city…" className="pl-10" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={ngoOnly} onChange={(e) => setNgoOnly(e.target.checked)} className="h-4 w-4 accent-amber-500" />
          Pending NGOs only
        </label>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="glass overflow-x-auto rounded-lg">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line/50 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.ngoProfile && (
                      <p className="text-xs text-sky-400">
                        {u.ngoProfile.organizationName}
                        {!u.ngoProfile.approved && " · unverified"}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={roleTone(u.role) as never}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{u.city}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {u._count.donations} donations · {u._count.requests} requests
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isActive ? "green" : "red"}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {u.ngoProfile && !u.ngoProfile.approved && (
                        <Button
                          size="sm"
                          onClick={() => act.mutate({ id: u.id, action: "approveNgo" })}
                          title="Approve NGO"
                        >
                          <ShieldCheck size={14} strokeWidth={1.5} /> Approve
                        </Button>
                      )}
                      {u.role !== "ADMIN" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => act.mutate({ id: u.id, action: "toggleActive" })}
                            title={u.isActive ? "Deactivate" : "Reactivate"}
                          >
                            {u.isActive ? <Ban size={14} strokeWidth={1.5} /> : <CheckCircle2 size={14} strokeWidth={1.5} />}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            title="Delete user"
                            onClick={() => {
                              if (confirm(`Delete ${u.fullName} and all their data?`))
                                remove.mutate(u.id);
                            }}
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </Button>
                        </>
                      )}
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

export default function AdminUsersPage() {
  return (
    <Suspense>
      <UsersInner />
    </Suspense>
  );
}
