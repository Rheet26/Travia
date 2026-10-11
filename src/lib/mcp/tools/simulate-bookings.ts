import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { book, defaultState } from "@/lib/railverse/engine";
import type { RailState } from "@/lib/railverse/types";

export default defineTool({
  name: "simulate_bookings",
  title: "Simulate bookings",
  description:
    "Run Travia's seat allocation engine for a train: books N passengers in sequence and reports each resulting status (CONFIRMED with seat and berth, RAC, or WAITLIST position).",
  inputSchema: {
    trainNumber: z.string().describe("Train number from list_trains, e.g. 12951."),
    passengers: z.number().int().describe("How many passengers to book in sequence (1-50)."),
    preference: z
      .enum(["Lower", "Middle", "Upper", "No Preference"])
      .optional()
      .describe("Berth preference applied to every simulated passenger."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ trainNumber, passengers, preference }) => {
    const count = Math.min(Math.max(Math.trunc(passengers), 1), 50);
    let state: RailState = defaultState();
    const train = state.trains.find((t) => t.number === trainNumber.trim());
    if (!train) throw new ToolError(`No train with number "${trainNumber}".`);

    const results = [];
    for (let i = 1; i <= count; i++) {
      const r = book(state, {
        trainId: train.id,
        passengerName: `Passenger ${i}`,
        age: 30,
        gender: "Other",
        preference: preference ?? "No Preference",
      });
      state = r.state;
      results.push({
        passenger: `Passenger ${i}`,
        status: r.booking?.status ?? "REJECTED",
        seatNumber: r.booking?.seatNumber ?? null,
        berth: r.booking?.berth ?? null,
        queuePosition: r.booking?.queuePosition ?? null,
        message: r.message,
      });
    }

    const summary = { train: `${train.number} ${train.name}`, results };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
