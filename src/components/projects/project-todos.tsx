"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Sparkles, RefreshCw, CheckSquare, Square, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: "P0" | "P1" | "P2" | "P3";
  createdAt?: number;
  auditNote?: string;
}

interface Props {
  projectId: string;
  projectTitle: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-500/10 text-red-400 border-red-500/20",
  P1: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  P2: "bg-primary/10 text-primary border-primary/20",
  P3: "bg-muted text-muted-foreground border-border",
};

export function ProjectTodos({ projectId, projectTitle }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Todo["priority"]>("P2");
  const [auditing, setAuditing] = useState(false);
  const [auditNotes, setAuditNotes] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/todos?projectId=${encodeURIComponent(projectId)}`);
    const data = await res.json();
    setTodos(data.todos ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const persist = useCallback(async (updated: Todo[]) => {
    setTodos(updated);
    await fetch("/api/projects/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, todos: updated }),
    });
  }, [projectId]);

  const addTodo = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const todo: Todo = {
      id: `todo-${Date.now()}`,
      title,
      done: false,
      priority: newPriority,
      createdAt: Date.now(),
    };
    await persist([...todos, todo]);
    setNewTitle("");
  };

  const toggleDone = (id: string) =>
    persist(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTodo = (id: string) => persist(todos.filter((t) => t.id !== id));

  const runAudit = async () => {
    setAuditing(true);
    setAuditNotes([]);
    const res = await fetch("/api/projects/todos/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectTitle, todos }),
    });
    const data = await res.json();
    if (data.ok) {
      let updated: Todo[] = data.optimized ?? todos;
      if (data.removed_ids?.length) {
        updated = updated.filter((t: Todo) => !data.removed_ids.includes(t.id));
      }
      await persist(updated);
      setAuditNotes(data.audit_notes ?? []);
    }
    setAuditing(false);
  };

  const syncToGoogleTasks = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch("/api/composio/google-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectTitle, todos }),
    });
    const data = await res.json();
    setSyncResult(data.ok ? `✓ ${data.synced} tasks synced to Google Tasks` : `Error: ${data.error}`);
    setSyncing(false);
  };

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Todos — {pending.length} pending, {done.length} done
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[9px] font-mono uppercase border-border gap-1 cursor-pointer"
            onClick={runAudit}
            disabled={auditing || todos.length === 0}
          >
            {auditing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {auditing ? "Auditing..." : "AI Audit"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[9px] font-mono uppercase border-border gap-1 cursor-pointer"
            onClick={syncToGoogleTasks}
            disabled={syncing || pending.length === 0}
          >
            {syncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {syncing ? "Syncing..." : "→ Google Tasks"}
          </Button>
        </div>
      </div>

      {/* Sync result */}
      {syncResult && (
        <p className={cn("text-[10px] font-mono px-3 py-1.5 rounded border",
          syncResult.startsWith("✓") ? "bg-primary/5 border-primary/20 text-primary" : "bg-red-500/5 border-red-500/20 text-red-400"
        )}>
          {syncResult}
        </p>
      )}

      {/* AI audit notes */}
      {auditNotes.length > 0 && (
        <div className="bg-secondary border border-border rounded-xl p-3 space-y-1">
          <span className="text-[9px] font-mono uppercase text-primary tracking-wider">AI Audit Notes</span>
          {auditNotes.map((note, i) => (
            <p key={i} className="text-[10px] text-muted-foreground font-mono">• {note}</p>
          ))}
        </div>
      )}

      {/* Add todo */}
      <div className="flex gap-2">
        <Input
          className="h-8 text-xs font-mono border-border bg-secondary flex-1"
          placeholder="New task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <select
          className="h-8 text-[10px] font-mono border border-border rounded-md bg-secondary px-2 text-foreground cursor-pointer"
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as Todo["priority"])}
        >
          {(["P0", "P1", "P2", "P3"] as const).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Button
          size="sm"
          className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-background cursor-pointer"
          onClick={addTodo}
          disabled={!newTitle.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Todo list */}
      {loading ? (
        <p className="text-[10px] font-mono text-muted-foreground animate-pulse">Loading todos...</p>
      ) : todos.length === 0 ? (
        <p className="text-[10px] font-mono text-muted-foreground/50 text-center py-4">No todos yet. Add one above.</p>
      ) : (
        <div className="space-y-1.5">
          {[...pending, ...done].map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-xl border transition-all",
                todo.done
                  ? "border-border/30 bg-secondary/30 opacity-50"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <button
                onClick={() => toggleDone(todo.id)}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
              >
                {todo.done ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5" />}
              </button>
              <span className={cn("text-xs flex-1 font-mono", todo.done && "line-through")}>
                {todo.title}
              </span>
              <Badge className={cn("text-[9px] border h-4 px-1 shrink-0", PRIORITY_COLORS[todo.priority ?? "P2"])}>
                {todo.priority ?? "P2"}
              </Badge>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-muted-foreground/40 hover:text-red-400 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
