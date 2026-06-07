"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, RefreshCw, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { fetchWorkItem, updateWorkItemStatus, type ACMIWorkItem } from "@/lib/acmi-client";
import { cn, formatRelativeTime } from "@/lib/utils";

function StageNode({ name, done, isLast }: { name: string; done: boolean; isLast: boolean }) {
  return (
    <div className="flex items-start gap-4 font-mono text-xs">
      <div className="flex flex-col items-center">
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-[#2d4a3e]" />
        ) : (
          <Circle className="h-5 w-5 text-[#1a1a1a]/30" />
        )}
        {!isLast && <div className="w-px h-8 bg-[#1a1a1a]/15" />}
      </div>
      <div className="flex-1 pb-4">
        <p className={cn("font-medium", done ? "text-[#2d4a3e]" : "text-[#1a1a1a]/40")}>
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

  useEffect(() => {
    let active = true;

    // Initial fetch
    fetchWorkItem(id).then((data) => {
      if (active) setItem(data);
    });

    // Dynamic background polling every 5 seconds
    const interval = setInterval(() => {
      if (!active) return;
      setIsPolling(true);
      fetchWorkItem(id)
        .then((data) => {
          if (!active) return;
          setItem(data);
          setTimeout(() => {
            if (active) setIsPolling(false);
          }, 500);
        })
        .catch(() => {
          if (active) setIsPolling(false);
        });
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  if (!item) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-xs uppercase animate-pulse text-[#1a1a1a]/60">
        Extracting workflow trace context...
      </div>
    );
  }

  const backHref = token ? `/workflows?token=${token}` : "/workflows";
  const style = item.status === "active" 
    ? "border-[#2d4a3e]/30 text-[#2d4a3e] dot-bg-[#2d4a3e]"
    : item.status === "stalled"
    ? "border-[#c4903a]/30 text-[#c4903a] dot-bg-[#c4903a]"
    : item.status === "completed"
    ? "border-[#2d4a3e]/40 bg-[#2d4a3e]/5 text-[#2d4a3e]"
    : "border-[#1a1a1a]/20 text-[#1a1a1a]/60";

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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast notifier */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#2d4a3e] text-[#faf9f5] px-4 py-3 border border-[#1a1a1a]/20 font-mono text-xs shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
          [MILESTONE] Active escalation dispatched to Upstash Redis. Status set to [ACTIVE].
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-start gap-4 border-b border-[#1a1a1a]/15 pb-4">
        <Link href={backHref} className="shrink-0 mt-0.5">
          <button className="flex items-center justify-center h-8 w-8 border border-[#1a1a1a]/15 hover:border-[#1a1a1a]/40 bg-[#f4f2eb] rounded-none hover:bg-[#1a1a1a]/5 transition-colors">
            <ArrowLeft className="h-4 w-4 text-[#1a1a1a]" />
          </button>
        </Link>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/50">
              Work Item Tracer
            </span>
            <div className="flex items-center gap-1 font-mono text-[8px] text-[#1a1a1a]/30 uppercase">
              <RefreshCw className={cn("h-2.5 w-2.5", isPolling && "animate-spin text-[#2d4a3e]")} />
            </div>
          </div>
          <h1 className="text-xl font-bold uppercase font-mono tracking-tight text-[#1a1a1a]">
            {item.title}
          </h1>
          <p className="font-mono text-xs text-[#1a1a1a]/60">ID: {item.id}</p>
        </div>
        <span className={cn("font-mono text-xs font-bold uppercase px-2.5 py-1 border bg-[#faf9f5] rounded-none whitespace-nowrap", style)}>
          [{item.status}]
        </span>
      </div>

      {/* Progress metrics */}
      <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-[#1a1a1a]/50 uppercase">Completion Quotient</span>
          <span className="text-lg font-bold text-[#2d4a3e]">{item.progress}%</span>
        </div>
        
        <div className="bg-[#1a1a1a]/5 h-4 overflow-hidden relative border border-[#1a1a1a]/5">
          <div 
            className="bg-[#2d4a3e] h-full transition-all duration-500 ease-out" 
            style={{ width: `${item.progress}%` }} 
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2 border-t border-[#1a1a1a]/5">
          <div>
            <p className="text-[#1a1a1a]/40 uppercase text-[9px] mb-0.5">Created</p>
            <p className="font-semibold text-[#1a1a1a]">{item.createdAt ? formatRelativeTime(new Date(item.createdAt).getTime()) : "N/A"}</p>
          </div>
          <div>
            <p className="text-[#1a1a1a]/40 uppercase text-[9px] mb-0.5">Updated</p>
            <p className="font-semibold text-[#1a1a1a]">{item.updatedAt ? formatRelativeTime(new Date(item.updatedAt).getTime()) : "N/A"}</p>
          </div>
          <div>
            <p className="text-[#1a1a1a]/40 uppercase text-[9px] mb-0.5">Fleet Lead</p>
            <p className="font-semibold text-[#1a1a1a] truncate">{item.owner || "unassigned"}</p>
          </div>
          <div>
            <p className="text-[#1a1a1a]/40 uppercase text-[9px] mb-0.5">Routing Key</p>
            <p className="font-semibold text-[#2d4a3e] uppercase">REDIS:WORK:{id.slice(0,6)}</p>
          </div>
        </div>
      </div>

      {/* Execution graph */}
      <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-5 shadow-sm space-y-4">
        <h3 className="font-mono text-xs font-bold uppercase text-[#1a1a1a]/50 tracking-wider">
          Execution Milestones
        </h3>
        <div className="pt-2">
          {item.stages && item.stages.length > 0 ? (
            item.stages.map((stage, i) => (
              <StageNode
                key={i}
                name={stage.name}
                done={stage.done}
                isLast={i === (item.stages?.length || 0) - 1}
              />
            ))
          ) : (
            <p className="font-mono text-xs text-[#1a1a1a]/40 text-center py-4 uppercase">
              No milestones cataloged for this workspace trace.
            </p>
          )}
        </div>
      </div>

      {/* Interactive recovery actions */}
      {item.status === "stalled" && (
        <div className="border border-[#c4903a]/40 bg-[#f4f2eb] p-5 shadow-sm relative overflow-hidden flex gap-4">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#c4903a]" />
          <AlertTriangle className="h-5 w-5 text-[#c4903a] shrink-0 mt-0.5" />
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase text-[#c4903a]">
              [alert] Workflow Blocked
            </h3>
            <p className="text-xs text-[#1a1a1a]/70 font-mono leading-relaxed">
              Execution timeline has halted. Re-route the correlation context to dispatch an active subagent loop.
            </p>
            <button
              onClick={handleEscalate}
              disabled={isUpdating}
              className={cn(
                "px-4 py-2 font-mono text-xs uppercase font-bold transition-all border border-[#c4903a] text-[#c4903a] bg-[#faf9f5] rounded-none hover:bg-[#c4903a]/10",
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
        <div className="border border-[#2d4a3e]/40 bg-[#f4f2eb] p-5 shadow-sm relative overflow-hidden flex gap-4">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#2d4a3e]" />
          <CheckCircle2 className="h-5 w-5 text-[#2d4a3e] shrink-0 mt-0.5" />
          <div className="space-y-1 font-mono">
            <h3 className="text-xs font-bold uppercase text-[#2d4a3e]">
              [milestone] Execution Completed
            </h3>
            <p className="text-xs text-[#1a1a1a]/60 uppercase">
              All milestones achieved and fully synchronized into fleet timeline.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Trace Timeline */}
      <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2">
          <h3 className="font-mono text-xs font-bold uppercase text-[#1a1a1a]/50 tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Workspace Event logs
          </h3>
          <span className="font-mono text-[9px] uppercase bg-[#1a1a1a]/5 px-2 py-0.5 border border-[#1a1a1a]/10 text-[#1a1a1a]/60">
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
                ? "border-[#9c3e3e]/30 bg-[#9c3e3e]/2 text-[#9c3e3e]"
                : isMilestone
                ? "border-[#2d4a3e]/30 bg-[#2d4a3e]/2 text-[#2d4a3e]"
                : isSystem
                ? "border-[#1a1a1a]/15 bg-[#1a1a1a]/2 text-[#1a1a1a]/60"
                : "border-[#c4903a]/30 bg-[#c4903a]/2 text-[#c4903a]";

              const dotColor = isError
                ? "bg-[#9c3e3e]"
                : isMilestone
                ? "bg-[#2d4a3e]"
                : isSystem
                ? "bg-[#1a1a1a]/40"
                : "bg-[#c4903a]";

              return (
                <div key={evt.id || i} className="border border-[#1a1a1a]/10 bg-[#faf9f5] rounded-none p-3.5 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2 font-mono text-[10px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
                      <span className="font-bold text-[#1a1a1a] uppercase">
                        [{evt.source || "agent"}]
                      </span>
                      <span className={cn("px-1.5 py-0.5 border text-[8px] font-bold uppercase tracking-wider", borderStyle)}>
                        {evt.kind || "event"}
                      </span>
                    </div>
                    <span className="text-[#1a1a1a]/40 uppercase shrink-0">
                      {formattedTime}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-[#1a1a1a]/85 leading-relaxed break-words">
                    {evt.summary}
                  </p>

                  {!!evt.payload && (
                    <div className="pt-1.5 border-t border-[#1a1a1a]/5 flex flex-col items-start">
                      <button
                        onClick={() => setExpandedEvents(prev => ({ ...prev, [evt.id || i]: !isExpanded }))}
                        className="text-[9px] font-mono uppercase text-[#2d4a3e] hover:text-[#2d4a3e]/80 flex items-center gap-1 font-bold"
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
                        <pre className="mt-2 w-full bg-[#1a1a1a] text-[#f4f2eb] border border-[#1a1a1a]/10 p-2.5 font-mono text-[10px] overflow-x-auto rounded-none">
                          {JSON.stringify(evt.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="font-mono text-xs text-[#1a1a1a]/40 text-center py-6 uppercase">
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
      <div className="flex items-center justify-center h-64 font-mono text-xs uppercase animate-pulse text-[#1a1a1a]/60">
        Acquiring trace payload...
      </div>
    }>
      <WorkflowTraceContent id={id} />
    </Suspense>
  );
}

