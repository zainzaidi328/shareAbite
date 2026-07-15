import { cn } from "@/lib/utils";

type Tone = "amber" | "neutral" | "green" | "red" | "blue";

const tones: Record<Tone, string> = {
  amber: "bg-accent-muted text-amber-400 border-amber-500/20",
  neutral: "bg-white/5 text-zinc-300 border-white/10",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  blue: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "ACTIVE":
    case "ACCEPTED":
    case "COMPLETED":
      return status === "COMPLETED" ? "blue" : "green";
    case "PENDING":
    case "RESERVED":
      return "amber";
    case "REJECTED":
    case "EXPIRED":
    case "CANCELLED":
    case "REMOVED":
      return "red";
    default:
      return "neutral";
  }
}
