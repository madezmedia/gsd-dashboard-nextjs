"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  CheckSquare, 
  Loader2, 
  AlertCircle, 
  User, 
  Flag,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { acmiClient } from "@/lib/acmi-client";

interface TaskItem {
  id: string;
  title: string;
  owner: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: "Today" | "This Week" | "This Month" | "Backlog";
  dueDate: string;
  blocked: boolean;
  done: boolean;
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

export default function TodoPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "gantt">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [isSubmitting, setIsNewSubmitting] = useState(false);

  // Load from bootstrap aggregate or load local fallback
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await acmiClient.fetchDashboardBootstrap();
      if (data && data.tasks && data.tasks.length > 0) {
        const parsed: TaskItem[] = data.tasks.map((t: any) => {
          const profile = t.profile || {};
          const signals = t.signals || {};
          const priorityRaw = profile.priority || signals.priority || "P1";
          const priority = (priorityRaw === "P0" || priorityRaw === "P1" || priorityRaw === "P2" || priorityRaw === "P3") 
            ? priorityRaw as TaskItem["priority"] 
            : "P1";
          
          const statusRaw = signals.status || profile.status || "Today";
          const status = (statusRaw === "Today" || statusRaw === "This Week" || statusRaw === "This Month" || statusRaw === "Backlog")
            ? statusRaw as TaskItem["status"]
            : "Today";

          return {
            id: t.id,
            title: profile.title || profile.name || t.id,
            owner: profile.owner || signals.owner || "@unassigned",
            priority,
            status,
            dueDate: profile.dueDate || signals.dueDate || "",
            blocked: signals.blocked === "true" || signals.blocked === true || profile.blocked === "true" || profile.blocked === true || false,
            done: signals.done === "true" || signals.done === true || profile.done === "true" || profile.done === true || false,
          };
        });
        setTasks(parsed);
      } else {
        setTasks(DEFAULT_TASKS);
      }
    } catch (err) {
      console.error("Error fetching tasks bootstrap:", err);
      setTasks(DEFAULT_TASKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

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
        ts: Date.now(),
        source: "user:admin",
        kind: "status-change",
        summary: `Moved task to ${targetStatus} column`,
        correlationId: `todo-${Date.now()}-drag`,
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
        ts: Date.now(),
        source: "user:admin",
        kind: "completion-toggle",
        summary: newDoneState ? "Marked task as [completed]" : "Marked task as [incomplete]",
        correlationId: `todo-${Date.now()}-toggle`,
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
    <div className="flex-1 flex flex-col bg-[#faf9f5] overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1a1a1a]/10 px-6 py-4 bg-[#f4f2eb]/50 shrink-0 gap-4">
        <div>
          <div className="text-xl font-bold font-mono tracking-tight text-[#2d4a3e] flex items-center gap-2">
            <ClipboardList className="h-5 w-5 stroke-[2.5]" />
            <span>TODO KANBAN</span>
          </div>
          <p className="text-[11px] font-mono text-[#1a1a1a]/60 uppercase tracking-wide mt-1">
            {tasks.length} tasks · {tasks.filter(t => t.priority === "P0").length} P0 · {tasks.filter(t => t.priority === "P1").length} P1 · {tasks.filter(t => t.done).length} completed
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#1a1a1a]/40" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-mono bg-[#faf9f5] border border-[#1a1a1a]/15 text-[#1a1a1a] rounded-none focus:outline-none focus:border-[#2d4a3e] w-48 transition-all"
            />
          </div>

          {/* Toggle View */}
          <div className="flex border border-[#1a1a1a]/15 font-mono p-0.5 bg-[#faf9f5] shrink-0">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "px-3 py-1 text-[10px] uppercase font-bold transition-all rounded-none",
                viewMode === "kanban" ? "bg-[#2d4a3e] text-[#faf9f5]" : "text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5"
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className={cn(
                "px-3 py-1 text-[10px] uppercase font-bold transition-all rounded-none",
                viewMode === "gantt" ? "bg-[#2d4a3e] text-[#faf9f5]" : "text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5"
              )}
            >
              Gantt
            </button>
          </div>
        </div>
      </div>

      {/* Today Completion progress-strip */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-[#1a1a1a]/10 bg-[#f4f2eb] px-6 py-2.5 font-mono text-[10px] text-[#1a1a1a]/80 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[#2d4a3e]">Today</span>
          <div className="w-24 h-2 bg-[#1a1a1a]/10 border border-[#1a1a1a]/10">
            <div 
              className="h-full bg-[#2d4a3e]" 
              style={{ width: `${todayTasks.length > 0 ? (todayDone / todayTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="font-bold">[{todayDone}/{todayTasks.length}]</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[#2d4a3e]">This Week</span>
          <div className="w-24 h-2 bg-[#1a1a1a]/10 border border-[#1a1a1a]/10">
            <div 
              className="h-full bg-[#2d4a3e]" 
              style={{ width: `${weekTasks.length > 0 ? (weekDone / weekTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="font-bold">[{weekDone}/{weekTasks.length}]</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[#2d4a3e]">This Month</span>
          <div className="w-24 h-2 bg-[#1a1a1a]/10 border border-[#1a1a1a]/10">
            <div 
              className="h-full bg-[#2d4a3e]" 
              style={{ width: `${monthTasks.length > 0 ? (monthDone / monthTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="font-bold">[{monthDone}/{monthTasks.length}]</span>
        </div>
      </div>

      {/* Task Fast Input Form */}
      <div className="px-6 py-4 border-b border-[#1a1a1a]/10 bg-[#faf9f5] shrink-0">
        <form onSubmit={handleAddTask} className="flex gap-2 w-full">
          <div className="flex-1 relative flex items-center border-l-4 border-l-[#2d4a3e]">
            <input
              type="text"
              placeholder='Add a task... shorthand: "Review mockups @growth-hacker P0"'
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-mono bg-[#f4f2eb] border border-[#1a1a1a]/15 text-[#1a1a1a] rounded-none focus:outline-none focus:bg-[#faf9f5] focus:border-[#2d4a3e] transition-all placeholder:text-[#1a1a1a]/40"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newTaskText.trim()}
            className="px-5 py-2 bg-[#2d4a3e] text-[#faf9f5] font-mono text-xs font-bold uppercase tracking-wider border border-[#2d4a3e] hover:bg-[#faf9f5] hover:text-[#2d4a3e] transition-all disabled:opacity-50 disabled:pointer-events-none rounded-none shrink-0 flex items-center gap-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            <span>Add Task</span>
          </button>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 font-mono text-xs gap-3 text-[#1a1a1a]/60">
            <Loader2 className="h-6 w-6 animate-spin text-[#2d4a3e]" />
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
                  className="flex flex-col border border-[#1a1a1a]/15 bg-[#f4f2eb]/40 min-h-[450px]"
                >
                  {/* Column Header */}
                  <div className="px-4 py-3 bg-[#f4f2eb] border-b border-[#1a1a1a]/15 font-mono text-xs font-bold flex justify-between items-center text-[#1a1a1a]">
                    <span>{colTitle.toUpperCase()}</span>
                    <span className="text-[10px] bg-[#2d4a3e]/10 px-1.5 py-0.5 border border-[#2d4a3e]/15 text-[#2d4a3e] font-bold">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Task List */}
                  <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
                    {columnTasks.length === 0 ? (
                      <div className="flex-1 border border-dashed border-[#1a1a1a]/10 flex items-center justify-center p-6 text-center text-[10px] font-mono text-[#1a1a1a]/40 uppercase tracking-wider py-12">
                        Drag items here
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={cn(
                            "p-3 bg-[#faf9f5] border transition-all cursor-grab active:cursor-grabbing hover:border-[#2d4a3e]/40 select-none group relative",
                            task.done ? "border-[#1a1a1a]/10 bg-[#faf9f5]/50 opacity-60" : "border-[#1a1a1a]/15 shadow-sm"
                          )}
                        >
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "text-[9px] font-mono font-extrabold px-1 border leading-none py-0.5",
                                task.priority === "P0" ? "bg-[#9c3e3e] text-[#faf9f5] border-[#9c3e3e]" :
                                task.priority === "P1" ? "bg-[#c4903a] text-[#faf9f5] border-[#c4903a]" :
                                "bg-[#1a1a1a]/5 text-[#1a1a1a]/60 border-[#1a1a1a]/10"
                              )}>
                                {task.priority}
                              </span>
                              {task.blocked && (
                                <span className="text-[9px] font-mono font-bold px-1 bg-[#9c3e3e]/10 border border-[#9c3e3e]/20 text-[#9c3e3e] uppercase leading-none py-0.5 flex items-center gap-0.5">
                                  <AlertCircle className="h-2 w-2" />
                                  <span>BLOCKED</span>
                                </span>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleDone(task.id)}
                              className="h-3.5 w-3.5 rounded-none border-[#1a1a1a]/30 accent-[#2d4a3e] cursor-pointer"
                              aria-label="Toggle task completed state"
                            />
                          </div>

                          {/* Task Title */}
                          <div className={cn(
                            "text-xs font-semibold leading-snug break-words",
                            task.done ? "line-through text-[#1a1a1a]/40" : "text-[#1a1a1a]"
                          )}>
                            {task.title}
                          </div>

                          {/* Meta footer row */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#1a1a1a]/50 mt-2 border-t border-[#1a1a1a]/5 pt-2">
                            <span className="text-[#2d4a3e] font-semibold">{task.owner}</span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-[9px]">
                                <Calendar className="h-2.5 w-2.5" />
                                <span>{task.dueDate}</span>
                              </span>
                            )}
                          </div>
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
          <div className="border border-[#1a1a1a]/15 bg-[#faf9f5]">
            <div className="px-4 py-3 bg-[#f4f2eb] border-b border-[#1a1a1a]/15 font-mono text-xs font-bold flex justify-between items-center text-[#1a1a1a]">
              <span>TIMELINE (GANTT VIEW)</span>
              <span className="text-[9px] text-[#1a1a1a]/60 uppercase tracking-widest">ZOOM: MONTHLY GRID</span>
            </div>

            <div className="p-6">
              <div className="relative border-b border-[#1a1a1a]/10 pb-8 flex flex-col gap-6">
                {filteredTasks.length === 0 ? (
                  <div className="text-center font-mono text-xs text-[#1a1a1a]/40 py-12">
                    NO TASKS MATCHING FILTER
                  </div>
                ) : (
                  filteredTasks.slice(0, 8).map((task, idx) => {
                    // Render custom horizontal alignment values dynamically based on task priority
                    const startLeft = idx === 0 ? "15%" : idx === 1 ? "5%" : idx === 2 ? "25%" : idx === 3 ? "35%" : idx === 4 ? "40%" : "50%";
                    const barWidth = idx === 0 ? "30%" : idx === 1 ? "40%" : idx === 2 ? "20%" : idx === 3 ? "30%" : idx === 4 ? "35%" : "25%";
                    
                    return (
                      <div key={task.id} className="relative h-8 flex items-center w-full">
                        <span className="w-32 font-mono text-[10px] text-[#1a1a1a]/70 truncate uppercase">
                          {task.owner} · {task.priority}
                        </span>

                        <div className="flex-1 relative h-full bg-[#1a1a1a]/5">
                          <div 
                            style={{ left: startLeft, width: barWidth }}
                            className={cn(
                              "absolute top-0 h-full border-l-2 p-1.5 flex items-center justify-between text-[9px] font-mono text-left font-bold overflow-hidden select-none",
                              task.done ? "bg-[#faf9f5]/80 text-[#1a1a1a]/40 border-l-[#1a1a1a]/30 border border-[#1a1a1a]/10" :
                              task.priority === "P0" ? "bg-[#9c3e3e]/10 text-[#9c3e3e] border-l-[#9c3e3e]" :
                              task.priority === "P1" ? "bg-[#c4903a]/10 text-[#c4903a] border-l-[#c4903a]" :
                              "bg-[#2d4a3e]/10 text-[#2d4a3e] border-l-[#2d4a3e]"
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
              <div className="flex justify-between font-mono text-[9px] text-[#1a1a1a]/40 mt-4 px-32">
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
