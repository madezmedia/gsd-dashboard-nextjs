"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import {
  Bot,
  Send,
  X,
  RefreshCw,
  Radio,
  HardDrive,
  Cpu,
  Terminal,
  ListTodo,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "Check CPU & memory usage on remote VM",
  "List active docker containers & system diagnostics",
  "Fetch all ACMI tasks currently registered in Redis",
  "Emit manual force-sync signal to acmi:bus relay",
  "Audit latest error logs from the acmi-bridge container",
];

// Custom rendering for markdown-like text chunk structures
function parseMarkdown(text: string) {
  if (!text) return "";
  
  // Escape HTML tags to prevent XSS
  let parsed = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold text (**bold**)
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Inline code block (`code`)
  parsed = parsed.replace(
    /`(.*?)`/g,
    "<code class='bg-secondary dark:bg-[#1a1c1d] border border-border px-1 py-0.5 font-mono text-[10px] text-primary rounded-none font-bold'>$1</code>"
  );

  // Multi-line code blocks with syntax block styles
  parsed = parsed.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-card dark:bg-[#0c0d0e] border border-border p-3 my-2 overflow-auto font-mono text-[10px] leading-relaxed text-foreground select-text rounded-none"><div class="flex items-center justify-between text-[8px] text-muted-foreground uppercase border-b border-border pb-1.5 mb-1.5 select-none font-mono"><span>[Code Output: ${lang || "raw"}]</span></div><code>${code.trim()}</code></pre>`;
  });

  // Bullet items
  parsed = parsed.replace(/^\s*-\s+(.*?)$/gm, "• $1");

  return <div className="space-y-1.5 break-words font-mono text-[11px] leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed }} />;
}

// Generative UI components representing tool execution states
function ToolInvocationWidget({ toolInv }: { toolInv: any }) {
  const { toolName, state, args, result } = toolInv;
  const isCompleted = state === "result";

  if (toolName === "runVMCommand") {
    const command = args?.command || "";
    const success = result?.success;
    const output = result?.output || "";
    const error = result?.error || "";

    return (
      <div className="border border-border my-2 font-mono text-xs w-full bg-[#0a1113] text-[#e3e8e8] shadow-md">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-[#0f1b1e] select-none">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-[#5EF2C6]" />
            <span className="font-bold text-[9px] tracking-wider uppercase text-[#9bbcbe] font-mono">
              [VM Terminal Console]
            </span>
          </div>
          <span className={cn(
            "text-[8px] font-bold px-1.5 py-0.5 border leading-none uppercase font-mono",
            isCompleted 
              ? (success ? "border-[#5ef2c6]/30 text-[#5ef2c6] bg-[#5ef2c6]/5" : "border-red-500/30 text-red-400 bg-red-500/5")
              : "border-amber-500/30 text-amber-400 bg-amber-500/5 animate-pulse"
          )}>
            {isCompleted ? (success ? "SUCCESS" : "ERROR") : "EXECUTING"}
          </span>
        </div>

        {/* Command Runner line */}
        <div className="px-3 py-1.5 border-b border-border bg-[#122226]/40 select-text">
          <span className="text-[#5ef2c6] mr-1.5">$</span>
          <span className="font-bold text-white">{command}</span>
        </div>

        {/* Output Area */}
        <div className="px-3 py-2 text-[10px] leading-relaxed max-h-[180px] overflow-auto whitespace-pre-wrap font-mono select-text scrollbar-thin">
          {!isCompleted && (
            <div className="flex items-center gap-1.5 text-muted-foreground py-1">
              <Cpu className="h-3.5 w-3.5 animate-spin text-[#5ef2c6]" />
              <span>Running VM execution, awaiting bridge response...</span>
            </div>
          )}
          {isCompleted && success && (
            <code className="text-emerald-400 font-mono text-[9px]">{output}</code>
          )}
          {isCompleted && !success && (
            <div className="text-red-400 flex flex-col gap-1 font-mono">
              <span className="font-bold uppercase text-[9px]">[Execution Failure]:</span>
              <code className="text-[9px]">{error || "Unknown bridge exception occurred."}</code>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (toolName === "getACMITasks") {
    const success = result?.success;
    const tasks = result?.tasks || [];

    return (
      <div className="border border-border my-2 font-mono text-xs w-full bg-[#0e1713] text-[#e3e8e8] shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-[#12211b] select-none">
          <div className="flex items-center gap-1.5">
            <ListTodo className="h-3.5 w-3.5 text-[#5EF2C6]" />
            <span className="font-bold text-[9px] tracking-wider uppercase text-[#9bbcbe] font-mono">
              [ACMI Task Index]
            </span>
          </div>
          <span className="text-[8px] font-bold px-1.5 py-0.5 border border-[#5ef2c6]/30 text-[#5ef2c6] leading-none uppercase font-mono bg-[#5ef2c6]/5">
            {isCompleted ? `FOUND: ${tasks.length}` : "SCANNING"}
          </span>
        </div>

        {/* Content */}
        <div className="p-2 max-h-[200px] overflow-auto scrollbar-thin bg-card text-foreground">
          {!isCompleted && (
            <span className="text-muted-foreground animate-pulse text-[9px] font-mono block p-1">
              Accessing Redis acmi:work items...
            </span>
          )}
          {isCompleted && success && tasks.length === 0 && (
            <span className="text-muted-foreground text-[9px] font-mono block p-1">
              Zero active tasks registered under this tenant.
            </span>
          )}
          {isCompleted && success && tasks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {tasks.map((task: any, idx: number) => (
                <div key={idx} className="border border-border p-2 bg-[#faf9f5]/50 dark:bg-[#1a1b1d]/50 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[9px] text-[#2d4a3e] dark:text-[#5ef2c6] truncate max-w-[200px] font-mono">
                      {task.title}
                    </span>
                    <span className={cn(
                      "text-[7px] font-mono border px-1 uppercase leading-none",
                      task.status === "done" ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" :
                      task.status === "in_progress" ? "border-amber-500/30 text-amber-500 bg-amber-500/5" :
                      "border-blue-500/30 text-blue-500 bg-blue-500/5"
                    )}>
                      {task.status}
                    </span>
                  </div>
                  {task.id && <span className="text-[7px] font-mono text-muted-foreground">{task.id}</span>}
                  {task.description && (
                    <p className="text-[8px] text-muted-foreground mt-0.5 truncate font-mono">
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (toolName === "emitSignal") {
    const { kind, summary, correlationId } = args || {};
    const success = result?.success;

    return (
      <div className="border border-border my-2 font-mono text-xs w-full bg-[#18110b] text-[#e3e8e8] shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-[#261b11] select-none">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="font-bold text-[9px] tracking-wider uppercase text-[#9bbcbe] font-mono">
              [Super Bus Broadcast]
            </span>
          </div>
          <span className="text-[8px] font-bold px-1.5 py-0.5 border border-amber-500/30 text-amber-400 leading-none uppercase font-mono bg-amber-500/5">
            {isCompleted ? "SENT" : "EMITTING"}
          </span>
        </div>

        {/* Content */}
        <div className="p-3 space-y-1.5 text-[9px] font-mono">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground uppercase font-bold text-[8px]">Event Kind:</span>
            <span className="text-white font-bold bg-[#342416] px-1">{kind}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground uppercase font-bold text-[8px] shrink-0">Summary:</span>
            <span className="text-[#9bbcbe] text-right">{summary}</span>
          </div>
          {correlationId && (
            <div className="text-[7px] text-muted-foreground pt-1 border-t border-border mt-1 truncate select-all">
              Correlation: {correlationId}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback indicator
  return (
    <div className="border border-border px-2 py-1.5 my-1.5 font-mono text-[8px] bg-secondary/50 text-muted-foreground uppercase select-none flex items-center gap-1">
      <Cpu className="h-3 w-3 animate-spin text-primary" />
      <span>[SWARM TASK: {toolName} · {state}]</span>
    </div>
  );
}

export function CopilotPanel() {
  const [open, setOpen] = useState(false);
  const [signalEmitting, setSignalEmitting] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load custom api key if stored locally
  const groqApiKey = typeof window !== "undefined" ? window.localStorage.getItem("groq_api_key") || "" : "";

  // Initialize Vercel AI SDK useChat with TextStreamChatTransport
  const transport = new TextStreamChatTransport({
    api: "/api/chat",
    headers: groqApiKey ? { "x-groq-api-key": groqApiKey } : {},
  });

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: [
      {
        id: "welcome",
        role: "assistant" as "system" | "user" | "assistant",
        parts: [
          {
            type: "text",
            text: "System online. I am the ACMI Fleet Copilot. I can inspect workflows, audit databases, and execute VM commands.",
          },
        ],
      },
    ],
  });

  const isGenerating = status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function triggerBusSignal(kind: string, summary: string) {
    setSignalEmitting(kind);
    try {
      await sendMessage({
        text: `Triggering a system signal from the Command Center UI: emit ${kind} event. ${summary}`
      });
    } catch (err: any) {
      console.error("Signal emit failed:", err);
    } finally {
      setSignalEmitting(null);
    }
  }

  async function handleEnhancePrompt() {
    if (!input.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/chat/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.enhanced) {
          setInput(data.enhanced);
        }
      }
    } catch (err) {
      console.error("Failed to enhance prompt:", err);
    } finally {
      setEnhancing(false);
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    const text = input;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <>
      {/* Sidebar toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#2d4a3e] dark:text-[#5EF2C6] bg-[#faf9f5] dark:bg-[#121314] hover:bg-[#2d4a3e]/10 border border-[#2d4a3e]/30 dark:border-[#5EF2C6]/30 shadow-2xl transition-all rounded-none cursor-pointer"
        >
          <Bot className="h-4 w-4" />
          <span>[COPILOT]</span>
        </button>
      )}

      {/* Slide-out Drawer */}
      {open && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-[#faf9f5] dark:bg-[#121314] border-l border-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0 select-none">
            <div>
              <h3 className="text-sm font-bold font-mono text-[#2d4a3e] dark:text-[#5EF2C6] uppercase flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-[#5ef2c6]" />
                ACMI Swarm Copilot
              </h3>
              <p className="text-[8px] font-mono text-muted-foreground uppercase mt-0.5 tracking-wider">
                Vercel Serverless Stream · Multi-Step Agentic Console
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-[#1a1a1a]/5 dark:hover:bg-white/5 text-[#1a1a1a]/60 dark:text-white/60 hover:text-[#1a1a1a] dark:hover:text-white border border-border rounded-none bg-card cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Starter Prompts */}
          <div className="px-4 py-2 border-b border-border bg-background/30 space-y-1.5 shrink-0 select-none">
            <span className="text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">
              Starter Prompts:
            </span>
            <div className="flex flex-col gap-1">
              {STARTER_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(promptText)}
                  className="text-left text-[9px] font-mono border border-border px-2.5 py-1 bg-card hover:bg-secondary/40 text-foreground transition-all truncate rounded-none cursor-pointer"
                >
                  💡 {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Messages panel */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-background/10">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Quick Action bar */}
              <div className="border border-dashed border-border p-3 bg-card/40 space-y-2 select-none">
                <p className="text-[8px] font-mono uppercase text-muted-foreground font-extrabold tracking-wider">
                  Quick Actions (Dispatch Direct Signal)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    disabled={!!signalEmitting || isGenerating}
                    onClick={() => triggerBusSignal("heartbeat", "Operational status ping emitted via dashboard.")}
                    className="flex items-center gap-1.5 px-2 py-1 text-[8px] font-mono uppercase bg-card border border-border hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Radio className="h-2.5 w-2.5 text-[#5ef2c6]" />
                    <span>[HEARTBEAT]</span>
                  </button>
                  <button
                    disabled={!!signalEmitting || isGenerating}
                    onClick={() => triggerBusSignal("sync", "Manual task board reconciliation signal triggered.")}
                    className="flex items-center gap-1.5 px-2 py-1 text-[8px] font-mono uppercase bg-card border border-border hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="h-2.5 w-2.5 text-[#5ef2c6]" />
                    <span>[FORCE SYNC]</span>
                  </button>
                  <button
                    disabled={!!signalEmitting || isGenerating}
                    onClick={() => triggerBusSignal("rollup", "Dashboard metrics recalculation signal triggered.")}
                    className="flex items-center gap-1.5 px-2 py-1 text-[8px] font-mono uppercase bg-card border border-border hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
                  >
                    <HardDrive className="h-2.5 w-2.5 text-[#5ef2c6]" />
                    <span>[ROLLUP]</span>
                  </button>
                </div>
              </div>

              {/* Message loop */}
              {messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <span className="text-[8px] font-mono text-muted-foreground uppercase mb-0.5 tracking-wider select-none">
                    {msg.role === "user" ? "Operator" : "Fleet Copilot"}
                  </span>
                  
                  <div
                    className={cn(
                      "max-w-[90%] border font-mono p-3 rounded-none select-text shadow-sm w-full",
                      msg.role === "user"
                        ? "bg-[#2d4a3e] border-[#2d4a3e] text-white"
                        : "bg-card border-border text-foreground"
                    )}
                  >
                    {/* Render message parts */}
                    {msg.parts && msg.parts.map((part: any, pIdx: number) => {
                      if (part.type === "text") {
                        return <div key={pIdx}>{parseMarkdown(part.text)}</div>;
                      }
                      if (part.type === "tool-invocation") {
                        return <ToolInvocationWidget key={pIdx} toolInv={part.toolInvocation} />;
                      }
                      if (part.type === "reasoning") {
                        return (
                          <div key={pIdx} className="text-muted-foreground border-l border-border pl-2 my-1 text-[10px] italic select-none">
                            {part.reasoning}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}

              {/* Loading display */}
              {isGenerating && messages[messages.length - 1]?.role === "user" && (
                <div className="flex flex-col items-start">
                  <span className="text-[8px] font-mono text-muted-foreground uppercase mb-0.5 select-none">
                    Fleet Copilot
                  </span>
                  <div className="bg-card border border-border p-3 rounded-none text-muted-foreground font-mono text-xs w-[80%] flex items-center gap-2 select-none shadow-sm">
                    <Sparkles className="h-4 w-4 animate-pulse text-[#5ef2c6]" />
                    <span className="animate-pulse">Accessing Swarm coordinates...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleFormSubmit}
              className="border-t border-border p-3 flex flex-col gap-2 shrink-0 bg-card select-none"
            >
              {enhancing && (
                <div className="text-[8px] font-mono text-primary animate-pulse uppercase flex items-center gap-1">
                  <span>Enhancing query prompt using Grok...</span>
                </div>
              )}
              <div className="flex gap-2">
                <label htmlFor="copilot-command-field" className="sr-only">
                  Enter command query
                </label>
                <input
                  id="copilot-command-field"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Instruct Fleet Copilot..."
                  className="flex-1 rounded-none border border-border bg-[#faf9f5] dark:bg-[#151617] px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                />
                
                {/* Grok prompt enhancer */}
                <button
                  type="button"
                  disabled={enhancing || !input.trim() || isGenerating}
                  onClick={handleEnhancePrompt}
                  title="Enhance prompt with Grok"
                  className="h-8 px-2.5 border border-border hover:bg-secondary/50 text-foreground font-mono text-[9px] uppercase flex items-center gap-1 transition-all shrink-0 bg-background cursor-pointer disabled:opacity-50"
                >
                  <span>✨ Grok</span>
                </button>

                <Button
                  type="submit"
                  size="icon"
                  className="rounded-none h-8 w-8 bg-[#2d4a3e] hover:bg-[#2d4a3e]/90 text-white shrink-0 cursor-pointer"
                  disabled={isGenerating || !input.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

