"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Notebook,
  Plus,
  Search,
  Bold,
  Italic,
  Heading,
  Code,
  List,
  CheckSquare,
  Hash,
  Eye,
  Edit3,
  Loader2,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { acmiClient } from "@/lib/acmi-client";
import type { AcmiProfile } from "@/lib/acmi-types";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  preview: string;
  tags: string[];
  modified: string;
}

const DEFAULT_NOTES: NoteItem[] = [
  {
    id: "note-1",
    title: "ACMI Fleet Architecture v1.3",
    content: `## ACMI Fleet Architecture v1.3

The ACMI protocol defines three storage slots per entity:

### Profile (permanent)
Stores identity: agent name, role, model tier, team assignments. Set once, rarely changed.

### Signals (mutable)
Current state: status (online/idle/offline), current task, focus area, last heartbeat. Changes frequently.

### Timeline (append-only)
Every event logged chronologically. Supports kind tagging (coord-note, milestone, decision, handoff, incident, heartbeat) for filtering across threads.

### Key Insight
The three-slot model replaces the traditional "single document" approach — agents don't share state via one shared file, they each maintain their own three slots and the fleet orchestrator merges timelines on demand.

#acmi #architecture`,
    preview: "The ACMI protocol defines three storage slots per entity: profile, signals, and timeline...",
    tags: ["acmi", "architecture"],
    modified: new Date(Date.now() - 720000).toISOString(), // 12m ago
  },
  {
    id: "note-2",
    title: "cowork-kanban Audit Findings",
    content: `## cowork-kanban Audit Findings

7 issues identified across typographic alignment, letterpress tactile states, and mobile viewport scaling:
1. Sharp border radii (--radius: 0px) must be enforced across mobile overlays.
2. Badge margins contain offset vertical alignments.
3. Scrollable telemetry container wraps early.

#design #audit`,
    preview: "7 issues identified across typographic alignment, letterpress tactile states, and mobile scaling...",
    tags: ["design", "audit"],
    modified: new Date(Date.now() - 7200000).toISOString(), // 2h ago
  },
  {
    id: "note-3",
    title: "OwnerScout Deployment Plan",
    content: `## OwnerScout Deployment Plan

Pipeline stages:
- VAPI integration
- Webhook configuration
- End-to-end testing
- Fleet production launch

Currently blocked on API key rotation from growth hacker.

#ownerscout #deploy`,
    preview: "Pipeline stages: VAPI integration → webhook setup → testing → production deploy. Blocked on API...",
    tags: ["ownerscout", "deploy"],
    modified: new Date(Date.now() - 86400000).toISOString(), // 1d ago
  },
  {
    id: "note-4",
    title: "Secret Manager Design Decisions",
    content: `## Secret Manager Design Decisions

AES-256-GCM with per-file salt. Keys stored in macOS Keychain.
Implementation in ~/clawd/secret-manager/ to protect developer tokens.

#security #infra`,
    preview: "AES-256-GCM with per-file salt. Keys stored in macOS Keychain. Implementation in...",
    tags: ["security", "infra"],
    modified: new Date(Date.now() - 259200000).toISOString(), // 3d ago
  },
];

export default function NotesPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editorText, setEditorText] = useState("");
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "error">("synced");

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load from bootstrap aggregate or fallback
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await acmiClient.fetchDashboardBootstrap();
      if (data && data.notes && data.notes.length > 0) {
        const parsed: NoteItem[] = (data.notes as Array<{ id: string; profile?: Record<string, unknown>; signals?: Record<string, unknown> }>).map((n) => {
          const profile = n.profile || {};
          const signals = n.signals || {};
          return {
            id: n.id,
            title: (profile.title || n.id) as string,
            content: (profile.content || "") as string,
            preview: (profile.preview || String(profile.content || "").substring(0, 100)) as string,
            tags: (profile.tags as string[]) || [],
            modified: (signals.lastModified || profile.modified || new Date().toISOString()) as string,
          };
        });
        setNotes(parsed);
        if (parsed.length > 0) {
          setActiveNoteId(parsed[0].id);
          setEditorText(parsed[0].content);
        }
      } else {
        setNotes(DEFAULT_NOTES);
        if (DEFAULT_NOTES.length > 0) {
          setActiveNoteId(DEFAULT_NOTES[0].id);
          setEditorText(DEFAULT_NOTES[0].content);
        }
      }
    } catch (err) {
      console.error("Error fetching notes bootstrap:", err);
      setNotes(DEFAULT_NOTES);
      if (DEFAULT_NOTES.length > 0) {
        setActiveNoteId(DEFAULT_NOTES[0].id);
        setEditorText(DEFAULT_NOTES[0].content);
      }
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

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Sync editor change to local state and trigger debounced Redis save
  const handleEditorChange = (text: string) => {
    setEditorText(text);
    if (!activeNoteId) return;

    // Optimistically update list card info
    const { title, tags, preview } = parseNoteMetadata(text);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNoteId
          ? {
              ...n,
              title,
              content: text,
              preview,
              tags,
              modified: new Date().toISOString(),
            }
          : n
      )
    );

    setSaveStatus("saving");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const timestamp = new Date().toISOString();
        await acmiClient.setProfile("note", activeNoteId, {
          actor_type: "system",
          title,
          content: text,
          preview,
          tags,
          modified: timestamp,
        } as unknown as AcmiProfile);
        await acmiClient.setSignal("note", activeNoteId, "lastModified", timestamp);
        setSaveStatus("synced");
      } catch (err) {
        console.error("Failed to auto-save note:", err);
        setSaveStatus("error");
      }
    }, 1000);
  };

  // Helper to parse notes title, tags, and content preview
  const parseNoteMetadata = (text: string) => {
    let title = "Untitled Note";
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        title = trimmed.substring(2).trim();
        break;
      } else if (trimmed.length > 0) {
        title = trimmed;
        break;
      }
    }

    const tags: string[] = [];
    const tagMatches = text.match(/#[a-zA-Z0-9_-]+/g);
    if (tagMatches) {
      tagMatches.forEach((m) => {
        const t = m.substring(1).trim();
        if (t && !tags.includes(t)) tags.push(t);
      });
    }

    let preview = text
      .replace(/[#*`_~-]/g, "")
      .trim()
      .substring(0, 100);
    if (text.length > 100) preview += "...";

    return { title, tags, preview };
  };

  const selectNote = (id: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    const note = notes.find((n) => n.id === id);
    if (note) {
      setActiveNoteId(id);
      setEditorText(note.content);
      setSaveStatus("synced");
    }
  };

  const createNewNote = async () => {
    const newId = `note-${Date.now()}`;
    const newNote: NoteItem = {
      id: newId,
      title: "New Note",
      content: `# New Note\n\nWrite your notes here...\n\n#draft`,
      preview: "Write your notes here...",
      tags: ["draft"],
      modified: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
    setEditorText(newNote.content);
    setSaveStatus("saving");

    try {
      await acmiClient.setProfile("note", newId, {
        actor_type: "system",
        title: newNote.title,
        content: newNote.content,
        preview: newNote.preview,
        tags: newNote.tags,
        modified: newNote.modified,
      } as unknown as AcmiProfile);
      await acmiClient.setSignal("note", newId, "lastModified", newNote.modified);
      setSaveStatus("synced");
    } catch (err) {
      console.error("Failed to create new note in database:", err);
      setSaveStatus("error");
    }
  };

  // Helper to append formatting syntax to selected textarea region
  const insertFormatting = (syntaxBefore: string, syntaxAfter: string = "") => {
    const textarea = document.getElementById("note-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selection = value.substring(start, end);

    const replacement = syntaxBefore + selection + syntaxAfter;
    const newValue = value.substring(0, start) + replacement + value.substring(end);

    handleEditorChange(newValue);

    // Refocus & reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxBefore.length,
        start + syntaxBefore.length + selection.length
      );
    }, 50);
  };

  // Filter notes list by query
  const filteredNotes = notes.filter((n) => {
    const query = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      n.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const allUniqueTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  return (
    <div className="flex flex-col h-full bg-[#faf9f5]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1a1a1a]/15 bg-[#faf9f5] p-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-[#2d4a3e]/10 border border-[#2d4a3e]/30 text-[#2d4a3e] rounded-none">
            <Notebook className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-[#1a1a1a] uppercase tracking-wide">
              Notes Editor
            </h1>
            <p className="text-xs text-[#1a1a1a]/60 font-mono">
              {loading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Synchronizing...
                </span>
              ) : (
                `Synchronized · ${notes.length} notes · ${allUniqueTags.length} tags`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[10px] font-mono uppercase px-2 py-1 border flex items-center gap-1.5",
              saveStatus === "synced" && "bg-[#2d4a3e]/15 text-[#2d4a3e] border-[#2d4a3e]/30",
              saveStatus === "saving" && "bg-[#c4903a]/15 text-[#c4903a] border-[#c4903a]/30",
              saveStatus === "error" && "bg-[#9c3e3e]/15 text-[#9c3e3e] border-[#9c3e3e]/30"
            )}
          >
            {saveStatus === "saving" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
            {saveStatus === "synced" && "• SYNCED"}
            {saveStatus === "saving" && "• SAVING TO REDIS"}
            {saveStatus === "error" && "• WRITE ERROR"}
          </span>
          <button
            onClick={createNewNote}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d4a3e] text-[#faf9f5] border border-[#1a1a1a]/20 text-xs font-mono font-bold tracking-wider hover:bg-[#20362b] active:translate-y-0.5 rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> NEW NOTE
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d4a3e] mb-2" />
          <span className="text-xs font-mono text-[#1a1a1a]/60">LOADING ACMI NOTES...</span>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Notes List Explorer */}
          <div className="lg:col-span-4 border-r border-[#1a1a1a]/15 flex flex-col bg-[#f4f2eb] min-h-[300px] lg:min-h-0 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-[#1a1a1a]/15 bg-[#faf9f5]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#1a1a1a]/40" />
                <input
                  type="text"
                  placeholder="SEARCH NOTES OR #TAGS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#f4f2eb] border border-[#1a1a1a]/15 text-xs font-mono placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#2d4a3e]/50 rounded-none uppercase"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1a1a1a]/10">
              {filteredNotes.length === 0 ? (
                <div className="p-6 text-center text-[#1a1a1a]/50 font-mono text-xs">
                  NO MATCHING NOTES FOUND
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isActive = note.id === activeNoteId;
                  const timeAgo = formatTimeAgo(note.modified);
                  return (
                    <div
                      key={note.id}
                      onClick={() => selectNote(note.id)}
                      className={cn(
                        "p-4 cursor-pointer transition-all border-l-4 rounded-none",
                        isActive
                          ? "bg-[#faf9f5] border-l-[#2d4a3e] shadow-[inset_1px_1px_4px_rgba(26,26,26,0.05)]"
                          : "border-l-transparent hover:bg-[#faf9f5]/50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-mono text-xs font-bold text-[#1a1a1a] uppercase truncate leading-snug">
                          {note.title}
                        </h3>
                        <span className="text-[9px] font-mono text-[#1a1a1a]/40 flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" /> {timeAgo}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#1a1a1a]/70 line-clamp-2 leading-relaxed mb-2.5 font-sans">
                        {note.preview}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 bg-[#2d4a3e]/5 text-[#2d4a3e]/80 border border-[#2d4a3e]/10 lowercase"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Editor Pane */}
          <div className="lg:col-span-8 flex flex-col bg-[#faf9f5] overflow-hidden">
            {activeNote ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Editor Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a]/15 bg-[#f4f2eb] shrink-0 overflow-x-auto gap-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => insertFormatting("**", "**")}
                      title="Bold"
                      className="p-1.5 hover:bg-[#1a1a1a]/5 active:bg-[#1a1a1a]/10 border border-transparent hover:border-[#1a1a1a]/10 text-[#1a1a1a]/75"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => insertFormatting("*", "*")}
                      title="Italic"
                      className="p-1.5 hover:bg-[#1a1a1a]/5 active:bg-[#1a1a1a]/10 border border-transparent hover:border-[#1a1a1a]/10 text-[#1a1a1a]/75"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => insertFormatting("### ")}
                      title="Heading"
                      className="p-1.5 hover:bg-[#1a1a1a]/5 active:bg-[#1a1a1a]/10 border border-transparent hover:border-[#1a1a1a]/10 text-[#1a1a1a]/75"
                    >
                      <Heading className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => insertFormatting("`", "`")}
                      title="Code"
                      className="p-1.5 hover:bg-[#1a1a1a]/5 active:bg-[#1a1a1a]/10 border border-transparent hover:border-[#1a1a1a]/10 text-[#1a1a1a]/75"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => insertFormatting("- ")}
                      title="List"
                      className="p-1.5 hover:bg-[#1a1a1a]/5 active:bg-[#1a1a1a]/10 border border-transparent hover:border-[#1a1a1a]/10 text-[#1a1a1a]/75"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => insertFormatting("- [ ] ")}
                      title="Checklist"
                      className="p-1.5 hover:bg-[#1a1a1a]/5 active:bg-[#1a1a1a]/10 border border-transparent hover:border-[#1a1a1a]/10 text-[#1a1a1a]/75"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewMode("edit")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 text-2xs font-mono border transition-all rounded-none",
                        previewMode === "edit"
                          ? "bg-[#2d4a3e] text-[#faf9f5] border-[#1a1a1a]/20 font-bold"
                          : "bg-transparent text-[#1a1a1a]/60 border-transparent hover:bg-[#1a1a1a]/5"
                      )}
                    >
                      <Edit3 className="w-3 h-3" /> WRITE
                    </button>
                    <button
                      onClick={() => setPreviewMode("preview")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 text-2xs font-mono border transition-all rounded-none",
                        previewMode === "preview"
                          ? "bg-[#2d4a3e] text-[#faf9f5] border-[#1a1a1a]/20 font-bold"
                          : "bg-transparent text-[#1a1a1a]/60 border-transparent hover:bg-[#1a1a1a]/5"
                      )}
                    >
                      <Eye className="w-3 h-3" /> READ MD
                    </button>
                  </div>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#faf9f5]">
                  {previewMode === "edit" ? (
                    <textarea
                      id="note-textarea"
                      value={editorText}
                      onChange={(e) => handleEditorChange(e.target.value)}
                      placeholder="WRITE YOUR NOTE... SUPPORTS **MARKDOWN**, `CODE`, AND #TAGS..."
                      className="w-full h-full min-h-[400px] resize-none border-0 p-0 focus:ring-0 focus:outline-none bg-transparent font-mono text-sm leading-relaxed text-[#1a1a1a] placeholder-[#1a1a1a]/30"
                    />
                  ) : (
                    <article className="prose max-w-none text-[#1a1a1a] font-serif leading-relaxed text-sm">
                      <div className="border-b border-[#1a1a1a]/10 pb-4 mb-6">
                        <h2 className="text-xl font-bold font-mono uppercase tracking-wide mb-2 text-[#1a1a1a]">
                          {activeNote.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-2xs font-mono text-[#1a1a1a]/50">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> MODIFIED {formatTimeAgo(activeNote.modified)}
                          </span>
                          <span>•</span>
                          <span>ID: {activeNote.id}</span>
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                        {editorText || (
                          <span className="font-mono text-xs text-[#1a1a1a]/40 uppercase italic">
                            Empty note body
                          </span>
                        )}
                      </div>
                    </article>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#1a1a1a]/40 font-mono text-xs">
                SELECT A NOTE TO VIEW OR EDIT
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple absolute date to friendly relative time calculator
function formatTimeAgo(dateString: string): string {
  if (!dateString) return "unknown";
  try {
    const past = new Date(dateString).getTime();
    const diff = Date.now() - past;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  } catch {
    return "some time ago";
  }
}
