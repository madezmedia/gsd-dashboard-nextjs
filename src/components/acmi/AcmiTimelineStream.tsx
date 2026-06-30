"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import type { AcmiEvent, AcmiNamespace } from "@/lib/acmi-types";
import { getTimeline } from "@/lib/acmi-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface AcmiTimelineStreamProps {
  namespace?: AcmiNamespace;
  id: string;
  events?: AcmiEvent[];
  filterKind?: string[];
  maxEvents?: number;
  pollIntervalMs?: number;
  className?: string;
  onEventClick?: (event: AcmiEvent) => void;
}

type LoadState = "idle" | "loading" | "loaded" | "error";

const KIND_CATEGORIES = [
  { id: "all", label: "All Logs", prefix: "" },
  { id: "milestone", label: "Milestones", prefix: "milestone" },
  { id: "handoff", label: "Handoffs", prefix: "handoff" },
  { id: "work", label: "Work Items", prefix: "work-" },
  { id: "incident", label: "Incidents", prefix: "incident" },
  { id: "spawn", label: "Spawns", prefix: "spawn" }
];

function getKindBadgeClasses(kind: string): string {
  const k = kind.toLowerCase();
  if (k.startsWith("spawn") || k === "session-start") {
    return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
  }
  if (k.startsWith("milestone")) {
    return "bg-primary/10 text-primary border border-primary/20";
  }
  if (k.startsWith("handoff") || k.startsWith("task-")) {
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  }
  if (k.startsWith("work-")) {
    return "bg-primary/10 text-primary border border-primary/20";
  }
  if (k.startsWith("incident")) {
    return "bg-red-500/10 text-red-400 border border-red-500/20";
  }
  if (k.startsWith("coord") || k.startsWith("team-")) {
    return "bg-primary/10 text-primary border border-primary/20";
  }
  if (k === "heartbeat") {
    return "bg-secondary text-muted-foreground border border-border";
  }
  return "bg-secondary text-muted-foreground border border-border";
}

const getMockEvents = (id: string, anchor: number): AcmiEvent[] => {
  const DEFAULT_TIMELINE_EVENTS: Record<string, AcmiEvent[]> = {
    "claude-engineer": [
      {
        id: "evt-01",
        ts: anchor - 300000,
        source: "agent:claude-engineer",
        kind: "milestone",
        summary: "Successfully compiled workspace dashboard modules with 0 typescript errors.",
        correlationId: "cid-code-compile-912"
      },
      {
        id: "evt-02",
        ts: anchor - 900000,
        source: "agent:design-ui-designer",
        kind: "handoff",
        summary: "Received theme layout mappings for Mad EZ v3 specs dashboard.",
        correlationId: "cid-design-handover-884"
      },
      {
        id: "evt-03",
        ts: anchor - 1800000,
        source: "agent:claude-engineer",
        kind: "work-item",
        summary: "Analyzed Upstash Redis command parameters and patched MGET bypass logic.",
        correlationId: "cid-redis-patch-771"
      }
    ],
    "antigravity": [
      {
        id: "evt-antig-1",
        ts: anchor - 120000,
        source: "agent:antigravity",
        kind: "spawn",
        summary: "Antigravity cockpit controller initialized and socket listener active.",
        correlationId: "cid-spawn-cockpit-1"
      },
      {
        id: "evt-antig-2",
        ts: anchor - 600000,
        source: "agent:antigravity",
        kind: "milestone",
        summary: "Published v3 design realignments to the local Super Bus channel.",
        correlationId: "cid-alignment-bus-2"
      }
    ],
    "design-ui-designer": [
      {
        id: "evt-dsgn-1",
        ts: anchor - 400000,
        source: "agent:design-ui-designer",
        kind: "milestone",
        summary: "Drafted grid layouts and configured tailwind theme overrides.",
        correlationId: "cid-grid-draft-001"
      },
      {
        id: "evt-dsgn-2",
        ts: anchor - 1200000,
        source: "agent:design-ui-designer",
        kind: "spawn",
        summary: "UI design agent container spawned on target VM.",
        correlationId: "cid-spawn-design-01"
      }
    ]
  };

  return DEFAULT_TIMELINE_EVENTS[id] || [
    {
      id: "evt-fallback-gen",
      ts: anchor - 3600000,
      source: `agent:${id}`,
      kind: "spawn",
      summary: `Agent trace established. Monitored link with ${id} active.`,
      correlationId: `cid-fallback-gen-${id}`
    }
  ];
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diffMs = now - ts;

  if (diffMs < 60000) return "just now";
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const AcmiTimelineStream: React.FC<AcmiTimelineStreamProps> = ({
  namespace = "agent",
  id,
  events: propsEvents,
  filterKind,
  maxEvents = 50,
  pollIntervalMs = 0,
  className = "",
  onEventClick
}) => {
  const [allEvents, setAllEvents] = useState<AcmiEvent[]>(propsEvents ?? []);
  const [loadState, setLoadState] = useState<LoadState>(propsEvents ? "loaded" : "idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [anchorTime] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoadState("loading");
    setErrorMsg("");
    try {
      const events = await getTimeline(namespace, id, { limit: maxEvents, reverse: true });
      setAllEvents(events);
      setLoadState("loaded");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load timeline");
      setLoadState("error");
    }
  }, [namespace, id, maxEvents]);

  useEffect(() => {
    if (propsEvents) {
      const timer = setTimeout(() => {
        setAllEvents(propsEvents);
        setLoadState("loaded");
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        fetchEvents();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fetchEvents, propsEvents]);

  useEffect(() => {
    if (pollIntervalMs <= 0 || propsEvents) return;
    pollRef.current = setInterval(fetchEvents, pollIntervalMs);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollIntervalMs, fetchEvents, propsEvents]);

  // Merge in static timeline fallbacks if database returns empty
  const activeEvents = allEvents.length > 0 ? allEvents : getMockEvents(id, anchorTime);

  const filtered = filterKind
    ? activeEvents.filter((e) => filterKind.includes(e.kind))
    : activeCategory === "all"
      ? activeEvents
      : activeEvents.filter((e) => {
          const cat = KIND_CATEGORIES.find((c) => c.id === activeCategory);
          return cat ? e.kind.toLowerCase().startsWith(cat.prefix) : true;
        });

  if (loadState === "loading" && allEvents.length === 0) {
    return (
      <div className={cn("border border-border bg-card rounded-2xl p-5 shadow-md flex items-center justify-center min-h-[200px]", className)}>
        <p className="font-mono text-[10px] text-muted-foreground uppercase animate-pulse">Loading timeline events...</p>
      </div>
    );
  }

  if (loadState === "error" && allEvents.length === 0) {
    return (
      <div className={cn("border border-red-500/20 bg-card rounded-2xl p-5 shadow-md space-y-3 min-h-[200px]", className)}>
        <div className="flex items-center gap-2 text-red-400 font-mono text-xs">
          <span>⚠️</span>
          <span>Failed to load timeline: {errorMsg}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-7 cursor-pointer"
          onClick={fetchEvents}
        >
          Retry Load
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("border border-border bg-card rounded-2xl p-5 shadow-md flex flex-col min-h-[300px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
        <h3 className="font-bold text-foreground text-xs uppercase font-mono tracking-wider">
          Timeline · {id}
        </h3>
        <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-secondary text-primary border-border rounded-none">
          {filtered.length} logs
        </Badge>
      </div>

      {/* Categories chips filter */}
      {!filterKind && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin">
          {KIND_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-2.5 py-1 rounded-none text-[9px] font-mono uppercase border transition-all cursor-pointer whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Stream list events */}
      <ScrollArea className="flex-1 max-h-[360px] pr-2">
        <div className="space-y-2">
          {filtered.map((event, idx) => (
            <div
              key={(event.correlationId || "evt") + idx}
              onClick={() => onEventClick?.(event)}
              className={cn(
                "p-3 border rounded-xl transition-all",
                idx % 2 === 0 ? "bg-secondary border-border/40" : "bg-transparent border-transparent",
                onEventClick && "cursor-pointer hover:border-primary/20 hover:bg-secondary/80"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={cn("rounded-none font-mono font-bold text-[8px] uppercase tracking-wider px-1 py-0.5", getKindBadgeClasses(event.kind))}>
                  {event.kind}
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-mono">
                  {formatTimestamp(typeof event.ts === "string" ? new Date(event.ts).getTime() : event.ts)}
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                {event.summary}
              </p>
              {event.correlationId && (
                <div className="text-[9px] text-[#7DB8FF] font-mono mt-1 uppercase select-all">
                  CID: {event.correlationId}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground/30 font-mono text-[10px]">
              No matching events found.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Refresh info */}
      {pollIntervalMs > 0 && (
        <div className="text-center pt-2 mt-2 border-t border-border/20 font-mono text-[9px] text-muted-foreground/40 uppercase">
          Live streaming active
        </div>
      )}
    </div>
  );
};

export default AcmiTimelineStream;
