"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Radio,
  Settings,
  AlertCircle
} from "lucide-react";
import {
  I18nProvider,
  AcpProvider,
  ChatView,
  PermissionDialog,
  LoginDialog,
  useAcpStore,
  useAcpContext
} from "@acp-components/react";
import "@acp-components/react/styles.css";

// Default working directory configuration
const DEFAULT_CWD = "/Users/michaelshaw/Projects/gsd-dashboard-nextjs";

function CopilotPanelInner({ onClose, wsUrl, setWsUrl }: { onClose: () => void; wsUrl: string; setWsUrl: (url: string) => void }) {
  const activeSessionId = useAcpStore((s) => s.activeSessionId);
  const agents = useAcpStore((s) => s.agents);
  const { addWorkspace } = useAcpContext();
  const loadedRef = useRef(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    addWorkspace(DEFAULT_CWD);
  }, [addWorkspace]);

  // Read connection details safely
  const agentConnection = Array.from(agents.values())[0];
  const status = agentConnection?.status || "disconnected";
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="flex flex-col h-full bg-card text-foreground font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0 select-none">
        <div>
          <h3 className="text-sm font-bold text-primary uppercase flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-primary" />
            ACMI Swarm Copilot
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[8px] text-muted-foreground uppercase tracking-wider">
              Agent Client Protocol (ACP)
            </span>
            <span className={`inline-flex items-center gap-1 text-[7px] px-1.5 py-0.5 font-bold uppercase rounded-sm ${
              isConnected 
                ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                : isConnecting 
                  ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse" 
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}>
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              {status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Configure Agent Connection"
            className={`p-1.5 border border-border rounded-none bg-card cursor-pointer transition-all hover:text-primary ${
              showSettings ? "bg-secondary text-primary" : "text-muted-foreground"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#1a1a1a]/5 dark:hover:bg-white/5 text-[#1a1a1a]/60 dark:text-white/60 hover:text-[#1a1a1a] dark:hover:text-white border border-border rounded-none bg-card cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-border bg-card/50 space-y-2 select-none">
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
            Connection Settings:
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://127.0.0.1:3100"
              className="flex-1 bg-background border border-border px-2 py-1 text-[10px] font-mono rounded-none focus:outline-none focus:border-primary"
            />
          </div>
          <p className="text-[7px] text-muted-foreground leading-normal">
            Make sure the ACP bridge server is running locally on the configured port.
            Run <code className="bg-background px-1 py-0.5 rounded-sm text-red-400">pnpm dev:server</code> to start it.
          </p>
        </div>
      )}

      {/* Chat View */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {!isConnected && !isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none z-10 bg-background/90 font-mono">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2 animate-bounce" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-500">Bridge Connection Offline</h4>
            <p className="text-[9px] text-muted-foreground max-w-[280px] mt-1.5 leading-relaxed">
              Could not establish connection to the ACP bridge agent at {wsUrl}.
            </p>
            <div className="mt-4 p-2 bg-card border border-border text-[8px] text-left text-muted-foreground space-y-1 w-full max-w-[320px]">
              <div className="font-bold text-foreground mb-1">To connect an agent:</div>
              <div>1. Install & build acp-components</div>
              <div>2. Run bridge server: <code className="bg-background text-red-400 px-1 py-0.5 rounded">pnpm dev:server</code></div>
              <div>3. Or run specific agent: <code className="bg-background text-red-400 px-1 py-0.5 rounded">pnpm dev:server-claude</code></div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="mt-4 px-3 py-1.5 border border-border text-[9px] font-bold uppercase tracking-wider hover:bg-secondary cursor-pointer"
            >
              Configure Connection URL
            </button>
          </div>
        )}
        <ChatView
          sessionId={activeSessionId}
          onNavigateFile={(path, line) => console.log("Navigate file:", path, line)}
        />
      </div>

      <PermissionDialog sessionId={activeSessionId} />
      <LoginDialog />
    </div>
  );
}

export function CopilotPanel() {
  const [open, setOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState("100dvh");
  
  // Custom WebSocket URL stored locally
  const [wsUrl, setWsUrl] = useState("ws://127.0.0.1:3100");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("acp_agent_ws_url");
      if (saved) setWsUrl(saved);
    }
  }, []);

  const handleSetWsUrl = (url: string) => {
    setWsUrl(url);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("acp_agent_ws_url", url);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    
    function handleResize() {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      }
    }
    
    const vv = window.visualViewport;
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();
    
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, [open]);

  return (
    <>
      {/* Sidebar toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-primary bg-card hover:bg-primary/10 border border-primary/30 shadow-2xl transition-all rounded-none cursor-pointer"
        >
          <Bot className="h-4 w-4" />
          <span>[COPILOT]</span>
        </button>
      )}

      {/* Slide-out Drawer */}
      {open && (
        <div style={{ height: viewportHeight }} className="fixed top-0 right-0 w-full sm:w-[440px] bg-card border-l border-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
          <I18nProvider>
            <AcpProvider
              agents={[
                {
                  id: "opencode",
                  name: "OpenCode",
                  transport: {
                    type: "websocket",
                    url: wsUrl,
                  },
                }
              ]}
              theme="dark"
              defaultCwd={DEFAULT_CWD}
            >
              <CopilotPanelInner onClose={() => setOpen(false)} wsUrl={wsUrl} setWsUrl={handleSetWsUrl} />
            </AcpProvider>
          </I18nProvider>
        </div>
      )}
    </>
  );
}
