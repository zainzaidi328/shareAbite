"use client";

// Profile — personal info, location, preferences, reviews received, impact.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Star, MapPin, Camera } from "lucide-react";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { api, ApiError } from "@/lib/fetcher";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/misc";
import { toast } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";

const MapPicker = dynamic(() => import("@/components/map/map-picker"), { ssr: false });

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { fullName: string; avatarUrl: string | null };
  donation: { title: string };
}

export default function ProfilePage() {
  const { data: me, isLoading } = useMe();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (me) {
      reset({
        fullName: me.fullName,
        phone: me.phone,
        address: me.address,
        city: me.city,
        latitude: me.latitude,
        longitude: me.longitude,
        bio: me.bio ?? "",
        foodPrefs: me.foodPrefs ?? "",
        avatarUrl: me.avatarUrl ?? "",
      });
    }
  }, [me, reset]);

  const { data: reviewData } = useQuery({
    queryKey: ["reviews", me?.id],
    queryFn: () =>
      api<{ reviews: Review[]; average: number | null }>(`/api/reviews?userId=${me!.id}`),
    enabled: !!me,
  });

  const save = useMutation({
    mutationFn: (data: ProfileInput) =>
      api("/api/profile", { method: "PATCH", json: data }),
    onSuccess: () => {
      toast("Profile updated.");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Update failed", "error"),
  });

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setValue("avatarUrl", `${window.location.origin}${data.url}`);
      toast("Photo ready — save to apply.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading || !me) return <Spinner />;

  const lat = watch("latitude");
  const lng = watch("longitude");
  const avatarPreview = watch("avatarUrl");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar name={me.fullName} src={avatarPreview || me.avatarUrl} size={72} />
          <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-accent p-1.5 text-accent-foreground shadow-glow-sm transition-transform hover:scale-110">
            <Camera size={13} strokeWidth={2} />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{me.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {me.email} · <Badge tone="amber">{me.role}</Badge>
          </p>
          {reviewData?.average && (
            <p className="mt-1 flex items-center gap-1 text-sm text-amber-400">
              <Star size={14} fill="currentColor" /> {reviewData.average.toFixed(1)} ·{" "}
              {reviewData.reviews.length} review{reviewData.reviews.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit((d) => save.mutate(d))}
        className="glass space-y-4 rounded-xl p-6"
      >
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-500">
          Personal information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...register("fullName")} />
            <FieldError message={errors.fullName?.message} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
            <FieldError message={errors.address?.message} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
            <FieldError message={errors.city?.message} />
          </div>
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" placeholder="A line about you…" {...register("bio")} />
        </div>
        <div>
          <Label htmlFor="foodPrefs">Food preferences (comma-separated)</Label>
          <Input id="foodPrefs" placeholder="Halal, Vegetarian" {...register("foodPrefs")} />
        </div>
        <div>
          <Label className="flex items-center gap-1.5">
            <MapPin size={12} /> Your location
          </Label>
          <MapPicker
            value={lat != null && lng != null ? { lat, lng } : null}
            onChange={({ lat, lng }) => {
              setValue("latitude", lat);
              setValue("longitude", lng);
            }}
          />
        </div>
        <Button type="submit" loading={isSubmitting || save.isPending || uploading}>
          Save changes
        </Button>
      </form>

      {(reviewData?.reviews ?? []).length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">
            Reviews received
          </h2>
          <div className="space-y-3">
            {reviewData!.reviews.map((r) => (
              <div key={r.id} className="glass rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.author.fullName} src={r.author.avatarUrl} size={32} />
                    <div>
                      <p className="text-sm font-medium">{r.author.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.donation.title} · {format(new Date(r.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < r.rating ? "text-amber-500" : "text-zinc-700"}
                        fill={i < r.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="mt-2 text-sm text-zinc-300">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
