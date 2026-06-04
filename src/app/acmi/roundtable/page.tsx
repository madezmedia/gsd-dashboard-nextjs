"use client";

import React, { useEffect, useState } from "react";
import { Activity, Circle, Clock, RefreshCw, Bot, Phone, Code, Palette, Shield } from "lucide-react";
import { subscribeToBus, type BusEvent } from "@/lib/bus-stream";
import { acmiCall } from "@/lib/acmi-client";

const AGENTS = [
  { id: "grok", name: "Grok", role: "Influencer Fleet", icon: Bot, color: "#1DA1F2" },
  { id: "opencode", name: "OpenCode", role: "Code & Design", icon: Code, color: "#10b981" },
  { id: "bentley-main", name: "Bentley", role: "Fleet Lead", icon: Bot, color: "#8b5cf6" },
  { id: "bentley", name: "Bentley Voice", role: "Voice Agent", icon: Phone, color: "#f59e0b" },
  { id: "antigravity", name: "Antigravity", role: "UI Specialist", icon: Palette, color: "#ec4899" },
  { id: "design-agency", name: "Design Agency", role: "Creative", icon: Palette, color: "#14b8a6" },
  { id: "gemini-cli", name: "Gemini CLI", role: "Scanner", icon: Shield, color: "#6366f1" },
  { id: "claude-engineer", name: "Claude Engineer", role: "Engineering", icon: Code, color: "#ef4444" },
  { id: "avery", name: "Avery", role: "Real Estate", icon: Phone, color: "#84cc16" },
  { id: "aba-bcba", name: "ABA Expert", role: "Clinical", icon: Shield, color: "#06b6d4" },
];

function timeSince(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getStatusColor(lastTs: number | null): string {
  if (!lastTs) return "bg-gray-400";
  const hrs = (Date.now() - lastTs) / 3600000;
  if (hrs < 1) return "bg-emerald-400";
  if (hrs < 6) return "bg-amber-400";
  if (hrs < 24) return "bg-red-400";
  return "bg-gray-300";
}

export default function RoundtablePage() {
  const [agentActivity, setAgentActivity] = useState<Record<string, { lastTs: number; summary: string }>>({});
  const [busEvents, setBusEvents] = useState<BusEvent[]>([]);

  useEffect(() => {
    subscribeToBus((event) => {
      setBusEvents((prev) => [event, ...prev].slice(0, 30));
      if (event.source) {
        const sourceId = event.source.replace("agent:", "");
        setAgentActivity((prev) => ({
          ...prev,
          [sourceId]: { lastTs: Date.now(), summary: event.summary?.slice(0, 80) || "Activity detected" },
        }));
      }
    });

    async function loadInitial() {
      for (const agent of AGENTS) {
        try {
          const data = await acmiCall("acmi_get", { namespace: "agent", id: agent.id });
          const timeline = data?.timeline_recent || [];
          const last = timeline[timeline.length - 1];
          if (last?.ts) {
            setAgentActivity((prev) => ({
              ...prev,
              [agent.id]: { lastTs: last.ts, summary: last.summary?.slice(0, 80) || "No data" },
            }));
          }
        } catch {}
      }
    }
    loadInitial();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fleet Roundtable</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time agent activity and status overview</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {AGENTS.map((agent) => {
          const activity = agentActivity[agent.id];
          const Icon = agent.icon;
          const statusColor = getStatusColor(activity?.lastTs || null);

          return (
            <div key={agent.id} className="rounded-lg border border-gray-200/60 bg-white p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: agent.color + "15" }}>
                    <Icon className="w-4 h-4" style={{ color: agent.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{agent.name}</h3>
                    <p className="text-[10px] text-gray-400">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                  {activity && <span className="text-[10px] text-gray-400">{timeSince(activity.lastTs)}</span>}
                </div>
              </div>
              {activity && (
                <p className="text-[11px] text-gray-500 mt-3 line-clamp-2 leading-relaxed">{activity.summary}</p>
              )}
            </div>
          );
        })}
      </div>

      {busEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3">Live Bus Feed</h2>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {busEvents.slice(0, 15).map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-gray-500 py-1 border-b border-gray-100 last:border-0">
                <Circle className="w-1.5 h-1.5 mt-1 shrink-0 text-gray-300" />
                <span className="shrink-0 font-mono text-gray-400">{ev.source?.replace("agent:", "") || "?"}</span>
                <span className="line-clamp-1">{ev.summary?.slice(0, 100) || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
