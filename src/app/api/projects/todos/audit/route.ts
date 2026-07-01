import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  const { projectId, projectTitle, todos } = await req.json();
  if (!todos || !Array.isArray(todos)) {
    return NextResponse.json({ ok: false, error: "todos required" }, { status: 400 });
  }

  const prompt = `You are a project management AI. Audit and optimize this todo list for project "${projectTitle ?? projectId}".

Current todos:
${todos.map((t: any, i: number) => `${i + 1}. [${t.done ? "x" : " "}] ${t.title} (priority: ${t.priority ?? "P2"})`).join("\n")}

Return a JSON object with:
1. "optimized": array of the same todos with improvements — reorder by priority, split vague tasks, add missing obvious tasks, mark duplicates for removal. Keep each todo under 80 chars. Same id if unchanged, new uuid if new.
2. "audit_notes": array of 2-4 plain-English suggestions (what you changed and why).
3. "removed_ids": array of todo ids that should be deleted (duplicates, done+redundant).

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      maxOutputTokens: 1500,
    });

    // Strip markdown code fences if present, then extract first JSON object
    let cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
    // Extract the outermost JSON object in case model adds preamble/postamble
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in model response");
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
