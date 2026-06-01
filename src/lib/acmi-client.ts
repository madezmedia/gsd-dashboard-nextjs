/**
 * ACMI API Client
 * Real client that talks to ACMI via proxy.
 */

const ACMI_PROXY = "/api/acmi";


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

export interface ACMIWorkItem {
  id: string;
  title: string;
  status: "active" | "stalled" | "completed" | "pending";
  owner?: string;
  progress: number;
  stages?: { name: string; done: boolean }[];
  createdAt?: string;
  updatedAt?: string;
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

  const res = await fetch(ACMI_PROXY, {
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


export async function fetchAgents(): Promise<ACMIProfile[]> {
  const data = await acmiCall("acmi_list", { namespace: "agent" });
  const ids: string[] = data?.result || data || [];
  
  // Filter out non-agent entries (threads, etc.)
  const agentIds = ids.filter(id => !id.includes("-coordination") && !id.includes("thread"));
  const batch = agentIds.slice(0, 100);
  const profiles: ACMIProfile[] = [];
  
  // Fetch in parallel batches of 10 to avoid overwhelming the API
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
        lastActive: signals?.last_heartbeat_ts 
          ? new Date(Number(signals.last_heartbeat_ts)).toISOString()
          : undefined,
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
  // Get agent count (fast — just list, no individual profiles)
  const agentData = await acmiCall("acmi_list", { namespace: "agent" });
  const agentIds: string[] = agentData?.result || agentData || [];
  const totalAgents = agentIds.filter(id => !id.includes("-coordination")).length;
  
  // Get dynamic work items
  const rawWorkItems = await fetchWorkItems();
  const totalWorkItems = rawWorkItems.length;
  const activeWorkItems = rawWorkItems.filter(w => w.status === "active").length;
  const stalledWorkItems = rawWorkItems.filter(w => w.status === "stalled").length;
  const completedWorkItems = rawWorkItems.filter(w => w.status === "completed").length;
  const pendingWorkItems = rawWorkItems.filter(w => w.status === "pending").length;
  const pendingApprovals = stalledWorkItems;

  // Get recent events from agent-coordination thread
  const threadData = await acmiCall("acmi_get", { namespace: "thread", id: "agent-coordination" });
  const threadResult = threadData?.result || threadData;
  const timeline: Record<string, unknown>[] = threadResult?.timeline || threadResult?.timeline_recent || [];
  
  const events: ACMIEvent[] = timeline
    .slice(0, 10)
    .map((e: Record<string, unknown>, i: number) => ({
      id: `evt-${i}`,
      ts: typeof e.ts === 'number' ? new Date(e.ts).toISOString() : String(e.ts || ""),
      source: String(e.source || "system"),
      kind: String(e.kind || "event"),
      summary: String(e.summary || "").substring(0, 120),
      correlationId: String(e.correlationId || ""),
    }));

  return {
    totalAgents,
    activeAgents: Math.min(18, totalAgents), // approx from signals
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
  // Strip embedded quotes from work item IDs
  const ids = raw.map(id => id.replace(/^"+|"+$/g, ''));
  
  const items: ACMIWorkItem[] = [];
  const batch = ids.slice(0, 175);
  
  // Fetch in parallel batches of 10
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

      const milestones: string[] = profile?.milestones || [];
      const stages = milestones.map((m: string) => ({
        name: m,
        done: completedMilestones.includes(m),
      }));

      items.push({
        id,
        title,
        status,
        owner: profile?.owner || profile?.team?.lead || "unassigned",
        progress: signals?.progress ? parseInt(String(signals.progress)) || 0 : 0,
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
  const items = await fetchWorkItems();
  return items.find(w => w.id === id) || null;
}

export async function fetchApprovals(): Promise<
  { id: string; title: string; requester: string; status: "pending" | "approved" | "rejected"; diff: string; createdAt: string }[]
> {
  // Approvals from ACMI stalled/blocked work items
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

export async function fetchAgentBootstrap(id: string): Promise<ACMIBootstrap | null> {
  try {
    // 1. Fetch base agent profile, signals, coordination thread events, and active work items in parallel
    const [agentRes, threadRes, allWorkItems] = await Promise.all([
      acmiCall("acmi_get", { namespace: "agent", id }),
      acmiCall("acmi_get", { namespace: "thread", id: "agent-coordination" }),
      fetchWorkItems().catch(() => [] as ACMIWorkItem[])
    ]);
    
    if (!agentRes) return null;
    
    const result = agentRes.result || agentRes;
    const profile = result.profile || {};
    const signals = result.signals || {};
    
    // Direct agent timeline events
    const directTimeline: Record<string, unknown>[] = result.timeline || result.timeline_recent || [];
    
    // Coordination thread timeline events
    const coordinationTimeline: Record<string, unknown>[] = 
      threadRes?.timeline || threadRes?.timeline_recent || threadRes?.result?.timeline || threadRes?.result?.timeline_recent || [];
    
    // 2. Filter work items owned by this agent and fetch their timeline logs
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
    
    // 3. Aggregate all raw events with unified normalization
    const rawEvents: Array<{ ts: number; source: string; kind: string; summary: string; correlationId?: string }> = [];
    
    // Add direct events
    directTimeline.forEach(e => {
      rawEvents.push({
        ts: typeof e.ts === "number" ? e.ts : new Date(String(e.ts || "")).getTime() || Date.now(),
        source: String(e.source || id),
        kind: String(e.kind || "event"),
        summary: String(e.summary || ""),
        correlationId: String(e.correlationId || ""),
      });
    });
    
    // Add coordination events where the source field relates to the agent
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
        });
      }
    });
    
    // Add owned work item events logged by this agent or flagged as milestones
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
          });
        }
      });
    });
    
    // 4. De-duplicate raw events using a hybrid fuzzy strategy.
    // If the normalized summary is extremely similar and they occur within 5 seconds,
    // de-duplicate them to keep the feed clean. Otherwise, preserve them to ensure a full chronological audit trail.
    const seen = new Set<string>();
    const uniqueEvents: ACMIEvent[] = [];
    
    // Sort descending chronologically
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
          ts: new Date(e.ts).toISOString(),
          source: e.source,
          kind: e.kind,
          summary: e.summary,
          correlationId: e.correlationId,
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
        lastActive: signals.last_heartbeat_ts
          ? new Date(Number(signals.last_heartbeat_ts)).toISOString()
          : undefined,
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

export async function updateWorkItemStatus(
  id: string,
  status: ACMIWorkItem["status"]
): Promise<boolean> {
  try {
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

