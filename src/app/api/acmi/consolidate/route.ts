import { NextRequest, NextResponse } from "next/server";

interface ACMIEventPayload { id: string; ts: string | number; source: string; kind: string; summary: string; }
interface WorkProgress { id: string; title: string; progress: number; event_count: number; completed_events: number; last_active_ts: string | null; activity_summary: string; status_before: string; status_after: string; updated: boolean; }

// Same Upstash credentials as the ACMI proxy (same env vars)
const URL = process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

async function upstash(args: unknown[]): Promise<unknown> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  const d = (await res.json()) as { result?: unknown };
  return d?.result;
}
function parseHGetAll(res: unknown): Record<string, string> {
  if (!res) return {};
  if (Array.isArray(res)) {
    const obj: Record<string, string> = {};
    for (let i = 0; i < res.length; i += 2) {
      const key = res[i];
      const val = res[i + 1];
      if (typeof key === "string" && val !== undefined) obj[key] = String(val);
    }
    return obj;
  }
  if (typeof res === "object") {
    const record: Record<string, string> = {};
    for (const [key, val] of Object.entries(res as Record<string, unknown>)) {
      if (val !== undefined) record[key] = String(val);
    }
    return record;
  }
  return {};
}

function parseSignals(rawSignals: Record<string, string>): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rawSignals)) {
    if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
      try {
        parsed[key] = JSON.parse(val);
      } catch {
        parsed[key] = val;
      }
    } else {
      parsed[key] = val;
    }
  }
  return parsed;
}

async function fetchSignalsResilient(key: string): Promise<Record<string, unknown>> {
  try {
    const type = await upstash(["TYPE", key]);
    if (type === "hash") {
      const hgetAllRes = await upstash(["HGETALL", key]);
      const parsed = parseHGetAll(hgetAllRes);
      return parseSignals(parsed);
    } else if (type === "string") {
      const getRes = await upstash(["GET", key]);
      if (typeof getRes === "string") {
        try {
          return JSON.parse(getRes) as Record<string, unknown>;
        } catch {
          return {};
        }
      }
    }
  } catch (err) {
    console.error(`Resilient signals fetch failed for key ${key}:`, err);
  }
  return {};
}

async function writeSignalsResilient(key: string, newSignals: Record<string, unknown>): Promise<void> {
  const type = await upstash(["TYPE", key]);
  if (type === "string") {
    let currentSignals: Record<string, unknown> = {};
    const getRes = await upstash(["GET", key]);
    if (typeof getRes === "string") {
      try {
        currentSignals = JSON.parse(getRes);
      } catch {}
    }
    const merged = { ...currentSignals, ...newSignals };
    await upstash(["SET", key, JSON.stringify(merged)]);
  } else {
    const flatPairs: string[] = [];
    for (const [k, v] of Object.entries(newSignals)) {
      if (v !== undefined && v !== null) {
        flatPairs.push(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      }
    }
    if (flatPairs.length > 0) {
      await upstash(["HSET", key, ...flatPairs]);
    }
  }
}

function calc(events: ACMIEventPayload[]) {
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
  return { pct, done, summary: done > 0 ? `${done} milestones / ${events.length} total` : `${events.length} events`, lastActive: latest ? new Date(latest).toISOString() : null };
}

export async function POST(req: NextRequest) {
  try {
    const { id: singleId, dryRun } = (await req.json()) as { id?: string; dryRun?: boolean } || {};
    let workIds: string[];

    if (singleId) {
      workIds = [singleId];
    } else {
      const keys = (await upstash(["KEYS", "acmi:work:*:profile"])) as string[] | null;
      if (!keys || !Array.isArray(keys)) throw new Error(`KEYS returned ${JSON.stringify(keys)}`);
      workIds = keys.map(k => k.replace(/^acmi:work:/, "").replace(/:profile$/, "")).filter(Boolean).slice(0, 200);
    }

    const results: WorkProgress[] = [];
    for (const id of workIds) {
      try {
        const [profRaw, signals, tlRaw] = await Promise.all([
          upstash(["GET", `acmi:work:${id}:profile`]),
          fetchSignalsResilient(`acmi:work:${id}:signals`),
          upstash(["ZRANGE", `acmi:work:${id}:timeline`, "0", "-1", "WITHSCORES"]),
        ]);

        // Parse profile
        let profile: Record<string, unknown> = {};
        if (typeof profRaw === "string") try { profile = JSON.parse(profRaw); } catch {}
        const title = (profile?.title as string) || id;

        // Parse timeline (WITHSCORES flat array)
        const events: ACMIEventPayload[] = [];
        if (Array.isArray(tlRaw)) {
          for (const item of tlRaw) {
            if (typeof item !== "string") continue;
            if (/^-?\d+(\.\d+)?$/.test(item) && item.length > 10) continue; // skip numeric scores
            try { const p = JSON.parse(item); if (p?.summary) events.push(p); } catch {}
          }
        }

        const c = calc(events);
        const statusBefore = (signals?.status as string) || "active";
        let statusAfter = statusBefore;
        if (c.pct >= 100) statusAfter = "completed";
        else if (events.length === 0 && statusBefore === "active") statusAfter = "stalled";
        else if (events.length > 0 && statusBefore === "stalled") statusAfter = "active";

        let updated = false;
        if (!dryRun) {
          const curPct = Number(signals?.progress || 0);
          const curStatus = signals?.status || "";
          if (curPct !== c.pct || curStatus !== statusAfter || !signals?.consolidated_at) {
            const updatedSignals = {
              progress: c.pct,
              activity_summary: c.summary,
              event_count: events.length,
              completed_events: c.done,
              last_active_ts: c.lastActive,
              consolidated_at: new Date().toISOString(),
              status: statusAfter
            };
            await writeSignalsResilient(`acmi:work:${id}:signals`, updatedSignals);
            updated = true;
          }
        }

        results.push({ id, title, progress: c.pct, event_count: events.length, completed_events: c.done,
          last_active_ts: c.lastActive, activity_summary: c.summary, status_before: statusBefore,
          status_after: statusAfter, updated });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ id, title: id, progress: 0, event_count: 0, completed_events: 0,
          last_active_ts: null, activity_summary: msg.slice(0, 80), status_before: "error",
          status_after: "error", updated: false });
      }
    }

    return NextResponse.json({
      ok: true, dry_run: !!dryRun,
      summary: `${results.filter(r => r.updated).length}/${results.length} updated`,
      total_scanned: results.length, updated_count: results.filter(r => r.updated).length,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Consolidation error:", msg);
    return NextResponse.json({ error: "Consolidation failed", details: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "POST /api/acmi/consolidate with {id?, dryRun?}" });
}
