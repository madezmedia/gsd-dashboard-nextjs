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

export default function CockpitDashboard() {
  // Initialize focus-aware fetching and real-time stream subscriptions
  const { handleForceSync, handleResolveHitl } = useCockpitData();
  const rollup = useCockpitStore((state) => state.rollup);

  if (!rollup) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 bg-[#fbfaf5]">
        <RefreshCw className="h-6 w-6 text-[#0d1b2a] animate-spin" />
        <p className="font-mono text-xs tracking-widest text-[#2c3e50] uppercase animate-pulse">
          Establishing link with Fleet Command...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 bg-[#fbfaf5] p-6 min-h-screen text-[#0d1b2a]">
      {/* 1. Header with Title & Tenant selector */}
      <CockpitHeader handleForceSync={handleForceSync} />

      {/* 2. Key Metrics Grid */}
      <KpiGrid />

      {/* 3. Urgent Alerts and manual decision list */}
      <OperationsBoard handleResolveHitl={handleResolveHitl} />

      {/* 4. Stream Log and Gateway status grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div>
          <GatewayServices handleResolveHitl={handleResolveHitl} />
        </div>
      </div>

      {/* 5. Horizontal Workflow Kanban tracker */}
      <KanbanBoard />
    </div>
  );
}
