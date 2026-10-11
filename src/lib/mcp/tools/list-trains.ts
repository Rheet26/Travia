import { defineTool } from "@lovable.dev/mcp-js";
import { defaultState } from "@/lib/railverse/engine";

export default defineTool({
  name: "list_trains",
  title: "List trains",
  description:
    "List the Travia timetable: train number, name, route, timings, fare, and seat/RAC/waitlist capacity.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const trains = defaultState().trains.map(({ id: _id, ...t }) => t);
    return {
      content: [{ type: "text", text: JSON.stringify(trains, null, 2) }],
      structuredContent: { trains },
    };
  },
});
