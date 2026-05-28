"use client";

import { useEffect, useState, useMemo } from "react";
import { Network, Terminal, Layers, RefreshCw, Info } from "lucide-react";
import { fetchDashboardRollup, type ACMIEvent } from "@/lib/acmi-client";
import { cn } from "@/lib/utils";

interface GraphNode {
  id: string;
  agent: string;
  role: string;
  kind: string;
  summary: string;
  correlationId: string;
  parentCorrelationId?: string;
  row: number;
  col: number; // 1-indexed column position in that row
}

const GRAPH_NODES: GraphNode[] = [
  {
    id: "node-1",
    agent: "ops-commander",
    role: "Fleet Coordinator",
    kind: "acmi_spawn",
    summary: "Dispatched main execution session for workspace b0867076",
    correlationId: "opsSpawnSession-1716910800000",
    row: 1,
    col: 2,
  },
  {
    id: "node-2",
    agent: "bentley",
    role: "Lead Work Planner",
    kind: "acmi_work_create",
    summary: "Created Next.js dashboard hardening tracking plan",
    correlationId: "bentleyCreateWork-1716910805000",
    parentCorrelationId: "opsSpawnSession-1716910800000",
    row: 2,
    col: 1,
  },
  {
    id: "node-3",
    agent: "synthesizer",
    role: "Data Rollup Specialist",
    kind: "acmi_rollup_set",
    summary: "Aggregated global metrics for active threads and items",
    correlationId: "synthSetRollup-1716910810000",
    parentCorrelationId: "opsSpawnSession-1716910800000",
    row: 2,
    col: 3,
  },
  {
    id: "node-4",
    agent: "antigravity",
    role: "Code Architect",
    kind: "acmi_work_signal",
    summary: "Committed core route files to the voice / visualizer cluster",
    correlationId: "antigravitySignalUpdate-1716910815000",
    parentCorrelationId: "bentleyCreateWork-1716910805000",
    row: 3,
    col: 1,
  },
  {
    id: "node-5",
    agent: "claude-web",
    role: "UX Audit Agent",
    kind: "acmi_event",
    summary: "Completed web accessibility & layout contrast analysis",
    correlationId: "claudeWebAudit-1716910820000",
    parentCorrelationId: "bentleyCreateWork-1716910805000",
    row: 3,
    col: 2,
  },
  {
    id: "node-6",
    agent: "gemini-cli",
    role: "Fleet Publisher",
    kind: "acmi_event",
    summary: "Broadcasted final 100% completion milestone to coordination thread",
    correlationId: "geminiPublishMilestone-1716910825000",
    parentCorrelationId: "synthSetRollup-1716910810000",
    row: 3,
    col: 3,
  },
];

export default function A2AClient() {

  const [nodes] = useState<GraphNode[]>(GRAPH_NODES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(GRAPH_NODES[0]);
  const [liveEvents, setLiveEvents] = useState<ACMIEvent[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Compute highlighted chain dynamically during render
  const highlightedChain = useMemo(() => {
    if (!selectedNode) {
      return [];
    }

    const chainIds: string[] = [selectedNode.id];
    let current = selectedNode;

    // Go up the tree to root
    while (current && current.parentCorrelationId) {
      const parent = nodes.find((n) => n.correlationId === current.parentCorrelationId);
      if (parent) {
        chainIds.push(parent.id);
        current = parent;
      } else {
        break;
      }
    }

    return chainIds;
  }, [selectedNode, nodes]);

  // Polling for live ACMI thread events
  useEffect(() => {
    const fetchLive = () => {
      setIsPolling(true);
      fetchDashboardRollup()
        .then((data) => {
          if (data && data.recentEvents) {
            setLiveEvents(data.recentEvents);
          }
          setTimeout(() => setIsPolling(false), 500);
        })
        .catch(() => setIsPolling(false));
    };

    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Editorial Title Block */}
      <div className="flex items-start justify-between border-b border-[#1a1a1a]/15 pb-4">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#2d4a3e] font-bold">
            Layer 6 Command Surface: Phase 5
          </span>
          <h1 className="text-2xl font-bold tracking-tight uppercase font-mono text-[#1a1a1a]">
            A2A Comms Graph
          </h1>
          <p className="text-xs font-mono text-[#1a1a1a]/60">
            Interactive relational trace view plotting correlationId paths, event handoffs, and agent coordination timelines.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase bg-[#f4f2eb] px-3 py-1 border border-[#1a1a1a]/10">
          <RefreshCw className={cn("h-3 w-3", isPolling && "animate-spin text-[#2d4a3e]")} />
          <span>{isPolling ? "SYNCING THREAD..." : "THREAD SYNCHRONIZED"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Comms Canvas Network Graph */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-5 rounded-none flex flex-col justify-between h-[450px] relative overflow-hidden">
            
            {/* Visual Header */}
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-3 mb-4 z-10 bg-[#f4f2eb]/90">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-[#2d4a3e]" />
                <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a]">
                  Interactive Correlation Blueprint
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#1a1a1a]/50">
                ACTIVE RELATION LINKS: {nodes.length - 1}
              </span>
            </div>

            {/* Canvas grid container */}
            <div className="flex-1 relative bg-[#faf9f5] border border-[#1a1a1a]/10 overflow-hidden min-h-[300px]">
              
              {/* SVG Link Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#2d4a3e" />
                  </marker>
                </defs>

                {/* Draw layout connecting lines between grid cells */}
                {nodes.map((node) => {
                  if (!node.parentCorrelationId) return null;
                  const parent = nodes.find((n) => n.correlationId === node.parentCorrelationId);
                  if (!parent) return null;

                  // Compute absolute % coordinates based on rows and columns
                  const getCoords = (r: number, c: number) => {
                    const y = r === 1 ? 16 : r === 2 ? 48 : 80;
                    const x = c === 1 ? 18 : c === 2 ? 50 : 82;
                    return { x: `${x}%`, y: `${y}%` };
                  };

                  const pCoords = getCoords(parent.row, parent.col);
                  const cCoords = getCoords(node.row, node.col);

                  const isHighlighted = highlightedChain.includes(node.id) && highlightedChain.includes(parent.id);

                  return (
                    <g key={`link-${node.id}-${parent.id}`}>
                      {/* Drop-shadow line */}
                      <line
                        x1={pCoords.x}
                        y1={pCoords.y}
                        x2={cCoords.x}
                        y2={cCoords.y}
                        stroke="rgba(26,26,26,0.06)"
                        strokeWidth="3"
                      />
                      {/* Dynamic status line */}
                      <line
                        x1={pCoords.x}
                        y1={pCoords.y}
                        x2={cCoords.x}
                        y2={cCoords.y}
                        stroke={isHighlighted ? "#2d4a3e" : "rgba(45, 74, 62, 0.25)"}
                        strokeWidth={isHighlighted ? "1.5" : "1"}
                        strokeDasharray={isHighlighted ? "none" : "3,3"}
                        markerEnd={isHighlighted ? "url(#arrow)" : undefined}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Grid Cells with Absolute Position Nodes */}
              <div className="absolute inset-0 grid grid-rows-3 grid-cols-3 p-4 z-10">
                {nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isInChain = highlightedChain.includes(node.id);

                  const rowClass = node.row === 1 ? "row-start-1" : node.row === 2 ? "row-start-2" : "row-start-3";
                  const colClass = node.col === 1 ? "col-start-1" : node.col === 2 ? "col-start-2" : "col-start-3";

                  return (
                    <div 
                      key={node.id} 
                      className={cn("flex items-center justify-center", rowClass, colClass)}
                    >
                      <button
                        onClick={() => setSelectedNode(node)}
                        className={cn(
                          "w-36 bg-[#f4f2eb] border p-2 text-left cursor-pointer transition-all duration-150 rounded-none shadow-sm flex flex-col justify-between hover:border-[#1a1a1a]/40",
                          isSelected 
                            ? "border-[#2d4a3e] bg-[#2d4a3e]/5 ring-1 ring-[#2d4a3e]/15" 
                            : isInChain
                            ? "border-[#2d4a3e]/60"
                            : "border-[#1a1a1a]/15"
                        )}
                      >
                        <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-1 mb-1 w-full">
                          <span className={cn(
                            "font-mono text-[9px] font-bold uppercase truncate",
                            isSelected || isInChain ? "text-[#2d4a3e]" : "text-[#1a1a1a]/60"
                          )}>
                            @{node.agent}
                          </span>
                          <span className="font-mono text-[7px] text-[#1a1a1a]/40">
                            {node.id}
                          </span>
                        </div>
                        <div className="font-sans font-bold text-[10px] text-[#1a1a1a] leading-tight truncate w-full">
                          {node.role}
                        </div>
                        <div className="font-mono text-[8px] bg-[#faf9f5] border border-[#1a1a1a]/5 px-1 py-0.5 mt-1 text-[#1a1a1a]/50 truncate w-full">
                          [{node.kind}]
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Instructions */}
            <div className="flex items-center gap-1.5 mt-2 font-mono text-[9px] text-[#1a1a1a]/40 uppercase">
              <Info className="h-3.5 w-3.5 text-[#c4903a]" />
              <span>Click nodes above to trace and inspect parent-child correlationId pathways.</span>
            </div>
          </div>

          {/* Timeline Node Inspector Detail Panel */}
          {selectedNode && (
            <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none space-y-3">
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2">
                <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#2d4a3e]" />
                  ACMI Telemetry Inspector: Node {selectedNode.id}
                </span>
                <span className="font-mono text-[9px] uppercase bg-[#faf9f5] border border-[#1a1a1a]/10 px-2 py-0.5 text-[#2d4a3e] font-bold">
                  @{selectedNode.agent}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#1a1a1a]/50">Trace Correlation ID</span>
                    <span className="font-bold text-[#1a1a1a] break-all">{selectedNode.correlationId}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#1a1a1a]/50">Parent Correlation ID</span>
                    <span className="text-[#1a1a1a] break-all">{selectedNode.parentCorrelationId || "[NONE: ROOT ORIGIN]"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#1a1a1a]/50">Command Tool Action</span>
                    <span className="font-bold text-[#2d4a3e]">{selectedNode.kind}()</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#1a1a1a]/50">Milestone Summary</span>
                    <span className="text-[#1a1a1a] font-sans text-xs">{selectedNode.summary}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Sync Event Monitor */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none flex flex-col justify-between h-[592px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#1a1a1a]">
                  <Terminal className="h-3.5 w-3.5 text-[#2d4a3e]" />
                  Sync Thread Monitor
                </div>
                <span className="font-mono text-[9px] bg-[#faf9f5] border border-[#1a1a1a]/10 px-1.5 py-0.5 text-[#1a1a1a]/60">
                  REAL-TIME
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#1a1a1a]/50 leading-relaxed uppercase">
                Showing live status logs posted on thread: <span className="text-[#1a1a1a] font-bold">agent-coordination</span>.
              </p>
            </div>

            {/* Event List */}
            <div className="flex-1 bg-[#faf9f5] border border-[#1a1a1a]/10 p-2 my-3 overflow-y-auto space-y-2 rounded-none scrollbar-thin max-h-[460px]">
              {liveEvents.length > 0 ? (
                liveEvents.map((evt, i) => (
                  <div 
                    key={`evt-${i}`} 
                    className="p-2 border-b border-[#1a1a1a]/5 last:border-0 hover:bg-[#1a1a1a]/5 transition-all text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-[9px] text-[#1a1a1a]/40">
                      <span>@{evt.source}</span>
                      <span>{new Date(evt.ts).toTimeString().split(" ")[0]}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-[#2d4a3e] shrink-0">[{evt.kind}]</span>
                      <p className="text-[#1a1a1a] leading-tight font-sans text-[11px] truncate">
                        {evt.summary}
                      </p>
                    </div>
                    {evt.correlationId && (
                      <div className="text-[7px] text-[#1a1a1a]/40 truncate max-w-full font-mono">
                        CID: {evt.correlationId}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-[#1a1a1a]/30" />
                  <span className="font-mono text-[9px] text-[#1a1a1a]/40">POLLING STREAM SIGNALS...</span>
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="border-t border-[#1a1a1a]/10 pt-3 font-mono text-[10px] text-[#1a1a1a]/40 uppercase flex justify-between shrink-0">
              <span>SYNC_MODE: DYNAMIC</span>
              <span>POLL: 5s</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
