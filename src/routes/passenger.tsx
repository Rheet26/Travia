import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsoleShell, StatCard } from "@/components/railverse/shell";
import { BookingModal } from "@/components/railverse/booking-modal";
import type { BookingFormValues } from "@/components/railverse/booking-modal";
import { useRail } from "@/lib/railverse/store";
import { countsFor } from "@/lib/railverse/engine";
import type { Train } from "@/lib/railverse/types";

export const Route = createFileRoute("/passenger")({
  head: () => ({
    meta: [
      { title: "Passenger Console — RailVerse" },
      {
        name: "description",
        content:
          "Search trains, book confirmed berths, and track your RAC or waitlist position in the RailVerse passenger console.",
      },
      { property: "og:title", content: "Passenger Console — RailVerse" },
      {
        property: "og:description",
        content: "Book tickets and track RAC and waitlist positions in real time.",
      },
    ],
  }),
  component: PassengerConsole,
});

function PassengerConsole() {
  const { state, book, cancel } = useRail();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Train | null>(null);
  const [open, setOpen] = useState(false);

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

  const handleConfirm = (values: BookingFormValues) => {
    if (!selected) return;
    const { booking, message } = book({ trainId: selected.id, ...values });
    setOpen(false);
    if (!booking) {
      toast.error(message);
      return;
    }
    toast.success(`${booking.status} · PNR ${booking.pnr}`, { description: message });
  };

  return (
    <ConsoleShell
      title="Passenger console"
      subtitle="Search the network, book a berth, and follow your queue position live."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Trains available" value={state.trains.length} />
        <StatCard label="Confirmed tickets" value={confirmed} tone="teal" delay={0.05} />
        <StatCard label="In queue (RAC / WL)" value={queued} tone="amber" delay={0.1} />
      </div>

      <Tabs defaultValue="search" className="mt-8">
        <TabsList>
          <TabsTrigger value="search">Search & book</TabsTrigger>
          <TabsTrigger value="bookings">My bookings ({myBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6 space-y-5">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by train name, number or station"
              className="h-12 rounded-xl pl-10"
            />
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
                  whileHover={{ y: -3 }}
                  className="glass-panel relative overflow-hidden rounded-2xl p-5 sm:p-6"
                >
                  <span className="teal-gradient absolute inset-y-0 left-0 w-1.5" />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs tracking-[0.2em] text-teal-deep">
                        {train.number}
                      </p>
                      <h3 className="mt-1 text-xl font-bold">{train.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {train.from} {train.departure} → {train.to} {train.arrival}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-navy">
                        ₹{train.fare.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">per passenger</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge className="bg-teal/15 text-teal-deep hover:bg-teal/15">
                      Available: {c.seatsLeft}
                    </Badge>
                    <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">
                      RAC left: {c.racLeft}
                    </Badge>
                    <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/15">
                      WL left: {c.wlLeft}
                    </Badge>
                    <Button
                      className="ml-auto"
                      disabled={c.seatsLeft + c.racLeft + c.wlLeft === 0}
                      onClick={() => {
                        setSelected(train);
                        setOpen(true);
                      }}
                    >
                      <Ticket className="mr-1 size-4" /> Book ticket
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>

          {trains.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No trains match “{query}”.
            </p>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-6 space-y-4">
          {myBookings.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No bookings yet. Book a ticket to see it here.
            </p>
          )}
          {myBookings.map((b) => {
            const train = state.trains.find((t) => t.id === b.trainId);
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel flex flex-wrap items-center gap-4 rounded-2xl p-5"
              >
                <div className="min-w-52">
                  <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground">
                    PNR {b.pnr}
                  </p>
                  <h3 className="text-lg font-semibold">{b.passengerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {train?.name ?? "Train removed"} · {b.age} · {b.gender}
                  </p>
                </div>
                <div className="text-sm">
                  <Badge
                    className={
                      b.status === "CONFIRMED"
                        ? "bg-teal/15 text-teal-deep hover:bg-teal/15"
                        : b.status === "RAC"
                          ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/15"
                          : "bg-rose-500/15 text-rose-700 hover:bg-rose-500/15"
                    }
                  >
                    {b.status}
                  </Badge>
                  <p className="mt-1 text-muted-foreground">
                    {b.status === "CONFIRMED"
                      ? `Seat ${b.seatNumber} · ${b.berth} berth`
                      : `Queue position ${b.queuePosition} · pref ${b.preference}`}
                  </p>
                </div>
                <p className="font-display text-lg font-bold">₹{b.fare.toLocaleString("en-IN")}</p>
                <Button
                  variant="outline"
                  className="ml-auto text-destructive hover:text-destructive"
                  onClick={() => {
                    cancel(b.id);
                    toast.success("Ticket cancelled", {
                      description: "RAC and waitlist passengers have been promoted.",
                    });
                  }}
                >
                  <Trash2 className="mr-1 size-4" /> Cancel
                </Button>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>

      <BookingModal
        train={selected}
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
      />
    </ConsoleShell>
  );
}
