import Link from "next/link";
import {
  UserPlus,
  UtensilsCrossed,
  HandHeart,
  PackageCheck,
  ArrowRight,
  Quote,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MEALS_PER_SERVING } from "@/lib/constants";
import { Faq } from "@/components/landing/faq";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getStats() {
  const [completed, donors, ngos, cities] = await Promise.all([
    prisma.foodDonation.aggregate({
      where: { status: "COMPLETED" },
      _sum: { quantity: true },
    }),
    prisma.user.count({ where: { role: "DONOR", isActive: true } }),
    prisma.ngoProfile.count({ where: { approved: true } }),
    prisma.user.findMany({ select: { city: true }, distinct: ["city"] }),
  ]);
  return {
    meals: (completed._sum.quantity ?? 0) * MEALS_PER_SERVING,
    donors,
    ngos,
    cities: cities.length,
  };
}

const STEPS = [
  { icon: UserPlus, title: "Create Account", body: "Sign up as a donor, recipient or NGO in under a minute." },
  { icon: UtensilsCrossed, title: "Post Food", body: "List surplus food with photos, quantity, expiry and pickup window." },
  { icon: HandHeart, title: "Someone Requests", body: "Nearby recipients see your listing on the map and send a request." },
  { icon: PackageCheck, title: "Pickup Completed", body: "Confirm the pickup code at handover. Another meal saved." },
];

const TESTIMONIALS = [
  {
    quote: "Our restaurant used to throw away trays of food every night. Now it feeds thirty people before we close.",
    name: "Spice Route Restaurant",
    role: "Donor · Lahore",
  },
  {
    quote: "ShareBite helped me feed my family during the hardest month of my life. The donors are angels.",
    name: "Sana M.",
    role: "Recipient",
  },
  {
    quote: "The map and pickup codes make food rescue logistics actually manageable for our volunteers.",
    name: "Rizq Foundation",
    role: "NGO Partner",
  },
];

export default async function LandingPage() {
  const stats = await getStats();

  return (
    <main className="relative">
      {/* ── Nav ── */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-base">🍽</span>
            ShareBite
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#how" className="transition-colors hover:text-foreground focus-visible:text-amber-500 focus-visible:outline-none">How it works</a>
            <a href="#stories" className="transition-colors hover:text-foreground focus-visible:text-amber-500 focus-visible:outline-none">Stories</a>
            <a href="#faq" className="transition-colors hover:text-foreground focus-visible:text-amber-500 focus-visible:outline-none">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="section-glow relative px-6 pb-24 pt-40 md:px-8 md:pb-32 md:pt-48 lg:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-accent-muted px-4 py-1.5 shadow-glow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span className="font-mono text-xs tracking-wide text-amber-400">
              {stats.meals.toLocaleString()}+ meals shared and counting
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Reduce Food Waste.
            <br />
            <span className="text-amber-500">Feed Someone Today.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            ShareBite connects surplus food from homes, restaurants and bakeries
            with people and organizations who need it — before it goes to waste.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register?role=DONOR">
              <Button size="lg">
                Donate Food <ArrowRight size={16} strokeWidth={1.5} />
              </Button>
            </Link>
            <Link href="/register?role=RECIPIENT">
              <Button variant="outline" size="lg">Find Food</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 md:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { label: "Meals Shared", value: stats.meals },
            { label: "Active Donors", value: stats.donors },
            { label: "NGO Partners", value: stats.ngos },
            { label: "Cities Covered", value: stats.cities },
          ].map((s) => (
            <div key={s.label} className="glass glass-hover rounded-lg p-6 text-center">
              <p className="font-display text-3xl font-bold tracking-tight text-amber-500 md:text-4xl">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="px-6 py-24 md:px-8 md:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-mono text-xs uppercase tracking-wide text-amber-500">
            How it works
          </p>
          <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight md:text-4xl">
            From surplus to someone&apos;s plate
          </h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="glass glass-hover relative rounded-lg p-6">
                <span className="absolute right-5 top-4 font-mono text-xs text-zinc-600">
                  0{i + 1}
                </span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-muted">
                  <step.icon size={20} strokeWidth={1.5} className="text-amber-500" />
                </div>
                <h3 className="font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="stories" className="section-glow px-6 pb-24 md:px-8 md:pb-32 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-mono text-xs uppercase tracking-wide text-amber-500">
            Stories
          </p>
          <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight md:text-4xl">
            Real people, real meals
          </h2>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="glass glass-hover relative rounded-lg p-6">
                <div className="absolute left-0 top-6 h-10 w-0.5 bg-amber-500 shadow-glow-sm" />
                <Quote size={18} strokeWidth={1.5} className="mb-4 text-amber-500/60" />
                <blockquote className="text-sm leading-relaxed text-zinc-300">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4">
                  <p className="font-display text-sm font-semibold">{t.name}</p>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t.role}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 pb-24 md:px-8 md:pb-32 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-mono text-xs uppercase tracking-wide text-amber-500">FAQ</p>
          <h2 className="mb-16 mt-3 text-center font-display text-3xl font-bold tracking-tight md:text-4xl">
            Questions, answered
          </h2>
          <Faq />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-24 md:px-8 md:pb-32 lg:px-12">
        <div className="glass mx-auto max-w-4xl rounded-2xl border-amber-500/20 p-10 text-center shadow-border-glow md:p-16">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Tonight, your surplus could be
            <br />
            <span className="text-amber-500">someone&apos;s dinner.</span>
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg">
                Join ShareBite <ArrowRight size={16} strokeWidth={1.5} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line px-6 py-12 md:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 font-display font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted text-sm">🍽</span>
            ShareBite
          </div>
          <p className="text-sm text-muted-foreground">
            Reduce food waste. Feed someone today.
          </p>
          <p className="font-mono text-xs text-zinc-600">
            © {new Date().getFullYear()} ShareBite
          </p>
        </div>
      </footer>
    </main>
  );
}
