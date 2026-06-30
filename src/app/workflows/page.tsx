"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Filter, RefreshCw } from "lucide-react";
import { fetchWorkItems, type ACMIWorkItem } from "@/lib/acmi-client";
import { cn } from "@/lib/utils";

// Monospace bracket tag styles matching the Mad EZ Website v3
const statusColors: Record<ACMIWorkItem["status"], { border: string; text: string; dot: string }> = {
  active: { border: "border-primary/30", text: "text-primary", dot: "bg-primary" },
  stalled: { border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500" },
  completed: { border: "border-primary/40 bg-primary/5", text: "text-primary", dot: "bg-primary" },
  pending: { border: "border-[#7DB8FF]/30", text: "text-[#7DB8FF]", dot: "bg-[#7DB8FF]" },
};

function WorkflowCard({ item, token }: { item: ACMIWorkItem; token: string | null }) {
  const stageCount = item.stages?.length || 0;
  const doneCount = item.stages?.filter((s) => s.done).length || 0;
  const style = statusColors[item.status] || statusColors.pending;

  const href = token ? `/workflows/${item.id}?token=${token}` : `/workflows/${item.id}`;

  return (
    <Link href={href} className="group block">
      <div className="border border-border bg-card p-4 transition-all duration-150 group-hover:border-primary/45 rounded-2xl h-full flex flex-col justify-between shadow-sm relative overflow-hidden">
        {/* Subtle top indicator bar */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", style.dot)} />

        <div className="space-y-4 pt-2">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Trace ID: {item.id}
              </span>
              <h3 className="font-bold text-sm tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
                {item.title}
              </h3>
            </div>
            <span className={cn("font-mono text-[10px] font-bold uppercase px-2 py-0.5 border rounded-none whitespace-nowrap bg-secondary", style.border, style.text)}>
              [{item.status}]
            </span>
          </div>

          {/* Owner details */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <span>Lead:</span>
            <span className="text-foreground font-medium">{item.owner || "unassigned"}</span>
          </div>

          {/* Milestones bar */}
          {stageCount > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                <span>Stages</span>
                <span>{doneCount}/{stageCount} Done</span>
              </div>
              <div className="flex gap-1 h-1 bg-secondary">
                {item.stages?.map((stage, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-full transition-all duration-300",
                      stage.done ? "bg-primary" : "bg-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-3 font-mono text-xs text-foreground">
          <div className="flex-1 bg-secondary h-3 overflow-hidden relative border border-border/30">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out" 
              style={{ width: `${item.progress}%` }} 
            />
          </div>
          <span className="font-bold shrink-0">{item.progress}%</span>
        </div>
      </div>
    </Link>
  );
}

function WorkflowListContent() {
  const [items, setItems] = useState<ACMIWorkItem[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ACMIWorkItem["status"] | "all">("all");
  const [isPolling, setIsPolling] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    let active = true;

    // Immediate load
    fetchWorkItems().then((data) => {
      if (active) setItems(data);
    });

    // Dynamic background polling every 5 seconds
    const interval = setInterval(() => {
      if (!active) return;
      setIsPolling(true);
      fetchWorkItems()
        .then((data) => {
          if (!active) return;
          setItems(data);
          setTimeout(() => {
            if (active) setIsPolling(false);
          }, 600);
        })
        .catch(() => {
          if (active) setIsPolling(false);
        });
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const filtered = items.filter((w) => {
    const matchesSearch = w.title.toLowerCase().includes(filter.toLowerCase()) || w.id.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    active: items.filter((w) => w.status === "active").length,
    stalled: items.filter((w) => w.status === "stalled").length,
    completed: items.filter((w) => w.status === "completed").length,
    pending: items.filter((w) => w.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex items-start justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight uppercase font-serif text-foreground">
            Workflow Tracker
          </h1>
          <p className="text-xs font-mono text-muted-foreground">
            {items.length} total work items. Synchronized with the ACMI Redis Proxy.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase bg-secondary px-3 py-1 border border-border/30">
          <RefreshCw className={cn("h-3 w-3", isPolling && "animate-spin text-primary")} />
          <span>{isPolling ? "SYNCING..." : "LIVE SYNC"}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
        <div className="bg-card p-3 border border-border rounded-xl">
          <div className="text-muted-foreground mb-1 uppercase text-[10px]">Active</div>
          <div className="text-lg font-bold text-primary">{counts.active}</div>
        </div>
        <div className="bg-card p-3 border border-border rounded-xl">
          <div className="text-red-400 mb-1 uppercase text-[10px]">Stalled</div>
          <div className="text-lg font-bold text-red-400">{counts.stalled}</div>
        </div>
        <div className="bg-card p-3 border border-border rounded-xl">
          <div className="text-primary mb-1 uppercase text-[10px]">Completed</div>
          <div className="text-lg font-bold text-primary">{counts.completed}</div>
        </div>
        <div className="bg-card p-3 border border-border rounded-xl">
          <div className="text-[#7DB8FF] mb-1 uppercase text-[10px]">Pending</div>
          <div className="text-lg font-bold text-[#7DB8FF]">{counts.pending}</div>
        </div>
      </div>

      {/* Filter and search panel */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <label htmlFor="workflow-filter-input" className="sr-only">
            Filter by title or work ID
          </label>
          <input
            id="workflow-filter-input"
            placeholder="FILTER BY TITLE OR WORK ID..."
            className="w-full bg-card border border-border text-foreground pl-9 pr-4 py-2 font-mono text-xs outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground rounded-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
          {(["all", "active", "stalled", "completed", "pending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 border capitalize transition-all rounded-none cursor-pointer",
                statusFilter === s
                  ? "bg-primary text-[#0F2A2E] border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              [{s}]
            </button>
          ))}
        </div>
      </div>

      {/* Grid container */}
      <div className="border border-border/30 bg-black/15 p-2 rounded-2xl">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filtered.map((item) => (
              <WorkflowCard key={item.id} item={item} token={token} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs font-mono text-muted-foreground">
            <Filter className="h-8 w-8 mb-2 text-muted-foreground/30" />
            <p>NO WORKFLOW TARGETS COMPLY WITH ACTIVE CRITERIA.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkflowTracker() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 font-mono text-xs uppercase animate-pulse text-[#1a1a1a]/60">
        Initializing editorial stream...
      </div>
    }>
      <WorkflowListContent />
    </Suspense>
  );
}

