import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Navigation, Pencil, Plus, RotateCcw, Trash2, X, FileDown } from "lucide-react";
import { downloadTicketPDF } from "@/lib/railverse/pdf-generator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsoleShell, StatCard } from "@/components/railverse/shell";
import { useRail } from "@/lib/railverse/store";
import { useRequireRole } from "@/lib/railverse/auth";
import { countsFor } from "@/lib/railverse/engine";
import type { Train } from "@/lib/railverse/types";
import { TrainDetailsModal } from "@/components/railverse/train-details-modal";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Travia" },
      {
        name: "description",
        content:
          "Add, edit and remove trains, adjust seat, RAC and waitlist capacity, and monitor every booking in the Travia admin console.",
      },
      { property: "og:title", content: "Admin Console — Travia" },
      {
        property: "og:description",
        content: "Manage trains, capacity and bookings across the network.",
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
  const [detailsTrain, setDetailsTrain] = useState<Train | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.number.trim()) {
      toast.error("Train name and number are required.");
      return;
    }
    try {
      if (draft.id) {
        await updateTrain({ ...(draft as Train) });
        toast.success("Train updated");
      } else {
        const { id: _ignored, ...rest } = draft;
        await addTrain(rest);
        toast.success("Train added");
      }
      setDraft(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save train.");
    }
  };

  const num = (v: string) => Math.max(0, Number(v) || 0);

  if (!allowed) return <div className="min-h-screen bg-[#0f1417]" />;

  return (
    <ConsoleShell
      title="Admin Console"
      subtitle="Manage network routes, adjust coach capacities, and monitor live passenger reservations."
      actions={
        <Button
          variant="outline"
          onClick={async () => {
            await reset();
            toast.success("Data refreshed from backend");
          }}
          className="rounded-xl border-[#4cd7f6]/30 bg-[#171c1f] text-[#4cd7f6] font-bold hover:bg-[#4cd7f6]/10"
        >
          <RotateCcw className="mr-1.5 size-4" /> Refresh Data
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Trains Active" value={state.trains.length} />
        <StatCard label="Confirmed" value={totals.confirmed} tone="teal" delay={0.05} />
        <StatCard label="RAC" value={totals.rac} tone="amber" delay={0.1} />
        <StatCard label="Waitlist" value={totals.wl} tone="rose" delay={0.15} />
      </div>

      <Tabs defaultValue="trains" className="mt-8">
        <TabsList className="bg-[#171c1f] border border-[#909097]/20 p-1 rounded-xl">
          <TabsTrigger
            value="trains"
            className="data-[state=active]:bg-[#4cd7f6] data-[state=active]:text-[#0f1417] font-bold text-xs rounded-lg"
          >
            Manage Trains
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="data-[state=active]:bg-[#4cd7f6] data-[state=active]:text-[#0f1417] font-bold text-xs rounded-lg"
          >
            Monitor Bookings ({state.bookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trains" className="mt-6 space-y-4">
          {!draft && (
            <Button
              onClick={() => setDraft(emptyDraft())}
              className="bg-[#4cd7f6] text-[#0f1417] font-extrabold rounded-xl px-5 glow-button hover:bg-[#4cd7f6]/90"
            >
              <Plus className="mr-1.5 size-4" /> Add New Train
            </Button>
          )}

          {draft && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 border border-[#4cd7f6]/30 glow-card"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[#909097]/20 pb-3">
                <h3 className="text-lg font-bold text-white">
                  {draft.id ? "Edit Train Configuration" : "Add New Train to Fleet"}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDraft(null)}
                  className="text-[#909097] hover:text-white"
                >
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
                  <div key={key} className="grid gap-1.5">
                    <Label
                      htmlFor={key}
                      className="font-mono text-xs font-bold uppercase text-[#4cd7f6]"
                    >
                      {label}
                    </Label>
                    <Input
                      id={key}
                      value={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      className="bg-[#020617] border border-[#909097]/30 text-white rounded-xl font-medium focus:border-[#4cd7f6]"
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
                  <div key={key} className="grid gap-1.5">
                    <Label
                      htmlFor={key}
                      className="font-mono text-xs font-bold uppercase text-[#4cd7f6]"
                    >
                      {label}
                    </Label>
                    <Input
                      id={key}
                      inputMode="numeric"
                      value={String(draft[key])}
                      onChange={(e) => setDraft({ ...draft, [key]: num(e.target.value) })}
                      className="bg-[#020617] border border-[#909097]/30 text-white rounded-xl font-medium focus:border-[#4cd7f6]"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3 pt-3 border-t border-[#909097]/20">
                <Button
                  onClick={save}
                  className="bg-[#4cd7f6] text-[#0f1417] font-extrabold rounded-xl px-6 glow-button"
                >
                  Save Train
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDraft(null)}
                  className="rounded-xl border-[#909097]/30 text-[#909097]"
                >
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
                className="glass-card relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-[#4cd7f6]/20"
              >
                <span className="bg-[#4cd7f6] absolute inset-y-0 left-0 w-1" />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs font-bold tracking-widest text-[#0284c7] dark:text-[#4cd7f6] uppercase">
                      {train.number}
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold text-foreground dark:text-white">{train.name}</h3>
                    <p className="mt-1 text-xs font-mono text-slate-700 dark:text-[#909097]">
                      {train.from} ({train.departure}) → {train.to} ({train.arrival}) ·{" "}
                      <span className="text-[#0284c7] dark:text-[#38bdf8] font-bold">
                        ₹{train.fare.toLocaleString("en-IN")}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="bg-[#0284c7]/15 dark:bg-[#4cd7f6]/15 text-[#0284c7] dark:text-[#4cd7f6] border border-[#0284c7]/30 dark:border-[#4cd7f6]/30 font-mono text-[10px]">
                        Seats {c.confirmed}/{train.seats}
                      </Badge>
                      <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-mono text-[10px]">
                        RAC {c.rac}/{train.racTotal}
                      </Badge>
                      <Badge className="bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 font-mono text-[10px]">
                        WL {c.wl}/{train.wlTotal}
                      </Badge>
                      {(train.runningDays || ["Daily"]).map((d) => (
                        <Badge
                          key={d}
                          variant="outline"
                          className="text-[10px] py-0 font-mono border-border dark:border-[#909097]/30 text-slate-700 dark:text-[#909097]"
                        >
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailsTrain(train);
                        setDetailsOpen(true);
                      }}
                      className="rounded-xl border-border dark:border-[#909097]/30 bg-card dark:bg-[#171c1f] text-foreground dark:text-white font-bold"
                    >
                      <Navigation className="mr-1.5 size-3.5 text-[#0284c7] dark:text-[#4cd7f6]" /> Route
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDraft({ ...train })}
                      className="rounded-xl border-[#0284c7]/40 dark:border-[#4cd7f6]/30 bg-card dark:bg-[#171c1f] text-[#0284c7] dark:text-[#4cd7f6] font-bold"
                    >
                      <Pencil className="mr-1.5 size-3.5" /> Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                      onClick={async () => {
                        try {
                          await deleteTrain(train.id);
                          toast.success("Train removed");
                        } catch (err: any) {
                          toast.error(err.message || "Failed to remove train.");
                        }
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

        <TabsContent value="bookings" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-xl border border-[#4cd7f6]/20 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Passenger Reservations Chart</h3>
              <p className="text-xs text-[#909097]">
                View individual passenger bookings, assigned seats, berth allocations, and live
                queue status.
              </p>
            </div>
            <div className="font-mono text-xs font-bold text-[#4cd7f6] bg-[#4cd7f6]/10 px-3 py-1.5 rounded-lg border border-[#4cd7f6]/30">
              Total Bookings: {state.bookings.length}
            </div>
          </div>

          {state.bookings.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#909097]/30 py-12 text-center text-sm text-[#909097]">
              No reservations recorded on the passenger chart yet.
            </p>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden border border-[#4cd7f6]/20 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#171c1f] border-b border-[#909097]/20 font-mono text-[11px] font-bold text-[#4cd7f6] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Passenger Name</th>
                      <th className="py-3.5 px-4">PNR</th>
                      <th className="py-3.5 px-4">Train</th>
                      <th className="py-3.5 px-4">Route</th>
                      <th className="py-3.5 px-4">Journey Date</th>
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4">Seat / Berth</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Fare</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#909097]/15 text-xs font-medium">
                    {state.bookings.map((b) => {
                      const train = state.trains.find((t) => t.id === b.trainId);
                      return (
                        <tr key={b.id} className="hover:bg-muted/50 dark:hover:bg-[#171c1f]/50 transition-colors">
                          {/* Passenger */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-foreground dark:text-white block">{b.passengerName}</span>
                            <span className="font-mono text-[11px] text-slate-600 dark:text-[#909097]">
                              {b.age} yrs · {b.gender}
                            </span>
                          </td>

                          {/* PNR */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0284c7] dark:text-[#4cd7f6]">
                            {b.pnr}
                          </td>

                          {/* Train */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-foreground dark:text-white block">
                              {train?.name ?? "Express"}
                            </span>
                            <span className="font-mono text-[11px] text-slate-600 dark:text-[#909097]">
                              {train?.number}
                            </span>
                          </td>

                          {/* Route */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-foreground dark:text-[#dfe3e7]">
                            {b.fromStation || train?.from} → {b.toStation || train?.to}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-[#909097]">
                            {b.journeyDate || "Today"}
                          </td>

                          {/* Class */}
                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono border-border dark:border-[#909097]/30 text-foreground dark:text-[#dfe3e7]"
                            >
                              Executive AC
                            </Badge>
                          </td>

                          {/* Seat / Berth */}
                          <td className="py-3.5 px-4 font-mono">
                            {b.status === "CONFIRMED" ? (
                              <span className="text-[#0284c7] dark:text-[#4cd7f6] font-bold">
                                Seat {b.seatNumber} ({b.berth})
                              </span>
                            ) : b.status === "CANCELLED" ? (
                              <span className="text-slate-500 dark:text-[#909097]">Cancelled</span>
                            ) : (
                              <span className="text-amber-700 dark:text-amber-300 font-bold">
                                Queue #{b.queuePosition} ({b.preference})
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <Badge
                              className={`font-mono text-[10px] font-bold ${
                                b.status === "CONFIRMED"
                                  ? "bg-[#0284c7]/15 dark:bg-[#4cd7f6]/20 text-[#0284c7] dark:text-[#4cd7f6] border border-[#0284c7]/30 dark:border-[#4cd7f6]/40"
                                  : b.status === "RAC"
                                    ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40"
                                    : b.status === "WAITLIST"
                                      ? "bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40"
                                      : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {b.status}
                            </Badge>
                          </td>

                          {/* Fare */}
                          <td className="py-3.5 px-4 font-display font-extrabold text-[#0284c7] dark:text-[#38bdf8]">
                            ₹{b.fare.toLocaleString("en-IN")}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#4cd7f6] hover:text-[#4cd7f6] hover:bg-[#4cd7f6]/10 font-bold h-8 px-2 rounded-lg text-xs"
                                onClick={() => {
                                  const tr = state.trains.find((t) => t.id === b.trainId);
                                  downloadTicketPDF({ booking: b, train: tr });
                                }}
                              >
                                <FileDown className="mr-1 size-3.5" /> PDF
                              </Button>
                              {b.status !== "CANCELLED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-bold h-8 px-2.5 rounded-lg text-xs"
                                  onClick={async () => {
                                    await cancel(b.id);
                                    toast.success("Booking cancelled & queue promoted");
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TrainDetailsModal train={detailsTrain} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </ConsoleShell>
  );
}
