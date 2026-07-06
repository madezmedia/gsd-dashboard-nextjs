import { z } from "zod";

const schema = z.object({
  kind: z.string().describe("Event classification, e.g. 'voice-input', 'task-update'"),
  summary: z.string().describe("Detail of what occurred"),
  correlationId: z.string().describe("Tracking chain identifier, e.g. 'voiceInput-1783...'"),
  source: z.string().optional().describe("Optional event source agent name"),
  signal: z.record(z.string(), z.any()).optional().describe("Optional nested JSON signal payload object"),
  status: z.string().optional().describe("Optional status descriptor"),
  description: z.string().optional().describe("Optional detailed description of the event"),
});

// Mock AI SDK schema generation if possible or just print Zod metadata
console.log("Keys in schema shape:", Object.keys(schema.shape));
console.log("Signal schema type:", schema.shape.signal._def);
