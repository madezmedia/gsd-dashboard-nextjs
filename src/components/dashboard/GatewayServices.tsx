import { useState } from "react";
import { useCockpitStore, type HitlTicket } from "@/store/useCockpitStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, Copy, ShieldCheck, Check, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface GatewayServicesProps {
  handleResolveHitl: (ticket: HitlTicket, action: "approve" | "reject") => Promise<void>;
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

export function GatewayServices({ handleResolveHitl }: GatewayServicesProps) {
  const {
    services,
    activeTenant,
    hitlQueue,
    actioningMember,
    feedbackNote,
    setFeedbackNote,
    copyText,
  } = useCockpitStore();

  const [mountedTime] = useState(() => Date.now());

  const filteredHitlQueue = hitlQueue.filter((h) => {
    if (activeTenant === "all") return true;
    const summaryLower = h.summary.toLowerCase();
    const memberLower = h.member.toLowerCase();
    return summaryLower.includes(activeTenant) || memberLower.includes(activeTenant);
  });

  const filteredServices = services.filter((s) => {
    if (activeTenant === "all") return true;
    const slugLower = s.slug.toLowerCase();
    const nameLower = s.name.toLowerCase();
    return slugLower.includes(activeTenant) || nameLower.includes(activeTenant);
  });

  const topTicket = filteredHitlQueue[0];

  return (
    <div className="space-y-6">
      {/* Swarm Gateway Actions */}
      <Card className="border border-border bg-card rounded-[4px] shadow-none">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center justify-between text-muted-foreground">
            <span>[Swarm Gateway Actions]</span>
            <span className="text-[8px] text-muted-foreground/40 font-mono">Operations Command</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-3">
          <div className="p-3 bg-muted/80 border border-border rounded-[2px] font-mono text-[10px] space-y-2">
            <p className="font-bold text-foreground uppercase flex items-center gap-1">
              <Terminal className="h-3 w-3" /> Quick Diagnostic Cmd:
            </p>
            <div className="bg-primary text-primary-foreground p-2 rounded-[2px] select-all flex justify-between items-center overflow-x-auto text-[9px] border border-border/30">
              <code>curl -s http://152.53.201.27:7780/health</code>
              <button
                onClick={() => copyText("curl -s http://152.53.201.27:7780/health", "copy-curl")}
                className="ml-2 hover:text-emerald-500 transition-colors text-primary-foreground/60 shrink-0 cursor-pointer"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          {topTicket ? (
            <div className="space-y-3 border border-border p-3 rounded-[4px] bg-muted/40">
              <span className="font-mono text-[9px] text-muted-foreground uppercase font-bold tracking-wide">
                Actioning ticket:
              </span>
              <div className="space-y-1 font-mono">
                <div className="flex justify-between items-center text-[9px] text-muted-foreground/70">
                  <span>Agent: {topTicket.member}</span>
                  <span>{formatRelativeTime(topTicket.ts)}</span>
                </div>
                <p className="text-xs font-semibold text-foreground bg-card p-2 border border-border rounded-[2px] leading-relaxed">
                  {topTicket.summary}
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Add resolution instruction..."
                  className="bg-card border-border text-xs h-8 rounded-[4px] font-mono shadow-none text-foreground"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  disabled={actioningMember === topTicket.member}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[10px] uppercase h-8 rounded-[4px] shadow-none"
                  onClick={() => handleResolveHitl(topTicket, "approve")}
                  disabled={actioningMember === topTicket.member}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-muted font-mono text-[10px] uppercase h-8 rounded-[4px] shadow-none"
                  onClick={() => handleResolveHitl(topTicket, "reject")}
                  disabled={actioningMember === topTicket.member}
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2 border border-dashed border-border rounded-[4px]">
              <ShieldCheck className="h-8 w-8 text-emerald-500/30 mx-auto animate-pulse" />
              <p className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest font-bold">
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
      <Card className="border border-border bg-card rounded-[4px] shadow-none">
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
                  className="border border-border bg-muted/50 p-2 flex items-center justify-between rounded-[2px]"
                >
                  <span className="truncate max-w-[90px] font-bold text-foreground/80 uppercase">
                    {svc.slug}
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isUp ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                    )}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
