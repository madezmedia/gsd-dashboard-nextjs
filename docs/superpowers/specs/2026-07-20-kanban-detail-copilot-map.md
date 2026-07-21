# Design map: Kanban detail cards + Copilot ACP UI

**Date:** 2026-07-20  
**Status:** DRAFT — awaiting approval  
**App:** gsd-dashboard-nextjs  
**Depends on:** Approach A (GSD shell + real ACMI components), route audit `fleet/state/gsd-route-acmi-audit.json`

---

## 1. Same page (current state)

| Surface | Today | Working? |
|---------|--------|----------|
| Home kanban | `KanbanBoard` — compact cards, **not clickable** to detail | ACMI data yes; detail UX no |
| Work detail | `/workflows/[id]` — full page via `fetchWorkItem` | **Yes — keep** |
| Work card primitive | `AcmiWorkItemCard` (profile/signals/progress) | Used on `/acmi` cluster + search; **not** on home kanban |
| Copilot | `CopilotPanel` — FAB + drawer + `AcpProvider` + `ChatView` + `PermissionDialog` + `LoginDialog` | Pattern works; UI not GSD-aligned; hardcoded `DEFAULT_CWD` local path |
| Agent cards | `AcmiProfileCard`, timeline, signals | Used on `/agents`, `/agents/[id]` |

**Invariant (keep working pattern):**  
Data stays on `acmi-client` / cockpit store / bus SSE. UI only composes existing cards + detail routes. No mock body for production paths.

---

## 2. Goals

1. **Kanban → detail cards**  
   - Click kanban item → rich detail without losing ACMI wiring.  
   - Prefer **sheet/drawer detail** on home + **deep link** to `/workflows/[id]` for share/full page.

2. **Map all “detail card” surfaces**  
   - Work items, HITL tickets, agents, services — consistent GSD skin + real data.

3. **Copilot full UI optimization**  
   - Keep `@acp-components/react` integration (`AcpProvider`, `ChatView`, permissions, login).  
   - GSD visual shell; fix viewport/z-index/cwd; optional multi-agent switcher later.

---

## 3. Information architecture (detail cards)

```text
┌─ GSD Shell ─────────────────────────────────────────────┐
│  Sidebar (full FLEET_NAV)     Main                       │
│                                │                         │
│  Home: KanbanBoard ──click──►  WorkItemDetailSheet       │
│         │                       │                        │
│         │                       ├─ header (id, status)   │
│         │                       ├─ progress / stages     │
│         │                       ├─ owner / tenant        │
│         │                       ├─ timeline (events)     │
│         │                       ├─ actions (status)      │
│         │                       └─ Open full page ──► /workflows/[id]
│                                                          │
│  FAB [COPILOT] ──open──► GsdCopilotDrawer                │
│                          ├─ AcpProvider (ws)             │
│                          ├─ ChatView                     │
│                          ├─ PermissionDialog             │
│                          └─ LoginDialog                  │
└──────────────────────────────────────────────────────────┘
```

### Card types (map)

| Card | Open from | Detail surface | Data API |
|------|-----------|----------------|----------|
| **Work item** | Home kanban, `/workflows`, `/todo` | Sheet + `/workflows/[id]` | `fetchWorkItem`, `updateWorkItemStatus` |
| **HITL ticket** | OperationsBoard, GatewayServices, `/hitl` | Inline expand or sheet | `resolveHitlTicket` / `fetchHitlQueue` |
| **Agent** | `/agents` grid | `/agents/[id]` (keep page) | `fetchAgentBootstrap` |
| **Service** | GatewayServices, `/services` | Optional mini-sheet (later) | `fetchServices` |

---

## 4. Kanban detail — proposed UX

### 4.1 Card (kanban cell) — slight upgrade

Keep `KanbanBoard` data logic. Change cell to:

- Clickable entire card → `onOpenWorkItem(id)`
- Keyboard: Enter/Space
- Visual: GSD work-card classes (border, mono id, progress bar) — same as design tokens
- Optional: use compact `AcmiWorkItemCard` **only if** id maps cleanly to v1.4 work profile; else keep light card + sheet loads full detail (safer)

**Recommendation:** light kanban cell + **WorkItemDetailSheet** loads `fetchWorkItem(id)` (reuse workflow page logic extracted to hook `useWorkItem(id)`).

### 4.2 WorkItemDetailSheet (new)

- Right sheet / modal inside GSD shell (`z-index` below copilot or coordinated)
- Sections:
  1. Title + status badge + progress  
  2. Owner, updated, correlation if present  
  3. Stage checklist (from existing workflow page)  
  4. Timeline stream (reuse `AcmiTimelineStream` if events shape matches)  
  5. Actions: escalate / mark complete (existing `updateWorkItemStatus`)  
  6. Link: “Open full page” → `/workflows/[id]`
- Poll every 5s while open (same as workflow detail page)

### 4.3 Full page (keep)

`/workflows/[id]` remains source of truth for deep links / share / bookmark.

---

## 5. Copilot — keep pattern, optimize UI

### Keep (do not break)

```text
I18nProvider
  └─ AcpProvider(agents[{ id, transport.websocket }])
       └─ CopilotPanelInner
            ├─ ChatView(sessionId)
            ├─ PermissionDialog
            └─ LoginDialog
```

### Optimize (UI + ops)

| Item | Change |
|------|--------|
| Skin | GSD drawer (`--gsd-*`), mono headers, status chip |
| Placement | Desktop: right drawer 440px; mobile full; z-50 above shell, below system modals |
| CWD | Env `NEXT_PUBLIC_ACP_DEFAULT_CWD` or browser workspace, **not** hardcoded Mac path |
| WS URL | Keep localStorage `acp_agent_ws_url`; preset chips: local / cicd bridge if known |
| Connection UX | Clear offline card; one-click reconnect; last error |
| Session | Show active session id; optional “new session” if ACP store supports |
| Context | Optional: inject current page + selected work item id into system note (non-breaking, additive) |
| Multi-agent | Phase 2: agent list from config (opencode, claude-code) — same AcpProvider shape |

### Out of scope for first pass

- Replacing ChatView with custom chat  
- Changing ACP protocol / transport type  

---

## 6. Implementation phases (subagent-ready)

| Phase | Owner | Deliverable |
|-------|--------|-------------|
| **P0** | Map (this doc) | Approved IA |
| **P1** | Kanban | Clickable cards + `WorkItemDetailSheet` + `useWorkItem` shared with `/workflows/[id]` |
| **P2** | GSD skin | Sheet + kanban cells use `--gsd-*` |
| **P3** | Copilot | GSD drawer skin, cwd/ws env, reconnect UX, z-index with shell |
| **P4** | HITL cards | Optional sheet for ticket detail (parity) |
| **P5** | Wire | Kanban → sheet → full page; smoke on prod |

---

## 7. File touch list (planned)

| File | Change |
|------|--------|
| `src/components/dashboard/KanbanBoard.tsx` | onClick open detail; GSD card classes |
| `src/components/dashboard/WorkItemDetailSheet.tsx` | **new** |
| `src/hooks/useWorkItem.ts` | **new** — shared fetch/poll/status |
| `src/app/workflows/[id]/page.tsx` | use shared hook (thin page) |
| `src/components/openui/copilot-panel.tsx` | GSD layout; cwd/ws; keep ACP tree |
| `src/components/fleet-template/gsd-components.css` | sheet + copilot tokens |
| `src/components/acmi/AcmiWorkItemCard.tsx` | optional GSD skin prop; reduce mock path in prod |

---

## 8. Success criteria

- [ ] Click home kanban item → real ACMI detail (not mock)  
- [ ] Full page `/workflows/[id]` still works  
- [ ] Copilot still connects via existing ACP websocket pattern  
- [ ] All sidebar routes remain (no page deleted)  
- [ ] No regression on `/acmi` cluster cards  

---

## 9. Open choices (need your call)

1. **Detail default:** Sheet-first (recommended) vs navigate immediately to `/workflows/[id]`  
2. **Kanban cell:** Light custom card (recommended) vs force `AcmiWorkItemCard` compact  
3. **Copilot default WS:** keep `ws://127.0.0.1:3100` or fleet bridge URL on cicd if you have one  

---

## Approval

Reply to lock:

- Detail: **sheet** | **full page only**  
- Cell: **light** | **AcmiWorkItemCard**  
- Then implement **P1 → P3** (kanban detail + copilot UI)  
