"use client";

import { useEffect, useState } from "react";
import { Archive, Clock, AlertTriangle, CheckCircle2, RefreshCw, ExternalLink, FileText, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import traceData from "@/data/fleet-archival-trace.json";

type TraceCandidate = typeof traceData.candidates[0];

const actionColors: Record<string, string> = {
  CONFIRM_RESOLVED_OR_ARCHIVE: "border-yellow-500/30 bg-yellow-500/5",
  SUPERSEDED_ARCHIVE: "border-blue-500/30 bg-blue-500/5",
  DORMANT_ARCHIVE: "border-orange-500/30 bg-orange-500/5",
  KEEP_OPEN_OR_ASSIGN: "border-red-500/30 bg-red-500/5",
  WATCH_APPROACHING: "border-purple-500/30 bg-purple-500/5",
  SHIPPED_ARCHIVE: "border-green-500/30 bg-green-500/5",
  RECENTLY_COMPLETED: "border-emerald-500/30 bg-emerald-500/5",
  HALF_SHIPPED_HALF_DORMANT: "border-amber-500/30 bg-amber-500/5",
  ALREADY_ARCHIVED: "border-gray-500/30 bg-gray-500/5",
};

const actionLabels: Record<string, string> = {
  CONFIRM_RESOLVED_OR_ARCHIVE: "Needs Confirm",
  SUPERSEDED_ARCHIVE: "Superseded",
  DORMANT_ARCHIVE: "Dormant",
  KEEP_OPEN_OR_ASSIGN: "Keep Open",
  WATCH_APPROACHING: "Approaching",
  SHIPPED_ARCHIVE: "Shipped",
  RECENTLY_COMPLETED: "Completed",
  HALF_SHIPPED_HALF_DORMANT: "Partial",
  ALREADY_ARCHIVED: "Archived",
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    stalled: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "DRAFT": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "DRAFT-AWAITING-OPS-CENTER-DONE-STATE": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "RATIFIED-P1": "bg-red-500/10 text-red-400 border-red-500/20",
    SHIPPED: "bg-green-500/10 text-green-400 border-green-500/20",
    ready: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return map[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
};

export default function FleetArchivePage() {
  const [filter, setFilter] = useState<string>("all");
  const [trace] = useState(traceData);
  const [sortBy, setSortBy] = useState<"silence" | "priority">("silence");

  const filtered = filter === "all"
    ? trace.candidates
    : trace.candidates.filter(c => c.action === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "silence") {
      return (b.silence_hours || 0) - (a.silence_hours || 0);
    }
    const pOrder: Record<string, number> = { P1: 0, high: 1, P2: 2, P3: 3 };
    return (pOrder[a.priority] ?? 99) - (pOrder[b.priority] ?? 99);
  });

  const actions = [...new Set(trace.candidates.map(c => c.action))];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="relative border border-border bg-card p-5 rounded-2xl shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-2xl" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif">
              Fleet <span className="text-primary italic font-light font-sans">Archival Trace</span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">
              {trace.meta.total_scanned} Items Scanned &middot; {trace.meta.archival_candidates} Candidates &middot; {trace.meta.already_archived} Archived
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Generated {trace.meta.generated}</span>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-foreground">{trace.meta.total_scanned}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Scanned</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-yellow-400">{trace.meta.archival_candidates}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Candidates</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-400">{trace.meta.active_recent}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-blue-400">{trace.meta.already_archived}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Archived</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-orange-400">{trace.meta.active_stalled}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Stalled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider rounded-md border transition-all",
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/30"
          )}
        >
          All ({trace.candidates.length})
        </button>
        {actions.map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={cn(
              "px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider rounded-md border transition-all",
              filter === a
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            {actionLabels[a]} ({trace.candidates.filter(c => c.action === a).length})
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] uppercase font-mono text-muted-foreground">Sort:</span>
          <button
            onClick={() => setSortBy("silence")}
            className={cn(
              "px-2 py-1 text-[9px] uppercase font-mono rounded border transition-all",
              sortBy === "silence" ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground"
            )}
          >
            Silence
          </button>
          <button
            onClick={() => setSortBy("priority")}
            className={cn(
              "px-2 py-1 text-[9px] uppercase font-mono rounded border transition-all",
              sortBy === "priority" ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground"
            )}
          >
            Priority
          </button>
        </div>
      </div>

      {/* Candidate cards */}
      <div className="space-y-3">
        {sorted.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "border-border/50 shadow-sm transition-all hover:border-primary/20",
              actionColors[item.action] || ""
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {item.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] font-mono px-1.5 py-0", statusBadge(item.status))}
                    >
                      {item.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono px-1.5 py-0 text-muted-foreground border-border"
                    >
                      {item.priority}
                    </Badge>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono text-muted-foreground">
                    <span>ID: {item.id}</span>
                    <span>Owner: {item.owner}</span>
                    {item.silence_hours && (
                      <span className={cn(
                        "font-bold",
                        item.silence_hours > 1000 ? "text-red-400" :
                        item.silence_hours > 200 ? "text-yellow-400" : "text-muted-foreground"
                      )}>
                        ⏱ {item.silence_hours.toFixed(0)}h silent
                      </span>
                    )}
                    {item.last_activity && (
                      <span>Last: {item.last_activity}</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground/80 leading-relaxed mt-1">
                    {item.description}
                  </p>

                  {/* Resolution note */}
                  {item.resolution_note && (
                    <div className="flex items-start gap-1.5 mt-2 bg-secondary/30 rounded-md p-2 border border-border/30">
                      <FileText className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {item.resolution_note}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right action badge */}
                <div className="shrink-0">
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-mono uppercase tracking-wider px-2 py-1 whitespace-nowrap",
                    item.action === "KEEP_OPEN_OR_ASSIGN" && "border-red-500/40 text-red-400",
                    item.action === "CONFIRM_RESOLVED_OR_ARCHIVE" && "border-yellow-500/40 text-yellow-400",
                    item.action === "SUPERSEDED_ARCHIVE" && "border-blue-500/40 text-blue-400",
                    item.action === "SHIPPED_ARCHIVE" && "border-green-500/40 text-green-400",
                    item.action === "DORMANT_ARCHIVE" && "border-orange-500/40 text-orange-400",
                    item.action === "ALREADY_ARCHIVED" && "border-gray-500/40 text-gray-400",
                    item.action === "RECENTLY_COMPLETED" && "border-emerald-500/40 text-emerald-400",
                    item.action === "WATCH_APPROACHING" && "border-purple-500/40 text-purple-400",
                    item.action === "HALF_SHIPPED_HALF_DORMANT" && "border-amber-500/40 text-amber-400",
                  )}>
                    {actionLabels[item.action] || item.action}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
        Fleet Archival Monitor &middot; Ops Center v1.5 &middot; ACMI Protocol
      </div>
    </div>
  );
}
