# Implementation Plan: Aggregated Individual Agent Timelines

## Overview
This plan implements an aggregated chronological timeline for individual agent detail screens. Currently, agent timelines are sparse because agents log events to centralized communication threads (e.g. `agent-coordination`) or specific `work` items rather than their individual agent namespaces. 

By building an aggregation pipeline, we will automatically scan:
1. Direct agent-level timeline events (`timeline_recent` from `acmi_get` with namespace `agent`).
2. Central coordination logs (`agent-coordination` thread).
3. Associated work item updates.

We will filter these events where the `source` matches the target agent, merge, de-duplicate, sort, and display them in a rich letterpress timeline.

---

## Proposed Changes

### Component 1: Aggregation Engine Pipeline

#### [MODIFY] [acmi-client.ts](file:///Users/michaelshaw/Projects/gsd-dashboard-nextjs/src/lib/acmi-client.ts)
*   Update `fetchAgentBootstrap(id: string)`:
    *   Fetch direct agent records.
    *   Fetch central thread `agent-coordination` records.
    *   Scan all active `work` item logs.
    *   Extract events matching the agent's identifier (`source` contains `id` or `agent:id`).
    *   Cleanly de-duplicate items based on a composite hash of their timestamp, summary, and kind.
    *   Sort the resulting list descending (newest events first).

---

### Component 2: Premium UI Refinement

#### [MODIFY] [page.tsx](file:///Users/michaelshaw/Projects/gsd-dashboard-nextjs/src/app/agents/[id]/page.tsx)
*   Integrate filter badges on the timeline view:
    *   `[ALL LOGS]`
    *   `[DIRECT]`
    *   `[COORDINATION]`
    *   `[WORK PROGRESS]`
*   Apply our high-contrast, sharp editorial design (monospace elements, thin `#1a1a1a/10` solid lines, warm background, and zero border radius).
*   Add automatic 5-second polling synchronization.

---

## Verification Plan

### Automated Tests
- Build verification: `npm run build`

### Manual Verification
- View `/agents/grok` or `/agents/bentley-main` and verify that the timeline tab aggregates events across direct agent actions, work-item status changes, and central coordination logs.
- Switch filter badges and verify that the timeline list correctly filters events on the fly.
