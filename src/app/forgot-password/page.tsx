"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validations";
import { api } from "@/lib/fetcher";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { MailCheck } from "lucide-react";

type Input_ = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input_>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (data) => {
    await api("/api/auth/forgot-password", { method: "POST", json: data });
    setSent(true);
  });

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link.">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <MailCheck size={32} strokeWidth={1.5} className="text-amber-500" />
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, a reset link is on its way.
            <br />
            (In local dev, the link is printed in the server console.)
          </p>
          <Link href="/login" className="text-sm text-amber-500 hover:text-amber-400">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Send reset link
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="text-amber-500 hover:text-amber-400">
              Log in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
