import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { LayoutDashboard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/railverse/shell";
import { useAuth } from "@/lib/railverse/auth";
import type { Role } from "@/lib/railverse/auth";

type LoginSearch = { mode: "login" | "signup" };

export const Route = createFileRoute("/login/$role")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    mode: search['mode'] === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Sign In — RailVerse" },
      {
        name: "description",
        content:
          "Sign in or create a RailVerse account as a passenger or admin to reach your reservation console.",
      },
      { property: "og:title", content: "Sign In — RailVerse" },
      {
        property: "og:description",
        content: "Access your RailVerse passenger or admin console.",
      },
    ],
  }),
  component: AuthForm,
});

function AuthForm() {
  const { role: rawRole } = Route.useParams();
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const role: Role = rawRole === "admin" ? "admin" : "passenger";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const Icon = role === "admin" ? LayoutDashboard : UserRound;
  const title = role === "admin" ? "Admin" : "Passenger";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    const result =
      mode === "signup"
        ? signup(name, email, password, role)
        : login(email, password, role);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    navigate({ to: role === "admin" ? "/admin" : "/passenger" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <BrandMark />
          <div className="ml-auto">
            <Button asChild variant="ghost">
              <Link to="/auth" search={{ mode }}>
                Change role
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-md px-4 py-16 sm:px-6"
      >
        <div className="glass-panel rounded-2xl p-7">
          <span className="teal-gradient inline-flex size-11 items-center justify-center rounded-xl text-navy-deep">
            <Icon className="size-5" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">
            {mode === "signup" ? `${title} sign up` : `${title} login`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? `Create your ${title.toLowerCase()} account to continue.`
              : `Sign in to open the ${title.toLowerCase()} console.`}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Asha Menon"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              {mode === "signup" ? "Create account" : "Login"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already registered?" : "New to RailVerse?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-medium text-teal-deep hover:underline"
            >
              {mode === "signup" ? "Login instead" : "Create an account"}
            </button>
          </p>
        </div>
      </motion.main>
    </div>
  );
}
