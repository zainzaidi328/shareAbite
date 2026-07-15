"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is ShareBite free to use?",
    a: "Completely free — for donors, recipients and NGOs. ShareBite exists to keep good food out of landfills and on someone's plate.",
  },
  {
    q: "How do I know the food is safe?",
    a: "Donors list cooked time and expiry for every item, and the community rating system keeps everyone accountable. Always check the listing details and use your judgement, just as you would with food from a neighbour.",
  },
  {
    q: "How does pickup verification work?",
    a: "When a donor accepts your request, you receive a unique 6-digit pickup code (also shown as a QR code). The donor confirms the code at handover, which marks the donation complete for both sides.",
  },
  {
    q: "Can restaurants or bakeries join?",
    a: "Yes! Businesses register as donors and can post surplus in bulk. Verified NGOs can claim large donations and coordinate volunteer pickups.",
  },
  {
    q: "What areas does ShareBite cover?",
    a: "ShareBite works anywhere — listings are location-based, so you always see what's closest to you on the map.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {FAQS.map((f, i) => (
        <div key={i} className="glass glass-hover rounded-lg">
          <button
            className="flex w-full items-center justify-between px-6 py-4 text-left focus-visible:text-amber-500 focus-visible:outline-none"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span className="font-display text-sm font-medium md:text-base">
              {f.q}
            </span>
            <ChevronDown
              size={18}
              strokeWidth={1.5}
              className={cn(
                "shrink-0 text-zinc-400 transition-transform duration-300",
                open === i && "rotate-180 text-amber-500"
              )}
            />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              open === i ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
