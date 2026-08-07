import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  ShieldCheck,
  Ticket,
  TrainFront,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/railverse/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RailVerse — Modern Railway Reservation Platform" },
      {
        name: "description",
        content:
          "Book confirmed berths, manage RAC and waitlist queues, and run a full admin console with RailVerse, a modern Indian Railways reservation suite.",
      },
      { property: "og:title", content: "RailVerse — Modern Railway Reservation Platform" },
      {
        property: "og:description",
        content:
          "Seat allocation, berth preferences, RAC and waitlist promotion, and live admin controls in one polished platform.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Ticket,
    title: "Instant seat allocation",
    body: "Berth preferences honoured automatically — Lower, Middle or Upper — the moment a booking is confirmed.",
  },
  {
    icon: ListOrdered,
    title: "RAC & waitlist queues",
    body: "Every passenger beyond capacity enters an ordered RAC or waitlist queue with a live position.",
  },
  {
    icon: Gauge,
    title: "Automatic promotion",
    body: "Cancel a ticket and RAC moves to confirmed, waitlist moves to RAC — instantly, across every console.",
  },
  {
    icon: ShieldCheck,
    title: "PNR & booking IDs",
    body: "Each reservation carries a unique booking ID and PNR, persisted between sessions.",
  },
];

const steps = [
  { n: "01", title: "Search a train", body: "Filter the network by train name, number or station." },
  { n: "02", title: "Enter passenger details", body: "Name, age, gender and berth preference in one modal." },
  { n: "03", title: "Get your allocation", body: "Confirmed seat, RAC slot or waitlist position with a PNR." },
];

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const total = 42;
    const id = setInterval(() => {
      frame++;
      setValue(Math.round(to * (1 - Math.pow(1 - frame / total, 3))));
      if (frame >= total) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <BrandMark />
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth" search={{ mode: "login" }}>
                Login
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Sign Up
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden text-primary-foreground">
        <motion.div
          aria-hidden
          className="absolute -top-24 -right-20 size-[26rem] rounded-full bg-teal/25 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="glass-dark inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase">
              Indian Railways · Seat & Queue Suite
            </span>
            <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold sm:text-6xl">
              Reservations that move
              <span className="block bg-gradient-to-r from-teal to-white bg-clip-text text-transparent">
                as fast as the train
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-primary-foreground/75 sm:text-lg">
              RailVerse handles confirmed berths, RAC slots and waitlists with automatic
              promotion on every cancellation — with a full admin console behind it.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="teal-gradient border-0 text-navy-deep hover:opacity-90">
                <Link to="/auth" search={{ mode: "login" }}>
                  Login <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  <LayoutDashboard className="mr-1 size-4" /> Sign Up
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass-dark relative rounded-3xl p-6"
          >
            <div className="flex items-center justify-between text-xs tracking-widest uppercase opacity-70">
              <span>Live coach map</span>
              <span>S4</span>
            </div>
            <div className="mt-5 grid grid-cols-6 gap-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.02 }}
                  className={`h-9 rounded-lg ${
                    i % 5 === 0
                      ? "bg-amber-300/70"
                      : i % 7 === 0
                        ? "bg-rose-400/60"
                        : "bg-teal/60"
                  }`}
                />
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <motion.span
                animate={{ x: [0, 220, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="text-teal"
              >
                <TrainFront className="size-6" />
              </motion.span>
            </div>
            <div className="rail-track h-1 w-full rounded-full opacity-70" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {[
          { label: "Berths mapped", value: 12480 },
          { label: "Queue promotions", value: 3260 },
          { label: "Routes covered", value: 148 },
          { label: "Uptime", value: 99, suffix: "%" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="glass-panel rounded-2xl px-6 py-6"
          >
            <p className="font-display text-4xl font-bold text-navy">
              <Counter to={s.value} suffix={s.suffix ?? ""} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-3xl font-bold sm:text-4xl">Built for the whole journey</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every rule of an Indian Railways reservation chart, modelled end to end.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass-panel rounded-2xl p-6"
            >
              <span className="teal-gradient inline-flex size-11 items-center justify-center rounded-xl text-navy-deep">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-display text-sm font-bold tracking-[0.2em] text-teal-deep">
                {s.n}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="hero-gradient overflow-hidden rounded-3xl px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to board?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/75">
            Open the passenger console to book, or head to admin to shape the network.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="teal-gradient border-0 text-navy-deep hover:opacity-90">
              <Link to="/auth" search={{ mode: "login" }}>
                Login
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Sign Up
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        RailVerse · Seat, RAC & waitlist reservation suite
      </footer>
    </div>
  );
}
