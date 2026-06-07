"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Terminal, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  FileCode,
  Sliders,
  Settings,
  ChevronDown,
  ChevronUp,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CronStatus {
  id: string;
  name: string;
  schedule: string;
  command: string;
  logPath: string;
  scriptPath?: string;
  description: string;
  status: "success" | "error" | "warning" | "unknown";
  logs: string;
  lastExecuted: string;
  errorDetail: string;
  scriptExists: boolean;
}

export default function MikeyDashboard() {
  const [crons, setCrons] = useState<CronStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCronId, setExpandedCronId] = useState<string | null>(null);

  const fetchCrons = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mikey/crons");
      if (!res.ok) throw new Error("Failed to query cron telemetry API");
      const data = await res.json();
      setCrons(data);
    } catch (err: unknown) {
      console.error("Cron load failed:", err);
      setError(err instanceof Error ? err.message : "Unknown retrieval error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCrons();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCrons]);

  const toggleLogs = (id: string) => {
    if (expandedCronId === id) setExpandedCronId(null);
    else setExpandedCronId(id);
  };

  // KPI summaries
  const total = crons.length;
  const errors = crons.filter(c => c.status === "error").length;
  const warnings = crons.filter(c => c.status === "warning").length;
  const success = crons.filter(c => c.status === "success").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 bg-[#faf9f5] font-sans antialiased text-[#1a1a1a]">
      
      {/* ── Header Banner ────────────────────────────────────────── */}
      <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-6 shadow-sm rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[9px] tracking-wider font-extrabold text-[#2d4a3e] bg-[#5ef2c6]/30 px-2 py-0.5 border border-[#2d4a3e]/10">
              [ SYSTEM CONTROL: ONLINE ]
            </span>
            <span className="font-mono text-[9px] tracking-wider font-extrabold text-[#9c3e3e] bg-[#9c3e3e]/5 px-2 py-0.5 border border-[#9c3e3e]/15">
              [ ALERTS: {errors} ACTIVE ]
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2.5 font-mono uppercase tracking-tight">
            <Cpu className="h-6 w-6 text-[#2d4a3e]" />
            <span>Mikey&apos;s Cron Command Center</span>
          </h1>
          <p className="text-xs font-mono text-[#1a1a1a]/60 mt-1 uppercase tracking-wide">
            Real-time status check and logs for local daily crons, lead syncs, and vector db runners.
          </p>
        </div>

        <button
          onClick={() => fetchCrons(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-[#2d4a3e] border border-[#2d4a3e] text-[#faf9f5] hover:bg-transparent hover:text-[#2d4a3e] transition-colors rounded-none shrink-0"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Trigger Refresh"}
        </button>
      </div>

      {/* ── System Alerts Section ─────────────────────────────── */}
      {errors > 0 && (
        <div className="border border-[#9c3e3e]/30 bg-[#9c3e3e]/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 font-mono text-xs font-extrabold text-[#9c3e3e] uppercase">
            <AlertTriangle className="h-4 w-4" />
            <span>System Diagnostics: Action Required</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crons.filter(c => c.status === "error").map(cron => (
              <div key={cron.id} className="border border-[#9c3e3e]/15 bg-[#faf9f5] p-3 flex flex-col justify-between gap-2.5">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#9c3e3e] uppercase">
                    {cron.name} Failure
                  </span>
                  <p className="text-xs text-[#1a1a1a]/85 mt-1 font-mono leading-relaxed bg-[#f4f2eb]/50 p-2 border border-[#1a1a1a]/5">
                    {cron.errorDetail}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#1a1a1a]/50">
                  Command: <code className="bg-[#f4f2eb] px-1 text-[9px]">{cron.command}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dashboard KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[10px] uppercase">
        <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-3.5 shadow-sm text-center">
          <span className="text-[#1a1a1a]/55 font-bold">Total Crons</span>
          <p className="text-2xl font-bold text-[#1a1a1a] mt-1 font-mono">{total}</p>
        </div>
        <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-3.5 shadow-sm text-center">
          <span className="text-[#2d4a3e] font-bold">Operational</span>
          <p className="text-2xl font-bold text-[#2d4a3e] mt-1 font-mono">{success}</p>
        </div>
        <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-3.5 shadow-sm text-center">
          <span className="text-[#c4903a] font-bold">No logs / Warning</span>
          <p className="text-2xl font-bold text-[#c4903a] mt-1 font-mono">{warnings}</p>
        </div>
        <div className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-3.5 shadow-sm text-center">
          <span className="text-[#9c3e3e] font-bold">Errors</span>
          <p className="text-2xl font-bold text-[#9c3e3e] mt-1 font-mono">{errors}</p>
        </div>
      </div>

      {/* ── Cron Registry List ─────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 font-mono text-xs gap-3 text-[#1a1a1a]/60 border border-dashed border-[#1a1a1a]/15 p-12 bg-[#faf9f5]">
          <Loader2 className="h-6 w-6 animate-spin text-[#2d4a3e]" />
          <span>QUERYING SYSTEM LOGS & CRONTAB TARGETS...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {crons.map((cron) => {
            const isExpanded = expandedCronId === cron.id;
            return (
              <div 
                key={cron.id}
                className={cn(
                  "border transition-all duration-150 flex flex-col bg-[#faf9f5] shadow-sm",
                  cron.status === "error" ? "border-[#9c3e3e]" :
                  cron.status === "warning" ? "border-[#c4903a]" :
                  "border-[#1a1a1a]/15"
                )}
              >
                {/* Row Header */}
                <div 
                  onClick={() => toggleLogs(cron.id)}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 cursor-pointer hover:bg-[#f4f2eb]/30 select-none gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "mt-1 h-3.5 w-3.5 rounded-none flex items-center justify-center font-mono text-[9px] font-bold text-[#faf9f5] shrink-0",
                      cron.status === "success" ? "bg-[#2d4a3e]" :
                      cron.status === "error" ? "bg-[#9c3e3e]" :
                      cron.status === "warning" ? "bg-[#c4903a]" :
                      "bg-[#1a1a1a]/30"
                    )}>
                      {cron.status === "success" ? "✓" : cron.status === "error" ? "✗" : "!"}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-bold font-mono text-[#1a1a1a] tracking-tight">{cron.name}</h3>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 border border-[#2d4a3e]/15 bg-[#2d4a3e]/5 text-[#2d4a3e] font-extrabold">
                          {cron.schedule}
                        </span>
                        <span className={cn(
                          "font-mono text-[8px] uppercase px-1.5 py-0.5 border font-bold",
                          cron.scriptExists 
                            ? "bg-[#5ef2c6]/10 border-[#2d4a3e]/15 text-[#2d4a3e]" 
                            : "bg-[#9c3e3e]/10 border-[#9c3e3e]/20 text-[#9c3e3e]"
                        )}>
                          {cron.scriptExists ? "[Script Active]" : "[Script Missing]"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#1a1a1a]/60 leading-normal max-w-3xl">
                        {cron.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end lg:self-auto shrink-0 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-[#1a1a1a]/40 block">Last Executed</span>
                      <span className="text-[11px] text-[#1a1a1a] font-semibold">
                        {new Date(cron.lastExecuted).toLocaleDateString()} {new Date(cron.lastExecuted).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <button 
                      type="button"
                      className="border border-[#1a1a1a]/15 p-1 hover:bg-[#1a1a1a]/5 transition-colors"
                      aria-label="Toggle terminal logs view"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Logs Panel */}
                {isExpanded && (
                  <div className="border-t border-[#1a1a1a]/10 bg-[#0f2a2e] text-[#faf9f5] p-4 font-mono text-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-[#faf9f5]/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-[#5ef2c6]" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#5ef2c6]">
                          Execution Log Stream
                        </span>
                      </div>
                      <span className="text-[9px] opacity-50 uppercase tracking-widest truncate max-w-[250px] sm:max-w-md">
                        {cron.logPath}
                      </span>
                    </div>

                    <pre className="overflow-x-auto whitespace-pre p-3 bg-[#162f33] border border-[#2d4a3e] rounded-none text-[10px] leading-relaxed text-[#9bbcbe] max-h-60 overflow-y-auto">
                      {cron.logs || "[Log is empty]"}
                    </pre>
                    
                    {cron.errorDetail && (
                      <div className="border border-[#9c3e3e]/30 bg-[#9c3e3e]/10 p-2.5 text-[10px] text-[#faf9f5] flex flex-col gap-0.5">
                        <span className="font-extrabold text-[#ff6b6b] uppercase">Diagnostic Signal:</span>
                        <span>{cron.errorDetail}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className="border-t border-[#1a1a1a]/10 pt-4 flex justify-between font-mono text-[9px] text-[#1a1a1a]/40 uppercase tracking-wider">
        <span>Dashboard: Mikey Control v1.0</span>
        <span>Local Time: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

// Loader mock
function Loader2({ className, ...props }: React.ComponentProps<typeof RefreshCw>) {
  return <RefreshCw className={cn("animate-spin", className)} {...props} />;
}
