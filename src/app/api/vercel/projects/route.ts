import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_ORG_ID;
  if (!token) return NextResponse.json({ projects: [], source: "no-token" });

  const teamQs = teamId ? `&teamId=${teamId}` : "";

  try {
    const res = await fetch(`https://api.vercel.com/v9/projects?limit=100${teamQs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Vercel ${res.status}`);
    const data = await res.json();

    const projects = await Promise.all(
      ((data.projects ?? []) as any[]).map(async (p) => {
        const dRes = await fetch(
          `https://api.vercel.com/v6/deployments?projectId=${p.id}&limit=3${teamQs}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        const dData = dRes.ok ? await dRes.json() : { deployments: [] };
        const latest = dData.deployments[0] ?? null;
        return {
          id: p.id,
          name: p.name,
          framework: p.framework ?? null,
          updatedAt: p.updatedAt,
          latestDeployment: latest
            ? {
                id: latest.uid,
                url: latest.url,
                state: latest.state,
                created: latest.created,
                commitSha: (latest.meta?.githubCommitSha ?? "").substring(0, 8),
                commitRef: latest.meta?.githubCommitRef ?? "main",
                commitMsg: latest.meta?.githubCommitMessage ?? "",
              }
            : null,
          deployments: (dData.deployments as any[]).map((d) => ({
            id: d.uid,
            url: d.url,
            state: d.state,
            created: d.created,
            commitSha: (d.meta?.githubCommitSha ?? "").substring(0, 8),
            commitRef: d.meta?.githubCommitRef ?? "main",
            commitMsg: d.meta?.githubCommitMessage ?? "",
          })),
        };
      })
    );

    return NextResponse.json({ projects, source: "vercel-api" });
  } catch (err: any) {
    return NextResponse.json({ projects: [], source: "error", error: err.message });
  }
}
