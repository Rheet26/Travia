import { motion } from "motion/react";
import { Calendar, Clock, MapPin, Navigation, Ticket, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Train } from "@/lib/railverse/types";

const ALL_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TrainDetailsModal({
  train,
  open,
  onOpenChange,
  onBookNow,
}: {
  train: Train | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookNow?: (train: Train) => void;
}) {
  if (!train) return null;

  const runningDays = train.runningDays || ALL_WEEKDAYS;
  const stops = train.routeStops || [
    { stationName: train.from, arrives: "Source", departs: train.departure, distance: 0, day: 1 },
    {
      stationName: train.to,
      arrives: train.arrival,
      departs: "Destination",
      distance: 500,
      day: 1,
    },
  ];

  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];
  const totalDistance = lastStop?.distance ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl bg-card dark:bg-[#0f1417] text-card-foreground dark:text-[#dfe3e7] border border-border/50 dark:border-[#4cd7f6]/30 shadow-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold tracking-widest text-[#4cd7f6]">
              {train.number}
            </span>
            <Badge className="bg-[#4cd7f6]/15 text-[#38bdf8] border border-[#4cd7f6]/30 text-xs">
              ₹{train.fare} / passenger
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground dark:text-white">{train.name}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground dark:text-[#909097]">
            {train.from} → {train.to}
          </DialogDescription>
        </DialogHeader>

        {/* Schedule & Running Days Overview */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-3 text-center gap-2">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                Departure
              </span>
              <p className="font-mono text-base font-bold text-foreground dark:text-[#dfe3e7]">{train.departure}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {train.from.split("(")[0]}
              </p>
            </div>
            <div className="space-y-1 flex flex-col items-center justify-center">
              <span className="text-[11px] text-[#0284c7] dark:text-[#4cd7f6] font-semibold flex items-center gap-1">
                <Clock className="size-3" /> {train.duration || "12h 00m"}
              </span>
              <div className="w-full flex items-center gap-1 text-muted-foreground">
                <div className="h-0.5 flex-1 bg-[#0284c7]/30 dark:bg-teal/30" />
                <Navigation className="size-3 text-[#0284c7] dark:text-[#4cd7f6] rotate-90" />
                <div className="h-0.5 flex-1 bg-[#0284c7]/30 dark:bg-teal/30" />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {totalDistance} km · {stops.length} stops
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                Arrival
              </span>
              <p className="font-mono text-base font-bold text-foreground dark:text-[#dfe3e7]">{train.arrival}</p>
              <p className="text-[11px] text-muted-foreground truncate">{train.to.split("(")[0]}</p>
            </div>
          </div>

          <div className="border-t border-border/50 pt-3">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
              <Calendar className="size-3.5 text-[#0284c7] dark:text-[#4cd7f6]" /> Operating Days Each Week
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEEKDAYS.map((day) => {
                const operates = runningDays.includes(day) || runningDays.includes("Daily");
                return (
                  <Badge
                    key={day}
                    className={
                      operates
                        ? "bg-[#0284c7]/15 dark:bg-teal/15 text-[#0284c7] dark:text-[#4cd7f6] hover:bg-[#0284c7]/20 font-semibold text-[11px]"
                        : "bg-muted text-muted-foreground opacity-60 font-normal text-[11px]"
                    }
                  >
                    {day}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        {/* Route Timeline View */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#0284c7] dark:text-[#4cd7f6]" /> Complete Route & Station Stops
            </h4>
            <span className="text-xs text-muted-foreground font-mono">{stops.length} Stations</span>
          </div>

          <div className="glass-panel relative rounded-2xl p-4 sm:p-5">
            {/* Vertical timeline connector bar */}
            <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#0284c7] dark:from-teal-deep via-teal/50 to-primary opacity-30" />

            <div className="space-y-6 relative">
              {stops.map((stop, idx) => {
                const isOrigin = idx === 0;
                const isDest = idx === stops.length - 1;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-start gap-4 text-xs"
                  >
                    {/* Node Icon */}
                    <div
                      className={`relative z-10 size-6 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isOrigin
                          ? "bg-[#0284c7] dark:bg-teal-deep text-white shadow-md shadow-[#0284c7]/30"
                          : isDest
                            ? "bg-slate-800 dark:bg-navy text-white shadow-md shadow-slate-800/30"
                            : "bg-background border-2 border-[#0284c7] dark:border-teal-deep text-[#0284c7] dark:text-[#4cd7f6]"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Station Details Card */}
                    <div className="flex-1 rounded-xl border border-border/50 bg-background/50 p-3 hover:border-[#0284c7]/40 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            {stop.stationName}
                            {isOrigin && (
                              <Badge className="bg-[#0284c7]/15 dark:bg-teal/15 text-[#0284c7] dark:text-[#4cd7f6] text-[10px] py-0">
                                Origin
                              </Badge>
                            )}
                            {isDest && (
                              <Badge className="bg-slate-800/15 dark:bg-navy/15 text-slate-800 dark:text-[#dfe3e7] text-[10px] py-0">
                                Destination
                              </Badge>
                            )}
                          </h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Day {stop.day || 1} · {stop.distance} km from origin
                          </p>
                        </div>

                        <div className="text-right font-mono text-[11px]">
                          <div className="text-muted-foreground">
                            Arr:{" "}
                            <span className="font-semibold text-foreground">{stop.arrives}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Dep:{" "}
                            <span className="font-semibold text-foreground">{stop.departs}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer / Action */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onBookNow && (
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onBookNow(train);
              }}
            >
              <Ticket className="mr-1.5 size-4" /> Book This Train{" "}
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
