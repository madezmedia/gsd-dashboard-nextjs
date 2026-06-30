"use client";

import React, { useEffect, useState } from "react";
import { Activity, Terminal, Send, RefreshCw, Layers, Users } from "lucide-react";
import { AcmiClusterDashboard } from "@/components/acmi/AcmiClusterDashboard";
import { subscribeToBus, type BusEvent } from "@/lib/bus-stream";
import { acmiClient, acmiCall } from "@/lib/acmi-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AcmiDashboardPage() {
  const [busEvents, setBusEvents] = useState<BusEvent[]>([]);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [sendingEvent, setSendingEvent] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState<string | null>(null);

  const [rollup, setRollup] = useState<any>(null);
  const [loadingRollup, setLoadingRollup] = useState(false);
  const [rawTextMode, setRawTextMode] = useState(false);

  const loadRollup = async () => {
    setLoadingRollup(true);
    try {
      const data = await acmiClient.fetchLatestRollup();
      setRollup(data);
    } catch (err) {
      console.error("Failed to load rollup:", err);
    } finally {
      setLoadingRollup(false);
    }
  };

  // 1. Subscribe to Super Bus Stream & fetch initial Rollup
  useEffect(() => {
    loadRollup();
    const rollupInterval = setInterval(loadRollup, 10000); // Poll rollup every 10 seconds

    const unsubscribe = subscribeToBus((event) => {
      setBusEvents((prev) => [event, ...prev].slice(0, 50));
    });
    return () => {
      unsubscribe();
      clearInterval(rollupInterval);
    };
  }, []);

  // 2. Dispatch Comms v1.5 compliant testing spawn event
  const handleTestBroadcast = async () => {
    setSendingEvent(true);
    setBroadcastLog("Preparing Comms v1.5 spawn envelope...");
    try {
      const ts = Date.now();
      const correlationId = `antigravitySpawn-${ts}`;
      
      const payload = {
        ts,
        source: "agent:antigravity",
        kind: "spawn",
        correlationId,
        summary: "[spawn] Antigravity cockpit telemetry online and aligned with Comms v1.5",
        payload: {
          capabilities: ["code-authoring", "system-design", "vulnerability-scanner", "telemetry-relay"],
          model: "gemini-2.5-pro",
          workspace: "michaelshaw"
        }
      };

      // Emit through local Super Bus endpoint
      const result = await acmiCall("acmi_event", {
        namespace: "thread",
        id: "agent-coordination",
        ...payload
      });

      if (result) {
        setBroadcastLog(`Broadcast successful!\nCorrelation ID: ${correlationId}\nRegistered on agent-coordination thread.`);
      } else {
        setBroadcastLog("API proxy returned a null response. Verification needed.");
      }
    } catch (err) {
      setBroadcastLog(`Broadcast failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSendingEvent(false);
      setTimeout(() => setBroadcastLog(null), 8000);
    }
  };

  const filteredEvents = filterSource === "all" 
    ? busEvents 
    : busEvents.filter(e => e.source.includes(filterSource));

  // Unique sources for filter
  const sources = ["all", ...Array.from(new Set(busEvents.map(e => e.source.split(":")[0])))];

  return (
    <div className="w-full space-y-6">
      {/* ── Header Banner ─────────────────────────── */}
      <header className="relative border border-border bg-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-2xl" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[9px] tracking-wider font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-none uppercase border border-primary/20">
              [ WORKSPACE: ACTIVE ]
            </span>
            <span className="font-mono text-[9px] tracking-wider font-extrabold text-[#7DB8FF] bg-[#7DB8FF]/10 px-2 py-0.5 rounded-none uppercase border border-[#7DB8FF]/20">
              [ COMMS PROTOCOL: v1.5 ]
            </span>
          </div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif flex items-center gap-2">
            ACMI <span className="text-primary italic font-light font-sans">Fleet Operations Deck</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">
            Real-time telemetry and state synchronization over the ACMI Super Bus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleTestBroadcast}
            disabled={sendingEvent}
            className="bg-primary hover:bg-primary-hover text-[#0F2A2E] rounded-none font-mono text-[10px] uppercase h-8 cursor-pointer"
          >
            <Send className="h-3 w-3 mr-1.5" />
            {sendingEvent ? "Broadcasting..." : "Test Spawn Event"}
          </Button>

          <a href="/acmi/pipeline">
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-8 cursor-pointer"
            >
              <Layers className="h-3 w-3 mr-1.5" />
              Pipeline
            </Button>
          </a>

          <a href="/acmi/roundtable">
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-8 cursor-pointer"
            >
              <Users className="h-3 w-3 mr-1.5" />
              Roundtable
            </Button>
          </a>
        </div>
      </header>

      {/* Broadcast Log Notification Pop */}
      {broadcastLog && (
        <div className="font-mono text-xs text-primary border border-border bg-card rounded-none p-3 whitespace-pre-wrap animate-pulse shadow">
          ⚡ [SUPER BUS BROADCASTER]: {broadcastLog}
        </div>
      )}

      {/* ── Main Layout Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: High-Fidelity Overview Cluster */}
        <div className="xl:col-span-2 space-y-6">
          <div className="border border-border bg-card rounded-2xl p-4 shadow-md">
            <AcmiClusterDashboard 
              title="Agent Cluster Status Matrix" 
              pollIntervalMs={3000} 
              agentIds={[
                'claude-engineer',
                'design-ui-designer',
                'design-brand-guardian',
                'design-whimsy-injector',
                'antigravity'
              ]}
            />
          </div>

          {/* Latest Fleet Rollup Card */}
          <div className="border border-border bg-card rounded-2xl p-5 shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-2xl" />
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm tracking-wide font-serif uppercase">
                  Latest Session Rollup Summary
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRawTextMode(!rawTextMode)}
                  className="font-mono text-[9px] text-muted-foreground uppercase hover:bg-secondary h-6 cursor-pointer"
                >
                  {rawTextMode ? "Formatted View" : "Raw JSON"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={loadRollup}
                  disabled={loadingRollup}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RefreshCw className={cn("h-3 w-3", loadingRollup && "animate-spin")} />
                </Button>
              </div>
            </div>

            {loadingRollup && !rollup ? (
              <div className="py-8 text-center text-xs font-mono text-muted-foreground uppercase animate-pulse">
                Fetching rollup data...
              </div>
            ) : !rollup ? (
              <div className="py-8 text-center text-xs font-mono text-muted-foreground/40 uppercase">
                No session rollup found in Redis
              </div>
            ) : rawTextMode ? (
              <pre className="p-3 bg-black/40 text-[10px] text-primary font-mono overflow-auto max-h-[300px] border border-border/30 rounded-lg">
                {JSON.stringify(rollup, null, 2)}
              </pre>
            ) : (
              <div className="space-y-5">
                {/* Rollup Header Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary/35 p-3 border border-border/40 text-[10px] font-mono text-muted-foreground">
                  <div>
                    <span className="text-foreground font-bold">Correlation ID:</span>{" "}
                    <span className="text-primary">{rollup.correlationId || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-foreground font-bold">Sync Time:</span>{" "}
                    <span className="text-primary">{rollup.updated_at || "N/A"}</span>
                  </div>
                </div>

                {/* Grid of headline stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-secondary/20 border border-border/30 p-2.5 rounded-lg flex flex-col justify-center">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase block">Agents online</span>
                    <span className="text-lg font-bold text-foreground mt-0.5">
                      {rollup.agent_status_snapshot?.online?.length ?? 0}
                    </span>
                  </div>
                  <div className="bg-secondary/20 border border-border/30 p-2.5 rounded-lg flex flex-col justify-center">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase block">Known issues</span>
                    <span className="text-lg font-bold text-red-400 mt-0.5">
                      {rollup.open_known_issues?.length ?? 0}
                    </span>
                  </div>
                  <div className="bg-secondary/20 border border-border/30 p-2.5 rounded-lg flex flex-col justify-center">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase block">Delegated Tasks</span>
                    <span className="text-lg font-bold text-primary mt-0.5">
                      {rollup.delegations_complete?.length ?? rollup.delegations?.length ?? 0}
                    </span>
                  </div>
                  <div className="bg-secondary/20 border border-border/30 p-2.5 rounded-lg flex flex-col justify-center">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase block">Skills Stored</span>
                    <span className="text-lg font-bold text-[#7DB8FF] mt-0.5">
                      {rollup.skills_saved?.length ?? 0}
                    </span>
                  </div>
                </div>

                {/* Priority Issues & Action Items layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Open Issues */}
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] font-bold text-red-400 uppercase tracking-wider block">
                      ⚠️ Open Issues ({rollup.open_known_issues?.length || 0})
                    </span>
                    <div className="space-y-1.5 max-h-[220px] overflow-auto pr-1 scrollbar-thin">
                      {rollup.open_known_issues?.map((issue: any, idx: number) => (
                        <div key={idx} className="bg-black/20 border border-red-500/10 hover:border-red-500/20 p-2.5 text-[10px] rounded-lg">
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="font-bold text-foreground font-mono truncate">{issue.id}</span>
                            <span className={cn(
                              "font-mono text-[8px] uppercase px-1 rounded-sm shrink-0 border",
                              issue.severity === "P1" 
                                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            )}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-normal font-sans">
                            {issue.description || issue.symptom || issue.notes || "Active block issue."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Human Action Queue */}
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] font-bold text-primary uppercase tracking-wider block">
                      ⚡ Action items & next steps
                    </span>
                    <div className="space-y-1.5 max-h-[220px] overflow-auto pr-1 scrollbar-thin">
                      {rollup.next_session_priorities?.map((action: string, idx: number) => (
                        <div key={idx} className="bg-black/20 border border-border/30 hover:border-primary/20 p-2.5 text-[10px] rounded-lg flex items-start gap-2">
                          <span className="font-mono text-primary text-[10px] leading-tight shrink-0 mt-0.5">{idx + 1}.</span>
                          <p className="text-muted-foreground leading-normal font-sans">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Telemetry Footer Info */}
                <div className="border-t border-border/30 pt-3 flex flex-wrap gap-x-5 gap-y-2 text-[9px] font-mono text-muted-foreground">
                  <div>
                    <span className="text-foreground/75 font-bold">Mac Bridge:</span>{" "}
                    <span className={cn(rollup.fleet_telemetry?.mac_bridge_status?.includes("online") ? "text-primary" : "text-yellow-400")}>
                      {rollup.fleet_telemetry?.mac_bridge_status || "offline"}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/75 font-bold">Relay Stream PID:</span>{" "}
                    <span className="text-foreground">{rollup.fleet_telemetry?.opencode_bus_relay_pid || "none"}</span>
                  </div>
                  <div>
                    <span className="text-foreground/75 font-bold">Mattermost:</span>{" "}
                    <span className="text-foreground">{rollup.fleet_telemetry?.mattermost_ops_center_status || "offline"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Super Bus rolling terminal feed */}
        <div className="space-y-6">
          <div className="border border-border bg-black/40 text-foreground rounded-2xl p-5 flex flex-col h-[680px] shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  Super Bus Stream
                </span>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 mb-3 bg-secondary p-2 rounded-none border border-border">
              <span className="font-mono text-[9px] text-muted-foreground uppercase">Filter:</span>
              <div className="flex flex-wrap gap-1">
                {sources.slice(0, 4).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterSource(s)}
                    className={cn(
                      "font-mono text-[9px] px-1.5 py-0.5 rounded-none uppercase border transition-colors cursor-pointer",
                      filterSource === s 
                        ? "bg-primary text-[#0F2A2E] border-primary" 
                        : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal view block */}
            <div className="flex-1 overflow-auto font-mono text-[11px] space-y-3 pr-2 scrollbar-thin">
              {filteredEvents.length === 0 ? (
                <div className="text-muted-foreground/30 h-full flex flex-col items-center justify-center gap-2 select-none">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span>Awaiting events on super bus…</span>
                </div>
              ) : (
                filteredEvents.map((evt, idx) => (
                  <div key={idx} className="p-2.5 rounded-none bg-black/20 border border-border/40 hover:border-primary/20 transition-all group">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-primary font-bold truncate">
                        {evt.source}
                      </span>
                      <span className="text-muted-foreground/50 text-[9px] shrink-0">
                        {new Date(evt.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground/60 text-[9px] font-bold uppercase tracking-wider mb-1">
                      [{evt.type}]
                    </div>
                    <p className="text-foreground/90 group-hover:text-foreground transition-colors">
                      {String(evt.payload?.summary || evt.payload?.title || JSON.stringify(evt.payload))}
                    </p>
                    {!!evt.payload?.correlationId && (
                      <div className="text-[9px] text-[#7DB8FF] font-mono mt-1 select-all">
                        CID: {String(evt.payload.correlationId)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border pt-3 mt-4 flex items-center justify-between text-[10px] text-muted-foreground/40 font-mono">
              <span>Total events: {busEvents.length}</span>
              <span>Bus: ONLINE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
