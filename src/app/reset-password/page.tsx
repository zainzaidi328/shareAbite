"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validations";
import { api, ApiError } from "@/lib/fetcher";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

type Input_ = z.infer<typeof resetPasswordSchema>;

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input_>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError("");
    try {
      await api("/api/auth/reset-password", { method: "POST", json: data });
      toast("Password updated. Log in with your new password.");
      router.push("/login");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Reset failed");
    }
  });

  if (!token)
    return (
      <p className="text-sm text-muted-foreground">
        This reset link is missing its token.{" "}
        <Link href="/forgot-password" className="text-amber-500">
          Request a new one
        </Link>
        .
      </p>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" {...register("token")} />
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" placeholder="8+ characters" {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
        <FieldError message={errors.confirmPassword?.message} />
      </div>
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Update password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Make it strong and memorable.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
