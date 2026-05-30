"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, Workflow, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchDashboardRollup, type ACMIDashboardRollup, type ACMIEvent } from "@/lib/acmi-client";
import { busStream, type BusEvent } from "@/lib/bus-stream";
import { cn } from "@/lib/utils";

function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "success" | "warning";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={`h-4 w-4 ${
            variant === "success"
              ? "text-green-600"
              : variant === "warning"
              ? "text-amber-600"
              : "text-muted-foreground"
          }`}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function EventItem({ event }: { event: ACMIEvent }) {
  const kindColors: Record<string, string> = {
    "handoff-complete": "bg-[#2d4a3e]",
    "step-done": "bg-[#2d4a3e]",
    decision: "bg-[#c4903a]",
    "signal-update": "bg-amber-500",
    "work-progress": "bg-[#2d4a3e]/60",
  };

  return (
    <div className="flex gap-3 py-2 border-b last:border-0">
      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${kindColors[event.kind] || "bg-gray-400"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{event.source}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {event.kind}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{event.summary}</p>
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const [rollup, setRollup] = useState<ACMIDashboardRollup | null>(null);
  const [busEvents, setBusEvents] = useState<BusEvent[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "stalled">("idle");

  useEffect(() => {
    let active = true;

    const loadData = () => {
      setSyncStatus("syncing");
      fetchDashboardRollup()
        .then((data) => {
          if (!active) return;
          setRollup(data);
          setSyncStatus("idle");
        })
        .catch((err) => {
          if (!active) return;
          console.error("Failed to fetch dashboard rollup:", err);
          setSyncStatus("stalled");
        });
    };

    // Initial load
    loadData();

    // 5-second polling interval
    const interval = setInterval(loadData, 5000);

    const unsubscribe = busStream.subscribe((event) => {
      setBusEvents((prev) => [event, ...prev].slice(0, 20));
    });

    return () => {
      active = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (!rollup) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-xs uppercase animate-pulse text-[#1a1a1a]/60">
        Extracting CommandCenter context...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-[#1a1a1a]/15 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight uppercase font-mono text-[#1a1a1a]">
            Command Center
          </h1>
          <p className="text-xs font-mono text-[#1a1a1a]/60">
            Fleet-wide status overview and real-time activity.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase bg-[#f4f2eb] px-3 py-1 border border-[#1a1a1a]/10">
          <RefreshCw className={cn("h-3 w-3", syncStatus === "syncing" && "animate-spin text-[#2d4a3e]", syncStatus === "stalled" && "text-[#c4903a]")} />
          {syncStatus === "syncing" && <span className="text-[#2d4a3e] font-bold">[SYNCING...]</span>}
          {syncStatus === "stalled" && <span className="text-[#c4903a] font-bold">[SYNC STALLED]</span>}
          {syncStatus === "idle" && <span className="text-[#1a1a1a]/40">[SYNCED]</span>}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Agents"
          value={rollup.totalAgents}
          icon={Bot}
          description="ACMI fleet agents"
        />
        <KpiCard
          title="Active Agents"
          value={rollup.activeAgents}
          icon={Activity}
          description="Currently online"
          variant="success"
        />
        <KpiCard
          title="Work Items"
          value={rollup.totalWorkItems}
          icon={Workflow}
          description="Total tracked items"
        />
        <KpiCard
          title="Active Items"
          value={rollup.activeWorkItems}
          icon={AlertTriangle}
          description="In progress"
          variant="warning"
        />
        <KpiCard
          title="Approvals"
          value={rollup.pendingApprovals}
          icon={CheckCircle2}
          description="Pending review"
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Fleet Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {rollup.recentEvents.map((evt) => (
                <EventItem key={evt.id} event={evt} />
              ))}
              {busEvents.length > 0 && (
                <>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Live Bus Events</p>
                    {busEvents.map((evt, i) => (
                      <div key={`bus-${i}`} className="flex gap-3 py-1.5 border-b last:border-0 text-xs">
                        <span className="text-blue-500 font-medium">{evt.source}</span>
                        <span className="text-muted-foreground">{String(evt.payload?.summary || evt.type)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Agent Distribution</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Active</span>
                  <span className="font-medium text-green-600">{rollup.activeAgents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Idle</span>
                  <span className="font-medium text-amber-600">32</span>
                </div>
                <div className="flex justify-between">
                  <span>Busy</span>
                  <span className="font-medium text-blue-600">18</span>
                </div>
                <div className="flex justify-between">
                  <span>Offline</span>
                  <span className="font-medium text-muted-foreground">8</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Workflow Status</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Active</span>
                  <span className="font-medium text-blue-600">{rollup.activeWorkItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stalled</span>
                  <span className="font-medium text-[#c4903a]">{rollup.stalledWorkItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-medium text-green-600">{rollup.completedWorkItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending</span>
                  <span className="font-medium text-amber-600">{rollup.pendingWorkItems}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Pipeline Flow Cockpit */}
      <Card className="border-[#1a1a1a]/15 bg-[#f4f2eb] rounded-none">
        <CardHeader className="border-b border-[#1a1a1a]/10 pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-[#2d4a3e] flex items-center justify-between">
            <span>[Business Pipeline Flow Cockpit]</span>
            <span className="text-[10px] text-[#1a1a1a]/60 lowercase normal-case font-normal font-mono">Live lifecycle stage tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stage 1: Ideation & Backlog */}
            <div className="border border-[#1a1a1a]/10 bg-[#faf9f5] p-3 space-y-3">
              <div className="border-b border-[#1a1a1a]/10 pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#1a1a1a] uppercase">[01] Backlog</span>
                <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-[#c4903a]/10 text-[#c4903a] border-[#c4903a]/20 rounded-none">
                  {rollup.pendingWorkItems} items
                </Badge>
              </div>
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {(rollup.rawWorkItems || [])
                    .filter((w) => w.status === "pending" || w.id.includes("web3"))
                    .slice(0, 10)
                    .map((w) => (
                      <div key={w.id} className={cn("border p-2 bg-[#f4f2eb] border-[#1a1a1a]/10 rounded-none", w.owner?.toLowerCase().includes("antigravity") && "border-[#2d4a3e] bg-[#2d4a3e]/5")}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[9px] font-bold truncate text-[#2d4a3e] uppercase">{w.id}</span>
                          {w.owner?.toLowerCase().includes("antigravity") && (
                            <span className="font-mono text-[8px] bg-[#2d4a3e] text-[#faf9f5] px-1">[antigravity]</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#1a1a1a] mb-1 line-clamp-2">{w.title}</p>
                        <div className="flex justify-between items-center text-[9px] text-[#1a1a1a]/60 font-mono">
                          <span>Progress: {w.progress}%</span>
                          <span className="truncate max-w-[80px]">Owner: {w.owner?.replace("agent:", "") || "unassigned"}</span>
                        </div>
                      </div>
                    ))}
                  {(rollup.rawWorkItems || []).filter((w) => w.status === "pending" || w.id.includes("web3")).length === 0 && (
                    <div className="text-[10px] font-mono text-[#1a1a1a]/40 text-center py-4">No items in Backlog</div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Stage 2: Active Development */}
            <div className="border border-[#1a1a1a]/10 bg-[#faf9f5] p-3 space-y-3">
              <div className="border-b border-[#1a1a1a]/10 pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#1a1a1a] uppercase">[02] Active</span>
                <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-[#2d4a3e]/10 text-[#2d4a3e] border-[#2d4a3e]/20 rounded-none">
                  {rollup.activeWorkItems} items
                </Badge>
              </div>
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {(rollup.rawWorkItems || [])
                    .filter((w) => w.status === "active" && !w.id.includes("web3"))
                    .slice(0, 10)
                    .map((w) => (
                      <div key={w.id} className={cn("border p-2 bg-[#f4f2eb] border-[#1a1a1a]/10 rounded-none", w.owner?.toLowerCase().includes("antigravity") && "border-[#2d4a3e] bg-[#2d4a3e]/5")}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[9px] font-bold truncate text-[#2d4a3e] uppercase">{w.id}</span>
                          {w.owner?.toLowerCase().includes("antigravity") && (
                            <span className="font-mono text-[8px] bg-[#2d4a3e] text-[#faf9f5] px-1">[antigravity]</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#1a1a1a] mb-1 line-clamp-2">{w.title}</p>
                        <div className="flex justify-between items-center text-[9px] text-[#1a1a1a]/60 font-mono">
                          <span>Progress: {w.progress}%</span>
                          <span className="truncate max-w-[80px]">Owner: {w.owner?.replace("agent:", "") || "unassigned"}</span>
                        </div>
                      </div>
                    ))}
                  {(rollup.rawWorkItems || []).filter((w) => w.status === "active" && !w.id.includes("web3")).length === 0 && (
                    <div className="text-[10px] font-mono text-[#1a1a1a]/40 text-center py-4">No active items</div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Stage 3: Operational Review & Stalled */}
            <div className="border border-[#1a1a1a]/10 bg-[#faf9f5] p-3 space-y-3">
              <div className="border-b border-[#1a1a1a]/10 pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#1a1a1a] uppercase">[03] Stalled</span>
                <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-amber-600/10 text-amber-600 border-amber-600/20 rounded-none">
                  {rollup.stalledWorkItems} items
                </Badge>
              </div>
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {(rollup.rawWorkItems || [])
                    .filter((w) => w.status === "stalled")
                    .slice(0, 10)
                    .map((w) => (
                      <div key={w.id} className={cn("border p-2 bg-[#f4f2eb] border-[#1a1a1a]/10 rounded-none", w.owner?.toLowerCase().includes("antigravity") && "border-[#2d4a3e] bg-[#2d4a3e]/5")}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[9px] font-bold truncate text-[#2d4a3e] uppercase">{w.id}</span>
                          {w.owner?.toLowerCase().includes("antigravity") && (
                            <span className="font-mono text-[8px] bg-[#2d4a3e] text-[#faf9f5] px-1">[antigravity]</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#1a1a1a] mb-1 line-clamp-2">{w.title}</p>
                        <div className="flex justify-between items-center text-[9px] text-[#1a1a1a]/60 font-mono">
                          <span>Progress: {w.progress}%</span>
                          <span className="truncate max-w-[80px]">Owner: {w.owner?.replace("agent:", "") || "unassigned"}</span>
                        </div>
                      </div>
                    ))}
                  {(rollup.rawWorkItems || []).filter((w) => w.status === "stalled").length === 0 && (
                    <div className="text-[10px] font-mono text-[#1a1a1a]/40 text-center py-4">No stalled items</div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Stage 4: Production & Live */}
            <div className="border border-[#1a1a1a]/10 bg-[#faf9f5] p-3 space-y-3">
              <div className="border-b border-[#1a1a1a]/10 pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#1a1a1a] uppercase">[04] Completed</span>
                <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-[#2d4a3e]/10 text-[#2d4a3e] border-[#2d4a3e]/20 rounded-none">
                  {rollup.completedWorkItems} items
                </Badge>
              </div>
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {(rollup.rawWorkItems || [])
                    .filter((w) => w.status === "completed")
                    .slice(0, 10)
                    .map((w) => (
                      <div key={w.id} className={cn("border p-2 bg-[#f4f2eb] border-[#1a1a1a]/10 rounded-none", w.owner?.toLowerCase().includes("antigravity") && "border-[#2d4a3e] bg-[#2d4a3e]/5")}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[9px] font-bold truncate text-[#2d4a3e] uppercase">{w.id}</span>
                          {w.owner?.toLowerCase().includes("antigravity") && (
                            <span className="font-mono text-[8px] bg-[#2d4a3e] text-[#faf9f5] px-1">[antigravity]</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#1a1a1a] mb-1 line-clamp-2">{w.title}</p>
                        <div className="flex justify-between items-center text-[9px] text-[#1a1a1a]/60 font-mono">
                          <span>Progress: {w.progress}%</span>
                          <span className="truncate max-w-[80px]">Owner: {w.owner?.replace("agent:", "") || "unassigned"}</span>
                        </div>
                      </div>
                    ))}
                  {(rollup.rawWorkItems || []).filter((w) => w.status === "completed").length === 0 && (
                    <div className="text-[10px] font-mono text-[#1a1a1a]/40 text-center py-4">No completed items</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
