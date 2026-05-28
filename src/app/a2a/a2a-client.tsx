"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Network, Terminal, Layers, RefreshCw, Info, Filter, Search, 
  Play, Sparkles, CheckCircle, AlertTriangle, ArrowRight, User, Folder
} from "lucide-react";
import { 
  fetchDashboardRollup, fetchWorkItems, updateWorkItemMilestones,
  type ACMIEvent, type ACMIWorkItem 
} from "@/lib/acmi-client";
import { calculateSemanticScore } from "@/lib/vector-engine";
import { cn } from "@/lib/utils";

export default function A2AClient() {
  // Core state
  const [liveEvents, setLiveEvents] = useState<ACMIEvent[]>([]);
  const [workItems, setWorkItems] = useState<ACMIWorkItem[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  
  // Tab control: "tree" | "lanes"
  const [activeTab, setActiveTab] = useState<"tree" | "lanes">("tree");

  // Filtering state
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedKind, setSelectedKind] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect state
  const [hoveredLink, setHoveredLink] = useState<{
    event: ACMIEvent;
    work: ACMIWorkItem;
    milestone: string;
    score: number;
  } | null>(null);

  const [inspectEvent, setInspectEvent] = useState<ACMIEvent | null>(null);
  const [inspectWork, setInspectWork] = useState<ACMIWorkItem | null>(null);

  // Load and poll data
  const loadData = () => {
    setIsPolling(true);
    Promise.all([fetchDashboardRollup(), fetchWorkItems()])
      .then(([rollupData, workData]) => {
        if (rollupData?.recentEvents) {
          setLiveEvents(rollupData.recentEvents);
        }
        if (workData) {
          setWorkItems(workData);
        }
        setTimeout(() => setIsPolling(false), 500);
      })
      .catch((err) => {
        console.error("Failed to load A2A data:", err);
        setIsPolling(false);
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Trigger Vector Sync API
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Initiating semantic alignment...");
    try {
      const res = await fetch("/api/vector-sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        if (data.matchesSynced > 0) {
          setSyncStatusMsg(`Successfully synchronized ${data.matchesSynced} milestone(s) based on vector matches (>85% score)!`);
        } else {
          setSyncStatusMsg("Fleet already fully aligned. No new vector matches detected.");
        }
        loadData();
      } else {
        setSyncStatusMsg("Failed to run semantic sync.");
      }
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("Network error during sync.");
    }
    setTimeout(() => {
      setSyncStatusMsg(null);
      setIsSyncing(false);
    }, 4500);
  };

  // Get unique filters
  const uniqueAgents = useMemo(() => {
    const agents = new Set<string>();
    liveEvents.forEach((e) => agents.add(e.source));
    workItems.forEach((w) => { if (w.owner) agents.add(w.owner); });
    return Array.from(agents);
  }, [liveEvents, workItems]);

  const uniqueKinds = useMemo(() => {
    const kinds = new Set<string>();
    liveEvents.forEach((e) => kinds.add(e.kind));
    return Array.from(kinds);
  }, [liveEvents]);

  const uniqueProjects = useMemo(() => {
    return workItems.map((w) => ({ id: w.id, title: w.title }));
  }, [workItems]);

  // Compute dynamic semantic connections (links) between recent events and project milestones
  const semanticLinks = useMemo(() => {
    const links: Array<{
      event: ACMIEvent;
      work: ACMIWorkItem;
      milestone: string;
      score: number;
    }> = [];

    liveEvents.forEach((evt) => {
      workItems.forEach((work) => {
        // Only link relevant projects if project filter is active
        if (selectedProject !== "all" && work.id !== selectedProject) return;

        const stages = work.stages || [];
        stages.forEach((stage) => {
          // Calculate similarity score between event summary and stage milestone name
          const score = calculateSemanticScore(evt.summary, stage.name);
          // High probability similarity match
          if (score >= 0.4) {
            links.push({
              event: evt,
              work,
              milestone: stage.name,
              score,
            });
          }
        });
      });
    });

    // Sort links by similarity score descending
    return links.sort((a, b) => b.score - a.score);
  }, [liveEvents, workItems, selectedProject]);

  // Filtered Events and Work Items for the view
  const filteredEvents = useMemo(() => {
    return liveEvents.filter((e) => {
      const matchesAgent = selectedAgent === "all" || e.source === selectedAgent;
      const matchesKind = selectedKind === "all" || e.kind === selectedKind;
      const matchesSearch = searchQuery === "" || 
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesAgent && matchesKind && matchesSearch;
    });
  }, [liveEvents, selectedAgent, selectedKind, searchQuery]);

  const filteredWorkItems = useMemo(() => {
    return workItems.filter((w) => {
      const matchesAgent = selectedAgent === "all" || w.owner === selectedAgent;
      const matchesProject = selectedProject === "all" || w.id === selectedProject;
      const matchesSearch = searchQuery === "" || 
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        w.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesAgent && matchesProject && matchesSearch;
    });
  }, [workItems, selectedAgent, selectedProject, searchQuery]);

  // Define Agent Fleet Comms Lanes
  const laneStreams = useMemo(() => {
    return {
      planning: liveEvents.filter(e => 
        e.source === "ops-commander" || e.source === "bentley" || e.kind.includes("spawn") || e.kind.includes("work_create")
      ),
      execution: liveEvents.filter(e => 
        e.source === "antigravity" || e.source === "claude-code" || e.source === "gemini-cli" || e.kind.includes("signal") || e.kind.includes("event")
      ),
      audit: liveEvents.filter(e => 
        e.source === "claude-web" || e.source === "synthesizer" || e.kind.includes("rollup") || e.summary.toLowerCase().includes("audit") || e.summary.toLowerCase().includes("test")
      )
    };
  }, [liveEvents]);

  return (
    <div className="space-y-6">
      
      {/* Editorial Title Block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#1a1a1a]/15 pb-4 gap-4">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#2d4a3e] font-bold">
            Layer 7 Command Surface: Semantic Linking & Telemetry
          </span>
          <h1 className="text-2xl font-bold tracking-tight uppercase font-mono text-[#1a1a1a]">
            ACMI A2A Comms Console
          </h1>
          <p className="text-xs font-mono text-[#1a1a1a]/60">
            Dynamic relational vector mapping linking chronologically polled ACMI threads to respective project workspaces.
          </p>
        </div>
        
        {/* Sync Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[10px] uppercase bg-[#2d4a3e] text-[#faf9f5] px-3 py-1.5 border border-[#2d4a3e] hover:bg-[#2d4a3e]/90 transition-colors rounded-none",
              isSyncing && "opacity-60 cursor-not-allowed"
            )}
          >
            <Sparkles className={cn("h-3 w-3", isSyncing && "animate-pulse")} />
            <span>{isSyncing ? "SYNCING VECTORS..." : "TRIGGER VECTOR SYNC"}</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase bg-[#f4f2eb] px-3 py-1.5 border border-[#1a1a1a]/10">
            <RefreshCw className={cn("h-3 w-3", isPolling && "animate-spin text-[#2d4a3e]")} />
            <span>{isPolling ? "SYNCING..." : "LIVE FEED"}</span>
          </div>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncStatusMsg && (
        <div className="bg-[#f4f2eb] border-l-2 border-[#c4903a] p-3 text-xs font-mono text-[#1a1a1a] uppercase animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#c4903a]" />
            <span>{syncStatusMsg}</span>
          </div>
        </div>
      )}

      {/* Control Filters Toolbar */}
      <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none space-y-3">
        <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#1a1a1a]">
            <Filter className="h-3.5 w-3.5 text-[#2d4a3e]" />
            Filter and Search Filters
          </div>
          <span className="font-mono text-[9px] text-[#1a1a1a]/50">
            ACTIVE SEMANTIC LINKS: {semanticLinks.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {/* Agent Filter */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase text-[#1a1a1a]/50">Filter by Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full bg-[#faf9f5] border border-[#1a1a1a]/15 text-[#1a1a1a] p-2 outline-none rounded-none text-xs"
            >
              <option value="all">[ALL AGENTS]</option>
              {uniqueAgents.map((agent) => (
                <option key={agent} value={agent}>@{agent}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase text-[#1a1a1a]/50">Filter by Work Item</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-[#faf9f5] border border-[#1a1a1a]/15 text-[#1a1a1a] p-2 outline-none rounded-none text-xs"
            >
              <option value="all">[ALL WORK ITEMS]</option>
              {uniqueProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.title.substring(0, 30)}...</option>
              ))}
            </select>
          </div>

          {/* Event Kind Filter */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase text-[#1a1a1a]/50">Event Kind</label>
            <select
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value)}
              className="w-full bg-[#faf9f5] border border-[#1a1a1a]/15 text-[#1a1a1a] p-2 outline-none rounded-none text-xs"
            >
              <option value="all">[ALL KINDS]</option>
              {uniqueKinds.map((k) => (
                <option key={k} value={k}>[{k}]</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase text-[#1a1a1a]/50">Semantic Search query</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1a1a1a]/40" />
              <input
                placeholder="Query words (e.g. build)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#faf9f5] border border-[#1a1a1a]/15 text-[#1a1a1a] pl-8 pr-2 py-2 outline-none rounded-none text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex border-b border-[#1a1a1a]/15">
        <button
          onClick={() => setActiveTab("tree")}
          className={cn(
            "px-4 py-2 font-mono text-xs uppercase font-bold border-t border-x transition-all rounded-none",
            activeTab === "tree"
              ? "bg-[#f4f2eb] text-[#2d4a3e] border-[#1a1a1a]/15 border-b-[#f4f2eb] -mb-px"
              : "bg-[#faf9f5] text-[#1a1a1a]/50 border-transparent hover:text-[#1a1a1a]"
          )}
        >
          [SVG Vector Linkage Tree]
        </button>
        <button
          onClick={() => setActiveTab("lanes")}
          className={cn(
            "px-4 py-2 font-mono text-xs uppercase font-bold border-t border-x transition-all rounded-none",
            activeTab === "lanes"
              ? "bg-[#f4f2eb] text-[#2d4a3e] border-[#1a1a1a]/15 border-b-[#f4f2eb] -mb-px"
              : "bg-[#faf9f5] text-[#1a1a1a]/50 border-transparent hover:text-[#1a1a1a]"
          )}
        >
          [Multi-Lane Fleet Logs]
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "tree" ? (
        <div className="space-y-4">
          {/* Tree Visualization Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* SVG Linkage Visualizer */}
            <div className="lg:col-span-9 border border-[#1a1a1a]/15 bg-[#faf9f5] p-4 rounded-none min-h-[500px] flex flex-col justify-between relative overflow-hidden">
              
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2 mb-4 z-10">
                <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a] flex items-center gap-1.5">
                  <Network className="h-4 w-4 text-[#2d4a3e]" />
                  Active Semantic Gates (Mapping Polled Stream to Workspaces)
                </span>
                <span className="font-mono text-[9px] bg-[#f4f2eb] px-1.5 py-0.5 border border-[#1a1a1a]/10">
                  THRESHOLD: &gt;= 40% SIMILARITY
                </span>
              </div>

              {/* Flex columns with SVG absolute background lines */}
              <div className="flex-1 grid grid-cols-2 gap-12 relative min-h-[400px]">
                
                {/* SVG Connections Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <marker
                      id="arrow-green"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2d4a3e" />
                    </marker>
                    <marker
                      id="arrow-amber"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#c4903a" />
                    </marker>
                  </defs>

                  {/* Draw connections */}
                  {semanticLinks.map((link, idx) => {
                    const evtIndex = filteredEvents.findIndex(e => e.id === link.event.id);
                    const workIndex = filteredWorkItems.findIndex(w => w.id === link.work.id);

                    if (evtIndex === -1 || workIndex === -1) return null;

                    // Calculate y offsets dynamically
                    const totalEvts = filteredEvents.length || 1;
                    const totalWorks = filteredWorkItems.length || 1;

                    const y1 = `${((evtIndex + 0.5) / totalEvts) * 100}%`;
                    const y2 = `${((workIndex + 0.5) / totalWorks) * 100}%`;

                    const isGated = link.score >= 0.85;
                    const strokeColor = isGated ? "#2d4a3e" : "rgba(196, 144, 58, 0.4)";
                    const isHovered = hoveredLink?.event.id === link.event.id && hoveredLink?.work.id === link.work.id;

                    return (
                      <g 
                        key={`link-${link.event.id}-${link.work.id}`}
                        onMouseEnter={() => setHoveredLink(link)}
                        onMouseLeave={() => setHoveredLink(null)}
                        className="cursor-pointer pointer-events-auto"
                      >
                        {/* Hover bounding guide line */}
                        <path
                          d={`M 35% ${y1} C 50% ${y1}, 50% ${y2}, 65% ${y2}`}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="10"
                        />
                        {/* Rendered curved line */}
                        <path
                          d={`M 35% ${y1} C 50% ${y1}, 50% ${y2}, 65% ${y2}`}
                          fill="none"
                          stroke={isHovered ? "#2d4a3e" : strokeColor}
                          strokeWidth={isHovered ? "2.5" : isGated ? "1.5" : "1"}
                          strokeDasharray={isGated ? "none" : "3,3"}
                          markerEnd={isGated ? "url(#arrow-green)" : "url(#arrow-amber)"}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Left Side: Recent Stream Events */}
                <div className="space-y-2 z-10 flex flex-col justify-center">
                  <div className="font-mono text-[9px] uppercase text-[#1a1a1a]/40 border-b border-[#1a1a1a]/5 pb-1 mb-2">
                    Chronological Events Stream
                  </div>
                  {filteredEvents.slice(0, 7).map((evt) => {
                    const hasLink = semanticLinks.some(l => l.event.id === evt.id);
                    const isInspected = inspectEvent?.id === evt.id;

                    return (
                      <button
                        key={evt.id}
                        onClick={() => {
                          setInspectEvent(evt);
                          setInspectWork(null);
                        }}
                        className={cn(
                          "w-full text-left p-2.5 border transition-all rounded-none flex flex-col gap-1 shadow-sm",
                          isInspected 
                            ? "bg-[#2d4a3e]/5 border-[#2d4a3e] ring-1 ring-[#2d4a3e]/10"
                            : hasLink
                            ? "bg-[#f4f2eb] border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30"
                            : "bg-[#faf9f5] border-[#1a1a1a]/10 hover:border-[#1a1a1a]/25 text-[#1a1a1a]/65"
                        )}
                      >
                        <div className="flex items-center justify-between text-[8px] font-mono text-[#1a1a1a]/40">
                          <span>@{evt.source}</span>
                          <span>{evt.kind}</span>
                        </div>
                        <p className="font-sans text-[11px] font-semibold text-[#1a1a1a] leading-tight truncate w-full">
                          {evt.summary}
                        </p>
                        {evt.correlationId && (
                          <span className="font-mono text-[7px] text-[#1a1a1a]/35 truncate w-full">
                            CID: {evt.correlationId}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Side: Active Workspace Nodes */}
                <div className="space-y-2 z-10 flex flex-col justify-center ml-auto w-full max-w-[280px]">
                  <div className="font-mono text-[9px] uppercase text-[#1a1a1a]/40 border-b border-[#1a1a1a]/5 pb-1 mb-2">
                    Project Workspaces
                  </div>
                  {filteredWorkItems.slice(0, 5).map((work) => {
                    const hasLink = semanticLinks.some(l => l.work.id === work.id);
                    const isInspected = inspectWork?.id === work.id;

                    return (
                      <button
                        key={work.id}
                        onClick={() => {
                          setInspectWork(work);
                          setInspectEvent(null);
                        }}
                        className={cn(
                          "w-full text-left p-2.5 border transition-all rounded-none flex flex-col gap-1.5 shadow-sm",
                          isInspected
                            ? "bg-[#2d4a3e]/5 border-[#2d4a3e] ring-1 ring-[#2d4a3e]/10"
                            : hasLink
                            ? "bg-[#f4f2eb] border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30"
                            : "bg-[#faf9f5] border-[#1a1a1a]/10 hover:border-[#1a1a1a]/25"
                        )}
                      >
                        <div className="flex items-center justify-between text-[8px] font-mono text-[#1a1a1a]/40">
                          <span className="truncate max-w-[120px]">ID: {work.id}</span>
                          <span>[{work.status.toUpperCase()}]</span>
                        </div>
                        <h4 className="font-mono text-[10px] font-bold text-[#1a1a1a] truncate w-full">
                          {work.title}
                        </h4>
                        
                        {/* Progress and Mini stages */}
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between text-[8px] font-mono text-[#1a1a1a]/40">
                            <span>Progress: {work.progress}%</span>
                            <span>Owner: @{work.owner || "unassigned"}</span>
                          </div>
                          <div className="h-1 bg-[#1a1a1a]/5 w-full">
                            <div className="bg-[#2d4a3e] h-full" style={{ width: `${work.progress}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Interactive Vector Gate Info */}
              <div className="border-t border-[#1a1a1a]/10 pt-3 flex items-center justify-between text-[9px] font-mono text-[#1a1a1a]/40 uppercase shrink-0">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-[#2d4a3e] inline-block" />
                  Solid Link: Vector Gate Passed (&gt;=85% auto-completable)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-[#c4903a] inline-block" />
                  Dashed Link: Partial Match (Needs verification)
                </span>
              </div>
            </div>

            {/* Inspect Side panel */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Connection Hover Panel */}
              <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none space-y-3">
                <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a] flex items-center gap-1.5 border-b border-[#1a1a1a]/10 pb-2">
                  <Terminal className="h-4 w-4 text-[#c4903a]" />
                  Interactive Vector Link
                </span>

                {hoveredLink ? (
                  <div className="space-y-3 font-mono text-[11px] leading-relaxed">
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase text-[#1a1a1a]/40 block">Event Summary</span>
                      <p className="font-sans font-semibold text-[#1a1a1a] text-xs leading-snug bg-[#faf9f5] p-2 border border-[#1a1a1a]/5">
                        "{hoveredLink.event.summary}"
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] uppercase text-[#1a1a1a]/40 block">Milestone Target</span>
                      <p className="text-[#2d4a3e] font-bold">
                        [{hoveredLink.milestone}]
                      </p>
                      <span className="text-[8px] text-[#1a1a1a]/40 block">
                        Project: {hoveredLink.work.title.substring(0, 30)}...
                      </span>
                    </div>

                    <div className="border-t border-[#1a1a1a]/5 pt-2 flex items-center justify-between bg-[#faf9f5] p-2 border border-[#1a1a1a]/10">
                      <span className="text-[9px] uppercase">Similarity Probability</span>
                      <span className={cn(
                        "font-bold text-xs px-1.5 py-0.5 border",
                        hoveredLink.score >= 0.85 
                          ? "text-[#2d4a3e] border-[#2d4a3e]/30 bg-[#2d4a3e]/5" 
                          : "text-[#c4903a] border-[#c4903a]/30"
                      )}>
                        {Math.round(hoveredLink.score * 100)}% Match
                      </span>
                    </div>

                    {hoveredLink.score >= 0.85 && (
                      <div className="flex items-center gap-1 text-[8px] uppercase text-[#2d4a3e] font-bold">
                        <CheckCircle className="h-3 w-3" />
                        <span>Eligible for automatic completion</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center font-mono text-[10px] text-[#1a1a1a]/40 uppercase">
                    Hover matching vector curves to analyze connection scores.
                  </div>
                )}
              </div>

              {/* Node Inspector Detail Panel */}
              {(inspectEvent || inspectWork) && (
                <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2">
                    <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a] flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-[#2d4a3e]" />
                      Telemetry Details
                    </span>
                    <button 
                      onClick={() => {
                        setInspectEvent(null);
                        setInspectWork(null);
                      }}
                      className="text-[9px] font-mono hover:text-[#1a1a1a]/80"
                    >
                      [CLOSE]
                    </button>
                  </div>

                  {inspectEvent && (
                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase text-[#1a1a1a]/40">Source Agent</span>
                        <p className="font-bold text-[#2d4a3e]">@{inspectEvent.source}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase text-[#1a1a1a]/40">Event Kind</span>
                        <p className="text-[#1a1a1a] font-semibold">[{inspectEvent.kind}]</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase text-[#1a1a1a]/40">Correlation ID</span>
                        <p className="text-[#1a1a1a]/60 break-all text-[10px] bg-[#faf9f5] p-1 border border-[#1a1a1a]/5">
                          {inspectEvent.correlationId || "[NONE]"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase text-[#1a1a1a]/40">Event Summary</span>
                        <p className="font-sans text-[11px] text-[#1a1a1a]/80 leading-snug">
                          {inspectEvent.summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {inspectWork && (
                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase text-[#1a1a1a]/40">Workspace ID</span>
                        <p className="font-bold text-[#1a1a1a] text-[10px] break-all">{inspectWork.id}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase text-[#1a1a1a]/40">Workspace Title</span>
                        <p className="font-sans font-bold text-[#1a1a1a] leading-tight text-xs">
                          {inspectWork.title}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase text-[#1a1a1a]/40">Completion Milestones</span>
                        <div className="space-y-1 bg-[#faf9f5] p-2 border border-[#1a1a1a]/5 max-h-[140px] overflow-y-auto">
                          {inspectWork.stages?.map((stage, i) => (
                            <div key={i} className="flex items-center justify-between text-[9px] border-b border-[#1a1a1a]/5 last:border-0 pb-1">
                              <span className={cn(stage.done ? "text-[#2d4a3e] font-semibold" : "text-[#1a1a1a]/40")}>
                                {stage.name.substring(0, 26)}...
                              </span>
                              <span>[{stage.done ? "DONE" : "PENDING"}]</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* Lanes Stream View: Multi-lane chronological view */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Lane 1: Planning & Command */}
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none h-[560px] flex flex-col justify-between">
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2">
                <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a] flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-[#2d4a3e]" />
                  Ops & Planning Lane
                </span>
                <span className="font-mono text-[8px] uppercase bg-[#faf9f5] px-1.5 border border-[#1a1a1a]/10">
                  LANE 1
                </span>
              </div>

              {/* Log stream list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[460px] scrollbar-thin">
                {laneStreams.planning.length > 0 ? (
                  laneStreams.planning.map((evt, idx) => (
                    <div key={idx} className="p-2.5 bg-[#faf9f5] border border-[#1a1a1a]/5 text-xs font-mono space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between text-[8px] text-[#1a1a1a]/40">
                        <span>@{evt.source}</span>
                        <span>{new Date(evt.ts).toTimeString().split(" ")[0]}</span>
                      </div>
                      <p className="font-sans text-[11px] leading-tight text-[#1a1a1a] font-medium">
                        {evt.summary}
                      </p>
                      <div className="text-[7px] text-[#2d4a3e] uppercase">
                        [{evt.kind}]
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-xs font-mono text-[#1a1a1a]/40">
                    No planning logs received.
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-[#1a1a1a]/10 pt-2 font-mono text-[9px] text-[#1a1a1a]/40 uppercase shrink-0">
              LANES_STREAM: PLANNING
            </div>
          </div>

          {/* Lane 2: Coding & Execution */}
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none h-[560px] flex flex-col justify-between">
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2">
                <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a] flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-[#c4903a]" />
                  Execution & Code Lane
                </span>
                <span className="font-mono text-[8px] uppercase bg-[#faf9f5] px-1.5 border border-[#1a1a1a]/10">
                  LANE 2
                </span>
              </div>

              {/* Log stream list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[460px] scrollbar-thin">
                {laneStreams.execution.length > 0 ? (
                  laneStreams.execution.map((evt, idx) => (
                    <div key={idx} className="p-2.5 bg-[#faf9f5] border border-[#1a1a1a]/5 text-xs font-mono space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between text-[8px] text-[#1a1a1a]/40">
                        <span>@{evt.source}</span>
                        <span>{new Date(evt.ts).toTimeString().split(" ")[0]}</span>
                      </div>
                      <p className="font-sans text-[11px] leading-tight text-[#1a1a1a] font-medium">
                        {evt.summary}
                      </p>
                      <div className="text-[7px] text-[#c4903a] uppercase">
                        [{evt.kind}]
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-xs font-mono text-[#1a1a1a]/40">
                    No execution logs received.
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-[#1a1a1a]/10 pt-2 font-mono text-[9px] text-[#1a1a1a]/40 uppercase shrink-0">
              LANES_STREAM: CODING
            </div>
          </div>

          {/* Lane 3: Audit & Release */}
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none h-[560px] flex flex-col justify-between">
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2">
                <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a] flex items-center gap-1.5">
                  <Network className="h-4 w-4 text-[#2d4a3e]" />
                  Audit & Release Lane
                </span>
                <span className="font-mono text-[8px] uppercase bg-[#faf9f5] px-1.5 border border-[#1a1a1a]/10">
                  LANE 3
                </span>
              </div>

              {/* Log stream list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[460px] scrollbar-thin">
                {laneStreams.audit.length > 0 ? (
                  laneStreams.audit.map((evt, idx) => (
                    <div key={idx} className="p-2.5 bg-[#faf9f5] border border-[#1a1a1a]/5 text-xs font-mono space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between text-[8px] text-[#1a1a1a]/40">
                        <span>@{evt.source}</span>
                        <span>{new Date(evt.ts).toTimeString().split(" ")[0]}</span>
                      </div>
                      <p className="font-sans text-[11px] leading-tight text-[#1a1a1a] font-medium">
                        {evt.summary}
                      </p>
                      <div className="text-[7px] text-[#2d4a3e] uppercase">
                        [{evt.kind}]
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-xs font-mono text-[#1a1a1a]/40">
                    No auditing logs received.
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-[#1a1a1a]/10 pt-2 font-mono text-[9px] text-[#1a1a1a]/40 uppercase shrink-0">
              LANES_STREAM: AUDITING
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
