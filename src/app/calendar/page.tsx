"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Clock,
  AlertTriangle,
  Compass,
  CheckCircle,
  FileText,
  Workflow,
  X,
  Activity,
  Layers,
  List,
  Grid,
  Play,
  Terminal,
  Shield,
  HelpCircle,
  ArrowRight,
  Search,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { acmiClient } from "@/lib/acmi-client";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  kind: "milestone" | "deadline" | "task";
}

interface TimelineItem {
  id: string;
  ts: number;
  source: string;
  kind: string;
  summary: string;
}

interface CronEmployee {
  id: string;
  name: string;
  shift: string;
  clockIn: string;
  clockOut: string;
  pipeline: string;
  script: string;
  tools: string;
  isNew?: boolean;
  isStarred?: boolean;
}

// Default events for May 2026 to populate when Redis is empty
const DEFAULT_EVENTS: CalendarEvent[] = [
  { id: "evt-1", title: "Design Review", date: "2026-05-13", kind: "milestone" },
  { id: "evt-2", title: "OwnerScout Deploy", date: "2026-05-14", kind: "deadline" },
  { id: "evt-3", title: "Secret Mgr Review", date: "2026-05-17", kind: "task" },
  { id: "evt-4", title: "Q2 Report Draft", date: "2026-05-20", kind: "milestone" },
  { id: "evt-5", title: "Deadline: Audit Reply", date: "2026-05-21", kind: "deadline" },
  { id: "evt-6", title: "Whop Phase 2 Go", date: "2026-05-28", kind: "task" },
];

const DEFAULT_TIMELINE: TimelineItem[] = [
  { id: "t-1", ts: Date.now() - 5 * 60 * 1000, source: "agent:claude-engineer", kind: "spawn", summary: "Session started: acmi-components build" },
  { id: "t-2", ts: Date.now() - 40 * 60 * 1000, source: "agent:claude-engineer", kind: "milestone-shipped", summary: "Architecture plan ratified" },
  { id: "t-3", ts: Date.now() - 2 * 3600 * 1000, source: "agent:design-ui-designer", kind: "handoff-ack", summary: "Picked up UI component design" },
  { id: "t-4", ts: Date.now() - 5 * 3600 * 1000, source: "agent:claude-engineer", kind: "coord-note", summary: "CSS token system finalized — Mad EZ v3 palette bound" },
  { id: "t-5", ts: Date.now() - 12 * 3600 * 1000, source: "agent:design-brand-guardian", kind: "review-pass", summary: "Brand review passed: palette and typography compliant" },
  { id: "t-6", ts: Date.now() - 24 * 3600 * 1000, source: "agent:claude-engineer", kind: "milestone-shipped", summary: "First three components written (ProfileCard, TimelineStream, SignalGauge)" },
];

const FALLBACK_ROSTER: CronEmployee[] = [
  { id: "memory-palace-indexer", name: "memory-palace-indexer", shift: "NIGHT SHIFT", clockIn: "3:30 AM", clockOut: "4:30 AM", pipeline: "Ops", script: "tools/memory-rag/memory-indexer-v2.mjs", tools: "exec, read, write", isNew: false, isStarred: false },
  { id: "seo-auditor", name: "seo-auditor", shift: "NIGHT SHIFT", clockIn: "4:00 AM", clockOut: "5:30 AM", pipeline: "Marketing", script: "openclaw cron run job_fleet_6_seo_auditor", tools: "", isNew: false, isStarred: false },
  { id: "session-cleanup", name: "session-cleanup", shift: "NIGHT SHIFT", clockIn: "3:00 AM", clockOut: "3:15 AM", pipeline: "Ops", script: "OpenClaw session cleanup cron", tools: "", isNew: false, isStarred: false },
  { id: "night-git-tracker", name: "night-git-tracker", shift: "NIGHT SHIFT", clockIn: "11:59 PM", clockOut: "12:10 AM", pipeline: "Ops", script: "cd ~/clawd && git add -A && git commit -m \"$(date '+%Y-%m-%d %H:%M') daily\"", tools: "exec", isNew: false, isStarred: false },
  { id: "inbox-janitor", name: "inbox-janitor", shift: "MORNING SHIFT", clockIn: "6:00 AM", clockOut: "6:20 AM", pipeline: "Outreach", script: "tools/acmi-sync/inbox-janitor.mjs", tools: "exec", isNew: false, isStarred: true },
  { id: "lead-scorer", name: "lead-scorer", shift: "MORNING SHIFT", clockIn: "6:30 AM", clockOut: "6:50 AM", pipeline: "Revenue", script: "tools/sales-engine/score-leads.mjs", tools: "exec, read", isNew: true, isStarred: false },
  { id: "sales-lead-engine", name: "sales-lead-engine", shift: "MORNING SHIFT", clockIn: "7:00 AM", clockOut: "7:45 AM", pipeline: "Revenue", script: "projects/ownerscout-sales-agent/scripts/run-sales-cycle.js --once", tools: "exec, read, write", isNew: false, isStarred: false },
  { id: "hubspot-enricher", name: "hubspot-enricher", shift: "MORNING SHIFT", clockIn: "7:30 AM", clockOut: "8:00 AM", pipeline: "Revenue", script: "tools/hubspot-lead-sync.mjs", tools: "exec, read, write", isNew: true, isStarred: false },
  { id: "morning-priority-setter", name: "morning-priority-setter", shift: "MORNING SHIFT", clockIn: "7:00 AM", clockOut: "7:30 AM", pipeline: "Team", script: "LLM prompt: sets today's fleet priorities", tools: "", isNew: false, isStarred: false },
  { id: "cowork-boot", name: "cowork-boot", shift: "MORNING SHIFT", clockIn: "8:00 AM", clockOut: "8:20 AM", pipeline: "Team", script: "LLM prompt: daily standup brief to Telegram", tools: "", isNew: false, isStarred: false },
  { id: "social-publisher-am", name: "social-publisher-am", shift: "MORNING SHIFT", clockIn: "7:00 AM", clockOut: "8:00 AM", pipeline: "Marketing", script: "tools/folana-publisher/publish-to-journal.sh && tools/storm_to_social.py", tools: "exec", isNew: true, isStarred: false },
  { id: "folana-ep-publisher", name: "folana-ep-publisher", shift: "PRODUCTION SHIFT", clockIn: "9:00 AM", clockOut: "10:30 AM", pipeline: "Content", script: "grok agent: generate + deploy episode to folana.live", tools: "", isNew: false, isStarred: false },
  { id: "folana-social-push", name: "folana-social-push", shift: "PRODUCTION SHIFT", clockIn: "9:30 AM", clockOut: "10:30 AM", pipeline: "Content", script: "tools/storm_to_social.py --latest", tools: "exec", isNew: true, isStarred: false },
  { id: "DUANE CALL", name: "DUANE CALL", shift: "PRODUCTION SHIFT", clockIn: "11:00 AM", clockOut: "11:20 AM", pipeline: "Revenue", script: "bentley-voice VAPI call to Duane with lead pipeline update", tools: "", isNew: false, isStarred: true },
  { id: "standup-brief", name: "standup-brief", shift: "SALES SHIFT", clockIn: "12:00 PM", clockOut: "12:20 PM", pipeline: "Team", script: "LLM prompt: daily standup to Telegram", tools: "", isNew: false, isStarred: false },
  { id: "response-processor", name: "response-processor", shift: "SALES SHIFT", clockIn: "12:30 PM", clockOut: "1:00 PM", pipeline: "Outreach", script: "node projects/ownerscout-sales-agent/scripts/process-responses.js --once", tools: "exec, read", isNew: true, isStarred: false },
  { id: "social-analytics", name: "social-analytics", shift: "SALES SHIFT", clockIn: "1:00 PM", clockOut: "1:30 PM", pipeline: "Marketing", script: "tools/sentiment-analyzer.mjs", tools: "exec, read", isNew: true, isStarred: false },
  { id: "hubspot-sync-pm", name: "hubspot-sync-pm", shift: "SALES SHIFT", clockIn: "12:30 PM", clockOut: "1:00 PM", pipeline: "Revenue", script: "tools/hubspot-lead-sync.mjs (bi-directional sync)", tools: "exec, read, write", isNew: true, isStarred: false },
  { id: "infra-sentinel", name: "infra-sentinel", shift: "OPS SHIFT", clockIn: "4:00 PM", clockOut: "4:20 PM", pipeline: "Ops", script: "tools/infra-sentinel/system_monitor.ts", tools: "exec, read", isNew: false, isStarred: false },
  { id: "fal-monitor", name: "fal-monitor", shift: "OPS SHIFT", clockIn: "3:00 PM", clockOut: "3:10 PM", pipeline: "Ops", script: "tools/infra-sentinel/fal_monitor.ts", tools: "exec, read", isNew: false, isStarred: false },
  { id: "project-health-check", name: "project-health-check", shift: "OPS SHIFT", clockIn: "1:30 PM", clockOut: "2:30 PM", pipeline: "Projects", script: "LLM prompt: check all active work items, surface blockers", tools: "", isNew: true, isStarred: false },
  { id: "pipeline-report", name: "pipeline-report", shift: "OPS SHIFT", clockIn: "2:00 PM", clockOut: "2:30 PM", pipeline: "Revenue", script: "node projects/ownerscout-sales-agent/scripts/run-sales-cycle.js --report", tools: "exec, read", isNew: true, isStarred: false },
  { id: "followup-due-check", name: "followup-due-check", shift: "EVENINGS SHIFT", clockIn: "4:00 PM", clockOut: "4:30 PM", pipeline: "Outreach", script: "node projects/ownerscout-sales-agent/scripts/process-responses.js --followups", tools: "exec, read", isNew: true, isStarred: false },
  { id: "outreach-sender-pm", name: "outreach-sender-pm", shift: "EVENINGS SHIFT", clockIn: "4:00 PM", clockOut: "5:00 PM", pipeline: "Outreach", script: "node projects/ownerscout-sales-agent/scripts/send-outreach.js --once", tools: "exec, read", isNew: true, isStarred: false },
  { id: "bentley-rollup", name: "bentley-rollup", shift: "EVENINGS SHIFT", clockIn: "6:00 PM", clockOut: "6:30 PM", pipeline: "Team", script: "bentley-main: full ACMI rollup + memory file update", tools: "", isNew: false, isStarred: false },
  { id: "revenue-daily", name: "revenue-daily", shift: "EVENINGS SHIFT", clockIn: "5:00 PM", clockOut: "5:30 PM", pipeline: "Revenue", script: "node tools/revops/daily-report.mjs", tools: "exec, read", isNew: true, isStarred: false },
  { id: "ops-evening-report", name: "ops-evening-report", shift: "EVENINGS SHIFT", clockIn: "5:00 PM", clockOut: "5:30 PM", pipeline: "Ops", script: "LLM prompt: evening ops summary to Telegram", tools: "", isNew: true, isStarred: false },
  { id: "outreach-sender-late", name: "outreach-sender-late", shift: "LATE SHIFT", clockIn: "10:00 PM", clockOut: "11:00 PM", pipeline: "Outreach", script: "node projects/ownerscout-sales-agent/scripts/send-outreach.js --once", tools: "exec, read", isNew: true, isStarred: false },
  { id: "night-fleet-report", name: "night-fleet-report", shift: "LATE SHIFT", clockIn: "11:00 PM", clockOut: "11:30 PM", pipeline: "Ops", script: "LLM prompt: fleet health summary to Telegram", tools: "", isNew: true, isStarred: false },
  { id: "git-commit", name: "git-commit", shift: "LATE SHIFT", clockIn: "11:59 PM", clockOut: "12:05 AM", pipeline: "Ops", script: "cd ~/clawd && git add -A && git commit -m \"$(date '+%Y-%m-%d')\"", tools: "exec", isNew: false, isStarred: false }
];

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // View mode switcher: month | schedule | crons
  const [viewMode, setViewMode] = useState<"month" | "schedule" | "crons">("month");

  // Current calendar navigation date
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date(2026, 4, 1); // May 2026 (index 4)
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [cronRoster, setCronRoster] = useState<CronEmployee[]>(FALLBACK_ROSTER);
  const [selectedCronId, setSelectedCronId] = useState<string | null>(null);
  const [cronFilterShift, setCronFilterShift] = useState<string>("ALL");
  const [pipelineFilter, setPipelineFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // New Event Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<"milestone" | "deadline" | "task">("task");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load calendar, timeline & cron roster
  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch general bootstrap (events + timeline)
      const data = await acmiClient.fetchDashboardBootstrap();
      
      // Fetch live cron roster
      const cronConfig = await acmiClient.getProfile("config", "cron-roster");
      if (cronConfig && Array.isArray(cronConfig.roster)) {
        setCronRoster(cronConfig.roster);
      } else {
        setCronRoster(FALLBACK_ROSTER);
      }

      if (data) {
        // Parse calendar events
        let parsedEvents: CalendarEvent[] = [];
        if (data.events && data.events.length > 0) {
          parsedEvents = data.events.map((evt: any) => {
            const p = evt.profile || {};
            return {
              id: evt.id,
              title: p.title || evt.id,
              date: p.start || p.date || "",
              kind: (p.kind || "task") as CalendarEvent["kind"],
            };
          });
        } else {
          parsedEvents = DEFAULT_EVENTS;
        }

        // Parse timeline events
        let parsedTimeline: TimelineItem[] = [];
        if (data.timeline && data.timeline.length > 0) {
          parsedTimeline = data.timeline.map((evt: any) => ({
            id: evt.id,
            ts: typeof evt.ts === "number" ? evt.ts : new Date(evt.ts).getTime(),
            source: evt.source || "system",
            kind: evt.kind || "event",
            summary: evt.summary || "",
          }));
        } else {
          parsedTimeline = DEFAULT_TIMELINE;
        }

        setEvents(parsedEvents);
        setTimeline(parsedTimeline);
      } else {
        setEvents(DEFAULT_EVENTS);
        setTimeline(DEFAULT_TIMELINE);
      }
    } catch (err) {
      console.error("Failed to load bootstrap for calendar:", err);
      setEvents(DEFAULT_EVENTS);
      setTimeline(DEFAULT_TIMELINE);
      setCronRoster(FALLBACK_ROSTER);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Navigate month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const setToday = () => {
    setCurrentDate(new Date(2026, 4, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const calendarCells = useMemo(() => {
    const cells = [];
    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dayNum: d, isCurrentMonth: false, dateStr });
    }
    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dayNum: d, isCurrentMonth: true, dateStr });
    }
    // Next month padding
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dayNum: d, isCurrentMonth: false, dateStr });
    }
    return cells;
  }, [year, month, daysInCurrentMonth, daysInPrevMonth, firstDayIndex]);

  const handleDayClick = (cell: { dayNum: number; isCurrentMonth: boolean; dateStr: string }) => {
    setSelectedDayStr(cell.dateStr);
    setNewTitle("");
    setNewKind("task");
    setModalOpen(true);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedDayStr) return;

    setIsSubmitting(true);
    const uuid = "event-" + Math.random().toString(36).substring(2, 11);

    try {
      await acmiClient.setProfile("event", uuid, {
        title: newTitle.trim(),
        start: selectedDayStr,
        end: selectedDayStr,
        kind: newKind,
        allDay: true,
      } as any);

      await acmiClient.appendEvent("event", uuid, {
        ts: Date.now(),
        source: "gsd-dashboard-operator",
        kind: newKind,
        summary: `Created calendar event: ${newTitle.trim()} (${newKind}) for ${selectedDayStr}`,
        correlationId: "calEvent-" + Date.now(),
      });

      setEvents((prev) => [...prev, { id: uuid, title: newTitle.trim(), date: selectedDayStr, kind: newKind }]);
      setTimeline((prev) => [{ id: "t-new-" + Date.now(), ts: Date.now(), source: "gsd-dashboard-operator", kind: newKind, summary: `Created event: ${newTitle.trim()}` }, ...prev]);
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to create ACMI event:", err);
      alert("Failed to write calendar event to ACMI.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to map cron execution status using timeline events
  const getCronExecutionStatus = (cronId: string) => {
    // Find latest event where source matches, workflow_id matches, or summary includes the cron ID
    const match = timeline.find((e) => {
      const src = e.source.toLowerCase();
      const sum = e.summary.toLowerCase();
      const cid = cronId.toLowerCase();
      return (
        src.includes(cid) ||
        sum.includes(`[${cid}]`) ||
        sum.includes(`(${cid})`) ||
        (cid === "duane call" && sum.includes("duane"))
      );
    });

    if (!match) return { status: "idle" as const, time: null, summary: "No execution logs in last 50 events." };

    let status: "success" | "failed" | "running" = "success";
    const kind = match.kind.toLowerCase();
    const sum = match.summary.toLowerCase();

    if (kind.includes("fail") || kind.includes("error") || sum.includes("failed") || sum.includes("error")) {
      status = "failed";
    } else if (kind.includes("start") || kind.includes("run") || sum.includes("started") || sum.includes("running")) {
      status = "running";
    }

    return {
      status,
      time: match.ts,
      summary: match.summary,
      event: match,
    };
  };

  // Filtered cron list
  const filteredCrons = useMemo(() => {
    return cronRoster.filter((cron) => {
      const shiftMatch = cronFilterShift === "ALL" || cron.shift.toUpperCase().includes(cronFilterShift.toUpperCase());
      const pipelineMatch = pipelineFilter === "ALL" || cron.pipeline.toUpperCase() === pipelineFilter.toUpperCase();
      return shiftMatch && pipelineMatch;
    });
  }, [cronRoster, cronFilterShift, pipelineFilter]);

  // List of active pipelines
  const pipelineNames = ["ALL", "REVENUE", "MARKETING", "CONTENT", "OUTREACH", "PROJECTS", "TEAM", "OPS"];
  const shiftNames = ["ALL", "NIGHT SHIFT", "MORNING SHIFT", "PRODUCTION SHIFT", "SALES SHIFT", "OPS SHIFT", "EVENINGS SHIFT", "LATE SHIFT"];

  // Filtered timeline based on selection
  const filteredTimeline = useMemo(() => {
    if (!selectedCronId) return timeline;
    const cid = selectedCronId.toLowerCase();
    return timeline.filter((e) => {
      const src = e.source.toLowerCase();
      const sum = e.summary.toLowerCase();
      return src.includes(cid) || sum.includes(cid);
    });
  }, [timeline, selectedCronId]);

  // Combined hybrid schedule events sorted chronologically
  const hybridSchedule = useMemo(() => {
    const combined: Array<{
      id: string;
      timeLabel: string;
      title: string;
      type: "event" | "cron";
      kind: string;
      pipeline?: string;
      status?: "success" | "failed" | "running" | "idle";
      summary?: string;
    }> = [];

    // Add calendar events for selected day (e.g. today simulated to May 20, 2026)
    events
      .filter((e) => e.date === "2026-05-20")
      .forEach((e) => {
        combined.push({
          id: e.id,
          timeLabel: "ALL DAY",
          title: e.title,
          type: "event",
          kind: e.kind,
        });
      });

    // Add all crons with their clockIn time
    cronRoster.forEach((cron) => {
      const exec = getCronExecutionStatus(cron.id);
      combined.push({
        id: cron.id,
        timeLabel: cron.clockIn,
        title: cron.name,
        type: "cron",
        kind: "shift",
        pipeline: cron.pipeline,
        status: exec.status,
        summary: exec.summary,
      });
    });

    // Sort combined events: "ALL DAY" first, then by timeOfDay AM/PM parsing
    const parseTime = (timeStr: string) => {
      if (timeStr === "ALL DAY") return -1;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 9999;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    return combined.sort((a, b) => parseTime(a.timeLabel) - parseTime(b.timeLabel));
  }, [events, cronRoster, timeline]);

  const formatTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getTimelineIcon = (source: string) => {
    if (source.includes("claude")) return <Workflow className="w-4 h-4 text-[#2d4a3e]" />;
    if (source.includes("design") || source.includes("brand")) return <Compass className="w-4 h-4 text-[#c4903a]" />;
    if (source.includes("operator")) return <CheckCircle className="w-4 h-4 text-[#2d4a3e]" />;
    return <FileText className="w-4 h-4 text-[#1a1a1a]/50" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#faf9f5] overflow-y-auto font-sans relative select-none antialiased">
      {/* ── Header Toolbar Banner ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1a1a1a]/15 bg-[#faf9f5] p-5 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-[#2d4a3e]/10 border border-[#2d4a3e]/30 text-[#2d4a3e]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-[#1a1a1a] uppercase tracking-wider">
              Calendar & Pipeline Coordination
            </h1>
            <p className="text-xs text-[#1a1a1a]/60 font-mono flex items-center gap-1">
              <span>{monthNames[month]} {year}</span>
              <span>·</span>
              <span className="text-[#2d4a3e] font-bold">{cronRoster.length} ACTIVE CRONS</span>
              <span>·</span>
              <span className="text-[#c4903a] font-bold">{events.length} EVENTS</span>
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#f4f2eb] p-1 border border-[#1a1a1a]/15 font-mono text-[10px] font-bold">
          <button
            onClick={() => setViewMode("month")}
            className={cn(
              "px-3 py-1.5 cursor-pointer transition-colors flex items-center gap-1",
              viewMode === "month" ? "bg-[#2d4a3e] text-[#faf9f5]" : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            MONTH VIEW
          </button>
          <button
            onClick={() => setViewMode("schedule")}
            className={cn(
              "px-3 py-1.5 cursor-pointer transition-colors flex items-center gap-1",
              viewMode === "schedule" ? "bg-[#2d4a3e] text-[#faf9f5]" : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
            )}
          >
            <List className="w-3.5 h-3.5" />
            SCHEDULE LIST
          </button>
          <button
            onClick={() => setViewMode("crons")}
            className={cn(
              "px-3 py-1.5 cursor-pointer transition-colors flex items-center gap-1",
              viewMode === "crons" ? "bg-[#2d4a3e] text-[#faf9f5]" : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            CRON MANAGER
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d4a3e] mb-2" />
          <span className="text-xs font-mono text-[#1a1a1a]/60 tracking-wider">RESOLVING LIVE ACMI COORD SCHEDULER...</span>
        </div>
      ) : (
        <div className="p-4 md:p-6 space-y-6 flex-1">
          {/* ── View 1: Calendar Grid View ─────────────────────────── */}
          {viewMode === "month" && (
            <div className="space-y-6">
              {/* Navigation Header */}
              <div className="flex justify-between items-center bg-[#f4f2eb] p-3 border border-[#1a1a1a]/15">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 bg-[#faf9f5] border border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold tracking-wider px-2 min-w-32 text-center select-none uppercase">
                    {monthNames[month]} {year}
                  </span>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 bg-[#faf9f5] border border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={setToday}
                  className="px-3 py-1.5 font-mono text-[10px] font-bold bg-[#2d4a3e] hover:bg-[#2d4a3e]/90 text-[#faf9f5] uppercase tracking-wider cursor-pointer"
                >
                  RESET (MAY 2026)
                </button>
              </div>

              {/* Grid block */}
              <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] shadow-sm">
                <div className="grid grid-cols-7 border-b border-[#1a1a1a]/15 font-mono text-2xs font-bold text-center bg-[#f4f2eb]">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName) => (
                    <div key={dayName} className="py-2.5 border-r border-[#1a1a1a]/10 last:border-r-0 text-[#1a1a1a]/70">
                      {dayName}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 bg-[#1a1a1a]/5 gap-[1px]">
                  {calendarCells.map((cell, idx) => {
                    const dayEvents = events.filter((e) => e.date === cell.dateStr);
                    const isToday = cell.dateStr === "2026-05-20";

                    return (
                      <div
                        key={`${cell.dateStr}-${idx}`}
                        onClick={() => handleDayClick(cell)}
                        className={cn(
                          "min-h-24 md:min-h-28 bg-[#faf9f5] p-2 flex flex-col transition-all cursor-pointer relative group hover:bg-[#f4f2eb]/20",
                          !cell.isCurrentMonth && "bg-[#f4f2eb]/40 text-[#1a1a1a]/30",
                          isToday && "bg-[#2d4a3e]/4 border-2 border-[#2d4a3e]"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={cn(
                              "text-xs font-mono font-bold leading-none w-5 h-5 flex items-center justify-center",
                              isToday && "bg-[#2d4a3e] text-[#faf9f5]"
                            )}
                          >
                            {cell.dayNum}
                          </span>
                          {isToday && (
                            <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-[#2d4a3e] bg-[#2d4a3e]/10 border border-[#2d4a3e]/20 px-1 py-0.5">
                              Today
                            </span>
                          )}
                          {!isToday && cell.isCurrentMonth && (
                            <span className="text-[9px] font-mono text-[#2d4a3e] opacity-0 group-hover:opacity-100 transition-opacity">
                              + ADD
                            </span>
                          )}
                        </div>

                        <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar max-h-16">
                          {dayEvents.map((evt, idx) => (
                            <div
                              key={`${evt.id || "evt"}-${idx}`}
                              className={cn(
                                "text-[9px] leading-tight px-1.5 py-0.5 border font-mono font-semibold tracking-tight truncate select-none",
                                evt.kind === "milestone" && "bg-[#c4903a]/10 border-[#c4903a]/35 text-[#c4903a]",
                                evt.kind === "deadline" && "bg-[#9c3e3e]/10 border-[#9c3e3e]/35 text-[#9c3e3e]",
                                evt.kind === "task" && "bg-[#2d4a3e]/10 border-[#2d4a3e]/35 text-[#2d4a3e]"
                              )}
                            >
                              {evt.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── View 2: Schedule List (Hybrid agenda) ─────────────────────────── */}
          {viewMode === "schedule" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Agenda Shifts */}
              <div className="lg:col-span-2 border border-[#1a1a1a]/15 bg-[#faf9f5] p-5">
                <div className="border-b border-[#1a1a1a]/10 pb-3 mb-4">
                  <h2 className="text-sm font-bold font-mono uppercase tracking-wide text-[#2d4a3e] flex items-center gap-2">
                    <Clock className="w-4.5 h-4.5" />
                    Combined 24h Pipeline Agenda (Today)
                  </h2>
                  <p className="text-2xs text-[#1a1a1a]/50 font-mono mt-0.5 uppercase">
                    Chronological shift schedule merging custom coordination milestones & background crons
                  </p>
                </div>

                <div className="space-y-3">
                  {hybridSchedule.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex border border-[#1a1a1a]/10 items-center justify-between p-3.5 hover:border-[#1a1a1a]/20 transition-all",
                        item.type === "event" ? "bg-[#f4f2eb]/60" : "bg-[#faf9f5]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-20 font-mono text-2xs font-extrabold text-[#c4903a] text-center border border-[#c4903a]/30 bg-[#c4903a]/5 px-2 py-1 uppercase select-none">
                          {item.timeLabel}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold font-mono text-[#1a1a1a]">
                              {item.title}
                            </h3>
                            <span
                              className={cn(
                                "text-[9px] font-mono font-bold px-1.5 py-0.5 border uppercase",
                                item.type === "event"
                                  ? "bg-[#c4903a]/10 border-[#c4903a]/30 text-[#c4903a]"
                                  : "bg-[#2d4a3e]/10 border-[#2d4a3e]/30 text-[#2d4a3e]"
                              )}
                            >
                              {item.type}
                            </span>
                            {item.pipeline && (
                              <span className="text-[8px] font-mono bg-black/5 text-[#1a1a1a]/70 border border-[#1a1a1a]/10 px-1 py-0.5 uppercase">
                                {item.pipeline}
                              </span>
                            )}
                          </div>
                          {item.summary && (
                            <p className="text-[11px] text-[#1a1a1a]/60 mt-1 max-w-lg font-mono truncate">
                              Last run result: {item.summary}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Check if cron */}
                      {item.type === "cron" && item.status && (
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              item.status === "success" && "bg-[#2d4a3e]",
                              item.status === "failed" && "bg-[#9c3e3e]",
                              item.status === "running" && "bg-[#5ef2c6] animate-ping",
                              item.status === "idle" && "bg-gray-300"
                            )}
                          />
                          <span className="font-mono text-[9px] font-bold text-[#1a1a1a]/70 uppercase">
                            {item.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Mini pipeline flowchart */}
              <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-5 flex flex-col justify-between">
                <div>
                  <div className="border-b border-[#1a1a1a]/10 pb-3 mb-4">
                    <h2 className="text-sm font-bold font-mono uppercase tracking-wide text-[#2d4a3e]">
                      Business Pipeline Flows
                    </h2>
                    <p className="text-2xs text-[#1a1a1a]/50 font-mono mt-0.5 uppercase">
                      7 streams that map to full revenue automation loops
                    </p>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {[
                      { name: "Revenue", desc: "Lead Scorer ➜ OwnerScout ➜ HubSpot Sync ➜ Duane Call", color: "border-l-4 border-l-[#2d4a3e]" },
                      { name: "Marketing", desc: "AM Posts ➜ Episode Publish ➜ Storm-to-Social ➜ Sentiment", color: "border-l-4 border-l-[#c4903a]" },
                      { name: "Content", desc: "Grok Ep180+ Generator ➜ Video Upload ➜ Ebook Compiler", color: "border-l-4 border-l-[#2d4a3e]/65" },
                      { name: "Outreach", desc: "Inbox Janitor ➜ Auto-Responder ➜ SMS Day 3 ➜ Late Sender", color: "border-l-4 border-l-[#9c3e3e]" },
                      { name: "Projects", desc: "Priority Setter ➜ Health Auditer ➜ Milestone rollups", color: "border-l-4 border-l-[#1a1a1a]" },
                      { name: "Team", desc: "Telegram briefs ➜ Midday standups ➜ Rollups", color: "border-l-4 border-l-[#c4903a]" },
                      { name: "Ops", desc: "RAG indexer ➜ Sentinel ➜ Cost monitor ➜ Git Auto-commit", color: "border-l-4 border-l-gray-400" },
                    ].map((p, idx) => (
                      <div key={idx} className={cn("p-3 bg-[#faf9f5] border border-[#1a1a1a]/10 flex flex-col gap-1 hover:border-[#1a1a1a]/20 transition-all", p.color)}>
                        <h4 className="font-bold text-[#1a1a1a] uppercase text-2xs">{p.name} Pipeline</h4>
                        <p className="text-[10px] text-[#1a1a1a]/65 leading-relaxed">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-3 bg-[#faf9f5] border border-[#1a1a1a]/10 font-mono text-[10px] text-[#2d4a3e] font-semibold text-center select-none">
                  ⚡ ALL PIPELINES MONITORING AUTOMATION LOGGED ON BUS
                </div>
              </div>
            </div>
          )}

          {/* ── View 3: Cron Manager ─────────────────────────── */}
          {viewMode === "crons" && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#f4f2eb] p-4 border border-[#1a1a1a]/15 font-mono text-xs">
                {/* Shift filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#1a1a1a]/60 uppercase text-2xs select-none">Shifts:</span>
                  <div className="flex flex-wrap gap-1">
                    {shiftNames.map((shift) => (
                      <button
                        key={shift}
                        onClick={() => setCronFilterShift(shift === "ALL" ? "ALL" : shift.replace(" SHIFT", ""))}
                        className={cn(
                          "px-2.5 py-1 border text-[9px] font-bold uppercase transition-all cursor-pointer",
                          (shift === "ALL" && cronFilterShift === "ALL") ||
                          (shift !== "ALL" && cronFilterShift !== "ALL" && shift.includes(cronFilterShift))
                            ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]"
                            : "bg-[#faf9f5] text-[#1a1a1a]/70 border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5"
                        )}
                      >
                        {shift.replace(" SHIFT", "")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pipeline filters */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1a1a1a]/60 uppercase text-2xs select-none">Pipeline:</span>
                  <select
                    value={pipelineFilter}
                    onChange={(e) => setPipelineFilter(e.target.value)}
                    className="bg-[#faf9f5] border border-[#1a1a1a]/25 px-2 py-1 text-2xs font-bold uppercase outline-none focus:border-[#2d4a3e] cursor-pointer"
                  >
                    {pipelineNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster high density table */}
              <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] overflow-x-auto shadow-sm">
                <table className="w-full border-collapse font-mono text-xs text-left">
                  <thead>
                    <tr className="bg-[#f4f2eb] border-b border-[#1a1a1a]/15 font-bold uppercase text-[10px]">
                      <th className="p-3 border-r border-[#1a1a1a]/10">Employee / Cron ID</th>
                      <th className="p-3 border-r border-[#1a1a1a]/10">Shift</th>
                      <th className="p-3 border-r border-[#1a1a1a]/10">Schedule</th>
                      <th className="p-3 border-r border-[#1a1a1a]/10">Pipeline</th>
                      <th className="p-3 border-r border-[#1a1a1a]/10">Target Script / command</th>
                      <th className="p-3 border-r border-[#1a1a1a]/10 text-center">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCrons.map((cron, idx) => {
                      const exec = getCronExecutionStatus(cron.id);
                      const isSelected = selectedCronId === cron.id;

                      return (
                        <tr
                          key={`${cron.id}-${idx}`}
                          onClick={() => setSelectedCronId(isSelected ? null : cron.id)}
                          className={cn(
                            "border-b border-[#1a1a1a]/10 last:border-b-0 hover:bg-[#2d4a3e]/2 cursor-pointer transition-colors",
                            isSelected && "bg-[#2d4a3e]/4 font-bold"
                          )}
                        >
                          <td className="p-3 border-r border-[#1a1a1a]/10 font-bold flex items-center gap-1.5 truncate">
                            {cron.isStarred && <span className="text-[#c4903a]">★</span>}
                            {cron.name}
                            {cron.isNew && (
                              <span className="text-[7px] bg-[#5ef2c6]/30 text-[#2d4a3e] border border-[#2d4a3e]/20 px-1 py-0.5 uppercase tracking-wide">
                                new
                              </span>
                            )}
                          </td>
                          <td className="p-3 border-r border-[#1a1a1a]/10 uppercase text-[10px] text-[#1a1a1a]/60 truncate">
                            {cron.shift}
                          </td>
                          <td className="p-3 border-r border-[#1a1a1a]/10 text-[10px] whitespace-nowrap">
                            {cron.clockIn} - {cron.clockOut}
                          </td>
                          <td className="p-3 border-r border-[#1a1a1a]/10 uppercase text-[10px]">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 border text-[9px] font-extrabold tracking-wide",
                                cron.pipeline.toLowerCase() === "revenue" && "bg-emerald-50 border-emerald-200 text-emerald-700",
                                cron.pipeline.toLowerCase() === "marketing" && "bg-[#c4903a]/10 border-[#c4903a]/30 text-[#c4903a]",
                                cron.pipeline.toLowerCase() === "outreach" && "bg-rose-50 border-rose-200 text-rose-700",
                                cron.pipeline.toLowerCase() === "ops" && "bg-gray-50 border-gray-200 text-gray-700",
                                cron.pipeline.toLowerCase() === "team" && "bg-[#2d4a3e]/10 border-[#2d4a3e]/30 text-[#2d4a3e]"
                              )}
                            >
                              {cron.pipeline}
                            </span>
                          </td>
                          <td className="p-3 border-r border-[#1a1a1a]/10 max-w-xs truncate text-[11px] text-[#1a1a1a]/70" title={cron.script}>
                            {cron.script}
                          </td>
                          <td className="p-3 border-r border-[#1a1a1a]/10 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  exec.status === "success" && "bg-[#2d4a3e]",
                                  exec.status === "failed" && "bg-[#9c3e3e]",
                                  exec.status === "running" && "bg-[#5ef2c6] animate-ping",
                                  exec.status === "idle" && "bg-gray-300"
                                )}
                              />
                              <span className="text-[9px] uppercase font-bold text-[#1a1a1a]/70">
                                {exec.status}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              className={cn(
                                "px-2 py-1 text-[9px] font-bold border uppercase cursor-pointer transition-colors",
                                isSelected ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]" : "bg-[#f4f2eb] text-[#1a1a1a]/70 border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5"
                              )}
                            >
                              {isSelected ? "HIDE LOGS" : "VIEW LOGS"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Thread Log / ACMI Coordination Timeline ─────────────────────────── */}
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-5 rounded-none shadow-sm">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-3 mb-4">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#2d4a3e] flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5" />
                {selectedCronId ? `ACMI Logs: ${selectedCronId}` : "Live ACMI Coordination Stream"}
              </h2>
              {selectedCronId && (
                <button
                  onClick={() => setSelectedCronId(null)}
                  className="font-mono text-[9px] font-extrabold uppercase bg-transparent text-[#9c3e3e] border border-[#9c3e3e]/30 px-2 py-0.5 hover:bg-[#9c3e3e]/5 cursor-pointer"
                >
                  Clear Filter [X]
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredTimeline.length > 0 ? (
                filteredTimeline.slice(0, 10).map((item, idx) => (
                  <div
                    key={`${item.id || "item"}-${idx}`}
                    className="flex gap-3 bg-[#faf9f5] border border-[#1a1a1a]/10 p-3.5 items-start hover:border-[#1a1a1a]/25 transition-all"
                  >
                    <div className="p-1.5 bg-[#f4f2eb] border border-[#1a1a1a]/15 flex items-center justify-center shrink-0">
                      {getTimelineIcon(item.source)}
                    </div>
                    <div className="flex-1 font-mono text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[#2d4a3e] bg-[#2d4a3e]/5 px-2 py-0.5 border border-[#2d4a3e]/15 text-[10px] uppercase">
                            {item.source}
                          </span>
                          <span className="text-[9px] text-[#1a1a1a]/55 border border-[#1a1a1a]/10 px-1.5 py-0.5 uppercase tracking-wide font-medium">
                            {item.kind}
                          </span>
                        </div>
                        <span className="text-2xs text-[#1a1a1a]/40 shrink-0 font-medium">
                          {formatTimeAgo(item.ts)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#1a1a1a]/85 font-sans leading-normal">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 font-mono text-xs text-[#1a1a1a]/40 border border-dashed border-[#1a1a1a]/15 select-none bg-[#faf9f5]">
                  NO RECENT LOGS RECEIVED IN THIS FILTER STREAM.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tactile Brutalist Event Creation Overlay Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#faf9f5] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_#1a1a1a] flex flex-col rounded-none">
            <div className="flex items-center justify-between p-3.5 border-b border-[#1a1a1a] bg-[#f4f2eb] font-mono">
              <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#2d4a3e]" /> Create ACMI Coordination Event
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#1a1a1a] hover:text-[#9c3e3e] cursor-pointer"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="p-4 space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <label className="block font-bold text-[#1a1a1a]/60 uppercase tracking-wide">
                  Target Workspace Date
                </label>
                <input
                  type="text"
                  value={selectedDayStr}
                  disabled
                  className="w-full px-3 py-2 bg-[#f4f2eb] border border-[#1a1a1a]/15 text-[#1a1a1a]/50 text-xs rounded-none focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <label className="block font-bold text-[#1a1a1a]/60 uppercase tracking-wide">
                  Event Title / Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.G. API RETRY PIPELINE DEPLOYED"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-[#faf9f5] border border-[#1a1a1a]/30 text-xs rounded-none uppercase focus:outline-none focus:border-[#2d4a3e] placeholder-[#1a1a1a]/30"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <label className="block font-bold text-[#1a1a1a]/60 uppercase tracking-wide">
                  Original Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["milestone", "deadline", "task"] as const).map((kd) => (
                    <button
                      key={kd}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setNewKind(kd)}
                      className={cn(
                        "py-2 border text-2xs uppercase tracking-wider font-bold transition-colors cursor-pointer rounded-none",
                        newKind === kd
                          ? kd === "milestone"
                            ? "bg-[#c4903a] text-[#faf9f5] border-[#c4903a]"
                            : kd === "deadline"
                            ? "bg-[#9c3e3e] text-[#faf9f5] border-[#9c3e3e]"
                            : "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]"
                          : "bg-[#f4f2eb] text-[#1a1a1a]/60 border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5"
                      )}
                    >
                      {kd === "milestone" && "● "}
                      {kd === "deadline" && "⚠ "}
                      {kd === "task" && "▹ "}
                      {kd}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1a1a1a]/10 flex justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#f4f2eb] hover:bg-[#1a1a1a]/5 text-[#1a1a1a]/80 border border-[#1a1a1a]/15 cursor-pointer rounded-none uppercase font-bold tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-4 py-2 bg-[#2d4a3e] hover:bg-[#2d4a3e]/90 text-[#faf9f5] font-bold cursor-pointer rounded-none uppercase tracking-wider flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> SAVING
                    </>
                  ) : (
                    "COMMIT EVENT"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
