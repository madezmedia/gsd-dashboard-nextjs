# GSD shell + real ACMI components (Approach A)

**Date:** 2026-07-20  
**Status:** APPROVED (user chose A)  
**Scope:** Home `/` only — compose proven ACMI components inside GSD chrome.

## Decision

- Keep **real** data path: `useCockpitData` + `useCockpitStore` + existing dashboard components.
- Apply GSD visual system via **scoped `--gsd-*` CSS** (no shadcn token collisions).
- Replace the big mock-oriented template body with the legacy cockpit composition.
- Multi-page design views (Agents/Tenants pages) are **out of scope**.

## Layout

```
.gsd-shell
  ├── aside (GSD brand + real app nav links + theme)
  └── main
        ├── topbar (title + tenant + connected + Sync)
        └── content
              ├── CockpitHeader (restyled / or slim — tenant may live only in topbar)
              ├── KpiGrid
              ├── OperationsBoard
              ├── grid: ActivityFeed | GatewayServices
              └── KanbanBoard
```

## Component restyle

Each of: `CockpitHeader`, `KpiGrid`, `OperationsBoard`, `ActivityFeed`, `GatewayServices`, `KanbanBoard`:

- Prefer `gsd-*` classNames + CSS in `gsd-shell.css` / `gsd-components.css`.
- Do not change ACMI fetch/HITL/sync logic.

## Fallback

- `/legacy-cockpit` remains unstyled shadcn path until removed later.
