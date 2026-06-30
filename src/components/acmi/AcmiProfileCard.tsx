"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { AcmiProfile, AcmiSignals, AcmiNamespace } from "@/lib/acmi-types";
import { getEntity } from "@/lib/acmi-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AcmiProfileCardProps {
  namespace?: AcmiNamespace;
  id: string;
  data?: {
    profile: AcmiProfile | null;
    signals: AcmiSignals | null;
  };
  className?: string;
  onSelect?: (id: string) => void;
}

type LoadState = "idle" | "loading" | "loaded" | "error";

const ACTOR_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  agent: { label: "Agent Swarm", icon: "🤖" },
  human: { label: "Operator", icon: "👤" },
  system: { label: "System Host", icon: "⚙️" },
  external: { label: "External Integrator", icon: "🔗" }
};

const DEFAULT_AGENTS_METADATA: Record<string, { name: string; role: string; desc: string; skills: string[] }> = {
  "claude-engineer": {
    name: "Claude Engineer",
    role: "Deep Coding Specialist",
    desc: "Autonomous implementation and codebase-wide code review specialist.",
    skills: ["typescript", "next.js", "turbopack", "rest-apis", "upstash"]
  },
  "antigravity": {
    name: "Antigravity",
    role: "Swarm Orchestrator",
    desc: "Primary agentic pilot directing coordinate swarms and UI aesthetics.",
    skills: ["swarm-piloting", "v3-design", "context-mapping", "auto-healing"]
  },
  "design-ui-designer": {
    name: "UI Specialist",
    role: "Aesthetics Designer",
    desc: "Generates high-fidelity user interface specifications and Tailwind styles.",
    skills: ["ui-ux-design", "glassmorphic-grids", "tailwind-v4", "design-tokens"]
  },
  "design-brand-guardian": {
    name: "Brand Guardian",
    role: "Color & Typography Auditor",
    desc: "Enforces design restraint, contrast validation, and logo guidelines.",
    skills: ["contrast-compliance", "web-accessibility", "aesthetic-audit"]
  },
  "design-whimsy-injector": {
    name: "Whimsy Injector",
    role: "Motion & Micro-interactions",
    desc: "Injects anime.js transitions, physics-based springs, and hover animations.",
    skills: ["anime.js", "spring-physics", "micro-interactions", "transitions"]
  }
};

export const AcmiProfileCard: React.FC<AcmiProfileCardProps> = ({
  namespace = "agent",
  id,
  data,
  className = "",
  onSelect
}) => {
  const [profile, setProfile] = useState<AcmiProfile | null>(data?.profile ?? null);
  const [signals, setSignals] = useState<AcmiSignals | null>(data?.signals ?? null);
  const [loadState, setLoadState] = useState<LoadState>(data ? "loaded" : "idle");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    if (data) return;
    setLoadState("loading");
    setErrorMsg("");
    try {
      const entity = await getEntity(namespace, id);
      setProfile(entity.profile);
      setSignals(entity.signals);
      setLoadState("loaded");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load profile");
      setLoadState("error");
    }
  }, [namespace, id, data]);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => {
        setProfile(data.profile);
        setSignals(data.signals);
        setLoadState("loaded");
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        fetchData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fetchData, data]);

  if (loadState === "loading") {
    return (
      <div className={cn("border border-border bg-card rounded-2xl p-5 shadow-md flex items-center justify-center min-h-[160px]", className)}>
        <p className="font-mono text-[10px] text-muted-foreground uppercase animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className={cn("border border-red-500/20 bg-card rounded-2xl p-5 shadow-md space-y-3 min-h-[160px]", className)}>
        <div className="flex items-center gap-2 text-red-400 font-mono text-xs">
          <span>⚠️</span>
          <span>Failed to load profile: {errorMsg}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-7 cursor-pointer"
          onClick={fetchData}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  // Resolve metadata (database first, then default fallback meta)
  const agentMeta = DEFAULT_AGENTS_METADATA[id] || {
    name: id,
    role: "Autonomous Agent",
    desc: "Active fleet member processing background directives.",
    skills: ["automation", "acmi-protocol"]
  };

  const name = profile?.name || agentMeta.name;
  const role = profile?.fleet_role || profile?.role || agentMeta.role;
  const desc = profile?.description || agentMeta.desc;
  const skills = (profile?.expertise || profile?.skills || agentMeta.skills) as string[];

  const at = profile?.actor_type ?? "agent";
  const actorInfo = ACTOR_TYPE_LABELS[at] ?? ACTOR_TYPE_LABELS.agent;
  const status = signals?.status ?? profile?.status ?? "active";

  return (
    <div
      className={cn(
        "border border-border bg-card rounded-2xl p-5 shadow-md space-y-4 hover:border-primary/40 transition-all",
        onSelect && "cursor-pointer",
        className
      )}
      onClick={() => onSelect?.(id)}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg border border-border">
            {profile?.avatar || actorInfo.icon}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm tracking-wide font-serif">
              {name}
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-tight mt-0.5">
              {actorInfo.label} · {profile?.primary_id || id}
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            "rounded-none font-mono text-[9px] uppercase px-2 py-0.5",
            status === "active" || status === "live" || status === "working"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-[#7DB8FF]/10 text-[#7DB8FF] border border-[#7DB8FF]/20"
          )}
        >
          {status}
        </Badge>
      </div>

      {/* Role */}
      {role && (
        <div className="inline-flex font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 uppercase">
          {role}
        </div>
      )}

      {/* Description */}
      {desc && (
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
          {desc}
        </p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="text-[9px] font-mono text-muted-foreground uppercase px-2 py-0.5 bg-secondary border border-border/60"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Signals Metrics */}
      {signals && Object.keys(signals).length > 0 && (
        <div className="pt-3 border-t border-border/40 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[9px]">
          {Object.entries(signals)
            .filter(([k]) => !["status", "bloopers"].includes(k))
            .slice(0, 4)
            .map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-muted-foreground/60 uppercase">{key.replace(/[_-]/g, " ")}:</span>
                <span className="text-primary font-bold">{String(val ?? "—")}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AcmiProfileCard;
