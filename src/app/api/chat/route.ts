import { createGroq, groq } from "@ai-sdk/groq";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Extract custom Groq key from headers if present
  const customKey = req.headers.get("x-groq-api-key");
  const modelProvider = customKey ? createGroq({ apiKey: customKey }) : groq;

  const result = streamText({
    model: modelProvider("mixtral-8x7b-32768"),
    system: `You are the ACMI Fleet Copilot. You have access to:
- ACMI: agent profiles, signals, timelines via /api/acmi
- Bus: live events via SSE stream
- Fleet: 88 agents, 174 work items

Help the user understand fleet status, diagnose issues, and control agents.
Be concise and provide actionable information.`,
    messages,
  });

  return result.toTextStreamResponse();
}
