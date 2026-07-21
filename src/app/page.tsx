"use client";

/**
 * Command Center — legacy system (full sidebar + real ACMI components).
 * No parallel GSD rebuild on home; polish is CSS/UX only.
 */
import { useCockpitStore } from "@/store/useCockpitStore";
import { useCockpitData } from "@/hooks/useCockpitData";
import { CockpitHeader } from "@/components/dashboard/CockpitHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { OperationsBoard } from "@/components/dashboard/OperationsBoard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { GatewayServices } from "@/components/dashboard/GatewayServices";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { RefreshCw } from "lucide-react";

export default function CockpitDashboard() {
  const { handleForceSync, handleResolveHitl } = useCockpitData();
  const rollup = useCockpitStore((state) => state.rollup);

  if (!rollup) {
    return (
      <div className="cockpit-page flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase animate-pulse">
          Establishing link with Fleet Command...
        </p>
      </div>
    );
  }

  return (
    <div className="cockpit-page w-full space-y-5 md:space-y-6">
      <CockpitHeader handleForceSync={handleForceSync} />
      <KpiGrid />
      <OperationsBoard handleResolveHitl={handleResolveHitl} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6 min-w-0">
        <div className="xl:col-span-2 min-w-0">
          <ActivityFeed />
        </div>
        <div className="min-w-0">
          <GatewayServices handleResolveHitl={handleResolveHitl} />
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
}
