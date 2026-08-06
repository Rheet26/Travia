import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { book as bookFn, cancel as cancelFn, defaultState, promote } from "./engine";
import type { BookInput } from "./engine";
import type { Booking, RailState, Train } from "./types";

const KEY = "railverse.state.v1";

interface Ctx {
  state: RailState;
  hydrated: boolean;
  book: (input: BookInput) => { booking: Booking | null; message: string };
  cancel: (bookingId: string) => void;
  addTrain: (train: Train) => void;
  updateTrain: (train: Train) => void;
  deleteTrain: (id: string) => void;
  reset: () => void;
}

const RailContext = createContext<Ctx | null>(null);

export function RailProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RailState>(() => defaultState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw) as RailState);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const book = useCallback((input: BookInput) => {
    let result: { booking: Booking | null; message: string } = {
      booking: null,
      message: "",
    };
    setState((prev) => {
      const r = bookFn(prev, input);
      result = { booking: r.booking, message: r.message };
      return r.state;
    });
    return result;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      book,
      cancel: (id) => setState((prev) => cancelFn(prev, id)),
      addTrain: (train) =>
        setState((prev) => ({ ...prev, trains: [...prev.trains, train] })),
      updateTrain: (train) =>
        setState((prev) =>
          promote(
            { ...prev, trains: prev.trains.map((t) => (t.id === train.id ? train : t)) },
            train.id,
          ),
        ),
      deleteTrain: (id) =>
        setState((prev) => ({
          trains: prev.trains.filter((t) => t.id !== id),
          bookings: prev.bookings.filter((b) => b.trainId !== id),
        })),
      reset: () => setState(defaultState()),
    }),
    [state, hydrated, book],
  );

  return <RailContext.Provider value={value}>{children}</RailContext.Provider>;
}

export function useRail() {
  const ctx = useContext(RailContext);
  if (!ctx) throw new Error("useRail must be used inside RailProvider");
  return ctx;
}
