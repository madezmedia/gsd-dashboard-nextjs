"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, ShieldAlert, Check, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchHitlQueue, resolveHitlTicket } from "@/lib/acmi-client";
import { formatRelativeTime } from "@/lib/utils";

interface HitlTicket {
  member: string;
  ts: number;
  id?: string;
  source?: string;
  kind?: string;
  summary: string;
  correlationId?: string;
  work_item_id?: string;
}

export default function HitlQueuePage() {
  const [tickets, setTickets] = useState<HitlTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningMember, setActioningMember] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<Record<string, string>>({});

  const loadQueue = useCallback(async () => {
    try {
      const list = await fetchHitlQueue();
      setTickets(list as HitlTicket[]);
    } catch (err) {
      console.error("Failed to load HITL queue", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQueue();
    }, 0);
    const interval = setInterval(loadQueue, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadQueue]);

  const handleResolve = async (ticket: HitlTicket, action: "approve" | "reject") => {
    const member = ticket.member;
    const note = feedbackNote[member] || "";
    setActioningMember(member);

    try {
      const success = await resolveHitlTicket(member, action, note, ticket.work_item_id || ticket.id);
      if (success) {
        setFeedbackNote(prev => {
          const next = { ...prev };
          delete next[member];
          return next;
        });
        await loadQueue();
      } else {
        alert("Failed to submit action to database.");
      }
    } catch (err) {
      console.error(err);
      alert("Error resolving ticket.");
    } finally {
      setActioningMember(null);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase animate-pulse">
          Initializing Command Interface...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="relative border border-border bg-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#F2C94C] rounded-l-2xl" />
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif">
            Operator <span className="text-[#F2C94C] italic font-light font-sans">HITL Queue</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">
            Human-In-The-Loop Approval & Intervention Gate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#F2C94C]/10 text-[#F2C94C] border border-[#F2C94C]/20 px-2 py-0.5 rounded-none font-mono text-xs">
            {tickets.length} PENDING DECISIONS
          </Badge>
        </div>
      </header>

      {tickets.length === 0 ? (
        <Card className="border border-border bg-card rounded-2xl p-12 text-center shadow-md">
          <CardContent className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto animate-pulse" />
            <h3 className="font-serif text-lg font-bold text-foreground">All Swarms Clear</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              There are no pending Human-in-the-Loop interventions. Auto-agents are running safely and within parameters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket, i) => {
            const isProcessing = actioningMember === ticket.member;
            
            return (
              <Card 
                key={ticket.id || `hitl-${i}`} 
                className="border border-border bg-card rounded-2xl shadow-md overflow-hidden relative"
              >
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#F2C94C]" />
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-[#F2C94C]" />
                      <span className="font-mono text-xs font-bold text-primary uppercase">
                        {ticket.member}
                      </span>
                      <Badge className="bg-secondary text-foreground text-[10px] font-mono rounded-none tracking-tight">
                        {ticket.kind || "intervention"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(ticket.ts)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug bg-secondary p-3 border border-border rounded-sm">
                      {ticket.summary}
                    </h3>
                    
                    {ticket.work_item_id && (
                      <div className="text-[9px] font-mono text-muted-foreground uppercase">
                        Associated Work ID: <span className="font-bold text-primary">{ticket.work_item_id}</span>
                      </div>
                    )}
                  </div>

                  {/* Operator response box */}
                  <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Add comments, execution constraints, or feedback keys..."
                        className="w-full bg-background border border-border px-3 py-2 rounded-sm text-xs font-mono text-foreground focus:outline-none focus:border-primary/50"
                        value={feedbackNote[ticket.member] || ""}
                        onChange={(e) => setFeedbackNote(prev => ({
                          ...prev,
                          [ticket.member]: e.target.value
                        }))}
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary-hover text-[#0F2A2E] font-mono text-[10px] uppercase h-9 rounded-none px-4 cursor-pointer"
                        onClick={() => handleResolve(ticket, "approve")}
                        disabled={isProcessing}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        {isProcessing ? "Sending..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border text-foreground hover:bg-secondary font-mono text-[10px] uppercase h-9 rounded-none px-4 cursor-pointer"
                        onClick={() => handleResolve(ticket, "reject")}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        {isProcessing ? "Sending..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
