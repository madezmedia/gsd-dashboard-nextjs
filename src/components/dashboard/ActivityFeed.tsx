import { useCockpitStore } from "@/store/useCockpitStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatSafeTime(ts: number | string | undefined): string {
  if (!ts) return "Pending Sync";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "Pending Sync";
    return d.toLocaleTimeString();
  } catch {
    return "Pending Sync";
  }
}

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
    <Card className="border border-border bg-card rounded-[4px] shadow-none">
      <CardHeader className="pb-2 border-b border-border">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>[Console Activity Log Stream]</span>
          <Badge className="bg-muted text-foreground border border-border rounded-none font-mono text-[9px] py-0 shadow-none">
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
                  className="flex gap-2 py-1 border-b border-border/30 last:border-0 text-muted-foreground items-center justify-between"
                >
                  <div className="flex gap-2 min-w-0 flex-1 items-center">
                    <span className="shrink-0 font-bold text-muted-foreground/45">
                      [{formatSafeTime(evt.ts)}]
                    </span>
                    <span className="shrink-0 text-foreground font-bold">{evt.source}</span>
                    <span className="truncate text-muted-foreground/90 font-mono text-[11px]">
                      {String(payloadObj?.summary || evt.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {typeof payloadObj?.correlationId === "string" && (
                      <button
                        onClick={() => copyText(payloadObj.correlationId as string, `copy-${i}`)}
                        className="text-[8px] border border-border px-1 text-muted-foreground/70 hover:text-foreground rounded-[2px] bg-card cursor-pointer"
                      >
                        {copiedId === `copy-${i}` ? "Copied" : "ID"}
                      </button>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[8px] rounded-none px-1 border-primary/20 text-primary bg-primary/5 py-0 leading-none h-4"
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
                className="flex gap-2 py-1 border-b border-border/30 last:border-0 text-muted-foreground/80 justify-between items-center"
              >
                <div className="flex gap-2 min-w-0 flex-1 items-center">
                  <span className="shrink-0 text-muted-foreground/45">
                    [{formatSafeTime(evt.ts)}]
                  </span>
                  <span className="shrink-0 font-bold text-foreground">{evt.source}</span>
                  <span className="truncate text-[11px] text-muted-foreground/90">{evt.summary}</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] rounded-none px-1 border-border text-muted-foreground bg-muted py-0 leading-none h-4 shrink-0"
                >
                  {evt.kind}
                </Badge>
              </div>
            ))}

            {filteredRecentEvents.length === 0 && filteredBusEvents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground/40">
                No activity observed in active tenant scope
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
