import { NextRequest, NextResponse } from "next/server";

interface ACMIEventPayload { id: string; ts: string | number; source: string; kind: string; summary: string; correlationId?: string; }
interface WorkProgress { id: string; title: string; progress: number; event_count: number; completed_events: number; last_active_ts: string | null; activity_summary: string; status_before: string; status_after: string; updated: boolean; }

// Use VERCEL_URL when on Vercel, fallback to localhost for dev
function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Call the ACMI proxy (same deployment) — it has the correct credentials
async function proxy(tool: string, params: Record<string, unknown> = {}) {
  const res = await fetch(`${getBaseUrl()}/api/acmi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, params }),
  });
  if (!res.ok) throw new Error(`Proxy error ${res.status} on ${tool}`);
  return res.json();
}

function calcProgress(events: ACMIEventPayload[]) {
  if (!events.length) return { pct: 0, done: 0, summary: "no activity", lastActive: null as string | null };
  const done = events.filter(e =>
    e.kind?.includes("milestone-shipped") || e.kind?.includes("work-completed") ||
    e.kind?.includes("task-completed") || e.kind?.includes("stage-complete") ||
    e.kind?.includes("handoff-ack") || e.kind?.includes("post-commit")
  ).length;
  let latest: number | null = null;
  for (const e of events) {
    const t = typeof e.ts === "number" ? e.ts : new Date(e.ts || 0).getTime();
    if (t > (latest || 0)) latest = t;
  }
  let pct = 0;
  if (done >= 10) pct = 100; else if (done >= 5) pct = 75; else if (done >= 2) pct = 60;
  else if (events.length >= 20) pct = 50; else if (events.length >= 10) pct = 35;
  else if (events.length >= 5) pct = 25; else if (events.length >= 2) pct = 10; else pct = 5;
  return {
    pct, done,
    summary: done > 0 ? `${done} milestones / ${events.length} total` : `${events.length} events`,
    lastActive: latest ? new Date(latest).toISOString() : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { id: singleId, dryRun } = (await req.json()) as { id?: string; dryRun?: boolean } || {};
    let workIds: string[];

    if (singleId) {
      workIds = [singleId];
    } else {
      const listData = await proxy("acmi_work_list");
      workIds = (listData?.result || []).slice(0, 200);
    }

    const results: WorkProgress[] = [];
    for (const id of workIds) {
      try {
        const data = await proxy("acmi_get", { namespace: "work", id });
        const prof = data?.profile || {};
        const sig = data?.signals || {};
        const events: ACMIEventPayload[] = data?.timeline || [];
        const title = (prof?.title as string) || id;
        const calc = calcProgress(events);
        const statusBefore = (sig?.status as string) || "active";
        let statusAfter = statusBefore;
        if (calc.pct >= 100) statusAfter = "completed";
        else if (events.length === 0 && statusBefore === "active") statusAfter = "stalled";
        else if (events.length > 0 && statusBefore === "stalled") statusAfter = "active";

        let updated = false;
        if (!dryRun) {
          const curPct = Number(sig?.progress || 0);
          const curStatus = sig?.status || "";
          if (curPct !== calc.pct || curStatus !== statusAfter || !sig?.consolidated_at) {
            await proxy("acmi_work_signal", {
              id,
              signals: JSON.stringify({
                progress: calc.pct, activity_summary: calc.summary,
                event_count: events.length, completed_events: calc.done,
                last_active_ts: calc.lastActive,
                consolidated_at: new Date().toISOString(), status: statusAfter,
              }),
            });
            updated = true;
          }
        }
        results.push({ id, title, progress: calc.pct, event_count: events.length, completed_events: calc.done, last_active_ts: calc.lastActive, activity_summary: calc.summary, status_before: statusBefore, status_after: statusAfter, updated });
      } catch (err) {
        results.push({ id, title: id, progress: 0, event_count: 0, completed_events: 0, last_active_ts: null, activity_summary: "error", status_before: "error", status_after: "error", updated: false });
      }
    }

    return NextResponse.json({
      ok: true, dry_run: !!dryRun,
      summary: `${results.filter(r => r.updated).length}/${results.length} updated`,
      total_scanned: results.length,
      updated_count: results.filter(r => r.updated).length,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: "Consolidation failed", details: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "POST /api/acmi/consolidate with {id?, dryRun?}" });
}
