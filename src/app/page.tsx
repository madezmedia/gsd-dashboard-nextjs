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
  Check,
  Copy,
  FileText,
  AlertTriangle,
  Terminal,
  Layers
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
  variant?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <Card className={cn(
      "border bg-card rounded-2xl hover:border-primary/40 transition-all shadow-md overflow-hidden relative",
      variant === "danger" && "border-red-500/30 bg-red-500/[0.02]"
    )}>
      {variant === "danger" && <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500" />}
      {variant === "warning" && <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F2C94C]" />}
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{title}</span>
        <Icon
          className={cn(
            "h-4 w-4",
            variant === "success" && "text-primary",
            variant === "warning" && "text-[#F2C94C]",
            variant === "danger" && "text-red-500",
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

  // Multi-tenant selection filter state
  const [activeTenant, setActiveTenant] = useState<"all" | "madez" | "duane" | "suzanne" | "avery">("all");

  // Copy helper text state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

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

  const triggerDocsDrawer = () => {
    window.dispatchEvent(new CustomEvent("toggle-docs-drawer"));
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

  // Filter components based on current activeTenant selection
  const filteredWorkItems = (safeRollup.rawWorkItems || []).filter((w) => {
    if (activeTenant === "all") return true;
    const titleLower = w.title.toLowerCase();
    const idLower = w.id.toLowerCase();
    const ownerLower = (w.owner || "").toLowerCase();
    return titleLower.includes(activeTenant) || idLower.includes(activeTenant) || ownerLower.includes(activeTenant);
  });

  const filteredServices = services.filter((s) => {
    if (activeTenant === "all") return true;
    const slugLower = s.slug.toLowerCase();
    const nameLower = s.name.toLowerCase();
    return slugLower.includes(activeTenant) || nameLower.includes(activeTenant);
  });

  const filteredHitlQueue = hitlQueue.filter((h) => {
    if (activeTenant === "all") return true;
    const summaryLower = h.summary.toLowerCase();
    const memberLower = h.member.toLowerCase();
    return summaryLower.includes(activeTenant) || memberLower.includes(activeTenant);
  });

  const filteredBusEvents = busEvents.filter((e) => {
    if (activeTenant === "all") return true;
    const sourceLower = e.source.toLowerCase();
    const payloadStr = JSON.stringify(e.payload || {}).toLowerCase();
    return sourceLower.includes(activeTenant) || payloadStr.includes(activeTenant);
  });

  const topTicket = filteredHitlQueue[0];
  const urgentCount = filteredHitlQueue.length + (safeRollup.stalledWorkItems || 0);

  return (
    <div className="w-full space-y-6">
      {/* v3 Design Command Header */}
      <header className="relative border border-border bg-card p-5 rounded-2xl flex flex-col gap-4 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-2xl" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif flex items-center gap-2">
              Fleet <span className="text-primary italic font-light font-sans">Command Cockpit</span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">
              ACMI Swarm Operations Center & Multi-Tenant Integration Console
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-8 cursor-pointer"
              onClick={triggerDocsDrawer}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Quick Docs & Notes
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-8 cursor-pointer"
              onClick={handleForceSync}
              disabled={forcingSync}
            >
              <RefreshCw className={cn("h-3 w-3 mr-1.5", (forcingSync || syncStatus === "syncing") && "animate-spin")} />
              {forcingSync ? "Syncing..." : "Sync State"}
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
        </div>

        {/* Tenant selector buttons */}
        <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-muted-foreground uppercase mr-2 flex items-center gap-1">
              <Layers className="h-3 w-3" /> Scope:
            </span>
            {(["all", "madez", "duane", "suzanne", "avery"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTenant(t)}
                className={cn(
                  "px-3 py-1 text-[9px] font-mono border uppercase tracking-wider transition-all",
                  activeTenant === t
                    ? "border-primary text-primary bg-primary/5 font-bold"
                    : "border-border text-muted-foreground hover:text-foreground bg-secondary/50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="text-[9px] font-mono text-muted-foreground uppercase">
            Active Tenant context: <strong className="text-foreground">{activeTenant}</strong>
          </span>
        </div>
      </header>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Swarms"
          value={safeRollup.totalAgents}
          icon={Bot}
          description="Registered profiles"
        />
        <KpiCard
          title="Active Agents"
          value={safeRollup.activeAgents}
          icon={Activity}
          description="Heartbeat observed"
          variant="success"
        />
        <KpiCard
          title="Microservices"
          value={`${filteredServices.filter(s => s.verified_at ? (mountedTime - Number(s.verified_at) < 86400000) : false).length}/${filteredServices.length}`}
          icon={Server}
          description="Scope verified online"
          variant="success"
        />
        <KpiCard
          title="Work Registry"
          value={`${filteredWorkItems.filter(w => w.status === "active").length}/${filteredWorkItems.length}`}
          icon={Workflow}
          description="Active / scope items"
        />
        <KpiCard
          title="Urgent Tasks"
          value={urgentCount}
          icon={CheckCircle2}
          description="Require Operator review"
          variant={urgentCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* URGENT FIRST section matching OpenDesign concept */}
      {urgentCount > 0 && (
        <Card className="border-red-500/20 bg-red-500/[0.01] rounded-2xl shadow-md overflow-hidden">
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Urgent Operations Board ({urgentCount} alerts)
            </span>
            <span className="text-[8px] font-mono text-red-500 bg-red-500/15 px-2 py-0.5 uppercase font-bold">
              Immediate Operator Review Needed
            </span>
          </div>
          <CardContent className="p-4 space-y-3">
            {/* Display active HITL queue items */}
            {filteredHitlQueue.map((ticket, index) => (
              <div key={`urgent-hitl-${index}`} className="border border-red-500/10 bg-[#faf9f5] dark:bg-[#1a1b1d] p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#F2C94C] text-[#0F2A2E] text-[8px] uppercase tracking-wide font-mono rounded-none">
                      hitl-escalation
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{ticket.member}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">{formatRelativeTime(ticket.ts)}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground mt-1.5 font-mono bg-secondary/50 p-2 border border-border/60">
                    {ticket.summary}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleResolveHitl(ticket, "approve")}
                    disabled={actioningMember === ticket.member}
                    className="bg-primary hover:bg-primary-hover text-[#0F2A2E] font-mono text-[9px] uppercase px-3"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveHitl(ticket, "reject")}
                    disabled={actioningMember === ticket.member}
                    className="border-border text-foreground hover:bg-secondary font-mono text-[9px] uppercase px-3"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}

            {/* Display stalled work items */}
            {filteredWorkItems.filter(w => w.status === "stalled").map((w) => (
              <div key={w.id} className="border border-red-500/15 bg-[#faf9f5] dark:bg-[#1a1b1d] p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500 text-white text-[8px] uppercase font-mono rounded-none">
                      stalled-job
                    </Badge>
                    <span className="text-[10px] font-mono font-bold text-primary uppercase">{w.id}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">OWNER: {w.owner || "unassigned"}</span>
                  </div>
                  <p className="text-xs text-foreground font-sans font-semibold mt-1">
                    {w.title}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[9px] font-mono border-border uppercase"
                    onClick={() => handleCopyText(w.id, `copy-stalled-${w.id}`)}
                  >
                    {copiedId === `copy-stalled-${w.id}` ? "Copied" : "Copy ID"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Log timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card rounded-2xl shadow-md">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>[Console Activity Log Stream]</span>
                <Badge className="bg-primary text-primary-foreground rounded-none font-mono text-[9px] py-0">
                  {safeRollup.recentEvents.length + filteredBusEvents.length} events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ScrollArea className="h-[320px] pr-2">
                <div className="space-y-1 font-mono text-[11px] leading-relaxed">
                  {/* Bus events */}
                  {filteredBusEvents.map((evt, i) => {
                    const payloadObj = evt.payload as any;
                    return (
                      <div key={`bus-${i}`} className="flex gap-2 py-1 border-b border-border/40 last:border-0 text-[#7DB8FF] items-center justify-between">
                        <div className="flex gap-2 min-w-0 flex-1 items-center">
                          <span className="shrink-0 font-bold text-muted-foreground/60">[{new Date(evt.ts).toLocaleTimeString()}]</span>
                          <span className="shrink-0 text-primary font-bold">{evt.source}</span>
                          <span className="truncate text-foreground font-mono">{String(payloadObj?.summary || evt.type)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {payloadObj?.correlationId && (
                            <button
                              onClick={() => handleCopyText(payloadObj.correlationId, `copy-${i}`)}
                              className="text-[8px] border border-border px-1 text-muted-foreground hover:text-foreground"
                            >
                              {copiedId === `copy-${i}` ? "Copied" : "ID"}
                            </button>
                          )}
                          <Badge variant="outline" className="text-[8px] rounded-none px-1 border-primary/20 text-primary bg-primary/5 py-0 leading-none h-4">
                            bus
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Historical events */}
                  {safeRollup.recentEvents.map((evt) => (
                    <div key={evt.id} className="flex gap-2 py-1 border-b border-border/40 last:border-0 text-foreground/80 justify-between items-center">
                      <div className="flex gap-2 min-w-0 flex-1">
                        <span className="shrink-0 text-muted-foreground/50">[{evt.ts ? new Date(evt.ts).toLocaleTimeString() : ""}]</span>
                        <span className="shrink-0 font-bold text-primary">{evt.source}</span>
                        <span className="truncate">{evt.summary}</span>
                      </div>
                      <Badge variant="outline" className="text-[8px] rounded-none px-1 border-border text-muted-foreground bg-secondary py-0 leading-none h-4 shrink-0">
                        {evt.kind}
                      </Badge>
                    </div>
                  ))}

                  {safeRollup.recentEvents.length === 0 && filteredBusEvents.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground/40">No activity observed in active tenant scope</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Direct details & microservices status */}
        <div className="space-y-6">
          <Card className="border border-border bg-card rounded-2xl shadow-md">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center justify-between text-muted-foreground">
                <span>[Swarm Gateway Actions]</span>
                <span className="text-[8px] text-muted-foreground/40 font-mono">Operations Command</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <div className="p-3 bg-secondary/80 border border-border rounded-sm font-mono text-[10px] space-y-2">
                <p className="font-bold text-foreground uppercase flex items-center gap-1">
                  <Terminal className="h-3 w-3" /> Quick Diagnostic Cmd:
                </p>
                <div className="bg-[#1a1b1d] text-white p-2 rounded-sm select-all flex justify-between items-center overflow-x-auto text-[9px]">
                  <code>curl -s http://152.53.201.27:7780/health</code>
                  <button
                    onClick={() => handleCopyText("curl -s http://152.53.201.27:7780/health", "copy-curl")}
                    className="ml-2 hover:text-primary transition-colors text-white/60 shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {topTicket ? (
                <div className="space-y-3 border border-border p-3 rounded-xl bg-secondary/40">
                  <span className="font-mono text-[9px] text-muted-foreground uppercase font-bold tracking-wide">
                    Actioning ticket:
                  </span>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                      <span>Agent: {topTicket.member}</span>
                      <span>{formatRelativeTime(topTicket.ts)}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground bg-[#faf9f5] dark:bg-card p-2 border border-border font-sans leading-relaxed">
                      {topTicket.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Add resolution instruction..."
                      className="bg-[#faf9f5] dark:bg-[#151617] border-border text-xs h-8 rounded-none font-mono"
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      disabled={actioningMember === topTicket.member}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary-hover text-[#0F2A2E] font-mono text-[10px] uppercase h-8 rounded-none"
                      onClick={() => handleResolveHitl(topTicket, "approve")}
                      disabled={actioningMember === topTicket.member}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-border text-foreground hover:bg-secondary font-mono text-[10px] uppercase h-8 rounded-none"
                      onClick={() => handleResolveHitl(topTicket, "reject")}
                      disabled={actioningMember === topTicket.member}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-2 border border-dashed border-border rounded-xl">
                  <ShieldCheck className="h-8 w-8 text-primary/30 mx-auto animate-pulse" />
                  <p className="font-mono text-[9px] text-primary uppercase tracking-widest">
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
                  {filteredServices.length} metrics
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                {filteredServices.slice(0, 8).map((svc) => {
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
                    {filteredWorkItems.filter((w) => w.status === "pending" || w.id.includes("web3")).length} items
                  </Badge>
                </div>
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {filteredWorkItems
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
                    {filteredWorkItems.filter((w) => w.status === "pending" || w.id.includes("web3")).length === 0 && (
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
                    {filteredWorkItems.filter((w) => w.status === "active" && !w.id.includes("web3")).length} items
                  </Badge>
                </div>
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {filteredWorkItems
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
                    {filteredWorkItems.filter((w) => w.status === "active" && !w.id.includes("web3")).length === 0 && (
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
                    {filteredWorkItems.filter((w) => w.status === "stalled").length} items
                  </Badge>
                </div>
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {filteredWorkItems
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
                    {filteredWorkItems.filter((w) => w.status === "stalled").length === 0 && (
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
                    {filteredWorkItems.filter((w) => w.status === "completed").length} items
                  </Badge>
                </div>
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {filteredWorkItems
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
                    {filteredWorkItems.filter((w) => w.status === "completed").length === 0 && (
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
