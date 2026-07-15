"use client";

// Incoming requests on the donor's listings: accept, reject, message,
// and complete pickup by verifying the recipient's code.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { api, ApiError } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner, EmptyState } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { MessageSquare, KeyRound } from "lucide-react";

interface Req {
  id: string;
  status: string;
  message: string | null;
  pickupCode: string | null;
  createdAt: string;
  donation: { id: string; title: string; status: string };
  requester: { id: string; fullName: string; avatarUrl: string | null; city: string };
}

export default function DonorRequestsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [completing, setCompleting] = useState<Req | null>(null);
  const [code, setCode] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["donor-requests"],
    queryFn: () => api<{ requests: Req[] }>("/api/requests?role=donor"),
    refetchInterval: 20_000,
  });

  const act = useMutation({
    mutationFn: ({ id, action, code }: { id: string; action: string; code?: string }) =>
      api(`/api/requests/${id}`, { method: "PATCH", json: { action, code } }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["donor-requests"] });
      qc.invalidateQueries({ queryKey: ["my-donations"] });
      if (vars.action === "accept") toast("Request accepted — pickup code generated.");
      if (vars.action === "reject") toast("Request declined.");
      if (vars.action === "complete") {
        toast("Pickup completed. Thank you for sharing! 🎉");
        setCompleting(null);
        setCode("");
      }
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Action failed", "error"),
  });

  async function messageRequester(userId: string) {
    const res = await api<{ conversationId: string }>("/api/messages", {
      method: "POST",
      json: { recipientId: userId, body: "Hi! About your food request…" },
    });
    router.push(`/dashboard/messages?c=${res.conversationId}`);
  }

  const requests = data?.requests ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Pickup requests</h1>

      {isLoading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          hint="When someone requests your food, it shows up here for you to accept."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="glass rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={r.requester.fullName} src={r.requester.avatarUrl} size={40} />
                  <div>
                    <p className="font-medium">
                      {r.requester.fullName}
                      <span className="ml-2 text-xs text-muted-foreground">{r.requester.city}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      wants{" "}
                      <Link href={`/dashboard/donations/${r.donation.id}`} className="text-amber-400 hover:text-amber-300">
                        {r.donation.title}
                      </Link>
                    </p>
                    {r.message && (
                      <p className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">
                        &ldquo;{r.message}&rdquo;
                      </p>
                    )}
                    <p className="mt-1 font-mono text-[10px] text-zinc-600">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {r.status === "PENDING" && (
                  <>
                    <Button size="sm" onClick={() => act.mutate({ id: r.id, action: "accept" })} loading={act.isPending}>
                      Accept
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => act.mutate({ id: r.id, action: "reject" })}>
                      Reject
                    </Button>
                  </>
                )}
                {r.status === "ACCEPTED" && (
                  <Button size="sm" onClick={() => setCompleting(r)}>
                    <KeyRound size={15} strokeWidth={1.5} /> Verify pickup code
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => messageRequester(r.requester.id)}>
                  <MessageSquare size={15} strokeWidth={1.5} /> Message
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!completing}
        onClose={() => setCompleting(null)}
        title="Complete pickup"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Ask {completing?.requester.fullName} for their 6-digit pickup code (or scan
          their QR) and enter it below to confirm the handover.
        </p>
        <Label htmlFor="code">Pickup code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          className="text-center font-mono text-xl tracking-[0.5em]"
        />
        <Button
          className="mt-4 w-full"
          disabled={code.length !== 6}
          loading={act.isPending}
          onClick={() =>
            completing && act.mutate({ id: completing.id, action: "complete", code })
          }
        >
          Confirm handover
        </Button>
      </Dialog>
    </div>
  );
}
