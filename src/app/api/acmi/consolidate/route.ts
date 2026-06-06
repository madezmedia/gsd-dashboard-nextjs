import { NextRequest, NextResponse } from "next/server";

interface ACMIEventPayload {
  id: string;
  ts: string | number;
  source: string;
  kind: string;
  summary: string;
  correlationId?: string;
}

interface WorkProgress {
  id: string;
  title: string;
  progress: number;
  event_count: number;
  completed_events: number;
  last_active_ts: string | null;
  activity_summary: string;
  status_before: string;
  status_after: string;
  updated: boolean;
}

// Use the same ACMI proxy the dashboard uses, not direct Upstash
const ACMI_PROXY = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/acmi`
  : "http://localhost:3000/api/acmi";

async function acmiCall(tool: string, params: Record<string, unknown> = {}) {
  const res = await fetch(ACMI_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, params }),
  });
  if (!res.ok) {
    throw new Error(`ACMI proxy error: ${res.status} on ${tool}`);
  }
  return res.json();
}

function calculateProgress(events: ACMIEventPayload[]): {
  progress: number;
  completed_events: number;
  routine_events: number;
  activity_summary: string;
  last_active_ts: string | null;
} {
  if (!events.length) {
    return { progress: 0, completed_events: 0, routine_events: 0, activity_summary: "no activity", last_active_ts: null };
  }

  const completed_events = events.filter(
    (e) =>
      e.kind?.includes("milestone-shipped") ||
      e.kind?.includes("work-completed") ||
      e.kind?.includes("task-completed") ||
      e.kind?.includes("stage-complete") ||
      e.kind?.includes("handoff-ack") ||
      e.kind?.includes("post-commit")
  ).length;

  const routine_events = events.filter(
    (e) =>
      e.kind?.includes("coord-note") ||
      e.kind?.includes("heartbeat") ||
      e.kind?.includes("fleet-audit")
  ).length;

  let latestTs: number | null = null;
  for (const e of events) {
    const t = typeof e.ts === "number" ? e.ts : new Date(e.ts || 0).getTime();
    if (t > (latestTs || 0)) latestTs = t;
  }

  let progress = 0;
  if (completed_events >= 10) progress = 100;
  else if (completed_events >= 5) progress = 75;
  else if (completed_events >= 2) progress = 60;
  else if (events.length >= 20) progress = 50;
  else if (events.length >= 10) progress = 35;
  else if (events.length >= 5) progress = 25;
  else if (events.length >= 2) progress = 10;
  else progress = 5;

  const parts: string[] = [];
  if (completed_events > 0) parts.push(`${completed_events} milestones`);
  if (routine_events > 0) parts.push(`${routine_events} routine`);
  parts.push(`${events.length} total events`);
  const activity_summary = parts.join(", ");

  return {
    progress,
    completed_events,
    routine_events,
    activity_summary,
    last_active_ts: latestTs ? new Date(latestTs).toISOString() : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { id: singleId, dryRun } = (await req.json()) as {
      id?: string;
      dryRun?: boolean;
    } || {};

    let workIds: string[];

    if (singleId) {
      workIds = [singleId];
    } else {
      // List all work items via the proxy (same route dashboard uses)
      const listData = await acmiCall("acmi_work_list");
      const raw: string[] = listData?.result || listData || [];
      workIds = raw.map((id: string) => id.replace(/^"+|"+$/g, ""));
    }

    workIds = [...new Set(workIds)].slice(0, 200);
    const results: WorkProgress[] = [];

    for (const id of workIds) {
      try {
        // Get work item via the proxy
        const workData = await acmiCall("acmi_get", { namespace: "work", id });
        const profile = workData?.profile || {};
        const signals = workData?.signals || {};
        const events: ACMIEventPayload[] = workData?.timeline || workData?.timeline_recent || [];

        const title = (profile?.title as string) || id;
        const calc = calculateProgress(events);
        const status_before = (signals?.status as string) || profile?.status as string || "active";

        let status_after = status_before;
        if (calc.progress >= 100) status_after = "completed";
        else if (events.length === 0 && status_before === "active") status_after = "stalled";
        else if (events.length > 0 && status_before === "stalled") status_after = "active";

        let updated = false;
        if (!dryRun) {
          const currentProgress = Number(signals?.progress || 0);
          const currentStatus = signals?.status || "";

          if (currentProgress !== calc.progress || currentStatus !== status_after || !signals?.consolidated_at) {
            await acmiCall("acmi_work_signal", {
              id,
              signals: JSON.stringify({
                progress: calc.progress,
                activity_summary: calc.activity_summary,
                event_count: events.length,
                completed_events: calc.completed_events,
                last_active_ts: calc.last_active_ts,
                consolidated_at: new Date().toISOString(),
                status: status_after,
              }),
            });
            updated = true;
          }
        }

        results.push({
          id,
          title,
          progress: calc.progress,
          event_count: events.length,
          completed_events: calc.completed_events,
          last_active_ts: calc.last_active_ts,
          activity_summary: calc.activity_summary,
          status_before,
          status_after,
          updated,
        });
      } catch (err) {
        console.error(`Error processing work item ${id}:`, err);
        results.push({
          id,
          title: id,
          progress: 0,
          event_count: 0,
          completed_events: 0,
          last_active_ts: null,
          activity_summary: "error",
          status_before: "error",
          status_after: "error",
          updated: false,
        });
      }
    }

    const updated_count = results.filter((r) => r.updated).length;
    const total = results.length;

    return NextResponse.json({
      ok: true,
      dry_run: !!dryRun,
      summary: `${updated_count}/${total} work items updated with progress data`,
      total_scanned: total,
      updated_count,
      results,
    });
  } catch (error) {
    console.error("Consolidation error:", error);
    return NextResponse.json(
      { error: "Consolidation failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to /api/acmi/consolidate with optional {id: 'work-item-id'} or {dryRun: true}",
    usage: "Consolidates ACMI work item timeline events into progress signals for the GSD dashboard",
  });
}
