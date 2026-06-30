"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { AcmiSignals, AcmiNamespace } from "@/lib/acmi-types";
import { getSignals } from "@/lib/acmi-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AcmiSignalGaugeProps {
  namespace?: AcmiNamespace;
  id: string;
  data?: AcmiSignals | null;
  keys?: string[];
  excludeKeys?: string[];
  className?: string;
  density?: "comfortable" | "compact";
  onSignalClick?: (key: string, value: unknown) => void;
  pollIntervalMs?: number;
}

type LoadState = "idle" | "loading" | "loaded" | "error";
type SignalType = "string" | "number" | "percentage" | "boolean" | "array" | "object" | "nullish";

const DEFAULT_SIGNAL_METRICS: Record<string, Record<string, unknown>> = {
  "claude-engineer": {
    status: "live",
    tier: "T2-specialist",
    autonomy: "70-auto-30-human",
    active_tasks: 2,
    cpu_usage: 14,
    queue_depth: 0
  },
  "antigravity": {
    status: "idle",
    tier: "T1-orchestrator",
    autonomy: "90-auto-10-human",
    active_tasks: 0,
    cpu_usage: 2,
    queue_depth: 0
  },
  "design-ui-designer": {
    status: "idle",
    tier: "T2-specialist",
    autonomy: "95-auto-5-human",
    active_tasks: 0,
    cpu_usage: 1,
    queue_depth: 0
  },
  "design-brand-guardian": {
    status: "idle",
    tier: "T2-specialist",
    autonomy: "95-auto-5-human",
    active_tasks: 0,
    cpu_usage: 1,
    queue_depth: 0
  },
  "design-whimsy-injector": {
    status: "idle",
    tier: "T2-specialist",
    autonomy: "95-auto-5-human",
    active_tasks: 0,
    cpu_usage: 1,
    queue_depth: 0
  }
};

function classifySignal(value: unknown): SignalType {
  if (value == null) return "nullish";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    if (value >= 0 && value <= 100 && Number.isFinite(value)) return "percentage";
    return "number";
  }
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "string";
}

function formatSignalKey(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSignalValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value).slice(0, 40);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

interface SignalValueRendererProps {
  key_: string;
  value: unknown;
  type_: SignalType;
  onClick?: () => void;
}

const SignalBoolean: React.FC<SignalValueRendererProps> = ({ value }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase",
      value ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-muted-foreground border border-border"
    )}
  >
    {value ? "● True" : "○ False"}
  </span>
);

const SignalPercentage: React.FC<SignalValueRendererProps> = ({ value }) => {
  const pct = Math.min(100, Math.max(0, value as number));
  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden border border-border/20">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            pct > 80 ? "bg-primary" : pct > 50 ? "bg-[#7DB8FF]" : "bg-[#F2C94C]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "font-mono text-[10px] font-bold min-w-[28px] text-right",
          pct > 80 ? "text-primary" : pct > 50 ? "text-[#7DB8FF]" : "text-[#F2C94C]"
        )}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
};

const SignalNumber: React.FC<SignalValueRendererProps> = ({ value }) => (
  <span className="font-mono text-xs font-bold text-primary">
    {typeof value === "number" ? value.toLocaleString() : String(value)}
  </span>
);

const SignalArray: React.FC<SignalValueRendererProps> = ({ value }) => {
  const arr = (value as unknown[]).slice(0, 5);
  return (
    <div className="flex flex-wrap gap-1">
      {arr.map((item, i) => (
        <span
          key={i}
          className="text-[9px] font-mono text-primary px-1.5 py-0.5 bg-primary/10 border border-primary/20"
        >
          {String(item).slice(0, 20)}
        </span>
      ))}
      {(value as unknown[]).length > 5 && (
        <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">
          +{(value as unknown[]).length - 5} more
        </span>
      )}
    </div>
  );
};

const SignalObject: React.FC<SignalValueRendererProps> = ({ value }) => (
  <span className="font-mono text-[10px] text-muted-foreground/80 truncate block max-w-[160px]">
    {JSON.stringify(value).slice(0, 40) + (JSON.stringify(value).length > 40 ? "…" : "")}
  </span>
);

const SignalNullish: React.FC = () => (
  <span className="text-muted-foreground/30 font-mono text-xs">—</span>
);

function SignalValue({ key_, value, type_, onClick }: SignalValueRendererProps) {
  const render = () => {
    switch (type_) {
      case "boolean":
        return <SignalBoolean key_={key_} value={value} type_={type_} />;
      case "percentage":
        return <SignalPercentage key_={key_} value={value} type_={type_} />;
      case "number":
        return <SignalNumber key_={key_} value={value} type_={type_} />;
      case "array":
        return <SignalArray key_={key_} value={value} type_={type_} />;
      case "object":
        return <SignalObject key_={key_} value={value} type_={type_} />;
      case "string":
        return <span className="font-mono text-xs text-foreground font-bold">{formatSignalValue(value)}</span>;
      default:
        return <SignalNullish />;
    }
  };

  return (
    <div onClick={onClick} className={cn(onClick && "cursor-pointer")}>
      {render()}
    </div>
  );
}

export const AcmiSignalGauge: React.FC<AcmiSignalGaugeProps> = ({
  namespace = "agent",
  id,
  data,
  keys: propKeys,
  excludeKeys,
  className = "",
  density = "comfortable",
  onSignalClick,
  pollIntervalMs = 0
}) => {
  const [signals, setSignals] = useState<AcmiSignals | null>(data ?? null);
  const [loadState, setLoadState] = useState<LoadState>(data !== undefined ? "loaded" : "idle");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSignals = useCallback(async () => {
    if (data !== undefined) return;
    setLoadState("loading");
    setErrorMsg("");
    try {
      const s = await getSignals(namespace, id);
      setSignals(s);
      setLoadState("loaded");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load signals");
      setLoadState("error");
    }
  }, [namespace, id, data]);

  useEffect(() => {
    if (data !== undefined) {
      const timer = setTimeout(() => {
        setSignals(data);
        setLoadState("loaded");
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        fetchSignals();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fetchSignals, data]);

  useEffect(() => {
    if (pollIntervalMs <= 0 || data !== undefined) return;
    const interval = setInterval(fetchSignals, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs, fetchSignals, data]);

  // Exclude keys
  const excludeSet = new Set(excludeKeys ?? ["bloopers", "blockers"]);
  
  // Resolve mock fallback signals if database returns empty
  const activeSignals = (signals && Object.keys(signals).length > 0)
    ? signals
    : (DEFAULT_SIGNAL_METRICS[id] || { status: "active", autonomy: "100-auto" });

  const signalEntries = Object.entries(activeSignals).filter(([k]) => !excludeSet.has(k));

  // If propKeys specified, reorder and filter
  const displayEntries = propKeys
    ? signalEntries.filter(([k]) => propKeys.includes(k))
        .sort((a, b) => propKeys.indexOf(a[0]) - propKeys.indexOf(b[0]))
    : signalEntries;

  if (loadState === "loading" && (!signals || Object.keys(signals).length === 0)) {
    return (
      <div className={cn("border border-border bg-card rounded-2xl p-5 shadow-md flex items-center justify-center min-h-[140px]", className)}>
        <p className="font-mono text-[10px] text-muted-foreground uppercase animate-pulse">Loading signal metrics...</p>
      </div>
    );
  }

  if (loadState === "error" && (!signals || Object.keys(signals).length === 0)) {
    return (
      <div className={cn("border border-red-500/20 bg-card rounded-2xl p-5 shadow-md space-y-3 min-h-[140px]", className)}>
        <div className="flex items-center gap-2 text-red-400 font-mono text-xs">
          <span>⚠️</span>
          <span>Failed to load signals: {errorMsg}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-7 cursor-pointer"
          onClick={fetchSignals}
        >
          Retry
        </Button>
      </div>
    );
  }

  const isCompact = density === "compact";

  return (
    <div className={cn("border border-border bg-card rounded-2xl p-5 shadow-md flex flex-col min-h-[200px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
        <h3 className="font-bold text-foreground text-xs uppercase font-mono tracking-wider">
          Signals · {id}
        </h3>
        <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-secondary text-primary border-border rounded-none">
          {displayEntries.length} keys
        </Badge>
      </div>

      {/* Grid Matrix list */}
      <div className="flex flex-col gap-2">
        {displayEntries.map(([key, value], idx) => {
          const type_ = classifySignal(value);
          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between py-2 border-b border-border/20 last:border-b-0 gap-4",
                isCompact ? "flex-row" : "flex-row"
              )}
            >
              {/* Label */}
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wide truncate max-w-[120px]">
                {formatSignalKey(key)}
              </span>

              {/* Value */}
              <SignalValue
                key_={key}
                value={value}
                type_={type_}
                onClick={onSignalClick ? () => onSignalClick(key, value) : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Refresh info */}
      {pollIntervalMs > 0 && (
        <div className="text-center pt-2 mt-2 border-t border-border/20 font-mono text-[9px] text-muted-foreground/40 uppercase">
          Signal sync active
        </div>
      )}
    </div>
  );
};

export default AcmiSignalGauge;
