"use client";

/**
 * Maps live ACMI cockpit store → GSD Fleet Template view model.
 * Same data sources as the pre-template dashboard (useCockpitData + store).
 */
import { useMemo } from "react";
import { useCockpitStore, type HitlTicket, type TenantType } from "@/store/useCockpitStore";
import type { ACMIEvent, ACMIWorkItem } from "@/lib/acmi-client";
import type { Tone } from "./demo-data";
import { TENANT_CARDS } from "./demo-data";

function formatTime(ts: number | string | undefined): string {
  if (ts == null || ts === "") return "—";
  try {
    const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

function formatRelative(ts: number | undefined): string {
  if (!ts || isNaN(ts)) return "unknown";
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString();
}

function kindTone(kind: string): Tone {
  const k = (kind || "").toLowerCase();
  if (k.includes("incident") || k.includes("error") || k.includes("fail") || k.includes("stalled"))
    return "rb";
  if (k.includes("hitl") || k.includes("approval") || k.includes("escalat") || k.includes("urgent"))
    return "am";
  if (k.includes("milestone") || k.includes("complete") || k.includes("ship") || k.includes("ok"))
    return "em";
  return null;
}

function matchesTenant(
  tenant: TenantType,
  ...parts: (string | undefined | null)[]
): boolean {
  if (tenant === "all") return true;
  const t = tenant.toLowerCase();
  return parts.some((p) => (p || "").toLowerCase().includes(t));
}

function serviceUp(s: { verified_at?: number; setup_at?: number }): boolean {
  const ts = s.verified_at || s.setup_at;
  if (!ts) return false;
  // considered up if verified in last 15 minutes
  return Date.now() - ts < 15 * 60 * 1000;
}

export function useGsdFleetModel() {
  const {
    rollup,
    hitlQueue,
    services,
    busEvents,
    activeTenant,
    syncStatus,
    forcingSync,
    actioningMember,
    feedbackNote,
    setActiveTenant,
    setFeedbackNote,
  } = useCockpitStore();

  const safe = rollup || {
    totalAgents: 0,
    activeAgents: 0,
    totalWorkItems: 0,
    activeWorkItems: 0,
    stalledWorkItems: 0,
    completedWorkItems: 0,
    pendingWorkItems: 0,
    pendingApprovals: 0,
    recentEvents: [] as ACMIEvent[],
    rawWorkItems: [] as ACMIWorkItem[],
  };

  const workItems = useMemo(
    () =>
      (safe.rawWorkItems || []).filter((w) =>
        matchesTenant(activeTenant, w.title, w.id, w.owner),
      ),
    [safe.rawWorkItems, activeTenant],
  );

  const hitl = useMemo(
    () =>
      hitlQueue.filter((h) => matchesTenant(activeTenant, h.summary, h.member, h.source)),
    [hitlQueue, activeTenant],
  );

  const filteredServices = useMemo(
    () =>
      services.filter((s) => matchesTenant(activeTenant, s.slug, s.name, s.role)),
    [services, activeTenant],
  );

  const feed = useMemo(() => {
    const fromRollup = (safe.recentEvents || [])
      .filter((e) => matchesTenant(activeTenant, e.source, e.summary, e.kind))
      .map((e) => ({
        t: formatTime(e.ts),
        src: e.source || "unknown",
        sum: e.summary || e.kind || "event",
        kind: e.kind || "event",
        tone: kindTone(e.kind || e.summary || ""),
        key: e.id || `${e.ts}-${e.source}-${e.summary}`,
      }));

    const fromBus = busEvents
      .filter((e) =>
        matchesTenant(
          activeTenant,
          e.source,
          e.type,
          JSON.stringify(e.payload || {}),
        ),
      )
      .map((e) => {
        const summary =
          (typeof e.payload?.summary === "string" && e.payload.summary) ||
          (typeof e.payload?.message === "string" && e.payload.message) ||
          e.type ||
          "bus event";
        return {
          t: formatTime(e.ts),
          src: e.source || "bus",
          sum: String(summary),
          kind: e.type || "bus",
          tone: kindTone(e.type || String(summary)),
          key: e.id || `bus-${e.ts}-${e.source}`,
        };
      });

    // Prefer live bus first, then rollup
    const merged = [...fromBus, ...fromRollup];
    const seen = new Set<string>();
    const out = [];
    for (const row of merged) {
      if (seen.has(row.key)) continue;
      seen.add(row.key);
      out.push(row);
      if (out.length >= 12) break;
    }
    return out;
  }, [safe.recentEvents, busEvents, activeTenant]);

  const backlog = workItems.filter(
    (w) => w.status === "pending" || (!w.status && w.progress === 0),
  );
  const active = workItems.filter((w) => w.status === "active");
  const stalled = workItems.filter((w) => w.status === "stalled");
  const completed = workItems.filter((w) => w.status === "completed");

  const kanban = [
    {
      name: "[01] Backlog",
      count: `${backlog.length} items`,
      tone: null as Tone,
      items: backlog.slice(0, 6).map(mapWork),
    },
    {
      name: "[02] Active",
      count: `${active.length} items`,
      tone: "em" as Tone,
      items: active.slice(0, 6).map(mapWork),
    },
    {
      name: "[03] Stalled",
      count: `${stalled.length} items`,
      tone: "rb" as Tone,
      items: stalled.slice(0, 6).map(mapWork),
    },
    {
      name: "[04] Completed",
      count: `${completed.length} items`,
      tone: "em" as Tone,
      items: completed.slice(0, 6).map(mapWork),
    },
  ];

  const totalWork = workItems.length || safe.totalWorkItems;
  const activeWork = active.length || safe.activeWorkItems;
  const stalledWork = stalled.length || safe.stalledWorkItems;
  const completedWork = completed.length || safe.completedWorkItems;
  const pendingWork = backlog.length || safe.pendingWorkItems;
  const pendingApprovals = hitl.length || safe.pendingApprovals;
  const urgent = hitl.length + stalledWork;

  const servicesOnline = filteredServices.filter(serviceUp).length;
  const servicesTotal = filteredServices.length;

  const servicesView = filteredServices.map((s) => {
    const up = serviceUp(s);
    return {
      slug: s.slug,
      name: s.name || s.slug,
      up,
      lat: up ? "ok" : "—",
      verified: s.verified_at
        ? `verified ${formatRelative(s.verified_at)}`
        : up
          ? "online"
          : "unreachable",
    };
  });

  const hitlView = hitl.map((h: HitlTicket) => ({
    member: h.member?.replace(/^agent:/, "") || "unknown",
    when: formatRelative(h.ts),
    summary: h.summary || "HITL request",
    tag: h.kind || "hitl-escalation",
    ticket: h,
  }));

  // Agents derived from recent events sources + work item owners
  const agentMap = new Map<
    string,
    { id: string; role: string; work: string; seen: string; tenant: string; up: boolean; ts: number }
  >();
  for (const e of safe.recentEvents || []) {
    const id = (e.source || "").startsWith("agent:")
      ? e.source
      : e.source?.includes(":")
        ? e.source
        : e.source
          ? `agent:${e.source}`
          : "";
    if (!id || id === "agent:") continue;
    const ts =
      typeof e.ts === "number"
        ? e.ts
        : Date.parse(String(e.ts || "")) || 0;
    const prev = agentMap.get(id);
    if (!prev || ts > prev.ts) {
      agentMap.set(id, {
        id,
        role: "Fleet agent",
        work: e.summary || e.kind || "active",
        seen: formatRelative(ts || undefined),
        tenant: activeTenant === "all" ? "madez" : activeTenant,
        up: ts ? Date.now() - ts < 10 * 60 * 1000 : false,
        ts,
      });
    }
  }
  for (const w of workItems) {
    if (!w.owner) continue;
    const id = w.owner.startsWith("agent:") ? w.owner : `agent:${w.owner}`;
    if (!agentMap.has(id)) {
      agentMap.set(id, {
        id,
        role: "Work owner",
        work: w.title,
        seen: "—",
        tenant: activeTenant === "all" ? "madez" : activeTenant,
        up: w.status === "active",
        ts: 0,
      });
    }
  }
  const agents = Array.from(agentMap.values())
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 12);

  // Tenant cards: keep static roster, overlay live counts when tenant filter is all
  const tenantCards = TENANT_CARDS.map((tc) => {
    const items = (safe.rawWorkItems || []).filter((w) =>
      matchesTenant(tc.slug as TenantType, w.title, w.id, w.owner),
    );
    const hitlN = hitlQueue.filter((h) =>
      matchesTenant(tc.slug as TenantType, h.summary, h.member),
    ).length;
    const stalledN = items.filter((w) => w.status === "stalled").length;
    return {
      ...tc,
      agents: agents.filter((a) => a.id.toLowerCase().includes(tc.slug) || a.work.toLowerCase().includes(tc.slug)).length || tc.agents,
      items: items.length || tc.items,
      urgent: hitlN + stalledN,
      urgentTone: (hitlN + stalledN > 0 ? (stalledN > 0 ? "rb" : "am") : "em") as "em" | "am" | "rb",
    };
  });

  const connected = syncStatus !== "stalled";
  const loading = !rollup && syncStatus === "syncing";

  return {
    activeTenant,
    setActiveTenant,
    syncStatus,
    forcingSync,
    connected,
    loading,
    actioningMember,
    feedbackNote,
    setFeedbackNote,
    kpis: {
      totalAgents: safe.totalAgents,
      activeAgents: safe.activeAgents,
      servicesOnline,
      servicesTotal,
      activeWork,
      totalWork,
      urgent,
      pendingApprovals,
    },
    feed,
    hitl: hitlView,
    services: servicesView.slice(0, 8),
    servicesFull: servicesView,
    kanban,
    pipelineCounts: {
      backlog: pendingWork,
      active: activeWork,
      stalled: stalledWork,
      completed: completedWork,
      total: totalWork,
    },
    agents,
    tenantCards,
  };
}

function mapWork(w: ACMIWorkItem) {
  return {
    id: w.id,
    title: w.title,
    progress: typeof w.progress === "number" ? w.progress : 0,
    owner: (w.owner || "unassigned").replace(/^agent:/, ""),
  };
}
