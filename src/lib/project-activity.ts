/**
 * Project Activity — View Shaping
 *
 * A single source of truth for the four GSD views:
 *   - /projects  (project tracker — list view, expanded detail)
 *   - /todo      (kanban — tasks grouped by status lane)
 *   - /calendar  (deadlines & recent activity feed)
 *   - /workflows (workflow tracker — same projects, focus on stages)
 *
 * Each view derives from `ProjectActivityRollup` so they stay in sync.
 */

import type {
  ProjectActivity,
  ProjectActivityRollup,
  ProjectActivityStatus,
  ProjectActivityTask,
  ProjectActivityEvent,
} from "./acmi-client";

// ---------------------------------------------------------------------------
// Kanban lane mapping
// ---------------------------------------------------------------------------

export type KanbanLane = "Today" | "This Week" | "This Month" | "Backlog";

export interface KanbanCard {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  owner: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: ProjectActivityTask["status"];
  lane: KanbanLane;
  progress: number;
  blocked: boolean;
  done: boolean;
  dueDate?: string; // YYYY-MM-DD
  /** ms epoch when the task last moved */
  updatedAt?: number;
  /** Human-readable "5h ago" */
  lastTouched: string;
  /** Direct link to the project tracker row */
  href: string;
}

export function tasksToKanban(
  rollup: ProjectActivityRollup,
  options: { now?: number; projectHrefBase?: string } = {}
): Record<KanbanLane, KanbanCard[]> {
  const now = options.now ?? Date.now();
  const hrefBase = options.projectHrefBase ?? "/projects";
  const buckets: Record<KanbanLane, KanbanCard[]> = {
    Today: [],
    "This Week": [],
    "This Month": [],
    Backlog: [],
  };
  for (const project of rollup.projects) {
    for (const task of project.tasks) {
      const lane = taskToLane(task, now);
      const updated = task.updatedAt || project.lastActivityTs || 0;
      buckets[lane].push({
        id: task.id,
        projectId: project.id,
        projectTitle: project.title,
        title: task.title,
        owner: task.owner || project.owner || "unassigned",
        priority: task.priority || "P2",
        status: task.status,
        lane,
        progress: task.progress,
        blocked: task.status === "stalled",
        done: task.status === "completed",
        updatedAt: updated || undefined,
        lastTouched: updated ? relTime(updated, now) : "no activity",
        href: `${hrefBase}?focus=${encodeURIComponent(project.id)}#${encodeURIComponent(task.id)}`,
      });
    }
  }
  // Stable sort: P0 first, then by updatedAt desc
  const order: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  for (const lane of Object.keys(buckets) as KanbanLane[]) {
    buckets[lane].sort((a, b) => {
      const pa = order[a.priority] ?? 9;
      const pb = order[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }
  return buckets;
}

function taskToLane(task: ProjectActivityTask, now: number): KanbanLane {
  if (task.status === "completed") return "Backlog";
  if (task.status === "pending") return "Backlog";
  const ageMs = task.updatedAt ? now - task.updatedAt : Infinity;
  if (task.priority === "P0" || ageMs < 24 * 60 * 60 * 1000) return "Today";
  if (ageMs < 7 * 24 * 60 * 60 * 1000) return "This Week";
  if (ageMs < 30 * 24 * 60 * 60 * 1000) return "This Month";
  return "Backlog";
}

// ---------------------------------------------------------------------------
// Calendar items
// ---------------------------------------------------------------------------

export type CalendarKind = "milestone" | "deadline" | "task" | "activity";

export interface CalendarItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  kind: CalendarKind;
  projectId: string;
  projectTitle: string;
  meta?: string;
}

export function toCalendar(
  rollup: ProjectActivityRollup,
  options: { windowDays?: number; now?: number } = {}
): CalendarItem[] {
  const now = options.now ?? Date.now();
  const window = (options.windowDays ?? 60) * 24 * 60 * 60 * 1000;
  const items: CalendarItem[] = [];
  const cutoff = now - window;
  for (const project of rollup.projects) {
    // Milestone events
    for (const m of project.milestones) {
      if (m.done) continue;
      // Place undated milestones "today" so they show up
      items.push({
        id: `${project.id}-m-${m.name}`,
        date: isoDate(now),
        title: `${project.title}: ${m.name}`,
        kind: "milestone",
        projectId: project.id,
        projectTitle: project.title,
        meta: "milestone pending",
      });
    }
    // Recent activity (past 14 days) — these become calendar entries too
    for (const ev of project.recentEvents) {
      if (ev.ts < cutoff) continue;
      const kind: CalendarKind = ev.kind.includes("milestone")
        ? "milestone"
        : ev.kind.includes("deadline") || ev.kind.includes("stalled")
        ? "deadline"
        : "activity";
      items.push({
        id: ev.id,
        date: isoDate(ev.ts),
        title: ev.summary,
        kind,
        projectId: project.id,
        projectTitle: project.title,
        meta: relTime(ev.ts, now),
      });
    }
  }
  // De-dupe by id, then sort newest first
  const seen = new Set<string>();
  const out: CalendarItem[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  out.sort((a, b) => b.date.localeCompare(a.date));
  return out;
}

// ---------------------------------------------------------------------------
// Workflow view (similar to project tracker, but stages-focused)
// ---------------------------------------------------------------------------

export interface WorkflowRow {
  id: string;
  title: string;
  status: ProjectActivityStatus;
  owner: string;
  stages: { name: string; done: boolean }[];
  progress: number;
  lastActivityLabel: string;
  priority: number;
  href: string;
}

export function projectsToWorkflows(rollup: ProjectActivityRollup): WorkflowRow[] {
  return rollup.projects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    owner: p.owner,
    stages: p.milestones.length > 0 ? p.milestones : defaultStages(p),
    progress: p.progress,
    lastActivityLabel: p.lastActivityLabel,
    priority: p.priority,
    href: `/workflows/${p.id}`,
  }));
}

function defaultStages(p: ProjectActivity): { name: string; done: boolean }[] {
  if (p.tasks.length === 0) return [];
  return [
    { name: "Kickoff", done: p.progress >= 10 },
    { name: "Design", done: p.progress >= 30 },
    { name: "Implementation", done: p.progress >= 60 },
    { name: "Shipping", done: p.status === "completed" || p.progress >= 95 },
  ];
}

// ---------------------------------------------------------------------------
// Project tracker rows
// ---------------------------------------------------------------------------

export interface ProjectRow {
  id: string;
  title: string;
  status: ProjectActivityStatus;
  owner: string;
  progress: number;
  milestones: { name: string; done: boolean }[];
  completedMilestones: string[];
  pipelineValue: string;
  description: string;
  domain?: string;
  githubUrl?: string;
  primaryLanguage?: string;
  lastActivityLabel: string;
  lastActivityTs: number;
  counts: ProjectActivity["counts"];
  tasks: ProjectActivityTask[];
  recentEvents: ProjectActivityEvent[];
  needsTriage: boolean;
  section: string;
  href: string;
}

export function projectsToRows(rollup: ProjectActivityRollup): ProjectRow[] {
  return rollup.projects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    owner: p.owner,
    progress: p.progress,
    milestones: p.milestones,
    completedMilestones: p.milestones.filter((m) => m.done).map((m) => m.name),
    pipelineValue: p.pipelineValue || derivePipeline(p),
    description: p.description,
    domain: p.domain,
    githubUrl: p.githubUrl,
    primaryLanguage: p.primaryLanguage,
    lastActivityLabel: p.lastActivityLabel,
    lastActivityTs: p.lastActivityTs,
    counts: p.counts,
    tasks: p.tasks,
    recentEvents: p.recentEvents,
    needsTriage: p.needsTriage,
    section: p.section,
    href: `/projects?focus=${encodeURIComponent(p.id)}`,
  }));
}

function derivePipeline(p: ProjectActivity): string {
  if (p.status === "completed") return "shipped";
  if (p.status === "post-close") return "closed";
  if (p.status === "stale") return "needs revival";
  if (p.tasks.length === 0) return "triage";
  const active = p.counts.active;
  if (active >= 5) return "$10k+";
  if (active >= 3) return "$5-10k";
  if (active >= 1) return "$1-5k";
  return "explore";
}

// ---------------------------------------------------------------------------
// Human-consumable activity feed (cross-project, latest first)
// ---------------------------------------------------------------------------

export interface ActivityFeedEntry {
  id: string;
  ts: number;
  date: string;
  source: string;
  kind: string;
  summary: string;
  projectId: string;
  projectTitle: string;
  href: string;
  rel: string;
}

export function toActivityFeed(rollup: ProjectActivityRollup, limit = 40): ActivityFeedEntry[] {
  const now = Date.now();
  const all: ActivityFeedEntry[] = [];
  for (const p of rollup.projects) {
    for (const ev of p.recentEvents) {
      all.push({
        id: ev.id,
        ts: ev.ts,
        date: isoDate(ev.ts),
        source: ev.source,
        kind: ev.kind,
        summary: ev.summary,
        projectId: p.id,
        projectTitle: p.title,
        href: `/projects?focus=${encodeURIComponent(p.id)}#evt-${encodeURIComponent(ev.id)}`,
        rel: relTime(ev.ts, now),
      });
    }
  }
  all.sort((a, b) => b.ts - a.ts);
  return all.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Status badge normalization for view rendering
// ---------------------------------------------------------------------------

export type ViewStatus = "active" | "stalled" | "completed" | "pending";

export function toViewStatus(s: ProjectActivityStatus): ViewStatus {
  if (s === "completed" || s === "post-close") return "completed";
  if (s === "stalled" || s === "stale") return "stalled";
  if (s === "pending" || s === "low-activity") return "pending";
  return "active";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isoDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function relTime(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

// ---------------------------------------------------------------------------
// Top-level aggregator the four pages can call
// ---------------------------------------------------------------------------

export interface DashboardActivity {
  rollup: ProjectActivityRollup;
  projects: ProjectRow[];
  workflows: WorkflowRow[];
  kanban: Record<KanbanLane, KanbanCard[]>;
  calendar: CalendarItem[];
  feed: ActivityFeedEntry[];
}

export function shapeDashboard(rollup: ProjectActivityRollup): DashboardActivity {
  return {
    rollup,
    projects: projectsToRows(rollup),
    workflows: projectsToWorkflows(rollup),
    kanban: tasksToKanban(rollup),
    calendar: toCalendar(rollup),
    feed: toActivityFeed(rollup),
  };
}
