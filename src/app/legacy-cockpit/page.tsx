"use client";

import { useCockpitStore } from "@/store/useCockpitStore";
import { useCockpitData } from "@/hooks/useCockpitData";
import { CockpitHeader } from "@/components/dashboard/CockpitHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { OperationsBoard } from "@/components/dashboard/OperationsBoard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { GatewayServices } from "@/components/dashboard/GatewayServices";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { RefreshCw } from "lucide-react";

/** Previous home dashboard (pre–GSD Fleet Template). */
export default function LegacyCockpitDashboard() {
  const { handleForceSync, handleResolveHitl } = useCockpitData();
  const rollup = useCockpitStore((state) => state.rollup);

  if (!rollup) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 bg-background">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase animate-pulse">
          Establishing link with Fleet Command...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <CockpitHeader handleForceSync={handleForceSync} />
      <KpiGrid />
      <OperationsBoard handleResolveHitl={handleResolveHitl} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div>
          <GatewayServices handleResolveHitl={handleResolveHitl} />
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
}
