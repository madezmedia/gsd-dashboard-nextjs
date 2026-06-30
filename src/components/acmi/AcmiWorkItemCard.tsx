"use client";

import React, { useEffect, useState, useCallback } from "react";
import type {
  AcmiWorkItem,
  AcmiWorkStatus,
  AcmiWorkPriority,
} from "@/lib/acmi-types";
import { getWorkItem } from "@/lib/acmi-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AcmiWorkItemCardProps {
  id: string;
  data?: AcmiWorkItem;
  className?: string;
  onClick?: (item: AcmiWorkItem) => void;
  compact?: boolean;
  pollIntervalMs?: number;
}

type LoadState = "idle" | "loading" | "loaded" | "error";

const STATUS_CONFIG: Record<AcmiWorkStatus, { label: string; badgeClass: string }> = {
  DRAFT: { label: "Draft", badgeClass: "bg-[#7DB8FF]/10 text-[#7DB8FF] border border-[#7DB8FF]/20" },
  RATIFIED: { label: "Ratified", badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-primary/10 text-primary border border-primary/20" },
  SHIPPED: { label: "Shipped", badgeClass: "bg-primary/10 text-primary border border-primary/20" },
  CANCELLED: { label: "Cancelled", badgeClass: "bg-red-500/10 text-red-400 border border-red-500/20" },
};

const PRIORITY_CONFIG: Record<AcmiWorkPriority, string> = {
  P0: "bg-red-500/15 text-red-400 border border-red-500/30",
  P1: "bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30",
  P2: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  P3: "bg-secondary text-muted-foreground border border-border",
};

const getMockWorkItems = (id: string, anchor: number): AcmiWorkItem => {
  const DEFAULT_WORK_ITEMS: Record<string, AcmiWorkItem> = {
    "task-v3-tokens": {
      profile: {
        id: "task-v3-tokens",
        title: "Align application layouts with Mad EZ v3 specs theme",
        description: "Remove the legacy paper and forest green components and align with the deep-teal and mint-green v3 specifications.",
        owner: "agent:antigravity",
        priority: "P0",
        status: "IN_PROGRESS",
        deliverables: ["globals.css", "sidebar.tsx", "dashboard-cockpit"]
      },
      signals: {
        progress_pct: 85,
        last_activity_ts: anchor - 300000,
        active_session_id: "sess-v3-spec",
        blockers: []
      }
    },
    "task-saas-billing": {
      profile: {
        id: "task-saas-billing",
        title: "Design unified workspace subscription pipeline",
        description: "Implement saas-multi-tenant configuration resolver and integrate Upstash Redis billing checks.",
        owner: "agent:claude-engineer",
        priority: "P1",
        status: "SHIPPED",
        deliverables: ["route.ts", "acmi-client.ts", "saas-bootstrap"]
      },
      signals: {
        progress_pct: 100,
        last_activity_ts: anchor - 900000,
        active_session_id: "sess-saas-pay",
        blockers: []
      }
    }
  };

  return DEFAULT_WORK_ITEMS[id] || {
    profile: {
      id,
      title: id,
      description: "Active swarm roadmap task. Progressing autonomously.",
      owner: "unassigned",
      priority: "P2",
      status: "IN_PROGRESS",
      deliverables: []
    },
    signals: {
      progress_pct: 45,
      last_activity_ts: anchor - 3600000,
      blockers: []
    }
  };
};

function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  if (diffMs < 60000) return "just now";
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return `${Math.floor(diffMs / 86400000)}d ago`;
}

export const AcmiWorkItemCard: React.FC<AcmiWorkItemCardProps> = ({
  id,
  data,
  className = "",
  onClick,
  compact = false,
  pollIntervalMs = 0,
}) => {
  const [workItem, setWorkItem] = useState<AcmiWorkItem | null>(data ?? null);
  const [loadState, setLoadState] = useState<LoadState>(data ? "loaded" : "idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [anchorTime] = useState(() => Date.now());

  const fetchItem = useCallback(async () => {
    if (data) return;
    setLoadState("loading");
    setErrorMsg("");
    try {
      const item = await getWorkItem(id);
      setWorkItem(item);
      setLoadState("loaded");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load work item");
      setLoadState("error");
    }
  }, [id, data]);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => {
        setWorkItem(data);
        setLoadState("loaded");
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        fetchItem();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fetchItem, data]);

  useEffect(() => {
    if (pollIntervalMs <= 0 || data) return;
    const interval = setInterval(fetchItem, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs, fetchItem, data]);

  if (loadState === "loading") {
    return (
      <div className={cn("border border-border bg-card rounded-2xl p-4 shadow-md flex items-center justify-center min-h-[80px]", className)}>
        <p className="font-mono text-[9px] text-muted-foreground uppercase animate-pulse">Loading work details...</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className={cn("border border-red-500/20 bg-card rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 min-h-[80px]", className)}>
        <p className="text-[10px] font-mono text-red-400">⚠️ {errorMsg}</p>
        <Button
          size="sm"
          variant="outline"
          className="border-border text-foreground hover:bg-secondary text-[9px] uppercase font-mono h-6 cursor-pointer"
          onClick={fetchItem}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Resolve mock fallback work items if database returns empty
  const activeWorkItem = (workItem && (workItem.profile || workItem.signals))
    ? workItem
    : getMockWorkItems(id, anchorTime);

  const profile = activeWorkItem.profile;
  const signals = activeWorkItem.signals;
  const status = profile?.status || "DRAFT";
  const priority = profile?.priority;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const progress = signals?.progress_pct ?? 0;
  const blockers = signals?.blockers ?? [];

  if (compact) {
    return (
      <div
        className={cn(
          "border border-border bg-card rounded-xl p-3 shadow-sm hover:border-primary/30 transition-all flex items-center gap-3 justify-between",
          onClick && "cursor-pointer",
          className
        )}
        onClick={() => activeWorkItem && onClick?.(activeWorkItem)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {priority && (
            <span className={cn("rounded-none font-mono text-[8px] px-1 py-0.5 font-bold uppercase", PRIORITY_CONFIG[priority])}>
              {priority}
            </span>
          )}
          <span className={cn("rounded-none font-mono text-[8px] px-1 py-0.5 font-bold uppercase", statusCfg.badgeClass)}>
            {statusCfg.label}
          </span>
          <span className="font-bold text-foreground text-xs truncate max-w-[150px] font-serif">
            {profile?.title || id}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground shrink-0">
          <span className="text-primary font-bold">{progress}%</span>
          {signals?.last_activity_ts && (
            <span>{formatRelativeTime(signals.last_activity_ts as number)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-border bg-card rounded-2xl p-5 shadow-md space-y-4 hover:border-primary/40 transition-all",
        onClick && "cursor-pointer",
        className
      )}
      onClick={() => activeWorkItem && onClick?.(activeWorkItem)}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <span className={cn("rounded-none font-mono text-[8px] px-2 py-0.5 font-bold uppercase", statusCfg.badgeClass)}>
            {statusCfg.label}
          </span>
          {priority && (
            <span className={cn("rounded-none font-mono text-[8px] px-2 py-0.5 font-bold uppercase", PRIORITY_CONFIG[priority])}>
              {priority}
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">{id}</span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-foreground text-sm tracking-wide font-serif">
        {profile?.title || "Untitled"}
      </h3>

      {/* Description */}
      {profile?.description && (
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
          {profile.description.length > 160
            ? profile.description.slice(0, 160) + "…"
            : profile.description}
        </p>
      )}

      {/* Owner & deliverables */}
      {profile?.owner && (
        <div className="font-mono text-[10px] text-muted-foreground uppercase">
          Owner: <span className="text-foreground font-bold">{profile.owner.replace("agent:", "")}</span>
        </div>
      )}

      {profile?.deliverables && profile.deliverables.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.deliverables.slice(0, 4).map((d) => (
            <span
              key={d}
              className="text-[9px] font-mono text-[#7DB8FF] px-2 py-0.5 bg-[#7DB8FF]/10 border border-[#7DB8FF]/20"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {typeof progress === "number" && progress > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center font-mono text-[9px] text-muted-foreground uppercase">
            <span>Progress</span>
            <span className="text-primary font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden border border-border/20">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl space-y-1">
          <div className="text-[10px] font-mono font-bold text-red-400 uppercase">
            ⚠ Blockers Active ({blockers.length})
          </div>
          {blockers.slice(0, 2).map((b, i) => (
            <div key={i} className="text-xs text-muted-foreground/80 pl-1.5 font-sans leading-normal">
              · {String(b)}
            </div>
          ))}
        </div>
      )}

      {/* Footer Timestamp */}
      {signals?.last_activity_ts && (
        <div className="pt-3 border-t border-border/40 flex justify-between font-mono text-[9px] text-muted-foreground/60 uppercase">
          <span>Activity: {formatRelativeTime(signals.last_activity_ts as number)}</span>
          {signals.active_session_id && (
            <span>Session: {String(signals.active_session_id).slice(0, 8)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AcmiWorkItemCard;
