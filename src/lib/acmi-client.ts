/**
 * ACMI API Client
 * Real client that talks to ACMI via proxy, supporting both SaaS telemetry pages and ported components.
 */

import type {
  AcmiNamespace,
  AcmiProfile,
  AcmiSignals,
  AcmiEvent,
  AcmiTimelineOptions,
  AcmiBootstrap,
  AcmiWorkProfile,
  AcmiWorkSignals,
  AcmiWorkItem,
  AcmiCatOptions,
  AcmiCatResult,
  AcmiListResult,
  AcmiWorkStatus,
} from './acmi-types';

const ACMI_PROXY = "/api/acmi";

// ---------------------------------------------------------------------------
// Existing Dashboard types for backwards compatibility
// ---------------------------------------------------------------------------

export interface ACMIProfile {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "busy" | "offline";
  capabilities: string[];
  model?: string;
  lastActive?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export interface ACMIEvent {
  id: string;
  ts: string;
  source: string;
  kind: string;
  summary: string;
  correlationId?: string;
  payload?: unknown;
  origin?: "direct" | "coordination" | "work";
}

export interface ACMISignal {
  key: string;
  value: unknown;
  timestamp: string;
}

export interface ACMIBootstrap {
  profile: ACMIProfile;
  signals: ACMISignal[];
  timeline: ACMIEvent[];
  activeThreads: string[];
  rollup: Record<string, unknown>;
}

export const DEFAULT_MILESTONES = ["Kickoff", "Design", "Implementation", "Shipping"];

export interface ACMIWorkItem {
  id: string;
  title: string;
  status: "active" | "stalled" | "completed" | "pending";
  owner?: string;
  progress: number;
  stages?: { name: string; done: boolean }[];
  createdAt?: string;
  updatedAt?: string;
  timeline?: ACMIEvent[];
}

export interface ACMIDashboardRollup {
  totalAgents: number;
  activeAgents: number;
  totalWorkItems: number;
  activeWorkItems: number;
  stalledWorkItems: number;
  completedWorkItems: number;
  pendingWorkItems: number;
  pendingApprovals: number;
  recentEvents: ACMIEvent[];
  rawWorkItems: ACMIWorkItem[];
}

// Known agent name display overrides
const AGENT_DISPLAY_NAMES: Record<string, string> = {
  "aba-bcba-expert": "ABA BCBA Expert",
  "antigravity": "Antigravity",
  "artist-factory-agent": "Artist Factory",
  "bentley": "Bentley",
  "bentley-main": "Bentley (Main)",
  "bentley-temp": "Bentley (Temp)",
  "batch": "Batch",
  "bob": "Bob",
  "claude-code": "Claude Code",
  "claude-cowork": "Claude Cowork",
  "claude-desktop": "Claude Desktop",
  "claude-engineer": "Claude Engineer",
  "claude-engineer-cloud": "Claude Engineer (Cloud)",
  "claude-web": "Claude Web",
  "codex": "Codex",
  "competitor-watch-agent": "Competitor Watch",
  "design-agency": "Design Agency",
  "design-brand-guardian": "Brand Guardian",
  "design-ui-designer": "UI Designer",
  "design-ux-architect": "UX Architect",
  "design-ux-researcher": "UX Researcher",
  "design-visual-storyteller": "Visual Storyteller",
  "design-whimsy-injector": "Whimsy Injector",
  "director": "Director",
  "fanvue_orchestrator": "Fanvue Orchestrator",
  "fleet": "Fleet",
  "fleet-orchestrator": "Fleet Orchestrator",
  "folana": "Folana",
  "folana-journal": "Folana Journal",
  "gemini-cli": "Gemini CLI",
  "gemini-researcher": "Gemini Researcher",
  "grok": "Grok",
  "growth-hacker": "Growth Hacker",
  "hermes": "Hermes",
  "invitation-schema": "Invitation Schema",
  "lead-nurture-agent": "Lead Nurture",
  "main": "Main",
  "opencode": "OpenCode",
  "opencode-execute": "OpenCode Execute",
  "ops-center": "Ops Center",
  "ops-commander": "Ops Commander",
  "outreach-specialist": "Outreach Specialist",
  "perplexity": "Perplexity",
  "phase2-coordinator": "Phase 2 Coordinator",
  "publisher": "Publisher",
  "researcher": "Researcher",
  "seo-content-agent": "SEO Content",
  "sonic-branding": "Sonic Branding",
  "synthesizer": "Synthesizer",
  "tony": "Tony",
  "webmaster": "Webmaster",
  "whop-manager": "Whop Manager",
};

// ---------------------------------------------------------------------------
// Base relative proxy call
// ---------------------------------------------------------------------------

export async function acmiCall(tool: string, params: Record<string, unknown> = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get("token");
      if (urlToken) {
        window.localStorage.setItem("acmi_token", urlToken);
      }
    } catch (e) {
      console.error("Error resolving query param token:", e);
    }

    try {
      const cachedToken = window.localStorage.getItem("acmi_token");
      if (cachedToken) {
        headers["Authorization"] = `Bearer ${cachedToken}`;
      }
    } catch (e) {
      console.error("Error reading cached token:", e);
    }
  }

  // Resolve absolute URL if on the server (relaxed read mapping)
  let proxyUrl = ACMI_PROXY;
  if (typeof window === "undefined") {
    let serverBaseUrl = "http://localhost:3000";
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { headers: nextHeaders } = require("next/headers");
      const host = (await nextHeaders()).get("host");
      const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
      if (host) {
        serverBaseUrl = `${protocol}://${host}`;
      }
    } catch (e) {
      if (process.env.VERCEL_URL) {
        serverBaseUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NEXT_PUBLIC_APP_URL) {
        serverBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
      } else if (process.env.PORT) {
        serverBaseUrl = `http://localhost:${process.env.PORT}`;
      }
    }
    proxyUrl = `${serverBaseUrl}${ACMI_PROXY}`;
  }

  const res = await fetch(proxyUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ tool, params }),
  });
  if (!res.ok) {
    console.error(`ACMI API error: ${res.status} on ${tool}`);
    return null;
  }
  return res.json();
}

// Check if credentials exist (always true under our relative-proxy environment)
export function hasRedisCredentials(): boolean {
  return true;
}

// ---------------------------------------------------------------------------
// Profile operations
// ---------------------------------------------------------------------------

export async function getProfile(
  namespace: AcmiNamespace,
  id: string
): Promise<AcmiProfile | null> {
  try {
    const data = await acmiCall("acmi_get", { namespace, id });
    return data?.profile ?? null;
  } catch (err) {
    console.warn(`[acmi-client] getProfile failed for ${namespace}:${id}:`, err);
    return null;
  }
}

export async function setProfile(
  namespace: AcmiNamespace,
  id: string,
  profile: AcmiProfile
): Promise<void> {
  await acmiCall("acmi_profile", { namespace, id, profile });
}

export async function mergeProfile(
  namespace: AcmiNamespace,
  id: string,
  partial: Partial<AcmiProfile>
): Promise<void> {
  const current = await getProfile(namespace, id);
  const merged: AcmiProfile = {
    ...(current ?? { actor_type: 'agent' }),
    ...partial,
  };
  await setProfile(namespace, id, merged);
}

export async function deleteProfile(
  namespace: AcmiNamespace,
  id: string
): Promise<void> {
  await acmiCall("acmi_profile", { namespace, id, profile: {} });
}

// ---------------------------------------------------------------------------
// Signals operations
// ---------------------------------------------------------------------------

export async function getSignals(
  namespace: AcmiNamespace,
  id: string
): Promise<Record<string, unknown> | null> {
  try {
    const data = await acmiCall("acmi_get", { namespace, id });
    return data?.signals ?? null;
  } catch (err) {
    console.warn(`[acmi-client] getSignals failed for ${namespace}:${id}:`, err);
    return null;
  }
}

export async function getSignal<T = unknown>(
  namespace: AcmiNamespace,
  id: string,
  key: string
): Promise<T | undefined> {
  const all = await getSignals(namespace, id);
  return all?.[key] as T | undefined;
}

export async function setSignal(
  namespace: AcmiNamespace,
  id: string,
  key: string,
  value: unknown
): Promise<void> {
  await acmiCall("acmi_signal", { namespace, id, signals: { [key]: value } });
}

export async function setSignals(
  namespace: AcmiNamespace,
  id: string,
  signals: Record<string, unknown>
): Promise<void> {
  await acmiCall("acmi_signal", { namespace, id, signals });
}

export async function deleteSignal(
  namespace: AcmiNamespace,
  id: string,
  key: string
): Promise<void> {
  await acmiCall("acmi_signal", { namespace, id, signals: { [key]: null } });
}

// ---------------------------------------------------------------------------
// Timeline operations
// ---------------------------------------------------------------------------

export async function appendEvent(
  namespace: AcmiNamespace,
  id: string,
  event: AcmiEvent
): Promise<void> {
  await acmiCall("acmi_event", { namespace, id, ...event });
}

export async function getTimeline(
  namespace: AcmiNamespace,
  id: string,
  options: AcmiTimelineOptions = {}
): Promise<AcmiEvent[]> {
  try {
    const data = await acmiCall("acmi_get", { namespace, id });
    const events: AcmiEvent[] = data?.timeline ?? [];
    const { limit = 50, reverse = true, since, until } = options;

    let filtered = [...events];
    if (since !== undefined) {
      filtered = filtered.filter(e => {
        const t = typeof e.ts === "number" ? e.ts : new Date(e.ts).getTime();
        return t >= since;
      });
    }
    if (until !== undefined) {
      filtered = filtered.filter(e => {
        const t = typeof e.ts === "number" ? e.ts : new Date(e.ts).getTime();
        return t <= until;
      });
    }

    if (!reverse) {
      filtered.reverse();
    }

    return filtered.slice(0, limit);
  } catch (err) {
    console.warn(`[acmi-client] getTimeline failed for ${namespace}:${id}:`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Entity / Namespace operations
// ---------------------------------------------------------------------------

export async function getEntity(
  namespace: AcmiNamespace,
  id: string,
  timelineLimit = 10
): Promise<AcmiBootstrap> {
  const data = await acmiCall("acmi_get", { namespace, id });
  const timeline = data?.timeline ?? [];
  return {
    profile: data?.profile ?? null,
    signals: data?.signals ?? null,
    recentTimeline: timeline.slice(0, timelineLimit),
  };
}

export async function listIds(
  namespace: AcmiNamespace
): Promise<string[]> {
  try {
    const data = await acmiCall("acmi_list", { namespace });
    return data?.result ?? [];
  } catch (err) {
    console.warn(`[acmi-client] listIds failed for ${namespace}:`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Multi-stream timeline merge (cat)
// ---------------------------------------------------------------------------

export async function catTimeline(
  keys: { namespace: AcmiNamespace; id: string }[],
  options: AcmiCatOptions = {}
): Promise<AcmiCatResult> {
  const { sinceMs, limit = 50, deduplicate = false } = options;
  let minTs = sinceMs;
  if (options.since && !minTs) {
    minTs = parseSinceString(options.since);
  }

  try {
    const results = await Promise.all(
      keys.map(async ({ namespace, id }) => {
        const events = await getTimeline(namespace, id, {
          limit: 200,
          reverse: true,
          since: minTs,
        });
        return events;
      })
    );

    let allEvents: AcmiEvent[] = results.flat().sort((a, b) => {
      const tA = typeof a.ts === 'number' ? a.ts : new Date(a.ts).getTime();
      const tB = typeof b.ts === 'number' ? b.ts : new Date(b.ts).getTime();
      return tB - tA; // descending (most recent first)
    });

    if (deduplicate) {
      const seen = new Set<string>();
      allEvents = allEvents.filter((e) => {
        if (!e.correlationId) return true;
        if (seen.has(e.correlationId)) return false;
        seen.add(e.correlationId);
        return true;
      });
    }

    return {
      events: allEvents.slice(0, limit),
      total: allEvents.length,
      streamsQueried: keys.length,
    };
  } catch (err) {
    console.warn('[acmi-client] catTimeline failed:', err);
    return { events: [], total: 0, streamsQueried: keys.length };
  }
}

function parseSinceString(since: string): number {
  const match = since.match(/^(\d+)\s*(m|h|d)$/);
  if (!match) return Date.now() - 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'm': return Date.now() - value * 60 * 1000;
    case 'h': return Date.now() - value * 60 * 60 * 1000;
    case 'd': return Date.now() - value * 24 * 60 * 60 * 1000;
    default: return Date.now() - 24 * 60 * 60 * 1000;
  }
}

// ---------------------------------------------------------------------------
// Work item helpers
// ---------------------------------------------------------------------------

export async function createWorkItem(
  id: string,
  profile: AcmiWorkProfile
): Promise<void> {
  const namespace: AcmiNamespace = 'work';
  await setProfile(namespace, id, {
    actor_type: 'agent',
    ...profile,
  } as unknown as AcmiProfile);

  await appendEvent(namespace, id, {
    ts: Date.now(),
    source: 'system:acmi-client',
    kind: 'work-created',
    correlationId: `workCreated-${Date.now()}`,
    summary: `[work-created] Created work item: ${profile.title}`,
    payload: { title: profile.title },
  });
}

export async function getWorkItem(
  id: string
): Promise<AcmiWorkItem> {
  const namespace: AcmiNamespace = 'work';
  const [profile, signals, timeline] = await Promise.all([
    getProfile(namespace, id),
    getSignals(namespace, id),
    getTimeline(namespace, id, { limit: 50, reverse: true }),
  ]);

  return {
    id,
    profile: profile as unknown as AcmiWorkProfile | null,
    signals: signals as unknown as AcmiWorkSignals | null,
    timeline,
  };
}

export async function listWorkItems(): Promise<AcmiListResult> {
  const ids = await listIds('work');
  return { namespace: 'work', ids, count: ids.length };
}

// ---------------------------------------------------------------------------
// Raw commands & custom operations
// ---------------------------------------------------------------------------

export async function rawCommand(
  command: string,
  ...args: unknown[]
): Promise<unknown> {
  return acmiCall(command.toLowerCase(), { args });
}

function resilientToISOString(val: unknown, fallback: string = ""): string {
  if (val === null || val === undefined || val === "") return fallback;
  
  let dateObj: Date | null = null;
  if (val instanceof Date) {
    dateObj = val;
  } else if (typeof val === 'number') {
    dateObj = new Date(val);
  } else if (typeof val === 'string') {
    if (/^\d+$/.test(val.trim())) {
      dateObj = new Date(Number(val.trim()));
    } else {
      dateObj = new Date(val);
    }
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    return dateObj.toISOString();
  }
  return fallback || String(val);
}

// ---------------------------------------------------------------------------
// Backwards compatible dashboard getters (used by existing pages)
// ---------------------------------------------------------------------------

export async function fetchAgents(): Promise<ACMIProfile[]> {
  const data = await acmiCall("acmi_list", { namespace: "agent" });
  const ids: string[] = data?.result || data || [];
  
  const agentIds = ids.filter(id => !id.includes("-coordination") && !id.includes("thread"));
  const batch = agentIds.slice(0, 100);
  const profiles: ACMIProfile[] = [];
  
  const BATCH_SIZE = 10;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      chunk.map(id => acmiCall("acmi_get", { namespace: "agent", id }))
    );
    
    for (let j = 0; j < chunk.length; j++) {
      const id = chunk[j];
      const result = results[j];
      if (result.status !== "fulfilled" || !result.value) continue;
      
      const agentData = result.value;
      const profile = agentData?.profile || {};
      const signals = agentData?.signals || {};
      
      profiles.push({
        id,
        name: profile?.name || AGENT_DISPLAY_NAMES[id] || id,
        role: profile?.role || signals?.role || "agent",
        status: parseStatus(signals?.status || profile?.status || "idle"),
        capabilities: profile?.expertise || signals?.available_for || [],
        model: signals?.model_id || profile?.model || "unknown",
        lastActive: resilientToISOString(signals?.last_heartbeat_ts) || undefined,
      });
    }
  }
  
  return profiles;
}

function parseStatus(raw: string): ACMIProfile["status"] {
  const s = (raw || "").toLowerCase();
  if (s.includes("active") || s.includes("orchestrat")) return "active";
  if (s.includes("busy") || s.includes("work")) return "busy";
  if (s.includes("idle") || s.includes("sleep") || s.includes("standby")) return "idle";
  if (s.includes("offline") || s.includes("away")) return "offline";
  return "idle";
}

export async function fetchDashboardRollup(): Promise<ACMIDashboardRollup> {
  const agentData = await acmiCall("acmi_list", { namespace: "agent" });
  const agentIds: string[] = agentData?.result || agentData || [];
  const totalAgents = agentIds.filter(id => !id.includes("-coordination")).length;
  
  const rawWorkItems = await fetchWorkItems();
  const totalWorkItems = rawWorkItems.length;
  const activeWorkItems = rawWorkItems.filter(w => w.status === "active").length;
  const stalledWorkItems = rawWorkItems.filter(w => w.status === "stalled").length;
  const completedWorkItems = rawWorkItems.filter(w => w.status === "completed").length;
  const pendingWorkItems = rawWorkItems.filter(w => w.status === "pending").length;
  const pendingApprovals = stalledWorkItems;

  const threadData = await acmiCall("acmi_get", { namespace: "thread", id: "agent-coordination" });
  const threadResult = threadData?.result || threadData;
  const timeline: Record<string, unknown>[] = threadResult?.timeline || threadResult?.timeline_recent || [];
  
  const events: ACMIEvent[] = timeline
    .slice(0, 10)
    .map((e: Record<string, unknown>, i: number) => ({
      id: `evt-${i}`,
      ts: resilientToISOString(e.ts),
      source: String(e.source || "system"),
      kind: String(e.kind || "event"),
      summary: String(e.summary || "").substring(0, 120),
      correlationId: String(e.correlationId || ""),
    }));

  return {
    totalAgents,
    activeAgents: Math.min(18, totalAgents),
    totalWorkItems,
    activeWorkItems,
    stalledWorkItems,
    completedWorkItems,
    pendingWorkItems,
    pendingApprovals,
    recentEvents: events,
    rawWorkItems,
  };
}

export async function fetchAgent(id: string): Promise<ACMIProfile | null> {
  const agents = await fetchAgents();
  return agents.find(a => a.id === id) || null;
}

export async function fetchWorkItems(): Promise<ACMIWorkItem[]> {
  const data = await acmiCall("acmi_work_list");
  const raw: string[] = data?.result || data || [];
  const ids = raw.map(id => id.replace(/^"+|"+$/g, ''));
  
  const items: ACMIWorkItem[] = [];
  const batch = ids.slice(0, 175);
  
  const BATCH_SIZE = 10;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      chunk.map(id => acmiCall("acmi_get", { namespace: "work", id }))
    );
    
    for (let j = 0; j < chunk.length; j++) {
      const id = chunk[j];
      const result = results[j];
      if (result.status !== "fulfilled" || !result.value) continue;
      
      const workData = result.value;
      const profile = workData?.profile || {};
      const signals = workData?.signals || {};
      
      const title = profile?.title || id;
      const rawStatus = signals?.status || profile?.status || "active";
      const status = (rawStatus === "active" || rawStatus === "stalled" || rawStatus === "completed" || rawStatus === "pending")
        ? rawStatus as ACMIWorkItem["status"]
        : "active";
      
      let completedMilestones: string[] = [];
      if (signals?.completed_milestones) {
        try {
          completedMilestones = typeof signals.completed_milestones === "string"
            ? JSON.parse(signals.completed_milestones)
            : signals.completed_milestones;
          if (!Array.isArray(completedMilestones)) {
            completedMilestones = [];
          }
        } catch {
          completedMilestones = [];
        }
      }

      const milestones: string[] = profile?.milestones && profile.milestones.length > 0
        ? profile.milestones
        : DEFAULT_MILESTONES;
      const stages = milestones.map((m: string) => ({
        name: m,
        done: completedMilestones.includes(m),
      }));

      items.push({
        id,
        title,
        status,
        owner: profile?.owner || profile?.team?.lead || "unassigned",
        progress: (signals?.progress_pct ?? signals?.progress) ? parseInt(String(signals.progress_pct ?? signals.progress)) || 0 : 0,
        stages,
        createdAt: profile?.timeline?.created,
        updatedAt: profile?.timeline?.updated || profile?.timeline?.target,
      });
    }
  }
  
  return items;
}

export async function updateWorkItemMilestones(
  id: string,
  completedMilestones: string[],
  progress: number,
  status?: ACMIWorkItem["status"]
): Promise<boolean> {
  try {
    const signalsToUpdate: Record<string, unknown> = {
      completed_milestones: JSON.stringify(completedMilestones),
      progress,
    };
    if (status) {
      signalsToUpdate.status = status;
    }

    const signalResult = await acmiCall("acmi_work_signal", {
      id,
      signals: JSON.stringify(signalsToUpdate),
    });

    const eventResult = await acmiCall("acmi_work_event", {
      id,
      source: "vector-sync-agent",
      summary: `[milestone-completed] Auto-completed milestones: [${completedMilestones.join(", ")}] with overall progress set to ${progress}%`,
    });

    return !!(signalResult && eventResult);
  } catch (err) {
    console.error(`Failed to update milestones for work ${id}:`, err);
    return false;
  }
}

export async function fetchWorkItem(id: string): Promise<ACMIWorkItem | null> {
  try {
    const workData = await acmiCall("acmi_get", { namespace: "work", id });
    const profile = workData?.profile;
    if (!profile) return null;

    const signals = workData?.signals || {};
    const timeline = workData?.timeline || [];

    const title = profile?.title || id;
    const rawStatus = signals?.status || profile?.status || "active";
    const status = (rawStatus === "active" || rawStatus === "stalled" || rawStatus === "completed" || rawStatus === "pending")
      ? rawStatus as ACMIWorkItem["status"]
      : "active";

    let completedMilestones: string[] = [];
    if (signals?.completed_milestones) {
      try {
        completedMilestones = typeof signals.completed_milestones === "string"
          ? JSON.parse(signals.completed_milestones)
          : signals.completed_milestones;
        if (!Array.isArray(completedMilestones)) {
          completedMilestones = [];
        }
      } catch {
        completedMilestones = [];
      }
    }

    const milestones: string[] = profile?.milestones && profile.milestones.length > 0
      ? profile.milestones
      : DEFAULT_MILESTONES;

    const stages = milestones.map((m: string) => ({
      name: m,
      done: completedMilestones.includes(m),
    }));

    return {
      id,
      title,
      status,
      owner: profile?.owner || profile?.team?.lead || "unassigned",
      progress: (signals?.progress_pct ?? signals?.progress) ? parseInt(String(signals.progress_pct ?? signals.progress)) || 0 : 0,
      stages,
      createdAt: profile?.timeline?.created,
      updatedAt: profile?.timeline?.updated || profile?.timeline?.target,
      timeline,
    };
  } catch (err) {
    console.error(`Error in fetchWorkItem for ${id}:`, err);
    return null;
  }
}

export async function fetchWorkItemTimeline(id: string): Promise<ACMIEvent[]> {
  try {
    const workData = await acmiCall("acmi_get", { namespace: "work", id });
    return workData?.timeline || [];
  } catch (err) {
    console.error(`Error in fetchWorkItemTimeline for ${id}:`, err);
    return [];
  }
}

export async function fetchApprovals(): Promise<
  { id: string; title: string; requester: string; status: "pending" | "approved" | "rejected"; diff: string; createdAt: string }[]
> {
  const items = await fetchWorkItems();
  return items
    .filter(w => w.status === "stalled")
    .slice(0, 12)
    .map(w => ({
      id: w.id,
      title: w.title,
      requester: w.owner || "system",
      status: "pending" as const,
      diff: `work item: ${w.id}`,
      createdAt: w.createdAt || new Date().toISOString(),
    }));
}

export async function approveWorkItem(id: string): Promise<boolean> {
  try {
    const signalResult = await acmiCall("acmi_work_signal", {
      id,
      signals: { status: "active" }
    });

    const eventResult = await acmiCall("acmi_work_event", {
      id,
      source: "human-operator",
      kind: "hitl-approval",
      summary: `[hitl-approved] Work item approved by human operator. Resuming execution.`,
      correlationId: `hitlApprove-${Date.now()}`
    });

    const busResult = await acmiCall("acmi_event", {
      namespace: "thread",
      id: "agent-coordination",
      source: "user:admin",
      kind: "milestone-shipped",
      summary: `[approval] Human operator approved work item ${id}`,
      correlationId: `hitlApproveBus-${Date.now()}`
    });

    return !!(signalResult && eventResult && busResult);
  } catch (err) {
    console.error(`Failed to approve work item ${id}:`, err);
    return false;
  }
}

export async function rejectWorkItem(id: string): Promise<boolean> {
  try {
    const signalResult = await acmiCall("acmi_work_signal", {
      id,
      signals: { status: "pending" }
    });

    const eventResult = await acmiCall("acmi_work_event", {
      id,
      source: "human-operator",
      kind: "hitl-rejection",
      summary: `[hitl-rejected] Work item rejected by human operator. Stalling execution.`,
      correlationId: `hitlReject-${Date.now()}`
    });

    const busResult = await acmiCall("acmi_event", {
      namespace: "thread",
      id: "agent-coordination",
      source: "user:admin",
      kind: "stalled-alert",
      summary: `[rejection] Human operator rejected work item ${id}`,
      correlationId: `hitlRejectBus-${Date.now()}`
    });

    return !!(signalResult && eventResult && busResult);
  } catch (err) {
    console.error(`Failed to reject work item ${id}:`, err);
    return false;
  }
}

export async function fetchHitlQueue(): Promise<unknown[]> {
  try {
    const data = await acmiCall("acmi_hitl_list", {});
    return (data as Record<string, unknown>)?.result as unknown[] || [];
  } catch (err) {
    console.error("Failed to fetch HITL queue:", err);
    return [];
  }
}

export async function resolveHitlTicket(
  member: string,
  action: "approve" | "reject",
  note: string = "",
  id?: string
): Promise<boolean> {
  try {
    const data = await acmiCall("acmi_hitl_action", { member, action, note, id });
    return !!((data as Record<string, unknown>)?.success || data === "OK");
  } catch (err) {
    console.error("Failed to resolve HITL ticket:", err);
    return false;
  }
}

export async function fetchServices(): Promise<unknown[]> {
  try {
    const data = await acmiCall("acmi_service_list", {});
    return (data as Record<string, unknown>)?.result as unknown[] || [];
  } catch (err) {
    console.error("Failed to fetch services list:", err);
    return [];
  }
}

export async function triggerFleetSync(): Promise<boolean> {
  try {
    const data = await acmiCall("fleet_sync_trigger", {});
    return !!((data as Record<string, unknown>)?.success || data === "OK");
  } catch (err) {
    console.error("Failed to trigger fleet sync:", err);
    return false;
  }
}

export async function fetchAgentBootstrap(id: string): Promise<ACMIBootstrap | null> {
  try {
    const [agentRes, threadRes, allWorkItems] = await Promise.all([
      acmiCall("acmi_get", { namespace: "agent", id }),
      acmiCall("acmi_get", { namespace: "thread", id: "agent-coordination" }),
      fetchWorkItems().catch(() => [] as ACMIWorkItem[])
    ]);
    
    if (!agentRes) return null;
    
    const result = agentRes.result || agentRes;
    const profile = result.profile || {};
    const signals = result.signals || {};
    
    const directTimeline: Record<string, unknown>[] = result.timeline || result.timeline_recent || [];
    const coordinationTimeline: Record<string, unknown>[] = 
      threadRes?.timeline || threadRes?.timeline_recent || threadRes?.result?.timeline || threadRes?.result?.timeline_recent || [];
    
    const ownedWorkItems = allWorkItems.filter(w => {
      const owner = (w.owner || "").toLowerCase();
      const agentId = id.toLowerCase();
      return owner.includes(agentId) || agentId.includes(owner);
    });
    
    const workTimelines: Record<string, unknown>[][] = [];
    if (ownedWorkItems.length > 0) {
      const workDetailResults = await Promise.allSettled(
        ownedWorkItems.slice(0, 5).map(w => acmiCall("acmi_get", { namespace: "work", id: w.id }))
      );
      workDetailResults.forEach((res) => {
        if (res.status === "fulfilled" && res.value) {
          const wData = res.value.result || res.value;
          const wTimeline = wData.timeline || wData.timeline_recent || [];
          if (Array.isArray(wTimeline)) {
            workTimelines.push(wTimeline);
          }
        }
      });
    }
    
    const rawEvents: Array<{ ts: number; source: string; kind: string; summary: string; correlationId?: string; origin: "direct" | "coordination" | "work" }> = [];
    
    directTimeline.forEach(e => {
      rawEvents.push({
        ts: typeof e.ts === "number" ? e.ts : new Date(String(e.ts || "")).getTime() || Date.now(),
        source: String(e.source || id),
        kind: String(e.kind || "event"),
        summary: String(e.summary || ""),
        correlationId: String(e.correlationId || ""),
        origin: "direct",
      });
    });
    
    coordinationTimeline.forEach(e => {
      const sourceStr = String(e.source || "").toLowerCase();
      const agentId = id.toLowerCase();
      if (sourceStr.includes(agentId) || agentId.includes(sourceStr)) {
        rawEvents.push({
          ts: typeof e.ts === "number" ? e.ts : new Date(String(e.ts || "")).getTime() || Date.now(),
          source: String(e.source || "agent-coordination"),
          kind: String(e.kind || "event"),
          summary: String(e.summary || ""),
          correlationId: String(e.correlationId || ""),
          origin: "coordination",
        });
      }
    });
    
    workTimelines.forEach((timelineList, idx) => {
      const workItem = ownedWorkItems[idx];
      timelineList.forEach(e => {
        const sourceStr = String(e.source || "").toLowerCase();
        const agentId = id.toLowerCase();
        const matchesAgent = sourceStr.includes(agentId) || agentId.includes(sourceStr);
        
        if (matchesAgent || e.kind === "stalled-alert" || e.kind === "status-update" || e.kind === "milestone-completed") {
          rawEvents.push({
            ts: typeof e.ts === "number" ? e.ts : new Date(String(e.ts || "")).getTime() || Date.now(),
            source: String(e.source || workItem?.id || "work"),
            kind: String(e.kind || "event"),
            summary: workItem ? `[${workItem.title}] ${e.summary}` : String(e.summary || ""),
            correlationId: String(e.correlationId || ""),
            origin: "work",
          });
        }
      });
    });
    
    const seen = new Set<string>();
    const uniqueEvents: ACMIEvent[] = [];
    
    const sortedRaw = rawEvents.sort((a, b) => b.ts - a.ts);
    
    sortedRaw.forEach(e => {
      const roundedTs = Math.round(e.ts / 500) * 500;
      const normalizedSummary = e.summary.trim().toLowerCase().replace(/\s+/g, " ").substring(0, 100);
      const hash = `${roundedTs}-${e.kind}-${normalizedSummary}`;
      
      let isFuzzyDuplicate = false;
      for (const existing of uniqueEvents) {
        const existingTs = new Date(existing.ts).getTime();
        const timeDiff = Math.abs(e.ts - existingTs);
        if (timeDiff <= 5000) {
          const existingSummary = existing.summary.trim().toLowerCase().replace(/\s+/g, " ").substring(0, 100);
          if (
            existingSummary === normalizedSummary ||
            existingSummary.includes(normalizedSummary) ||
            normalizedSummary.includes(existingSummary)
          ) {
            isFuzzyDuplicate = true;
            break;
          }
        }
      }
      
      if (!seen.has(hash) && !isFuzzyDuplicate) {
        seen.add(hash);
        uniqueEvents.push({
          id: `aggregated-evt-${uniqueEvents.length}`,
          ts: resilientToISOString(e.ts, new Date().toISOString()),
          source: e.source,
          kind: e.kind,
          summary: e.summary,
          correlationId: e.correlationId,
          origin: e.origin,
        });
      }
    });
    
    return {
      profile: {
        id,
        name: profile.name || AGENT_DISPLAY_NAMES[id] || id,
        role: profile.role || signals.role || "agent",
        status: parseStatus(signals.status || profile.status),
        capabilities: profile.expertise || [],
        model: signals.model_id || "unknown",
        lastActive: resilientToISOString(signals.last_heartbeat_ts) || undefined,
      },
      signals: Object.entries(signals).map(([key, value]) => ({
        key,
        value,
        timestamp: new Date().toISOString(),
      })),
      timeline: uniqueEvents.slice(0, 50),
      activeThreads: [],
      rollup: {
        decisions: uniqueEvents.filter(e => e.kind === "decision").length,
        actions: uniqueEvents.filter(e => e.kind !== "decision" && e.kind !== "stalled-alert").length,
      },
    };
  } catch (err) {
    console.error(`Failed to bootstrap agent data for ${id}:`, err);
    return null;
  }
}

// Unified work item status update supporting both ACMIWorkItem["status"] and AcmiWorkStatus
export async function updateWorkItemStatus(
  id: string,
  status: string
): Promise<boolean> {
  try {
    const namespace: AcmiNamespace = 'work';

    // 1. Update signals in work item
    const signalResult = await acmiCall("acmi_work_signal", {
      id,
      signals: JSON.stringify({ status }),
    });

    // 2. Log work-level progress event
    const eventResult = await acmiCall("acmi_work_event", {
      id,
      source: "user:mikey",
      summary: `[status-update] Escalated and re-routed stalled workflow to ${status}`,
    });

    // 3. Post a coordination event to the central sync thread
    const ts = Date.now();
    const threadEventResult = await acmiCall("acmi_event", {
      namespace: "thread",
      id: "agent-coordination",
      source: "user:mikey",
      kind: "work-update",
      correlationId: `workStatusUpdate-${id}-${ts}`,
      summary: `[work-update @agent] Escalated stalled work item "${id}" to status "${status}"`,
    });

    return !!(signalResult && eventResult && threadEventResult);
  } catch (err) {
    console.error(`Failed to update work item status for ${id}:`, err);
    return false;
  }
}
export interface ACMIDashboardBootstrapPayload {
  agents: unknown[];
  workItems: unknown[];
  config: Record<string, unknown>;
  timeline: unknown[];
  events: unknown[];
  docs: unknown[];
  notes: unknown[];
  tasks: unknown[];
}

export async function fetchDashboardBootstrap(): Promise<ACMIDashboardBootstrapPayload | null> {
  try {
    const res = await acmiCall("acmi_dashboard_bootstrap");
    if (!res) return null;
    return res.result || res;
  } catch (err) {
    console.error("Failed to fetch dashboard bootstrap bundle:", err);
    return null;
  }
}

export async function fetchLatestRollup(key?: string): Promise<any> {
  try {
    const res = await acmiCall("acmi_rollup_get", { key });
    if (!res) return null;
    return res.result || res;
  } catch (err) {
    console.error("Failed to fetch latest rollup:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Mock data helpers for development/browsers (no Redis needed)
// ---------------------------------------------------------------------------

export interface MockDataOverrides {
  profile?: Partial<AcmiProfile>;
  signals?: Record<string, unknown>;
  timeline?: AcmiEvent[];
}

/**
 * Generate a mock ACMI bootstrap for development when Redis is unavailable.
 */
export function getMockBootstrap(overrides: MockDataOverrides = {}): AcmiBootstrap {
  return {
    profile: {
      actor_type: 'agent',
      name: 'claude-engineer',
      role: 'Lead Engineer',
      description: 'Full-stack engineering agent with expertise in TypeScript, React, and system architecture.',
      avatar: '🏗️',
      color: '#5EF2C6',
      expertise: ['TypeScript', 'React', 'Node.js', 'System Design', 'DevOps'],
      skills: ['software-development', 'code-review', 'architecture'],
      fleet_role: 'Engineering Lead',
      primary_threads: ['agent-coordination', 'tech-debt-review'],
      wake_window_utc: '00:00-23:59',
      ...overrides.profile,
    },
    signals: {
      status: 'working',
      current_work_item: 'acmi-dashboard-components',
      current_stage: 'design',
      started_at: new Date(Date.now() - 3600000).toISOString(),
      progress_pct: 65,
      blockers: [],
      ...overrides.signals,
    },
    recentTimeline: overrides.timeline ?? generateMockTimeline(),
  };
}

function generateMockTimeline(): AcmiEvent[] {
  const now = Date.now();
  return [
    { ts: now - 500000, source: 'agent:claude-engineer', kind: 'spawn', correlationId: `spawn-${now - 500000}`, summary: 'Session started: acmi-components build' },
    { ts: now - 400000, source: 'agent:claude-engineer', kind: 'milestone-shipped', correlationId: `milestone-${now - 400000}`, summary: 'Architecture plan ratified' },
    { ts: now - 300000, source: 'agent:design-ui-designer', kind: 'handoff-ack', correlationId: `handoff-${now - 300000}`, summary: 'Picked up UI component design' },
    { ts: now - 200000, source: 'agent:claude-engineer', kind: 'coord-note', correlationId: `coord-${now - 200000}`, summary: 'CSS token system finalized — Mad EZ v3 palette bound' },
    { ts: now - 100000, source: 'agent:design-brand-guardian', kind: 'review-pass', correlationId: `review-${now - 100000}`, summary: 'Brand review passed: palette and typography compliant' },
    { ts: now - 50000, source: 'agent:claude-engineer', kind: 'milestone-shipped', correlationId: `milestone-${now - 50000}`, summary: 'First three components written (ProfileCard, TimelineStream, SignalGauge)' },
  ];
}

// ---------------------------------------------------------------------------
// Factory / singleton
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Project Activity Consolidation
//
// Real-data-driven roll-up that powers Projects / Todo / Calendar / Workflows.
// Pulls from `acmi:project:*` (25 repos), `acmi:work:*` (249 items), and the
// `agent-coordination` thread timeline, then joins them into a single
// `ProjectActivity` shape so the four pages stay consistent.
// ---------------------------------------------------------------------------

export type ProjectActivityStatus =
  | "active"
  | "stalled"
  | "completed"
  | "pending"
  | "low-activity"
  | "post-close"
  | "stale";

export interface ProjectActivityTask {
  id: string;
  title: string;
  status: "active" | "stalled" | "completed" | "pending";
  owner?: string;
  priority?: "P0" | "P1" | "P2" | "P3";
  progress: number;
  updatedAt?: number;
  /** True when no timeline event for 72h+ */
  silent?: boolean;
}

export interface ProjectActivityEvent {
  id: string;
  ts: number;
  source: string;
  kind: string;
  summary: string;
  correlationId?: string;
  /** Which work item (if any) this event was attached to */
  workItemId?: string;
}

export interface ProjectActivityMilestone {
  name: string;
  done: boolean;
}

export interface ProjectActivity {
  id: string;
  title: string;
  description: string;
  status: ProjectActivityStatus;
  owner: string;
  section: string;
  domain?: string;
  githubUrl?: string;
  externalUrl?: string;
  primaryLanguage?: string;
  priority: number;
  /** Aggregated from work items */
  progress: number;
  milestones: ProjectActivityMilestone[];
  tasks: ProjectActivityTask[];
  recentEvents: ProjectActivityEvent[];
  lastActivityTs: number;
  lastActivityLabel: string;
  /** Days since last push to the repo, if known */
  daysSincePush?: number;
  /** Pipeline / business value (free-form, e.g. "$12.4k") */
  pipelineValue?: string;
  /** Aggregated counts for filters */
  counts: {
    active: number;
    stalled: number;
    completed: number;
    pending: number;
  };
  /** True when this project is from the auto-discovered batch (no real human owner yet) */
  needsTriage: boolean;
}

export interface ProjectActivityRollup {
  projects: ProjectActivity[];
  totalProjects: number;
  totalTasks: number;
  totalEvents: number;
  generatedAt: number;
  source: {
    projectCount: number;
    workItemCount: number;
    timelineEventsScanned: number;
  };
}

const STALL_THRESHOLD_MS = 72 * 60 * 60 * 1000;

function projectIdMatchesWork(projectSlug: string, workId: string, workProfile: Record<string, unknown>): boolean {
  if (!projectSlug) return false;
  const slug = projectSlug.toLowerCase();
  const wid = workId.toLowerCase();
  if (wid.includes(slug) || slug.includes(wid)) return true;
  // Check explicit project_id or parent fields
  const explicit =
    (workProfile.project_id as string) ||
    (workProfile.parent as string) ||
    ((workProfile.related_work as Record<string, unknown>)?.project as string);
  if (typeof explicit === "string" && explicit.toLowerCase().includes(slug)) return true;
  return false;
}

function eventMentionsProject(projectSlug: string, ev: { source?: string; summary?: string; correlationId?: string }): boolean {
  if (!projectSlug) return false;
  const s = projectSlug.toLowerCase();
  const text = `${ev.summary ?? ""} ${ev.correlationId ?? ""} ${ev.source ?? ""}`.toLowerCase();
  return text.includes(s);
}

function formatRelative(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function normalizeStatus(
  raw: unknown,
  fallback: ProjectActivityStatus = "active"
): ProjectActivityStatus {
  const s = String(raw ?? "").toLowerCase();
  if (s === "active" || s === "stalled" || s === "completed" || s === "pending") return s as ProjectActivityStatus;
  if (s === "low-activity") return "low-activity";
  if (s === "post-close") return "post-close";
  if (s === "stale") return "stale";
  if (s.includes("complete") || s.includes("shipped")) return "completed";
  if (s.includes("stall")) return "stalled";
  if (s.includes("draft") || s.includes("pending") || s.includes("await")) return "pending";
  return fallback;
}

export async function fetchProjectActivity(
  options: { maxProjects?: number; maxWorkItems?: number; timelineLimit?: number } = {}
): Promise<ProjectActivityRollup> {
  const { maxProjects = 50, maxWorkItems = 250, timelineLimit = 250 } = options;
  const now = Date.now();

  // 1. Pull all projects in parallel
  const projectIds = (await listIds("project")) || [];
  const projectIdSample = projectIds.slice(0, maxProjects);

  const projectRecords = await Promise.allSettled(
    projectIdSample.map((id) => acmiCall("acmi_get", { namespace: "project", id }))
  );

  // 2. Pull all work items in parallel
  const workItemIds = (await listIds("work")) || [];
  const workIdSample = workItemIds.slice(0, maxWorkItems);

  const workRecords = await Promise.allSettled(
    workIdSample.map((id) => acmiCall("acmi_get", { namespace: "work", id }))
  );

  // 3. Pull recent agent-coordination timeline once (not per project)
  let timelineEvents: ProjectActivityEvent[] = [];
  try {
    const threadData = await acmiCall("acmi_get", { namespace: "thread", id: "agent-coordination" });
    const rawTimeline: Array<Record<string, unknown>> = threadData?.timeline || [];
    timelineEvents = rawTimeline.slice(0, timelineLimit).map((e, i) => ({
      id: `tl-${i}`,
      ts: typeof e.ts === "number" ? (e.ts as number) : new Date(String(e.ts || "")).getTime() || now,
      source: String(e.source || "system"),
      kind: String(e.kind || "event"),
      summary: String(e.summary || "").slice(0, 240),
      correlationId: e.correlationId as string | undefined,
    }));
  } catch (err) {
    console.warn("[acmi-client] could not read agent-coordination timeline", err);
  }

  // 4. Build work item index (id → record)
  const workIndex: Array<{ id: string; profile: Record<string, unknown>; signals: Record<string, unknown>; timeline: ProjectActivityEvent[] }> = [];
  for (let i = 0; i < workIdSample.length; i++) {
    const r = workRecords[i];
    if (r.status !== "fulfilled" || !r.value) continue;
    const wid = workIdSample[i];
    const profile = (r.value.profile || {}) as Record<string, unknown>;
    const signals = (r.value.signals || {}) as Record<string, unknown>;
    const timeline = Array.isArray(r.value.timeline)
      ? (r.value.timeline as Array<Record<string, unknown>>).slice(0, 10).map((e, j) => ({
          id: `${wid}-${j}`,
          ts: typeof e.ts === "number" ? (e.ts as number) : new Date(String(e.ts || "")).getTime() || 0,
          source: String(e.source || "system"),
          kind: String(e.kind || "event"),
          summary: String(e.summary || "").slice(0, 240),
          correlationId: e.correlationId as string | undefined,
        }))
      : [];
    workIndex.push({ id: wid, profile, signals, timeline });
  }

  // 5. Build project → work item + event index
  const projects: ProjectActivity[] = [];
  for (let i = 0; i < projectIdSample.length; i++) {
    const r = projectRecords[i];
    if (r.status !== "fulfilled" || !r.value) continue;
    const pid = projectIdSample[i];
    const profile = (r.value.profile || {}) as Record<string, unknown>;
    const signals = (r.value.signals || {}) as Record<string, unknown>;
    const slug = String(profile.slug || pid);

    // 5a. Tasks: work items that match this project
    const tasks: ProjectActivityTask[] = workIndex
      .filter((w) => projectIdMatchesWork(slug, w.id, w.profile))
      .map((w) => {
        const updatedAt = w.signals.updated_at ? Number(w.signals.updated_at) : undefined;
        const silent = updatedAt ? now - updatedAt > STALL_THRESHOLD_MS : true;
        const status = normalizeStatus(w.signals.status || w.profile.status, "active");
        const priority = (w.profile.priority || w.signals.priority) as string | undefined;
        return {
          id: w.id,
          title: String(w.profile.title || w.id),
          status: status as ProjectActivityTask["status"],
          owner: w.profile.owner as string | undefined,
          priority: (["P0", "P1", "P2", "P3"].includes(String(priority)) ? priority : undefined) as ProjectActivityTask["priority"],
          progress: Number(w.signals.progress || 0),
          updatedAt,
          silent,
        };
      });

    // 5b. Project-level events from thread (mentions of project slug)
    const projectEvents = timelineEvents.filter((e) => eventMentionsProject(slug, e)).slice(0, 12);
    // Add per-work-item timeline tail
    const workItemEvents: ProjectActivityEvent[] = [];
    for (const t of tasks) {
      const w = workIndex.find((x) => x.id === t.id);
      if (!w) continue;
      for (const ev of w.timeline) {
        workItemEvents.push({ ...ev, workItemId: t.id });
      }
    }
    const merged = [...projectEvents, ...workItemEvents]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 15);
    const lastActivityTs = merged[0]?.ts || 0;

    // 5c. Milestones from work items
    const milestoneMap = new Map<string, boolean>();
    for (const t of tasks) {
      const m = wmilestonesForTask(workIndex, t.id);
      for (const [name, done] of m) {
        milestoneMap.set(name, (milestoneMap.get(name) || false) || done);
      }
    }
    const milestones: ProjectActivityMilestone[] = Array.from(milestoneMap.entries()).map(([name, done]) => ({
      name,
      done,
    }));
    if (milestones.length === 0 && tasks.length > 0) {
      // Synthesize from task progress distribution
      milestones.push(
        { name: "Kickoff", done: tasks.length > 0 },
        { name: "Design", done: tasks.some((t) => t.progress >= 25) },
        { name: "Implementation", done: tasks.some((t) => t.progress >= 50) },
        { name: "Shipping", done: tasks.every((t) => t.status === "completed") }
      );
    }

    // 5d. Aggregate metrics
    const counts = { active: 0, stalled: 0, completed: 0, pending: 0 };
    for (const t of tasks) counts[t.status] += 1;
    const progress =
      tasks.length === 0
        ? Number(profile.progress || 0)
        : Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length);

    const status = normalizeStatus(
      signals.status || profile.status,
      tasks.length === 0 ? "low-activity" : "active"
    );

    projects.push({
      id: pid,
      title: String(profile.name || profile.title || pid),
      description: String(profile.description || "").slice(0, 280),
      status,
      owner: String(profile.owner || signals.owner_agent || profile.provisioned_by || "unassigned"),
      section: String(profile.section || "general"),
      domain: profile.domain as string | undefined,
      githubUrl: profile.github_url as string | undefined,
      externalUrl: (profile.external_url as string) || (profile.domain ? `https://${profile.domain}` : undefined),
      primaryLanguage: profile.primary_language as string | undefined,
      priority: Number(profile.priority || 2),
      progress,
      milestones,
      tasks,
      recentEvents: merged,
      lastActivityTs,
      lastActivityLabel: lastActivityTs ? formatRelative(lastActivityTs, now) : "no recent activity",
      daysSincePush: typeof signals.days_since_push === "number" ? (signals.days_since_push as number) : undefined,
      pipelineValue: profile.pipeline_value as string | undefined,
      counts,
      needsTriage: Boolean(signals.needs_triage) || tasks.length === 0,
    });
  }

  // 6. Sort by recency, then priority
  projects.sort((a, b) => {
    if (a.lastActivityTs !== b.lastActivityTs) return b.lastActivityTs - a.lastActivityTs;
    return a.priority - b.priority;
  });

  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);

  return {
    projects,
    totalProjects: projects.length,
    totalTasks,
    totalEvents: timelineEvents.length,
    generatedAt: now,
    source: {
      projectCount: projectIds.length,
      workItemCount: workItemIds.length,
      timelineEventsScanned: timelineEvents.length,
    },
  };
}

function wmilestonesForTask(
  workIndex: Array<{ id: string; signals: Record<string, unknown>; profile: Record<string, unknown> }>,
  workId: string
): Array<[string, boolean]> {
  const w = workIndex.find((x) => x.id === workId);
  if (!w) return [];
  const milestones = (w.profile.milestones as string[] | undefined) || DEFAULT_MILESTONES;
  let completed: string[] = [];
  if (w.signals.completed_milestones) {
    try {
      completed = typeof w.signals.completed_milestones === "string"
        ? JSON.parse(w.signals.completed_milestones as string)
        : (w.signals.completed_milestones as string[]);
      if (!Array.isArray(completed)) completed = [];
    } catch {
      completed = [];
    }
  }
  return milestones.map((m) => [m, completed.includes(m)]);
}

export const acmiClient = {
  hasCredentials: hasRedisCredentials,
  getProfile, setProfile, mergeProfile, deleteProfile,
  getSignals, getSignal, setSignal, setSignals, deleteSignal,
  appendEvent, getTimeline, catTimeline,
  getEntity, listIds,
  acmiCall,
  createWorkItem, getWorkItem, listWorkItems, updateWorkItemStatus, updateWorkItemMilestones,
  fetchDashboardBootstrap,
  fetchLatestRollup,
  fetchProjectActivity,
  rawCommand,
  getMockBootstrap,
};

export type AcmiClient = typeof acmiClient;
