import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="section-glow flex min-h-screen items-center justify-center px-6 py-16">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-semibold tracking-tight focus-visible:text-amber-500 focus-visible:outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted">🍽</span>
          ShareBite
        </Link>
        <div className="glass rounded-xl p-8 shadow-elev-lg">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
