"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/fetcher";
import { AuthShell } from "@/components/auth/auth-shell";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyInner() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    api("/api/auth/verify-email", { method: "POST", json: { token } })
      .then(() => setState("ok"))
      .catch((e) => {
        setState("error");
        setMessage(e instanceof ApiError ? e.message : "Verification failed");
      });
  }, [token]);

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      {state === "loading" && (
        <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-amber-500" />
      )}
      {state === "ok" && (
        <>
          <CheckCircle2 size={32} strokeWidth={1.5} className="text-emerald-400" />
          <p className="text-sm text-muted-foreground">
            Your email is verified. Welcome aboard!
          </p>
          <Link href="/dashboard" className="text-sm text-amber-500 hover:text-amber-400">
            Go to your dashboard →
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <XCircle size={32} strokeWidth={1.5} className="text-red-400" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Email verification" subtitle="One click to confirm it's really you.">
      <Suspense>
        <VerifyInner />
      </Suspense>
    </AuthShell>
  );
}
