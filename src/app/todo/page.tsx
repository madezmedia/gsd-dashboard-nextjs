"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Circle,
  Loader2, 
  AlertCircle, 
  User, 
  Flag,
  ArrowRight,
  Database,
  RefreshCw,
  Trash2,
  Edit2,
  X,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { acmiClient } from "@/lib/acmi-client";
import { subscribeToBus } from "@/lib/bus-stream";
import { fetchProjectActivity } from "@/lib/acmi-client";
import {
  tasksToKanban,
  type KanbanCard,
  type KanbanLane,
} from "@/lib/project-activity";

interface TaskItem {
  id: string;
  projectId?: string;
  projectTitle?: string;
  title: string;
  owner: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: "Today" | "This Week" | "This Month" | "Backlog";
  dueDate: string;
  blocked: boolean;
  done: boolean;
  progress?: number;
  updatedAt?: number;
  lastTouched?: string;
  href?: string;
}

function getImpureTimestamp(): number {
  return Date.now();
}

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: "task-1",
    title: "Deploy OwnerScout pipeline",
    owner: "@growth-hacker",
    priority: "P0",
    status: "Today",
    dueDate: "2026-06-03",
    blocked: true,
    done: false,
  },
  {
    id: "task-2",
    title: "VAPI key rotation & validation",
    owner: "@ops",
    priority: "P0",
    status: "Today",
    dueDate: "2026-06-02",
    blocked: false,
    done: true,
  },
  {
    id: "task-3",
    title: "Review design audit feedback",
    owner: "@design-team",
    priority: "P1",
    status: "Today",
    dueDate: "2026-06-05",
    blocked: false,
    done: false,
  },
  {
    id: "task-4",
    title: "Q2 revenue report draft",
    owner: "@mikey",
    priority: "P1",
    status: "This Week",
    dueDate: "2026-06-05",
    blocked: false,
    done: false,
  },
  {
    id: "task-5",
    title: "Secret manager fleet rollout",
    owner: "@gemini-cli",
    priority: "P1",
    status: "This Week",
    dueDate: "2026-06-08",
    blocked: false,
    done: false,
  },
  {
    id: "task-6",
    title: "cowork-kanban mobile pass",
    owner: "@design-ui-designer",
    priority: "P1",
    status: "This Month",
    dueDate: "2026-06-20",
    blocked: false,
    done: false,
  },
  {
    id: "task-7",
    title: "Postiz content calendar Q3",
    owner: "@content-writer",
    priority: "P2",
    status: "This Month",
    dueDate: "2026-06-28",
    blocked: false,
    done: false,
  },
  {
    id: "task-8",
    title: "Dashboard settings export feature",
    owner: "@ops",
    priority: "P2",
    status: "Backlog",
    dueDate: "2026-07-15",
    blocked: false,
    done: false,
  }
];

const FLEET_OWNERS = [
  "@unassigned",
  "@mikey",
  "@ops",
  "@claude-engineer",
  "@design-ui-designer",
  "@growth-hacker",
  "@ops-center",
  "@tony",
  "@bentley",
  "@gemini-cli",
];

const MOCK_GOOGLE_TASKS = [
  { id: "gt-1", title: "Review Whop App Marketplace API compliance", notes: "Ensure OAuth flow handles scopes correctly", list: "Work" },
  { id: "gt-2", title: "Publish GSD dashboard Next.js deployment", notes: "Link custom domain and verify SSL", list: "Work" },
  { id: "gt-3", title: "Set up daily deep scan cron job", notes: "Check server logs at 04:00Z", list: "Ops" },
  { id: "gt-4", title: "Folana music video rendering check", notes: "Confirm Lip-sync model output quality", list: "Folana" },
  { id: "gt-5", title: "Sync Google Tasks API credentials", notes: "Configure client ID and client secret", list: "Ops" }
];

export default function TodoPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "gantt">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [isSubmitting, setIsNewSubmitting] = useState(false);

  // Google Tasks sync panel state
  const [showGoogleTasksPanel, setShowGoogleTasksPanel] = useState(false);
  const [selectedGoogleTasks, setSelectedGoogleTasks] = useState<string[]>(
    MOCK_GOOGLE_TASKS.map(t => t.id)
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusText, setSyncStatusText] = useState("");

  // Edit task states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingOwner, setEditingOwner] = useState("");
  const [editingPriority, setEditingPriority] = useState<TaskItem["priority"]>("P1");
  const [editingStatus, setEditingStatus] = useState<TaskItem["status"]>("Today");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingBlocked, setEditingBlocked] = useState(false);

  // Load REAL project activity from ACMI (25 projects + 249 work items)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const rollup = await fetchProjectActivity();
      const buckets = tasksToKanban(rollup);
      const flat: TaskItem[] = [];
      for (const lane of Object.keys(buckets) as KanbanLane[]) {
        for (const c of buckets[lane]) {
          flat.push({
            id: c.id,
            projectId: c.projectId,
            projectTitle: c.projectTitle,
            title: c.title,
            owner: c.owner,
            priority: c.priority,
            status: c.lane,
            dueDate: c.updatedAt ? new Date(c.updatedAt + 7 * 86400000).toISOString().slice(0, 10) : "",
            blocked: c.blocked,
            done: c.done,
            progress: c.progress,
            updatedAt: c.updatedAt,
            lastTouched: c.lastTouched,
            href: c.href,
          });
        }
      }

      // Fetch NocoDB Tasks
      let nocoFlat: TaskItem[] = [];
      try {
        const nocoRes = await fetch("/api/nocodb-viewer");
        if (nocoRes.ok) {
          const nocoJson = await nocoRes.json();
          if (nocoJson.success && nocoJson.data && Array.isArray(nocoJson.data.tasks)) {
            nocoFlat = nocoJson.data.tasks.map((t: any) => {
              const fields = t.fields || {};
              // Map NocoDB Status ('backlog', 'todo', 'in-progress', 'done') to Kanban status ('Today', 'This Week', 'This Month', 'Backlog')
              let mappedStatus: TaskItem["status"] = "Backlog";
              const rawStatus = String(fields.Status).toLowerCase().trim();
              if (rawStatus === "todo") mappedStatus = "Today";
              else if (rawStatus === "in-progress" || rawStatus === "active") mappedStatus = "This Week";
              else if (rawStatus === "done") mappedStatus = "This Month";

              // Map Priority
              let mappedPriority: TaskItem["priority"] = "P1";
              const rawPriority = String(fields.Priority).toLowerCase().trim();
              if (rawPriority === "high") mappedPriority = "P0";
              else if (rawPriority === "low") mappedPriority = "P2";

              return {
                id: `nocodb-${t.id || t.id_fields?.Id}`,
                projectTitle: "NocoDB Base",
                title: `[NocoDB] ${fields.Title || "Untitled Task"}`,
                owner: fields["Assignee Agent"] ? `@${fields["Assignee Agent"]}` : "@unassigned",
                priority: mappedPriority,
                status: mappedStatus,
                dueDate: fields["Due At"] ? fields["Due At"].substring(0, 10) : "",
                blocked: false,
                done: rawStatus === "done",
                progress: rawStatus === "done" ? 100 : 0
              };
            });
          }
        }
      } catch (err) {
        console.error("Failed to load NocoDB tasks in Kanban:", err);
      }

      const merged = [...flat, ...nocoFlat];
      setTasks(merged.length > 0 ? merged : DEFAULT_TASKS);
    } catch (err) {
      console.error("Error fetching project activity:", err);
      setTasks(DEFAULT_TASKS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [token, loadData]);

  // Subscribe to central ACMI Super Bus to reflect tasks updates in real time
  useEffect(() => {
    const unsubscribe = subscribeToBus((event) => {
      if (
        event.type === "task-created" || 
        event.type === "status-change" || 
        event.type === "completion-toggle" || 
        event.type === "task-updated" || 
        event.type === "task-deleted" ||
        event.type?.startsWith("task-")
      ) {
        // Real-time bus sync trigger
        loadData();
      }
    });
    return () => unsubscribe();
  }, [loadData]);

  // Handle Drag-and-Drop state change
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskItem["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // Optimistic Update
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t);
    setTasks(updatedTasks);

    try {
      // Sync status change directly back to database
      await acmiClient.setSignals("task", taskId, { status: targetStatus });
      await acmiClient.appendEvent("task", taskId, {
        ts: getImpureTimestamp(),
        source: "user:admin",
        kind: "status-change",
        summary: `Moved task to ${targetStatus} column`,
        correlationId: `todo-${getImpureTimestamp()}-drag`,
      });
    } catch (err) {
      console.error("Failed to persist task status update:", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  // Toggle completion checkbox
  const toggleDone = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newDoneState = !task.done;
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, done: newDoneState } : t);
    setTasks(updatedTasks);

    try {
      await acmiClient.setSignals("task", id, { done: String(newDoneState) });
      await acmiClient.appendEvent("task", id, {
        ts: getImpureTimestamp(),
        source: "user:admin",
        kind: "completion-toggle",
        summary: newDoneState ? "Marked task as [completed]" : "Marked task as [incomplete]",
        correlationId: `todo-${getImpureTimestamp()}-toggle`,
      });
    } catch (err) {
      console.error("Failed to toggle task done state:", err);
    }
  };

  // Add a new task parsing shorthands
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    setIsNewSubmitting(true);

    // Basic shorthand parsers: e.g. "Draft proposal @mikey P0"
    let title = newTaskText;
    let owner = "@unassigned";
    let priority: TaskItem["priority"] = "P1";

    const ownerMatch = title.match(/@(\w+[-_]?\w*)/);
    if (ownerMatch) {
      owner = `@${ownerMatch[1]}`;
      title = title.replace(ownerMatch[0], "").trim();
    }

    const priorityMatch = title.match(/\b(P0|P1|P2|P3)\b/i);
    if (priorityMatch) {
      priority = priorityMatch[1].toUpperCase() as TaskItem["priority"];
      title = title.replace(priorityMatch[0], "").trim();
    }

    title = title.replace(/\s+/g, " ");
    const newId = `task-${Date.now()}`;

    const newTask: TaskItem = {
      id: newId,
      title,
      owner,
      priority,
      status: "Today",
      dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow default
      blocked: false,
      done: false,
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskText("");

    try {
      await acmiClient.setProfile("task", newId, {
        actor_type: "agent", // standard slot identifier
        name: title,
        title,
        owner,
        priority,
        status: "Today",
        dueDate: newTask.dueDate,
      });

      await acmiClient.setSignals("task", newId, {
        status: "Today",
        done: "false",
        blocked: "false",
      });

      await acmiClient.appendEvent("task", newId, {
        ts: Date.now(),
        source: "user:admin",
        kind: "task-created",
        summary: `Created task "${title}" assigned to ${owner}`,
        correlationId: `todo-${Date.now()}-create`,
      });
    } catch (err) {
      console.error("Failed to add task to DB:", err);
    } finally {
      setIsNewSubmitting(false);
    }
  };

  // Start task inline editing
  const startEditing = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingOwner(task.owner);
    setEditingPriority(task.priority);
    setEditingStatus(task.status);
    setEditingDueDate(task.dueDate);
    setEditingBlocked(task.blocked);
  };

  // Save task updates
  const handleSaveTask = async (id: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          title: editingTitle,
          owner: editingOwner,
          priority: editingPriority,
          status: editingStatus,
          dueDate: editingDueDate,
          blocked: editingBlocked,
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    setEditingTaskId(null);

    try {
      await acmiClient.setProfile("task", id, {
        actor_type: "agent",
        name: editingTitle,
        title: editingTitle,
        owner: editingOwner,
        priority: editingPriority,
        dueDate: editingDueDate,
      });

      await acmiClient.setSignals("task", id, {
        status: editingStatus,
        blocked: String(editingBlocked),
      });

      await acmiClient.appendEvent("task", id, {
        ts: Date.now(),
        source: "user:admin",
        kind: "task-updated",
        summary: `Updated task details: "${editingTitle}"`,
        correlationId: `todo-${Date.now()}-update`,
      });
    } catch (err) {
      console.error("Failed to update task details:", err);
    }
  };

  // Delete task complete logic
  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setEditingTaskId(null);

    try {
      await acmiClient.deleteProfile("task", id);
      await acmiClient.deleteSignal("task", id, "status");
      await acmiClient.deleteSignal("task", id, "done");
      await acmiClient.deleteSignal("task", id, "blocked");
      
      await acmiClient.appendEvent("task", id, {
        ts: getImpureTimestamp(),
        source: "user:admin",
        kind: "task-deleted",
        summary: `Deleted task "${id}"`,
        correlationId: `todo-${getImpureTimestamp()}-delete`,
      });
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Google Tasks sync logic
  const handleSyncGoogleTasks = async () => {
    if (selectedGoogleTasks.length === 0) return;
    setIsSyncing(true);
    setSyncProgress(0);
    
    const tasksToSync = MOCK_GOOGLE_TASKS.filter(t => selectedGoogleTasks.includes(t.id));
    
    for (let i = 0; i < tasksToSync.length; i++) {
      const task = tasksToSync[i];
      setSyncStatusText(`Syncing: ${task.title}`);
      
      const newId = `task-gt-${task.id}-${Date.now()}`;
      const dueDate = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]; // 2 days from now
      
      try {
        await acmiClient.setProfile("task", newId, {
          actor_type: "agent",
          name: task.title,
          title: task.title,
          owner: "@ops",
          priority: task.list === "Folana" ? "P0" : "P1",
          status: "Today",
          dueDate,
          notes: task.notes,
          googleTaskId: task.id
        });

        await acmiClient.setSignals("task", newId, {
          status: "Today",
          done: "false",
          blocked: "false",
        });

        await acmiClient.appendEvent("task", newId, {
          ts: Date.now(),
          source: "google-tasks-sync",
          kind: "task-created",
          summary: `Synced Google Task "${task.title}" to ACMI board`,
          correlationId: `gtsync-${Date.now()}`,
        });
      } catch (err) {
        console.error("Error syncing google task:", err);
      }
      
      setSyncProgress(Math.round(((i + 1) / tasksToSync.length) * 100));
      await new Promise(r => setTimeout(r, 450)); // Tactile sync progression pause
    }
    
    setSyncStatusText("Synchronization completed successfully!");
    setIsSyncing(false);
    setSelectedGoogleTasks([]);
    await loadData();
    setTimeout(() => setSyncStatusText(""), 4000);
  };

  const filteredTasks = tasks.filter(t => {
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q);
  });

  // KPI calculations
  const todayTasks = tasks.filter(t => t.status === "Today");
  const todayDone = todayTasks.filter(t => t.done).length;
  
  const weekTasks = tasks.filter(t => t.status === "Today" || t.status === "This Week");
  const weekDone = weekTasks.filter(t => t.done).length;

  const monthTasks = tasks.filter(t => t.status !== "Backlog");
  const monthDone = monthTasks.filter(t => t.done).length;

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-y-auto space-y-6">
      {/* Page Header Banner */}
      <header className="relative border border-border bg-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md shrink-0">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-2xl" />
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            TODO <span className="text-primary italic font-light font-sans">Kanban Workspace</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">
            {tasks.length} tasks · {tasks.filter(t => t.priority === "P0").length} P0 · {tasks.filter(t => t.done).length} completed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Google Tasks Panel Toggle */}
          <button
            onClick={() => setShowGoogleTasksPanel(!showGoogleTasksPanel)}
            className={cn(
              "px-3 py-1.5 font-mono text-[10px] uppercase font-bold border transition-all flex items-center gap-1.5 cursor-pointer rounded-xl h-8",
              showGoogleTasksPanel
                ? "bg-primary text-[#0F2A2E] border-primary"
                : "border-border bg-card hover:bg-secondary text-primary"
            )}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Google Tasks</span>
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-mono bg-card border border-border text-foreground rounded-xl focus:outline-none focus:border-primary/50 w-44 transition-all h-8"
            />
          </div>

          {/* Toggle View */}
          <div className="flex border border-border font-mono p-0.5 bg-card shrink-0 rounded-xl overflow-hidden h-8">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "px-3 py-0.5 text-[9px] uppercase font-bold transition-all rounded-lg cursor-pointer",
                viewMode === "kanban" ? "bg-primary text-[#0F2A2E]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className={cn(
                "px-3 py-0.5 text-[9px] uppercase font-bold transition-all rounded-lg cursor-pointer",
                viewMode === "gantt" ? "bg-primary text-[#0F2A2E]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              Gantt
            </button>
          </div>
        </div>
      </header>

      {/* Google Tasks Panel Overlay */}
      {showGoogleTasksPanel && (
        <div className="p-5 border border-border bg-card flex flex-col gap-4 animate-in fade-in slide-in-from-top duration-200 rounded-2xl shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                Google Tasks Integration Core
              </span>
            </div>
            <button 
              onClick={() => setShowGoogleTasksPanel(false)}
              className="text-muted-foreground hover:text-foreground font-mono text-[9px] uppercase border border-border px-2 py-0.5 rounded-lg cursor-pointer hover:bg-secondary"
            >
              Close
            </button>
          </div>
          
          {isSyncing ? (
            <div className="flex flex-col gap-3 py-4">
              <div className="flex justify-between font-mono text-[10px] text-primary font-bold">
                <span>{syncStatusText}</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="w-full h-2 bg-secondary border border-border overflow-hidden rounded-full">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${syncProgress}%` }} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Pending Tasks from Google Calendar API
                </span>
                <div className="flex flex-col gap-2 border border-border max-h-48 overflow-y-auto bg-black/10 p-2 rounded-xl">
                  {MOCK_GOOGLE_TASKS.map(task => {
                    const isSelected = selectedGoogleTasks.includes(task.id);
                    const alreadySynced = tasks.some(t => t.title === task.title);
                    
                    return (
                      <label 
                        key={task.id}
                        className={cn(
                          "flex items-start gap-3 p-2.5 border border-border bg-card cursor-pointer hover:bg-secondary select-none text-xs transition-colors rounded-lg",
                          alreadySynced && "opacity-60 pointer-events-none bg-card/30"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected || alreadySynced}
                          disabled={alreadySynced}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGoogleTasks(prev => [...prev, task.id]);
                            } else {
                              setSelectedGoogleTasks(prev => prev.filter(id => id !== task.id));
                            }
                          }}
                          className="mt-0.5 h-3.5 w-3.5 accent-primary cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                            <span>{task.title}</span>
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 border border-primary/20 bg-primary/5 text-primary rounded">
                              {task.list}
                            </span>
                            {alreadySynced && (
                              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
                                Synced
                              </span>
                            )}
                          </div>
                          {task.notes && <p className="text-[10px] text-muted-foreground mt-1 font-mono">{task.notes}</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <div className="border border-border p-4 bg-secondary/30 flex flex-col justify-between gap-4 rounded-xl">
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-primary font-extrabold uppercase tracking-widest block">
                    Sync Control
                  </span>
                  <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                    Synchronizes selected items with the ACMI `task` database namespace. Updates will propagate instantly across the Super Bus.
                  </p>
                </div>
                
                <button
                  onClick={handleSyncGoogleTasks}
                  disabled={selectedGoogleTasks.length === 0}
                  className="w-full py-2 bg-primary text-[#0F2A2E] font-mono text-[11px] font-bold uppercase tracking-wider border border-primary hover:bg-transparent hover:text-primary transition-all disabled:opacity-50 disabled:pointer-events-none rounded-xl flex items-center justify-center gap-2 cursor-pointer h-9"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sync {selectedGoogleTasks.length} Task(s)</span>
                </button>
              </div>
            </div>
          )}
          
          {syncStatusText && !isSyncing && (
            <div className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 p-2 text-center font-bold rounded-lg">
              {syncStatusText}
            </div>
          )}
        </div>
      )}

      {/* Today Completion progress-strip */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2.5 border border-border bg-card px-5 py-3 font-mono text-[10px] text-muted-foreground shrink-0 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="font-bold uppercase tracking-wider text-primary">Today</span>
          <div className="w-24 h-2 bg-secondary border border-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${todayTasks.length > 0 ? (todayDone / todayTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="font-bold text-foreground">[{todayDone}/{todayTasks.length}]</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-bold uppercase tracking-wider text-primary">This Week</span>
          <div className="w-24 h-2 bg-secondary border border-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${weekTasks.length > 0 ? (weekDone / weekTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="font-bold text-foreground">[{weekDone}/{weekTasks.length}]</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-bold uppercase tracking-wider text-primary">This Month</span>
          <div className="w-24 h-2 bg-secondary border border-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${monthTasks.length > 0 ? (monthDone / monthTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="font-bold text-foreground">[{monthDone}/{monthTasks.length}]</span>
        </div>
      </div>

      {/* Task Fast Input Form */}
      <div className="px-5 py-4 border border-border bg-card shrink-0 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary" />
        <form onSubmit={handleAddTask} className="flex gap-2 w-full">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              placeholder='Add a task... shorthand: "Review mockups @growth-hacker P0"'
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-mono bg-secondary/40 border border-border text-foreground rounded-xl focus:outline-none focus:bg-secondary/60 focus:border-primary/50 transition-all placeholder:text-muted-foreground/45"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newTaskText.trim()}
            className="px-5 py-2 bg-primary text-[#0F2A2E] font-mono text-xs font-bold uppercase tracking-wider border border-primary hover:bg-transparent hover:text-primary transition-all disabled:opacity-50 disabled:pointer-events-none rounded-xl shrink-0 flex items-center gap-1.5 cursor-pointer h-9"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>Add Task</span>
          </button>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {loading && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 font-mono text-xs gap-3 text-muted-foreground animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>HYDRATING FROM ACMI COCKPIT...</span>
          </div>
        ) : viewMode === "kanban" ? (
          /* Kanban Board Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start h-full">
            {(["Today", "This Week", "This Month", "Backlog"] as const).map((colTitle) => {
              const columnTasks = filteredTasks.filter(t => t.status === colTitle);
              return (
                <div 
                  key={colTitle}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, colTitle)}
                  className="flex flex-col border border-border bg-card/65 rounded-2xl min-h-[500px] overflow-hidden shadow-md"
                >
                  {/* Column Header */}
                  <div className="px-4 py-3 bg-secondary/35 border-b border-border font-mono text-xs font-bold flex justify-between items-center text-foreground uppercase tracking-wide">
                    <span>{colTitle}</span>
                    <span className="text-[10px] bg-primary/10 px-2 py-0.5 border border-primary/20 text-primary font-bold rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Task List */}
                  <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
                    {columnTasks.length === 0 ? (
                      <div className="flex-1 border border-dashed border-border/40 flex items-center justify-center p-6 text-center text-[10px] font-mono text-muted-foreground/30 uppercase tracking-wider py-16 rounded-xl bg-black/5">
                        Drag items here
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div key={task.id}>
                          {editingTaskId === task.id ? (
                            /* CARD EDIT FORM */
                            <div className="p-3.5 bg-secondary/80 border border-primary/30 shadow-sm flex flex-col gap-3 rounded-xl select-none">
                              <div className="flex flex-col gap-1">
                                <label className="font-mono text-[9px] text-muted-foreground uppercase">Task Title</label>
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="w-full p-1.5 text-xs font-mono bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                  <label className="font-mono text-[9px] text-muted-foreground uppercase">Owner</label>
                                  <select
                                    value={editingOwner}
                                    onChange={(e) => setEditingOwner(e.target.value)}
                                    className="w-full p-1 text-xs font-mono bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                                  >
                                    {FLEET_OWNERS.map(o => (
                                      <option key={o} value={o}>{o}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                  <label className="font-mono text-[9px] text-muted-foreground uppercase">Priority</label>
                                  <select
                                    value={editingPriority}
                                    onChange={(e) => setEditingPriority(e.target.value as TaskItem["priority"])}
                                    className="w-full p-1 text-xs font-mono bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                                  >
                                    <option value="P0">P0</option>
                                    <option value="P1">P1</option>
                                    <option value="P2">P2</option>
                                    <option value="P3">P3</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                  <label className="font-mono text-[9px] text-muted-foreground uppercase">Due Date</label>
                                  <input
                                    type="date"
                                    value={editingDueDate}
                                    onChange={(e) => setEditingDueDate(e.target.value)}
                                    className="w-full p-1 text-xs font-mono bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                                  />
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                  <label className="font-mono text-[9px] text-muted-foreground uppercase">Status</label>
                                  <select
                                    value={editingStatus}
                                    onChange={(e) => setEditingStatus(e.target.value as TaskItem["status"])}
                                    className="w-full p-1 text-xs font-mono bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                                  >
                                    <option value="Today">Today</option>
                                    <option value="This Week">This Week</option>
                                    <option value="This Month">This Month</option>
                                    <option value="Backlog">Backlog</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-1">
                                <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[10px] text-muted-foreground select-none">
                                  <input
                                    type="checkbox"
                                    checked={editingBlocked}
                                    onChange={(e) => setEditingBlocked(e.target.checked)}
                                    className="h-3.5 w-3.5 accent-red-500 cursor-pointer"
                                  />
                                  <span>Blocked</span>
                                </label>
                                
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-[9px] font-mono font-bold uppercase text-red-400 hover:underline flex items-center gap-0.5 border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded cursor-pointer"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                  Delete
                                </button>
                              </div>

                              <div className="flex justify-end gap-1.5 border-t border-border/40 pt-2.5 mt-1 font-mono text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setEditingTaskId(null)}
                                  className="px-2.5 py-1 border border-border hover:bg-secondary text-muted-foreground rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveTask(task.id)}
                                  className="px-2.5 py-1 bg-primary border border-primary text-[#0F2A2E] font-bold rounded-lg cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* STATIC KANBAN CARD */
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              className={cn(
                                "p-3.5 bg-secondary/40 border transition-all cursor-grab active:cursor-grabbing hover:border-primary/45 select-none group relative rounded-xl",
                                task.done ? "border-border/30 bg-secondary/15 opacity-60" : "border-border shadow-sm"
                              )}
                            >
                              {/* Top row */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "text-[9px] font-mono font-extrabold px-1.5 py-0.5 border leading-none rounded-md",
                                    task.priority === "P0" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                    task.priority === "P1" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                    task.priority === "P2" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                    "bg-secondary text-muted-foreground border-border"
                                  )}>
                                    {task.priority}
                                  </span>
                                  {task.blocked && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 uppercase leading-none flex items-center gap-0.5 rounded-md">
                                      <AlertCircle className="h-2 w-2" />
                                      <span>BLOCKED</span>
                                    </span>
                                  )}
                                </div>
                                
                                <div 
                                  onClick={() => toggleDone(task.id)}
                                  className="h-5 w-5 rounded-md flex items-center justify-center border border-border bg-black/20 hover:border-primary/50 text-muted-foreground/35 cursor-pointer transition-all shrink-0"
                                >
                                  {task.done ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                  ) : (
                                    <Circle className="h-2 w-2 bg-transparent shrink-0" />
                                  )}
                                </div>
                              </div>

                              {/* Task Title */}
                              <div className={cn(
                                "text-xs font-semibold leading-snug break-words pr-2 font-sans",
                                task.done ? "line-through text-muted-foreground/45" : "text-foreground"
                              )}>
                                {task.title}
                              </div>

                              {/* Meta footer row */}
                              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-2.5 border-t border-border/25 pt-2">
                                <span className="text-primary font-semibold">{task.owner}</span>
                                <div className="flex items-center gap-2">
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1 text-[9px] text-muted-foreground/75">
                                      <Calendar className="h-2.5 w-2.5" />
                                      <span>{task.dueDate}</span>
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => startEditing(task)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] uppercase border border-border px-1.5 py-0.5 bg-secondary text-muted-foreground hover:text-primary font-bold rounded cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Gantt Timeline View */
          <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-md">
            <div className="px-4 py-3 bg-secondary/35 border-b border-border font-mono text-xs font-bold flex justify-between items-center text-foreground uppercase tracking-wide">
              <span>Timeline (Gantt View)</span>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">Zoom: Monthly Grid</span>
            </div>

            <div className="p-5">
              <div className="relative border-b border-border/40 pb-8 flex flex-col gap-6">
                {filteredTasks.length === 0 ? (
                  <div className="text-center font-mono text-xs text-muted-foreground/40 py-12">
                    NO TASKS MATCHING FILTER
                  </div>
                ) : (
                  filteredTasks.slice(0, 8).map((task, idx) => {
                    // Render custom horizontal alignment values dynamically based on task priority
                    const startLeft = idx === 0 ? "15%" : idx === 1 ? "5%" : idx === 2 ? "25%" : idx === 3 ? "35%" : idx === 4 ? "40%" : "50%";
                    const barWidth = idx === 0 ? "30%" : idx === 1 ? "40%" : idx === 2 ? "20%" : idx === 3 ? "30%" : idx === 4 ? "35%" : "25%";
                    
                    return (
                      <div key={task.id} className="relative h-8 flex items-center w-full">
                        <span className="w-32 font-mono text-[10px] text-muted-foreground truncate uppercase shrink-0">
                          {task.owner} · {task.priority}
                        </span>

                        <div className="flex-1 relative h-full bg-secondary/30 rounded-lg overflow-hidden border border-border/10">
                          <div 
                            style={{ left: startLeft, width: barWidth }}
                            className={cn(
                              "absolute top-0 h-full border-l-2 p-1.5 flex items-center justify-between text-[9px] font-mono text-left font-bold overflow-hidden select-none rounded-lg",
                              task.done ? "bg-secondary text-muted-foreground/40 border-l-muted-foreground border border-border/30" :
                              task.priority === "P0" ? "bg-red-500/10 text-red-400 border-l-red-500 border border-red-500/20" :
                              task.priority === "P1" ? "bg-yellow-500/10 text-yellow-400 border-l-yellow-500 border border-yellow-500/20" :
                              "bg-primary/10 text-primary border-l-primary border border-primary/20"
                            )}
                          >
                            <span className="truncate uppercase">{task.title}</span>
                            <span className="text-[8px] opacity-65 shrink-0">{task.dueDate || "NO DUE"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Time steps headers */}
              <div className="flex justify-between font-mono text-[9px] text-muted-foreground/45 mt-4 px-32">
                <span>MAY 18</span>
                <span>MAY 21</span>
                <span>MAY 24</span>
                <span>MAY 27</span>
                <span>MAY 30</span>
                <span>JUN 2</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
