"use client";

import { useEffect, useState, useMemo } from "react";
import { Database, Search, RefreshCw, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NocoDBRecord {
  id: number;
  fields: Record<string, any>;
}

interface TableData {
  documents: NocoDBRecord[];
  procedures: NocoDBRecord[];
  glossary: NocoDBRecord[];
}

export default function NocoDBPage() {
  const [data, setData] = useState<TableData>({ documents: [], procedures: [], glossary: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof TableData>("documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<NocoDBRecord | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nocodb-viewer");
      if (!res.ok) {
        throw new Error(`Failed to fetch database: ${res.statusText}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || "Unknown error occurred fetching records.");
      }
    } catch (err: any) {
      console.error("NocoDB fetch failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentRecords = useMemo(() => {
    return data[activeTab] || [];
  }, [data, activeTab]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return currentRecords;
    const query = searchQuery.toLowerCase().trim();
    return currentRecords.filter((rec) => {
      return Object.values(rec.fields).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [currentRecords, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#faf9f5] text-[#1a1a1a] dark:bg-[#0c0d0e] dark:text-[#e3e4e6] font-sans antialiased">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 dark:border-[#e3e4e6]/10 pb-4 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight font-mono flex items-center gap-2 text-[#2d4a3e] dark:text-[#5EF2C6] uppercase">
            <Database className="h-5 w-5" />
            NocoDB Fleet Database
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">
            Base: <span className="underline">pm9mqdzjuh98a0n</span> (Fleet Docs Hub) · Live records view
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#2d4a3e] dark:text-[#5EF2C6] hover:bg-[#2d4a3e]/10 dark:hover:bg-[#5EF2C6]/10 border border-[#2d4a3e]/20 dark:border-[#5EF2C6]/20 transition-all rounded-none bg-[#f4f2eb] dark:bg-[#1a1b1d] disabled:opacity-40"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>[REFRESH]</span>
        </button>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {error && (
          <div className="p-4 border border-[#9c3e3e]/30 bg-[#9c3e3e]/5 text-[#9c3e3e] font-mono text-xs uppercase mb-4 rounded-none">
            Error loading NocoDB data: {error}
          </div>
        )}

        {/* Tab selection & Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4 pb-3 border-b border-[#1a1a1a]/5 dark:border-[#e3e4e6]/5">
          {/* Table Selectors */}
          <div className="flex border border-[#1a1a1a]/15 dark:border-[#e3e4e6]/15 bg-[#f4f2eb] dark:bg-[#151617] p-0.5">
            <button
              onClick={() => { setActiveTab("documents"); setSelectedRecord(null); }}
              className={cn(
                "px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all",
                activeTab === "documents"
                  ? "bg-[#faf9f5] dark:bg-[#222426] text-[#1a1a1a] dark:text-white font-bold border border-[#1a1a1a]/15 dark:border-white/10"
                  : "text-[#1a1a1a]/65 dark:text-white/65 hover:text-primary"
              )}
            >
              Documents ({data.documents.length})
            </button>
            <button
              onClick={() => { setActiveTab("procedures"); setSelectedRecord(null); }}
              className={cn(
                "px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all",
                activeTab === "procedures"
                  ? "bg-[#faf9f5] dark:bg-[#222426] text-[#1a1a1a] dark:text-white font-bold border border-[#1a1a1a]/15 dark:border-white/10"
                  : "text-[#1a1a1a]/65 dark:text-white/65 hover:text-primary"
              )}
            >
              Procedures ({data.procedures.length})
            </button>
            <button
              onClick={() => { setActiveTab("glossary"); setSelectedRecord(null); }}
              className={cn(
                "px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all",
                activeTab === "glossary"
                  ? "bg-[#faf9f5] dark:bg-[#222426] text-[#1a1a1a] dark:text-white font-bold border border-[#1a1a1a]/15 dark:border-white/10"
                  : "text-[#1a1a1a]/65 dark:text-white/65 hover:text-primary"
              )}
            >
              Glossary ({data.glossary.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search active table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f4f2eb] dark:bg-[#151617] text-xs font-mono border border-[#1a1a1a]/15 dark:border-[#e3e4e6]/15 rounded-none pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Database grid view */}
        <div className="flex-1 overflow-auto border border-[#1a1a1a]/15 dark:border-[#e3e4e6]/15 bg-[#f4f2eb]/30 dark:bg-[#111213]">
          {loading ? (
            <div className="w-full h-40 flex items-center justify-center font-mono text-[10px] text-muted-foreground uppercase">
              Loading NocoDB records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="w-full h-40 flex items-center justify-center font-mono text-[10px] text-muted-foreground uppercase">
              No matching records found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]/15 dark:border-[#e3e4e6]/15 bg-[#f4f2eb] dark:bg-[#18191b] uppercase text-[10px]">
                  <th className="p-3 w-12 text-center">ID</th>
                  {activeTab === "documents" && (
                    <>
                      <th className="p-3">Title</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Owner Agent</th>
                      <th className="p-3">Last Verified</th>
                    </>
                  )}
                  {activeTab === "procedures" && (
                    <>
                      <th className="p-3">Name</th>
                      <th className="p-3">Steps count</th>
                      <th className="p-3">Run duration</th>
                    </>
                  )}
                  {activeTab === "glossary" && (
                    <>
                      <th className="p-3">Term</th>
                      <th className="p-3">Definition</th>
                      <th className="p-3">ACMI Key</th>
                      <th className="p-3">Service</th>
                    </>
                  )}
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={cn(
                      "border-b border-[#1a1a1a]/10 dark:border-[#e3e4e6]/10 hover:bg-[#2d4a3e]/5 dark:hover:bg-[#5EF2C6]/5 transition-colors cursor-pointer",
                      selectedRecord?.id === record.id && "bg-[#2d4a3e]/10 dark:bg-[#5EF2C6]/10"
                    )}
                  >
                    <td className="p-3 text-center text-muted-foreground">{record.id}</td>
                    {activeTab === "documents" && (
                      <>
                        <td className="p-3 font-semibold text-[#2d4a3e] dark:text-[#5EF2C6]">
                          {record.fields.Title}
                        </td>
                        <td className="p-3 text-muted-foreground truncate max-w-[200px]" title={record.fields.Slug}>
                          {record.fields.Slug}
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 border border-[#1a1a1a]/15 dark:border-white/10 text-[9px] bg-background">
                            {record.fields.Category || "Other"}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{record.fields["Owner Agent"]}</td>
                        <td className="p-3 text-muted-foreground">{record.fields["Last Verified"]}</td>
                      </>
                    )}
                    {activeTab === "procedures" && (
                      <>
                        <td className="p-3 font-semibold text-[#2d4a3e] dark:text-[#5EF2C6]">
                          {record.fields.Name}
                        </td>
                        <td className="p-3 text-muted-foreground">{record.fields.Steps || 0}</td>
                        <td className="p-3 text-muted-foreground">{record.fields.Duration || "N/A"}</td>
                      </>
                    )}
                    {activeTab === "glossary" && (
                      <>
                        <td className="p-3 font-bold">{record.fields.Term}</td>
                        <td className="p-3 text-muted-foreground max-w-sm truncate" title={record.fields.Definition}>
                          {record.fields.Definition}
                        </td>
                        <td className="p-3 text-muted-foreground bg-[#1a1a1a]/5 dark:bg-white/5 px-1 py-0.5 rounded font-mono text-[10px]">
                          {record.fields["ACMI Key"]}
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] text-muted-foreground uppercase">{record.fields.Service}</span>
                        </td>
                      </>
                    )}
                    <td className="p-3 text-center text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sliding Detail Drawer Panel */}
        {selectedRecord && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-1/2 bg-[#faf9f5] dark:bg-[#121314] border-l border-[#1a1a1a]/20 dark:border-[#e3e4e6]/20 shadow-2xl flex flex-col z-20 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]/10 dark:border-[#e3e4e6]/10 shrink-0">
              <div>
                <h3 className="text-sm font-bold font-mono text-[#2d4a3e] dark:text-[#5EF2C6] uppercase">
                  Record Details: {selectedRecord.id}
                </h3>
                <p className="text-[9px] font-mono text-muted-foreground uppercase">
                  Table: {activeTab}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 hover:bg-[#1a1a1a]/5 dark:hover:bg-white/5 text-[#1a1a1a]/60 dark:text-white/60 hover:text-[#1a1a1a] dark:hover:text-white border border-[#1a1a1a]/10 dark:border-white/10 rounded-none bg-[#f4f2eb] dark:bg-[#1a1b1d]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {Object.entries(selectedRecord.fields).map(([key, value]) => {
                if (key === "Body" && value) {
                  return (
                    <div key={key} className="space-y-1.5 border-t border-[#1a1a1a]/5 dark:border-white/5 pt-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                        {key}
                      </span>
                      <div className="p-3 border border-[#1a1a1a]/10 dark:border-white/10 bg-[#f4f2eb]/50 dark:bg-[#17181a] font-mono text-xs whitespace-pre-wrap overflow-auto max-h-96">
                        {String(value)}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={key} className="flex flex-col border-b border-[#1a1a1a]/5 dark:border-white/5 pb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      {key}
                    </span>
                    <span className="text-xs font-mono mt-0.5 break-all">
                      {value === null || value === undefined ? (
                        <span className="text-muted-foreground italic">[NULL]</span>
                      ) : typeof value === "object" ? (
                        JSON.stringify(value)
                      ) : (
                        String(value)
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
