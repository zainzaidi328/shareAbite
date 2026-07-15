"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api<{ notifications: Notification[]; unread: number }>("/api/notifications"),
    refetchInterval: 15_000, // near-real-time polling
  });

  const markRead = useMutation({
    mutationFn: (id?: string) =>
      api("/api/notifications", { method: "PATCH", json: id ? { id } : {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = data?.unread ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell size={20} strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-accent-foreground shadow-glow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass absolute right-0 top-12 z-50 w-80 rounded-xl p-2 shadow-elev-xl md:w-96">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="font-display text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markRead.mutate(undefined)}
                className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {(data?.notifications ?? []).length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nothing yet — your good deeds will show up here.
              </p>
            )}
            {(data?.notifications ?? []).map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => {
                  if (!n.readAt) markRead.mutate(n.id);
                  setOpen(false);
                }}
                className={cn(
                  "block rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5",
                  !n.readAt && "bg-accent-muted/40"
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.readAt && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
