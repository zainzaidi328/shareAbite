"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { donationSchema, type DonationInput } from "@/lib/validations";
import { api, ApiError } from "@/lib/fetcher";
import { useMe } from "@/hooks/use-me";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { ImagePlus, MapPin } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/map/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="glass flex h-[260px] items-center justify-center rounded-lg text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export default function PostFoodPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const [serverError, setServerError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DonationInput>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      category: "Cooked Meal",
      quantity: 1,
      address: me?.address ?? "",
      city: me?.city ?? "",
    },
  });

  const lat = watch("latitude");
  const lng = watch("longitude");

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      const origin = window.location.origin;
      setValue("imageUrl", `${origin}${data.url}`);
      setPreview(data.url);
      toast("Photo uploaded");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setServerError("");
    try {
      await api("/api/donations", { method: "POST", json: data });
      toast("Donation posted! Nearby recipients can now see it.");
      router.push("/dashboard/donor");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Failed to post donation");
    }
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        Post food
      </h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Share what you have — someone nearby is looking for exactly this.
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="glass space-y-4 rounded-xl p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-500">
            What are you sharing?
          </h2>
          <div>
            <Label htmlFor="title">Food name</Label>
            <Input id="title" placeholder="e.g. Chicken Biryani (Freshly Cooked)" {...register("title")} />
            <FieldError message={errors.title?.message} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="How was it prepared? How is it stored? Anything a recipient should know."
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" {...register("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity (servings)</Label>
              <Input id="quantity" type="number" min={1} {...register("quantity")} />
              <FieldError message={errors.quantity?.message} />
            </div>
            <div>
              <Label htmlFor="servingSize">Serving size</Label>
              <Input id="servingSize" placeholder="Feeds 10 people" {...register("servingSize")} />
              <FieldError message={errors.servingSize?.message} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-500" {...register("isVegetarian")} />
              Vegetarian
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-500" {...register("isHalal")} />
              Halal
            </label>
          </div>
        </div>

        <div className="glass space-y-4 rounded-xl p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-500">
            Timing
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cookedAt">Cooked time (optional)</Label>
              <Input id="cookedAt" type="datetime-local" {...register("cookedAt")} />
            </div>
            <div>
              <Label htmlFor="expiresAt">Best before</Label>
              <Input id="expiresAt" type="datetime-local" {...register("expiresAt")} />
              <FieldError message={errors.expiresAt?.message} />
            </div>
            <div>
              <Label htmlFor="pickupStart">Pickup from</Label>
              <Input id="pickupStart" type="datetime-local" {...register("pickupStart")} />
              <FieldError message={errors.pickupStart?.message} />
            </div>
            <div>
              <Label htmlFor="pickupEnd">Pickup until</Label>
              <Input id="pickupEnd" type="datetime-local" {...register("pickupEnd")} />
              <FieldError message={errors.pickupEnd?.message} />
            </div>
          </div>
        </div>

        <div className="glass space-y-4 rounded-xl p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-500">
            Pickup location
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="House, street, area" {...register("address")} />
              <FieldError message={errors.address?.message} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Lahore" {...register("city")} />
              <FieldError message={errors.city?.message} />
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-1.5">
              <MapPin size={12} /> Pin the exact pickup spot
            </Label>
            <MapPicker
              value={lat != null && lng != null ? { lat, lng } : null}
              onChange={({ lat, lng }) => {
                setValue("latitude", lat, { shouldValidate: true });
                setValue("longitude", lng, { shouldValidate: true });
              }}
            />
            <FieldError
              message={errors.latitude || errors.longitude ? "Tap the map to set the pickup location" : undefined}
            />
          </div>
        </div>

        <div className="glass space-y-4 rounded-xl p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-500">
            Photo & instructions
          </h2>
          <div>
            <Label>Food photo</Label>
            <label className="glass-hover flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-amber-500/40">
              <ImagePlus size={20} strokeWidth={1.5} className="text-amber-500" />
              {uploading ? "Uploading…" : preview ? "Photo added — click to replace" : "Upload a photo (JPEG/PNG/WEBP, max 5 MB)"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Food preview" className="mt-3 h-40 rounded-lg border border-line object-cover" />
            )}
          </div>
          <div>
            <Label htmlFor="instructions">Special instructions (optional)</Label>
            <Textarea
              id="instructions"
              placeholder="e.g. Ring the bell at the side gate. Bring containers."
              {...register("instructions")}
            />
          </div>
        </div>

        {serverError && <p className="text-sm text-red-400">{serverError}</p>}
        <Button type="submit" size="lg" loading={isSubmitting || uploading} className="w-full">
          Post donation
        </Button>
      </form>
    </div>
  );
}
