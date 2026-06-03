"use client";

import { useEffect, useState } from "react";
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

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Current calendar navigation date
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Default starting page at May 2026 to show default data cleanly
    return new Date(2026, 4, 1); // May is index 4
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<"milestone" | "deadline" | "task">("task");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load calendar & timeline events
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await acmiClient.fetchDashboardBootstrap();
      if (data) {
        // Parse calendar events from fetched list
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Reset to today / default May 2026
  const setToday = () => {
    setCurrentDate(new Date(2026, 4, 1));
  };

  // Compute days for calendar grid
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday
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

  // Grid list construction
  const calendarCells = [];

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({
      dayNum: d,
      isCurrentMonth: false,
      dateStr,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({
      dayNum: d,
      isCurrentMonth: true,
      dateStr,
    });
  }

  // Next month padding to reach 35 or 42 cells total (prefer 42 for a full neat block layout)
  const remainingCells = 42 - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({
      dayNum: d,
      isCurrentMonth: false,
      dateStr,
    });
  }

  // Handle day click to create event
  const handleDayClick = (cell: { dayNum: number; isCurrentMonth: boolean; dateStr: string }) => {
    setSelectedDayStr(cell.dateStr);
    setNewTitle("");
    setNewKind("task");
    setModalOpen(true);
  };

  // Submit new calendar event back to Redis
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedDayStr) return;

    setIsSubmitting(true);
    const uuid = "event-" + Math.random().toString(36).substring(2, 11);

    try {
      // 1. Write the profile entry
      await acmiClient.setProfile("event", uuid, {
        title: newTitle.trim(),
        start: selectedDayStr,
        end: selectedDayStr,
        kind: newKind,
        allDay: true,
      } as any);

      // 2. Logging the coordination log event
      await acmiClient.appendEvent("event", uuid, {
        ts: Date.now(),
        source: "gsd-dashboard-operator",
        kind: newKind,
        summary: `Created calendar event: ${newTitle.trim()} (${newKind}) for ${selectedDayStr}`,
        correlationId: "calEvent-" + Date.now(),
      });

      // 3. Update local state instantly and optimistically
      const newEvt: CalendarEvent = {
        id: uuid,
        title: newTitle.trim(),
        date: selectedDayStr,
        kind: newKind,
      };

      setEvents((prev) => [...prev, newEvt]);

      // Add timeline item
      const newTimelineItem: TimelineItem = {
        id: "t-new-" + Date.now(),
        ts: Date.now(),
        source: "gsd-dashboard-operator",
        kind: newKind,
        summary: `Created event: ${newTitle.trim()}`,
      };
      setTimeline((prev) => [newTimelineItem, ...prev]);

      setModalOpen(false);
    } catch (err) {
      console.error("Failed to create ACMI event:", err);
      alert("Failed to write calendar event to ACMI.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventsForDay = (dateStr: string) => {
    return events.filter((e) => e.date === dateStr);
  };

  // Utility to convert timestamps to relative string
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

  // Map source string to aesthetic icons
  const getTimelineIcon = (source: string) => {
    if (source.includes("claude")) return <Workflow className="w-4.5 h-4.5 text-[#2d4a3e]" />;
    if (source.includes("design") || source.includes("brand")) return <Compass className="w-4.5 h-4.5 text-[#c4903a]" />;
    if (source.includes("operator")) return <CheckCircle className="w-4.5 h-4.5 text-[#2d4a3e]" />;
    return <FileText className="w-4.5 h-4.5 text-[#1a1a1a]/50" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#faf9f5] overflow-y-auto font-sans relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1a1a1a]/15 bg-[#faf9f5] p-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-[#2d4a3e]/10 border border-[#2d4a3e]/30 text-[#2d4a3e] rounded-none">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-[#1a1a1a] uppercase tracking-wide">
              Calendar & Timeline
            </h1>
            <p className="text-xs text-[#1a1a1a]/60 font-mono">
              {monthNames[month]} {year} · {events.length} ACTIVE COORD EVENTS
            </p>
          </div>
        </div>

        {/* Navigation Toolbar */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={prevMonth}
            className="p-1.5 bg-[#f4f2eb] border border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5 cursor-pointer rounded-none"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-[#faf9f5] border border-[#1a1a1a]/15 font-bold tracking-wider select-none text-center min-w-32 block">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 bg-[#f4f2eb] border border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5 cursor-pointer rounded-none"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={setToday}
            className="px-3 py-1.5 ml-2 bg-[#2d4a3e] hover:bg-[#2d4a3e]/90 text-[#faf9f5] font-bold uppercase tracking-wider cursor-pointer rounded-none"
          >
            MAY 2026
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d4a3e] mb-2" />
          <span className="text-xs font-mono text-[#1a1a1a]/60">LOADING ACMI CALENDAR...</span>
        </div>
      ) : (
        <div className="p-4 md:p-6 space-y-6 flex-1">
          {/* Day Names Grid Header */}
          <div className="border border-[#1a1a1a]/15 bg-[#faf9f5]">
            <div className="grid grid-cols-7 border-b border-[#1a1a1a]/15 font-mono text-xs font-bold text-center bg-[#f4f2eb]">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName) => (
                <div key={dayName} className="py-2 border-r border-[#1a1a1a]/10 last:border-r-0 text-[#1a1a1a]/70">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 bg-[#1a1a1a]/5 gap-[1px]">
              {calendarCells.map((cell, idx) => {
                const dayEvents = getEventsForDay(cell.dateStr);
                const isToday = cell.dateStr === "2026-05-20"; // Match the exact simulated today date in legacy

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => handleDayClick(cell)}
                    className={cn(
                      "min-h-24 md:min-h-28 bg-[#faf9f5] p-2 flex flex-col transition-all cursor-pointer relative group",
                      !cell.isCurrentMonth && "bg-[#f4f2eb]/40 text-[#1a1a1a]/30",
                      isToday && "bg-[#2d4a3e]/4 border-2 border-[#2d4a3e]"
                    )}
                  >
                    {/* Day Number and Badges */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={cn(
                          "text-xs font-mono font-bold leading-none w-5 h-5 flex items-center justify-center rounded-none",
                          isToday && "bg-[#2d4a3e] text-[#faf9f5]"
                        )}
                      >
                        {cell.dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#2d4a3e] bg-[#2d4a3e]/10 border border-[#2d4a3e]/20 px-1 py-0.5">
                          Today
                        </span>
                      )}
                      {!isToday && cell.isCurrentMonth && (
                        <span className="text-[9px] font-mono text-[#2d4a3e] opacity-0 group-hover:opacity-100 transition-opacity">
                          + ADD
                        </span>
                      )}
                    </div>

                    {/* Event chips */}
                    <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                      {dayEvents.map((evt, idx) => (
                        <div
                          key={`${evt.id || "evt"}-${idx}`}
                          className={cn(
                            "text-[10px] leading-tight px-1.5 py-0.5 border font-mono font-semibold tracking-tight truncate select-none",
                            evt.kind === "milestone" && "bg-[#c4903a]/10 border-[#c4903a]/35 text-[#c4903a]",
                            evt.kind === "deadline" && "bg-[#9c3e3e]/10 border-[#9c3e3e]/35 text-[#9c3e3e]",
                            evt.kind === "task" && "bg-[#2d4a3e]/10 border-[#2d4a3e]/35 text-[#2d4a3e]"
                          )}
                          title={`${evt.kind.toUpperCase()}: ${evt.title}`}
                        >
                          {evt.kind === "milestone" && "● "}
                          {evt.kind === "deadline" && "⚠ "}
                          {evt.kind === "task" && "▹ "}
                          {evt.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coordination Log Timeline Stream */}
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)]">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2 mb-4">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#2d4a3e] flex items-center gap-2">
                <Clock className="w-4 h-4" /> Real-Time ACMI Coordination Stream
              </h2>
              <span className="text-[10px] font-mono text-[#1a1a1a]/40 uppercase tracking-widest">[SYSTEM LOGS: OK]</span>
            </div>

            <div className="space-y-3">
              {timeline.length > 0 ? (
                timeline.slice(0, 8).map((item, idx) => (
                  <div
                    key={`${item.id || "item"}-${idx}`}
                    className="flex gap-3 bg-[#faf9f5] border border-[#1a1a1a]/10 p-3 items-start hover:border-[#1a1a1a]/20 transition-colors"
                  >
                    <div className="p-1.5 bg-[#f4f2eb] border border-[#1a1a1a]/15 flex items-center justify-center shrink-0">
                      {getTimelineIcon(item.source)}
                    </div>
                    <div className="flex-1 font-mono text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#2d4a3e] bg-[#2d4a3e]/5 px-1 py-0.5 border border-[#2d4a3e]/15 text-2xs uppercase">
                            {item.source}
                          </span>
                          <span className="text-2xs text-[#1a1a1a]/50 border border-[#1a1a1a]/10 px-1 py-0.5 uppercase tracking-wide">
                            {item.kind}
                          </span>
                        </div>
                        <span className="text-2xs text-[#1a1a1a]/40 shrink-0 font-medium">
                          {formatTimeAgo(item.ts)}
                        </span>
                      </div>
                      <p className="text-xs text-[#1a1a1a]/85 font-sans leading-normal">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 font-mono text-xs text-[#1a1a1a]/50 border border-dashed border-[#1a1a1a]/15">
                  NO RECENT LOGS RECEIVED IN ACMI STREAM.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tactile Brutalist Event Creation Overlay Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#faf9f5] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_#1a1a1a] flex flex-col rounded-none">
            {/* Modal Title */}
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

            {/* Modal Body */}
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
                  Coordination Type
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

              {/* Submit Buttons */}
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
