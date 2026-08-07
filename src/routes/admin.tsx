import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsoleShell, StatCard } from "@/components/railverse/shell";
import { useRail } from "@/lib/railverse/store";
import { useRequireRole } from "@/lib/railverse/auth";
import { countsFor, makeTrain } from "@/lib/railverse/engine";
import type { Train } from "@/lib/railverse/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — RailVerse" },
      {
        name: "description",
        content:
          "Add, edit and remove trains, adjust seat, RAC and waitlist capacity, and monitor every booking in the RailVerse admin console.",
      },
      { property: "og:title", content: "Admin Console — RailVerse" },
      {
        property: "og:description",
        content: "Manage trains, capacity and bookings across the RailVerse network.",
      },
    ],
  }),
  component: AdminConsole,
});

type Draft = Omit<Train, "id"> & { id?: string };

const emptyDraft = (): Draft => ({
  number: "",
  name: "",
  from: "",
  to: "",
  departure: "06:00",
  arrival: "14:00",
  fare: 1000,
  seats: 6,
  racTotal: 3,
  wlTotal: 5,
});

function AdminConsole() {
  const allowed = useRequireRole("admin");
  const { state, addTrain, updateTrain, deleteTrain, reset, cancel } = useRail();
  const [draft, setDraft] = useState<Draft | null>(null);

  const totals = state.trains.reduce(
    (acc, t) => {
      const c = countsFor(state, t);
      return {
        confirmed: acc.confirmed + c.confirmed,
        rac: acc.rac + c.rac,
        wl: acc.wl + c.wl,
      };
    },
    { confirmed: 0, rac: 0, wl: 0 },
  );

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.number.trim()) {
      toast.error("Train name and number are required.");
      return;
    }
    if (draft.id) {
      updateTrain({ ...(draft as Train) });
      toast.success("Train updated");
    } else {
      const { id: _ignored, ...rest } = draft;
      addTrain(makeTrain(rest));
      toast.success("Train added");
    }
    setDraft(null);
  };

  const num = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <ConsoleShell
      title="Admin console"
      subtitle="Manage the network, capacity and every reservation on the chart."
      actions={
        <Button
          variant="outline"
          onClick={() => {
            reset();
            toast.success("Demo data reset");
          }}
        >
          <RotateCcw className="mr-1 size-4" /> Reset data
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Trains" value={state.trains.length} />
        <StatCard label="Confirmed" value={totals.confirmed} tone="teal" delay={0.05} />
        <StatCard label="RAC" value={totals.rac} tone="amber" delay={0.1} />
        <StatCard label="Waitlist" value={totals.wl} tone="rose" delay={0.15} />
      </div>

      <Tabs defaultValue="trains" className="mt-8">
        <TabsList>
          <TabsTrigger value="trains">Manage trains</TabsTrigger>
          <TabsTrigger value="bookings">Monitor bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="trains" className="mt-6 space-y-4">
          {!draft && (
            <Button onClick={() => setDraft(emptyDraft())}>
              <Plus className="mr-1 size-4" /> Add train
            </Button>
          )}

          {draft && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {draft.id ? "Edit train" : "New train"}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setDraft(null)}>
                  <X className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["Number", "number"],
                    ["Name", "name"],
                    ["From", "from"],
                    ["To", "to"],
                    ["Departure", "departure"],
                    ["Arrival", "arrival"],
                  ] as const
                ).map(([label, key]) => (
                  <div key={key} className="grid gap-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    />
                  </div>
                ))}
                {(
                  [
                    ["Fare (₹)", "fare"],
                    ["Seats", "seats"],
                    ["RAC capacity", "racTotal"],
                    ["Waitlist capacity", "wlTotal"],
                  ] as const
                ).map(([label, key]) => (
                  <div key={key} className="grid gap-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      inputMode="numeric"
                      value={String(draft[key])}
                      onChange={(e) => setDraft({ ...draft, [key]: num(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <Button onClick={save}>Save train</Button>
                <Button variant="outline" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {state.trains.map((train, i) => {
            const c = countsFor(state, train);
            return (
              <motion.div
                key={train.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
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
                      {train.from} {train.departure} → {train.to} {train.arrival} · ₹
                      {train.fare.toLocaleString("en-IN")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        Seats {c.confirmed}/{train.seats}
                      </Badge>
                      <Badge variant="secondary">
                        RAC {c.rac}/{train.racTotal}
                      </Badge>
                      <Badge variant="secondary">
                        WL {c.wl}/{train.wlTotal}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setDraft({ ...train })}>
                      <Pencil className="mr-1 size-4" /> Update
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteTrain(train.id);
                        toast.success("Train removed");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="bookings" className="mt-6 space-y-3">
          {state.bookings.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No bookings on the chart yet.
            </p>
          )}
          {state.bookings.map((b) => {
            const train = state.trains.find((t) => t.id === b.trainId);
            return (
              <div
                key={b.id}
                className="glass-panel flex flex-wrap items-center gap-4 rounded-2xl p-4"
              >
                <div className="min-w-48">
                  <p className="font-mono text-xs text-muted-foreground">
                    {b.id} · PNR {b.pnr}
                  </p>
                  <p className="font-semibold">{b.passengerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {train?.name ?? "—"} · {b.age} · {b.gender} · {b.preference}
                  </p>
                </div>
                <Badge
                  className={
                    b.status === "CONFIRMED"
                      ? "bg-teal/15 text-teal-deep hover:bg-teal/15"
                      : b.status === "RAC"
                        ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/15"
                        : b.status === "WAITLIST"
                          ? "bg-rose-500/15 text-rose-700 hover:bg-rose-500/15"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                  }
                >
                  {b.status}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {b.status === "CONFIRMED"
                    ? `Seat ${b.seatNumber} · ${b.berth}`
                    : b.status === "CANCELLED"
                      ? "—"
                      : `Position ${b.queuePosition}`}
                </p>
                {b.status !== "CANCELLED" && (
                  <Button
                    variant="ghost"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => {
                      cancel(b.id);
                      toast.success("Booking cancelled & queues promoted");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </ConsoleShell>
  );
}
