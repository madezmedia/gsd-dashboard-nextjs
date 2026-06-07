import { NextRequest, NextResponse } from "next/server";
import { fetchProjectActivity } from "@/lib/acmi-client";
import { shapeDashboard } from "@/lib/project-activity";

/**
 * GET /api/acmi/project-activity
 *
 * Server-side consolidation of ACMI projects + work items + thread timeline
 * into a unified `ProjectActivityRollup` and view-shaped dashboard data.
 *
 * Query params:
 *   - maxProjects:   cap on projects (default 50)
 *   - maxWorkItems:  cap on work items (default 250)
 *   - timelineLimit: cap on thread events (default 250)
 *   - shape:         "rollup" (default) | "dashboard" | "rows" | "kanban" | "calendar" | "feed"
 *
 * This is the single source of truth that powers /projects, /todo, /calendar,
 * /workflows — they all derive from this.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const maxProjects = clampInt(sp.get("maxProjects"), 1, 100, 50);
  const maxWorkItems = clampInt(sp.get("maxWorkItems"), 1, 1000, 250);
  const timelineLimit = clampInt(sp.get("timelineLimit"), 10, 2000, 250);
  const shape = (sp.get("shape") || "rollup").toLowerCase();

  try {
    const rollup = await fetchProjectActivity({ maxProjects, maxWorkItems, timelineLimit });
    const dashboard = shapeDashboard(rollup);

    let body: unknown = rollup;
    if (shape === "dashboard") body = dashboard;
    else if (shape === "rows") body = { projects: dashboard.projects, totalProjects: rollup.totalProjects, source: rollup.source };
    else if (shape === "kanban") body = { kanban: dashboard.kanban, totalTasks: rollup.totalTasks };
    else if (shape === "calendar") body = { calendar: dashboard.calendar, generatedAt: rollup.generatedAt };
    else if (shape === "feed") body = { feed: dashboard.feed, totalEvents: rollup.totalEvents };
    else if (shape === "workflows") body = { workflows: dashboard.workflows, totalProjects: rollup.totalProjects };
    else if (shape !== "rollup") {
      return NextResponse.json({ error: `unknown shape: ${shape}` }, { status: 400 });
    }

    return NextResponse.json(body, {
      headers: {
        // Allow reasonable caching; ACMI is read-heavy
        "Cache-Control": "public, max-age=10, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[api/acmi/project-activity] consolidation failed:", err);
    return NextResponse.json(
      { error: "consolidation failed", detail: String(err) },
      { status: 500 }
    );
  }
}

function clampInt(v: string | null, min: number, max: number, fallback: number): number {
  if (!v) return fallback;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
