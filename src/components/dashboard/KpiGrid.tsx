import { useState } from "react";
import { useCockpitStore } from "@/store/useCockpitStore";
import { Card } from "@/components/ui/card";
import { Activity, Bot, Workflow, Server, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

function KpiCard({ title, value, icon: Icon, description, variant = "default" }: KpiCardProps) {
  return (
    <Card
      className={cn(
        "relative min-h-[112px] justify-between border border-border bg-card p-4 shadow-none transition-colors hover:border-primary/40",
        variant === "danger" && "border-destructive/40 bg-destructive/5",
        variant === "warning" && "border-amber-500/40 bg-amber-500/5"
      )}
    >
      {variant === "danger" && <div className="absolute top-0 right-0 left-0 h-0.5 bg-destructive" />}
      {variant === "warning" && <div className="absolute top-0 right-0 left-0 h-0.5 bg-amber-500" />}
      {variant === "success" && <div className="absolute top-0 right-0 left-0 h-0.5 bg-emerald-500" />}

      <div className="flex w-full min-w-0 flex-row items-start justify-between gap-2 pb-1">
        <span className="min-w-0 flex-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground break-words">
          {title}
        </span>
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            variant === "success" && "text-emerald-500",
            variant === "warning" && "text-amber-500",
            variant === "danger" && "text-destructive",
            variant === "default" && "text-muted-foreground/50"
          )}
        />
      </div>
      <div className="mt-2 flex min-w-0 flex-1 flex-col justify-end">
        <div className="break-all font-serif text-2xl font-bold leading-none text-foreground">
          {value}
        </div>
        {description ? (
          <p className="mt-2 break-words pb-0.5 font-mono text-[9px] uppercase tracking-tight text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export function KpiGrid() {
  const { rollup, services, activeTenant } = useCockpitStore();

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

  // Filtering logs/services based on current activeTenant selection
  const filteredServices = services.filter((s) => {
    if (activeTenant === "all") return true;
    const slugLower = s.slug.toLowerCase();
    const nameLower = s.name.toLowerCase();
    return slugLower.includes(activeTenant) || nameLower.includes(activeTenant);
  });

  const filteredWorkItems = (safeRollup.rawWorkItems || []).filter((w) => {
    if (activeTenant === "all") return true;
    const titleLower = w.title.toLowerCase();
    const idLower = w.id.toLowerCase();
    const ownerLower = (w.owner || "").toLowerCase();
    return titleLower.includes(activeTenant) || idLower.includes(activeTenant) || ownerLower.includes(activeTenant);
  });

  const hitlQueue = useCockpitStore((state) => state.hitlQueue);
  const filteredHitlQueue = hitlQueue.filter((h) => {
    if (activeTenant === "all") return true;
    const summaryLower = h.summary.toLowerCase();
    const memberLower = h.member.toLowerCase();
    return summaryLower.includes(activeTenant) || memberLower.includes(activeTenant);
  });

  const urgentCount = filteredHitlQueue.length + (safeRollup.stalledWorkItems || 0);
  const [mountedTime] = useState(() => Date.now());

  const activeServicesCount = filteredServices.filter((s) =>
    s.verified_at ? (mountedTime - Number(s.verified_at) < 86400000) : false
  ).length;

  return (
    <div className="gsd-kpi-grid w-full min-w-0">
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
        value={`${activeServicesCount}/${filteredServices.length}`}
        icon={Server}
        description="Scope verified online"
        variant="success"
      />
      <KpiCard
        title="Work Registry"
        value={`${filteredWorkItems.filter((w) => w.status === "active").length}/${filteredWorkItems.length}`}
        icon={Workflow}
        description="Active / scope items"
      />
      <KpiCard
        title="Urgent Tasks"
        value={urgentCount}
        icon={CheckCircle2}
        description="HITL + stalled"
        variant={urgentCount > 0 ? "warning" : "default"}
      />
    </div>
  );
}
