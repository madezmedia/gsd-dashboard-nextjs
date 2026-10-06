# ACMI ↔ CRM ↔ GSD Dashboard — Diagnostic & Gap Analysis

- **Date:** 2026-10-06
- **Author:** claude-engineer (read-only diagnostic pass; no code fixes, no prod changes)
- **Repos:** `madezmedia/gsd-dashboard-nextjs` @ `fbc74d1` (main), `madezmedia/lead-processing-agent` @ `35c62ea` (main)
- **ACMI work item:** `acmi-crm-gsd-gap-analysis-20261006`
- **Correlation ID:** `acmiCrmGsdGapAnalysis-1791297989807`

---

## 1. Executive summary (plain English)

1. **The dashboard isn't connected to the new ACMI yet.** It doesn't go through the hosted ACMI MCP at all. It sends raw Redis commands (Upstash-REST format) to the "Polar exec" bridge and reads the **old unprefixed keys (`acmi:work:*`, `acmi:agent:*`)**. The new hosted ACMI writes everything to **`acmi:madez:*`**. Anything written through the hosted MCP since the tenant rewrite is very likely missing from the dashboard.
2. **"The CRM" isn't a working system today.** Four things carry the name, and none of them feeds the others:
   - the `lead-processing-agent`, which is an unmodified Vercel template (its CRM lookup returns `[]` and its email send does nothing)
   - a Prisma/Square "Sales Processing CRM" that exists only as a plan doc
   - HubSpot, which holds 39 contacts and 1 sample deal
   - every Supabase project, all of which are **paused**

   Nothing in the CRM path writes to ACMI.
3. **The new ACMI has a live read bug of its own.** `acmi_get` / `acmi_work_get` return `Redis REST 500` for `gsd-dashboard-client-access` and `nocodb-client-bases-setup`. This is the WRONGTYPE problem (their timelines are stored as strings, not sorted sets). The fix is in **acmi-product PR #60**, which is open and not merged.
4. **Timestamps are mixed (nanoseconds vs milliseconds).** `acmi_cat(thread:agent-coordination, since=14d)` returns events from **July** and leaves out the Sept–Oct ones. In the dashboard, any event with a nanosecond timestamp gets shown as **"now"**. The live-feed SSE cursor can also get stuck permanently once it sees one nanosecond-scored event.
5. **Security, which should come first:**
   - `/api/acmi` (which can read and write all fleet memory) has **no authentication**.
   - `saas_register_tenant` lets anyone create a tenant and a token.
   - A **NocoDB personal access token is hardcoded** in `src/app/api/nocodb-viewer/route.ts:4`. Treat it as leaked and rotate it.
6. **Build health is mostly OK.**
   - Dashboard: `tsc` ✅, `next build` ✅ (47 pages), `npm test` ✅ 22/22, `eslint` ❌ (101 errors / 446 warnings).
   - Lead agent: `tsc` ✅, `build` ❌ without `EXA_API_KEY`, because the Exa client is constructed when the module loads.
7. **Recommended path:** put one small server-side ACMI adapter in the dashboard that calls the **hosted MCP with a Bearer token** (or reads `acmi:madez:*` with timestamp normalisation, as a stop-gap). Lock down `/api/acmi`. Get PR #60 merged and the nanosecond rescore approved. Then give the lead agent real CRM and ACMI write paths.

---

## 2. System map

### Current (as found)

```
 Web form ──► lead-processing-agent (Vercel prj_0NIfe0..., template, never customised)
                │  research (Exa) → qualify (gpt-5) → write email → Slack HITL buttons
                │  crmSearch()  → returns []         (lib/services.ts:106-118)
                │  sendEmail()  → no-op              (lib/services.ts:84-89)
                │  lead_approved/rejected → no persistence (app/api/slack/route.ts:15-30)
                └─ ✖ no ACMI writes, ✖ no CRM writes

 HubSpot (portal 243011995) ── 39 contacts, 1 sample deal ── ✖ not wired to anything
 Supabase (11 projects incl. mad-ez-os) ── ALL status=INACTIVE (paused)
 "Sales Processing CRM" (Prisma + Square) ── plan doc only (crm-square-integration-plan.md); no code in either repo
 NocoDB (nocodb-u70402.vm.elestio.app) ◄── dashboard /api/nocodb proxy + /nocodb page (doc sync scripts)

 GSD dashboard (Vercel prj_dFLWYbOkk1hTWdu4zLS9wPDcRWzu, prod = fbc74d1)
   browser ─► /api/acmi (POST {tool,params}, NO AUTH)
                │  raw Redis cmds over Upstash-REST protocol
                ▼
           UPSTASH_REDIS_REST_URL  ──►  "Polar HTTPS exec" bridge  ──► VM Redis
                                          reads/writes UNPREFIXED acmi:{ns}:{id}:*
   browser ─► /api/bus/proxy (SSE) ─► ZRANGEBYSCORE acmi:bus:relay:events (unprefixed)

 Hosted ACMI (acmi-product /api/mcp, OAuth Bearer) ──► writes acmi:madez:{ns}:{id}:*   ◄── agents (this session, claude-web, codex…)
```

**Result:** the two halves share a Redis but read and write **different key families**.

### Target

```
 lead-processing-agent ──► CRM store (HubSpot OR revived Supabase/NocoDB — HITL decision)
        │                         │
        └── acmi_event / acmi_work_* (hosted MCP, Bearer) ──┐
                                                            ▼
                                  Hosted ACMI MCP  (acmi:madez:*; ms-normalised; type-aware reads)
                                                            ▲
 GSD dashboard ── server-only adapter (src/lib/acmi-server.ts) ── Bearer from env, never in browser
        ▲
   /api/acmi gated by session auth (Clerk/Basic/Vercel protection); tenant from server config, not client token
```

---

## 3. Working / Degraded / Broken

| # | Status | Area | Evidence (file:line / probe) | Repro |
|---|---|---|---|---|
| 1 | ✅ | Dashboard typecheck | `npx tsc --noEmit` → exit 0 | run in repo root |
| 2 | ✅ | Dashboard build | `next build` → exit 0, 47 routes | `npx next build` |
| 3 | ✅ | Dashboard unit tests | `npm test` → 22/22 pass | `npm test` |
| 4 | ✅ | Prod deploy | `dpl_3QzqEoP8…` READY, target production, sha `fbc74d1`; 0 runtime errors in the last 7d (Vercel) | Vercel MCP `get_runtime_errors` |
| 5 | ✅ | Hosted ACMI basic reads | `acmi_bootstrap`, `acmi_work_get(acmi-mcp-canonical-baseline-20260923)`, `acmi_work_get(ai-assessment-sales-pipeline)` return data | MCP calls |
| 6 | ❌ | Dashboard lint | `eslint` → 101 errors / 446 warnings. Top files: `src/app/api/chat/route.ts` (20), `packages/react/dist/index.cjs` (11, built artefact being linted), `src/app/projects/page.tsx` (8), `src/app/integrations/page.tsx` (8) | `npx eslint` |
| 7 | ❌ | Hosted ACMI WRONGTYPE | `acmi_get(work, gsd-dashboard-client-access)` → `{"ok":false,"error":"Redis REST 500"}`. The same happens for `acmi_work_get(gsd-dashboard-client-access)` and `acmi_work_get(nocodb-client-bases-setup)`. The PR #60 dry-run found `acmi:madez:work:*:timeline` stored as **string** | MCP calls above |
| 8 | ❌ | Hosted ACMI timestamp drift | `acmi_cat(["thread:agent-coordination"], since="14d")` returns events dated 2026-07-18 to 07-20 and 09-05, and none of the Sept 23 to Oct 5 events. This matches finding F4 in `acmi-mcp-canonical-baseline-20260923` | MCP call |
| 9 | ❌ | Dashboard key family | All reads and writes use `acmi:${namespace}:${id}:…` with no tenant prefix: `src/app/api/acmi/route.ts:443-444, 656, 676-677, 793, 836-837, 880-883, 893-898, 935`; `src/app/api/acmi/consolidate/route.ts:132-143`; `src/app/api/projects/todos/route.ts:25`. `ACMI_DEFAULT_TENANT` is set in Vercel per commit `8c533db` but is **read nowhere** in the code | `grep -rn ACMI_DEFAULT_TENANT src` → none |
| 10 | ❌ | Dashboard transport | `/api/acmi` speaks raw Upstash-REST to `UPSTASH_REDIS_REST_URL` (`route.ts:7-8, 353-361`). That env var is aliased to the Polar exec bridge (commit `8c533db` message). It never calls the hosted MCP | read code |
| 11 | ❌ | No auth on fleet-memory proxy | `src/app/api/acmi/route.ts:535` `POST` has no auth check. A missing or unknown Bearer falls back to the central DB (`route.ts:152-160`). Writes (`acmi_profile`, `acmi_event`, `acmi_work_create`, `acmi_hitl_action`) are open to anyone who knows the URL. No `proxy.ts` or `middleware.ts` exists | `curl -X POST <prod>/api/acmi -d '{"tool":"acmi_list","params":{"namespace":"agent"}}'` (**do not run against prod without Mikey OK**) |
| 12 | ❌ | Open tenant registration | `saas_register_tenant` (`route.ts:549-630`) writes `saas:tenant:*`, `saas:user_agent:*` and `saas:token:*` to central Redis without auth | code |
| 13 | ❌ | Hardcoded secret | `src/app/api/nocodb-viewer/route.ts:4` contains a literal `nc_pat_…` fallback. Value not reproduced here; **rotate it** | `grep -n nc_pat_ src` |
| 14 | ⚠️ | Hardcoded bridge defaults | `vm-local-bridge` token literal plus the bridge URL fallback in `scripts/sync-gsd-docs-to-nocodb.mjs:14` and `scripts/sync-hermes-kanban.mjs:33`; `default_token` plus the dead `152.53.201.27:8081` fallback still in `src/app/api/chat/route.ts:11-12` (PR #1 missed this file) | grep |
| 15 | ⚠️ | Write side-effect on every request | `ensureSeeded()` (`route.ts:73-148`) runs on every cold start (`route.ts:538`). If the key is missing it **writes** `saas:tenant:default_tenant` and the `default_token` mapping to prod Redis | code |
| 16 | ⚠️ | ns timestamps rendered as "now" | `parseSafeDateString` (`route.ts:59-70`): `new Date(1.78e18)` is invalid, `toISOString()` throws, and the catch returns `new Date()`. So nanosecond events show the current time and sort to the top | code + unit reasoning |
| 17 | ⚠️ | SSE bus cursor can lock | `/api/bus/proxy` polls `ZRANGEBYSCORE acmi:bus:relay:events (lastTs +inf` every 1s (`bus/proxy/route.ts:181-186, 241`). The client advances `lastTs` to the max `event.ts` it has seen (`src/lib/bus-stream.ts:66-69`). One ns-scored member jumps the cursor to about 1.78e18, and every ms-scored event after that is skipped forever. It also reads the unprefixed bus key | code |
| 18 | ⚠️ | Unbounded/blocking Redis ops | `ZRANGE … 0 -1` reads full timelines (`route.ts:444, 677, 935`; `consolidate/route.ts:143`). `KEYS acmi:*:*:profile` scans the whole keyspace (`route.ts:656, 893-898`; `consolidate:132`). These slow down as the fleet grows | code |
| 19 | ⚠️ | WRONGTYPE tolerance (dashboard side) | The dashboard handles WRONGTYPE better than the hosted MCP: signals reads/writes check `TYPE` first (`route.ts:387-439`), and timeline reads fall back to `GET` when `ZRANGE` fails (`route.ts:704-707`). Because it reads the wrong key family, that tolerance doesn't help yet | code |
| 20 | ⚠️ | Mock / static data | `src/app/todo/page.tsx:151-173` uses `MOCK_GOOGLE_TASKS`. `src/components/fleet-template/demo-data.ts` feeds `GsdFleetTemplate` / `useGsdFleetModel`, which no route mounts. `src/app/archive/page.tsx` reads static `src/data/fleet-archival-trace.json`. `getMockBootstrap` is exported from `src/lib/acmi-client.ts:1168` | grep `MOCK\|demo-data` |
| 21 | ⚠️ | Server→self HTTP hop | `acmiCall` on the server builds an absolute URL to its own `/api/acmi` (`src/lib/acmi-client.ts:179-206`), so SSR does a second HTTP round-trip through the open proxy | code |
| 22 | ⚠️ | VM-SSH routes on Vercel | `src/app/api/chat/route.ts:28-95` (ssh2 to 152.53.201.27) and `src/app/api/integrations/save/route.ts:205-298` (`scp`/`ssh root@152.53.201.27` via `exec`). These need an SSH key and binaries that don't exist on Vercel serverless, so they likely fail in prod. They are also unauthenticated routes that write secrets | code |
| 23 | ⚠️ | Hosted MCP `acmi_search_semantic` | Depends on a local-only Chroma install (per `acmi-semantic-memory-and-brand-20261005`), so it doesn't work in the cloud. Not used by the dashboard (`/api/search` uses its own `vector-engine.ts` on fetched work items) | work item |
| 24 | ❌ | Lead agent build | `pnpm build` → exit 1: `ExaError: API key must be provided … (EXA_API_KEY)`, thrown while collecting page data for `/.well-known/workflow/v1/step` (`lib/exa.ts:2` constructs the client at module load). `tsc` ✅ | `pnpm install && pnpm build` without env |
| 25 | ❌ | Lead agent CRM | `crmSearch` returns `[]` (`lib/services.ts:106-118`). `sendEmail` is empty (`lib/services.ts:84-89`). Slack approve/reject only `ack()`s (`app/api/slack/route.ts:15-30`). There is no data store of any kind. Repo history is a single `Initial commit`; the Vercel project `lead-processing-agent` was created 2026-01-21 and never updated | code |
| 26 | ❌ | CRM ↔ ACMI write path | Zero ACMI calls in `lead-processing-agent`. In the dashboard, only `src/app/api/chat/route.ts:222-223` knows about `acmi:madez:` (it reads both families). Its writes still go to unprefixed keys (`:275`, `:347`) | grep |
| 27 | ❌ | CRM data stores | Supabase: all 11 projects `INACTIVE` (incl. `mad-ez-os`, `ownerscout`). HubSpot: 39 contacts, 1 deal ("Sample Deal"). Square catalog IDs exist only in the plan doc. The Prisma `Prospect/ProspectOffer/Interaction` schema is not in either repo | Supabase/HubSpot MCP (read-only) |
| 28 | ⚠️ | Vercel deploy hygiene | Five `ERROR` production deployments on project `gsd-dashboard-nextjs` were built from **`acmi-product` / branch `feat/acmi-emit-v15`**, which means a second repo is linked to this project or was deployed into it by mistake | Vercel `list_deployments` |

**Not verified (blocked):**
- Vercel env var **names** for both projects. `filter_project_envs` was refused by the session's permission policy, and the lead agent project returned 403. The env inventory below comes from code only. Mikey (or an agent with env-read scope) should confirm names.
- I did **not** probe the prod `/api/acmi` directly, because of the seeding side-effect (#15) and the guardrails.

### Env var inventory (from code — names only)

| Var | Used by | Notes |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | acmi, bus/proxy, consolidate, projects/todos, chat | Prod alias → Polar exec bridge (per `8c533db`). The name is misleading: it isn't Upstash |
| `ACMI_BRIDGE_URL` / `_TOKEN` | sync scripts only | Not used by any runtime route |
| `ACMI_DEFAULT_TENANT` | **nothing** | Set in Vercel (per commit msg), never read |
| `REDIS_URL` / `REDIS_TOKEN` | `scripts/sync-hermes-kanban.mjs` | script only |
| `NOCODB_URL` / `NOCODB_API_KEY` | nocodb proxy/viewer | viewer has a hardcoded PAT fallback (#13) |
| `GROQ_API_KEY`, `XAI_API_KEY`, `DEEPGRAM_API_KEY`, `COMPOSIO_API_KEY` | chat / audit / tts / google-tasks | |
| `SSH_PRIVATE_KEY` | chat | VM SSH from serverless |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NEXT_PUBLIC_VERCEL_PROJECT_ID` | /api/vercel | |
| `GITEA_URL` / `GITEA_TOKEN` | /api/git | |
| `NEXT_PUBLIC_POSTHOG_*`, `NEXT_PUBLIC_APP_URL`, `SECRET`, `KANBAN_DB_PATH`, `PORT`, `VERCEL_URL` | misc | |
| **Missing for target:** `ACMI_MCP_URL`, `ACMI_MCP_BEARER` (server-only), `DASHBOARD_AUTH_*` | — | needed for P0 work |

Lead agent: `AI_GATEWAY_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_CHANNEL_ID`, `EXA_API_KEY` (`.env.example`). None of them relate to ACMI or a CRM.

---

## 4. Gaps to "talking to the new ACMI"

| Gap | Today | Needed |
|---|---|---|
| **Key shape / tenant** | Unprefixed `acmi:{ns}:{id}:*` everywhere in the dashboard. `ACMI_DEFAULT_TENANT` is ignored | Canonical `acmi:madez:{ns}:{id}:*`. Best done by letting the hosted MCP own the prefixing, so the dashboard stops constructing keys at all |
| **Auth (Bearer)** | Browser → open `/api/acmi`. The optional `?token=` / `localStorage` token only selects a tenant Redis and is not an auth gate. The token is also sent in the SSE query string (`bus-stream.ts:56`) | Server-only `ACMI_MCP_BEARER` (OAuth 2.1 / `MCP_DIRECT_AUTH_TOKEN` per acmi-product), never shipped to the client. Dashboard routes gated by a user session |
| **Transport** | Raw Redis over the Polar exec bridge | Hosted MCP (`acmi-product /api/mcp`, JSON-RPC `tools/call`) for reads and writes. If the MCP is too slow or chatty for dashboards, add REST endpoints in acmi-product (`/api/directive`, `/api/inbox`, `/api/hitl` already exist) rather than reaching into Redis |
| **Timeline ts normalisation** | `parseSafeDateString` maps ns to "now". The bus cursor is not normalised | Use `normTs()` (ns/µs/s → ms) everywhere a score is read, the same as PR "fix/mcp-ts-units-tenant-scope". Clamp the SSE `since` to ms. Fixed for good once the HITL-gated `rescore-ns-timelines.mjs --apply` runs |
| **WRONGTYPE handling** | Dashboard: tolerant (TYPE-checked). Hosted MCP: 500 on string timelines | Merge acmi-product **PR #60** (type-aware work reads + `read_warnings`). Then run the string→zset migration (dry-run already done, `--migrate` is HITL) |
| **Env vars** | `UPSTASH_*` aliased to the bridge; `ACMI_DEFAULT_TENANT` unused | Add `ACMI_MCP_URL` and `ACMI_MCP_BEARER`. After cut-over, remove `UPSTASH_*` from runtime routes. Rotate the NocoDB PAT and the bridge token |
| **Mock data** | `/todo` Google Tasks mock; `fleet-template/demo-data.ts`; static archive JSON | Swap `/todo` to `/api/composio/google-tasks` (route exists). Delete or archive the unmounted fleet-template. Leave the archive page static or regenerate it from ACMI |
| **Write paths (CRM / lead agent)** | None. The dashboard writes only to legacy keys | Lead agent emits `acmi_event` on `thread:agent-coordination` + `acmi_work_create` per lead (`lead-<slug>-<date>`), with kinds `lead-received`, `lead-qualified`, `lead-hitl-approved/rejected`, `email-sent`. The CRM record holds `acmi_work_id`. The dashboard `/hitl` reads the canonical HITL queue |
| **Bus** | Reads `acmi:bus:relay:events` (unprefixed), 1s polling SSE inside a serverless function | Read the canonical bus (`acmi:madez:bus:*` per mikey/crons notes) through an MCP/REST endpoint, with a normalised cursor. Consider moving to the existing super-bus relay / n8n webhook |

---

## 5. Prioritised fix plan

Legend: Effort S (≤½ day) / M (1–2 days) / L (3+ days). **HITL** = needs Mikey.

### P0: stop the bleeding, get correct reads

| # | Item | Effort | Owner | HITL |
|---|---|---|---|---|
| P0-1 | **Lock down the dashboard API.** Add `src/proxy.ts` (Next 16 proxy, formerly middleware; check `node_modules/next/dist/docs` first) or a per-route guard requiring a session or Basic auth on `/api/acmi`, `/api/bus/proxy`, `/api/integrations/save`, `/api/chat`, `/api/nocodb*`. Remove the unauthenticated `saas_register_tenant`. Stop `ensureSeeded()` writing on request | S–M | claude-engineer | **Yes**: pick the auth mechanism (Clerk like swarm-os vs Vercel Deployment Protection vs Basic) and set the secrets |
| P0-2 | **Rotate the leaked NocoDB PAT** and remove the literal from `nocodb-viewer/route.ts:4`. Also rotate or verify `vm-local-bridge` / `default_token` bridge creds and remove those literals | S | Mikey (rotate) + claude-engineer (code) | **Yes**: secrets |
| P0-3 | **Merge acmi-product PR #60** (WRONGTYPE) and the `fix/mcp-ts-units-tenant-scope` patch (normTs + tenantizeArgs). Verify on a preview: `acmi_get(work, gsd-dashboard-client-access)` returns 200, and `acmi_cat since=14d` shows no July events | M | codex / claude-code (existing owners) | **Yes**: merge + prod promote; `--migrate` / `--apply` stay HITL |
| P0-4 | **Server-side ACMI adapter in the dashboard** (`src/lib/acmi-server.ts`, `import 'server-only'`) that calls the hosted MCP with `ACMI_MCP_BEARER`, and rewire `/api/acmi` tool cases to it. Interim option if the MCP is not ready: keep the bridge but switch keys to `acmi:${ACMI_DEFAULT_TENANT}:…` and apply `normTs` on every score read | M | claude-engineer | **Yes**: provision `ACMI_MCP_BEARER` in Vercel env |

### P1: make data trustworthy and flowing

| # | Item | Effort | Owner | HITL |
|---|---|---|---|---|
| P1-1 | Fix the SSE bus: normalise the cursor, read the canonical bus key, cap the poll lifetime / set `maxDuration` | S | claude-engineer | no |
| P1-2 | Replace `KEYS` / `ZRANGE 0 -1` with `acmi_list` / `ZREVRANGE 0 N` (or MCP list tools) and bounded reads | S–M | claude-engineer | no |
| P1-3 | Decide the CRM system of record (HubSpot, already has 39 contacts, vs revived Supabase `mad-ez-os` vs NocoDB client bases). Then implement `crmSearch` and a create/upsert in the lead agent | M–L | Mikey decides → claude-engineer | **Yes**: choice + unpausing Supabase (billing) |
| P1-4 | Lead agent: add ACMI write-back (work item per lead + coordination events), persist HITL decisions, implement `sendEmail` (Resend/Gmail) behind approval. Construct the Exa client lazily so the build doesn't need the key | M | claude-engineer | **Yes**: Slack/email creds |
| P1-5 | Clean up the Vercel project link: `gsd-dashboard-nextjs` received 5 failed prod deploys from `acmi-product@feat/acmi-emit-v15` | S | Mikey | **Yes**: project settings |
| P1-6 | Remove or relocate VM-SSH routes from the Vercel runtime (`chat` VM tools, `integrations/save`), e.g. to an n8n webhook or VM-side agent | M | claude-engineer | partial |

### P2: hygiene and polish

| # | Item | Effort | Owner | HITL |
|---|---|---|---|---|
| P2-1 | Lint to green: ignore `packages/*/dist`, fix the 101 errors (mostly `no-explicit-any`, `no-require-imports`) | M | any agent | no |
| P2-2 | Replace `/todo` `MOCK_GOOGLE_TASKS` with the Composio route; delete the unmounted `fleet-template` demo | S | antigravity / gemini-cli | no |
| P2-3 | Implement the Square checkout + webhook from `crm-square-integration-plan.md` once P1-3 settles where `Prospect` lives (webhook → `acmi_event` + `acmi_work_signal status=converted`) | L | claude-engineer | **Yes**: Square creds, prod |
| P2-4 | Rename `UPSTASH_*` → `ACMI_BRIDGE_*` in runtime code, and update the env docs/README (still the create-next-app stub) | S | any | no |
| P2-5 | Contract tests: mixed ns/ms fixture through `/api/acmi` → sorted output; WRONGTYPE string-timeline fixture | S | claude-engineer | no |

### Explicitly NOT done in this pass (guardrails)
No code fixes, no prod deploys, no env changes, no Redis writes or migrations (`--apply` / `--migrate`), no merges, no PR opened.
