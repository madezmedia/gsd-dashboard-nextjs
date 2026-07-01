import { NextRequest, NextResponse } from "next/server";

const COMPOSIO_KEY = process.env.COMPOSIO_API_KEY ?? "";
const COMPOSIO_BASE = "https://backend.composio.dev/api/v1";

async function composioAction(action: string, input: Record<string, unknown>) {
  const res = await fetch(`${COMPOSIO_BASE}/actions/${action}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": COMPOSIO_KEY,
    },
    body: JSON.stringify({ entityId: "default", input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Composio ${res.status}: ${text}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  const { projectTitle, todos } = await req.json();
  if (!Array.isArray(todos) || todos.length === 0) {
    return NextResponse.json({ ok: false, error: "todos required" }, { status: 400 });
  }

  const results: { id: string; gtaskId?: string; error?: string }[] = [];

  for (const todo of todos as any[]) {
    if (todo.done) continue;
    try {
      const res = await composioAction("GOOGLETASKS_CREATE_TASK", {
        tasklistId: "@default",
        title: `[${projectTitle ?? "GSD"}] ${todo.title}`,
        notes: `Priority: ${todo.priority ?? "P2"} | Synced from GSD Dashboard`,
        status: "needsAction",
      });
      results.push({ id: todo.id, gtaskId: res?.data?.id ?? res?.id });
    } catch (err: any) {
      results.push({ id: todo.id, error: err.message });
    }
  }

  const synced = results.filter((r) => r.gtaskId).length;
  const failed = results.filter((r) => r.error).length;
  return NextResponse.json({ ok: true, synced, failed, results });
}
