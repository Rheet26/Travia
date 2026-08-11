import { auth, defineMcp } from "@lovable.dev/mcp-js";
import type { McpDefinitionInput } from "@lovable.dev/mcp-js";
import listTrains from "./tools/list-trains";
import simulateBookings from "./tools/simulate-bookings";
import reservationRules from "./tools/reservation-rules";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "remix-of-railverse-modern-train-experience",
  title: "Remix of RailVerse: Modern Train Experience",
  version: "0.1.0",
  instructions:
    "Tools for RailVerse, a railway reservation suite. Use `list_trains` for the timetable, `simulate_bookings` to see how seats, RAC, and waitlist fill for a train, and `explain_reservation_rules` for the allocation logic.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTrains, simulateBookings, reservationRules] as McpDefinitionInput["tools"],
});
