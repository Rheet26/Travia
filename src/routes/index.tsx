import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import {
  ArrowRight,
  Gauge,
  ListOrdered,
  ShieldCheck,
  Ticket,
  Search,
  MapPin,
  Calendar,
  Compass,
  CheckCircle2,
  LayoutDashboard,
  Navigation,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/railverse/shell";
import { KAGGLE_TRAIN_DATASET } from "@/lib/railverse/dataset";
import { AnimatedTrainBackdrop } from "@/components/railverse/animated-train-backdrop";
import { FloatingDestinationLabels } from "@/components/railverse/floating-destination-labels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Travia — High-Speed Railway Reservation Suite" },
      {
        name: "description",
        content:
          "Experience the future of railway booking with Travia. Smart berth allocation, live RAC & Waitlist queue tracking, and instant ticket promotion.",
      },
      { property: "og:title", content: "Travia — High-Speed Railway Reservation Suite" },
      {
        property: "og:description",
        content:
          "Sleek, next-generation railway platform with live berth allocation and intelligent queue promotion.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Ticket,
    title: "Smart Berth Priority",
    body: "Lower, Middle, or Upper berth preferences automatically honored with age-prioritized allocation for senior travelers.",
  },
  {
    icon: ListOrdered,
    title: "Live Queue Intelligence",
    body: "Over-capacity bookings are seamlessly assigned live ordered RAC or Waitlist queue positions with instant status visibility.",
  },
  {
    icon: Gauge,
    title: "Instant Network Promotion",
    body: "Upon ticket cancellation, RAC passengers immediately promote to Confirmed and Waitlist advances to RAC across the network.",
  },
  {
    icon: ShieldCheck,
    title: "Dynamic Segment Pricing",
    body: "Select exact boarding and destination stations along any express route with live fare calculation and stop timeline mapping.",
  },
];

const steps = [
  {
    n: "01",
    title: "Select Express Route",
    body: "Explore 30+ premier railway routes and choose your exact boarding and destination stations.",
  },
  {
    n: "02",
    title: "Set Passenger Preferences",
    body: "Add passengers with age, gender, and berth preferences (Lower, Middle, Upper, Side Lower).",
  },
  {
    n: "03",
    title: "Get Instant Pass & PNR",
    body: "Receive instant confirmed berth numbers or track live RAC/Waitlist promotion status on your boarding pass.",
  },
];

function Landing() {
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("Today");

  const popularTrains = KAGGLE_TRAIN_DATASET.slice(0, 4);

  return (
    <div className="relative min-h-screen text-[#dfe3e7] overflow-x-hidden bg-[#0f1417]">
      <AnimatedTrainBackdrop />

      {/* Floating Waypoint Destination Labels across the Hero area */}
      <FloatingDestinationLabels onSelectDestination={(city) => setSearchTo(city)} />

      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 w-full z-50 bg-[#0f1417]/80 backdrop-blur-xl border-b border-[#4cd7f6]/20 px-8 h-20 items-center justify-between shadow-xl">
        <div className="flex items-center gap-8">
          <BrandMark />
        </div>
        <nav className="flex items-center gap-8">
          <a href="#explore" className="font-mono text-xs font-bold uppercase tracking-wider text-[#4cd7f6] border-b-2 border-[#4cd7f6] pb-1">
            Explore
          </a>
          <Link to="/passenger" className="font-mono text-xs font-bold uppercase tracking-wider text-[#909097] hover:text-[#4cd7f6] transition-colors">
            Tickets
          </Link>
          <a href="#routes" className="font-mono text-xs font-bold uppercase tracking-wider text-[#909097] hover:text-[#4cd7f6] transition-colors">
            Express Routes
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="font-bold text-[#dfe3e7] hover:text-[#4cd7f6] hover:bg-[#1b2023]">
            <Link to="/auth" search={{ mode: "login" }}>
              Login
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-[#4cd7f6] text-[#0f1417] font-extrabold hover:bg-[#4cd7f6]/90 rounded-xl px-5 glow-button"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              Sign Up
            </Link>
          </Button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full z-50 bg-[#0f1417]/90 backdrop-blur-xl border-b border-[#4cd7f6]/20 flex justify-between items-center px-4 h-16">
        <BrandMark />
        <Link to="/auth" className="flex items-center">
          <div className="w-8 h-8 rounded-full border border-[#4cd7f6]/30 bg-[#4cd7f6]/10 text-[#4cd7f6] flex items-center justify-center font-bold text-xs">
            U
          </div>
        </Link>
      </header>

      <main className="pb-24 md:pb-16 pt-16 md:pt-20 relative z-10">
        {/* Hero Section */}
        <section className="relative w-full min-h-[60vh] md:min-h-[70vh] flex flex-col items-center justify-center pt-12 pb-8 px-4 md:px-8 text-center">
          {/* Pill Badge */}
          <div className="mb-6">
            <div className="px-4 py-1.5 rounded-full border border-[#4cd7f6]/30 bg-[#171c1f]/80 backdrop-blur-md inline-flex items-center gap-2 shadow-[0_0_15px_rgba(76,215,246,0.15)]">
              <Sparkles className="size-3.5 text-[#4cd7f6]" />
              <span className="font-mono text-xs font-bold text-[#4cd7f6] tracking-widest uppercase">
                NEXT-GEN RAIL RESERVATION NETWORK
              </span>
            </div>
          </div>

          {/* Hero Typography */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl drop-shadow-lg">
            Your Journey.<br />
            <span className="text-[#4cd7f6] drop-shadow-[0_0_25px_rgba(76,215,246,0.4)]">
              Reimagined.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#909097] max-w-2xl mx-auto font-medium leading-relaxed">
            Experience ultra-fast railway booking powered by <strong>Travia</strong>. Automated berth allocation, age-prioritized seat assignment, live RAC/Waitlist promotion, and station timeline intelligence.
          </p>
        </section>

        {/* Search Form (Glass Card Overlay) */}
        <section id="explore" className="px-4 md:px-8 -mt-4 relative z-20">
          <div className="max-w-4xl mx-auto glass-card rounded-2xl p-6 glow-card border border-[#4cd7f6]/25">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#4cd7f6]">
                  Origin Station
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#909097]" />
                  <Input
                    className="w-full bg-[#020617] border border-[#909097]/30 rounded-xl py-3 pl-10 pr-4 text-white font-medium focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6]/50 placeholder:text-[#909097]/50 text-sm"
                    placeholder="e.g. New Delhi, NDLS"
                    value={searchFrom}
                    onChange={(e) => setSearchFrom(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#4cd7f6]">
                  Destination Station
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#909097]" />
                  <Input
                    className="w-full bg-[#020617] border border-[#909097]/30 rounded-xl py-3 pl-10 pr-4 text-white font-medium focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6]/50 placeholder:text-[#909097]/50 text-sm"
                    placeholder="e.g. Mumbai Central, MMCT"
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#4cd7f6]">
                  Journey Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#909097]" />
                  <Input
                    className="w-full bg-[#020617] border border-[#909097]/30 rounded-xl py-3 pl-10 pr-4 text-white font-medium focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6]/50 placeholder:text-[#909097]/50 text-sm"
                    placeholder="Today"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full">
                <Button
                  asChild
                  className="w-full bg-[#4cd7f6] text-[#0f1417] font-extrabold py-3 h-11 rounded-xl glow-button hover:bg-[#4cd7f6]/90 transition-all flex items-center justify-center gap-2"
                >
                  <Link to="/passenger">
                    <span>Find Express Trains</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 md:px-8 py-12 mt-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col justify-center border-l-2 border-[#4cd7f6] pl-4 py-2 glass-card rounded-r-xl p-4">
              <span className="font-display text-4xl font-extrabold text-white">30+</span>
              <span className="font-mono text-xs font-bold text-[#909097] uppercase mt-1">Active Express Routes</span>
            </div>
            <div className="flex flex-col justify-center border-l-2 border-[#4cd7f6] pl-4 py-2 glass-card rounded-r-xl p-4">
              <span className="font-display text-4xl font-extrabold text-white">
                12,000+
              </span>
              <span className="font-mono text-xs font-bold text-[#909097] uppercase mt-1">Confirmed Berths Mapped</span>
            </div>
            <div className="flex flex-col justify-center border-l-2 border-[#4cd7f6] pl-4 py-2 glass-card rounded-r-xl p-4">
              <span className="font-display text-4xl font-extrabold text-white">99.9%</span>
              <span className="font-mono text-xs font-bold text-[#909097] uppercase mt-1">Real-Time Queue Sync</span>
            </div>
          </div>
        </section>

        {/* Featured Express Trains Section */}
        <section id="routes" className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-[#4cd7f6]/20">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#909097]/20 pb-4 mb-6">
              <div>
                <span className="font-mono text-xs font-bold tracking-widest text-[#4cd7f6] uppercase">
                  PREMIER NETWORK
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Popular Express Journeys
                </h2>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl border-[#4cd7f6]/30 text-[#4cd7f6] font-bold bg-[#171c1f] hover:bg-[#4cd7f6]/10">
                <Link to="/passenger">
                  View All Routes <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularTrains.map((train) => (
                <motion.div
                  key={train.trainNumber}
                  whileHover={{ y: -4 }}
                  className="glass-card rounded-xl p-4 border border-[#909097]/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4cd7f6]">
                      <span>{train.trainNumber}</span>
                      <Badge className="bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 text-[10px]">
                        ₹{train.fare}
                      </Badge>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-white line-clamp-1">{train.trainName}</h3>
                    <p className="mt-1 text-xs text-[#909097]">{train.route}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#909097]/20 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#909097]">{train.trainRoute.length} Stops</span>
                    <Button asChild size="sm" className="bg-[#4cd7f6] text-[#0f1417] font-extrabold text-xs rounded-lg hover:bg-[#4cd7f6]/90">
                      <Link to="/passenger">Book Ticket</Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Features Grid */}
        <section className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-xs font-bold tracking-widest text-[#4cd7f6] uppercase">
              SMART RESERVATION ENGINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Engineered for Modern Rail Travel
            </h2>
            <p className="text-xs text-[#909097] mt-1 font-medium">
              Real-time seat allocation algorithms with instant queue promotion intelligence.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6 border border-[#909097]/20 hover:border-[#4cd7f6]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#4cd7f6]/15 text-[#4cd7f6] flex items-center justify-center mb-4">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#909097] font-medium">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works Workflow Section */}
        <section className="px-4 md:px-8 py-10 max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-8 border border-[#4cd7f6]/20">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Three Simple Steps to Board
              </h2>
              <p className="text-xs text-[#909097] mt-1 font-medium">
                Seamless booking workflow designed for speed, clarity, and precision.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="rounded-xl border border-[#909097]/20 bg-[#171c1f]/80 p-5 space-y-2">
                  <span className="font-mono text-xs font-extrabold tracking-widest text-[#4cd7f6]">
                    {s.n}
                  </span>
                  <h3 className="text-base font-extrabold text-white">{s.title}</h3>
                  <p className="text-xs text-[#909097] font-medium leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Footer Hero Banner */}
        <section className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#0b1d28] to-[#053b48] border border-[#4cd7f6]/30 p-8 sm:p-12 text-center text-white glow-card">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <Badge className="bg-[#4cd7f6]/20 text-[#4cd7f6] border-[#4cd7f6]/40 px-3 py-1 font-mono text-xs uppercase tracking-widest">
                READY TO TRAVEL
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready for your next journey?
              </h2>
              <p className="text-xs sm:text-sm text-[#909097] leading-relaxed font-medium">
                Book your confirmed berth with smart preferences or access the admin console to manage network capacities.
              </p>

              <div className="pt-4 flex flex-wrap justify-center gap-3.5">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#4cd7f6] text-[#0f1417] font-extrabold hover:bg-[#4cd7f6]/90 rounded-xl px-7 text-sm glow-button"
                >
                  <Link to="/passenger">
                    Book Ticket Now <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-[#909097]/40 bg-[#171c1f]/80 text-white hover:bg-[#171c1f] font-bold rounded-xl px-6 text-sm"
                >
                  <Link to="/admin">
                    <LayoutDashboard className="mr-1.5 size-4 text-[#4cd7f6]" /> Admin Console
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#909097]/15 bg-[#0f1417] py-6 text-center text-xs font-mono text-[#909097]">
        <p>© 2026 TRAVIA · Your Journey. Reimagined.</p>
      </footer>
    </div>
  );
}


