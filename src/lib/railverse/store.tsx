import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { defaultState, book as bookEngine, cancel as cancelEngine } from "./engine";
import type { BookInput } from "./engine";
import type { Booking, RailState, Train } from "./types";
import { useAuth } from "./auth";

interface Ctx {
  state: RailState;
  hydrated: boolean;
  loading: boolean;
  book: (
    input: BookInput,
  ) => Promise<{ booking: Booking | null; bookings?: Booking[]; message: string }>;
  cancel: (bookingId: string) => Promise<void>;
  addTrain: (train: Omit<Train, "id">) => Promise<void>;
  updateTrain: (train: Train) => Promise<void>;
  deleteTrain: (id: string) => Promise<void>;
  reset: () => Promise<void>;
  refetch: () => Promise<void>;
}

const RailContext = createContext<Ctx | null>(null);

function getLocalState(): RailState {
  const def = defaultState();
  try {
    if (typeof window === "undefined") return def;
    const raw =
      localStorage.getItem("travia_state") || localStorage.getItem("railverse_state");
    if (raw) {
      const parsed = JSON.parse(raw) as RailState;
      const existingNumbers = new Set((parsed.trains || []).map((t) => t.number));
      const missingFromDef = def.trains.filter((t) => !existingNumbers.has(t.number));
      const mergedTrains = [...(parsed.trains || []), ...missingFromDef];
      const mergedState = {
        trains: mergedTrains,
        bookings: parsed.bookings || [],
      };
      saveLocalState(mergedState);
      return mergedState;
    }
  } catch {}
  saveLocalState(def);
  return def;
}

function saveLocalState(st: RailState) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem("travia_state", JSON.stringify(st));
    localStorage.setItem("railverse_state", JSON.stringify(st));
  } catch {}
}

import { KAGGLE_TRAIN_DATASET } from "./dataset";
import { calculateDuration } from "./engine";

function mapTrain(t: any): Train {
  const matchDataset = KAGGLE_TRAIN_DATASET.find((k) => k.trainNumber === t.number);
  const routeStops = t.route_stops || t.routeStops || matchDataset?.trainRoute;
  const runningDays = t.running_days ||
    t.runningDays ||
    matchDataset?.runningDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dep = t.departure || matchDataset?.departureTime || "08:00";
  const arr = t.arrival || matchDataset?.arrivalTime || "20:00";
  const duration = t.duration || calculateDuration(dep, arr, routeStops);

  return {
    id: t.id,
    number: t.number,
    name: t.name,
    from: t.from_station || t.from || matchDataset?.trainRoute[0]?.stationName || "Origin",
    to:
      t.to_station ||
      t.to ||
      matchDataset?.trainRoute[matchDataset.trainRoute.length - 1]?.stationName ||
      "Destination",
    departure: dep,
    arrival: arr,
    fare: Number(t.fare),
    seats: Number(t.seats),
    racTotal: Number(t.rac_total ?? t.racTotal),
    wlTotal: Number(t.wl_total ?? t.wlTotal),
    runningDays,
    routeStops,
    duration,
  };
}

function mapBooking(b: any): Booking {
  return {
    id: b.id,
    pnr: b.pnr,
    userId: b.user_id || b.userId || undefined,
    trainId: b.train_id || b.trainId,
    passengerName: b.passenger_name || b.passengerName,
    age: Number(b.age),
    gender: b.gender,
    preference: b.preference,
    status: b.status,
    seatNumber:
      b.seat_number != null
        ? Number(b.seat_number)
        : b.seatNumber != null
          ? Number(b.seatNumber)
          : null,
    berth: b.berth,
    queuePosition:
      b.queue_position != null
        ? Number(b.queue_position)
        : b.queuePosition != null
          ? Number(b.queuePosition)
          : null,
    fare: Number(b.fare),
    journeyDate: b.journey_date || b.journeyDate || new Date().toISOString().split("T")[0],
    fromStation: b.from_station || b.fromStation,
    toStation: b.to_station || b.toStation,
    boardingTime: b.boarding_time || b.boardingTime,
    arrivalTime: b.arrival_time || b.arrivalTime,
    createdAt: b.created_at || b.createdAt || new Date().toISOString(),
  };
}

export function RailProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<RailState>({ trains: [], bookings: [] });
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      const bookingsQuery =
        user?.role === "admin"
          ? supabase.from("bookings").select("*").order("created_at", { ascending: true })
          : user?.id
            ? supabase
                .from("bookings")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true })
            : Promise.resolve({ data: [], error: null });

      const [trainsRes, bookingsRes] = await Promise.all([
        supabase.from("trains").select("*").order("created_at", { ascending: true }),
        bookingsQuery,
      ]);

      if (!trainsRes.error && trainsRes.data) {
        const dbTrains = trainsRes.data.map(mapTrain);
        const dbNumbers = new Set(dbTrains.map((t) => t.number));
        const def = defaultState();
        const missingFromDef = def.trains.filter((t) => !dbNumbers.has(t.number));
        const trains = [...dbTrains, ...missingFromDef];

        const bookings = ((bookingsRes as any).data || []).map(mapBooking);
        const newState = { trains, bookings };
        setState(newState);
        saveLocalState(newState);
        return;
      }
    } catch (err) {
      console.warn("[RailStore] Supabase load error, using local state persistence:", err);
    } finally {
      setLoading(false);
      setHydrated(true);
    }

    // Fallback to local state persistence
    const local = getLocalState();
    setState(local);
  }, [user?.id, user?.role]);

  useEffect(() => {
    fetchState();

    let channel: any;
    try {
      channel = supabase
        .channel("public:travia")
        .on("postgres_changes", { event: "*", schema: "public", table: "trains" }, () =>
          fetchState(),
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () =>
          fetchState(),
        )
        .subscribe();
    } catch {}

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {}
    };
  }, [fetchState]);

  const book = useCallback(
    async (
      input: BookInput,
    ): Promise<{ booking: Booking | null; bookings?: Booking[]; message: string }> => {
      const currentUserId = user?.id;
      // Execute smart berth allocation via engine with current user ID
      const engineResult = bookEngine(state, {
        ...input,
        userId: currentUserId,
      });
      if (!engineResult.booking)
        return { booking: null, bookings: [], message: engineResult.message };

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUid = sessionData?.session?.user?.id || currentUserId;

        if (authUid && engineResult.bookings.length > 0) {
          const insertPayloads = engineResult.bookings.map((b) => ({
            id: b.id,
            pnr: b.pnr,
            user_id: authUid,
            train_id: b.trainId,
            passenger_name: b.passengerName,
            age: b.age,
            gender: b.gender,
            preference: b.preference,
            status: b.status,
            seat_number: b.seatNumber,
            berth: b.berth,
            queue_position: b.queuePosition,
            fare: b.fare,
            journey_date: b.journeyDate || new Date().toISOString().split("T")[0]!,
            from_station: b.fromStation ?? null,
            to_station: b.toStation ?? null,
            boarding_time: b.boardingTime ?? null,
            arrival_time: b.arrivalTime ?? null,
          }));

          await (supabase.from("bookings").insert(insertPayloads as any) as any);
        }
      } catch {}

      setState(engineResult.state);
      saveLocalState(engineResult.state);
      return {
        booking: engineResult.booking,
        bookings: engineResult.bookings,
        message: engineResult.message,
      };
    },
    [state, user?.id],
  );

  const cancel = useCallback(
    async (bookingId: string): Promise<void> => {
      try {
        const { error } = await supabase.rpc("cancel_ticket", {
          p_booking_id: bookingId,
        });

        if (!error) {
          await fetchState();
          return;
        }
      } catch {}

      // Fallback local cancellation execution
      const updatedState = cancelEngine(state, bookingId);
      setState(updatedState);
      saveLocalState(updatedState);
    },
    [state, fetchState],
  );

  const addTrain = useCallback(
    async (train: Omit<Train, "id">): Promise<void> => {
      try {
        const { error } = await supabase.from("trains").insert({
          number: train.number,
          name: train.name,
          from_station: train.from,
          to_station: train.to,
          departure: train.departure,
          arrival: train.arrival,
          fare: train.fare,
          seats: train.seats,
          rac_total: train.racTotal,
          wl_total: train.wlTotal,
        });

        if (!error) {
          await fetchState();
          return;
        }
      } catch {}

      // Fallback local add train execution
      const newTrain: Train = {
        ...train,
        id: `T-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      };
      const nextState = { ...state, trains: [...state.trains, newTrain] };
      setState(nextState);
      saveLocalState(nextState);
    },
    [state, fetchState],
  );

  const updateTrain = useCallback(
    async (train: Train): Promise<void> => {
      try {
        const { error } = await supabase
          .from("trains")
          .update({
            number: train.number,
            name: train.name,
            from_station: train.from,
            to_station: train.to,
            departure: train.departure,
            arrival: train.arrival,
            fare: train.fare,
            seats: train.seats,
            rac_total: train.racTotal,
            wl_total: train.wlTotal,
          })
          .eq("id", train.id);

        if (!error) {
          await fetchState();
          return;
        }
      } catch {}

      // Fallback local update train execution
      const nextState = {
        ...state,
        trains: state.trains.map((t) => (t.id === train.id ? train : t)),
      };
      setState(nextState);
      saveLocalState(nextState);
    },
    [state, fetchState],
  );

  const deleteTrain = useCallback(
    async (id: string): Promise<void> => {
      try {
        const { error } = await supabase.from("trains").delete().eq("id", id);
        if (!error) {
          await fetchState();
          return;
        }
      } catch {}

      // Fallback local delete train execution
      const nextState = {
        ...state,
        trains: state.trains.filter((t) => t.id !== id),
      };
      setState(nextState);
      saveLocalState(nextState);
    },
    [state, fetchState],
  );

  const reset = useCallback(async (): Promise<void> => {
    const fresh = defaultState();
    setState(fresh);
    saveLocalState(fresh);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      loading,
      book,
      cancel,
      addTrain,
      updateTrain,
      deleteTrain,
      reset,
      refetch: fetchState,
    }),
    [state, hydrated, loading, book, cancel, addTrain, updateTrain, deleteTrain, reset, fetchState],
  );

  return <RailContext.Provider value={value}>{children}</RailContext.Provider>;
}

export function useRail() {
  const ctx = useContext(RailContext);
  if (!ctx) throw new Error("useRail must be used inside RailProvider");
  return ctx;
}
