import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Users,
  Sparkles,
  ShieldCheck,
  Ticket,
  MapPin,
  Clock,
  Navigation,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BerthPreference, Booking, Gender, PassengerInput, Train } from "@/lib/railverse/types";
import { calculateSegmentDetails } from "@/lib/railverse/engine";

export interface BookingFormValues {
  trainId?: string;
  journeyDate: string;
  fromStation?: string;
  toStation?: string;
  passengerName?: string;
  age?: number;
  gender?: Gender;
  preference?: BerthPreference;
  passengers: PassengerInput[];
}

export function formatJourneyDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = d.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${monthName} ${year}, ${dayName}`;
}

export function getDayOfWeekShort(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  if (!year || !month || !day) return "";
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function BookingModal({
  train,
  open,
  onOpenChange,
  onConfirm,
  onViewTickets,
}: {
  train: Train | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    values: BookingFormValues,
  ) => Promise<{ booking: Booking | null; bookings?: Booking[]; message: string }>;
  onViewTickets?: () => void;
}) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [journeyDate, setJourneyDate] = useState<string>(todayStr);

  const defaultFrom = train?.routeStops?.[0]?.stationName || train?.from || "";
  const defaultTo =
    train?.routeStops?.[train.routeStops.length - 1]?.stationName || train?.to || "";

  const [fromStation, setFromStation] = useState<string>(defaultFrom);
  const [toStation, setToStation] = useState<string>(defaultTo);

  const [passengers, setPassengers] = useState<PassengerInput[]>([
    { passengerName: "", age: 30, gender: "Male", preference: "No Preference" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [confirmedMessage, setConfirmedMessage] = useState<string>("");

  useEffect(() => {
    if (train) {
      const f = train.routeStops?.[0]?.stationName || train.from || "";
      const t = train.routeStops?.[train.routeStops.length - 1]?.stationName || train.to || "";
      setFromStation(f);
      setToStation(t);
    }
  }, [train]);

  const routeStops = useMemo(() => {
    if (train?.routeStops && train.routeStops.length >= 2) return train.routeStops;
    return [
      { stationName: train?.from || "Origin", arrives: "Source", departs: train?.departure || "06:00", distance: 0, day: 1 },
      { stationName: train?.to || "Destination", arrives: train?.arrival || "14:00", departs: "Destination", distance: 500, day: 1 },
    ];
  }, [train]);

  const boardingOptions = useMemo(() => {
    return routeStops.slice(0, routeStops.length - 1);
  }, [routeStops]);

  const fromIndex = useMemo(() => {
    const idx = routeStops.findIndex((s) => s.stationName === fromStation);
    return idx >= 0 ? idx : 0;
  }, [routeStops, fromStation]);

  const destinationOptions = useMemo(() => {
    return routeStops.slice(fromIndex + 1);
  }, [routeStops, fromIndex]);

  useEffect(() => {
    if (destinationOptions.length > 0) {
      const exists = destinationOptions.some((s) => s.stationName === toStation);
      if (!exists) {
        setToStation(destinationOptions[destinationOptions.length - 1]!.stationName);
      }
    }
  }, [destinationOptions, toStation]);

  const segmentDetails = useMemo(() => {
    if (!train) return null;
    return calculateSegmentDetails(train, fromStation, toStation);
  }, [train, fromStation, toStation]);

  const selectedDayShort = useMemo(() => getDayOfWeekShort(journeyDate), [journeyDate]);
  const trainRunningDays = useMemo(
    () => train?.runningDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    [train],
  );

  const isRunningOnSelectedDate = useMemo(() => {
    if (!selectedDayShort) return true;
    return trainRunningDays.includes("Daily") || trainRunningDays.includes(selectedDayShort);
  }, [selectedDayShort, trainRunningDays]);

  const resetForm = () => {
    setStep(1);
    setJourneyDate(new Date().toISOString().split("T")[0]);
    if (train) {
      setFromStation(train.routeStops?.[0]?.stationName || train.from || "");
      setToStation(train.routeStops?.[train.routeStops.length - 1]?.stationName || train.to || "");
    }
    setPassengers([{ passengerName: "", age: 30, gender: "Male", preference: "No Preference" }]);
    setError(null);
    setSubmitting(false);
    setConfirmedBookings([]);
    setConfirmedMessage("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const updatePassenger = <K extends keyof PassengerInput>(
    index: number,
    field: K,
    value: PassengerInput[K],
  ) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const addPassenger = () => {
    if (passengers.length >= 6) {
      setError("Maximum 6 passengers allowed per booking.");
      return;
    }
    setError(null);
    setPassengers((prev) => [
      ...prev,
      { passengerName: "", age: 30, gender: "Male", preference: "No Preference" },
    ]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setError(null);
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!journeyDate) {
      setError("Please select a valid journey date.");
      return false;
    }

    if (!isRunningOnSelectedDate) {
      setError(
        `Train ${train?.number || ""} does not operate on ${selectedDayShort}s. Operating days: ${trainRunningDays.join(", ")}. Please select a running day.`,
      );
      return false;
    }

    if (!fromStation || !toStation) {
      setError("Please select both boarding and destination stations.");
      return false;
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p?.passengerName.trim()) {
        setError(`Please enter name for Passenger ${i + 1}.`);
        return false;
      }
      if (!Number.isFinite(p.age) || p.age < 1 || p.age > 120) {
        setError(`Enter a valid age (1-120) for Passenger ${i + 1}.`);
        return false;
      }
    }

    setError(null);
    return true;
  };

  const proceedToSummary = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const submitBooking = async () => {
    if (!train) return;
    setSubmitting(true);
    setError(null);

    try {
      const primaryPassenger = passengers[0];
      const result = await onConfirm({
        trainId: train.id,
        journeyDate,
        fromStation,
        toStation,
        passengerName: primaryPassenger?.passengerName || "",
        age: primaryPassenger?.age || 30,
        gender: primaryPassenger?.gender || "Male",
        preference: primaryPassenger?.preference || "No Preference",
        passengers,
      });

      if (!result.booking && (!result.bookings || result.bookings.length === 0)) {
        setError(result.message || "Booking failed.");
        setStep(1);
        return;
      }

      const allBookings =
        result.bookings && result.bookings.length > 0
          ? result.bookings
          : result.booking
            ? [result.booking]
            : [];

      setConfirmedBookings(allBookings);
      setConfirmedMessage(result.message);
      setStep(3);
    } catch (err: any) {
      setError(err?.message || "Booking transaction failed.");
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const perPassengerFare = segmentDetails?.farePerPassenger || train?.fare || 0;
  const totalFare = perPassengerFare * passengers.length;
  const formattedDateWithDay = formatJourneyDate(journeyDate);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg bg-[#0f1417] text-[#dfe3e7] border border-[#4cd7f6]/30 shadow-[0_0_30px_rgba(76,215,246,0.15)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Ticket className="size-5 text-[#4cd7f6]" />
            {step === 1 && "Select Segment & Passengers"}
            {step === 2 && "Review Booking Summary"}
            {step === 3 && "Booking Confirmed!"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#909097]">
            {train
              ? `${train.number} · ${train.name} (${train.from} → ${train.to})`
              : "Select a train to continue."}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-[#909097]/20 pb-3 text-xs font-mono font-semibold">
          <span className={`flex items-center gap-1.5 ${step >= 1 ? "text-[#4cd7f6]" : "text-[#909097]"}`}>
            <span className="flex size-5 items-center justify-center rounded-full bg-[#4cd7f6]/20 text-[11px] font-bold">1</span>
            Segment & Passengers
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={`flex items-center gap-1 ${step >= 2 ? "text-teal-deep" : "text-muted-foreground"}`}>
            <span className="flex size-5 items-center justify-center rounded-full bg-teal/15 text-[11px]">2</span>
            Summary
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={`flex items-center gap-1 ${step === 3 ? "text-teal-deep" : "text-muted-foreground"}`}>
            <span className="flex size-5 items-center justify-center rounded-full bg-teal/15 text-[11px]">3</span>
            Ticket Confirmed
          </span>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: STATIONS, JOURNEY DATE & PASSENGERS */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4 py-2"
            >
              {/* Boarding & Destination Station Selector */}
              <div className="glass-panel rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-teal-deep" /> Boarding & Destination Stations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Boarding Station (From)</Label>
                    <Select
                      value={fromStation}
                      onValueChange={(val) => {
                        setFromStation(val);
                        setError(null);
                      }}
                    >
                      <SelectTrigger className="h-10 text-xs font-medium">
                        <SelectValue placeholder="Select boarding station" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {boardingOptions.map((s) => (
                          <SelectItem key={s.stationName} value={s.stationName} className="text-xs">
                            {s.stationName} ({s.departs !== "Destination" ? s.departs : s.arrives})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Destination Station (To)</Label>
                    <Select
                      value={toStation}
                      onValueChange={(val) => {
                        setToStation(val);
                        setError(null);
                      }}
                    >
                      <SelectTrigger className="h-10 text-xs font-medium">
                        <SelectValue placeholder="Select destination station" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {destinationOptions.map((s) => (
                          <SelectItem key={s.stationName} value={s.stationName} className="text-xs">
                            {s.stationName} ({s.arrives !== "Source" ? s.arrives : s.departs})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dynamically Computed Segment Timing & Distance Card */}
                {segmentDetails && (
                  <div className="rounded-lg border border-teal/30 bg-teal/5 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-teal-deep">
                      <span>⏱ Duration: {segmentDetails.duration}</span>
                      <span>📏 {segmentDetails.distance} km</span>
                      <span>₹{segmentDetails.farePerPassenger} / passenger</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-teal/20">
                      <span>Boarding: <strong>{segmentDetails.boardingTime}</strong></span>
                      <span>Arrival: <strong>{segmentDetails.arrivalTime}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Journey Date Selection */}
              <div className="glass-panel rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="jdate" className="flex items-center gap-2 font-semibold">
                    <Calendar className="size-4 text-teal-deep" /> Journey Date
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {trainRunningDays.map((d) => (
                      <Badge key={d} className="bg-teal/15 text-teal-deep text-[10px] py-0 font-semibold">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Input
                  id="jdate"
                  type="date"
                  min={todayStr}
                  value={journeyDate}
                  onChange={(e) => {
                    setJourneyDate(e.target.value);
                    setError(null);
                  }}
                  className="h-11 rounded-lg font-medium"
                />
                {formattedDateWithDay && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-teal-deep flex items-center gap-1">
                      <span>📅</span> Selected: {formattedDateWithDay}
                    </span>
                    {!isRunningOnSelectedDate && (
                      <span className="font-semibold text-destructive">
                        ⚠️ Non-operating day
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Passengers List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="size-4 text-teal-deep" /> Passenger Details ({passengers.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPassenger}
                    className="h-8 rounded-lg text-xs"
                    disabled={passengers.length >= 6}
                  >
                    <Plus className="mr-1 size-3.5" /> Add Passenger
                  </Button>
                </div>

                {passengers.map((p, idx) => (
                  <div key={idx} className="glass-panel relative rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Passenger {idx + 1}
                      </span>
                      {passengers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePassenger(idx)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor={`pname-${idx}`} className="text-xs">
                          Full Name
                        </Label>
                        <Input
                          id={`pname-${idx}`}
                          value={p.passengerName}
                          onChange={(e) => updatePassenger(idx, "passengerName", e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          autoComplete="off"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`page-${idx}`} className="text-xs">
                            Age
                          </Label>
                          <Input
                            id={`page-${idx}`}
                            type="number"
                            min="1"
                            max="120"
                            value={p.age}
                            onChange={(e) => updatePassenger(idx, "age", Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Gender</Label>
                          <Select
                            value={p.gender}
                            onValueChange={(v) => updatePassenger(idx, "gender", v as Gender)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Berth Preference</Label>
                          <Select
                            value={p.preference}
                            onValueChange={(v) =>
                              updatePassenger(idx, "preference", v as BerthPreference)
                            }
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lower">Lower</SelectItem>
                              <SelectItem value="Middle">Middle</SelectItem>
                              <SelectItem value="Upper">Upper</SelectItem>
                              <SelectItem value="No Preference">No Pref</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Fare Summary */}
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  Total Fare ({passengers.length} passenger{passengers.length > 1 ? "s" : ""})
                </span>
                <span className="font-display text-lg font-bold text-navy">
                  ₹{totalFare.toLocaleString("en-IN")}
                </span>
              </div>
            </motion.div>
          )}

          {/* STEP 2: BOOKING SUMMARY */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 py-2"
            >
              <div className="glass-panel rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs tracking-widest text-teal-deep font-semibold">
                      {train?.number}
                    </span>
                    <h4 className="text-lg font-bold">{train?.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Full Train Route: {train?.from} → {train?.to}
                    </p>
                  </div>
                  <Badge className="bg-teal/15 text-teal-deep font-semibold hover:bg-teal/15">
                    ₹{perPassengerFare} / seat
                  </Badge>
                </div>

                <div className="border-t border-border/50 pt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-deep">
                    <Navigation className="size-3.5" />
                    <span>
                      Boarding Segment: {fromStation} ({segmentDetails?.boardingTime}) → {toStation} ({segmentDetails?.arrivalTime})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>📅 Journey Date: {formattedDateWithDay}</span>
                    <span>⏱ {segmentDetails?.duration} · {segmentDetails?.distance} km</span>
                  </div>
                </div>
              </div>

              {/* Passenger List Review */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Passenger Breakdown ({passengers.length})
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {passengers.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{p.passengerName}</span>
                        <span className="ml-2 text-muted-foreground">
                          ({p.age} yrs · {p.gender})
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[11px]">
                        Pref: {p.preference}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Allocation Notice */}
              <div className="rounded-xl border border-teal/30 bg-teal/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <Sparkles className="size-4 text-teal-deep shrink-0 mt-0.5" />
                <p>
                  <strong className="text-teal-deep font-semibold">Smart Allocation:</strong> Senior
                  passengers (higher age) are automatically prioritized for Lower berth requests.
                  If preferred berths are full, alternative open berths are automatically assigned.
                </p>
              </div>

              {/* Total Fare Card */}
              <div className="glass-panel flex items-center justify-between rounded-xl p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Fare Payable</p>
                  <p className="font-display text-2xl font-bold text-navy">
                    ₹{totalFare.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {passengers.length} Passenger{passengers.length > 1 ? "s" : ""}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TICKET CONFIRMATION & PNR DETAILS */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 py-2"
            >
              <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4 text-center space-y-1">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-teal-deep text-white shadow-lg shadow-teal-deep/30">
                  <CheckCircle2 className="size-6" />
                </div>
                <h4 className="text-lg font-bold text-foreground">Reservation Successful</h4>
                <p className="text-xs text-muted-foreground">{confirmedMessage}</p>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {confirmedBookings.map((b, idx) => (
                  <div
                    key={b.id}
                    className="glass-panel relative overflow-hidden rounded-xl p-4 border border-border/80 space-y-2"
                  >
                    <span className="teal-gradient absolute inset-y-0 left-0 w-1" />
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-semibold text-teal-deep tracking-wider">
                          PNR: {b.pnr}
                        </span>
                        <h5 className="font-bold text-sm text-foreground">{b.passengerName}</h5>
                        <p className="text-xs text-muted-foreground">
                          {b.age} yrs · {b.gender}
                        </p>
                      </div>
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
                    </div>

                    <div className="border-t border-border/40 pt-2 flex flex-wrap items-center justify-between text-xs gap-2">
                      <div>
                        <span className="text-muted-foreground">Boarding → Destination:</span>
                        <p className="font-semibold text-foreground">
                          {b.fromStation || fromStation} → {b.toStation || toStation}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">Status / Seat:</span>
                        <p className="font-semibold text-foreground">
                          {b.status === "CONFIRMED"
                            ? `Seat ${b.seatNumber} (${b.berth})`
                            : `Queue #${b.queuePosition}`}
                        </p>
                      </div>
                    </div>

                    {b.journeyDate && (
                      <div className="text-[11px] text-teal-deep font-semibold flex items-center justify-between border-t border-border/30 pt-1">
                        <span>📅 {formatJourneyDate(b.journeyDate)}</span>
                        <span>₹{b.fare}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-1">
                <ShieldCheck className="size-4 text-teal-deep" />
                <span>Tickets synced to your passenger account & dashboard.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-center text-xs font-semibold text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="flex flex-row items-center justify-between pt-2 gap-2">
          {step === 1 && (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={proceedToSummary}>
                Review Summary <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={submitting}>
                <ArrowLeft className="mr-1.5 size-4" /> Edit Details
              </Button>
              <Button type="button" onClick={submitBooking} disabled={submitting}>
                {submitting ? "Processing..." : "Confirm & Pay"}
              </Button>
            </>
          )}

          {step === 3 && (
            <div className="flex flex-col sm:flex-row w-full gap-2.5">
              <Button
                type="button"
                className="w-full sm:flex-1 bg-[#4cd7f6] text-[#0f1417] font-extrabold glow-button hover:bg-[#4cd7f6]/90 rounded-xl"
                onClick={() => {
                  handleOpenChange(false);
                  onViewTickets?.();
                }}
              >
                <Ticket className="mr-1.5 size-4" /> View Booking / Tickets
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto border-[#909097]/30 text-[#dfe3e7] rounded-xl font-semibold"
                onClick={() => handleOpenChange(false)}
              >
                Done & Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
