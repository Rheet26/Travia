import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, LayoutDashboard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/railverse/shell";

type AuthSearch = { mode: "login" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search['mode'] === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Choose Your Role — RailVerse" },
      {
        name: "description",
        content:
          "Continue as a passenger to book berths and track RAC or waitlist status, or as an admin to manage the RailVerse network.",
      },
      { property: "og:title", content: "Choose Your Role — RailVerse" },
      {
        property: "og:description",
        content: "Select a passenger or admin role to continue into RailVerse.",
      },
    ],
  }),
  component: RoleSelection,
});

const roles = [
  {
    id: "passenger" as const,
    icon: UserRound,
    title: "Passenger",
    body: "Search trains, book confirmed berths and follow your RAC or waitlist position.",
  },
  {
    id: "admin" as const,
    icon: LayoutDashboard,
    title: "Admin",
    body: "Add and edit trains, tune seat, RAC and waitlist capacity, and monitor bookings.",
  },
];

function RoleSelection() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const label = mode === "signup" ? "Sign Up" : "Login";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <BrandMark />
          <div className="ml-auto">
            <Button asChild variant="ghost">
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-4xl px-4 py-16 sm:px-6"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Step 1 · {label}
        </span>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Select your role</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Choose how you want to continue. You can switch anytime by signing out.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {roles.map((r, i) => (
            <motion.button
              key={r.id}
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              onClick={() =>
                navigate({ to: "/login/$role", params: { role: r.id }, search: { mode } })
              }
              className="glass-panel rounded-2xl p-6 text-left transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              <span className="teal-gradient inline-flex size-11 items-center justify-center rounded-xl text-navy-deep">
                <r.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{r.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-deep">
                Continue to {label} <ArrowRight className="size-4" />
              </span>
            </motion.button>
          ))}
        </div>
      </motion.main>
    </div>
  );
}
