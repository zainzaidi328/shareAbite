"use client";

// Minimal toast system (no external dependency).
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  kind: "success" | "error";
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, kind?: Toast["kind"]) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, kind = "success") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      4500
    );
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, kind: Toast["kind"] = "success") {
  useToastStore.getState().push(message, kind);
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto glass flex max-w-sm items-center gap-3 rounded-lg px-4 py-3 shadow-elev-lg"
          >
            {t.kind === "success" ? (
              <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-amber-500" />
            ) : (
              <AlertCircle size={18} strokeWidth={1.5} className="shrink-0 text-red-400" />
            )}
            <p className="text-sm text-foreground">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
