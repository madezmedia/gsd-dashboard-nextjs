"use client";

import React, { useEffect, useState } from "react";
import { Activity, Terminal, Shield, Sparkles, Send, RefreshCw } from "lucide-react";
import { AcmiClusterDashboard } from "@/components/acmi/AcmiClusterDashboard";
import { subscribeToBus, type BusEvent } from "@/lib/bus-stream";
import { acmiCall } from "@/lib/acmi-client";

// Core colors: Forest Green (#2d4a3e), Mint (#5ef2c6), Warm Paper (#faf9f5 / #f4f2eb), Deep Teal (#0f2a2e), Amber (#c4903a)

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
    <div className="space-y-6 font-sans select-none antialiased">
      {/* ── Letterpress Header Banner ─────────────────────────── */}
      <div className="border border-[#2d4a3e]/10 bg-[#f4f2eb] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] tracking-wider font-extrabold text-[#2d4a3e] bg-[#5ef2c6]/30 px-2 py-0.5 rounded uppercase border border-[#2d4a3e]/10">
              [ WORKSPACE: ACTIVE ]
            </span>
            <span className="font-mono text-[10px] tracking-wider font-extrabold text-[#c4903a] bg-[#c4903a]/10 px-2 py-0.5 rounded uppercase border border-[#c4903a]/10">
              [ COMMS PROTOCOL: v1.5 ]
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f2a2e] flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-[#2d4a3e]" />
              ACMI Fleet Operations Cockpit
            </div>
            <div className="flex items-center gap-2 mt-1">
              <a href="/acmi/pipeline" className="text-[10px] px-2 py-1 rounded bg-[#2d4a3e]/10 hover:bg-[#2d4a3e]/20 text-[#2d4a3e] transition-colors">Pipeline</a>
              <a href="/acmi/roundtable" className="text-[10px] px-2 py-1 rounded bg-[#2d4a3e]/10 hover:bg-[#2d4a3e]/20 text-[#2d4a3e] transition-colors">Roundtable</a>
            </div>
          </h1>
          <p className="text-sm text-[#2d4a3e]/60 mt-1 max-w-2xl">
            Real-time telemetry and state synchronization over the ACMI Super Bus. High-density coordination across autonomous agents.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTestBroadcast}
            disabled={sendingEvent}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-[#2d4a3e]/20 bg-[#2d4a3e] text-[#faf9f5] hover:bg-[#0f2a2e] disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            {sendingEvent ? "Broadcasting..." : "Test Spawn Event"}
          </button>
        </div>
      </div>

      {/* Broadcast Log Notification Pop */}
      {broadcastLog && (
        <div className="font-mono text-xs text-[#2d4a3e] border border-[#2d4a3e]/20 bg-[#5ef2c6]/10 rounded-lg p-3 whitespace-pre-wrap animate-pulse">
          ⚡ [SUPER BUS BROADCASTER]: {broadcastLog}
        </div>
      )}

      {/* ── Main Layout Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: High-Fidelity Overview Cluster (Takes 2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="border border-[#2d4a3e]/10 bg-[#faf9f5] rounded-xl p-4 shadow-sm">
            <AcmiClusterDashboard 
              title="Agent Cluster Status" 
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
          <div className="border border-[#2d4a3e]/10 bg-[#0f2a2e] text-[#faf9f5] rounded-xl p-5 shadow-md flex flex-col h-[680px]">
            <div className="flex items-center justify-between border-b border-[#faf9f5]/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-[#5ef2c6]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#5ef2c6]">
                  Super Bus Stream
                </span>
              </div>
              <div className="h-2 w-2 rounded-full bg-[#5ef2c6] animate-ping" />
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 mb-3 bg-black/20 p-2 rounded-lg border border-[#faf9f5]/5">
              <span className="font-mono text-[9px] text-[#faf9f5]/50 uppercase">Filter:</span>
              <div className="flex flex-wrap gap-1">
                {sources.slice(0, 4).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterSource(s)}
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase border transition-colors ${
                      filterSource === s 
                        ? "bg-[#5ef2c6] text-[#0f2a2e] border-[#5ef2c6]" 
                        : "bg-transparent text-[#faf9f5]/60 border-[#faf9f5]/10 hover:text-[#faf9f5]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal view block */}
            <div className="flex-1 overflow-auto font-mono text-[11px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/5">
              {filteredEvents.length === 0 ? (
                <div className="text-[#faf9f5]/30 h-full flex flex-col items-center justify-center gap-2 select-none">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Awaiting events on super bus…</span>
                </div>
              ) : (
                filteredEvents.map((evt, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-black/20 border border-[#faf9f5]/5 hover:border-[#5ef2c6]/20 transition-all group">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[#5ef2c6] font-bold truncate">
                        {evt.source}
                      </span>
                      <span className="text-[#faf9f5]/40 text-[9px] shrink-0">
                        {new Date(evt.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[#faf9f5]/50 text-[9px] font-bold uppercase tracking-wider mb-1">
                      [{evt.type}]
                    </div>
                    <p className="text-[#faf9f5]/90 group-hover:text-white transition-colors">
                      {String(evt.payload?.summary || evt.payload?.title || JSON.stringify(evt.payload))}
                    </p>
                    {!!evt.payload?.correlationId && (
                      <div className="text-[9px] text-[#c4903a] font-mono mt-1 select-all">
                        CID: {String(evt.payload.correlationId)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#faf9f5]/10 pt-3 mt-4 flex items-center justify-between text-[10px] text-[#faf9f5]/40 font-mono">
              <span>Total events: {busEvents.length}</span>
              <span>Bus: ONLINE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
