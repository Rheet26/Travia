import { defineTool } from "@lovable.dev/mcp-js";

const RULES = `Travia reservation rules:
1. Seats are allocated lowest-numbered first. Berth type cycles Lower, Middle, Upper by seat number ((seat - 1) % 3).
2. A berth preference is honoured when a matching free seat exists, otherwise the lowest free seat is used.
3. When all seats are taken, bookings enter the RAC queue up to the train's RAC capacity, then the waitlist up to its waitlist capacity. Beyond that, booking is closed.
4. On cancellation, the engine promotes RAC to CONFIRMED while seats are free, then waitlist to RAC while RAC capacity is free, and renumbers both queues.
5. Queue positions are always contiguous and start at 1 per train.`;

export default defineTool({
  name: "explain_reservation_rules",
  title: "Explain reservation rules",
  description:
    "Explain how Travia allocates seats and berths and how RAC and waitlist promotion works.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({ content: [{ type: "text", text: RULES }] }),
});
