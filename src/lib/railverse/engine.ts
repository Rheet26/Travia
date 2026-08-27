import { KAGGLE_TRAIN_DATASET } from "./dataset";
import type {
  Berth,
  BerthPreference,
  Booking,
  Gender,
  RailState,
  Train,
  TrainStop,
} from "./types";

export const BERTHS: Berth[] = ["Lower", "Middle", "Upper"];

export const berthForSeat = (seatNumber: number): Berth =>
  BERTHS[(seatNumber - 1) % 3] as Berth;

const rid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const makeTrain = (t: Omit<Train, "id">): Train => ({ ...t, id: `T-${rid()}` });

export function calculateDuration(dep: string, arr: string, stops?: TrainStop[]): string {
  if (stops && stops.length >= 2) {
    const first = stops[0];
    const last = stops[stops.length - 1];
    const dayDiff = (last.day || 1) - (first.day || 1);
    const [depH, depM] = dep.split(":").map(Number);
    const [arrH, arrM] = arr.split(":").map(Number);
    if (depH != null && depM != null && arrH != null && arrM != null) {
      let depMins = depH * 60 + depM;
      let arrMins = dayDiff * 24 * 60 + arrH * 60 + arrM;
      let diff = arrMins - depMins;
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h}h ${m}m`;
    }
  }

  const [depH, depM] = dep.split(":").map(Number);
  const [arrH, arrM] = arr.split(":").map(Number);
  if (depH != null && depM != null && arrH != null && arrM != null) {
    let diff = arrH * 60 + arrM - (depH * 60 + depM);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  }

  return "12h 00m";
}

export const defaultState = (): RailState => {
  const seenNumbers = new Set<string>();
  const trains: Train[] = [];

  for (const t of KAGGLE_TRAIN_DATASET) {
    if (seenNumbers.has(t.trainNumber)) continue;
    seenNumbers.add(t.trainNumber);

    const origin = t.trainRoute[0]?.stationName || t.route.split("→")[0]?.trim() || "Origin";
    const dest = t.trainRoute[t.trainRoute.length - 1]?.stationName || t.route.split("→")[1]?.trim() || "Destination";
    const duration = calculateDuration(t.departureTime, t.arrivalTime, t.trainRoute);

    trains.push(
      makeTrain({
        number: t.trainNumber,
        name: t.trainName,
        from: origin,
        to: dest,
        departure: t.departureTime,
        arrival: t.arrivalTime,
        fare: t.fare,
        seats: t.seats,
        racTotal: t.racTotal,
        wlTotal: t.wlTotal,
        runningDays: t.runningDays,
        routeStops: t.trainRoute,
        duration,
      }),
    );
  }

  return { trains, bookings: [] };
};

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

export interface SegmentDetails {
  fromStation: string;
  toStation: string;
  boardingTime: string;
  arrivalTime: string;
  distance: number;
  duration: string;
  farePerPassenger: number;
}

export function calculateSegmentDetails(
  train: Train,
  fromStationStr?: string,
  toStationStr?: string,
): SegmentDetails {
  const stops = train.routeStops || [];
  const defaultOrigin = stops[0]?.stationName || train.from;
  const defaultDest = stops[stops.length - 1]?.stationName || train.to;

  const actualFrom = fromStationStr || defaultOrigin;
  const actualTo = toStationStr || defaultDest;

  if (!stops || stops.length < 2) {
    return {
      fromStation: actualFrom,
      toStation: actualTo,
      boardingTime: train.departure,
      arrivalTime: train.arrival,
      distance: 500,
      duration: train.duration || "12h 00m",
      farePerPassenger: train.fare,
    };
  }

  const fromIdx = stops.findIndex((s) => s.stationName === actualFrom);
  const toIdx = stops.findIndex((s) => s.stationName === actualTo);

  if (fromIdx === -1 || toIdx === -1 || toIdx <= fromIdx) {
    const first = stops[0]!;
    const last = stops[stops.length - 1]!;
    return {
      fromStation: first.stationName,
      toStation: last.stationName,
      boardingTime: first.departs !== "Destination" ? first.departs : first.arrives,
      arrivalTime: last.arrives !== "Source" ? last.arrives : last.departs,
      distance: Math.max(0, last.distance - first.distance),
      duration: calculateDuration(first.departs, last.arrives, stops),
      farePerPassenger: train.fare,
    };
  }

  const fromStop = stops[fromIdx]!;
  const toStop = stops[toIdx]!;
  const boardingTime = fromStop.departs !== "Destination" ? fromStop.departs : fromStop.arrives;
  const arrivalTime = toStop.arrives !== "Source" ? toStop.arrives : toStop.departs;
  const distance = Math.max(0, toStop.distance - fromStop.distance);

  const segmentStops = stops.slice(fromIdx, toIdx + 1);
  const duration = calculateDuration(boardingTime, arrivalTime, segmentStops);

  const totalDist = Math.max(1, (stops[stops.length - 1]?.distance || 1) - (stops[0]?.distance || 0));
  const distRatio = distance / totalDist;
  const farePerPassenger = Math.max(150, Math.round(train.fare * Math.max(0.4, distRatio)));

  return {
    fromStation: actualFrom,
    toStation: actualTo,
    boardingTime,
    arrivalTime,
    distance,
    duration,
    farePerPassenger,
  };
}

export interface PassengerInput {
  passengerName: string;
  age: number;
  gender: Gender;
  preference: BerthPreference;
}

export interface BookInput {
  trainId: string;
  journeyDate?: string;
  fromStation?: string;
  toStation?: string;
  passengerName?: string;
  age?: number;
  gender?: Gender;
  preference?: BerthPreference;
  passengers?: PassengerInput[];
}

export const book = (
  state: RailState,
  input: BookInput,
): { state: RailState; booking: Booking | null; bookings: Booking[]; message: string } => {
  const train = state.trains.find((t) => t.id === input.trainId);
  if (!train) return { state, booking: null, bookings: [], message: "Train not found" };

  const segment = calculateSegmentDetails(train, input.fromStation, input.toStation);

  const passengerList: PassengerInput[] =
    input.passengers && input.passengers.length > 0
      ? input.passengers
      : [
          {
            passengerName: input.passengerName || "Passenger",
            age: input.age || 30,
            gender: input.gender || "Male",
            preference: input.preference || "No Preference",
          },
        ];

  const journeyDate =
    input.journeyDate || new Date().toISOString().split("T")[0];

  const counts = countsFor(state, train);
  const totalCapacityLeft = counts.seatsLeft + counts.racLeft + counts.wlLeft;

  if (passengerList.length > totalCapacityLeft) {
    return {
      state,
      booking: null,
      bookings: [],
      message: `Booking closed — only ${totalCapacityLeft} spot(s) remaining for RAC / Waitlist.`,
    };
  }

  const pnr = `${train.number.slice(0, 3)}${Math.floor(1000000 + Math.random() * 8999999)}`;
  const takenSeats = new Set(
    activeFor(state.bookings, train.id)
      .filter((b) => b.status === "CONFIRMED" && b.seatNumber !== null)
      .map((b) => b.seatNumber as number),
  );

  let freeSeats: number[] = [];
  for (let s = 1; s <= train.seats; s++) {
    if (!takenSeats.has(s)) freeSeats.push(s);
  }

  // Create indexed passengers and sort by age descending for smart berth allocation priority
  // Senior passengers get priority for requested berths (e.g. Lower berth)
  const indexedPassengers = passengerList.map((p, originalIndex) => ({
    ...p,
    originalIndex,
  }));

  const sortedForAllocation = [...indexedPassengers].sort((a, b) => b.age - a.age);

  const allocatedMap = new Map<
    number,
    { status: "CONFIRMED" | "RAC" | "WAITLIST"; seatNumber: number | null; berth: Berth | null; queuePosition: number | null }
  >();

  let currentRac = counts.rac;
  let currentWl = counts.wl;

  for (const passenger of sortedForAllocation) {
    if (freeSeats.length > 0) {
      // Preferred berth allocation
      let chosenSeatIndex = -1;
      if (passenger.preference !== "No Preference") {
        chosenSeatIndex = freeSeats.findIndex((s) => berthForSeat(s) === passenger.preference);
      }

      // Fallback: pick the closest/lowest available seat if preferred berth is unavailable
      if (chosenSeatIndex === -1) {
        chosenSeatIndex = 0;
      }

      const seatNumber = freeSeats[chosenSeatIndex] as number;
      freeSeats.splice(chosenSeatIndex, 1);

      allocatedMap.set(passenger.originalIndex, {
        status: "CONFIRMED",
        seatNumber,
        berth: berthForSeat(seatNumber),
        queuePosition: null,
      });
    } else if (counts.racTotal > currentRac) {
      currentRac++;
      allocatedMap.set(passenger.originalIndex, {
        status: "RAC",
        seatNumber: null,
        berth: null,
        queuePosition: currentRac,
      });
    } else {
      currentWl++;
      allocatedMap.set(passenger.originalIndex, {
        status: "WAITLIST",
        seatNumber: null,
        berth: null,
        queuePosition: currentWl,
      });
    }
  }

  const newBookings: Booking[] = passengerList.map((p, idx) => {
    const alloc = allocatedMap.get(idx)!;
    return {
      id: `BK-${Date.now().toString(36).toUpperCase()}-${rid()}-${idx + 1}`,
      pnr,
      trainId: train.id,
      passengerName: p.passengerName.trim(),
      age: p.age,
      gender: p.gender,
      preference: p.preference,
      status: alloc.status,
      seatNumber: alloc.seatNumber,
      berth: alloc.berth,
      queuePosition: alloc.queuePosition,
      fare: segment.farePerPassenger,
      journeyDate,
      fromStation: segment.fromStation,
      toStation: segment.toStation,
      boardingTime: segment.boardingTime,
      arrivalTime: segment.arrivalTime,
      createdAt: new Date().toISOString(),
    };
  });

  const nextState = renumberQueues(
    { ...state, bookings: [...state.bookings, ...newBookings] },
    train.id,
  );

  const confirmedCount = newBookings.filter((b) => b.status === "CONFIRMED").length;
  const racCount = newBookings.filter((b) => b.status === "RAC").length;
  const wlCount = newBookings.filter((b) => b.status === "WAITLIST").length;

  let summaryMsg = `Booked ${newBookings.length} ticket(s) for PNR ${pnr}.`;
  if (confirmedCount > 0) summaryMsg += ` ${confirmedCount} Confirmed.`;
  if (racCount > 0) summaryMsg += ` ${racCount} RAC.`;
  if (wlCount > 0) summaryMsg += ` ${wlCount} Waitlist.`;

  return {
    state: nextState,
    booking: newBookings[0] || null,
    bookings: newBookings,
    message: summaryMsg,
  };
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
