"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bot, Filter } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchAgents, type ACMIProfile } from "@/lib/acmi-client";
import { cn } from "@/lib/utils";

const statusColors: Record<ACMIProfile["status"], string> = {
  active: "bg-green-500",
  idle: "bg-amber-500",
  busy: "bg-blue-500",
  offline: "bg-gray-400",
};

function AgentCard({ agent }: { agent: ACMIProfile }) {
  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                    statusColors[agent.status]
                  )}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">{agent.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] capitalize",
                agent.status === "active" && "border-green-500 text-green-600",
                agent.status === "idle" && "border-amber-500 text-amber-600",
                agent.status === "busy" && "border-blue-500 text-blue-600"
              )}
            >
              {agent.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 3).map((cap) => (
              <Badge key={cap} variant="secondary" className="text-[10px]">
                {cap}
              </Badge>
            ))}
            {agent.capabilities.length > 3 && (
              <Badge variant="secondary" className="text-[10px]">
                +{agent.capabilities.length - 3}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Model: {agent.model || "N/A"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AgentConsole() {
  const [agents, setAgents] = useState<ACMIProfile[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ACMIProfile["status"] | "all">("all");

  useEffect(() => {
    fetchAgents().then(setAgents);
  }, []);

  const filtered = agents.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(filter.toLowerCase()) ||
      a.role.toLowerCase().includes(filter.toLowerCase()) ||
      a.capabilities.some((c) => c.includes(filter.toLowerCase()));
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Console</h1>
        <p className="text-muted-foreground">
          All {agents.length} ACMI fleet agents. Click an agent to view details.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <label htmlFor="agent-search-input" className="sr-only">
            Search agents by name, role, or capability
          </label>
          <Input
            id="agent-search-input"
            placeholder="Search agents by name, role, or capability..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "idle", "busy", "offline"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md font-medium transition-colors capitalize",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Filter className="h-8 w-8 mb-2" />
            <p>No agents match your filters.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
