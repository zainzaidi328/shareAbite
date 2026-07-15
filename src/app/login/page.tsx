"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { api, ApiError } from "@/lib/fetcher";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setServerError("");
    try {
      await api("/api/auth/login", { method: "POST", json: data });
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Login failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-amber-500/80 transition-colors hover:text-amber-400">
            Forgot password?
          </Link>
        </div>
        <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Log in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New to ShareBite?{" "}
        <Link href="/register" className="text-amber-500 hover:text-amber-400">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to keep sharing.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
