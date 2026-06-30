"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Bot,
  Workflow,
  CheckCircle2,
  RefreshCw,
  Server,
  ShieldCheck,
  Ban,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  fetchDashboardRollup,
  fetchHitlQueue,
  fetchServices,
  resolveHitlTicket,
  triggerFleetSync,
  type ACMIDashboardRollup
} from "@/lib/acmi-client";
import { busStream, type BusEvent } from "@/lib/bus-stream";
import { cn } from "@/lib/utils";

interface HitlTicket {
  member: string;
  ts: number;
  id?: string;
  source?: string;
  kind?: string;
  summary: string;
  correlationId?: string;
  work_item_id?: string;
}

interface ServiceRegistry {
  slug: string;
  name: string;
  url?: string;
  internal?: string;
  role?: string;
  verified_at?: number;
  setup_at?: number;
}

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
    <Card className="border border-border bg-card rounded-2xl hover:border-primary/40 transition-all shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{title}</span>
        <Icon
          className={cn(
            "h-4 w-4",
            variant === "success" && "text-primary",
            variant === "warning" && "text-[#F2C94C]",
            variant === "default" && "text-muted-foreground/40"
          )}
        />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-serif font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-tight mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function CockpitDashboard() {
  const [rollup, setRollup] = useState<ACMIDashboardRollup | null>(null);
  const [hitlQueue, setHitlQueue] = useState<HitlTicket[]>([]);
  const [services, setServices] = useState<ServiceRegistry[]>([]);
  const [busEvents, setBusEvents] = useState<BusEvent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "stalled">("idle");
  const [forcingSync, setForcingSync] = useState(false);
  const [actioningMember, setActioningMember] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [mountedTime] = useState(() => Date.now());

  const loadData = useCallback(async () => {
    setSyncStatus("syncing");
    try {
      const [rollupData, queueData, servicesData] = await Promise.all([
        fetchDashboardRollup(),
        fetchHitlQueue(),
        fetchServices(),
      ]);

      setRollup(rollupData);
      setHitlQueue(queueData as HitlTicket[]);
      setServices(servicesData as ServiceRegistry[]);
      setSyncStatus("idle");
    } catch (err) {
      console.error("Failed to load cockpit data:", err);
      setSyncStatus("stalled");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    const interval = setInterval(loadData, 5000);

    const unsubscribe = busStream.subscribe((event) => {
      setBusEvents((prev) => [event, ...prev].slice(0, 15));
    });

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      unsubscribe();
    };
  }, [loadData]);

  const handleForceSync = async () => {
    setForcingSync(true);
    const success = await triggerFleetSync();
    if (success) {
      setTimeout(() => {
        loadData();
        setForcingSync(false);
      }, 1500);
    } else {
      setForcingSync(false);
    }
  };

  const handleResolveHitl = async (ticket: HitlTicket, action: "approve" | "reject") => {
    const member = ticket.member;
    setActioningMember(member);
    try {
      const success = await resolveHitlTicket(member, action, feedbackNote, ticket.work_item_id || ticket.id);
      if (success) {
        setFeedbackNote("");
        await loadData();
      }
    } catch (err) {
      console.error("Failed to action HITL ticket:", err);
    } finally {
      setActioningMember(null);
    }
  };

  if (loading && !rollup) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase animate-pulse">
          Establishing link with Fleet Command...
        </p>
      </div>
    );
  }

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
    rawWorkItems: []
  };

  const topTicket = hitlQueue[0];

  return (
    <div className="w-full space-y-6">
      {/* v3 Design Command Header */}
      <header className="relative border border-border bg-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-2xl" />
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif">
            Fleet <span className="text-primary italic font-light font-sans">Command Cockpit</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">
            ACMI Swarm Operations Center & Pipeline Integration Console
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-8 cursor-pointer"
            onClick={handleForceSync}
            disabled={forcingSync}
          >
            <RefreshCw className={cn("h-3 w-3 mr-1.5", (forcingSync || syncStatus === "syncing") && "animate-spin")} />
            {forcingSync ? "Syncing..." : "Force Sync State"}
          </Button>

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase bg-secondary px-3 py-1.5 border border-border tracking-wider">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              syncStatus === "syncing" && "bg-blue-500 animate-pulse",
              syncStatus === "stalled" && "bg-[#F2C94C] animate-pulse",
              syncStatus === "idle" && "bg-primary"
            )} />
            {syncStatus === "syncing" && <span className="text-blue-400 font-bold">[SYNCING]</span>}
            {syncStatus === "stalled" && <span className="text-[#F2C94C] font-bold">[STALLED]</span>}
            {syncStatus === "idle" && <span className="text-primary/60">[CONNECTED]</span>}
          </div>
        </div>
      </header>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Agents"
          value={safeRollup.totalAgents}
          icon={Bot}
          description="Registered ACMI profiles"
        />
        <KpiCard
          title="Active Swarms"
          value={safeRollup.activeAgents}
          icon={Activity}
          description="Currently online"
          variant="success"
        />
        <KpiCard
          title="Microservices"
          value={`${services.filter(s => s.verified_at ? (mountedTime - Number(s.verified_at) < 86400000) : false).length}/${services.length}`}
          icon={Server}
          description="Online infrastructure"
          variant="success"
        />
        <KpiCard
          title="Work Registry"
          value={`${safeRollup.activeWorkItems}/${safeRollup.totalWorkItems}`}
          icon={Workflow}
          description="Active / Total items"
        />
        <KpiCard
          title="HITL Approvals"
          value={hitlQueue.length}
          icon={CheckCircle2}
          description="Escalated to Operator"
          variant={hitlQueue.length > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Log timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card rounded-2xl shadow-md">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>[Console Activity Log Stream]</span>
                <Badge className="bg-primary text-primary-foreground rounded-none font-mono text-[9px] py-0">
                  {safeRollup.recentEvents.length + busEvents.length} events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ScrollArea className="h-[320px] pr-2">
                <div className="space-y-1 font-mono text-[11px] leading-relaxed">
                  {/* Bus events */}
                  {busEvents.map((evt, i) => (
                    <div key={`bus-${i}`} className="flex gap-2 py-1 border-b border-border/40 last:border-0 text-[#7DB8FF]">
                      <span className="shrink-0 font-bold">[{new Date(evt.ts).toLocaleTimeString()}]</span>
                      <span className="shrink-0 text-primary font-bold">{evt.source}</span>
                      <span className="truncate flex-1 font-mono text-foreground">{String(evt.payload?.summary || evt.type)}</span>
                      <Badge variant="outline" className="text-[8px] rounded-none px-1 border-primary/20 text-primary bg-primary/5 py-0 leading-none h-4">
                        bus
                      </Badge>
                    </div>
                  ))}
                  
                  {/* Historical events */}
                  {safeRollup.recentEvents.map((evt) => (
                    <div key={evt.id} className="flex gap-2 py-1 border-b border-border/40 last:border-0 text-foreground/80">
                      <span className="shrink-0">[{evt.ts ? new Date(evt.ts).toLocaleTimeString() : ""}]</span>
                      <span className="shrink-0 font-bold text-primary">{evt.source}</span>
                      <span className="truncate flex-1">{evt.summary}</span>
                      <Badge variant="outline" className="text-[8px] rounded-none px-1 border-border text-muted-foreground bg-secondary py-0 leading-none h-4">
                        {evt.kind}
                      </Badge>
                    </div>
                  ))}

                  {safeRollup.recentEvents.length === 0 && busEvents.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground/40">No timeline actions recorded</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: HITL direct action & services */}
        <div className="space-y-6">
          <Card className={cn(
            "border rounded-2xl transition-all shadow-md",
            topTicket ? "border-[#F2C94C]/60 bg-card/60" : "border-border bg-card"
          )}>
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center justify-between">
                <span className={topTicket ? "text-[#F2C94C] font-bold" : "text-muted-foreground"}>
                  {topTicket ? "⚠️ Operator Action Required" : "[HITL Queue Status]"}
                </span>
                {topTicket && <Badge className="bg-[#F2C94C] text-[#0F2A2E] rounded-none text-[8px] animate-pulse">escalated</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {topTicket ? (
                <div className="space-y-4">
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold">
                      <span>Agent: {topTicket.member}</span>
                      <span>{formatRelativeTime(topTicket.ts)}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground bg-secondary p-2 border border-border font-sans">
                      {topTicket.summary}
                    </p>
                    {topTicket.work_item_id && (
                      <div className="text-[9px] text-muted-foreground/60 mt-1 uppercase">
                        Work Item: {topTicket.work_item_id}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wide block">
                      Resolution Instruction/Feedback:
                    </label>
                    <Input
                      placeholder="Add execution constraints..."
                      className="bg-background border-border text-xs h-8 rounded-none font-mono"
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      disabled={actioningMember === topTicket.member}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary-hover text-[#0F2A2E] font-mono text-[10px] uppercase h-8 rounded-none cursor-pointer"
                      onClick={() => handleResolveHitl(topTicket, "approve")}
                      disabled={actioningMember === topTicket.member}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-border text-foreground hover:bg-secondary font-mono text-[10px] uppercase h-8 rounded-none cursor-pointer"
                      onClick={() => handleResolveHitl(topTicket, "reject")}
                      disabled={actioningMember === topTicket.member}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <ShieldCheck className="h-8 w-8 text-primary/30 mx-auto animate-pulse" />
                  <p className="font-mono text-[10px] text-primary uppercase tracking-widest">
                    Gatekeeper Queue Clear
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 font-mono">
                    All fleet automation tasks proceeding without intervention.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Microservices Matrix */}
          <Card className="border border-border bg-card rounded-2xl shadow-md">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>[Services Health Matrix]</span>
                <span className="text-[9px] font-mono font-normal lowercase text-muted-foreground/50">
                  {services.length} metrics
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                {services.slice(0, 8).map((svc) => {
                  const isUp = svc.verified_at ? (mountedTime - Number(svc.verified_at) < 86400000) : false;
                  return (
                    <div
                      key={svc.slug}
                      className="border border-border bg-secondary p-2 flex items-center justify-between rounded-sm"
                    >
                      <span className="truncate max-w-[90px] font-bold text-foreground/80 uppercase">
                        {svc.slug}
                      </span>
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        isUp ? "bg-primary animate-pulse" : "bg-[#FF6B6B]"
                      )} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kanban lifecycle */}
      <Card className="border border-border bg-secondary rounded-2xl shadow-md">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>[Workflow Kanban Lifecycle Stages]</span>
            <span className="text-[9px] text-muted-foreground/50 font-mono font-normal">Active pipeline tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-[1000px] lg:min-w-0 lg:grid lg:grid-cols-4 w-full">
              {/* Stage 1 */}
              <div className="border border-border bg-card p-3 space-y-3 w-[240px] shrink-0 lg:w-auto lg:shrink rounded-xl">
                <div className="border-b border-border pb-1.5 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">[01] Backlog</span>
                  <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-secondary text-primary border-border rounded-none tracking-wider">
                    {safeRollup.pendingWorkItems} items
                  </Badge>
                </div>
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {(safeRollup.rawWorkItems || [])
                      .filter((w) => w.status === "pending" || w.id.includes("web3"))
                      .slice(0, 10)
                      .map((w) => (
                        <div key={w.id} className={cn("border p-2 bg-secondary border-border rounded-sm", w.owner?.toLowerCase().includes("antigravity") && "border-primary bg-primary/5")}>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[9px] font-bold truncate text-primary uppercase tracking-wider">{w.id}</span>
                            {w.owner?.toLowerCase().includes("antigravity") && (
                              <span className="font-mono text-[8px] bg-primary text-primary-foreground px-1 tracking-wider">[antigravity]</span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-foreground mb-1 line-clamp-2">{w.title}</p>
                          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                            <span>Progress: {w.progress}%</span>
                            <span className="truncate max-w-[80px]">Owner: {w.owner?.replace("agent:", "") || "unassigned"}</span>
                          </div>
                        </div>
                      ))}
                    {(safeRollup.rawWorkItems || []).filter((w) => w.status === "pending" || w.id.includes("web3")).length === 0 && (
                      <div className="text-[10px] font-mono text-muted-foreground/40 text-center py-4">No items in Backlog</div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Stage 2 */}
              <div className="border border-border bg-card p-3 space-y-3 w-[240px] shrink-0 lg:w-auto lg:shrink rounded-xl">
                <div className="border-b border-border pb-1.5 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">[02] Active</span>
                  <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-primary/10 text-primary border-primary/20 rounded-none tracking-wider">
                    {safeRollup.activeWorkItems} items
                  </Badge>
                </div>
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {(safeRollup.rawWorkItems || [])
                      .filter((w) => w.status === "active" && !w.id.includes("web3"))
                      .slice(0, 10)
                      .map((w) => (
                        <div key={w.id} className={cn("border p-2 bg-secondary border-border rounded-sm", w.owner?.toLowerCase().includes("antigravity") && "border-primary bg-primary/5")}>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[9px] font-bold truncate text-primary uppercase tracking-wider">{w.id}</span>
                            {w.owner?.toLowerCase().includes("antigravity") && (
                              <span className="font-mono text-[8px] bg-primary text-primary-foreground px-1 tracking-wider">[antigravity]</span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-foreground mb-1 line-clamp-2">{w.title}</p>
                          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                            <span>Progress: {w.progress}%</span>
                            <span className="truncate max-w-[80px]">Owner: {w.owner?.replace("agent:", "") || "unassigned"}</span>
                          </div>
                        </div>
                      ))}
                    {(safeRollup.rawWorkItems || []).filter((w) => w.status === "active" && !w.id.includes("web3")).length === 0 && (
                      <div className="text-[10px] font-mono text-muted-foreground/40 text-center py-4">No active items</div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Stage 3 */}
              <div className="border border-border bg-card p-3 space-y-3 w-[240px] shrink-0 lg:w-auto lg:shrink rounded-xl">
                <div className="border-b border-border pb-1.5 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">[03] Stalled</span>
                  <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-amber-500/10 text-amber-400 border-amber-500/20 rounded-none tracking-wider">
                    {safeRollup.stalledWorkItems} items
                  </Badge>
                </div>
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {(safeRollup.rawWorkItems || [])
                      .filter((w) => w.status === "stalled")
                      .slice(0, 10)
                      .map((w) => (
                        <div key={w.id} className={cn("border p-2 bg-secondary border-border rounded-sm", w.owner?.toLowerCase().includes("antigravity") && "border-primary bg-primary/5")}>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[9px] font-bold truncate text-primary uppercase tracking-wider">{w.id}</span>
                            {w.owner?.toLowerCase().includes("antigravity") && (
                              <span className="font-mono text-[8px] bg-primary text-primary-foreground px-1 tracking-wider">[antigravity]</span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-foreground mb-1 line-clamp-2">{w.title}</p>
                          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                            <span>Progress: {w.progress}%</span>
                            <span className="truncate max-w-[80px]">Owner: {w.owner?.replace("agent:", "") || "unassigned"}</span>
                          </div>
                        </div>
                      ))}
                    {(safeRollup.rawWorkItems || []).filter((w) => w.status === "stalled").length === 0 && (
                      <div className="text-[10px] font-mono text-muted-foreground/40 text-center py-4">No stalled items</div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Stage 4 */}
              <div className="border border-border bg-card p-3 space-y-3 w-[240px] shrink-0 lg:w-auto lg:shrink rounded-xl">
                <div className="border-b border-border pb-1.5 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">[04] Completed</span>
                  <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-primary/10 text-primary border-primary/20 rounded-none tracking-wider">
                    {safeRollup.completedWorkItems} items
                  </Badge>
                </div>
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {(safeRollup.rawWorkItems || [])
                      .filter((w) => w.status === "completed")
                      .slice(0, 10)
                      .map((w) => (
                        <div key={w.id} className={cn("border p-2 bg-secondary border-border rounded-sm", w.owner?.toLowerCase().includes("antigravity") && "border-primary bg-primary/5")}>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[9px] font-bold truncate text-primary uppercase tracking-wider">{w.id}</span>
                            {w.owner?.toLowerCase().includes("antigravity") && (
                              <span className="font-mono text-[8px] bg-primary text-primary-foreground px-1 tracking-wider">[antigravity]</span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-foreground mb-1 line-clamp-2">{w.title}</p>
                          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                            <span>Progress: {w.progress}%</span>
                            <span className="truncate max-w-[80px]">Owner: {w.owner?.replace("agent:", "") || "unassigned"}</span>
                          </div>
                        </div>
                      ))}
                    {(safeRollup.rawWorkItems || []).filter((w) => w.status === "completed").length === 0 && (
                      <div className="text-[10px] font-mono text-muted-foreground/40 text-center py-4">No completed items</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatRelativeTime(ts: number | undefined): string {
  if (!ts) return "";
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString();
}
