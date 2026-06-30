"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle,
  RefreshCw,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { acmiClient, type ACMIEvent, createWorkItem } from "@/lib/acmi-client";
import { fetchProjectActivity } from "@/lib/acmi-client";
import {
  projectsToRows,
  toActivityFeed,
  type ProjectRow,
  type ActivityFeedEntry
} from "@/lib/project-activity";

type ProjectItem = ProjectRow;
type ViewMode = "kanban" | "table" | "activity" | "git-vercel";

const AGENT_LIST = [
  "unassigned",
  "claude-engineer",
  "antigravity",
  "design-ui-designer",
  "design-brand-guardian",
  "design-whimsy-injector",
  "bentley",
  "ops-center"
];

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase animate-pulse">
          Loading Project Context...
        </p>
      </div>
    }>
      <ProjectsPageContent />
    </Suspense>
  );
}

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Core Data States
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [feed, setFeed] = useState<ActivityFeedEntry[]>([]);
  const [sourceMeta, setSourceMeta] = useState<{
    projectCount: number;
    workItemCount: number;
    timelineEventsScanned: number;
  } | null>(null);

  // UI Control States
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingStatus, setSyncingStatus] = useState<string | null>(null);
  const [now] = useState<number>(() => Date.now());

  // Project Creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectId, setNewProjectId] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectOwner, setNewProjectOwner] = useState("unassigned");
  const [newProjectPriority, setNewProjectPriority] = useState("P2");
  const [newProjectValue, setNewProjectValue] = useState("TBD");
  const [newProjectDeliverables, setNewProjectDeliverables] = useState("");
  const [newProjectMilestones, setNewProjectMilestones] = useState("");
  const [creating, setCreating] = useState(false);

  // New Milestone inline state
  const [newMilestoneText, setNewMilestoneText] = useState<Record<string, string>>({});

  // Timeline streams local cache
  const [projectTimelines, setProjectTimelines] = useState<Record<string, ACMIEvent[]>>({});
  const [loadingTimelines, setLoadingTimelines] = useState<Record<string, boolean>>({});

  // Git & Vercel states
  const [gitData, setGitData] = useState<{
    repo: any;
    pulls: any[];
    commits: any[];
    branches: any[];
    milestones: any[];
  } | null>(null);
  const [vercelData, setVercelData] = useState<{
    deployments: any[];
    source: string;
  } | null>(null);
  const [gitLoading, setGitLoading] = useState(false);
  const [vercelLoading, setVercelLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncingMirror, setSyncingMirror] = useState(false);

  const loadGitData = async () => {
    setGitLoading(true);
    try {
      const res = await fetch("/api/git");
      const data = await res.json();
      setGitData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGitLoading(false);
    }
  };

  const loadVercelData = async () => {
    setVercelLoading(true);
    try {
      const res = await fetch("/api/vercel");
      const data = await res.json();
      setVercelData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setVercelLoading(false);
    }
  };

  const triggerMirrorSync = async () => {
    setSyncingMirror(true);
    setSyncStatus(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/git/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(data.log || "Mirror synchronization complete!");
        await loadGitData(); // refresh commits
      } else {
        setSyncError(data.error || data.log || "Failed to trigger sync");
      }
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setSyncingMirror(false);
    }
  };

  useEffect(() => {
    if (viewMode === "git-vercel") {
      loadGitData();
      loadVercelData();
    }
  }, [viewMode]);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const rollup = await fetchProjectActivity();
      const rows = projectsToRows(rollup);
      setProjects(rows);
      setFeed(toActivityFeed(rollup, 50));
      setSourceMeta(rollup.source);
      
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
  }, [token]);

  // Milestone check / toggle
  const toggleMilestone = async (project: ProjectItem, milestone: string) => {
    const isCompleted = project.completedMilestones.includes(milestone);
    const updatedCompleted = isCompleted
      ? project.completedMilestones.filter((m) => m !== milestone)
      : [...project.completedMilestones, milestone];

    const progress = project.milestones.length === 0
      ? 0
      : Math.round((updatedCompleted.length / project.milestones.length) * 100);
    const viewStatus: ProjectItem["status"] =
      progress === 100 ? "completed" : project.status === "completed" ? "active" : project.status;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, completedMilestones: updatedCompleted, progress, status: viewStatus }
          : p
      )
    );

    setSyncingStatus(project.id);
    try {
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

  // Add a new milestone inline
  const handleAddMilestoneInline = async (project: ProjectItem) => {
    const text = newMilestoneText[project.id]?.trim();
    if (!text) return;

    const updatedMilestones = [...project.milestones, text];
    const progress = Math.round((project.completedMilestones.length / updatedMilestones.length) * 100);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, milestones: updatedMilestones, progress }
          : p
      )
    );
    setNewMilestoneText(prev => ({ ...prev, [project.id]: "" }));
    setSyncingStatus(project.id);

    try {
      // Re-save deliverables/milestones metadata in the profile
      const acmiStatus = (project.status === "completed" ? "completed" : project.status) as
        | "active"
        | "stalled"
        | "completed"
        | "pending";
      await acmiClient.updateWorkItemMilestones(project.id, project.completedMilestones, progress, acmiStatus);
      
      // Post timeline event
      await acmiClient.acmiCall("acmi_work_event", {
        id: project.id,
        source: "user:operator",
        summary: `[milestone-added] Operator defined new milestone requirement: ${text}`
      });

      setSyncingStatus(null);
    } catch (err) {
      console.error("Failed to add milestone:", err);
      setSyncingStatus(null);
    }
  };

  // Update project status override (funnel transition)
  const handleStatusOverride = async (project: ProjectItem, nextStatus: ProjectItem["status"]) => {
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

  // Project owner reassignment
  const handleOwnerReassign = async (project: ProjectItem, nextOwner: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, owner: `agent:${nextOwner}` } : p))
    );
    setSyncingStatus(project.id);

    try {
      // Fetch latest profile
      const workData = await acmiClient.acmiCall("acmi_get", { namespace: "work", id: project.id });
      const currentProfile = workData?.profile || {};
      
      const updatedProfile = {
        ...currentProfile,
        owner: nextOwner === "unassigned" ? "unassigned" : `agent:${nextOwner}`
      };

      await Promise.all([
        acmiClient.acmiCall("acmi_work_signal", {
          id: project.id,
          signals: JSON.stringify({ owner: updatedProfile.owner })
        }),
        acmiClient.acmiCall("acmi_work_event", {
          id: project.id,
          source: "user:operator",
          summary: `[reassigned] Reassigned project owner to ${nextOwner}`
        }),
        // Overwrite profile with the updated owner
        acmiClient.acmiCall("acmi_work_create", updatedProfile)
      ]);

      setSyncingStatus(null);
    } catch (err) {
      console.error("Failed to reassign owner:", err);
      setSyncingStatus(null);
    }
  };

  // Create Project submit
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectId || !newProjectTitle) return;
    setCreating(true);

    const deliverables = newProjectDeliverables
      ? newProjectDeliverables.split(",").map(s => s.trim())
      : [];
    const milestones = newProjectMilestones
      ? newProjectMilestones.split(",").map(s => s.trim())
      : [];

    const owner = newProjectOwner === "unassigned" ? "unassigned" : `agent:${newProjectOwner}`;

    try {
      await createWorkItem(newProjectId.trim().toLowerCase(), {
        title: newProjectTitle.trim(),
        description: newProjectDesc.trim(),
        owner,
        priority: newProjectPriority as "P0" | "P1" | "P2" | "P3",
        status: "pending",
        deliverables
      });

      // If milestones are defined, register them using milestone update helper
      if (milestones.length > 0) {
        await acmiClient.updateWorkItemMilestones(newProjectId, [], 0, "pending");
      }

      setShowCreateModal(false);
      // Clear inputs
      setNewProjectId("");
      setNewProjectTitle("");
      setNewProjectDesc("");
      setNewProjectOwner("unassigned");
      setNewProjectPriority("P2");
      setNewProjectValue("TBD");
      setNewProjectDeliverables("");
      setNewProjectMilestones("");
      
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Error seeding project keys.");
    } finally {
      setCreating(false);
    }
  };

  // Pipeline math aggregations
  const stageCounts = useMemo(() => ({
    ideas: projects.filter((p) => p.status === "pending").length,
    inProgress: projects.filter((p) => p.status === "active").length,
    review: projects.filter((p) => p.status === "stalled").length,
    deployed: projects.filter((p) => p.status === "completed").length,
    revenueSum: projects
      .filter((p) => p.status === "completed" && p.pipelineValue !== "TBD")
      .reduce((sum, p) => {
        const val = Number(p.pipelineValue.replace(/[^0-9]/g, ""));
        return sum + (isNaN(val) ? 0 : val);
      }, 0)
  }), [projects]);

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
    p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase animate-pulse">
          Establishing timeline connection...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Redesigned Command Header */}
      <header className="relative border border-border bg-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-2xl" />
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif">
            Swarm <span className="text-primary italic font-light font-sans">Project Deck</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">
            High-Fidelity Project Management Console & Deliverables Pipeline
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-secondary p-1 border border-border">
            {(["kanban", "table", "activity", "git-vercel"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1 font-mono text-[9px] uppercase tracking-wider border transition-colors cursor-pointer",
                  viewMode === mode
                    ? "bg-primary text-[#0F2A2E] border-primary font-bold"
                    : "bg-transparent text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {mode === "git-vercel" ? "Git & Vercel" : mode}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary-hover text-[#0F2A2E] rounded-none font-mono text-[10px] uppercase h-8 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Seed Project
          </Button>
        </div>
      </header>

      {/* Project KPI board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-border bg-card rounded-2xl hover:border-primary/45 transition-all shadow-md">
          <CardHeader className="pb-2">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Total Portfolios</span>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-serif font-bold text-foreground">{projects.length}</div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-2xl hover:border-primary/45 transition-all shadow-md">
          <CardHeader className="pb-2">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Active Funnels</span>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-serif font-bold text-primary">{stageCounts.inProgress}</div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-2xl hover:border-primary/45 transition-all shadow-md">
          <CardHeader className="pb-2">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Average Days Idle</span>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-serif font-bold text-foreground">{avgDaysIdle}</div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-2xl hover:border-primary/45 transition-all shadow-md">
          <CardHeader className="pb-2">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Shipped Portfolios</span>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-serif font-bold text-primary">
              {stageCounts.deployed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input bar */}
      <div className="flex items-center gap-3 bg-secondary p-3 border border-border">
        <Search className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        <input
          type="text"
          placeholder="Search by ID, title, or owner..."
          className="bg-transparent border-0 text-xs font-mono text-foreground focus:outline-none uppercase w-full placeholder-muted-foreground/40"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* View Rendering Switch */}

      {/* 1. KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Column Draft/Pending */}
          <KanbanColumn
            title="Draft / Pending"
            count={stageCounts.ideas}
            projects={filteredProjects.filter(p => p.status === "pending")}
            expandedId={expandedProjectId}
            setExpandedId={setExpandedProjectId}
            onStatusChange={handleStatusOverride}
            onMilestoneToggle={toggleMilestone}
            onAddMilestone={handleAddMilestoneInline}
            newMilestoneText={newMilestoneText}
            setNewMilestoneText={setNewMilestoneText}
            syncing={syncingStatus}
            onOwnerChange={handleOwnerReassign}
          />
          
          {/* Column Active */}
          <KanbanColumn
            title="In Progress"
            count={stageCounts.inProgress}
            projects={filteredProjects.filter(p => p.status === "active")}
            expandedId={expandedProjectId}
            setExpandedId={setExpandedProjectId}
            onStatusChange={handleStatusOverride}
            onMilestoneToggle={toggleMilestone}
            onAddMilestone={handleAddMilestoneInline}
            newMilestoneText={newMilestoneText}
            setNewMilestoneText={setNewMilestoneText}
            syncing={syncingStatus}
            onOwnerChange={handleOwnerReassign}
          />

          {/* Column Stalled / Review */}
          <KanbanColumn
            title="Review / Stalled"
            count={stageCounts.review}
            projects={filteredProjects.filter(p => p.status === "stalled")}
            expandedId={expandedProjectId}
            setExpandedId={setExpandedProjectId}
            onStatusChange={handleStatusOverride}
            onMilestoneToggle={toggleMilestone}
            onAddMilestone={handleAddMilestoneInline}
            newMilestoneText={newMilestoneText}
            setNewMilestoneText={setNewMilestoneText}
            syncing={syncingStatus}
            onOwnerChange={handleOwnerReassign}
          />

          {/* Column Completed */}
          <KanbanColumn
            title="Completed"
            count={stageCounts.deployed}
            projects={filteredProjects.filter(p => p.status === "completed")}
            expandedId={expandedProjectId}
            setExpandedId={setExpandedProjectId}
            onStatusChange={handleStatusOverride}
            onMilestoneToggle={toggleMilestone}
            onAddMilestone={handleAddMilestoneInline}
            newMilestoneText={newMilestoneText}
            setNewMilestoneText={setNewMilestoneText}
            syncing={syncingStatus}
            onOwnerChange={handleOwnerReassign}
          />
        </div>
      )}

      {/* 2. TABLE VIEW */}
      {viewMode === "table" && (
        <Card className="border border-border bg-card rounded-2xl shadow-md overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Workload Portfolio Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border bg-secondary text-muted-foreground uppercase font-bold tracking-wider text-[10px]">
                    <th className="p-3 pl-4">Project ID</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Lead Owner</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3 text-right pr-4">Pipeline Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="p-3 pl-4 font-bold text-primary">{project.id}</td>
                      <td className="p-3 max-w-[200px] truncate font-sans text-foreground/80 font-bold">{project.title}</td>
                      <td className="p-3 text-foreground/70 uppercase">{project.owner.replace("agent:", "")}</td>
                      <td className="p-3">
                        <Badge className="bg-secondary text-foreground text-[8px] rounded-none">P2</Badge>
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-none font-bold text-[8px] border uppercase",
                          project.status === "active" && "bg-primary/10 text-primary border-primary/20",
                          project.status === "stalled" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          project.status === "completed" && "bg-primary/20 text-primary border-primary/30",
                          project.status === "pending" && "bg-secondary text-muted-foreground border-border"
                        )}>
                          {project.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="w-8 shrink-0">{project.progress}%</span>
                          <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right pr-4 font-bold text-[#7DB8FF]">{project.pipelineValue}</td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground/35 font-mono">
                        No projects defined.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. ACTIVITY STREAM VIEW */}
      {viewMode === "activity" && (
        <Card className="border border-border bg-card rounded-2xl shadow-md">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Live Fleet Action Log Feed</span>
              <Badge className="bg-primary text-primary-foreground rounded-none text-[8px]">
                {feed.length} logged events
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="max-h-[500px] overflow-y-auto font-mono text-[11px] leading-relaxed divide-y divide-border/20">
              {feed.map((ev, idx) => (
                <div key={ev.id || idx} className="py-2.5 flex items-start gap-2 hover:bg-secondary/40 px-2">
                  <span className="text-[9px] text-muted-foreground/50 uppercase w-12 shrink-0">{ev.rel}</span>
                  <span className="text-primary font-bold w-48 truncate shrink-0">@{ev.projectTitle}</span>
                  <span className="text-[#7DB8FF] uppercase shrink-0 w-24">[{ev.kind}]</span>
                  <span className="text-foreground/80 flex-1">{ev.summary}</span>
                </div>
              ))}
              {feed.length === 0 && (
                <div className="text-center py-12 text-muted-foreground/30">
                  No logged activity stream traces recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. GIT & VERCEL TELEMETRY VIEW */}
      {viewMode === "git-vercel" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Git & Mirror Control Center */}
          <div className="space-y-6">
            <Card className="border border-border bg-card rounded-2xl shadow-md">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Gitea Local Mirror Console
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground uppercase font-mono">
                  Sync repository mirror: GitHub ⇆ Local Gitea (VM Host)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="bg-secondary p-4 border border-border/40 font-mono text-[10px] space-y-1.5 uppercase">
                  <div><span className="text-muted-foreground">Local Mirror:</span> <span className="text-[#7DB8FF] select-all">http://localhost:3001/madezmedia/gsd-dashboard.git</span></div>
                  <div><span className="text-muted-foreground">Origin Upstream:</span> <span className="text-foreground/80 select-all">https://github.com/madezmedia/gsd-dashboard-nextjs.git</span></div>
                  <div><span className="text-muted-foreground">Tunnel Port:</span> <span className="text-primary font-bold">3001 ⇆ 172.17.0.1:3000 (VM Gitea)</span></div>
                </div>

                <div className="flex gap-2">
                  <Button
                    disabled={syncingMirror}
                    onClick={triggerMirrorSync}
                    className="flex-1 bg-primary hover:bg-primary-hover text-[#0F2A2E] font-mono text-[10px] uppercase h-9 rounded-none cursor-pointer"
                  >
                    {syncingMirror ? (
                      <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Synchronizing...</span>
                    ) : "Trigger Mirror Push"}
                  </Button>
                </div>

                {syncStatus && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-1">
                    <span className="text-[8px] font-mono text-primary uppercase block">✓ Execution log:</span>
                    <pre className="text-[9px] font-mono text-muted-foreground/80 overflow-x-auto whitespace-pre-wrap leading-normal select-all">
                      {syncStatus}
                    </pre>
                  </div>
                )}

                {syncError && (
                  <div className="p-3 bg-red-500/5 border border-red-500/25 rounded-xl space-y-1">
                    <span className="text-[8px] font-mono text-red-400 uppercase block">⚠️ Sync error:</span>
                    <pre className="text-[9px] font-mono text-red-300 overflow-x-auto whitespace-pre-wrap leading-normal">
                      {syncError}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commits timeline */}
            <Card className="border border-border bg-card rounded-2xl shadow-md">
              <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Repo Commit History
                </CardTitle>
                <Badge variant="outline" className="text-[8px] font-mono rounded-none uppercase">
                  {gitLoading ? "Loading..." : `${gitData?.commits?.length || 0} commits`}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {gitLoading ? (
                  <div className="p-12 text-center text-muted-foreground/40 font-mono text-[10px] uppercase">
                    Fetching commit history...
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border/30 font-mono text-[11px]">
                    {gitData?.commits?.map((c: { sha: string; author: string; message: string; date: string }) => (
                      <div key={c.sha} className="p-3 hover:bg-secondary/40 transition-colors flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="text-foreground/85 font-sans font-medium line-clamp-1 leading-normal">
                            {c.message}
                          </p>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60 uppercase font-mono">
                            <span className="text-primary font-bold">@{c.author}</span>
                            <span>·</span>
                            <span>{new Date(c.date).toLocaleString()}</span>
                          </div>
                        </div>
                        <Badge className="bg-secondary border border-border text-[#7DB8FF] font-mono text-[9px] shrink-0 rounded-none uppercase select-all">
                          {c.sha}
                        </Badge>
                      </div>
                    ))}
                    {(!gitData || !gitData.commits || gitData.commits.length === 0) && (
                      <div className="p-12 text-center text-muted-foreground/30 uppercase">
                        No commits found.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Vercel Deployments */}
          <div className="space-y-6">
            <Card className="border border-border bg-card rounded-2xl shadow-md">
              <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Vercel Deployments Deck
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground uppercase font-mono">
                    Active build pipeline and environment status
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[8px] font-mono rounded-none uppercase bg-secondary text-primary border-border">
                  {vercelLoading ? "Loading..." : vercelData?.source || "ready"}
                </Badge>
              </CardHeader>
              <CardContent className="p-5">
                {vercelLoading ? (
                  <div className="py-12 text-center text-[#9BBCBE] font-mono text-[10px] uppercase">
                    Connecting Vercel telemetry...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vercelData?.deployments?.map((d: { id: string; url: string; state: string; creator: string; created: number; meta?: { githubCommitRef?: string; githubCommitSha?: string; githubCommitMessage?: string } }) => (
                      <div key={d.id} className="border border-border/60 bg-secondary/35 rounded-xl p-4 space-y-3 hover:border-primary/20 transition-all">
                        <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-2.5">
                          <div className="min-w-0">
                            <span className="font-mono text-[9px] text-muted-foreground uppercase block">Deployment URL</span>
                            <a
                              href={`https://${d.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-[#7DB8FF] hover:underline truncate block"
                            >
                              {d.url}
                            </a>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded-none font-mono font-bold text-[8px] border uppercase shrink-0",
                            d.state === "READY" && "bg-primary/10 text-primary border-primary/20",
                            d.state === "BUILDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
                            d.state === "ERROR" && "bg-red-500/10 text-red-400 border-red-500/20",
                            d.state === "CANCELED" && "bg-secondary text-muted-foreground border-border"
                          )}>
                            {d.state}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-muted-foreground uppercase leading-relaxed">
                          <div>
                            <span className="text-[8px] text-muted-foreground/50 block">Branch Source</span>
                            <span className="text-foreground/80 font-bold">{d.meta?.githubCommitRef || "main"}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-muted-foreground/50 block">Author</span>
                            <span className="text-primary font-bold">@{d.creator}</span>
                          </div>
                        </div>

                        {d.meta?.githubCommitMessage && (
                          <div className="p-2.5 bg-black/15 rounded-lg border border-border/30 font-mono text-[10px] space-y-1">
                            <div className="flex justify-between items-center text-[8px] text-muted-foreground/50 uppercase">
                              <span>Commit Message</span>
                              <span className="text-[#7DB8FF]">{d.meta.githubCommitSha}</span>
                            </div>
                            <p className="text-foreground/80 line-clamp-1 font-sans">{d.meta.githubCommitMessage}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center font-mono text-[8px] text-muted-foreground/45 uppercase pt-1">
                          <span>ID: {d.id}</span>
                          <span>{new Date(d.created).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {(!vercelData || !vercelData.deployments || vercelData.deployments.length === 0) && (
                      <div className="text-center py-12 text-muted-foreground/30 font-mono uppercase">
                        No active Vercel deployments logged.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── CREATE PROJECT MODAL ───────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="border border-border bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-border bg-secondary/30">
              <CardTitle className="text-sm font-bold tracking-wider uppercase font-mono text-foreground">
                Seed New Swarm Project
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground uppercase font-mono">
                Seas ACMI profiles and configures key timelines in Upstash
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateProject}>
              <CardContent className="p-5 space-y-4 text-xs font-mono">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wide block">Project Slug ID *</label>
                    <Input
                      placeholder="e.g. task-dashboard-v3"
                      required
                      value={newProjectId}
                      onChange={(e) => setNewProjectId(e.target.value)}
                      className="bg-background border-border text-xs h-8 rounded-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wide block">Owner Assignment</label>
                    <select
                      value={newProjectOwner}
                      onChange={(e) => setNewProjectOwner(e.target.value)}
                      className="w-full bg-background border border-border text-xs px-2.5 py-1.5 h-8 rounded-none font-mono text-foreground focus:outline-none uppercase"
                    >
                      {AGENT_LIST.map(agent => (
                        <option key={agent} value={agent}>{agent}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-wide block">Project Title *</label>
                  <Input
                    placeholder="Provide a concise title..."
                    required
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="bg-background border-border text-xs h-8 rounded-none font-sans font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-wide block">Description</label>
                  <textarea
                    placeholder="Scope of work details..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full min-h-[70px] bg-background border border-border text-xs p-2.5 rounded-none font-sans text-foreground focus:outline-none placeholder-muted-foreground/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wide block">Priority</label>
                    <select
                      value={newProjectPriority}
                      onChange={(e) => setNewProjectPriority(e.target.value)}
                      className="w-full bg-background border border-border text-xs px-2.5 py-1.5 h-8 rounded-none font-mono text-foreground focus:outline-none uppercase"
                    >
                      <option value="P0">P0 - Blocker</option>
                      <option value="P1">P1 - High</option>
                      <option value="P2">P2 - Normal</option>
                      <option value="P3">P3 - Low</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wide block">Pipeline Value</label>
                    <Input
                      placeholder="e.g. $5,000"
                      value={newProjectValue}
                      onChange={(e) => setNewProjectValue(e.target.value)}
                      className="bg-background border-border text-xs h-8 rounded-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-wide block">Deliverables (comma-separated)</label>
                  <Input
                    placeholder="e.g. route.ts, specs, timeline.tsx"
                    value={newProjectDeliverables}
                    onChange={(e) => setNewProjectDeliverables(e.target.value)}
                    className="bg-background border-border text-xs h-8 rounded-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-wide block">Milestone Requirements (comma-separated)</label>
                  <Input
                    placeholder="e.g. Draft Layouts, Integrate API, Core Review"
                    value={newProjectMilestones}
                    onChange={(e) => setNewProjectMilestones(e.target.value)}
                    className="bg-background border-border text-xs h-8 rounded-none font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-border/40">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-primary hover:bg-primary-hover text-[#0F2A2E] font-mono text-[10px] uppercase h-9 rounded-none cursor-pointer"
                  >
                    {creating ? "Seeding..." : "Publish Project"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-secondary font-mono text-[10px] uppercase h-9 rounded-none cursor-pointer"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                </div>

              </CardContent>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}

// ── KANBAN COLUMN COMPONENT ──────────────────────
function KanbanColumn({
  title,
  count,
  projects,
  expandedId,
  setExpandedId,
  onStatusChange,
  onMilestoneToggle,
  onAddMilestone,
  newMilestoneText,
  setNewMilestoneText,
  syncing,
  onOwnerChange
}: {
  title: string;
  count: number;
  projects: ProjectItem[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onStatusChange: (project: ProjectItem, next: ProjectItem["status"]) => void;
  onMilestoneToggle: (project: ProjectItem, milestone: string) => void;
  onAddMilestone: (project: ProjectItem) => void;
  newMilestoneText: Record<string, string>;
  setNewMilestoneText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  syncing: string | null;
  onOwnerChange: (project: ProjectItem, owner: string) => void;
}) {
  return (
    <div className="border border-border bg-card p-3 rounded-2xl flex flex-col gap-3 min-h-[500px]">
      <div className="border-b border-border pb-2 flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">{title}</span>
        <Badge variant="outline" className="text-[9px] px-1 font-mono uppercase bg-secondary text-primary border-border rounded-none">
          {count} projects
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {projects.map((project) => {
          const isExpanded = project.id === expandedId;
          const isSyncing = syncing === project.id;

          return (
            <div
              key={project.id}
              className={cn(
                "border bg-secondary/35 rounded-xl transition-all relative overflow-hidden",
                project.status === "stalled" ? "border-amber-500/30" : "border-border/60 hover:border-primary/20"
              )}
            >
              {/* Syncing indicator line */}
              {isSyncing && <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary animate-pulse" />}

              {/* Header block */}
              <div
                className="p-3.5 cursor-pointer flex flex-col gap-1 select-none"
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-foreground text-xs font-serif truncate max-w-[130px]">{project.title}</h4>
                  <Badge variant="outline" className="text-[8px] font-mono rounded-none tracking-tight uppercase shrink-0 py-0 leading-none h-4">
                    P2
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/60 uppercase">
                  <span>Lead: {project.owner.replace("agent:", "")}</span>
                  <span className="text-[#7DB8FF] font-bold">{project.pipelineValue}</span>
                </div>
                
                {/* Micro Progress Bar */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden border border-border/10">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="font-mono text-[9px] text-primary font-bold shrink-0">{project.progress}%</span>
                </div>
              </div>

              {/* Expanded details Console */}
              {isExpanded && (
                <div className="border-t border-border/40 p-3.5 bg-black/20 space-y-3 animate-in slide-in-from-top-1 duration-100">
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                    {project.description || "No project scope details provided."}
                  </p>

                  {/* Reassignment Dropdown */}
                  <div className="space-y-1 font-mono text-[9px]">
                    <label className="text-muted-foreground/60 uppercase block">Assign Lead Owner:</label>
                    <select
                      value={project.owner.replace("agent:", "")}
                      onChange={(e) => onOwnerChange(project, e.target.value)}
                      disabled={isSyncing}
                      className="w-full bg-background border border-border text-[9px] px-2 py-1 h-7 rounded-none font-mono text-foreground focus:outline-none uppercase cursor-pointer"
                    >
                      {AGENT_LIST.map(agent => (
                        <option key={agent} value={agent}>{agent}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status columns re-routing */}
                  <div className="space-y-1 font-mono text-[9px]">
                    <label className="text-muted-foreground/60 uppercase block">Status Column Route:</label>
                    <div className="grid grid-cols-4 gap-1">
                      {(["pending", "active", "stalled", "completed"] as ProjectItem["status"][]).map(st => (
                        <button
                          key={st}
                          disabled={isSyncing}
                          onClick={() => onStatusChange(project, st)}
                          className={cn(
                            "px-1 py-0.5 rounded-none border text-[8px] uppercase tracking-tighter truncate text-center cursor-pointer",
                            project.status === st
                              ? "bg-primary text-[#0F2A2E] border-primary font-bold"
                              : "bg-background text-muted-foreground border-border/40 hover:text-foreground"
                          )}
                        >
                          {st === "pending" ? "draft" : st === "stalled" ? "stall" : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deliverables tags */}
                  {project.tasks.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-muted-foreground/60 uppercase block">Work Items (Tasks):</span>
                      <div className="flex flex-wrap gap-1">
                        {project.tasks.map(t => (
                          <Badge key={t.id} variant="outline" className="text-[8px] rounded-none px-1 py-0 bg-secondary text-foreground/80 font-mono">
                            {t.id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones Check-list */}
                  <div className="space-y-2 border-t border-border/30 pt-3">
                    <span className="font-mono text-[9px] text-muted-foreground/60 uppercase block">Milestones Verification:</span>
                    <div className="space-y-1.5">
                      {project.milestones.map((m, idx) => {
                        const isDone = project.completedMilestones.includes(m);
                        return (
                          <div
                            key={idx}
                            onClick={() => !isSyncing && onMilestoneToggle(project, m)}
                            className="flex items-center gap-2 cursor-pointer select-none group font-sans text-xs"
                          >
                            <div className={cn(
                              "h-3.5 w-3.5 border rounded-sm flex items-center justify-center transition-all shrink-0",
                              isDone ? "bg-primary border-primary text-[#0F2A2E]" : "border-border bg-background group-hover:border-primary/50"
                            )}>
                              {isDone && <CheckCircle className="h-3 w-3" />}
                            </div>
                            <span className={cn(
                              "text-[11px] leading-tight transition-colors",
                              isDone ? "line-through text-muted-foreground/50" : "text-foreground/80"
                            )}>
                              {m}
                            </span>
                          </div>
                        );
                      })}
                      {project.milestones.length === 0 && (
                        <p className="text-[10px] text-muted-foreground/30 font-mono italic">No milestones defined.</p>
                      )}
                    </div>

                    {/* Add Milestone input inline */}
                    <div className="flex gap-1.5 pt-1.5">
                      <input
                        type="text"
                        placeholder="Add custom milestone..."
                        disabled={isSyncing}
                        className="flex-1 bg-background border border-border px-2 py-1 rounded-none text-[10px] font-mono text-foreground focus:outline-none"
                        value={newMilestoneText[project.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewMilestoneText(prev => ({ ...prev, [project.id]: val }));
                        }}
                      />
                      <Button
                        size="icon"
                        disabled={isSyncing}
                        onClick={() => onAddMilestone(project)}
                        className="h-6 w-6 rounded-none bg-primary text-[#0F2A2E] hover:bg-primary-hover shrink-0 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground/25 font-mono text-[10px] uppercase border border-dashed border-border rounded-xl bg-secondary/5">
            Column Empty
          </div>
        )}
      </div>
    </div>
  );
}
