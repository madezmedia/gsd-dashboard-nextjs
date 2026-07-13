"use client";

import { useEffect, useState, useMemo } from "react";
import { FileText, ClipboardList, PenTool, Search, ChevronRight, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NocoDBRecord {
  id: number;
  fields: Record<string, any>;
}

export function DocsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"docs" | "procedures" | "notes">("docs");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<{ documents: NocoDBRecord[]; procedures: NocoDBRecord[] }>({
    documents: [],
    procedures: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<NocoDBRecord | null>(null);

  // Scratchpad Notes State
  const [scratchpadText, setScratchpadText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gsd_dashboard_scratchpad") || "";
      setScratchpadText(saved);
    }
  }, []);

  const handleNotesChange = (text: string) => {
    setScratchpadText(text);
    if (typeof window !== "undefined") {
      localStorage.setItem("gsd_dashboard_scratchpad", text);
    }
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(scratchpadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!isOpen) return;
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/nocodb-viewer");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData({
              documents: json.data.documents || [],
              procedures: json.data.procedures || []
            });
          }
        }
      } catch (err) {
        console.error("Failed to load documents inside drawer:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [isOpen]);

  const listItems = useMemo(() => {
    const list = activeTab === "docs" ? data.documents : data.procedures;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const title = item.fields.Title || item.fields.Name || "";
      const body = item.fields.Body || item.fields.Steps || "";
      return String(title).toLowerCase().includes(q) || String(body).toLowerCase().includes(q);
    });
  }, [data, activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card border-l border-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-secondary">
        <div>
          <h3 className="text-sm font-bold font-mono text-primary uppercase flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Fleet Docs & Scratch Notes
          </h3>
          <p className="text-[9px] font-mono text-muted-foreground uppercase">
            Internal knowledge base & operator scratchpad
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 text-foreground/60 hover:text-foreground border border-border rounded-none bg-background"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-background p-1 gap-1 shrink-0">
        <button
          onClick={() => { setActiveTab("docs"); setSelectedRecord(null); }}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1",
            activeTab === "docs"
              ? "bg-card font-bold border border-border text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Documents</span>
        </button>
        <button
          onClick={() => { setActiveTab("procedures"); setSelectedRecord(null); }}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1",
            activeTab === "procedures"
              ? "bg-card font-bold border border-border text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          <span>Procedures</span>
        </button>
        <button
          onClick={() => { setActiveTab("notes"); setSelectedRecord(null); }}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1",
            activeTab === "notes"
              ? "bg-card font-bold border border-border text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <PenTool className="h-3.5 w-3.5" />
          <span>Scratchpad</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {selectedRecord ? (
          /* Detailed View */
          <div className="flex-1 flex flex-col min-h-0 bg-card animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-3 border-b border-border bg-background/50 shrink-0">
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back to List
              </button>
              <button
                onClick={() => {
                  const content = selectedRecord.fields.Body || selectedRecord.fields.Steps || "";
                  navigator.clipboard.writeText(String(content));
                }}
                className="text-[9px] font-mono border border-border px-1.5 py-0.5 hover:bg-secondary flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy Content
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <h2 className="text-base font-bold font-serif text-primary">
                {selectedRecord.fields.Title || selectedRecord.fields.Name}
              </h2>
              <div className="text-[10px] font-mono text-muted-foreground flex gap-3 uppercase border-b border-border pb-2">
                {selectedRecord.fields.Category && <span>Cat: {selectedRecord.fields.Category}</span>}
                {selectedRecord.fields["Owner Agent"] && <span>Owner: {selectedRecord.fields["Owner Agent"]}</span>}
                {selectedRecord.fields.Duration && <span>Duration: {selectedRecord.fields.Duration}</span>}
              </div>
              <div className="p-3 border border-border bg-background/40 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-auto">
                {String(selectedRecord.fields.Body || selectedRecord.fields.Steps || "No content available.")}
              </div>
            </div>
          </div>
        ) : activeTab === "notes" ? (
          /* Scratchpad Editor */
          <div className="flex-1 flex flex-col p-4 space-y-3 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <label htmlFor="scratchpad-textarea" className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Operator Clipboard Note (Autosaved)
              </label>
              <button
                onClick={handleCopyNotes}
                className="text-[10px] font-mono uppercase bg-primary text-primary-foreground hover:bg-primary-hover px-2.5 py-1 rounded-none flex items-center gap-1.5 transition-all font-bold"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy Notes"}
              </button>
            </div>
            <textarea
              id="scratchpad-textarea"
              value={scratchpadText}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Paste terminal logs, draft workflow steps, or make quick scratch notes here..."
              className="flex-1 w-full bg-background/65 text-xs font-mono border border-border p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none text-foreground"
            />
          </div>
        ) : (
          /* Searchable list */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="p-3 border-b border-border bg-card shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background text-xs font-mono border border-border rounded-none pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-2">
              {loading ? (
                <div className="w-full py-12 text-center font-mono text-[10px] text-muted-foreground uppercase animate-pulse">
                  Fetching catalog records...
                </div>
              ) : listItems.length === 0 ? (
                <div className="w-full py-12 text-center font-mono text-[10px] text-muted-foreground uppercase">
                  No records match search queries.
                </div>
              ) : (
                <div className="space-y-1">
                  {listItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedRecord(item)}
                      className="border border-border bg-secondary/35 hover:bg-primary/5 p-3 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-xs font-bold font-mono text-foreground truncate">
                          {item.fields.Title || item.fields.Name}
                        </p>
                        <p className="text-[9px] font-mono text-muted-foreground truncate uppercase mt-0.5">
                          {item.fields.Category || `ID: ${item.id} · steps: ${item.fields.Steps || 0}`}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
