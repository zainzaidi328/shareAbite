"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { api, ApiError } from "@/lib/fetcher";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { MapPin } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/map/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="glass flex h-[260px] items-center justify-center rounded-lg text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

const ROLE_OPTIONS = [
  { value: "DONOR", label: "Donor", hint: "I have food to share" },
  { value: "RECIPIENT", label: "Recipient", hint: "I'm looking for food" },
  { value: "NGO", label: "NGO", hint: "We rescue food at scale" },
] as const;

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState("");

  const initialRole = (params.get("role") ?? "DONOR") as RegisterInput["role"];
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: initialRole },
  });

  const role = watch("role");

  const onSubmit = handleSubmit(async (data) => {
    setServerError("");
    try {
      await api("/api/auth/register", { method: "POST", json: data });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Registration failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Role selector */}
      <div>
        <Label>I am joining as</Label>
        <div className="grid grid-cols-3 gap-2">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setValue("role", r.value)}
              className={`rounded-lg border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                role === r.value
                  ? "border-amber-500/40 bg-accent-muted shadow-glow-sm"
                  : "border-line bg-muted/40 hover:border-white/15"
              }`}
            >
              <p className="font-display text-sm font-semibold">{r.label}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{r.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Ayesha Khan" {...register("fullName")} />
          <FieldError message={errors.fullName?.message} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+92 300 1234567" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="8+ characters" autoComplete="new-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" placeholder="Repeat password" autoComplete="new-password" {...register("confirmPassword")} />
          <FieldError message={errors.confirmPassword?.message} />
        </div>
      </div>

      {role === "NGO" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="organizationName">Organization name</Label>
            <Input id="organizationName" placeholder="Rizq Foundation" {...register("organizationName")} />
            <FieldError message={errors.organizationName?.message} />
          </div>
          <div>
            <Label htmlFor="registrationNo">Registration no.</Label>
            <Input id="registrationNo" placeholder="NGO-2024-0000" {...register("registrationNo")} />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" placeholder="Street, area" {...register("address")} />
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
          <MapPin size={12} /> Pin your location (tap the map)
        </Label>
        <Controller
          control={control}
          name="latitude"
          render={() => (
            <MapPicker
              value={
                watch("latitude") != null && watch("longitude") != null
                  ? { lat: watch("latitude"), lng: watch("longitude") }
                  : null
              }
              onChange={({ lat, lng }) => {
                setValue("latitude", lat, { shouldValidate: true });
                setValue("longitude", lng, { shouldValidate: true });
              }}
            />
          )}
        />
        <FieldError
          message={
            errors.latitude || errors.longitude
              ? "Tap the map to set your location"
              : undefined
          }
        />
      </div>

      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Create account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-500 hover:text-amber-400">
          Log in
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell wide title="Join ShareBite" subtitle="A minute of signup, a lifetime of shared meals.">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
