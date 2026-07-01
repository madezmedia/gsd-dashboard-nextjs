import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.GITEA_TOKEN;
  const baseUrl = process.env.GITEA_URL ?? "https://git-u70402.vm.elestio.app";
  if (!token) return NextResponse.json({ repos: [], source: "no-token" });

  try {
    const res = await fetch(
      `${baseUrl}/api/v1/repos/search?token=${token}&limit=50&sort=updated&order=desc`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Gitea ${res.status}`);
    const data = await res.json();
    const repos = (data.data as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description ?? "",
      language: r.language ?? null,
      stars: r.stars_count,
      openIssues: r.open_issues_count,
      defaultBranch: r.default_branch,
      updatedAt: r.updated,
      htmlUrl: r.html_url,
      cloneUrl: r.clone_url,
    }));
    return NextResponse.json({ repos, source: "gitea-api" });
  } catch (err: any) {
    return NextResponse.json({ repos: [], source: "error", error: err.message });
  }
}
