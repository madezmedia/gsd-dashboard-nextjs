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
        "border border-border bg-card rounded-md hover:border-primary/40 transition-all shadow-none overflow-hidden relative flex flex-col justify-between p-5 min-h-[130px] pb-5",
        variant === "danger" && "border-destructive/30 bg-destructive/[0.02]",
        variant === "warning" && "border-amber-500/30 bg-amber-500/[0.02]"
      )}
    >
      {variant === "danger" && <div className="absolute top-0 left-0 right-0 h-[2px] bg-destructive" />}
      {variant === "warning" && <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500" />}
      {variant === "success" && <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />}
      
      <div className="flex flex-row items-center justify-between w-full pb-1">
        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{title}</span>
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            variant === "success" && "text-emerald-500",
            variant === "warning" && "text-amber-500",
            variant === "danger" && "text-destructive",
            variant === "default" && "text-muted-foreground/40"
          )}
        />
      </div>
      <div className="flex-1 flex flex-col justify-end mt-2">
        <div className="text-2xl font-serif font-bold text-foreground leading-none">{value}</div>
        {description && (
          <p className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-tight mt-1.5 pb-1">
            {description}
          </p>
        )}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
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
        description="Require Operator review"
        variant={urgentCount > 0 ? "warning" : "default"}
      />
    </div>
  );
}
