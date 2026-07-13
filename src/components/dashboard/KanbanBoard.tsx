import { useCockpitStore } from "@/store/useCockpitStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ACMIWorkItem } from "@/lib/acmi-client";
import { cn } from "@/lib/utils";

export function KanbanBoard() {
  const { rollup, activeTenant } = useCockpitStore();

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

  const renderKanbanCard = (w: ACMIWorkItem) => {
    const isAntigravity = w.owner?.toLowerCase().includes("antigravity");
    return (
      <div
        key={w.id}
        className={cn(
          "border p-2 bg-[#f5f4ed]/30 border-[#e5e3d7] rounded-[2px]",
          isAntigravity && "border-[#0d1b2a] bg-[#f5f4ed]/80"
        )}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="font-mono text-[9px] font-bold truncate text-[#0d1b2a] uppercase tracking-wider">
            {w.id}
          </span>
          {isAntigravity && (
            <span className="font-mono text-[8px] bg-[#0d1b2a] text-[#fbfaf5] px-1 tracking-wider rounded-[2px]">
              [antigravity]
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-[#0d1b2a] mb-1 line-clamp-2">{w.title}</p>
        <div className="flex justify-between items-center text-[9px] text-[#2c3e50]/70 font-mono">
          <span>Progress: {w.progress}%</span>
          <span className="truncate max-w-[80px]">
            Owner: {w.owner?.replace("agent:", "") || "unassigned"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-[#e5e3d7] bg-[#f5f4ed]/20 rounded-[4px] shadow-none">
      <CardHeader className="border-b border-[#e5e3d7] pb-3">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-[#2c3e50] flex items-center justify-between">
          <span>[Workflow Kanban Lifecycle Stages]</span>
          <span className="text-[9px] text-[#2c3e50]/50 font-mono font-normal">
            Active pipeline tracker
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-[1000px] lg:min-w-0 lg:grid lg:grid-cols-4 w-full">
            {/* Stage 1: Backlog */}
            <div className="border border-[#e5e3d7] bg-[#fbfaf5] p-3 space-y-3 w-[240px] shrink-0 lg:w-auto lg:shrink rounded-[4px]">
              <div className="border-b border-[#e5e3d7] pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0d1b2a] uppercase tracking-wider">
                  [01] Backlog
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 font-mono uppercase bg-[#f5f4ed] text-[#0d1b2a] border-[#e5e3d7] rounded-none tracking-wider shadow-none"
                >
                  {backlogItems.length} items
                </Badge>
              </div>
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {backlogItems.slice(0, 10).map(renderKanbanCard)}
                  {backlogItems.length === 0 && (
                    <div className="text-[10px] font-mono text-[#2c3e50]/40 text-center py-4">
                      No items in Backlog
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Stage 2: Active */}
            <div className="border border-[#e5e3d7] bg-[#fbfaf5] p-3 space-y-3 w-[240px] shrink-0 lg:w-auto lg:shrink rounded-[4px]">
              <div className="border-b border-[#e5e3d7] pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0d1b2a] uppercase tracking-wider">
                  [02] Active
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 font-mono uppercase bg-[#27ae60]/10 text-[#27ae60] border-[#27ae60]/20 rounded-none tracking-wider shadow-none"
                >
                  {activeItems.length} items
                </Badge>
              </div>
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {activeItems.slice(0, 10).map(renderKanbanCard)}
                  {activeItems.length === 0 && (
                    <div className="text-[10px] font-mono text-[#2c3e50]/40 text-center py-4">
                      No active items
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Stage 3: Stalled */}
            <div className="border border-[#e5e3d7] bg-[#fbfaf5] p-3 space-y-3 w-[240px] shrink-0 lg:w-auto lg:shrink rounded-[4px]">
              <div className="border-b border-[#e5e3d7] pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0d1b2a] uppercase tracking-wider">
                  [03] Stalled
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 font-mono uppercase bg-[#c0392b]/10 text-[#c0392b] border-[#c0392b]/20 rounded-none tracking-wider shadow-none"
                >
                  {stalledItems.length} items
                </Badge>
              </div>
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {stalledItems.slice(0, 10).map(renderKanbanCard)}
                  {stalledItems.length === 0 && (
                    <div className="text-[10px] font-mono text-[#2c3e50]/40 text-center py-4">
                      No stalled items
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Stage 4: Completed */}
            <div className="border border-[#e5e3d7] bg-[#fbfaf5] p-3 space-y-3 w-[240px] shrink-0 lg:w-auto lg:shrink rounded-[4px]">
              <div className="border-b border-[#e5e3d7] pb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0d1b2a] uppercase tracking-wider">
                  [04] Completed
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 font-mono uppercase bg-[#27ae60]/10 text-[#27ae60] border-[#27ae60]/20 rounded-none tracking-wider shadow-none"
                >
                  {completedItems.length} items
                </Badge>
              </div>
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {completedItems.slice(0, 10).map(renderKanbanCard)}
                  {completedItems.length === 0 && (
                    <div className="text-[10px] font-mono text-[#2c3e50]/40 text-center py-4">
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
