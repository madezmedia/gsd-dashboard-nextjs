import { useCockpitStore, type HitlTicket } from "@/store/useCockpitStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Check, Ban } from "lucide-react";

interface OperationsBoardProps {
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

export function OperationsBoard({ handleResolveHitl }: OperationsBoardProps) {
  const {
    rollup,
    hitlQueue,
    activeTenant,
    actioningMember,
    copiedId,
    copyText,
  } = useCockpitStore();

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
    return titleLower.includes(activeTenant) || idLower.includes(activeTenant) || ownerLower.includes(activeTenant);
  });

  const filteredHitlQueue = hitlQueue.filter((h) => {
    if (activeTenant === "all") return true;
    const summaryLower = h.summary.toLowerCase();
    const memberLower = h.member.toLowerCase();
    return summaryLower.includes(activeTenant) || memberLower.includes(activeTenant);
  });

  const stalledItems = filteredWorkItems.filter((w) => w.status === "stalled");
  const urgentCount = filteredHitlQueue.length + stalledItems.length;

  if (urgentCount === 0) {
    return (
      <Card className="border border-border bg-card rounded-[4px] shadow-none">
        <CardContent className="p-6">
          <div className="text-center py-6 space-y-2">
            <ShieldCheck className="h-8 w-8 text-emerald-500/30 mx-auto animate-pulse" />
            <p className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest font-bold">
              Gatekeeper Queue Clear
            </p>
            <p className="text-[9px] text-muted-foreground/70 font-mono">
              All fleet automation tasks proceeding without intervention.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-destructive/20 bg-destructive/[0.02] rounded-[4px] shadow-none overflow-hidden">
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4" />
          Urgent Operations Board ({urgentCount} alerts)
        </span>
        <span className="text-[8px] font-mono text-destructive bg-destructive/15 px-2 py-0.5 uppercase font-bold rounded-[2px]">
          Immediate Operator Review Needed
        </span>
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Display active HITL queue items */}
        {filteredHitlQueue.map((ticket, index) => (
          <div
            key={`urgent-hitl-${index}`}
            className="border border-border bg-card p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative rounded-[4px]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-white text-[8px] uppercase tracking-wide font-mono rounded-[2px] shadow-none">
                  hitl-escalation
                </Badge>
                <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase">
                  {ticket.member}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {formatRelativeTime(ticket.ts)}
                </span>
              </div>
              <p className="text-xs font-bold text-foreground mt-1.5 font-mono bg-muted p-2 border border-border rounded-[2px]">
                {ticket.summary}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleResolveHitl(ticket, "approve")}
                disabled={actioningMember === ticket.member}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[9px] uppercase px-3 rounded-[4px] h-8 shadow-none"
              >
                <Check className="h-3 w-3 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResolveHitl(ticket, "reject")}
                disabled={actioningMember === ticket.member}
                className="border-border text-foreground hover:bg-muted font-mono text-[9px] uppercase px-3 rounded-[4px] h-8 shadow-none"
              >
                <Ban className="h-3 w-3 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))}

        {/* Display stalled work items */}
        {stalledItems.map((w) => (
          <div
            key={w.id}
            className="border border-border bg-card p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-[4px]"
          >
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-destructive text-white text-[8px] uppercase font-mono rounded-[2px] shadow-none">
                  stalled-job
                </Badge>
                <span className="text-[10px] font-mono font-bold text-foreground uppercase">
                  {w.id}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/70">
                  OWNER: {w.owner || "unassigned"}
                </span>
              </div>
              <p className="text-xs text-foreground font-sans font-semibold mt-1">
                {w.title}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-[9px] font-mono border-border uppercase rounded-[4px] h-8 shadow-none hover:bg-muted text-foreground"
                onClick={() => copyText(w.id, `copy-stalled-${w.id}`)}
              >
                {copiedId === `copy-stalled-${w.id}` ? "Copied" : "Copy ID"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
