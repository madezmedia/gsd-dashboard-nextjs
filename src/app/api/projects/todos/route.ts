import { NextRequest, NextResponse } from "next/server";

const BRIDGE = process.env.UPSTASH_REDIS_REST_URL ?? "";

async function acmi(cmd: unknown[]) {
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  try {
    const r = await fetch(BRIDGE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    const d = await r.json();
    return d.result;
  } catch {
    return null;
  }
}

function todosKey(projectId: string) {
  return `acmi:project:${projectId}:todos`;
}

function isValidProjectId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 128;
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ todos: [] });
  if (!isValidProjectId(projectId)) return NextResponse.json({ todos: [] });
  const raw = await acmi(["GET", todosKey(projectId)]);
  const todos = raw ? JSON.parse(raw as string) : [];
  return NextResponse.json({ todos });
}

export async function POST(req: NextRequest) {
  const { projectId, todo } = await req.json();
  if (!projectId || !todo) return NextResponse.json({ ok: false }, { status: 400 });
  if (!isValidProjectId(projectId)) return NextResponse.json({ ok: false, error: "invalid projectId" }, { status: 400 });
  const existing = await acmi(["GET", todosKey(projectId)]);
  const todos: any[] = existing ? JSON.parse(existing as string) : [];
  todos.push({ ...todo, createdAt: Date.now() });
  await acmi(["SET", todosKey(projectId), JSON.stringify(todos)]);
  return NextResponse.json({ ok: true, todos });
}

export async function PATCH(req: NextRequest) {
  const { projectId, todos } = await req.json();
  if (!projectId || !Array.isArray(todos)) return NextResponse.json({ ok: false }, { status: 400 });
  if (!isValidProjectId(projectId)) return NextResponse.json({ ok: false, error: "invalid projectId" }, { status: 400 });
  await acmi(["SET", todosKey(projectId), JSON.stringify(todos)]);
  return NextResponse.json({ ok: true, todos });
}

export async function DELETE(req: NextRequest) {
  const { projectId, todoId } = await req.json();
  if (!projectId || !todoId) return NextResponse.json({ ok: false }, { status: 400 });
  if (!isValidProjectId(projectId)) return NextResponse.json({ ok: false, error: "invalid projectId" }, { status: 400 });
  const existing = await acmi(["GET", todosKey(projectId)]);
  const todos: any[] = existing ? JSON.parse(existing as string) : [];
  const filtered = todos.filter((t: any) => t.id !== todoId);
  await acmi(["SET", todosKey(projectId), JSON.stringify(filtered)]);
  return NextResponse.json({ ok: true, todos: filtered });
}
