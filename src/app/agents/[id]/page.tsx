"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Activity, Clock, Zap, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchAgentBootstrap, type ACMIBootstrap, type ACMISignal, type ACMIEvent } from "@/lib/acmi-client";
import { formatRelativeTime, cn } from "@/lib/utils";

function SignalBadge({ signal }: { signal: ACMISignal }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]/10 last:border-0 text-xs font-mono">
      <span className="text-[#1a1a1a]/50 capitalize">{signal.key}</span>
      <span className="font-semibold text-[#1a1a1a]">{String(signal.value)}</span>
    </div>
  );
}

function TimelineItem({ event }: { event: ACMIEvent }) {
  let sourceLabel = event.source;
  if (event.source === "agent-coordination") {
    sourceLabel = "COORDINATION";
  } else if (event.source.startsWith("gsd-") || event.source === "work") {
    sourceLabel = `WORK: ${event.source}`;
  } else {
    sourceLabel = `DIRECT: ${event.source}`;
  }

  return (
    <div className="flex gap-3 py-3 border-b border-[#1a1a1a]/10 last:border-0 text-left font-mono">
      <div className={cn(
        "mt-1.5 h-1.5 w-1.5 rounded-none shrink-0", 
        event.kind === "decision" ? "bg-[#c4903a]" : "bg-[#2d4a3e]"
      )} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] uppercase font-bold text-[#1a1a1a]/40">[{sourceLabel}]</span>
          <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 border border-[#1a1a1a]/15 text-[#1a1a1a]/60">
            {event.kind}
          </span>
        </div>
        <p className="font-sans text-[12px] font-semibold text-[#1a1a1a] leading-tight">
          {event.summary}
        </p>
        <div className="flex items-center gap-2 text-[9px] text-[#1a1a1a]/40 flex-wrap">
          <span>{formatRelativeTime(new Date(event.ts).getTime())}</span>
          {event.correlationId && (
            <span className="truncate max-w-[200px]">· CID: {event.correlationId}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ACMIBootstrap | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<"all" | "direct" | "coordination" | "work">("all");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "stalled">("idle");

  const loadData = () => {
    setSyncStatus("syncing");
    fetchAgentBootstrap(id)
      .then((res) => {
        if (res) {
          setData(res);
          setSyncStatus("idle");
        } else {
          setSyncStatus("stalled");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch agent details:", err);
        setSyncStatus("stalled");
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const filteredTimeline = useMemo(() => {
    if (!data) return [];
    return data.timeline.filter((evt) => {
      if (timelineFilter === "all") return true;
      if (timelineFilter === "direct") {
        return evt.source !== "agent-coordination" && !evt.source.startsWith("gsd-") && evt.source !== "work";
      }
      if (timelineFilter === "coordination") {
        return evt.source === "agent-coordination";
      }
      if (timelineFilter === "work") {
        return evt.source.startsWith("gsd-") || evt.source === "work";
      }
      return true;
    });
  }, [data, timelineFilter]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-xs">
        <div className="animate-pulse text-[#1a1a1a]/40">[LOADING AGENT SYSTEM CORE...]</div>
      </div>
    );
  }

  const { profile, signals } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 bg-[#faf9f5]">
      {/* Header */}
      <div className="flex items-start md:items-center gap-4 border border-[#1a1a1a]/15 p-4 bg-[#faf9f5] shadow-sm rounded-none">
        <Link href="/agents">
          <Button variant="ghost" size="icon" className="border border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5 rounded-none h-8 w-8">
            <ArrowLeft className="h-4 w-4 text-[#1a1a1a]" />
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1 min-w-0">
          <div className="w-11 h-11 border border-[#1a1a1a]/20 flex items-center justify-center shrink-0 bg-[#f4f2eb]">
            <Bot className="h-5 w-5 text-[#2d4a3e]" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-lg font-bold font-mono text-[#1a1a1a] tracking-tight truncate">
              {profile.name}
            </h1>
            <p className="text-xs text-[#1a1a1a]/50 font-mono uppercase tracking-wider">
              {profile.role}
            </p>
          </div>
        </div>

        <div className="font-mono text-[10px] uppercase font-bold border border-[#2d4a3e] px-2.5 py-1 text-[#2d4a3e] bg-[#2d4a3e]/5 self-start md:self-auto shrink-0">
          [{profile.status}]
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-[#f4f2eb] border border-[#1a1a1a]/15 p-1 rounded-none font-mono text-[10px] w-full md:w-auto flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#faf9f5] data-[state=active]:border-[#1a1a1a]/15 data-[state=active]:text-[#2d4a3e] rounded-none px-4 py-1.5 border border-transparent font-bold">
            [PROFILE]
          </TabsTrigger>
          <TabsTrigger value="signals" className="data-[state=active]:bg-[#faf9f5] data-[state=active]:border-[#1a1a1a]/15 data-[state=active]:text-[#2d4a3e] rounded-none px-4 py-1.5 border border-transparent font-bold">
            [AI SIGNALS]
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-[#faf9f5] data-[state=active]:border-[#1a1a1a]/15 data-[state=active]:text-[#2d4a3e] rounded-none px-4 py-1.5 border border-transparent font-bold">
            [TIMELINE ({data.timeline.length})]
          </TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="space-y-4 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-none border-[#1a1a1a]/15 bg-[#faf9f5] shadow-sm">
              <CardHeader className="border-b border-[#1a1a1a]/10 py-3">
                <CardTitle className="text-xs flex items-center gap-2 font-mono uppercase text-[#2d4a3e] font-bold">
                  <Zap className="h-3.5 w-3.5" /> Core Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {profile.capabilities.length === 0 ? (
                    <span className="text-[#1a1a1a]/40">[No specialized capabilities listed]</span>
                  ) : (
                    profile.capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-0.5 border border-[#1a1a1a]/15 bg-[#f4f2eb] text-[#1a1a1a]/70">
                        {cap}
                      </span>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-[#1a1a1a]/15 bg-[#faf9f5] shadow-sm">
              <CardHeader className="border-b border-[#1a1a1a]/10 py-3">
                <CardTitle className="text-xs flex items-center gap-2 font-mono uppercase text-[#2d4a3e] font-bold">
                  <Brain className="h-3.5 w-3.5" /> Engine Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center py-1 border-b border-[#1a1a1a]/5">
                  <span className="text-[#1a1a1a]/45 uppercase">Model ID</span>
                  <span className="font-semibold">{profile.model || "unknown"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#1a1a1a]/5">
                  <span className="text-[#1a1a1a]/45 uppercase">Last Active Connection</span>
                  <span className="font-semibold">
                    {profile.lastActive ? formatRelativeTime(new Date(profile.lastActive).getTime()) : "offline"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#1a1a1a]/5">
                  <span className="text-[#1a1a1a]/45 uppercase">Fleet Identity</span>
                  <span className="font-semibold">@{id}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 rounded-none border-[#1a1a1a]/15 bg-[#faf9f5] shadow-sm">
              <CardHeader className="border-b border-[#1a1a1a]/10 py-3">
                <CardTitle className="text-xs flex items-center gap-2 font-mono uppercase text-[#2d4a3e] font-bold">
                  <Activity className="h-3.5 w-3.5" /> Consolidated Rollup Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="border border-[#1a1a1a]/10 p-3 bg-[#f4f2eb]/50">
                    <p className="text-lg font-bold text-[#c4903a]">
                      {String(data.rollup.decisions || 0)}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[#1a1a1a]/55">Decisions Made</p>
                  </div>
                  <div className="border border-[#1a1a1a]/10 p-3 bg-[#f4f2eb]/50">
                    <p className="text-lg font-bold text-[#2d4a3e]">
                      {String(data.rollup.actions || 0)}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[#1a1a1a]/55">Action Log Submits</p>
                  </div>
                  <div className="border border-[#1a1a1a]/10 p-3 bg-[#f4f2eb]/50">
                    <p className="text-lg font-bold text-[#1a1a1a]/70">
                      {data.timeline.length}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[#1a1a1a]/55">Aggregated Event Nodes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Signals Tab */}
        <TabsContent value="signals" className="focus-visible:outline-none">
          <Card className="rounded-none border-[#1a1a1a]/15 bg-[#faf9f5] shadow-sm">
            <CardHeader className="border-b border-[#1a1a1a]/10 py-3">
              <CardTitle className="text-xs font-mono uppercase text-[#2d4a3e] font-bold">
                Registered AI Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[320px] pr-2">
                {signals.length === 0 ? (
                  <p className="text-xs font-mono text-[#1a1a1a]/40 text-center py-8">[No active telemetry signals found]</p>
                ) : (
                  <div className="space-y-0.5">
                    {signals.map((sig) => (
                      <SignalBadge key={sig.key} signal={sig} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="focus-visible:outline-none">
          <Card className="rounded-none border-[#1a1a1a]/15 bg-[#faf9f5] shadow-sm">
            <CardHeader className="border-b border-[#1a1a1a]/10 py-3 flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-xs font-mono uppercase text-[#2d4a3e] font-bold flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Real-time Aggregated Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              
              {/* Timeline Filters */}
              <div className="flex items-center gap-1.5 flex-wrap mb-4 font-mono text-[9px]">
                <button
                  onClick={() => setTimelineFilter("all")}
                  className={cn(
                    "px-2.5 py-1 border transition-all rounded-none font-bold",
                    timelineFilter === "all" 
                      ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]" 
                      : "bg-[#faf9f5] text-[#1a1a1a]/60 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30"
                  )}
                >
                  [ALL LOGS]
                </button>
                <button
                  onClick={() => setTimelineFilter("direct")}
                  className={cn(
                    "px-2.5 py-1 border transition-all rounded-none font-bold",
                    timelineFilter === "direct" 
                      ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]" 
                      : "bg-[#faf9f5] text-[#1a1a1a]/60 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30"
                  )}
                >
                  [DIRECT]
                </button>
                <button
                  onClick={() => setTimelineFilter("coordination")}
                  className={cn(
                    "px-2.5 py-1 border transition-all rounded-none font-bold",
                    timelineFilter === "coordination" 
                      ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]" 
                      : "bg-[#faf9f5] text-[#1a1a1a]/60 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30"
                  )}
                >
                  [COORDINATION]
                </button>
                <button
                  onClick={() => setTimelineFilter("work")}
                  className={cn(
                    "px-2.5 py-1 border transition-all rounded-none font-bold",
                    timelineFilter === "work" 
                      ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]" 
                      : "bg-[#faf9f5] text-[#1a1a1a]/60 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30"
                  )}
                >
                  [WORK PROGRESS]
                </button>
                
                {syncStatus === "syncing" && (
                  <span className="text-[#2d4a3e] animate-pulse ml-auto">
                    [SYNCING...]
                  </span>
                )}
                {syncStatus === "stalled" && (
                  <span className="text-[#c4903a] font-bold animate-pulse ml-auto">
                    [SYNC STALLED]
                  </span>
                )}
              </div>

              <ScrollArea className="h-[400px] pr-2">
                {filteredTimeline.length === 0 ? (
                  <p className="text-xs font-mono text-[#1a1a1a]/40 py-12 text-center">
                    [No events matching the active filter]
                  </p>
                ) : (
                  <div className="divide-y divide-[#1a1a1a]/10">
                    {filteredTimeline.map((evt) => (
                      <TimelineItem key={evt.id} event={evt} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
