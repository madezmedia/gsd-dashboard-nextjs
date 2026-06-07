"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
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
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { acmiClient, type ACMIEvent } from "@/lib/acmi-client";
import { fetchProjectActivity } from "@/lib/acmi-client";
import {
  projectsToRows,
  toActivityFeed,
  type ProjectRow,
  type ActivityFeedEntry,
} from "@/lib/project-activity";

type ProjectItem = ProjectRow;

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [feed, setFeed] = useState<ActivityFeedEntry[]>([]);
  const [sourceMeta, setSourceMeta] = useState<{
    projectCount: number;
    workItemCount: number;
    timelineEventsScanned: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingStatus, setSyncingStatus] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const [projectTimelines, setProjectTimelines] = useState<Record<string, ACMIEvent[]>>({});
  const [loadingTimelines, setLoadingTimelines] = useState<Record<string, boolean>>({});
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  // Re-derive project-scoped event array from real ACMI timeline
  const loadTimeline = async (projectId: string) => {
    setLoadingTimelines((prev) => ({ ...prev, [projectId]: true }));
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const events: ACMIEvent[] = project.recentEvents.map((e, i) => ({
        id: e.id,
        ts: new Date(e.ts).toISOString(),
        source: e.source,
        kind: e.kind,
        summary: e.summary,
        correlationId: e.correlationId,
        payload: undefined,
        origin: "work" as const,
      }));
      setProjectTimelines((prev) => ({ ...prev, [projectId]: events }));
    } catch (err) {
      console.error(`Failed to load timeline for ${projectId}:`, err);
    } finally {
      setLoadingTimelines((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Load REAL project activity from ACMI (25 projects + 249 work items + thread timeline)
  const loadData = async () => {
    setLoading(true);
    try {
      const rollup = await fetchProjectActivity();
      const rows = projectsToRows(rollup);
      setProjects(rows);
      setFeed(toActivityFeed(rollup, 50));
      setSourceMeta(rollup.source);
      setNow(Date.now());
      // Honor ?focus=<id> deep link from kanban / calendar
      const focus = searchParams?.get("focus");
      if (focus) setExpandedProjectId(focus);
    } catch (err) {
      console.error("Error loading project activity:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Handle milestone checking toggle
  const toggleMilestone = async (project: ProjectItem, milestone: string) => {
    const isCompleted = project.completedMilestones.includes(milestone);
    const updatedCompleted = isCompleted
      ? project.completedMilestones.filter((m) => m !== milestone)
      : [...project.completedMilestones, milestone];

    // Calculate progress fraction
    const progress = project.milestones.length === 0
      ? 0
      : Math.round((updatedCompleted.length / project.milestones.length) * 100);
    const viewStatus: ProjectItem["status"] =
      progress === 100 ? "completed" : project.status === "completed" ? "active" : project.status;

    // Optimistically update locally
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, completedMilestones: updatedCompleted, progress, status: viewStatus }
          : p
      )
    );

    setSyncingStatus(project.id);

    try {
      // Direct integration mapping writes back to Upstash Redis
      // Map view status to ACMI work status ladder
      const acmiStatus = (viewStatus === "completed" ? "completed" : viewStatus) as
        | "active"
        | "stalled"
        | "completed"
        | "pending";
      await acmiClient.updateWorkItemMilestones(project.id, updatedCompleted, progress, acmiStatus);
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

  const totalTaskCount = useMemo(
    () => projects.reduce((sum, p) => sum + p.tasks.length, 0),
    [projects]
  );
  const avgDaysIdle = useMemo(() => {
    const ages = projects
      .map((p) => (p.lastActivityTs ? (now - p.lastActivityTs) / (1000 * 60 * 60 * 24) : null))
      .filter((v): v is number => v !== null);
    if (ages.length === 0) return "—";
    const avg = ages.reduce((s, v) => s + v, 0) / ages.length;
    return `${avg.toFixed(1)}d`;
  }, [projects, now]);

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
                {avgDaysIdle}
              </span>
            </div>

            <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-4 rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]">
              <span className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase block">Tasks (Work Items)</span>
              <span className="text-2xl font-serif font-bold text-[#2d4a3e] block mt-1">
                {totalTaskCount}
              </span>
              <span className="text-[9px] font-mono text-[#1a1a1a]/40 uppercase">
                of {sourceMeta?.workItemCount ?? 0} ACMI work items
              </span>
            </div>
          </div>

          {/* Project List / Grid */}
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1a1a1a]">
                Active Workload Portfolio
              </h2>
              <div className="text-[10px] font-mono text-[#1a1a1a]/40 uppercase">
                {sourceMeta ? (
                  <>
                    sourced from {sourceMeta.projectCount} ACMI projects · {sourceMeta.workItemCount} work items · {sourceMeta.timelineEventsScanned} timeline events
                  </>
                ) : null}
              </div>
            </div>

            {feed.length > 0 && (
              <details className="border border-[#1a1a1a]/15 bg-[#f4f2eb] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]">
                <summary className="cursor-pointer select-none p-3 text-xs font-mono uppercase tracking-wider text-[#2d4a3e] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Live Fleet Activity ({feed.length} events)
                </summary>
                <ul className="max-h-64 overflow-y-auto border-t border-[#1a1a1a]/10 bg-[#faf9f5] divide-y divide-[#1a1a1a]/5">
                  {feed.map((ev) => (
                    <li
                      key={ev.id}
                      id={`evt-${ev.id}`}
                      className="p-2.5 text-[11px] font-mono flex items-start gap-2 hover:bg-[#f4f2eb]/60"
                    >
                      <span className="text-[9px] text-[#1a1a1a]/40 uppercase shrink-0 w-12">{ev.rel}</span>
                      <span className="text-[#1a1a1a]/80 font-bold shrink-0 w-44 truncate">@{ev.projectTitle}</span>
                      <span className="text-[#2d4a3e] shrink-0 text-[9px] uppercase">[{ev.kind}]</span>
                      <span className="text-[#1a1a1a]/70 line-clamp-1">{ev.summary}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

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
                      onClick={() => {
                        const nextId = isExpanded ? null : project.id;
                        setExpandedProjectId(nextId);
                        if (nextId) {
                          loadTimeline(nextId);
                        }
                      }}
                      className={cn(
                        "p-4 cursor-pointer flex flex-col justify-between h-full select-none hover:bg-[#1a1a1a]/2",
                        isExpanded && "border-b border-[#1a1a1a]/10 bg-[#f4f2eb]/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-mono text-sm font-bold text-[#1a1a1a] uppercase truncate">
                            {project.title}
                          </h3>
                          <span className="text-[10px] font-mono text-[#1a1a1a]/40 block">
                            LEAD: {project.owner}
                          </span>
                          <span className="text-[9px] font-mono text-[#1a1a1a]/30 uppercase block">
                            {project.lastActivityLabel} · {project.tasks.length} task{project.tasks.length === 1 ? "" : "s"}
                            {project.section ? ` · ${project.section}` : ""}
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
                            const milestoneName = typeof m === "string" ? m : m.name;
                            const isDone = project.completedMilestones.includes(milestoneName);
                            return (
                              <label
                                key={milestoneName}
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
                                  onChange={() => toggleMilestone(project, milestoneName)}
                                  className="w-3.5 h-3.5 accent-[#2d4a3e] border-[#1a1a1a]/20 text-[#2d4a3e] focus:ring-0 shrink-0"
                                />
                                <span className={cn(isDone && "line-through text-[#1a1a1a]/40")}>
                                  {milestoneName}
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Live Audit Trail Log Panel */}
                        <div className="pt-3 border-t border-[#1a1a1a]/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-2xs uppercase text-[#1a1a1a]/60 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#2d4a3e]" /> Live Audit Trail
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                loadTimeline(project.id);
                              }}
                              disabled={loadingTimelines[project.id]}
                              className="text-[9px] font-mono uppercase text-[#2d4a3e] hover:underline flex items-center gap-1 font-bold"
                            >
                              <RefreshCw className={cn("w-2.5 h-2.5", loadingTimelines[project.id] && "animate-spin")} />
                              REFRESH
                            </button>
                          </div>

                          {loadingTimelines[project.id] && !projectTimelines[project.id] ? (
                            <div className="flex items-center justify-center py-6 text-[10px] font-mono uppercase text-[#1a1a1a]/40 gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2d4a3e]" />
                              Retrieving work logs...
                            </div>
                          ) : (
                            <div className="max-h-48 overflow-y-auto border border-[#1a1a1a]/10 bg-[#f4f2eb]/40 p-2 space-y-2 rounded-none">
                              {projectTimelines[project.id] && projectTimelines[project.id].length > 0 ? (
                                projectTimelines[project.id].map((evt, idx) => {
                                  const eventTs = evt.ts ? (typeof evt.ts === "number" ? evt.ts : new Date(evt.ts).getTime()) : Date.now();
                                  const formattedTime = formatRelativeTime(eventTs);
                                  
                                  const isSystem = evt.source.includes("system") || evt.source.includes("acmi-client");
                                  const isMilestone = evt.summary.includes("[milestone") || evt.summary.includes("[milestone-completed]") || evt.kind === "work-created";
                                  const isError = evt.kind?.includes("error") || evt.summary.toLowerCase().includes("fail") || evt.summary.toLowerCase().includes("error");

                                  const borderStyle = isError
                                    ? "border-[#9c3e3e]/30 bg-[#9c3e3e]/2 text-[#9c3e3e]"
                                    : isMilestone
                                    ? "border-[#2d4a3e]/30 bg-[#2d4a3e]/2 text-[#2d4a3e]"
                                    : isSystem
                                    ? "border-[#1a1a1a]/15 bg-[#1a1a1a]/2 text-[#1a1a1a]/60"
                                    : "border-[#c4903a]/30 bg-[#c4903a]/2 text-[#c4903a]";

                                  const dotColor = isError
                                    ? "bg-[#9c3e3e]"
                                    : isMilestone
                                    ? "bg-[#2d4a3e]"
                                    : isSystem
                                    ? "bg-[#1a1a1a]/40"
                                    : "bg-[#c4903a]";

                                  const isEvtExpanded = !!expandedEvents[`${project.id}-${evt.id || idx}`];

                                  return (
                                    <div key={evt.id || idx} className="border border-[#1a1a1a]/5 bg-[#faf9f5] p-2 space-y-1 rounded-none text-[10px]">
                                      <div className="flex items-center justify-between text-[8px] gap-2">
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className={cn("h-1 w-1 rounded-full shrink-0", dotColor)} />
                                          <span className="font-bold text-[#1a1a1a]/80 uppercase">
                                            [{evt.source || "agent"}]
                                          </span>
                                          <span className={cn("px-1 py-0.2 border text-[6px] font-bold uppercase tracking-wider", borderStyle)}>
                                            {evt.kind || "event"}
                                          </span>
                                        </div>
                                        <span className="text-[#1a1a1a]/40 uppercase shrink-0">
                                          {formattedTime}
                                        </span>
                                      </div>
                                      <p className="text-[#1a1a1a]/85 leading-normal break-words font-mono text-[10px]">
                                        {evt.summary}
                                      </p>
                                      
                                      {!!evt.payload && (
                                        <div className="pt-1 border-t border-[#1a1a1a]/5 flex flex-col items-start">
                                          <button
                                            onClick={() => setExpandedEvents(prev => ({ ...prev, [`${project.id}-${evt.id || idx}`]: !isEvtExpanded }))}
                                            className="text-[8px] font-mono uppercase text-[#2d4a3e] hover:text-[#2d4a3e]/80 flex items-center gap-0.5 font-bold"
                                          >
                                            {isEvtExpanded ? "[-] Hide Payload" : "[+] Inspect Payload"}
                                          </button>
                                          {isEvtExpanded && (
                                            <pre className="mt-1 w-full bg-[#1a1a1a] text-[#f4f2eb] border border-[#1a1a1a]/10 p-1.5 font-mono text-[9px] overflow-x-auto rounded-none">
                                              {JSON.stringify(evt.payload, null, 2)}
                                            </pre>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-[10px] font-mono text-[#1a1a1a]/40 text-center py-4 uppercase">
                                  No event telemetry cached.
                                </p>
                              )}
                            </div>
                          )}
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
