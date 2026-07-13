import { useCockpitStore } from "@/store/useCockpitStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ActivityFeed() {
  const { rollup, busEvents, activeTenant, copiedId, copyText } = useCockpitStore();

  const safeRollup = rollup || {
    totalAgents: 0,
    activeAgents: 0,
    totalWorkItems: 0,
    activeWorkItems: 0,
    stalledWorkItems: 0,
    completedWorkItems: 0,
    pendingWorkItems: 0,
    recentEvents: [],
    rawWorkItems: [],
  };

  const filteredBusEvents = busEvents.filter((e) => {
    if (activeTenant === "all") return true;
    const sourceLower = e.source.toLowerCase();
    const payloadStr = JSON.stringify(e.payload || {}).toLowerCase();
    return sourceLower.includes(activeTenant) || payloadStr.includes(activeTenant);
  });

  const filteredRecentEvents = (safeRollup.recentEvents || []).filter((e) => {
    if (activeTenant === "all") return true;
    const sourceLower = e.source.toLowerCase();
    const summaryLower = e.summary.toLowerCase();
    return sourceLower.includes(activeTenant) || summaryLower.includes(activeTenant);
  });

  const totalEventsCount = filteredRecentEvents.length + filteredBusEvents.length;

  return (
    <Card className="border border-[#e5e3d7] bg-[#fbfaf5] rounded-[4px] shadow-none">
      <CardHeader className="pb-2 border-b border-[#e5e3d7]">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-[#2c3e50] flex items-center justify-between">
          <span>[Console Activity Log Stream]</span>
          <Badge className="bg-[#f5f4ed] text-[#0d1b2a] border border-[#e5e3d7] rounded-none font-mono text-[9px] py-0 shadow-none">
            {totalEventsCount} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-1 font-mono text-[11px] leading-relaxed">
            {/* Bus events */}
            {filteredBusEvents.map((evt, i) => {
              const payloadObj = evt.payload as Record<string, unknown> | undefined;
              return (
                <div
                  key={`bus-${i}`}
                  className="flex gap-2 py-1 border-b border-[#e5e3d7]/30 last:border-0 text-[#2c3e50] items-center justify-between"
                >
                  <div className="flex gap-2 min-w-0 flex-1 items-center">
                    <span className="shrink-0 font-bold text-[#2c3e50]/40">
                      [{new Date(evt.ts).toLocaleTimeString()}]
                    </span>
                    <span className="shrink-0 text-[#0d1b2a] font-bold">{evt.source}</span>
                    <span className="truncate text-[#2c3e50] font-mono">
                      {String(payloadObj?.summary || evt.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {typeof payloadObj?.correlationId === "string" && (
                      <button
                        onClick={() => copyText(payloadObj.correlationId as string, `copy-${i}`)}
                        className="text-[8px] border border-[#e5e3d7] px-1 text-[#2c3e50]/70 hover:text-[#0d1b2a] rounded-[2px] bg-[#fbfaf5] cursor-pointer"
                      >
                        {copiedId === `copy-${i}` ? "Copied" : "ID"}
                      </button>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[8px] rounded-none px-1 border-[#0d1b2a]/20 text-[#0d1b2a] bg-[#0d1b2a]/5 py-0 leading-none h-4"
                    >
                      bus
                    </Badge>
                  </div>
                </div>
              );
            })}

            {/* Historical events */}
            {filteredRecentEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex gap-2 py-1 border-b border-[#e5e3d7]/30 last:border-0 text-[#2c3e50]/80 justify-between items-center"
              >
                <div className="flex gap-2 min-w-0 flex-1">
                  <span className="shrink-0 text-[#2c3e50]/40">
                    [{evt.ts ? new Date(evt.ts).toLocaleTimeString() : ""}]
                  </span>
                  <span className="shrink-0 font-bold text-[#0d1b2a]">{evt.source}</span>
                  <span className="truncate">{evt.summary}</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] rounded-none px-1 border-[#e5e3d7] text-[#2c3e50] bg-[#f5f4ed] py-0 leading-none h-4 shrink-0"
                >
                  {evt.kind}
                </Badge>
              </div>
            ))}

            {filteredRecentEvents.length === 0 && filteredBusEvents.length === 0 && (
              <div className="text-center py-12 text-[#2c3e50]/40">
                No activity observed in active tenant scope
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
