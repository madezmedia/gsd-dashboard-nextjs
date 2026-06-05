"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Circle } from "lucide-react";
import { AcmiProfileCard } from "@/components/acmi/AcmiProfileCard";
import { AcmiTimelineStream } from "@/components/acmi/AcmiTimelineStream";
import { subscribeToBus, type BusEvent } from "@/lib/bus-stream";
import { acmiCall } from "@/lib/acmi-client";

const AGENT_IDS = ["grok", "opencode", "bentley-main", "bentley", "antigravity", "design-agency", "gemini-cli", "claude-engineer", "avery", "aba-bcba-expert"];

function timeSince(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RoundtablePage() {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [busEvents, setBusEvents] = useState<BusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToBus((event) => {
      setBusEvents((prev) => [event, ...prev].slice(0, 30));
    });

    async function load() {
      const results: Record<string, any> = {};
      for (const id of AGENT_IDS) {
        try {
          const data = await acmiCall("acmi_get", { namespace: "agent", id });
          results[id] = data;
        } catch {}
      }
      setProfiles(results);
      setLoading(false);
    }
    load();
    return () => unsub();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2a2e]">Fleet Roundtable</h1>
          <p className="text-sm text-[#2d4a3e]/60 mt-1">Agent status overview with live Super Bus feed</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[#2d4a3e]/40">Loading agents...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AGENT_IDS.map((id) => {
            const data = profiles[id];
            const lastEvent = data?.timeline_recent?.[data.timeline_recent.length - 1];
            const ts = lastEvent?.ts;
            const hrs = ts ? (Date.now() - ts) / 3600000 : 999;

            return (
              <AcmiProfileCard
                key={id}
                namespace="agent"
                id={id}
                data={{ profile: data?.profile || {}, signals: data?.signals || {} }}
              />
            );
          })}
        </div>
      )}

      {busEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#0f2a2e] mb-3">Live Super Bus Feed</h2>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {busEvents.slice(0, 20).map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[#2d4a3e]/60 py-1.5 border-b border-[#2d4a3e]/5">
                <Circle className="w-1.5 h-1.5 mt-1 shrink-0 text-[#5ef2c6]" />
                <span className="shrink-0 font-mono text-[#2d4a3e]/40">{ev.source?.replace("agent:", "") || "?"}</span>
                <span className="line-clamp-1">{(ev as unknown as Record<string, unknown>).summary as string || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
