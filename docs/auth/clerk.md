# Clerk session gate

Correlation: `gsdDashboardClerkGate-20261006`

The dashboard UI and all `/api/*` routes require a Clerk session. This follows Clerk's Next.js 16 Proxy convention (`src/proxy.ts`). The swarm-os repo was not available here to copy from; the gate matches the same Clerk App Router pattern used for swarm.madezmedia.com.

Public routes (no session): `/sign-in`, `/sign-up`, `/assessment`, `/coaching`.

`saas_register_tenant` does not create tenants or tokens. It returns 403.

## Required environment variables

Set these in Vercel (and `.env.local` for local dev). Do not commit values.

| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | client + server | Clerk publishable key |
| `CLERK_SECRET_KEY` | server only | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | client | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | client | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | client | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | client | `/` |
| `NOCODB_API_KEY` | server only | Required by `/api/nocodb-viewer`, `/api/nocodb`, and the NocoDB sync scripts. No in-repo fallback. |
| `NOCODB_URL` | server only | Optional. Defaults to the existing Elestio host when unset. |

Restrict sign-ups in the Clerk dashboard (allowlist / invitations), the same way swarm.madezmedia.com is locked to known users. This app does not ship a second allowlist.

A local `next build` without live Clerk keys needs format-valid stubs in the environment. Those stubs are not credentials and must not be committed as real keys.
