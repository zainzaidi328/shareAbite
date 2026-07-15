"use client";

// Messages — conversation list + thread. Near-real-time via 5s polling
// (Vercel-friendly; swap for Socket.io/Pusher when self-hosting).

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { Send, CheckCheck, Check } from "lucide-react";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

interface Conversation {
  id: string;
  other: { id: string; fullName: string; avatarUrl: string | null; role: string };
  messages: { body: string; createdAt: string }[];
  unread: number;
  updatedAt: string;
}

interface Message {
  id: string;
  senderId: string;
  body: string;
  imageUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

function MessagesInner() {
  const { data: me } = useMe();
  const router = useRouter();
  const activeId = useSearchParams().get("c");
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: convData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api<{ conversations: Conversation[] }>("/api/conversations"),
    refetchInterval: 10_000,
  });

  const { data: thread } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () =>
      api<{ conversation: { other: Conversation["other"] }; messages: Message[] }>(
        `/api/conversations/${activeId}/messages`
      ),
    enabled: !!activeId,
    refetchInterval: 5_000,
  });

  const send = useMutation({
    mutationFn: () =>
      api("/api/messages", {
        method: "POST",
        json: { conversationId: activeId, body: draft },
      }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  const conversations = convData?.conversations ?? [];

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl gap-4">
      {/* Conversation list */}
      <aside
        className={cn(
          "glass w-full shrink-0 overflow-y-auto rounded-xl md:w-80",
          activeId && "hidden md:block"
        )}
      >
        <p className="px-5 pb-2 pt-5 font-display text-lg font-semibold tracking-tight">
          Messages
        </p>
        {conversations.length === 0 && (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No conversations yet. Message a donor from any listing.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/dashboard/messages?c=${c.id}`)}
            className={cn(
              "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/5",
              activeId === c.id && "bg-accent-muted/40"
            )}
          >
            <Avatar name={c.other.fullName} src={c.other.avatarUrl} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium">{c.other.fullName}</p>
                <span className="font-mono text-[10px] text-zinc-600">
                  {formatDistanceToNow(new Date(c.updatedAt))}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {c.messages[0]?.body ?? "Say salam 👋"}
              </p>
            </div>
            {c.unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-accent-foreground">
                {c.unread}
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* Thread */}
      <section className={cn("glass flex flex-1 flex-col rounded-xl", !activeId && "hidden md:flex")}>
        {!activeId ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState title="Select a conversation" hint="Pick a chat from the left to start messaging." />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
              <button className="text-sm text-amber-500 md:hidden" onClick={() => router.push("/dashboard/messages")}>
                ←
              </button>
              {thread && (
                <>
                  <Avatar name={thread.conversation.other.fullName} src={thread.conversation.other.avatarUrl} size={36} />
                  <div>
                    <p className="text-sm font-medium">{thread.conversation.other.fullName}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {thread.conversation.other.role}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {(thread?.messages ?? []).map((m) => {
                const mine = m.senderId === me?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-xl px-4 py-2.5 text-sm",
                        mine
                          ? "rounded-br-sm bg-accent text-accent-foreground"
                          : "rounded-bl-sm bg-white/[0.06] text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={cn(
                          "mt-1 flex items-center justify-end gap-1 font-mono text-[10px]",
                          mine ? "text-black/50" : "text-zinc-500"
                        )}
                      >
                        {format(new Date(m.createdAt), "h:mm a")}
                        {mine &&
                          (m.readAt ? (
                            <CheckCheck size={12} strokeWidth={2} />
                          ) : (
                            <Check size={12} strokeWidth={2} />
                          ))}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              className="flex items-center gap-2 border-t border-line p-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) send.mutate();
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                className="flex-1"
                aria-label="Message"
              />
              <Button type="submit" size="icon" loading={send.isPending} aria-label="Send">
                <Send size={16} strokeWidth={1.5} />
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
