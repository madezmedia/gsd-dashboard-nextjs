"use client";

import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Globe, GitBranch, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VercelDeployment {
  id: string;
  url: string;
  state: string;
  created: number;
  commitSha: string;
  commitRef: string;
  commitMsg: string;
}

interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  updatedAt: number;
  latestDeployment: VercelDeployment | null;
  deployments: VercelDeployment[];
}

const STATE_STYLES: Record<string, string> = {
  READY: "bg-primary/10 text-primary border-primary/20",
  BUILDING: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
  INITIALIZING: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
  ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
  CANCELED: "bg-muted text-muted-foreground border-border",
};

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function VercelProjectsTab() {
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    const res = await fetch("/api/vercel/projects");
    const data = await res.json();
    setProjects(data.projects ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = projects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-4 w-4 animate-spin text-primary mr-2" />
        <span className="text-[10px] font-mono uppercase text-muted-foreground animate-pulse">
          Fetching Vercel projects...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {projects.length} Vercel Projects
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="h-7 text-xs font-mono border border-border rounded-md bg-secondary px-2 text-foreground w-48 placeholder:text-muted-foreground/50"
            placeholder="Filter projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[9px] font-mono uppercase border-border gap-1 cursor-pointer"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((project) => {
          const dep = project.latestDeployment;
          const state = dep?.state ?? "UNKNOWN";
          const isExpanded = expandedId === project.id;

          return (
            <Card
              key={project.id}
              className={cn(
                "border bg-card rounded-2xl shadow-md transition-all cursor-pointer",
                isExpanded ? "border-primary/50 md:col-span-2 xl:col-span-3" : "border-border hover:border-primary/30"
              )}
              onClick={() => setExpandedId(isExpanded ? null : project.id)}
            >
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                <div className="space-y-0.5 min-w-0">
                  <CardTitle className="text-sm font-bold font-serif tracking-wide text-foreground truncate">
                    {project.name}
                  </CardTitle>
                  {project.framework && (
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">
                      {project.framework}
                    </span>
                  )}
                </div>
                <Badge className={cn("text-[9px] border shrink-0 uppercase", STATE_STYLES[state] ?? STATE_STYLES.CANCELED)}>
                  {state}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {dep && (
                  <div className="bg-secondary rounded-xl border border-border p-2 font-mono text-[10px] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <GitBranch className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">{dep.commitRef}</span>
                        {dep.commitSha && <span className="text-primary">#{dep.commitSha}</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-muted-foreground/60">
                        <Clock className="h-2.5 w-2.5" />
                        {relTime(dep.created)}
                      </div>
                    </div>
                    {dep.commitMsg && (
                      <p className="text-muted-foreground/70 truncate text-[9px]">{dep.commitMsg}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">
                    Updated {relTime(project.updatedAt)}
                  </span>
                  {dep?.url && (
                    <a
                      href={`https://${dep.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline uppercase"
                    >
                      Open <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>

                {/* Expanded: deployment history */}
                {isExpanded && project.deployments.length > 1 && (
                  <div className="border-t border-border pt-3 space-y-1.5">
                    <span className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">
                      Recent deployments
                    </span>
                    {project.deployments.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-[10px] font-mono gap-2 py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge className={cn("text-[8px] border px-1 h-4 shrink-0 uppercase", STATE_STYLES[d.state] ?? STATE_STYLES.CANCELED)}>
                            {d.state}
                          </Badge>
                          <span className="text-muted-foreground truncate">{d.commitRef}</span>
                          <span className="text-primary shrink-0">#{d.commitSha}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground/50">{relTime(d.created)}</span>
                          {d.url && (
                            <a href={`https://${d.url}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <ExternalLink className="h-2.5 w-2.5 text-primary hover:text-primary/70" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
