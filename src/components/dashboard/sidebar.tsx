"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  PlusCircle,
  Inbox,
  Search,
  HandHeart,
  MessageSquare,
  User,
  Trophy,
  Heart,
  Building2,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/fetcher";
import { useMe } from "@/hooks/use-me";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const NAV: Record<string, NavItem[]> = {
  DONOR: [
    { href: "/dashboard/donor", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/post-food", label: "Post Food", icon: PlusCircle },
    { href: "/dashboard/requests", label: "Requests", icon: Inbox },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ],
  RECIPIENT: [
    { href: "/dashboard/browse", label: "Find Food", icon: Search },
    { href: "/dashboard/my-requests", label: "My Requests", icon: HandHeart },
    { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ],
  NGO: [
    { href: "/dashboard/ngo", label: "Overview", icon: Building2 },
    { href: "/dashboard/browse", label: "Find Donations", icon: Search },
    { href: "/dashboard/my-requests", label: "Claims", icon: HandHeart },
    { href: "/dashboard/post-food", label: "Post Food", icon: PlusCircle },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ],
  ADMIN: [
    { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
    { href: "/dashboard/browse", label: "Listings", icon: Search },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ],
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const [mobileOpen, setMobileOpen] = useState(false);

  useQuery({
    queryKey: ["redirect-guard"],
    queryFn: async () => {
      if (!isLoading && !me) router.push("/login");
      return null;
    },
    enabled: !isLoading && !me,
  });

  const items = NAV[me?.role ?? "RECIPIENT"] ?? NAV.RECIPIENT;

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              active
                ? "bg-accent-muted text-amber-400 shadow-glow-sm"
                : "text-zinc-400 hover:bg-white/5 hover:text-foreground"
            )}
          >
            <item.icon size={18} strokeWidth={1.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-background-alt/60 backdrop-blur-md md:flex">
        <Link href="/" className="flex h-16 items-center gap-2 px-6 font-display text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-base">🍽</span>
          ShareBite
        </Link>
        {nav}
        <div className="border-t border-line p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-background-alt pb-4">
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-display font-semibold">🍽 ShareBite</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 text-zinc-400">
                <X size={20} />
              </button>
            </div>
            {nav}
            <button
              onClick={logout}
              className="mx-3 mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5"
            >
              <LogOut size={18} strokeWidth={1.5} /> Log out
            </button>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-background/70 px-4 backdrop-blur-md md:px-8">
          <button
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <NotificationsBell />
            {me && (
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-white/5">
                <Avatar name={me.fullName} src={me.avatarUrl} size={32} />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-tight">{me.fullName}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {me.role}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </header>
        <main className="relative z-10 flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
