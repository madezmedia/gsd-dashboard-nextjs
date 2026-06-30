"use client";

import React, { useEffect, useState } from "react";
import { Activity, Terminal, Send, RefreshCw, Layers, Users } from "lucide-react";
import { AcmiClusterDashboard } from "@/components/acmi/AcmiClusterDashboard";
import { subscribeToBus, type BusEvent } from "@/lib/bus-stream";
import { acmiCall } from "@/lib/acmi-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AcmiDashboardPage() {
  const [busEvents, setBusEvents] = useState<BusEvent[]>([]);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [sendingEvent, setSendingEvent] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState<string | null>(null);

  // 1. Subscribe to Super Bus Stream
  useEffect(() => {
    const unsubscribe = subscribeToBus((event) => {
      setBusEvents((prev) => [event, ...prev].slice(0, 50));
    });
    return () => unsubscribe();
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
