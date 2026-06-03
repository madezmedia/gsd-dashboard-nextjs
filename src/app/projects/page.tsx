"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Folders,
  Search,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { acmiClient } from "@/lib/acmi-client";

interface ProjectItem {
  id: string;
  title: string;
  status: "active" | "stalled" | "completed" | "pending";
  owner: string;
  progress: number;
  milestones: string[];
  completedMilestones: string[];
  pipelineValue: string;
  description: string;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: "acmi-fleet-ops",
    title: "ACMI Fleet Ops",
    status: "active",
    owner: "@fleet-orch",
    progress: 70,
    milestones: ["Edge compute config", "ZSet relay setup", "E2E stream validation", "Fleet rollout"],
    completedMilestones: ["Edge compute config", "ZSet relay setup", "E2E stream validation"],
    pipelineValue: "$12.4k",
    description: "Edge compute coordination and real-time fleet synchronization.",
  },
  {
    id: "ownerscout",
    title: "OwnerScout",
    status: "stalled",
    owner: "@claude-engineer",
    progress: 65,
    milestones: ["Webhook routing setup", "VAPI setup", "Testing pipeline", "Launch"],
    completedMilestones: ["Webhook routing setup", "VAPI setup"],
    pipelineValue: "$8,752",
    description: "Pipeline lead extraction blocked on API credential rotation.",
  },
  {
    id: "cowork-kanban",
    title: "cowork-kanban Redesign",
    status: "completed",
    owner: "@design-agency",
    progress: 100,
    milestones: ["UX audit", "Responsive pass", "Aesthetic alignment", "Sign-off"],
    completedMilestones: ["UX audit", "Responsive pass", "Aesthetic alignment", "Sign-off"],
    pipelineValue: "$5.2k",
    description: "Full editorial brutalist UI makeover and mobile-responsive hardening.",
  },
  {
    id: "secret-manager",
    title: "Secret Manager",
    status: "active",
    owner: "@gemini-cli",
    progress: 50,
    milestones: ["AES key framework", "Keychain storage", "Command tool", "Documentation"],
    completedMilestones: ["AES key framework", "Keychain storage"],
    pipelineValue: "$3.5k",
    description: "AES-256 secure secret storage for project environment configs.",
  },
  {
    id: "whop-launch",
    title: "Whop Launch",
    status: "active",
    owner: "@growth-hacker",
    progress: 40,
    milestones: ["Scaffolding", "Payment gateway integration", "Whop API sync", "Launch product"],
    completedMilestones: ["Scaffolding", "Payment gateway integration"],
    pipelineValue: "TBD",
    description: "Launch of specialized digital coaching and workflow courses.",
  },
  {
    id: "postiz-calendar",
    title: "Postiz Content Calendar",
    status: "pending",
    owner: "@content-writer",
    progress: 15,
    milestones: ["Market research", "Content brief", "Scheduling automation", "Social seed"],
    completedMilestones: ["Market research"],
    pipelineValue: "$1.8k",
    description: "Multi-channel Q3 planning phase scheduling templates.",
  },
];

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingStatus, setSyncingStatus] = useState<string | null>(null);

  // Load projects from ACMI bootstrap or fallbacks
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await acmiClient.fetchDashboardBootstrap();
      if (data && data.workItems && data.workItems.length > 0) {
        const parsed: ProjectItem[] = data.workItems.map((w: any) => {
          const profile = w.profile || {};
          const signals = w.signals || {};

          let completed: string[] = [];
          if (signals.completed_milestones) {
            try {
              completed = typeof signals.completed_milestones === "string"
                ? JSON.parse(signals.completed_milestones)
                : signals.completed_milestones;
            } catch {
              completed = [];
            }
          }

          const statusRaw = signals.status || profile.status || "active";
          const status = (statusRaw === "active" || statusRaw === "stalled" || statusRaw === "completed" || statusRaw === "pending")
            ? statusRaw as ProjectItem["status"]
            : "active";

          return {
            id: w.id,
            title: profile.title || w.id,
            status,
            owner: profile.owner || "@unassigned",
            progress: signals.progress ? parseInt(String(signals.progress)) || 0 : 0,
            milestones: profile.milestones || ["Kickoff", "Design", "Implementation", "Shipping"],
            completedMilestones: Array.isArray(completed) ? completed : [],
            pipelineValue: profile.value || "$1.0k",
            description: profile.description || "ACMI synchronized workload project.",
          };
        });
        setProjects(parsed);
      } else {
        setProjects(DEFAULT_PROJECTS);
      }
    } catch (err) {
      console.error("Error loading projects bootstrap:", err);
      setProjects(DEFAULT_PROJECTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle milestone checking toggle
  const toggleMilestone = async (project: ProjectItem, milestone: string) => {
    const isCompleted = project.completedMilestones.includes(milestone);
    const updatedCompleted = isCompleted
      ? project.completedMilestones.filter((m) => m !== milestone)
      : [...project.completedMilestones, milestone];

    // Calculate progress fraction
    const progress = Math.round((updatedCompleted.length / project.milestones.length) * 100);
    const status = progress === 100 ? "completed" : project.status === "completed" ? "active" : project.status;

    // Optimistically update locally
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, completedMilestones: updatedCompleted, progress, status }
          : p
      )
    );

    setSyncingStatus(project.id);

    try {
      // Direct integration mapping writes back to Upstash Redis
      await acmiClient.updateWorkItemMilestones(project.id, updatedCompleted, progress, status);
      setSyncingStatus(null);
    } catch (err) {
      console.error("Failed to sync milestone state update:", err);
      setSyncingStatus(null);
    }
  };

  // Toggle complete project status override
  const handleStatusOverride = async (project: ProjectItem, nextStatus: ProjectItem["status"]) => {
    // Optimistically update
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, status: nextStatus } : p))
    );

    setSyncingStatus(project.id);
    try {
      await acmiClient.updateWorkItemStatus(project.id, nextStatus);
      setSyncingStatus(null);
    } catch (err) {
      console.error("Failed to change work status override:", err);
      setSyncingStatus(null);
    }
  };

  // Compute completions pipeline counts
  const stageCounts = {
    ideas: projects.filter((p) => p.status === "pending").length,
    inProgress: projects.filter((p) => p.status === "active").length,
    review: projects.filter((p) => p.status === "stalled").length,
    deployed: projects.filter((p) => p.status === "completed").length,
    revenueCount: projects.filter((p) => p.status === "completed" && p.pipelineValue !== "TBD").length,
  };

  const maxCount = Math.max(
    stageCounts.ideas,
    stageCounts.inProgress,
    stageCounts.review,
    stageCounts.deployed,
    1
  );

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#faf9f5] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1a1a1a]/15 bg-[#faf9f5] p-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-[#2d4a3e]/10 border border-[#2d4a3e]/30 text-[#2d4a3e] rounded-none">
            <Folders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-[#1a1a1a] uppercase tracking-wide">
              Project Tracker
            </h1>
            <p className="text-xs text-[#1a1a1a]/60 font-mono">
              Pipeline Completions Funnel & Real-time Workload Metrics
            </p>
          </div>
        </div>

        <div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#1a1a1a]/40" />
            <input
              type="text"
              placeholder="SEARCH PROJECTS OR OWNERS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#f4f2eb] border border-[#1a1a1a]/15 text-xs font-mono placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#2d4a3e]/50 rounded-none uppercase w-full md:w-60"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d4a3e] mb-2" />
          <span className="text-xs font-mono text-[#1a1a1a]/60">LOADING ACMI PROJECTS...</span>
        </div>
      ) : (
        <div className="p-4 md:p-6 space-y-6">
          {/* Completions Pipeline Funnel */}
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider mb-4 text-[#2d4a3e] border-b border-[#1a1a1a]/10 pb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Completions Pipeline Funnel
            </h2>
            <div className="space-y-3 font-mono text-xs max-w-2xl">
              {/* Ideas */}
              <div className="grid grid-cols-12 items-center gap-3">
                <span className="col-span-3 uppercase text-2xs tracking-wide text-[#1a1a1a]/60">Ideas</span>
                <div className="col-span-8 bg-[#faf9f5] border border-[#1a1a1a]/10 h-4 rounded-none overflow-hidden relative">
                  <div
                    className="bg-[#c4903a]/30 h-full transition-all duration-500"
                    style={{ width: `${(stageCounts.ideas / maxCount) * 100}%` }}
                  />
                </div>
                <span className="col-span-1 text-right font-bold text-[#1a1a1a]/80">{stageCounts.ideas}</span>
              </div>

              {/* In Progress */}
              <div className="grid grid-cols-12 items-center gap-3">
                <span className="col-span-3 uppercase text-2xs tracking-wide text-[#1a1a1a]/60">In Progress</span>
                <div className="col-span-8 bg-[#faf9f5] border border-[#1a1a1a]/10 h-4 rounded-none overflow-hidden relative">
                  <div
                    className="bg-[#2d4a3e]/30 h-full transition-all duration-500"
                    style={{ width: `${(stageCounts.inProgress / maxCount) * 100}%` }}
                  />
                </div>
                <span className="col-span-1 text-right font-bold text-[#1a1a1a]/80">{stageCounts.inProgress}</span>
              </div>

              {/* Review */}
              <div className="grid grid-cols-12 items-center gap-3">
                <span className="col-span-3 uppercase text-2xs tracking-wide text-[#1a1a1a]/60">Review (Stalled)</span>
                <div className="col-span-8 bg-[#faf9f5] border border-[#1a1a1a]/10 h-4 rounded-none overflow-hidden relative">
                  <div
                    className="bg-[#9c3e3e]/30 h-full transition-all duration-500"
                    style={{ width: `${(stageCounts.review / maxCount) * 100}%` }}
                  />
                </div>
                <span className="col-span-1 text-right font-bold text-[#1a1a1a]/80">{stageCounts.review}</span>
              </div>

              {/* Deployed */}
              <div className="grid grid-cols-12 items-center gap-3">
                <span className="col-span-3 uppercase text-2xs tracking-wide text-[#1a1a1a]/60">Deployed (Done)</span>
                <div className="col-span-8 bg-[#faf9f5] border border-[#1a1a1a]/10 h-4 rounded-none overflow-hidden relative">
                  <div
                    className="bg-[#2d4a3e]/60 h-full transition-all duration-500"
                    style={{ width: `${(stageCounts.deployed / maxCount) * 100}%` }}
                  />
                </div>
                <span className="col-span-1 text-right font-bold text-[#1a1a1a]/80">{stageCounts.deployed}</span>
              </div>
            </div>
          </div>

          {/* Project Health Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-4 rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]">
              <span className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase block">Total Projects</span>
              <span className="text-2xl font-serif font-bold text-[#1a1a1a] block mt-1">
                {projects.length}
              </span>
            </div>

            <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-4 rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]">
              <span className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase block">Stalled Items</span>
              <span className={cn(
                "text-2xl font-serif font-bold block mt-1",
                stageCounts.review > 0 ? "text-[#9c3e3e]" : "text-[#1a1a1a]"
              )}>
                {stageCounts.review}
              </span>
            </div>

            <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-4 rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]">
              <span className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase block">Avg Days Idle</span>
              <span className="text-2xl font-serif font-bold text-[#1a1a1a] block mt-1">
                1.2d
              </span>
            </div>

            <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-4 rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]">
              <span className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase block">Total Est. Pipeline</span>
              <span className="text-2xl font-serif font-bold text-[#2d4a3e] block mt-1">
                $31.6k
              </span>
            </div>
          </div>

          {/* Project List / Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1a1a1a]">
              Active Workload Portfolio
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => {
                const isExpanded = project.id === expandedProjectId;
                const isSyncing = syncingStatus === project.id;

                return (
                  <div
                    key={project.id}
                    className={cn(
                      "border bg-[#faf9f5] transition-all flex flex-col rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]",
                      project.status === "stalled" ? "border-[#9c3e3e]/30" : "border-[#1a1a1a]/15"
                    )}
                  >
                    {/* Summary Row */}
                    <div
                      onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                      className={cn(
                        "p-4 cursor-pointer flex flex-col justify-between h-full select-none hover:bg-[#1a1a1a]/2",
                        isExpanded && "border-b border-[#1a1a1a]/10 bg-[#f4f2eb]/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-mono text-sm font-bold text-[#1a1a1a] uppercase">
                            {project.title}
                          </h3>
                          <span className="text-[10px] font-mono text-[#1a1a1a]/40">
                            LEAD: {project.owner}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-mono uppercase px-2 py-0.5 border font-semibold shrink-0",
                            project.status === "active" && "bg-[#2d4a3e]/15 text-[#2d4a3e] border-[#2d4a3e]/30",
                            project.status === "stalled" && "bg-[#9c3e3e]/15 text-[#9c3e3e] border-[#9c3e3e]/30",
                            project.status === "completed" && "bg-[#2d4a3e]/35 text-[#2d4a3e] border-[#2d4a3e]/40",
                            project.status === "pending" && "bg-[#c4903a]/15 text-[#c4903a] border-[#c4903a]/30"
                          )}
                        >
                          {project.status === "active" && "ACTIVE"}
                          {project.status === "stalled" && "STALLED"}
                          {project.status === "completed" && "COMPLETED"}
                          {project.status === "pending" && "DRAFT"}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-[#1a1a1a]/70 line-clamp-2 leading-relaxed mb-3">
                          {project.description}
                        </p>
                        <div className="flex items-center justify-between text-2xs font-mono text-[#1a1a1a]/50">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> PIPELINE VALUE: {project.pipelineValue}
                          </span>
                          <span>PROGRESS: {project.progress}%</span>
                        </div>
                      </div>

                      {/* Progress Strip bar */}
                      <div className="w-full bg-[#f4f2eb] border border-[#1a1a1a]/10 h-1.5 rounded-none overflow-hidden mb-1">
                        <div
                          className="bg-[#2d4a3e] h-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#1a1a1a]/40" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#1a1a1a]/40" />
                        )}
                      </div>
                    </div>

                    {/* Detailed Milestones Drawer */}
                    {isExpanded && (
                      <div className="p-4 border-t border-[#1a1a1a]/10 bg-[#faf9f5] space-y-4 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-2xs uppercase text-[#1a1a1a]/60">
                            Checklist Milestones
                          </h4>
                          {isSyncing && (
                            <span className="text-[10px] text-[#c4903a] flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> WRITING REDIS
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {project.milestones.map((m) => {
                            const isDone = project.completedMilestones.includes(m);
                            return (
                              <label
                                key={m}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 border cursor-pointer select-none rounded-none transition-all",
                                  isDone
                                    ? "bg-[#2d4a3e]/5 border-[#2d4a3e]/30 text-[#1a1a1a]/80"
                                    : "bg-[#f4f2eb]/30 border-[#1a1a1a]/10 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/25"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  disabled={isSyncing}
                                  onChange={() => toggleMilestone(project, m)}
                                  className="w-3.5 h-3.5 accent-[#2d4a3e] border-[#1a1a1a]/20 text-[#2d4a3e] focus:ring-0 shrink-0"
                                />
                                <span className={cn(isDone && "line-through text-[#1a1a1a]/40")}>
                                  {m}
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Status override trigger panel */}
                        <div className="pt-3 border-t border-[#1a1a1a]/10">
                          <h4 className="font-bold text-2xs uppercase text-[#1a1a1a]/60 mb-2">
                            Override Workflow Status
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {["active", "stalled", "completed", "pending"].map((st) => (
                              <button
                                key={st}
                                disabled={isSyncing || project.status === st}
                                onClick={() => handleStatusOverride(project, st as ProjectItem["status"])}
                                className={cn(
                                  "px-2.5 py-1 text-[10px] font-mono border transition-all rounded-none uppercase",
                                  project.status === st
                                    ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]"
                                    : "bg-transparent text-[#1a1a1a]/60 border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5"
                                )}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
