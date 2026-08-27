import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, Ticket, Trash2, Navigation, SlidersHorizontal, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsoleShell, StatCard } from "@/components/railverse/shell";
import { formatJourneyDate, BookingModal } from "@/components/railverse/booking-modal";
import { TrainDetailsModal } from "@/components/railverse/train-details-modal";
import type { BookingFormValues } from "@/components/railverse/booking-modal";
import { useRail } from "@/lib/railverse/store";
import { useRequireRole } from "@/lib/railverse/auth";
import { countsFor } from "@/lib/railverse/engine";
import type { Train, Booking } from "@/lib/railverse/types";

export const Route = createFileRoute("/passenger")({
  head: () => ({
    meta: [
      { title: "Passenger Console — Travia" },
      {
        name: "description",
        content:
          "Search available journeys, view route timelines, book tickets, and track your boarding pass and upgrade status live.",
      },
      { property: "og:title", content: "Passenger Console — Travia" },
      {
        property: "og:description",
        content: "Book tickets and track RAC and waitlist positions in real time.",
      },
    ],
  }),
  component: PassengerConsole,
});

function UpgradeStatusTracker({ status }: { status: Booking["status"] }) {
  const steps = [
    { key: "WAITLIST", label: "WAITLIST" },
    { key: "RAC", label: "RAC" },
    { key: "CONFIRMED", label: "CONFIRMED" },
  ];

  const currentIdx = status === "CONFIRMED" ? 2 : status === "RAC" ? 1 : 0;

  return (
    <div className="glass-card rounded-2xl p-5 border border-[#4cd7f6]/20 my-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#4cd7f6] text-lg">trending_up</span>
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Upgrade Status</h4>
      </div>

      <div className="relative flex items-center justify-between px-6 py-2">
        {/* Connecting line */}
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-0.5 bg-[#909097]/30 -z-0" />
        <div
          className="absolute left-10 top-1/2 -translate-y-1/2 h-0.5 bg-[#4cd7f6] transition-all duration-500 -z-0"
          style={{ width: `${(currentIdx / 2) * 80}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? "bg-[#0f1417] border-2 border-[#4cd7f6] shadow-[0_0_12px_rgba(76,215,246,0.8)]"
                    : isDone
                      ? "bg-[#4cd7f6] text-[#0f1417]"
                      : "bg-[#171c1f] border border-[#909097]/40"
                }`}
              >
                {isDone && <div className={`w-2 h-2 rounded-full ${isCurrent ? "bg-[#4cd7f6]" : "bg-[#0f1417]"}`} />}
              </div>
              <span
                className={`font-mono text-[10px] font-bold tracking-widest ${
                  isCurrent ? "text-[#4cd7f6]" : isDone ? "text-white" : "text-[#909097]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PassengerConsole() {
  const allowed = useRequireRole("passenger");
  const { state, book, cancel } = useRail();
  const [activeTab, setActiveTab] = useState<"search" | "bookings">("search");
  const [bookingFilter, setBookingFilter] = useState<"ALL" | "CONFIRMED" | "QUEUE">("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Train | null>(null);
  const [open, setOpen] = useState(false);

  const [detailsTrain, setDetailsTrain] = useState<Train | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const trains = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.trains;
    return state.trains.filter((t) =>
      [t.name, t.number, t.from, t.to].some((v) => v.toLowerCase().includes(q)),
    );
  }, [state.trains, query]);

  const myBookings = state.bookings.filter((b) => b.status !== "CANCELLED");
  const confirmed = myBookings.filter((b) => b.status === "CONFIRMED").length;
  const queued = myBookings.length - confirmed;

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "CONFIRMED") return myBookings.filter((b) => b.status === "CONFIRMED");
    if (bookingFilter === "QUEUE") return myBookings.filter((b) => b.status === "RAC" || b.status === "WAITLIST");
    return myBookings;
  }, [myBookings, bookingFilter]);

  const handleConfirm = async (values: BookingFormValues) => {
    if (!selected) return { booking: null, message: "No train selected." };
    const res = await book({ trainId: selected.id, ...values });
    if (!res.booking && (!res.bookings || res.bookings.length === 0)) {
      toast.error(res.message || "Booking failed.");
    } else {
      toast.success(res.message);
    }
    return res;
  };

  if (!allowed) return <div className="min-h-screen bg-[#0f1417]" />;

  return (
    <ConsoleShell
      title="Available Journeys"
      subtitle="Search high-speed rail routes, inspect route timelines, and manage your live boarding passes."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Trains Available"
          value={state.trains.length}
          onClick={() => setActiveTab("search")}
        />
        <StatCard
          label="Confirmed Tickets"
          value={confirmed}
          tone="teal"
          delay={0.05}
          onClick={() => {
            setActiveTab("bookings");
            setBookingFilter("CONFIRMED");
            toast.info("Showing Confirmed Tickets");
          }}
        />
        <StatCard
          label="In Queue (RAC / WL)"
          value={queued}
          tone="amber"
          delay={0.1}
          onClick={() => {
            setActiveTab("bookings");
            setBookingFilter("QUEUE");
            toast.info("Showing RAC & Waitlist Tickets");
          }}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-8">
        <TabsList className="bg-[#171c1f] border border-[#909097]/20 p-1 rounded-xl">
          <TabsTrigger value="search" className="data-[state=active]:bg-[#4cd7f6] data-[state=active]:text-[#0f1417] font-bold text-xs rounded-lg">
            Search & Book
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-[#4cd7f6] data-[state=active]:text-[#0f1417] font-bold text-xs rounded-lg">
            My Bookings ({myBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#909097]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search train name, code, or station..."
                className="h-12 rounded-xl pl-10 bg-[#020617] border border-[#909097]/30 text-white font-medium focus:border-[#4cd7f6]"
              />
            </div>
            <Button variant="outline" className="h-12 px-4 rounded-xl border-[#4cd7f6]/30 bg-[#171c1f] text-[#4cd7f6] font-mono text-xs font-bold uppercase gap-2">
              <SlidersHorizontal className="size-4" /> Filter
            </Button>
          </div>

          <AnimatePresence mode="popLayout">
            {trains.map((train, i) => {
              const c = countsFor(state, train);
              return (
                <motion.article
                  key={train.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  className="glass-card relative overflow-hidden rounded-2xl p-6 border border-[#4cd7f6]/20 glow-card"
                >
                  {/* Top Bar Badges */}
                  <div className="flex items-center justify-between mb-4 border-b border-[#909097]/15 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 font-mono text-[10px] uppercase">
                        EXPRESS
                      </Badge>
                      <span className="font-mono text-xs font-bold text-[#909097] tracking-wider">
                        {train.number} · {train.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#4cd7f6]/10 text-[#4cd7f6] text-[11px] font-bold">
                        Seats: {c.seatsLeft}
                      </Badge>
                      {c.racLeft > 0 && (
                        <Badge className="bg-amber-500/15 text-amber-300 text-[11px] font-bold">
                          RAC: {c.racLeft}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Departure & Arrival Journey Visualiser */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-2">
                    {/* Departure */}
                    <div>
                      <span className="font-display text-3xl font-extrabold text-white">{train.departure}</span>
                      <p className="font-mono text-xs text-[#909097] font-semibold mt-0.5">{train.from}</p>
                    </div>

                    {/* Duration Timeline */}
                    <div className="flex flex-col items-center justify-center px-2">
                      <span className="font-mono text-[11px] text-[#4cd7f6] font-bold">
                        {train.duration || "4h 30m"}
                      </span>
                      <div className="w-full flex items-center gap-1 my-1">
                        <div className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-[#4cd7f6] to-[#03b5d3] opacity-60" />
                        <div className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
                      </div>
                      <span className="font-mono text-[10px] text-[#909097]">
                        {train.routeStops?.length || 2} Stops
                      </span>
                    </div>

                    {/* Arrival */}
                    <div className="sm:text-right">
                      <span className="font-display text-3xl font-extrabold text-white">{train.arrival}</span>
                      <p className="font-mono text-xs text-[#909097] font-semibold mt-0.5">{train.to}</p>
                    </div>
                  </div>

                  {/* Footer Action Bar */}
                  <div className="mt-5 pt-4 border-t border-[#909097]/15 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="font-mono text-[10px] font-bold text-[#909097] uppercase block">Ticket Price</span>
                      <span className="font-display text-2xl font-extrabold text-[#4cd7f6]">
                        ₹{train.fare.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDetailsTrain(train);
                          setDetailsOpen(true);
                        }}
                        className="rounded-xl border-[#909097]/30 bg-[#171c1f] text-white font-bold hover:bg-[#171c1f]/80"
                      >
                        <Navigation className="mr-1 size-3.5 text-[#4cd7f6]" /> Route
                      </Button>

                      <Button
                        disabled={c.seatsLeft + c.racLeft + c.wlLeft === 0}
                        onClick={() => {
                          setSelected(train);
                          setOpen(true);
                        }}
                        className="bg-[#4cd7f6] text-[#0f1417] font-extrabold rounded-xl px-5 h-10 glow-button hover:bg-[#4cd7f6]/90"
                      >
                        <Ticket className="mr-1.5 size-4" /> BOOK TICKET
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>

          {trains.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#909097]/30 py-12 text-center text-sm text-[#909097]">
              No journeys match “{query}”.
            </p>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-6 space-y-6">
          {/* Quick Ticket Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 glass-card p-3.5 rounded-xl border border-[#4cd7f6]/20">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#909097] uppercase mr-1">Filter Tickets:</span>
              <Button
                variant={bookingFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookingFilter("ALL")}
                className={`rounded-lg text-xs font-bold h-8 ${
                  bookingFilter === "ALL"
                    ? "bg-[#4cd7f6] text-[#0f1417]"
                    : "border-[#909097]/30 text-[#909097] bg-[#171c1f]"
                }`}
              >
                All ({myBookings.length})
              </Button>
              <Button
                variant={bookingFilter === "CONFIRMED" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookingFilter("CONFIRMED")}
                className={`rounded-lg text-xs font-bold h-8 ${
                  bookingFilter === "CONFIRMED"
                    ? "bg-[#4cd7f6] text-[#0f1417]"
                    : "border-[#4cd7f6]/30 text-[#4cd7f6] bg-[#171c1f]"
                }`}
              >
                Confirmed Only ({confirmed})
              </Button>
              <Button
                variant={bookingFilter === "QUEUE" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookingFilter("QUEUE")}
                className={`rounded-lg text-xs font-bold h-8 ${
                  bookingFilter === "QUEUE"
                    ? "bg-amber-400 text-[#0f1417]"
                    : "border-amber-500/30 text-amber-400 bg-[#171c1f]"
                }`}
              >
                In Queue ({queued})
              </Button>
            </div>

            <div className="font-mono text-xs text-[#909097]">
              Showing {filteredBookings.length} ticket{filteredBookings.length === 1 ? "" : "s"}
            </div>
          </div>

          {filteredBookings.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#909097]/30 py-12 text-center text-sm text-[#909097]">
              {bookingFilter === "CONFIRMED"
                ? "No confirmed tickets found."
                : bookingFilter === "QUEUE"
                  ? "No queue tickets found."
                  : "No active bookings. Book a ticket to view your boarding pass."}
            </p>
          )}

          {filteredBookings.map((b) => {
            const train = state.trains.find((t) => t.id === b.trainId);
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Upgrade Status Timeline Header */}
                <UpgradeStatusTracker status={b.status} />

                {/* Metallic Dark Cyan Boarding Pass Card */}
                <div className="glass-card rounded-2xl p-6 border-2 border-[#4cd7f6]/40 glow-card relative overflow-hidden bg-gradient-to-br from-[#171c1f] via-[#0f1417] to-[#1b2023]">
                  {/* Decorative PNR Strip */}
                  <div className="flex items-center justify-between border-b border-[#4cd7f6]/30 pb-4 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-xl text-[#4cd7f6] tracking-tighter">
                        TRAVIA
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#909097] uppercase tracking-widest">
                        BOARDING PASS & TICKET
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-[#909097] block uppercase">PNR NUMBER</span>
                      <span className="text-sm font-bold text-white tracking-widest">{b.pnr}</span>
                    </div>
                  </div>

                  {/* Pass Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase text-[#909097] block">
                        PASSENGER
                      </span>
                      <span className="font-bold text-white text-base block mt-0.5">{b.passengerName}</span>
                      <span className="font-mono text-xs text-[#909097]">{b.age} yrs · {b.gender}</span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase text-[#909097] block">
                        TRAIN
                      </span>
                      <span className="font-bold text-[#4cd7f6] text-base block mt-0.5">
                        {train?.name ?? "Express"}
                      </span>
                      <span className="font-mono text-xs text-[#909097]">{train?.number}</span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase text-[#909097] block">
                        CLASS
                      </span>
                      <span className="font-bold text-white text-base block mt-0.5">Executive AC</span>
                      <span className="font-mono text-xs text-[#909097]">Standard 3A/CC</span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase text-[#909097] block">
                        STATUS
                      </span>
                      <Badge
                        className={`mt-1 font-mono text-xs font-bold ${
                          b.status === "CONFIRMED"
                            ? "bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40"
                            : b.status === "RAC"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {b.status}
                      </Badge>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase text-[#909097] block">
                        BERTH / SEAT
                      </span>
                      <span className="font-bold text-[#4cd7f6] text-base block mt-0.5">
                        {b.status === "CONFIRMED"
                          ? `Seat ${b.seatNumber} (${b.berth})`
                          : `Queue #${b.queuePosition} (${b.preference})`}
                      </span>
                    </div>
                  </div>

                  {/* Route & Journey Footer */}
                  <div className="mt-6 pt-4 border-t border-[#909097]/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="font-mono text-xs text-[#dfe3e7]">
                      📍 {b.fromStation || train?.from} → {b.toStation || train?.to}
                      {b.journeyDate && <span className="text-[#4cd7f6] ml-2">· {formatJourneyDate(b.journeyDate)}</span>}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono text-[10px] text-[#909097] block uppercase">TOTAL FARE</span>
                        <span className="font-display font-extrabold text-xl text-white">
                          ₹{b.fare.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold rounded-xl"
                        onClick={async () => {
                          await cancel(b.id);
                          toast.success("Ticket cancelled", {
                            description: "RAC and waitlist queue promoted.",
                          });
                        }}
                      >
                        <Trash2 className="mr-1.5 size-3.5" /> Cancel Ticket
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>

      <TrainDetailsModal
        train={detailsTrain}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onBookNow={(tr) => {
          setSelected(tr);
          setOpen(true);
        }}
      />

      <BookingModal
        train={selected}
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        onViewTickets={() => setActiveTab("bookings")}
      />
    </ConsoleShell>
  );
}


