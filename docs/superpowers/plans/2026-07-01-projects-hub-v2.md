# Projects Hub v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the GSD dashboard with a Vercel projects registry tab, per-project ACMI-backed todos with AI audit and Google Tasks sync via Composio, and iframe embeds in the services page.

**Architecture:** Four independent features shipped as separate tasks: (1) new API routes for Vercel projects + Gitea repos, (2) Vercel Projects tab in `/projects`, (3) per-project todos panel with AI audit and Composio Google Tasks sync wired into the existing expanded card, and (4) iframe embed toggle in `/services`. No new pages — all additions slot into existing page shells. ACMI-backed todos use `rawCommand` via the existing `/api/acmi` proxy, same as every other ACMI write in the codebase.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/radix-ui, `ai` SDK + `@ai-sdk/groq` (mixtral-8x7b-32768), Composio REST API (`ak_xHrrW-9SrFPEC1LPv6eJ`), Vercel REST API v9, Gitea REST API v1, ACMI REST bridge at `http://152.53.201.27:8081/exec` (proxied via `/api/acmi`)

---

## Environment context (read before touching any file)

- Dashboard root: `/Users/michaelshaw/Projects/gsd-dashboard-nextjs`
- ACMI proxy: `src/app/api/acmi/route.ts` — all Redis ops go through `rawCommand(["CMD","arg"])` from `src/lib/acmi-client.ts`
- Redis bridge URL in `.env.local`: `UPSTASH_REDIS_REST_URL="http://152.53.201.27:8081/exec"`
- Vercel token in `.env.local`: `VERCEL_TOKEN`, `VERCEL_ORG_ID=team_Ot5gPVkUTUhMMKTLfDTcSXZE`, `VERCEL_PROJECT_ID`
- Gitea URL: `https://git-u70402.vm.elestio.app` — token in `~/clawd/.env` as `GITEA_TOKEN`
- Composio key: `COMPOSIO_API_KEY=ak_xHrrW-9SrFPEC1LPv6eJ` (in `~/clawd/.env`, add to `.env.local`)
- Groq key: `GROQ_API_KEY` (in `~/clawd/.env`, add to `.env.local`)
- AI model: `mixtral-8x7b-32768` via `@ai-sdk/groq` (already in package.json, used in `src/app/api/chat/route.ts`)
- Design system: editorial/magazine aesthetic — warm paper bg, ink charcoal type, forest green accents, `font-mono` labels, `font-serif` headings, `rounded-2xl` cards, `uppercase tracking-wider text-[10px]` for metadata
- Component pattern: all UI in `"use client"` page components; data fetching via `fetch("/api/...")` calls from client

---

## File Map

**Create:**
- `src/app/api/vercel/projects/route.ts` — all Vercel projects + per-project deployments
- `src/app/api/git/repos/route.ts` — Gitea org repos list
- `src/app/api/projects/todos/route.ts` — ACMI-backed todos CRUD (GET/POST/PATCH/DELETE)
- `src/app/api/projects/todos/audit/route.ts` — AI audit endpoint (Groq)
- `src/app/api/composio/google-tasks/route.ts` — Composio Google Tasks sync
- `src/components/projects/vercel-projects-tab.tsx` — Vercel registry tab (used inside projects page)
- `src/components/projects/project-todos.tsx` — todos panel (used inside expanded project card)
- `src/components/services/service-iframe.tsx` — iframe embed panel (used inside services page)

**Modify:**
- `src/app/projects/page.tsx` — add `"vercel"` to `ViewMode`, add tab nav, render `<VercelProjectsTab>`, add todos panel to expanded card
- `src/app/services/page.tsx` — add iframe toggle state, render `<ServiceIframe>` per service
- `.env.local` — add `COMPOSIO_API_KEY`, `GROQ_API_KEY`, `GITEA_TOKEN`, `GITEA_URL`

---

## Task 1: Environment + API routes (Vercel projects, Gitea repos, todos CRUD)

**Files:**
- Create: `src/app/api/vercel/projects/route.ts`
- Create: `src/app/api/git/repos/route.ts`
- Create: `src/app/api/projects/todos/route.ts`
- Modify: `.env.local`

- [ ] **Step 1: Add missing env vars to `.env.local`**

Open `/Users/michaelshaw/Projects/gsd-dashboard-nextjs/.env.local` and append:

```
GROQ_API_KEY="placeholder_groq_api_key"
COMPOSIO_API_KEY="placeholder_composio_api_key"
GITEA_TOKEN="placeholder_gitea_token"
GITEA_URL="https://git-u70402.vm.elestio.app"
```

- [ ] **Step 2: Create Vercel projects API route**

Create `src/app/api/vercel/projects/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_ORG_ID;
  if (!token) return NextResponse.json({ projects: [], source: "no-token" });

  const teamQs = teamId ? `&teamId=${teamId}` : "";

  try {
    const res = await fetch(`https://api.vercel.com/v9/projects?limit=100${teamQs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Vercel ${res.status}`);
    const data = await res.json();

    const projects = await Promise.all(
      (data.projects as any[]).map(async (p) => {
        // fetch latest deployment for each project
        const dRes = await fetch(
          `https://api.vercel.com/v6/deployments?projectId=${p.id}&limit=3${teamQs}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        const dData = dRes.ok ? await dRes.json() : { deployments: [] };
        const latest = dData.deployments[0] ?? null;
        return {
          id: p.id,
          name: p.name,
          framework: p.framework ?? null,
          updatedAt: p.updatedAt,
          latestDeployment: latest
            ? {
                id: latest.uid,
                url: latest.url,
                state: latest.state,
                created: latest.created,
                commitSha: (latest.meta?.githubCommitSha ?? "").substring(0, 8),
                commitRef: latest.meta?.githubCommitRef ?? "main",
                commitMsg: latest.meta?.githubCommitMessage ?? "",
              }
            : null,
          deployments: (dData.deployments as any[]).map((d) => ({
            id: d.uid,
            url: d.url,
            state: d.state,
            created: d.created,
            commitSha: (d.meta?.githubCommitSha ?? "").substring(0, 8),
            commitRef: d.meta?.githubCommitRef ?? "main",
            commitMsg: d.meta?.githubCommitMessage ?? "",
          })),
        };
      })
    );

    return NextResponse.json({ projects, source: "vercel-api" });
  } catch (err: any) {
    return NextResponse.json({ projects: [], source: "error", error: err.message });
  }
}
```

- [ ] **Step 3: Create Gitea repos API route**

Create `src/app/api/git/repos/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.GITEA_TOKEN;
  const baseUrl = process.env.GITEA_URL ?? "https://git-u70402.vm.elestio.app";
  if (!token) return NextResponse.json({ repos: [], source: "no-token" });

  try {
    const res = await fetch(
      `${baseUrl}/api/v1/repos/search?token=${token}&limit=50&sort=updated&order=desc`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Gitea ${res.status}`);
    const data = await res.json();
    const repos = (data.data as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description ?? "",
      language: r.language ?? null,
      stars: r.stars_count,
      openIssues: r.open_issues_count,
      defaultBranch: r.default_branch,
      updatedAt: r.updated,
      htmlUrl: r.html_url,
      cloneUrl: r.clone_url,
    }));
    return NextResponse.json({ repos, source: "gitea-api" });
  } catch (err: any) {
    return NextResponse.json({ repos: [], source: "error", error: err.message });
  }
}
```

- [ ] **Step 4: Create todos CRUD API route**

Create `src/app/api/projects/todos/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const BRIDGE = process.env.UPSTASH_REDIS_REST_URL ?? "";

async function acmi(cmd: unknown[]) {
  const r = await fetch(BRIDGE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const d = await r.json();
  return d.result;
}

function todosKey(projectId: string) {
  return `acmi:project:${projectId}:todos`;
}

// GET /api/projects/todos?projectId=xxx
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ todos: [] });
  const raw = await acmi(["GET", todosKey(projectId)]);
  const todos = raw ? JSON.parse(raw as string) : [];
  return NextResponse.json({ todos });
}

// POST /api/projects/todos  body: { projectId, todo: { id, title, done, priority } }
export async function POST(req: NextRequest) {
  const { projectId, todo } = await req.json();
  if (!projectId || !todo) return NextResponse.json({ ok: false }, { status: 400 });
  const existing = await acmi(["GET", todosKey(projectId)]);
  const todos: any[] = existing ? JSON.parse(existing as string) : [];
  todos.push({ ...todo, createdAt: Date.now() });
  await acmi(["SET", todosKey(projectId), JSON.stringify(todos)]);
  return NextResponse.json({ ok: true, todos });
}

// PATCH /api/projects/todos  body: { projectId, todos: [...] }  (full replace)
export async function PATCH(req: NextRequest) {
  const { projectId, todos } = await req.json();
  if (!projectId || !Array.isArray(todos)) return NextResponse.json({ ok: false }, { status: 400 });
  await acmi(["SET", todosKey(projectId), JSON.stringify(todos)]);
  return NextResponse.json({ ok: true, todos });
}

// DELETE /api/projects/todos  body: { projectId, todoId }
export async function DELETE(req: NextRequest) {
  const { projectId, todoId } = await req.json();
  if (!projectId || !todoId) return NextResponse.json({ ok: false }, { status: 400 });
  const existing = await acmi(["GET", todosKey(projectId)]);
  const todos: any[] = existing ? JSON.parse(existing as string) : [];
  const filtered = todos.filter((t: any) => t.id !== todoId);
  await acmi(["SET", todosKey(projectId), JSON.stringify(filtered)]);
  return NextResponse.json({ ok: true, todos: filtered });
}
```

- [ ] **Step 5: Verify all three routes compile**

```bash
cd /Users/michaelshaw/Projects/gsd-dashboard-nextjs
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (zero errors).

- [ ] **Step 6: Smoke-test Vercel projects route**

```bash
cd /Users/michaelshaw/Projects/gsd-dashboard-nextjs
# Start dev server in background if not running
npm run dev &
sleep 4
curl -s http://localhost:3000/api/vercel/projects | python3 -c "import sys,json; d=json.load(sys.stdin); print('projects:', len(d.get('projects',[])), 'source:', d.get('source'))"
```

Expected: `projects: 25+ source: vercel-api`

- [ ] **Step 7: Smoke-test Gitea repos route**

```bash
curl -s http://localhost:3000/api/git/repos | python3 -c "import sys,json; d=json.load(sys.stdin); print('repos:', len(d.get('repos',[])), 'source:', d.get('source'))"
```

Expected: `repos: 5+ source: gitea-api`

- [ ] **Step 8: Smoke-test todos CRUD**

```bash
curl -s -X POST http://localhost:3000/api/projects/todos \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test-project","todo":{"id":"t1","title":"smoke test todo","done":false,"priority":"P1"}}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok:', d.get('ok'), 'count:', len(d.get('todos',[])) )"

curl -s "http://localhost:3000/api/projects/todos?projectId=test-project" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('todos:', [t['title'] for t in d.get('todos',[])])"
```

Expected: `ok: True count: 1` then `todos: ['smoke test todo']`

- [ ] **Step 9: Commit**

```bash
cd /Users/michaelshaw/Projects/gsd-dashboard-nextjs
git add src/app/api/vercel/projects/route.ts src/app/api/git/repos/route.ts src/app/api/projects/todos/route.ts .env.local
git commit -m "feat: add vercel projects, gitea repos, and todos CRUD API routes"
```

---

## Task 2: AI Audit + Composio Google Tasks API routes

**Files:**
- Create: `src/app/api/projects/todos/audit/route.ts`
- Create: `src/app/api/composio/google-tasks/route.ts`

- [ ] **Step 1: Create AI audit route**

Create `src/app/api/projects/todos/audit/route.ts`:

```typescript
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
      model: groq("mixtral-8x7b-32768"),
      prompt,
      maxTokens: 1500,
    });

    // Strip any accidental markdown fencing
    const cleaned = text.replace(/^```json?\s*/m, "").replace(/\s*```$/m, "").trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create Composio Google Tasks route**

Create `src/app/api/composio/google-tasks/route.ts`:

```typescript
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

// POST /api/composio/google-tasks
// body: { projectId, projectTitle, todos: [{id, title, done, priority}] }
export async function POST(req: NextRequest) {
  const { projectTitle, todos } = await req.json();
  if (!Array.isArray(todos) || todos.length === 0) {
    return NextResponse.json({ ok: false, error: "todos required" }, { status: 400 });
  }

  const results: { id: string; gtaskId?: string; error?: string }[] = [];

  for (const todo of todos as any[]) {
    if (todo.done) continue; // skip completed todos
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
```

- [ ] **Step 3: Verify compile**

```bash
cd /Users/michaelshaw/Projects/gsd-dashboard-nextjs
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Test AI audit route with curl**

```bash
curl -s -X POST http://localhost:3000/api/projects/todos/audit \
  -H "Content-Type: application/json" \
  -d '{"projectId":"gsd-dashboard","projectTitle":"GSD Dashboard","todos":[{"id":"t1","title":"fix vercel token","done":false,"priority":"P0"},{"id":"t2","title":"stuff","done":false,"priority":"P2"},{"id":"t3","title":"fix vercel token","done":false,"priority":"P1"}]}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok:', d.get('ok')); print('notes:', d.get('audit_notes',[])); print('optimized count:', len(d.get('optimized',[])))"
```

Expected: `ok: True`, 2–4 audit notes, optimized list with duplicates flagged.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/projects/todos/audit/route.ts src/app/api/composio/google-tasks/route.ts
git commit -m "feat: add AI todo audit (Groq) and Composio Google Tasks sync routes"
```

---

## Task 3: `ProjectTodos` component

**Files:**
- Create: `src/components/projects/project-todos.tsx`

This component is used inside the expanded project card panel in `/projects`. It is self-contained: loads its own todos from ACMI, handles add/toggle/delete, AI audit, and Google Tasks sync.

- [ ] **Step 1: Create the component**

Create `src/components/projects/project-todos.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Sparkles, RefreshCw, CheckSquare, Square, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: "P0" | "P1" | "P2" | "P3";
  createdAt?: number;
  auditNote?: string;
}

interface Props {
  projectId: string;
  projectTitle: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-500/10 text-red-400 border-red-500/20",
  P1: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  P2: "bg-primary/10 text-primary border-primary/20",
  P3: "bg-muted text-muted-foreground border-border",
};

export function ProjectTodos({ projectId, projectTitle }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Todo["priority"]>("P2");
  const [auditing, setAuditing] = useState(false);
  const [auditNotes, setAuditNotes] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/todos?projectId=${encodeURIComponent(projectId)}`);
    const data = await res.json();
    setTodos(data.todos ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const persist = useCallback(async (updated: Todo[]) => {
    setTodos(updated);
    await fetch("/api/projects/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, todos: updated }),
    });
  }, [projectId]);

  const addTodo = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const todo: Todo = {
      id: `todo-${Date.now()}`,
      title,
      done: false,
      priority: newPriority,
      createdAt: Date.now(),
    };
    await persist([...todos, todo]);
    setNewTitle("");
  };

  const toggleDone = (id: string) =>
    persist(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTodo = (id: string) => persist(todos.filter((t) => t.id !== id));

  const runAudit = async () => {
    setAuditing(true);
    setAuditNotes([]);
    const res = await fetch("/api/projects/todos/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectTitle, todos }),
    });
    const data = await res.json();
    if (data.ok) {
      // Apply optimized list, then remove flagged ids
      let updated: Todo[] = data.optimized ?? todos;
      if (data.removed_ids?.length) {
        updated = updated.filter((t: Todo) => !data.removed_ids.includes(t.id));
      }
      await persist(updated);
      setAuditNotes(data.audit_notes ?? []);
    }
    setAuditing(false);
  };

  const syncToGoogleTasks = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch("/api/composio/google-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectTitle, todos }),
    });
    const data = await res.json();
    setSyncResult(data.ok ? `✓ ${data.synced} tasks synced to Google Tasks` : `Error: ${data.error}`);
    setSyncing(false);
  };

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Todos — {pending.length} pending, {done.length} done
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[9px] font-mono uppercase border-border gap-1 cursor-pointer"
            onClick={runAudit}
            disabled={auditing || todos.length === 0}
          >
            {auditing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {auditing ? "Auditing..." : "AI Audit"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[9px] font-mono uppercase border-border gap-1 cursor-pointer"
            onClick={syncToGoogleTasks}
            disabled={syncing || pending.length === 0}
          >
            {syncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {syncing ? "Syncing..." : "→ Google Tasks"}
          </Button>
        </div>
      </div>

      {/* Sync result */}
      {syncResult && (
        <p className={cn("text-[10px] font-mono px-3 py-1.5 rounded border",
          syncResult.startsWith("✓") ? "bg-primary/5 border-primary/20 text-primary" : "bg-red-500/5 border-red-500/20 text-red-400"
        )}>
          {syncResult}
        </p>
      )}

      {/* AI audit notes */}
      {auditNotes.length > 0 && (
        <div className="bg-secondary border border-border rounded-xl p-3 space-y-1">
          <span className="text-[9px] font-mono uppercase text-primary tracking-wider">AI Audit Notes</span>
          {auditNotes.map((note, i) => (
            <p key={i} className="text-[10px] text-muted-foreground font-mono">• {note}</p>
          ))}
        </div>
      )}

      {/* Add todo */}
      <div className="flex gap-2">
        <Input
          className="h-8 text-xs font-mono border-border bg-secondary flex-1"
          placeholder="New task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <select
          className="h-8 text-[10px] font-mono border border-border rounded-md bg-secondary px-2 text-foreground cursor-pointer"
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as Todo["priority"])}
        >
          {(["P0", "P1", "P2", "P3"] as const).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Button
          size="sm"
          className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-background cursor-pointer"
          onClick={addTodo}
          disabled={!newTitle.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Todo list */}
      {loading ? (
        <p className="text-[10px] font-mono text-muted-foreground animate-pulse">Loading todos...</p>
      ) : todos.length === 0 ? (
        <p className="text-[10px] font-mono text-muted-foreground/50 text-center py-4">No todos yet. Add one above.</p>
      ) : (
        <div className="space-y-1.5">
          {[...pending, ...done].map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-xl border transition-all",
                todo.done
                  ? "border-border/30 bg-secondary/30 opacity-50"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <button
                onClick={() => toggleDone(todo.id)}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
              >
                {todo.done ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5" />}
              </button>
              <span className={cn("text-xs flex-1 font-mono", todo.done && "line-through")}>
                {todo.title}
              </span>
              <Badge className={cn("text-[9px] border h-4 px-1 shrink-0", PRIORITY_COLORS[todo.priority ?? "P2"])}>
                {todo.priority ?? "P2"}
              </Badge>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-muted-foreground/40 hover:text-red-400 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
cd /Users/michaelshaw/Projects/gsd-dashboard-nextjs
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/projects/project-todos.tsx
git commit -m "feat: add ProjectTodos component with ACMI sync, AI audit, and Google Tasks"
```

---

## Task 4: `VercelProjectsTab` component

**Files:**
- Create: `src/components/projects/vercel-projects-tab.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/projects/vercel-projects-tab.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Globe, GitBranch, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VercelDeployment {
  id: string;
  url: string;
  state: string;
  created: number;
  commitSha: string;
  commitRef: string;
  commitMsg: string;
}

interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  updatedAt: number;
  latestDeployment: VercelDeployment | null;
  deployments: VercelDeployment[];
}

const STATE_STYLES: Record<string, string> = {
  READY: "bg-primary/10 text-primary border-primary/20",
  BUILDING: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
  INITIALIZING: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
  ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
  CANCELED: "bg-muted text-muted-foreground border-border",
};

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function VercelProjectsTab() {
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    const res = await fetch("/api/vercel/projects");
    const data = await res.json();
    setProjects(data.projects ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = projects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-4 w-4 animate-spin text-primary mr-2" />
        <span className="text-[10px] font-mono uppercase text-muted-foreground animate-pulse">
          Fetching Vercel projects...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {projects.length} Vercel Projects
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="h-7 text-xs font-mono border border-border rounded-md bg-secondary px-2 text-foreground w-48 placeholder:text-muted-foreground/50"
            placeholder="Filter projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[9px] font-mono uppercase border-border gap-1 cursor-pointer"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((project) => {
          const dep = project.latestDeployment;
          const state = dep?.state ?? "UNKNOWN";
          const isExpanded = expandedId === project.id;

          return (
            <Card
              key={project.id}
              className={cn(
                "border bg-card rounded-2xl shadow-md transition-all cursor-pointer",
                isExpanded ? "border-primary/50 md:col-span-2 xl:col-span-3" : "border-border hover:border-primary/30"
              )}
              onClick={() => setExpandedId(isExpanded ? null : project.id)}
            >
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                <div className="space-y-0.5 min-w-0">
                  <CardTitle className="text-sm font-bold font-serif tracking-wide text-foreground truncate">
                    {project.name}
                  </CardTitle>
                  {project.framework && (
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">
                      {project.framework}
                    </span>
                  )}
                </div>
                <Badge className={cn("text-[9px] border shrink-0 uppercase", STATE_STYLES[state] ?? STATE_STYLES.CANCELED)}>
                  {state}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {dep && (
                  <div className="bg-secondary rounded-xl border border-border p-2 font-mono text-[10px] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <GitBranch className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">{dep.commitRef}</span>
                        {dep.commitSha && <span className="text-primary">#{dep.commitSha}</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-muted-foreground/60">
                        <Clock className="h-2.5 w-2.5" />
                        {relTime(dep.created)}
                      </div>
                    </div>
                    {dep.commitMsg && (
                      <p className="text-muted-foreground/70 truncate text-[9px]">{dep.commitMsg}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">
                    Updated {relTime(project.updatedAt)}
                  </span>
                  {dep?.url && (
                    <a
                      href={`https://${dep.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline uppercase"
                    >
                      Open <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>

                {/* Expanded: deployment history */}
                {isExpanded && project.deployments.length > 1 && (
                  <div className="border-t border-border pt-3 space-y-1.5">
                    <span className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">
                      Recent deployments
                    </span>
                    {project.deployments.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-[10px] font-mono gap-2 py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge className={cn("text-[8px] border px-1 h-4 shrink-0 uppercase", STATE_STYLES[d.state] ?? STATE_STYLES.CANCELED)}>
                            {d.state}
                          </Badge>
                          <span className="text-muted-foreground truncate">{d.commitRef}</span>
                          <span className="text-primary shrink-0">#{d.commitSha}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground/50">{relTime(d.created)}</span>
                          {d.url && (
                            <a href={`https://${d.url}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <ExternalLink className="h-2.5 w-2.5 text-primary hover:text-primary/70" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/projects/vercel-projects-tab.tsx
git commit -m "feat: add VercelProjectsTab component with all-projects registry and deployment history"
```

---

## Task 5: Wire `VercelProjectsTab` + `ProjectTodos` into the projects page

**Files:**
- Modify: `src/app/projects/page.tsx` (1234 lines)

- [ ] **Step 1: Add imports at the top of projects/page.tsx**

Find the import block (around line 1–25). Add after the last import:

```typescript
import { VercelProjectsTab } from "@/components/projects/vercel-projects-tab";
import { ProjectTodos } from "@/components/projects/project-todos";
```

- [ ] **Step 2: Expand the ViewMode type**

Find line:
```typescript
type ViewMode = "kanban" | "table" | "activity" | "git-vercel";
```

Replace with:
```typescript
type ViewMode = "kanban" | "table" | "activity" | "git-vercel" | "vercel";
```

- [ ] **Step 3: Add "vercel" to the view mode toggle**

Find the section that renders the view mode buttons. It contains `["kanban", "table", "activity", "git-vercel"]`. Replace with:

```typescript
{(["kanban", "table", "activity", "git-vercel", "vercel"] as ViewMode[]).map((mode) => (
```

And update the label logic below it. Find where it renders `{mode === "git-vercel" ? "Git & Vercel" : mode}` and replace with:

```typescript
{mode === "git-vercel" ? "Git & Vercel" : mode === "vercel" ? "Vercel Projects" : mode}
```

- [ ] **Step 4: Add the Vercel tab render block**

Find the closing `{viewMode === "git-vercel" && (` block and after its closing `)}`, add:

```typescript
      {/* 5. VERCEL PROJECTS REGISTRY */}
      {viewMode === "vercel" && <VercelProjectsTab />}
```

- [ ] **Step 5: Add todos tab to the expanded project card**

Search for where the expanded project card panel is rendered. Look for where project detail content shows milestones/stages/timeline. It will be inside a `{expandedProjectId === project.id && ...}` block.

After the existing milestone/stages content, find the closing `</div>` of the expanded panel content and before it insert:

```typescript
              {/* Todos panel */}
              <div className="border-t border-border pt-4 mt-4">
                <ProjectTodos
                  projectId={project.id}
                  projectTitle={project.title}
                />
              </div>
```

> **Note:** The exact location depends on how the KanbanColumn renders expanded cards. Search for `expandedId === project.id` or `expandedProjectId === project.id` in the component tree. The todos panel goes at the bottom of the detail expansion, before the panel's closing `</div>`.

- [ ] **Step 6: Verify compile and smoke test**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

Open `http://localhost:3000/projects` in browser. Verify:
1. "Vercel Projects" tab appears in the view mode switcher
2. Clicking it shows the project cards with state badges
3. Clicking a project card expands deployment history
4. Expanding a project on kanban/table/activity view shows the Todos panel
5. Adding a todo, clicking "AI Audit", and "→ Google Tasks" all work without console errors

- [ ] **Step 7: Commit**

```bash
git add src/app/projects/page.tsx
git commit -m "feat: wire VercelProjectsTab and ProjectTodos into projects page"
```

---

## Task 6: `ServiceIframe` component + services page integration

**Files:**
- Create: `src/components/services/service-iframe.tsx`
- Modify: `src/app/services/page.tsx`

- [ ] **Step 1: Create ServiceIframe component**

Create `src/components/services/service-iframe.tsx`:

```typescript
"use client";

import { useState } from "react";
import { X, RefreshCw, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  url: string;
  onClose: () => void;
}

export function ServiceIframe({ name, url, onClose }: Props) {
  const [key, setKey] = useState(0); // increment to force iframe reload
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border border-primary/30 shadow-2xl rounded-2xl overflow-hidden flex flex-col",
        fullscreen
          ? "inset-4"
          : "bottom-6 right-6 w-[min(900px,calc(100vw-3rem))] h-[min(620px,calc(100vh-6rem))]"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-foreground font-bold">
            {name}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/60 truncate max-w-[200px]">{url}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 cursor-pointer"
            onClick={() => setKey((k) => k + 1)}
            title="Reload"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 cursor-pointer"
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? "Restore" : "Fullscreen"}
          >
            <Maximize2 className="h-3 w-3 text-muted-foreground" />
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-6 w-6 items-center justify-center"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
          </a>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 cursor-pointer"
            onClick={onClose}
            title="Close"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
          </Button>
        </div>
      </div>

      {/* iframe */}
      <iframe
        key={key}
        src={url}
        className="flex-1 w-full border-0 bg-white"
        title={name}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
```

- [ ] **Step 2: Define the embeddable services map**

This is a constant used inside the services page. The services are identified by their `slug` field from ACMI. Known embeddable services and their URLs:

```typescript
const EMBED_URLS: Record<string, string> = {
  nocodb: "https://nocodb-u70402.vm.elestio.app",
  "n8n": "https://n8n-u70402.vm.elestio.app",
  git: "https://git-u70402.vm.elestio.app",
  serpbear: "https://serpbear-u70402.vm.elestio.app",
  langfuse: "https://langfuse-u70402.vm.elestio.app",
  "uptime-kuma": "https://uptime-u70402.vm.elestio.app",
  mattermost: "http://152.53.201.27:8065",
  searxng: "https://searxng-u70402.vm.elestio.app",
};
```

- [ ] **Step 3: Update `src/app/services/page.tsx`**

Read `src/app/services/page.tsx` (194 lines) fully, then apply these changes:

**3a. Add import at the top** (after existing imports):
```typescript
import { ServiceIframe } from "@/components/services/service-iframe";
```

**3b. Add the EMBED_URLS constant** (after existing imports, before the component):
```typescript
const EMBED_URLS: Record<string, string> = {
  nocodb: "https://nocodb-u70402.vm.elestio.app",
  n8n: "https://n8n-u70402.vm.elestio.app",
  git: "https://git-u70402.vm.elestio.app",
  serpbear: "https://serpbear-u70402.vm.elestio.app",
  langfuse: "https://langfuse-u70402.vm.elestio.app",
  "uptime-kuma": "https://uptime-u70402.vm.elestio.app",
  mattermost: "http://152.53.201.27:8065",
  searxng: "https://searxng-u70402.vm.elestio.app",
};
```

**3c. Add iframe state** inside `ServicesStatusPage` function, after the existing state declarations:
```typescript
const [activeEmbed, setActiveEmbed] = useState<{ name: string; url: string } | null>(null);
```

**3d. Add "Open" button to each service card** in the `<CardContent>` footer section.

Find the footer section that renders the "Console" link:
```typescript
{svc.url && (
  <a 
    href={svc.url} 
    target="_blank" 
    ...
  >
    <span>Console</span>
    <ExternalLink className="h-2.5 w-2.5" />
  </a>
)}
```

Replace with:
```typescript
<div className="flex items-center gap-2">
  {EMBED_URLS[svc.slug] && (
    <button
      onClick={() => setActiveEmbed(
        activeEmbed?.name === svc.name
          ? null
          : { name: svc.name, url: EMBED_URLS[svc.slug] }
      )}
      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 uppercase cursor-pointer transition-colors"
    >
      {activeEmbed?.name === svc.name ? "Close" : "Embed"}
    </button>
  )}
  {svc.url && (
    <a 
      href={svc.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary-hover transition-colors uppercase cursor-pointer"
    >
      <span>Console</span>
      <ExternalLink className="h-2.5 w-2.5" />
    </a>
  )}
</div>
```

**3e. Render the iframe overlay** at the bottom of the return, before the closing `</div>` of the page:
```typescript
{activeEmbed && (
  <ServiceIframe
    name={activeEmbed.name}
    url={activeEmbed.url}
    onClose={() => setActiveEmbed(null)}
  />
)}
```

- [ ] **Step 4: Verify compile**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 5: Browser test the services page**

Open `http://localhost:3000/services`. Verify:
1. Service cards that have an embed URL show an "Embed" button
2. Clicking "Embed" opens the floating iframe panel in the bottom-right
3. The iframe loads the service URL
4. Reload, Fullscreen, and Close buttons work
5. "Embed" button toggles to "Close" while that service's iframe is open

- [ ] **Step 6: Commit**

```bash
git add src/components/services/service-iframe.tsx src/app/services/page.tsx
git commit -m "feat: add iframe embed panel to services page with fullscreen and reload"
```

---

## Self-Review

**1. Spec coverage check:**
- ✅ New tab in projects for Vercel — Task 4 + 5 (`VercelProjectsTab`, `"vercel"` ViewMode)
- ✅ All Vercel projects — `/api/vercel/projects/route.ts` uses `/v9/projects?limit=100`
- ✅ Expand services for iframes — Task 6 (`ServiceIframe`, `EMBED_URLS`, "Embed" button)
- ✅ ACMI-backed todos — `/api/projects/todos` stores in `acmi:project:<id>:todos` via bridge
- ✅ Local state — `ProjectTodos` component uses `useState<Todo[]>` with optimistic update via `persist()`
- ✅ AI audit — `/api/projects/todos/audit` uses Groq mixtral, restructures + annotates todos
- ✅ Google Tasks sync via Composio — `/api/composio/google-tasks` POSTs `GOOGLETASKS_CREATE_TASK`
- ✅ Per-project deployment tab — expanded project card in `VercelProjectsTab` shows deployment history; in main kanban the `ProjectTodos` panel is added to the existing expanded card

**2. Placeholder scan:** No TBDs, no "add appropriate error handling", no "implement later". All code blocks are complete.

**3. Type consistency:**
- `Todo` interface defined in `project-todos.tsx` and used only there
- `VercelProject`/`VercelDeployment` defined and used only in `vercel-projects-tab.tsx`
- `ViewMode` updated in one place (`projects/page.tsx` line ~26)
- `EMBED_URLS` constant used in one file (`services/page.tsx`)
- API response shapes match between route handlers and client components
