# Plan — Multi-Tenant SaaS Upstash Connection Routing

This plan defines the step-by-step task breakdown and verification criteria for transitioning the Next.js GSD Dashboard into a multi-tenant SaaS model backed strictly by Upstash Redis.

---

## Overview
We will implement local connection routing inside `src/app/api/acmi/route.ts` that intercepts telemetry calls, parses authorization tokens, matches them to a central tenant registry in Upstash Redis, and proxies ACMI commands to the correct isolated database instance. We will also integrate local storage token injection in the client and provide a gorgeous settings UI panel for tenant registration.

## Project Type
- **Type**: **WEB**
- **Primary Agent**: `frontend-specialist` (collaborating with `backend-specialist` for API routes)

---

## Success Criteria
- ✅ Reroute all client-side ACMI commands to relative path `/api/acmi`.
- ✅ Authenticate tokens and resolve tenant custom Upstash URLs/tokens from the central Redis registry.
- ✅ Support all ACMI-MCP tool execution commands over standard Upstash REST commands.
- ✅ Seed a default backward-compatible workspace dynamically.
- ✅ Build a forest green settings dashboard card for registration and connection checking.
- ✅ Ensure 100% linter and Next.js build compliance with zero warnings.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database / Control Plane**: Upstash Redis REST API (JSON commands over HTTP fetch)
- **Styling**: Tailwind CSS v4 (Warm paper background `#faf9f5` / `#f4f2eb`, forest green `#2d4a3e`, amber `#c4903a` accents)
- **Testing**: Node.js Native Test Runner (`node --test` + `npx tsx`)

---

## File Structure

```
gsd-dashboard-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── acmi/
│   │   │       └── route.ts         <-- [NEW] Dynamic multi-tenant connection router
│   │   ├── settings/
│   │   │   └── page.tsx             <-- [MODIFY] Settings panel with SaaS configuration UI
│   └── lib/
│       ├── acmi-client.ts           <-- [MODIFY] Relative path rerouting and token injector
│       └── acmi-client.test.ts      <-- [MODIFY] Update client tests to assert bearer tokens
```

---

## Task Breakdown

### Phase 1: Database & Control Plane Seeding (P0)

#### Task 1.1: Write SaaS Connection Routing API
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P0
- **Dependencies**: None
- **INPUT**: HTTP POST requests with `{ tool, params }` payloads and optional bearer headers.
- **OUTPUT**: `src/app/api/acmi/route.ts` executing dynamic lookup and REST-to-Redis query mapping.
- **VERIFY**: Making a fetch request to `/api/acmi` with an invalid token falls back gracefully to default instance, while a valid custom token routes to the custom URL/token properly.

---

### Phase 2: Client Rerouting and Telemetry Integration (P1)

#### Task 2.1: Implement Local Routing and Token Injection
- **Agent**: `frontend-specialist`
- **Skill**: `clean-code`
- **Priority**: P1
- **Dependencies**: Task 1.1
- **INPUT**: `src/lib/acmi-client.ts` pointing to remote vercel domain.
- **OUTPUT**: Relative `ACMI_PROXY = "/api/acmi"` and bearer header injection extracted from URL or `localStorage`.
- **VERIFY**: Running unit tests verifies headers are correctly structured and passed into fetch calls.

#### Task 2.2: Refactor Native Client Tests
- **Agent**: `frontend-specialist`
- **Skill**: `testing-patterns`
- **Priority**: P1
- **Dependencies**: Task 2.1
- **INPUT**: `src/lib/acmi-client.test.ts` testing the old client interface.
- **OUTPUT**: Modernized test cases checking for relative proxy route and token inclusion.
- **VERIFY**: `npm run test` executes successfully and reports 100% pass on ACMI client test suite.

---

### Phase 3: Tenant Registration UI and Styling (P2)

#### Task 3.1: Develop SaaS Settings Dashboard Panel
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 1.1, Task 2.1
- **INPUT**: Simple appearance and keys settings in `src/app/settings/page.tsx`.
- **OUTPUT**: A premium, warm ivory and forest green multi-tenant panel allowing registration of new custom tenant Upstash credentials.
- **VERIFY**: No purple/violet elements exist, and settings form lets users register, save, and connect tenant parameters cleanly.

---

## Phase X: Final Verification

### Checklist
- [ ] No purple/violet color hex codes.
- [ ] Next.js production builds compile warning-free: `npm run build`.
- [ ] Node native test runner passes successfully: `npm run test`.
- [ ] Run automated quality check: `python .agent/scripts/checklist.py .`.
- [ ] Verification complete marker is added to this plan.
