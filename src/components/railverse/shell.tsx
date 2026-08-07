import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { LogOut, TrainFront } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/railverse/auth";

function AccountNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <nav className="ml-auto flex items-center gap-2 rounded-full bg-muted p-1 pl-4 text-sm font-medium">
      <span className="hidden text-muted-foreground sm:inline">
        {user.name} · <span className="capitalize">{user.role}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          logout();
          navigate({ to: "/", replace: true });
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-1.5 text-foreground shadow-sm transition-colors hover:bg-card/80"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </nav>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="teal-gradient flex size-10 items-center justify-center rounded-xl text-navy-deep shadow-[var(--shadow-glow)]">
        <TrainFront className="size-5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-lg font-bold">RailVerse</span>
          <span className="block text-[0.65rem] tracking-[0.22em] text-muted-foreground uppercase">
            Reservation Suite
          </span>
        </span>
      )}
    </Link>
  );
}

export function ConsoleShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <BrandMark />
          <AccountNav />
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {actions}
        </div>
        {children}
      </motion.main>
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "teal" | "amber" | "rose";
  delay?: number;
}) {
  const toneClass =
    tone === "teal"
      ? "text-teal-deep"
      : tone === "amber"
        ? "text-amber-600"
        : tone === "rose"
          ? "text-rose-600"
          : "text-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass-panel rounded-2xl px-5 py-4"
    >
      <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl font-bold ${toneClass}`}>{value}</p>
    </motion.div>
  );
}
