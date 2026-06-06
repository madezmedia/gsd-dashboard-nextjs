"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bot, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchAgents, type ACMIProfile } from "@/lib/acmi-client";
import { AcmiProfileCard } from "@/components/acmi";
import { cn } from "@/lib/utils";

export default function AgentConsole() {
  const router = useRouter();
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
        <h1 className="text-2xl font-bold tracking-tight text-[#2d4a3e] font-mono">Agent Console</h1>
        <p className="text-muted-foreground text-xs font-mono uppercase tracking-wide">
          All {agents.length} ACMI fleet agents. Click an agent card to view telemetry logs.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2d4a3e]/60" />
          <label htmlFor="agent-search-input" className="sr-only">
            Search agents by name, role, or capability
          </label>
          <Input
            id="agent-search-input"
            placeholder="Search agents by name, role, or capability..."
            className="pl-9 font-mono text-xs border-[#1a1a1a]/15 bg-[#faf9f5] rounded-none focus-visible:ring-1 focus-visible:ring-[#2d4a3e]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-1 border border-[#1a1a1a]/15 p-0.5 bg-[#faf9f5]">
          {(["all", "active", "idle", "busy", "offline"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors rounded-none",
                statusFilter === s
                  ? "bg-[#2d4a3e] text-[#faf9f5]"
                  : "text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
          {filtered.map((agent) => (
            <AcmiProfileCard
              key={agent.id}
              namespace="agent"
              id={agent.id}
              onSelect={(id) => router.push(`/agents/${id}`)}
              className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground font-mono text-xs border border-dashed border-[#1a1a1a]/15 p-8">
            <Filter className="h-6 w-6 mb-2 text-[#2d4a3e]" />
            <p className="uppercase tracking-wider">No agents match your filters.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
