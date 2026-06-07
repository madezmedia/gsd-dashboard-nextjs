"use client";

import { useEffect, useState, use, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Activity, Clock, Zap, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAgentBootstrap, type ACMIBootstrap } from "@/lib/acmi-client";
import type { AcmiEventPayload } from "@/lib/acmi-types";
import { formatRelativeTime } from "@/lib/utils";
import { AcmiProfileCard, AcmiSignalGauge, AcmiTimelineStream } from "@/components/acmi";

export default function AgentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ACMIBootstrap | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "stalled">("idle");
  const [activeFilter, setActiveFilter] = useState<"all" | "direct" | "coordination" | "work">("all");

  const loadData = useCallback(() => {
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
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const interval = setInterval(loadData, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadData]);

  // Convert signals array to key-value object for Acmi components
  const signalsObj = useMemo(() => {
    if (!data || !data.signals) return {};
    const obj: Record<string, unknown> = {};
    data.signals.forEach(s => {
      obj[s.key] = s.value;
    });
    return obj;
  }, [data]);

  // Convert legacy timeline events to AcmiEvent shape (parsing ts to number)
  const formattedEvents = useMemo(() => {
    if (!data || !data.timeline) return [];
    return data.timeline.map(e => ({
      id: e.id,
      ts: new Date(e.ts).getTime(),
      kind: e.kind,
      source: e.source,
      summary: e.summary,
      correlationId: e.correlationId || "",
      payload: e.payload as AcmiEventPayload | undefined,
      origin: (e.origin as "direct" | "coordination" | "work") || "direct"
    }));
  }, [data]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return formattedEvents;
    return formattedEvents.filter(e => e.origin === activeFilter);
  }, [formattedEvents, activeFilter]);

  // Convert profile data to fit AcmiProfileCard props
  const profileData = useMemo(() => {
    if (!data) return undefined;
    return {
      profile: {
        actor_type: "agent" as const,
        name: data.profile.name,
        role: data.profile.role,
        fleet_role: data.profile.role,
        description: data.profile.metadata?.description as string || "ACMI Fleet Specialist actively coordinating tasks.",
        avatar: data.profile.avatar || "🤖",
        expertise: data.profile.capabilities,
        skills: data.profile.capabilities,
        primary_id: data.profile.id,
      },
      signals: signalsObj,
    };
  }, [data, signalsObj]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-xs text-[#1a1a1a]/40">
        <div className="animate-pulse">[LOADING AGENT SYSTEM CORE...]</div>
      </div>
    );
  }

  const { profile } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 bg-[#faf9f5]">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between border border-[#1a1a1a]/15 p-4 bg-[#faf9f5] shadow-sm rounded-none gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/agents">
            <Button variant="ghost" size="icon" className="border border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5 rounded-none h-8 w-8">
              <ArrowLeft className="h-4 w-4 text-[#1a1a1a]" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 border border-[#1a1a1a]/20 flex items-center justify-center shrink-0 bg-[#f4f2eb] text-lg">
              {profile.avatar || "🤖"}
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold font-mono text-[#1a1a1a] tracking-tight truncate">
                {profile.name}
              </h1>
              <p className="text-[10px] text-[#1a1a1a]/55 font-mono uppercase tracking-wider">
                {profile.role} · @{id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {syncStatus === "syncing" && (
            <span className="font-mono text-[9px] text-[#2d4a3e] animate-pulse">
              [SYNCING...]
            </span>
          )}
          {syncStatus === "stalled" && (
            <span className="font-mono text-[9px] text-[#9c3e3e] font-bold animate-pulse">
              [STALLED]
            </span>
          )}
          <span className="font-mono text-[10px] uppercase font-bold border border-[#2d4a3e] px-2.5 py-1 text-[#2d4a3e] bg-[#2d4a3e]/5">
            {profile.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-[#f4f2eb] border border-[#1a1a1a]/15 p-1 rounded-none font-mono text-[10px] w-full md:w-auto flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#faf9f5] data-[state=active]:border-[#1a1a1a]/15 data-[state=active]:text-[#2d4a3e] rounded-none px-4 py-1.5 border border-transparent font-bold">
            [PROFILE]
          </TabsTrigger>
          <TabsTrigger value="signals" className="data-[state=active]:bg-[#faf9f5] data-[state=active]:border-[#1a1a1a]/15 data-[state=active]:text-[#2d4a3e] rounded-none px-4 py-1.5 border border-transparent font-bold">
            [TELEMETRY SIGNALS]
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-[#faf9f5] data-[state=active]:border-[#1a1a1a]/15 data-[state=active]:text-[#2d4a3e] rounded-none px-4 py-1.5 border border-transparent font-bold">
            [TIMELINE ({data.timeline.length})]
          </TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Premium profile Card */}
            <div className="lg:col-span-2">
              <AcmiProfileCard namespace="agent" id={id} data={profileData} />
            </div>

            {/* Spec details card */}
            <div className="flex flex-col gap-6">
              <Card className="rounded-none border-[#1a1a1a]/15 bg-[#faf9f5] shadow-sm">
                <CardHeader className="border-b border-[#1a1a1a]/10 py-3">
                  <CardTitle className="text-xs flex items-center gap-2 font-mono uppercase text-[#2d4a3e] font-bold">
                    <Brain className="h-3.5 w-3.5" /> Engine Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-[#1a1a1a]/5">
                    <span className="text-[#1a1a1a]/45 uppercase">Model ID</span>
                    <span className="font-semibold text-[#1a1a1a]">{profile.model || "unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#1a1a1a]/5">
                    <span className="text-[#1a1a1a]/45 uppercase">Last Active</span>
                    <span className="font-semibold text-[#1a1a1a]">
                      {profile.lastActive ? formatRelativeTime(new Date(profile.lastActive).getTime()) : "offline"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#1a1a1a]/5">
                    <span className="text-[#1a1a1a]/45 uppercase">Registry</span>
                    <span className="font-semibold text-[#1a1a1a]">fleet-default</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none border-[#1a1a1a]/15 bg-[#faf9f5] shadow-sm">
                <CardHeader className="border-b border-[#1a1a1a]/10 py-3">
                  <CardTitle className="text-xs flex items-center gap-2 font-mono uppercase text-[#2d4a3e] font-bold">
                    <Activity className="h-3.5 w-3.5" /> Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-xs font-mono">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border border-[#1a1a1a]/10 p-2 bg-[#f4f2eb]/50">
                      <p className="text-base font-bold text-[#c4903a]">
                        {String(data.rollup.decisions || 0)}
                      </p>
                      <p className="text-[8px] uppercase tracking-wider text-[#1a1a1a]/55">Decisions</p>
                    </div>
                    <div className="border border-[#1a1a1a]/10 p-2 bg-[#f4f2eb]/50">
                      <p className="text-base font-bold text-[#2d4a3e]">
                        {String(data.rollup.actions || 0)}
                      </p>
                      <p className="text-[8px] uppercase tracking-wider text-[#1a1a1a]/55">Actions</p>
                    </div>
                    <div className="border border-[#1a1a1a]/10 p-2 bg-[#f4f2eb]/50">
                      <p className="text-base font-bold text-[#1a1a1a]/70">
                        {data.timeline.length}
                      </p>
                      <p className="text-[8px] uppercase tracking-wider text-[#1a1a1a]/55">Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* AI Signals Tab */}
        <TabsContent value="signals" className="focus-visible:outline-none">
          <div className="max-w-3xl">
            <AcmiSignalGauge namespace="agent" id={id} data={signalsObj} />
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="focus-visible:outline-none">
          <div className="max-w-4xl space-y-4">
            {/* Filter Badges */}
            <div className="flex flex-wrap gap-2 font-mono text-[10px]">
              {(
                [
                  { id: "all", label: "ALL LOGS" },
                  { id: "direct", label: "DIRECT" },
                  { id: "coordination", label: "COORDINATION" },
                  { id: "work", label: "WORK PROGRESS" },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  aria-label={`Filter logs by ${filter.label}`}
                  className={`px-3 py-1 border transition-all duration-150 rounded-none ${
                    activeFilter === filter.id
                      ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e] font-bold"
                      : "bg-[#faf9f5] text-[#1a1a1a]/70 border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5"
                  }`}
                >
                  [{filter.label}]
                </button>
              ))}
            </div>

            <AcmiTimelineStream namespace="agent" id={id} events={filteredEvents} maxEvents={50} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
