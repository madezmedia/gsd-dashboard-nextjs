"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, RefreshCw, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { acmiClient, fetchWorkItem, updateWorkItemStatus, type ACMIWorkItem } from "@/lib/acmi-client";
import { cn, formatRelativeTime } from "@/lib/utils";

function StageNode({ 
  name, 
  done, 
  isLast, 
  onClick 
}: { 
  name: string; 
  done: boolean; 
  isLast: boolean; 
  onClick?: () => void 
}) {
  return (
    <div 
      className="flex items-start gap-4 font-mono text-xs cursor-pointer select-none group" 
      onClick={onClick}
    >
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          "h-5 w-5 rounded-md flex items-center justify-center border transition-all duration-150 bg-black/20 shrink-0",
          done ? "border-primary bg-primary/10 text-primary" : "border-border group-hover:border-primary/50 text-muted-foreground/35"
        )}>
          {done ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-2 w-2 bg-transparent" />
          )}
        </div>
        {!isLast && <div className="w-px h-8 bg-border/30 mt-1" />}
      </div>
      <div className="flex-1 pb-4">
        <p className={cn("font-medium transition-colors duration-150", done ? "text-primary/70 line-through" : "text-foreground group-hover:text-primary")}>
          {name}
        </p>
      </div>
    </div>
  );
}

function WorkflowTraceContent({ id }: { id: string }) {
  const [item, setItem] = useState<ACMIWorkItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToast, setShowShowToast] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const loadWorkItem = async (showSyncIndicator = false) => {
    if (showSyncIndicator) setIsPolling(true);
    try {
      const data = await fetchWorkItem(id);
      setItem(data);
    } catch (err) {
      console.error("Failed to load work item:", err);
    } finally {
      if (showSyncIndicator) setIsPolling(false);
    }
  };

  useEffect(() => {
    loadWorkItem();
    // Dynamic background polling every 5 seconds
    const interval = setInterval(() => {
      loadWorkItem(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  if (!item) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-xs uppercase animate-pulse text-muted-foreground">
        Extracting workflow trace context...
      </div>
    );
  }

  const backHref = token ? `/workflows?token=${token}` : "/workflows";
  const style = item.status === "active" 
    ? "border-primary/30 text-primary"
    : item.status === "stalled"
    ? "border-red-500/30 text-red-400"
    : item.status === "completed"
    ? "border-primary/40 bg-primary/5 text-primary"
    : "border-[#7DB8FF]/20 text-[#7DB8FF]";

  async function handleEscalate() {
    setIsUpdating(true);
    const success = await updateWorkItemStatus(id, "active");
    if (success) {
      // Optimistically update status
      setItem((prev) => prev ? { ...prev, status: "active", progress: Math.min(100, prev.progress + 15) } : null);
      setShowShowToast(true);
      setTimeout(() => setShowShowToast(false), 4000);
    } else {
      alert("Escalation failed. Check Upstash Redis configuration.");
    }
    setIsUpdating(false);
  }

  async function toggleStage(stageName: string) {
    if (!item || isUpdating) return;
    setIsUpdating(true);
    
    const updatedStages = item.stages?.map(s => 
      s.name === stageName ? { ...s, done: !s.done } : s
    ) || [];
    
    const completedNames = updatedStages.filter(s => s.done).map(s => s.name);
    const progress = updatedStages.length === 0 
      ? 0 
      : Math.round((completedNames.length / updatedStages.length) * 100);
      
    const nextStatus: ACMIWorkItem["status"] = progress === 100 
      ? "completed" 
      : item.status === "completed" 
      ? "active" 
      : item.status;
      
    // Optimistic update
    setItem(prev => prev ? { 
      ...prev, 
      stages: updatedStages, 
      progress, 
      status: nextStatus 
    } : null);

    try {
      await acmiClient.updateWorkItemMilestones(id, completedNames, progress, nextStatus);
      setShowShowToast(true);
      setTimeout(() => setShowShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to toggle stage:", err);
      alert("Failed to update milestone status in Redis.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast notifier */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-primary text-[#0F2A2E] px-4 py-3 border border-primary/20 font-mono text-xs shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
          [MILESTONE] Active milestone update dispatched to Upstash Redis.
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-start gap-4 border-b border-border/40 pb-4">
        <Link href={backHref} className="shrink-0 mt-0.5">
          <button className="flex items-center justify-center h-8 w-8 border border-border bg-card rounded-xl hover:bg-secondary transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
        </Link>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Work Item Tracer
            </span>
            <div className="flex items-center gap-1 font-mono text-[8px] text-muted-foreground/45 uppercase">
              <RefreshCw className={cn("h-2.5 w-2.5", isPolling && "animate-spin text-primary")} />
            </div>
          </div>
          <h1 className="text-xl font-bold uppercase font-serif tracking-tight text-foreground">
            {item.title}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">ID: {item.id}</p>
        </div>
        <span className={cn("font-mono text-xs font-bold uppercase px-2.5 py-1 border bg-secondary rounded-none whitespace-nowrap", style)}>
          [{item.status}]
        </span>
      </div>

      {/* Progress metrics */}
      <div className="border border-border bg-card p-5 shadow-sm space-y-4 rounded-2xl relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary" />
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-muted-foreground uppercase">Completion Quotient</span>
          <span className="text-lg font-bold text-primary">{item.progress}%</span>
        </div>
        
        <div className="bg-secondary h-4 overflow-hidden relative border border-border/30">
          <div 
            className="bg-primary h-full transition-all duration-500 ease-out" 
            style={{ width: `${item.progress}%` }} 
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-4 border-t border-border/30">
          <div>
            <p className="text-muted-foreground uppercase text-[9px] mb-0.5">Created</p>
            <p className="font-semibold text-foreground">{item.createdAt ? formatRelativeTime(new Date(item.createdAt).getTime()) : "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-[9px] mb-0.5">Updated</p>
            <p className="font-semibold text-foreground">{item.updatedAt ? formatRelativeTime(new Date(item.updatedAt).getTime()) : "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-[9px] mb-0.5">Fleet Lead</p>
            <p className="font-semibold text-foreground truncate">{item.owner || "unassigned"}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-[9px] mb-0.5">Routing Key</p>
            <p className="font-semibold text-primary uppercase">REDIS:WORK:{id.slice(0,6)}</p>
          </div>
        </div>
      </div>

      {/* Execution graph */}
      <div className="border border-border bg-card p-5 shadow-sm space-y-4 rounded-2xl">
        <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground tracking-wider">
          Execution Milestones (Interactive Toggles)
        </h3>
        <div className="pt-2">
          {item.stages && item.stages.length > 0 ? (
            item.stages.map((stage, i) => (
              <StageNode
                key={i}
                name={stage.name}
                done={stage.done}
                isLast={i === (item.stages?.length || 0) - 1}
                onClick={() => toggleStage(stage.name)}
              />
            ))
          ) : (
            <p className="font-mono text-xs text-muted-foreground/45 text-center py-4 uppercase">
              No milestones cataloged for this workspace trace.
            </p>
          )}
        </div>
      </div>

      {/* Interactive recovery actions */}
      {item.status === "stalled" && (
        <div className="border border-red-500/20 bg-card p-5 shadow-sm relative overflow-hidden flex gap-4 rounded-2xl">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500" />
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase text-red-400">
              [alert] Workflow Blocked
            </h3>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              Execution timeline has halted. Re-route the correlation context to dispatch an active subagent loop.
            </p>
            <button
              onClick={handleEscalate}
              disabled={isUpdating}
              className={cn(
                "px-4 py-2 font-mono text-xs uppercase font-bold transition-all border border-red-500/30 text-red-400 bg-secondary rounded-xl hover:bg-red-500/10 cursor-pointer",
                isUpdating && "opacity-50 cursor-not-allowed"
              )}
            >
              {isUpdating ? "DISPATCHING RE-ROUTE..." : "ESCALATE & REASSIGN"}
            </button>
          </div>
        </div>
      )}

      {/* Completion log summary */}
      {item.status === "completed" && (
        <div className="border border-primary/20 bg-card p-5 shadow-sm relative overflow-hidden flex gap-4 rounded-2xl">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 font-mono">
            <h3 className="text-xs font-bold uppercase text-primary">
              [milestone] Execution Completed
            </h3>
            <p className="text-xs text-muted-foreground uppercase">
              All milestones achieved and fully synchronized into fleet timeline.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Trace Timeline */}
      <div className="border border-border bg-card p-5 shadow-sm space-y-4 rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" /> Workspace Event logs
          </h3>
          <span className="font-mono text-[9px] uppercase bg-secondary px-2 py-0.5 border border-border/30 text-muted-foreground">
            {item.timeline?.length || 0} Events Logged
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {item.timeline && item.timeline.length > 0 ? (
            item.timeline.map((evt, i) => {
              const isExpanded = !!expandedEvents[evt.id];
              const eventTs = evt.ts ? (typeof evt.ts === "number" ? evt.ts : new Date(evt.ts).getTime()) : (item.createdAt ? new Date(item.createdAt).getTime() : 0);
              const formattedTime = formatRelativeTime(eventTs);
              
              // Custom colors based on event source or summary content
              const isSystem = evt.source.includes("system") || evt.source.includes("acmi-client");
              const isMilestone = evt.summary.includes("[milestone") || evt.summary.includes("[milestone-completed]") || evt.kind === "work-created" || evt.summary.includes("[milestone-completed] ");
              const isError = evt.kind?.includes("error") || evt.summary.toLowerCase().includes("fail") || evt.summary.toLowerCase().includes("error");

              const borderStyle = isError
                ? "border-red-500/30 bg-red-500/5 text-red-400"
                : isMilestone
                ? "border-primary/30 bg-primary/5 text-primary"
                : isSystem
                ? "border-border/30 bg-secondary/10 text-muted-foreground"
                : "border-[#7DB8FF]/30 bg-[#7DB8FF]/5 text-[#7DB8FF]";

              const dotColor = isError
                ? "bg-red-500"
                : isMilestone
                ? "bg-primary"
                : isSystem
                ? "bg-muted-foreground/30"
                : "bg-[#7DB8FF]";

              return (
                <div key={evt.id || i} className="border border-border/40 bg-black/10 rounded-xl p-3.5 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2 font-mono text-[10px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
                      <span className="font-bold text-foreground uppercase">
                        [{evt.source || "agent"}]
                      </span>
                      <span className={cn("px-1.5 py-0.5 border text-[8px] font-bold uppercase tracking-wider", borderStyle)}>
                        {evt.kind || "event"}
                      </span>
                    </div>
                    <span className="text-muted-foreground uppercase shrink-0">
                      {formattedTime}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-foreground/85 leading-relaxed break-words">
                    {evt.summary}
                  </p>

                  {!!evt.payload && (
                    <div className="pt-1.5 border-t border-border/30 flex flex-col items-start">
                      <button
                        onClick={() => setExpandedEvents(prev => ({ ...prev, [evt.id || i]: !isExpanded }))}
                        className="text-[9px] font-mono uppercase text-primary hover:text-primary/80 flex items-center gap-1 font-bold cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="h-3 w-3" /> Hide Payload
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-3 w-3" /> Inspect Payload
                          </>
                        )}
                      </button>
                      
                      {isExpanded && (
                        <pre className="mt-2 w-full bg-[#0B2124] text-[#5EF2C6] border border-primary/20 p-2.5 font-mono text-[10px] overflow-x-auto rounded-xl">
                          {JSON.stringify(evt.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="font-mono text-xs text-muted-foreground/45 text-center py-6 uppercase">
              No runtime trace telemetry received for this workspace.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkflowTrace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 font-mono text-xs uppercase animate-pulse text-muted-foreground">
        Acquiring trace payload...
      </div>
    }>
      <WorkflowTraceContent id={id} />
    </Suspense>
  );
}
