import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { LogOut, TrainFront, Compass, Ticket, Map, User, ShieldCheck, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/railverse/auth";
import { AnimatedTrainBackdrop } from "@/components/railverse/animated-train-backdrop";
import { SideNavDrawer } from "@/components/railverse/side-nav-drawer";
import { ThemeToggle } from "@/components/railverse/theme-toggle";

function AccountNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return <ThemeToggle />;

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#4cd7f6]/20 bg-card/80 dark:bg-[#171c1f]/80 backdrop-blur-md">
        <div className="w-7 h-7 rounded-full bg-[#4cd7f6]/20 text-[#4cd7f6] flex items-center justify-center font-bold text-xs">
          {user.name && user.name[0] ? user.name[0].toUpperCase() : "U"}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-foreground dark:text-[#dfe3e7] leading-tight">{user.name}</p>
          <p className="text-[10px] font-mono uppercase text-[#4cd7f6] tracking-wider">
            {user.role}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          logout();
          navigate({ to: "/", replace: true });
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-500 dark:text-rose-300 hover:bg-rose-500/20 transition-all active:scale-95"
      >
        <LogOut className="size-3.5" /> Sign out
      </button>
    </div>
  );
}

export function BrandMark({
  compact = false,
  brandName = "TRAVIA",
}: {
  compact?: boolean;
  brandName?: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        className="flex items-center gap-2.5 group cursor-pointer select-none"
        title="Click to open Navigation Panel"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4cd7f6] to-[#03b5d3] text-[#0f1417] flex items-center justify-center shadow-[0_0_15px_rgba(76,215,246,0.4)] group-hover:scale-105 transition-transform relative">
          <TrainFront className="size-5 font-bold" />
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-background dark:bg-[#0f1417] border border-[#4cd7f6] text-[#4cd7f6] flex items-center justify-center">
            <Menu className="size-2.5" />
          </span>
        </div>
        {!compact && (
          <div className="flex flex-col text-left">
            <span className="font-display text-xl font-extrabold tracking-tighter text-[#4cd7f6] drop-shadow-[0_0_10px_rgba(76,215,246,0.3)] group-hover:text-primary dark:group-hover:text-white transition-colors">
              {brandName}
            </span>
            <span className="text-[9px] font-mono font-semibold tracking-[0.2em] text-muted-foreground dark:text-[#909097] uppercase -mt-1 group-hover:text-[#4cd7f6] transition-colors">
              PREMIUM RAIL
            </span>
          </div>
        )}
      </div>

      <SideNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
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
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen bg-background dark:bg-[#0f1417] text-foreground dark:text-[#dfe3e7] font-sans pb-24 md:pb-12 overflow-x-hidden transition-colors duration-200">
      <AnimatedTrainBackdrop />
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 bg-background/85 dark:bg-[#0f1417]/85 backdrop-blur-xl border-b border-border/40 dark:border-[#4cd7f6]/20 px-4 md:px-8 h-20 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-8">
          <BrandMark />
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-[#909097] hover:text-[#4cd7f6] transition-colors"
            >
              Explore
            </Link>
            <Link
              to="/passenger"
              className="font-mono text-xs font-bold uppercase tracking-wider text-[#4cd7f6] border-b-2 border-[#4cd7f6] pb-1"
            >
              Passenger
            </Link>
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-[#909097] hover:text-[#4cd7f6] transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <AccountNav />
        </div>
      </header>

      {/* Main Content Area */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#909097]/15 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4cd7f6]/30 bg-[#4cd7f6]/10 px-3 py-1 text-[11px] font-mono font-bold tracking-widest text-[#4cd7f6] uppercase mb-2">
              <ShieldCheck className="size-3.5" /> Live System Active
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-foreground dark:text-white">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground dark:text-[#909097] font-medium">{subtitle}</p>
          </div>
          {actions}
        </div>
        {children}
      </motion.main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-card/95 dark:bg-[#1b2023]/95 backdrop-blur-xl border-t border-border/40 dark:border-[#4cd7f6]/20 shadow-[0px_-8px_24px_rgba(3,181,211,0.15)] flex justify-around items-center h-20 px-4 pb-2">
        <Link
          to="/"
          className="flex flex-col items-center justify-center text-[#909097] hover:text-[#4cd7f6] transition-colors"
        >
          <Compass className="size-5" />
          <span className="font-mono text-[10px] font-bold uppercase mt-1">Explore</span>
        </Link>
        <Link
          to="/passenger"
          className="flex flex-col items-center justify-center text-[#4cd7f6] bg-[#4cd7f6]/15 rounded-xl px-4 py-1.5"
        >
          <Ticket className="size-5" />
          <span className="font-mono text-[10px] font-bold uppercase mt-0.5">Tickets</span>
        </Link>
        {user?.role === "admin" ? (
          <Link
            to="/admin"
            className="flex flex-col items-center justify-center text-[#909097] hover:text-[#4cd7f6] transition-colors"
          >
            <User className="size-5" />
            <span className="font-mono text-[10px] font-bold uppercase mt-1">Admin</span>
          </Link>
        ) : (
          <Link
            to="/auth"
            search={{ mode: "login" }}
            className="flex flex-col items-center justify-center text-[#909097] hover:text-[#4cd7f6] transition-colors"
          >
            <User className="size-5" />
            <span className="font-mono text-[10px] font-bold uppercase mt-1">Account</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
  delay = 0,
  onClick,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "teal" | "amber" | "rose";
  delay?: number;
  onClick?: () => void;
}) {
  const toneClass =
    tone === "teal"
      ? "text-[#0284c7] dark:text-[#4cd7f6]"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "rose"
          ? "text-rose-600 dark:text-rose-400"
          : "text-slate-900 dark:text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={onClick}
      className={`glass-card border-l-2 border-[#0284c7] dark:border-[#4cd7f6] rounded-xl p-5 glow-card ${
        onClick
          ? "cursor-pointer hover:border-[#0284c7] dark:hover:border-[#4cd7f6] hover:scale-[1.02] active:scale-[0.98] transition-all"
          : ""
      }`}
    >
      <span className="font-mono text-[11px] font-bold tracking-widest text-slate-700 dark:text-[#909097] uppercase flex items-center justify-between">
        <span>{label}</span>
        {onClick && (
          <span className="text-[10px] text-[#0284c7] dark:text-[#4cd7f6] hover:underline font-mono">View →</span>
        )}
      </span>
      <p className={`mt-1.5 font-display text-3xl font-extrabold tracking-tight ${toneClass}`}>
        {value}
      </p>
    </motion.div>
  );
}
