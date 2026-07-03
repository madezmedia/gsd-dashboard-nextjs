import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_ORG_ID;

  if (token && projectId) {
    try {
      const params = new URLSearchParams({ projectId, limit: "10" });
      if (teamId) params.set("teamId", teamId);
      const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Vercel API returned status ${res.status}`);
      }

      const data = await res.json();
      return NextResponse.json({
        success: true,
        source: "vercel-api",
        deployments: data.deployments.map((d: any) => ({
          id: d.uid,
          url: d.url,
          name: d.name,
          state: d.state, // READY, ERROR, BUILDING, CANCELED
          creator: d.creator?.username || "git-bot",
          created: d.created,
          meta: {
            githubCommitSha: d.meta?.githubCommitSha?.substring(0, 8),
            githubCommitRepo: d.meta?.githubCommitRepo,
            githubCommitRef: d.meta?.githubCommitRef,
            githubCommitMessage: d.meta?.githubCommitMessage,
          },
        })),
      });
    } catch (err: any) {
      console.error("Vercel API fetch failed, loading fallback metrics:", err.message);
    }
  }

  // Fallback Mock Vercel Deployments (Production and Preview states)
  return NextResponse.json({
    success: true,
    source: "fallback-mock",
    deployments: [
      {
        id: "dpl_prod_gsd_1092a",
        url: "gsd-dashboard-nextjs.vercel.app",
        name: "gsd-dashboard-nextjs",
        state: "READY",
        creator: "madezmedia",
        created: Date.now() - 3600000 * 2, // 2h ago
        meta: {
          githubCommitSha: "c46abc2b",
          githubCommitRepo: "gsd-dashboard-nextjs",
          githubCommitRef: "main",
          githubCommitMessage: "Feat: Add bi-directional sync daemon script for Hermes kanban",
        },
      },
      {
        id: "dpl_prev_gsd_9182x",
        url: "gsd-dashboard-git-feat-v3-specs-madezmedia.vercel.app",
        name: "gsd-dashboard-nextjs",
        state: "READY",
        creator: "antigravity",
        created: Date.now() - 3600000 * 5, // 5h ago
        meta: {
          githubCommitSha: "a3a2e1cc",
          githubCommitRepo: "gsd-dashboard-nextjs",
          githubCommitRef: "feat/v3-specs",
          githubCommitMessage: "Style: Rebuild sidebar navigation tags & layout variables",
        },
      },
      {
        id: "dpl_prev_gsd_7718y",
        url: "gsd-dashboard-git-feat-billing-madezmedia.vercel.app",
        name: "gsd-dashboard-nextjs",
        state: "BUILDING",
        creator: "claude-engineer",
        created: Date.now() - 300000, // 5m ago
        meta: {
          githubCommitSha: "5ef2c6ff",
          githubCommitRepo: "gsd-dashboard-nextjs",
          githubCommitRef: "feat/saas-billing",
          githubCommitMessage: "Fix: Import typescript type casts for billing checks",
        },
      }
    ],
  });
}
