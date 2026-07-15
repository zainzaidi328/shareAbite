"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export interface Me {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "DONOR" | "RECIPIENT" | "NGO" | "ADMIN";
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  avatarUrl: string | null;
  bio: string | null;
  foodPrefs: string | null;
  emailVerified: boolean;
  createdAt: string;
  ngoProfile: {
    organizationName: string;
    approved: boolean;
    volunteers: number;
  } | null;
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: Me | null }>("/api/auth/me"),
    select: (d) => d.user,
    staleTime: 60_000,
  });
}
