import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Radicar PQRS" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/areas", label: "Áreas de gestión" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-brand text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground font-display text-lg font-extrabold text-primary">F</div>
            <div className="leading-tight">
              <div className="font-display text-xl font-extrabold tracking-tight">fecoomeva</div>
              <div className="text-xs opacity-80">Gestión inteligente de PQRS</div>
            </div>
          </Link>
          <nav className="flex gap-1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-4 py-2 text-sm font-semibold opacity-85 transition hover:bg-primary-foreground/15 hover:opacity-100"
                activeProps={{ className: "bg-primary-foreground text-primary-deep opacity-100" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">Fecoomeva · Uso interno · Área de Servicio</footer>
    </div>
  );
}

export function Stat({ label, value, tone = "primary" }: { label: string; value: ReactNode; tone?: "primary" | "destructive" | "info" | "warning" }) {
  const tones = { primary: "border-l-primary", destructive: "border-l-destructive", info: "border-l-info", warning: "border-l-warning" };
  return (
    <div className={`rounded-xl border border-l-4 bg-card p-4 ${tones[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
