export type Berth = "Lower" | "Middle" | "Upper";
export type BerthPreference = Berth | "No Preference";
export type Gender = "Male" | "Female" | "Other";
export type BookingStatus = "CONFIRMED" | "RAC" | "WAITLIST" | "CANCELLED";

export interface TrainStop {
  stationName: string;
  arrives: string;
  departs: string;
  distance: number;
  day: number;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  fare: number;
  seats: number;
  racTotal: number;
  wlTotal: number;
  runningDays?: string[];
  routeStops?: TrainStop[];
  duration?: string;
}

export interface PassengerInput {
  passengerName: string;
  age: number;
  gender: Gender;
  preference: BerthPreference;
}

export interface Booking {
  id: string;
  pnr: string;
  userId?: string | undefined;
  trainId: string;
  passengerName: string;
  age: number;
  gender: Gender;
  preference: BerthPreference;
  status: BookingStatus;
  seatNumber: number | null;
  berth: Berth | null;
  queuePosition: number | null;
  fare: number;
  journeyDate?: string | undefined;
  fromStation?: string | undefined;
  toStation?: string | undefined;
  boardingTime?: string | undefined;
  arrivalTime?: string | undefined;
  createdAt: string;
}

export interface RailState {
  trains: Train[];
  bookings: Booking[];
}
