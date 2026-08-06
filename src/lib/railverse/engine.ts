import type {
  Berth,
  BerthPreference,
  Booking,
  Gender,
  RailState,
  Train,
} from "./types";

export const BERTHS: Berth[] = ["Lower", "Middle", "Upper"];

export const berthForSeat = (seatNumber: number): Berth =>
  BERTHS[(seatNumber - 1) % 3] as Berth;

const rid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const makeTrain = (t: Omit<Train, "id">): Train => ({ ...t, id: `T-${rid()}` });

export const defaultState = (): RailState => ({
  trains: [
    makeTrain({
      number: "12951",
      name: "Rajdhani Express",
      from: "Mumbai Central",
      to: "New Delhi",
      departure: "17:00",
      arrival: "08:35",
      fare: 2450,
      seats: 6,
      racTotal: 3,
      wlTotal: 5,
    }),
    makeTrain({
      number: "12002",
      name: "Shatabdi Express",
      from: "New Delhi",
      to: "Bhopal",
      departure: "06:00",
      arrival: "14:05",
      fare: 1320,
      seats: 8,
      racTotal: 2,
      wlTotal: 6,
    }),
    makeTrain({
      number: "12626",
      name: "Kerala Express",
      from: "New Delhi",
      to: "Thiruvananthapuram",
      departure: "11:25",
      arrival: "05:15",
      fare: 1890,
      seats: 5,
      racTotal: 3,
      wlTotal: 4,
    }),
  ],
  bookings: [],
});

export const activeFor = (bookings: Booking[], trainId: string) =>
  bookings.filter((b) => b.trainId === trainId && b.status !== "CANCELLED");

export const countsFor = (state: RailState, train: Train) => {
  const active = activeFor(state.bookings, train.id);
  const confirmed = active.filter((b) => b.status === "CONFIRMED").length;
  const rac = active.filter((b) => b.status === "RAC").length;
  const wl = active.filter((b) => b.status === "WAITLIST").length;
  return {
    confirmed,
    rac,
    wl,
    seatsLeft: Math.max(0, train.seats - confirmed),
    racLeft: Math.max(0, train.racTotal - rac),
    wlLeft: Math.max(0, train.wlTotal - wl),
  };
};

/** Pick the lowest free seat, honouring berth preference when possible. */
const allocateSeat = (
  train: Train,
  bookings: Booking[],
  preference: BerthPreference,
): { seatNumber: number; berth: Berth } | null => {
  const taken = new Set(
    activeFor(bookings, train.id)
      .filter((b) => b.status === "CONFIRMED" && b.seatNumber !== null)
      .map((b) => b.seatNumber as number),
  );
  const free: number[] = [];
  for (let s = 1; s <= train.seats; s++) if (!taken.has(s)) free.push(s);
  if (free.length === 0) return null;
  const preferred =
    preference !== "No Preference"
      ? free.find((s) => berthForSeat(s) === preference)
      : undefined;
  const seatNumber = preferred ?? (free[0] as number);
  return { seatNumber, berth: berthForSeat(seatNumber) };
};

const renumberQueues = (state: RailState, trainId: string): RailState => {
  let racPos = 0;
  let wlPos = 0;
  const bookings = state.bookings.map((b) => {
    if (b.trainId !== trainId || b.status === "CANCELLED" || b.status === "CONFIRMED")
      return b;
    if (b.status === "RAC") return { ...b, queuePosition: ++racPos };
    return { ...b, queuePosition: ++wlPos };
  });
  return { ...state, bookings };
};

/** Promote RAC -> CONFIRMED and WAITLIST -> RAC wherever capacity allows. */
export const promote = (state: RailState, trainId: string): RailState => {
  const train = state.trains.find((t) => t.id === trainId);
  if (!train) return state;
  let next = { ...state, bookings: [...state.bookings] };

  // RAC -> CONFIRMED
  for (;;) {
    const counts = countsFor(next, train);
    if (counts.seatsLeft <= 0) break;
    const idx = next.bookings.findIndex(
      (b) => b.trainId === trainId && b.status === "RAC",
    );
    if (idx === -1) break;
    const candidate = next.bookings[idx] as Booking;
    const seat = allocateSeat(train, next.bookings, candidate.preference);
    if (!seat) break;
    next.bookings[idx] = {
      ...candidate,
      status: "CONFIRMED",
      seatNumber: seat.seatNumber,
      berth: seat.berth,
      queuePosition: null,
    };
  }

  // WAITLIST -> RAC
  for (;;) {
    const counts = countsFor(next, train);
    if (counts.racLeft <= 0) break;
    const idx = next.bookings.findIndex(
      (b) => b.trainId === trainId && b.status === "WAITLIST",
    );
    if (idx === -1) break;
    const candidate = next.bookings[idx] as Booking;
    next.bookings[idx] = { ...candidate, status: "RAC" };
  }

  return renumberQueues(next, trainId);
};

export interface BookInput {
  trainId: string;
  passengerName: string;
  age: number;
  gender: Gender;
  preference: BerthPreference;
}

export const book = (
  state: RailState,
  input: BookInput,
): { state: RailState; booking: Booking | null; message: string } => {
  const train = state.trains.find((t) => t.id === input.trainId);
  if (!train) return { state, booking: null, message: "Train not found" };
  const counts = countsFor(state, train);

  const base: Omit<Booking, "status" | "seatNumber" | "berth" | "queuePosition"> = {
    id: `BK-${Date.now().toString(36).toUpperCase()}-${rid()}`,
    pnr: `${train.number.slice(0, 3)}${Math.floor(1000000 + Math.random() * 8999999)}`,
    trainId: train.id,
    passengerName: input.passengerName.trim(),
    age: input.age,
    gender: input.gender,
    preference: input.preference,
    fare: train.fare,
    createdAt: new Date().toISOString(),
  };

  let booking: Booking;
  if (counts.seatsLeft > 0) {
    const seat = allocateSeat(train, state.bookings, input.preference);
    if (!seat) return { state, booking: null, message: "No seats available" };
    booking = {
      ...base,
      status: "CONFIRMED",
      seatNumber: seat.seatNumber,
      berth: seat.berth,
      queuePosition: null,
    };
  } else if (counts.racLeft > 0) {
    booking = {
      ...base,
      status: "RAC",
      seatNumber: null,
      berth: null,
      queuePosition: counts.rac + 1,
    };
  } else if (counts.wlLeft > 0) {
    booking = {
      ...base,
      status: "WAITLIST",
      seatNumber: null,
      berth: null,
      queuePosition: counts.wl + 1,
    };
  } else {
    return { state, booking: null, message: "Booking closed — no RAC or waitlist left" };
  }

  const next = renumberQueues(
    { ...state, bookings: [...state.bookings, booking] },
    train.id,
  );
  const message =
    booking.status === "CONFIRMED"
      ? `Confirmed · Seat ${booking.seatNumber} (${booking.berth})`
      : `${booking.status} position ${booking.queuePosition}`;
  return { state: next, booking, message };
};

export const cancel = (state: RailState, bookingId: string): RailState => {
  const target = state.bookings.find((b) => b.id === bookingId);
  if (!target || target.status === "CANCELLED") return state;
  const cleared: RailState = {
    ...state,
    bookings: state.bookings.map((b) =>
      b.id === bookingId
        ? { ...b, status: "CANCELLED", seatNumber: null, berth: null, queuePosition: null }
        : b,
    ),
  };
  return promote(cleared, target.trainId);
};
