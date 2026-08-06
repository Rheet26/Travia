export type Berth = "Lower" | "Middle" | "Upper";
export type BerthPreference = Berth | "No Preference";
export type Gender = "Male" | "Female" | "Other";
export type BookingStatus = "CONFIRMED" | "RAC" | "WAITLIST" | "CANCELLED";

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
}

export interface Booking {
  id: string;
  pnr: string;
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
  createdAt: string;
}

export interface RailState {
  trains: Train[];
  bookings: Booking[];
}
