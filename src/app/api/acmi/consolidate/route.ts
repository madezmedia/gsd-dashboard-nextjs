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

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

async function exec(args: unknown[]): Promise<unknown> {
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const d = (await res.json()) as { result?: unknown };
  return d?.result;
}

function calcProgress(events: ACMIEventPayload[]) {
  if (!events.length) return { progress: 0, completed_events: 0, activity_summary: "no activity", last_active_ts: null as string | null };

  const completed = events.filter(e =>
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
  if (completed >= 10) pct = 100;
  else if (completed >= 5) pct = 75;
  else if (completed >= 2) pct = 60;
  else if (events.length >= 20) pct = 50;
  else if (events.length >= 10) pct = 35;
  else if (events.length >= 5) pct = 25;
  else if (events.length >= 2) pct = 10;
  else pct = 5;

  return {
    progress: pct,
    completed_events: completed,
    activity_summary: completed > 0
      ? `${completed} milestones / ${events.length} total`
      : `${events.length} events`,
    last_active_ts: latest ? new Date(latest).toISOString() : null,
  };
}

function parseTimeline(raw: unknown): ACMIEventPayload[] {
  if (!Array.isArray(raw)) return [];
  // Could be WITHSCORES format: [json, score, json, score, ...]
  // or flat format: [json, json, json, ...]
  const events: ACMIEventPayload[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (/^-?\d+(\.\d+)?$/.test(item)) continue; // skip scores
    try {
      const parsed = JSON.parse(item) as ACMIEventPayload;
      if (parsed && parsed.summary) events.push(parsed);
    } catch { /* skip unparseable */ }
  }
  return events;
}

export async function POST(req: NextRequest) {
  try {
    const { id: singleId, dryRun } = (await req.json()) as {
      id?: string; dryRun?: boolean;
    } || {};

    let workIds: string[];

    if (singleId) {
      workIds = [singleId];
    } else {
      const keysRaw = await exec(["KEYS", "acmi:work:*:profile"]);
      const keys = Array.isArray(keysRaw) ? keysRaw as string[] : [];
      workIds = keys
        .map(k => k.replace(/^acmi:work:/, "").replace(/:profile$/, ""))
        .filter(Boolean);
      workIds = [...new Set(workIds)].slice(0, 200);
    }

    const results: WorkProgress[] = [];

    for (const id of workIds) {
      try {
        const [profileRaw, signalsRaw, timelineRaw] = await Promise.all([
          exec(["GET", `acmi:work:${id}:profile`]),
          exec(["HGETALL", `acmi:work:${id}:signals`]),
          exec(["ZRANGE", `acmi:work:${id}:timeline`, "0", "-1", "WITHSCORES"]),
        ]);

        let profile: Record<string, unknown> = {};
        let signals: Record<string, unknown> = {};

        if (typeof profileRaw === "string") {
          try { profile = JSON.parse(profileRaw); } catch { profile = {}; }
        }

        // HGETALL returns flat array [key, val, key, val, ...]
        if (Array.isArray(signalsRaw)) {
          for (let i = 0; i < signalsRaw.length; i += 2) {
            const k = signalsRaw[i];
            const v = signalsRaw[i + 1];
            if (typeof k === "string" && v !== undefined) {
              signals[k] = v;
            }
          }
        }

        const events = parseTimeline(timelineRaw);
        const title = (profile?.title as string) || id;
        const calc = calcProgress(events);
        const statusBefore = (signals?.status as string) || "active";

        let statusAfter = statusBefore;
        if (calc.progress >= 100) statusAfter = "completed";
        else if (events.length === 0 && statusBefore === "active") statusAfter = "stalled";
        else if (events.length > 0 && statusBefore === "stalled") statusAfter = "active";

        let updated = false;
        if (!dryRun) {
          const curPct = Number(signals?.progress || 0);
          const curStatus = signals?.status || "";
          const curConsolidated = signals?.consolidated_at;

          if (curPct !== calc.progress || curStatus !== statusAfter || !curConsolidated) {
            const flatPairs: string[] = [];
            const newSignals: Record<string, unknown> = {
              progress: calc.progress,
              activity_summary: calc.activity_summary,
              event_count: events.length,
              completed_events: calc.completed_events,
              last_active_ts: calc.last_active_ts,
              consolidated_at: new Date().toISOString(),
              status: statusAfter,
            };
            for (const [k, v] of Object.entries(newSignals)) {
              flatPairs.push(k, v === null ? "" : String(v));
            }
            if (flatPairs.length > 0) {
              await exec(["HSET", `acmi:work:${id}:signals`, ...flatPairs]);
              updated = true;
            }
          }
        }

        results.push({ id, title, progress: calc.progress, event_count: events.length,
          completed_events: calc.completed_events, last_active_ts: calc.last_active_ts,
          activity_summary: calc.activity_summary, status_before: statusBefore,
          status_after: statusAfter, updated });
      } catch (err) {
        results.push({ id, title: id, progress: 0, event_count: 0, completed_events: 0,
          last_active_ts: null, activity_summary: "error", status_before: "error",
          status_after: "error", updated: false });
      }
    }

    return NextResponse.json({
      ok: true,
      dry_run: !!dryRun,
      summary: `${results.filter(r => r.updated).length}/${results.length} updated`,
      total_scanned: results.length,
      updated_count: results.filter(r => r.updated).length,
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
    message: "POST /api/acmi/consolidate with {id?: string, dryRun?: boolean}",
    usage: "Scans ACMI work items, analyzes timeline events, writes progress signals back to Redis",
  });
}
