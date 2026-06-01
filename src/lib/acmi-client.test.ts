import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  fetchAgents,
  fetchDashboardRollup,
  fetchAgentBootstrap,
  updateWorkItemStatus
} from "./acmi-client";

// Save original fetch
const originalFetch = globalThis.fetch;

// Helper to construct a Mock Response
function createMockResponse(status: number, data: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as unknown as Response;
}

// Global fetch mock store
let mockFetchHandler: (url: string, init?: RequestInit) => Promise<Response>;

beforeEach(() => {
  mockFetchHandler = async () => createMockResponse(200, {});
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    return mockFetchHandler(String(url), init);
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("ACMI Client - fetchAgents fetches and maps agents correctly", async () => {
  mockFetchHandler = async (url, init) => {
    const body = JSON.parse(init?.body as string);
    if (body.tool === "acmi_list" && body.params.namespace === "agent") {
      return createMockResponse(200, {
        result: ["bentley", "antigravity", "agent-coordination"]
      });
    }
    if (body.tool === "acmi_get" && body.params.namespace === "agent") {
      if (body.params.id === "bentley") {
        return createMockResponse(200, {
          profile: {
            name: "Bentley",
            role: "Lead Coordinator",
            status: "busy",
            expertise: ["coordination", "architecture"]
          },
          signals: {
            model_id: "gemini-2.0-flash",
            last_heartbeat_ts: 1782345600000
          }
        });
      }
      if (body.params.id === "antigravity") {
        return createMockResponse(200, {
          profile: {
            name: "Antigravity",
            expertise: ["coding", "automation"]
          },
          signals: {
            status: "active",
            role: "AI Developer"
          }
        });
      }
    }
    return createMockResponse(404, {});
  };

  const agents = await fetchAgents();
  assert.strictEqual(agents.length, 2); // agent-coordination should be filtered out
  
  const bentley = agents.find(a => a.id === "bentley");
  assert.ok(bentley);
  assert.strictEqual(bentley.name, "Bentley");
  assert.strictEqual(bentley.role, "Lead Coordinator");
  assert.strictEqual(bentley.status, "busy");
  assert.strictEqual(bentley.model, "gemini-2.0-flash");
  assert.deepStrictEqual(bentley.capabilities, ["coordination", "architecture"]);

  const antigravity = agents.find(a => a.id === "antigravity");
  assert.ok(antigravity);
  assert.strictEqual(antigravity.name, "Antigravity");
  assert.strictEqual(antigravity.role, "AI Developer");
  assert.strictEqual(antigravity.status, "active");
});

test("ACMI Client - fetchDashboardRollup parses dynamic work items and dual-key timeline events", async () => {
  mockFetchHandler = async (url, init) => {
    const body = JSON.parse(init?.body as string);
    if (body.tool === "acmi_list" && body.params.namespace === "agent") {
      return createMockResponse(200, ["bentley", "antigravity"]);
    }
    if (body.tool === "acmi_work_list") {
      return createMockResponse(200, { result: ["work-1", "work-2"] });
    }
    if (body.tool === "acmi_get" && body.params.namespace === "work") {
      if (body.params.id === "work-1") {
        return createMockResponse(200, {
          profile: { title: "Work Item One", owner: "bentley" },
          signals: { status: "active", progress: 45 }
        });
      }
      if (body.params.id === "work-2") {
        return createMockResponse(200, {
          profile: { title: "Work Item Two", owner: "antigravity" },
          signals: { status: "stalled", progress: 10 }
        });
      }
    }
    if (body.tool === "acmi_get" && body.params.namespace === "thread" && body.params.id === "agent-coordination") {
      // Testing dual-key sync fallback: using timeline_recent
      return createMockResponse(200, {
        timeline_recent: [
          { ts: 1782345600000, source: "bentley", kind: "task-completed", summary: "First task finished", correlationId: "corr-1" }
        ]
      });
    }
    return createMockResponse(404, {});
  };

  const rollup = await fetchDashboardRollup();
  assert.strictEqual(rollup.totalAgents, 2);
  assert.strictEqual(rollup.totalWorkItems, 2);
  assert.strictEqual(rollup.activeWorkItems, 1);
  assert.strictEqual(rollup.stalledWorkItems, 1);
  assert.strictEqual(rollup.pendingApprovals, 1);
  
  assert.strictEqual(rollup.recentEvents.length, 1);
  assert.strictEqual(rollup.recentEvents[0].summary, "First task finished");
  assert.strictEqual(rollup.recentEvents[0].correlationId, "corr-1");
  assert.strictEqual(rollup.recentEvents[0].source, "bentley");
});

test("ACMI Client - fetchAgentBootstrap aggregates events chronologically and applies fuzzy de-duplication", async () => {
  mockFetchHandler = async (url, init) => {
    const body = JSON.parse(init?.body as string);
    if (body.tool === "acmi_get" && body.params.namespace === "agent" && body.params.id === "bentley") {
      return createMockResponse(200, {
        profile: { name: "Bentley", role: "Lead" },
        signals: { status: "active" },
        // Direct timeline events
        timeline: [
          { ts: 10000, source: "bentley", kind: "decision", summary: "Made architectural decision" },
          { ts: 11000, source: "bentley", kind: "action", summary: "Initiating build sequence" },
          // duplicate of a later work event to test fuzzy de-duplication within 5s
          { ts: 15200, source: "bentley", kind: "action", summary: "Updated system layout" }
        ]
      });
    }
    if (body.tool === "acmi_get" && body.params.namespace === "thread" && body.params.id === "agent-coordination") {
      return createMockResponse(200, {
        timeline: [
          // unrelated event
          { ts: 12000, source: "antigravity", kind: "action", summary: "Antigravity did something" },
          // relevant event (source matches bentley)
          { ts: 13000, source: "bentley", kind: "action", summary: "Bentley coordinated action" }
        ]
      });
    }
    if (body.tool === "acmi_work_list") {
      return createMockResponse(200, ["work-1"]);
    }
    if (body.tool === "acmi_get" && body.params.namespace === "work" && body.params.id === "work-1") {
      return createMockResponse(200, {
        profile: { title: "Work Item One", owner: "bentley", milestones: ["m1", "m2"] },
        signals: { status: "active", progress: 50, completed_milestones: ["m1"] },
        timeline: [
          // Event near in time (15000) and very similar summary to the duplicate at 15200
          { ts: 15000, source: "bentley", kind: "action", summary: "Updated system layout" }
        ]
      });
    }
    return createMockResponse(404, {});
  };

  const bootstrap = await fetchAgentBootstrap("bentley");
  assert.ok(bootstrap);
  assert.strictEqual(bootstrap.profile.name, "Bentley");
  
  // Let's verify timeline.
  // Original Events for bentley:
  // 1. Made architectural decision (ts 10000)
  // 2. Initiating build sequence (ts 11000)
  // 3. Updated system layout (ts 15200)
  // 4. Bentley coordinated action (ts 13000)
  // 5. Updated system layout (ts 15000 - from work)
  // Total unique events should be:
  // - Updated system layout (one of 15200 or 15000 because they occur within 5s and have same summary)
  // - Bentley coordinated action (13000)
  // - Initiating build sequence (11000)
  // - Made architectural decision (10000)
  // Total of 4 unique events, sorted descending by timestamp.

  const timeline = bootstrap.timeline;
  assert.strictEqual(timeline.length, 4);
  
  // Verify descending sorting
  assert.strictEqual(timeline[0].summary, "Updated system layout");
  assert.strictEqual(timeline[1].summary, "Bentley coordinated action");
  assert.strictEqual(timeline[2].summary, "Initiating build sequence");
  assert.strictEqual(timeline[3].summary, "Made architectural decision");
});

test("ACMI Client - updateWorkItemStatus updates status and logs work event and coordination thread event", async () => {
  let workSignalCalled = false;
  let workEventCalled = false;
  let threadEventCalled = false;

  mockFetchHandler = async (url, init) => {
    const body = JSON.parse(init?.body as string);
    if (body.tool === "acmi_work_signal") {
      workSignalCalled = true;
      assert.strictEqual(body.params.id, "work-123");
      const signals = JSON.parse(body.params.signals);
      assert.strictEqual(signals.status, "completed");
      return createMockResponse(200, { ok: true });
    }
    if (body.tool === "acmi_work_event") {
      workEventCalled = true;
      assert.strictEqual(body.params.id, "work-123");
      assert.strictEqual(body.params.source, "user:mikey");
      assert.ok(body.params.summary.includes("completed"));
      return createMockResponse(200, { ok: true });
    }
    if (body.tool === "acmi_event" && body.params.namespace === "thread" && body.params.id === "agent-coordination") {
      threadEventCalled = true;
      assert.strictEqual(body.params.source, "user:mikey");
      assert.strictEqual(body.params.kind, "work-update");
      assert.ok(body.params.summary.includes("work-123"));
      return createMockResponse(200, { ok: true });
    }
    return createMockResponse(404, {});
  };

  const success = await updateWorkItemStatus("work-123", "completed");
  assert.ok(success);
  assert.ok(workSignalCalled);
  assert.ok(workEventCalled);
  assert.ok(threadEventCalled);
});
