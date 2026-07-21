"use client";

import Link from "next/link";
import { useCockpitStore } from "@/store/useCockpitStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchDashboardRollup,
  updateWorkItemStatus,
  type ACMIWorkItem,
} from "@/lib/acmi-client";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function KanbanBoard() {
  const { rollup, activeTenant, setRollup } = useCockpitStore();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const safeRollup = rollup || {
    totalAgents: 0,
    activeAgents: 0,
    totalWorkItems: 0,
    activeWorkItems: 0,
    stalledWorkItems: 0,
    completedWorkItems: 0,
    pendingWorkItems: 0,
    pendingApprovals: 0,
    recentEvents: [],
    rawWorkItems: [],
  };

  const filteredWorkItems = (safeRollup.rawWorkItems || []).filter((w) => {
    if (activeTenant === "all") return true;
    const titleLower = w.title.toLowerCase();
    const idLower = w.id.toLowerCase();
    const ownerLower = (w.owner || "").toLowerCase();
    return (
      titleLower.includes(activeTenant) ||
      idLower.includes(activeTenant) ||
      ownerLower.includes(activeTenant)
    );
  });

  const backlogItems = filteredWorkItems.filter(
    (w) => w.status === "pending" || w.id.includes("web3")
  );
  const activeItems = filteredWorkItems.filter(
    (w) => w.status === "active" && !w.id.includes("web3")
  );
  const stalledItems = filteredWorkItems.filter((w) => w.status === "stalled");
  const completedItems = filteredWorkItems.filter((w) => w.status === "completed");

  const refreshRollup = async () => {
    try {
      const data = await fetchDashboardRollup();
      setRollup(data);
    } catch (err) {
      console.error("Failed to refresh rollup after status change", err);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    setActioningId(id);
    try {
      const ok = await updateWorkItemStatus(id, status);
      if (!ok) {
        alert(`Failed to update work item ${id} → ${status}`);
        return;
      }
      await refreshRollup();
    } finally {
      setActioningId(null);
    }
  };

  const renderKanbanCard = (w: ACMIWorkItem, column: "backlog" | "active" | "stalled" | "completed") => {
    const isAntigravity = w.owner?.toLowerCase().includes("antigravity");
    const busy = actioningId === w.id;
    return (
      <div
        key={w.id}
        className={cn(
          "group min-w-0 rounded-md border border-border bg-card p-2.5",
          isAntigravity && "border-primary bg-primary/5"
        )}
      >
        <Link
          href={`/workflows/${encodeURIComponent(w.id)}`}
          className="block min-w-0 cursor-pointer hover:opacity-90"
        >
          <div className="mb-1 flex min-w-0 items-center justify-between gap-1">
            <span className="min-w-0 flex-1 break-all font-mono text-[9px] font-bold uppercase tracking-wider text-foreground">
              {w.id}
            </span>
            {isAntigravity && (
              <span className="font-mono text-[8px] bg-primary text-primary-foreground px-1 tracking-wider rounded-[2px]">
                [antigravity]
              </span>
            )}
          </div>
          <p className="mb-1 line-clamp-3 min-w-0 break-words text-xs font-medium text-foreground">
            {w.title}
          </p>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-1 font-mono text-[9px] text-muted-foreground">
            <span className="shrink-0">Progress: {w.progress}%</span>
            <span className="min-w-0 max-w-full break-all">
              Owner: {w.owner?.replace("agent:", "") || "unassigned"}
            </span>
          </div>
        </Link>

        {/* Real ACMI status actions — proven updateWorkItemStatus path */}
        <div
          className="mt-2 flex flex-wrap gap-1 border-t border-border/40 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          {column === "backlog" && (
            <Button
              type="button"
              size="xs"
              className="font-mono text-[8px] uppercase h-6 cursor-pointer"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleStatus(w.id, "active");
              }}
            >
              {busy ? "…" : "Start"}
            </Button>
          )}
          {column === "active" && (
            <Button
              type="button"
              size="xs"
              className="font-mono text-[8px] uppercase h-6 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleStatus(w.id, "completed");
              }}
            >
              {busy ? "…" : "Complete"}
            </Button>
          )}
          {column === "stalled" && (
            <Button
              type="button"
              size="xs"
              className="font-mono text-[8px] uppercase h-6 cursor-pointer"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleStatus(w.id, "active");
              }}
            >
              {busy ? "…" : "Escalate"}
            </Button>
          )}
          <Link
            href={`/workflows/${encodeURIComponent(w.id)}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-6 items-center rounded-md border border-border bg-background px-2 font-mono text-[8px] uppercase tracking-wide text-foreground hover:bg-muted cursor-pointer"
          >
            Open
          </Link>
        </div>
      </div>
    );
  };

  return (
    <Card className="min-w-0 border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex min-w-0 flex-wrap items-center justify-between gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="break-words">[Workflow Kanban Lifecycle Stages]</span>
          <span className="shrink-0 font-mono text-[9px] font-normal text-muted-foreground/70 normal-case tracking-normal">
            Open · Start / Complete / Escalate
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex w-full min-w-0 gap-3 lg:grid lg:grid-cols-4">
            <div className="w-[260px] shrink-0 space-y-3 rounded-lg border border-border bg-muted/30 p-3 lg:w-auto lg:min-w-0">
              <div className="border-b border-border pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                  [01] Backlog
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 font-mono uppercase bg-muted text-foreground border-border rounded-none tracking-wider shadow-none"
                >
                  {backlogItems.length} items
                </Badge>
              </div>
              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-2">
                  {backlogItems.slice(0, 10).map((w) => renderKanbanCard(w, "backlog"))}
                  {backlogItems.length === 0 && (
                    <div className="text-[10px] font-mono text-muted-foreground/40 text-center py-4">
                      No items in Backlog
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="w-[260px] shrink-0 space-y-3 rounded-lg border border-border bg-muted/30 p-3 lg:w-auto lg:min-w-0">
              <div className="border-b border-border pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                  [02] Active
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 font-mono uppercase bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-none tracking-wider shadow-none"
                >
                  {activeItems.length} items
                </Badge>
              </div>
              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-2">
                  {activeItems.slice(0, 10).map((w) => renderKanbanCard(w, "active"))}
                  {activeItems.length === 0 && (
                    <div className="text-[10px] font-mono text-muted-foreground/40 text-center py-4">
                      No active items
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="w-[260px] shrink-0 space-y-3 rounded-lg border border-border bg-muted/30 p-3 lg:w-auto lg:min-w-0">
              <div className="border-b border-border pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                  [03] Stalled
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 font-mono uppercase bg-destructive/10 text-destructive border-destructive/20 rounded-none tracking-wider shadow-none"
                >
                  {stalledItems.length} items
                </Badge>
              </div>
              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-2">
                  {stalledItems.slice(0, 10).map((w) => renderKanbanCard(w, "stalled"))}
                  {stalledItems.length === 0 && (
                    <div className="text-[10px] font-mono text-muted-foreground/40 text-center py-4">
                      No stalled items
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="w-[260px] shrink-0 space-y-3 rounded-lg border border-border bg-muted/30 p-3 lg:w-auto lg:min-w-0">
              <div className="border-b border-border pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                  [04] Completed
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 font-mono uppercase bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-none tracking-wider shadow-none"
                >
                  {completedItems.length} items
                </Badge>
              </div>
              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-2">
                  {completedItems.slice(0, 10).map((w) => renderKanbanCard(w, "completed"))}
                  {completedItems.length === 0 && (
                    <div className="text-[10px] font-mono text-muted-foreground/40 text-center py-4">
                      No completed items
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
