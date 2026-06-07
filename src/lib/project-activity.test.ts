import { test } from "node:test";
import assert from "node:assert";
import {
  shapeDashboard,
  projectsToRows,
  projectsToWorkflows,
  tasksToKanban,
  toCalendar,
  toActivityFeed,
  relTime,
  isoDate,
  toViewStatus,
} from "./project-activity";
import type { ProjectActivity, ProjectActivityRollup, ProjectActivityTask, ProjectActivityEvent } from "./acmi-client";

// ---------------------------------------------------------------------------
// Fixture: a realistic rollup with 3 projects in different states
// ---------------------------------------------------------------------------

function makeTask(over: Partial<ProjectActivityTask> = {}): ProjectActivityTask {
  return {
    id: "t1",
    title: "Sample task",
    status: "active",
    owner: "mikey",
    priority: "P1",
    progress: 50,
    updatedAt: Date.now() - 3 * 60 * 60 * 1000,
    silent: false,
    ...over,
  };
}

function makeEvent(over: Partial<ProjectActivityEvent> = {}): ProjectActivityEvent {
  return {
    id: "e1",
    ts: Date.now() - 60 * 60 * 1000,
    source: "agent:test",
    kind: "milestone-shipped",
    summary: "Test event",
    ...over,
  };
}

function makeProject(over: Partial<ProjectActivity> = {}): ProjectActivity {
  return {
    id: "test-proj",
    title: "Test Project",
    description: "Test description",
    status: "active",
    owner: "mikey",
    section: "infrastructure",
    priority: 2,
    progress: 50,
    milestones: [
      { name: "Kickoff", done: true },
      { name: "Design", done: true },
      { name: "Implementation", done: false },
      { name: "Shipping", done: false },
    ],
    tasks: [makeTask()],
    recentEvents: [makeEvent()],
    lastActivityTs: Date.now() - 60 * 60 * 1000,
    lastActivityLabel: "1h ago",
    counts: { active: 1, stalled: 0, completed: 0, pending: 0 },
    needsTriage: false,
    ...over,
  };
}

function makeRollup(over: Partial<ProjectActivityRollup> = {}): ProjectActivityRollup {
  return {
    projects: [makeProject()],
    totalProjects: 1,
    totalTasks: 1,
    totalEvents: 1,
    generatedAt: Date.now(),
    source: { projectCount: 1, workItemCount: 1, timelineEventsScanned: 1 },
    ...over,
  };
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

test("shapeDashboard produces all four views in one pass", () => {
  const rollup = makeRollup();
  const out = shapeDashboard(rollup);
  assert.ok(out.rollup);
  assert.equal(out.projects.length, 1);
  assert.equal(out.workflows.length, 1);
  assert.ok(out.kanban.Today.length + out.kanban["This Week"].length + out.kanban["This Month"].length + out.kanban.Backlog.length > 0);
  assert.ok(out.calendar);
  assert.ok(out.feed);
});

test("projectsToRows includes pipeline value, status, counts", () => {
  const now = Date.now();
  const rollup = makeRollup({
    projects: [
      makeProject({
        id: "p1",
        status: "active",
        lastActivityTs: now - 1000 * 60 * 60,
        tasks: [makeTask({ status: "active" }), makeTask({ status: "active" })],
        counts: { active: 2, stalled: 0, completed: 0, pending: 0 },
      }),
      makeProject({
        id: "p2",
        status: "stalled",
        lastActivityTs: now - 1000 * 60 * 60 * 24 * 30, // 30d ago → sorts later
      }),
    ],
  });
  const rows = projectsToRows(rollup);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, "p1");
  assert.equal(rows[0].counts.active, 2);
  // Pipeline value should be derived (not "TBD")
  assert.notEqual(rows[0].pipelineValue, "TBD");
  assert.equal(rows[0].pipelineValue.includes("$") || rows[0].pipelineValue === "triage" || rows[0].pipelineValue === "explore", true);
});

test("tasksToKanban buckets tasks by recency and priority", () => {
  const now = Date.now();
  const rollup = makeRollup({
    projects: [
      makeProject({
        id: "p1",
        tasks: [
          makeTask({ id: "t-fresh", priority: "P0", updatedAt: now - 1000 * 60 * 30 }), // 30m ago → Today
          makeTask({ id: "t-week", priority: "P2", updatedAt: now - 1000 * 60 * 60 * 24 * 3 }), // 3d ago → This Week
          makeTask({ id: "t-old", priority: "P3", updatedAt: now - 1000 * 60 * 60 * 24 * 60 }), // 60d ago → Backlog
        ],
      }),
    ],
  });
  const buckets = tasksToKanban(rollup);
  assert.equal(buckets.Today.length, 1);
  assert.equal(buckets.Today[0].id, "t-fresh");
  assert.equal(buckets["This Week"].length, 1);
  assert.equal(buckets.Backlog.length, 1);
});

test("toCalendar produces undated milestone entries for projects with open milestones", () => {
  const rollup = makeRollup({
    projects: [makeProject({ id: "p1", milestones: [{ name: "Shipping", done: false }] })],
  });
  const cal = toCalendar(rollup);
  const milestone = cal.find((c) => c.kind === "milestone");
  assert.ok(milestone, "expected at least one milestone entry");
  assert.ok(milestone.title.includes("Shipping"));
  // undated milestones fall on today's date
  assert.equal(milestone.date, isoDate(Date.now()));
});

test("toActivityFeed returns latest first across all projects", () => {
  const now = Date.now();
  const rollup = makeRollup({
    projects: [
      makeProject({
        id: "p1",
        recentEvents: [makeEvent({ id: "e1", ts: now - 1000, summary: "oldest" })],
      }),
      makeProject({
        id: "p2",
        recentEvents: [makeEvent({ id: "e2", ts: now - 100, summary: "newest" })],
      }),
    ],
  });
  const feed = toActivityFeed(rollup);
  assert.equal(feed[0].id, "e2");
  assert.equal(feed[1].id, "e1");
});

test("toViewStatus collapses raw statuses to the 4 UI lanes", () => {
  assert.equal(toViewStatus("active"), "active");
  assert.equal(toViewStatus("stalled"), "stalled");
  assert.equal(toViewStatus("stale"), "stalled");
  assert.equal(toViewStatus("completed"), "completed");
  assert.equal(toViewStatus("post-close"), "completed");
  assert.equal(toViewStatus("pending"), "pending");
  assert.equal(toViewStatus("low-activity"), "pending");
});

test("relTime formats all bands", () => {
  const now = 1_700_000_000_000;
  assert.equal(relTime(now - 30_000, now), "just now");
  assert.equal(relTime(now - 5 * 60_000, now), "5m ago");
  assert.equal(relTime(now - 3 * 60 * 60_000, now), "3h ago");
  assert.equal(relTime(now - 2 * 24 * 60 * 60_000, now), "2d ago");
  assert.equal(relTime(now - 60 * 24 * 60 * 60_000, now), "2mo ago");
});

test("isoDate produces YYYY-MM-DD", () => {
  // 2026-06-07T15:30:00 local
  const d = new Date(2026, 5, 7, 15, 30, 0).getTime();
  assert.equal(isoDate(d), "2026-06-07");
});

test("projectsToWorkflows produces deep links to /workflows/[id]", () => {
  const rollup = makeRollup({ projects: [makeProject({ id: "alpha" })] });
  const rows = projectsToWorkflows(rollup);
  assert.equal(rows[0].href, "/workflows/alpha");
});

test("shapeDashboard is consistent: same total across all 4 views", () => {
  const rollup = makeRollup({
    projects: [
      makeProject({
        id: "p1",
        tasks: [makeTask({ id: "a" }), makeTask({ id: "b" }), makeTask({ id: "c" })],
        recentEvents: [makeEvent({ id: "x" }), makeEvent({ id: "y" })],
      }),
    ],
    totalTasks: 3,
    totalEvents: 2,
  });
  const out = shapeDashboard(rollup);
  const totalKanbanCards = out.kanban.Today.length + out.kanban["This Week"].length + out.kanban["This Month"].length + out.kanban.Backlog.length;
  assert.equal(totalKanbanCards, 3, "all 3 tasks must be bucketed somewhere");
  assert.equal(out.projects[0].tasks.length, 3, "project row keeps task list");
  assert.equal(out.feed.length, 2, "feed shows 2 events");
});
