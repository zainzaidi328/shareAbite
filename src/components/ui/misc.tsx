import { cn } from "@/lib/utils";
import { Loader2, PackageOpen } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-12", className)}>
      <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-amber-500" />
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-lg px-6 py-16 text-center">
      <PackageOpen size={32} strokeWidth={1} className="text-zinc-600" />
      <p className="font-display text-base font-medium">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass glass-hover rounded-lg p-5",
        accent && "border-amber-500/20 shadow-glow-sm"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}
