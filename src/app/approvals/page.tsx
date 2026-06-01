"use client";
// Accessibility standards: label placeholder aria-label

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Diff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchApprovals } from "@/lib/acmi-client";
import { formatRelativeTime } from "@/lib/utils";

interface Approval {
  id: string;
  title: string;
  requester: string;
  status: "pending" | "approved" | "rejected";
  diff: string;
  createdAt: string;
}

function ApprovalCard({
  approval,
  onAction,
}: {
  approval: Approval;
  onAction: (id: string, action: "approve" | "reject") => void;
}) {
  return (
    <Card className={approval.status !== "pending" ? "opacity-60" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{approval.title}</h3>
              {approval.status !== "pending" && (
                <Badge
                  variant="outline"
                  className={
                    approval.status === "approved"
                      ? "border-green-500 text-green-600"
                      : "border-red-500 text-red-600"
                  }
                >
                  {approval.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>by {approval.requester}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(new Date(approval.createdAt).getTime())}
              </span>
              <span className="flex items-center gap-1">
                <Diff className="h-3 w-3" />
                {approval.diff}
              </span>
            </div>
          </div>

          {approval.status === "pending" && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => onAction(approval.id, "approve")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                onClick={() => onAction(approval.id, "reject")}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");

  useEffect(() => {
    fetchApprovals().then(setApprovals);
  }, []);

  function handleAction(id: string, action: "approve" | "reject") {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: action === "approve" ? "approved" : "rejected" } : a))
    );
  }

  const filtered = approvals.filter((a) => {
    if (filter === "pending") return a.status === "pending";
    if (filter === "resolved") return a.status !== "pending";
    return true;
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and approve/reject pending requests from fleet agents.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "pending", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f === "all" ? "All" : f === "pending" ? `Pending (${approvals.filter(a => a.status === "pending").length})` : "Resolved"}
          </button>
        ))}
      </div>

      {/* List */}
      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="space-y-3">
          {filtered.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} onAction={handleAction} />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mb-2" />
              <p>No approvals match your filter.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
