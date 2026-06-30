import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const GITEA_URL = "http://localhost:3001/api/v1/repos/madezmedia/gsd-dashboard";
const DEFAULT_TOKEN = "f4435297c1f4fe2795e826d681eceec6ba425443";

function getGiteaToken(): string {
  const gitConfigPath = path.resolve(process.cwd(), ".git/config");
  if (fs.existsSync(gitConfigPath)) {
    try {
      const configContent = fs.readFileSync(gitConfigPath, "utf-8");
      const match = configContent.match(/localhost:3001\/madezmedia\/gsd-dashboard/);
      if (match) {
        // Extract token from URL like http://madezmedia:token@localhost:3001/...
        const tokenMatch = configContent.match(/madezmedia:([a-f0-9]+)@localhost:3001/);
        if (tokenMatch) return tokenMatch[1];
      }
    } catch (err) {
      console.error("Failed to parse Gitea token from .git/config:", err);
    }
  }
  return process.env.GITEA_TOKEN || DEFAULT_TOKEN;
}

export async function GET() {
  const token = getGiteaToken();
  const headers = {
    Authorization: `token ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const [repoRes, pullsRes, commitsRes, branchesRes, milestonesRes] = await Promise.all([
      fetch(`${GITEA_URL}`, { headers, cache: "no-store" }),
      fetch(`${GITEA_URL}/pulls`, { headers, cache: "no-store" }),
      fetch(`${GITEA_URL}/commits`, { headers, cache: "no-store" }),
      fetch(`${GITEA_URL}/branches`, { headers, cache: "no-store" }),
      fetch(`${GITEA_URL}/milestones`, { headers, cache: "no-store" }),
    ]);

    if (!repoRes.ok) {
      throw new Error(`Gitea returned status ${repoRes.status}`);
    }

    const repo = await repoRes.json();
    const pulls = pullsRes.ok ? await pullsRes.json() : [];
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    const branches = branchesRes.ok ? await branchesRes.json() : [];
    const milestones = milestonesRes.ok ? await milestonesRes.json() : [];

    return NextResponse.json({
      success: true,
      repo: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        stars: repo.stars_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssues: repo.open_issues_count,
        openPrs: repo.open_pr_counter || pulls.length,
        releases: repo.release_counter,
        defaultBranch: repo.default_branch,
        url: repo.html_url,
      },
      pulls: pulls.map((p: any) => ({
        id: p.id,
        number: p.number,
        title: p.title,
        state: p.state,
        user: p.user?.login,
        branch: p.head?.ref,
        url: p.html_url,
        createdAt: p.created_at,
      })),
      commits: commits.slice(0, 15).map((c: any) => ({
        sha: c.sha?.substring(0, 8),
        author: c.commit?.author?.name || c.author?.login,
        message: c.commit?.message?.split("\n")[0],
        date: c.commit?.author?.date,
        url: c.html_url,
      })),
      branches: branches.map((b: any) => ({
        name: b.name,
        commit: b.commit?.id?.substring(0, 8),
      })),
      milestones: milestones.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        state: m.state,
        openIssues: m.open_issues,
        closedIssues: m.closed_issues,
        dueDate: m.due_on,
      })),
    });
  } catch (err: any) {
    console.error("Failed to query Gitea API:", err.message);
    // Serve fallback mock metrics if connection fails
    return NextResponse.json({
      success: false,
      error: err.message,
      repo: {
        id: 7,
        name: "gsd-dashboard",
        fullName: "madezmedia/gsd-dashboard",
        description: "GSD Dashboard - Multi-Tenant Fleet Service Management (Fallback Mock)",
        stars: 1,
        forks: 0,
        watchers: 2,
        openIssues: 3,
        openPrs: 1,
        releases: 0,
        defaultBranch: "main",
        url: "http://localhost:3001/madezmedia/gsd-dashboard",
      },
      pulls: [
        {
          id: 101,
          number: 12,
          title: "Align dashboard styles to v3 color palette specs",
          state: "open",
          user: "antigravity",
          branch: "feat/v3-specs",
          url: "#",
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        }
      ],
      commits: [
        {
          sha: "c46abc2b",
          author: "claude-engineer",
          message: "Feat: Add bi-directional sync daemon script for Hermes kanban",
          date: new Date(Date.now() - 3600000 * 2).toISOString(),
          url: "#",
        },
        {
          sha: "86379bd6",
          author: "antigravity",
          message: "Style: Rebuild sidebar navigation tags & layout variables",
          date: new Date(Date.now() - 3600000 * 12).toISOString(),
          url: "#",
        }
      ],
      branches: [
        { name: "main", commit: "c46abc2b" },
        { name: "feat/v3-specs", commit: "a3a2e1cc" }
      ],
      milestones: [
        {
          id: 1,
          title: "V3 Core Release Milestone",
          description: "Align, secure, and bootstrap all Swarm telemetry portals.",
          state: "open",
          openIssues: 2,
          closedIssues: 8,
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        }
      ],
    });
  }
}
