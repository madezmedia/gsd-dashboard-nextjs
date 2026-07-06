"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, RefreshCw, Radio, HardDrive, Cpu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Check CPU & memory usage on remote VM",
  "List active docker containers & system diagnostics",
  "Fetch all ACMI tasks currently registered in Redis",
  "Emit manual force-sync signal to acmi:bus relay",
  "Audit latest error logs from the acmi-bridge container",
];

export function CopilotPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "System online. I am the ACMI Fleet Copilot. I can inspect workflows, audit databases, and execute VM commands.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [signalEmitting, setSignalEmitting] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function triggerBusSignal(kind: string, summary: string) {
    setSignalEmitting(kind);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Triggering a system signal from the Command Center UI: emit ${kind} event. ${summary}`
            }
          ]
        })
      });
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `✓ ACMI bus signal emitted: \`[${kind}]\` - ${summary}` }
        ]);
      }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Optimistically add empty assistant message bubble to stream text into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const groqApiKey = typeof window !== "undefined" ? window.localStorage.getItem("groq_api_key") || "" : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (groqApiKey) {
        headers["x-groq-api-key"] = groqApiKey;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [...messages, userMsg]
            .filter((msg, idx) => !(idx === 0 && msg.role === "assistant"))
            .map(({ role, content }) => ({ role, content }))
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to communicate with fleet agent network.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream available.");

      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      }

      if (!assistantContent.trim()) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Agent responded with an empty signal stream. Please try rephrasing your command."
          };
          return updated;
        });
      }
    } catch (err: any) {
      console.error("Chat stream error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: err.message || "Error communicating with the fleet agent network. Verify credentials or model availability."
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Sidebar toggle badge */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#2d4a3e] dark:text-[#5EF2C6] bg-[#faf9f5] dark:bg-[#121314] hover:bg-[#2d4a3e]/10 border border-[#2d4a3e]/30 dark:border-[#5EF2C6]/30 shadow-2xl transition-all rounded-none"
        >
          <Bot className="h-4 w-4" />
          <span>[COPILOT]</span>
        </button>
      )}

      {/* Full height slide panel */}
      {open && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#faf9f5] dark:bg-[#121314] border-l border-[#1a1a1a]/20 dark:border-[#e3e4e6]/20 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]/10 dark:border-[#e3e4e6]/10 shrink-0">
            <div>
              <h3 className="text-sm font-bold font-mono text-[#2d4a3e] dark:text-[#5EF2C6] uppercase flex items-center gap-1.5">
                <Bot className="h-4 w-4" />
                ACMI Swarm Copilot
              </h3>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">
                Active execution bridge · Swarm Console
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-[#1a1a1a]/5 dark:hover:bg-white/5 text-[#1a1a1a]/60 dark:text-white/60 hover:text-[#1a1a1a] dark:hover:text-white border border-[#1a1a1a]/10 dark:border-white/10 rounded-none bg-[#f4f2eb] dark:bg-[#1a1b1d]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Starter Prompt Pills */}
          <div className="px-4 py-2 border-b border-border bg-background/50 space-y-1 shrink-0">
            <span className="text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Starter Prompts:</span>
            <div className="flex flex-col gap-1 mt-1">
              {STARTER_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(promptText)}
                  className="text-left text-[9px] font-mono border border-border px-2 py-1 bg-card hover:bg-secondary/40 text-foreground transition-all truncate"
                >
                  💡 {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Quick Action Chips */}
              <div className="border border-dashed border-[#1a1a1a]/15 dark:border-white/10 p-3 bg-[#f4f2eb]/20 mb-4 space-y-2">
                <p className="text-[9px] font-mono uppercase text-muted-foreground font-bold tracking-wider">
                  Quick Actions (Executes to ACMI Bus)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    disabled={!!signalEmitting}
                    onClick={() => triggerBusSignal("heartbeat", "Operational state heartbeat emitted via dashboard Copilot.")}
                    className="flex items-center gap-1 px-2 py-1 text-[8px] font-mono uppercase bg-[#faf9f5] dark:bg-[#1a1b1d] border border-border hover:bg-secondary transition-all"
                  >
                    <Radio className="h-2.5 w-2.5" />
                    <span>[HEARTBEAT]</span>
                  </button>
                  <button
                    disabled={!!signalEmitting}
                    onClick={() => triggerBusSignal("sync", "Manual sync action triggered from Command Center UI.")}
                    className="flex items-center gap-1 px-2 py-1 text-[8px] font-mono uppercase bg-[#faf9f5] dark:bg-[#1a1b1d] border border-border hover:bg-secondary transition-all"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>[FORCE SYNC]</span>
                  </button>
                  <button
                    disabled={!!signalEmitting}
                    onClick={() => triggerBusSignal("rollup", "Recalculating dashboard metric rollups.")}
                    className="flex items-center gap-1 px-2 py-1 text-[8px] font-mono uppercase bg-[#faf9f5] dark:bg-[#1a1b1d] border border-border hover:bg-secondary transition-all"
                  >
                    <HardDrive className="h-2.5 w-2.5" />
                    <span>[ROLLUP]</span>
                  </button>
                </div>
              </div>

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col mb-4",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <span className="text-[8px] font-mono text-muted-foreground uppercase mb-0.5">
                    {msg.role === "user" ? "Operator" : "Fleet Copilot"}
                  </span>
                  <div
                    className={cn(
                      "max-w-[85%] border font-mono text-xs p-3 rounded-none leading-relaxed",
                      msg.role === "user"
                        ? "bg-[#2d4a3e] border-[#2d4a3e] text-white"
                        : "bg-[#f4f2eb] dark:bg-[#1b1c1d] border-[#1a1a1a]/15 dark:border-white/10 text-foreground"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex flex-col items-start mb-4">
                  <span className="text-[8px] font-mono text-muted-foreground uppercase mb-0.5">Agent</span>
                  <div className="bg-[#f4f2eb] dark:bg-[#1b1c1d] border border-[#1a1a1a]/15 dark:border-white/10 font-mono text-xs p-3 rounded-none text-muted-foreground">
                    <span className="animate-pulse">Accessing Swarm registry...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="border-t border-[#1a1a1a]/10 dark:border-white/10 p-3 flex flex-col gap-2 shrink-0 bg-[#faf9f5] dark:bg-card">
              {enhancing && (
                <div className="text-[8px] font-mono text-primary animate-pulse uppercase flex items-center gap-1">
                  <span>Enhancing prompt with Grok...</span>
                </div>
              )}
              <div className="flex gap-2">
                <label htmlFor="copilot-query" className="sr-only">
                  Enter command query
                </label>
                <input
                  id="copilot-query"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Instruct Fleet Copilot..."
                  className="flex-1 rounded-none border border-border bg-[#f4f2eb] dark:bg-[#151617] px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                />
                <button
                  type="button"
                  disabled={enhancing || !input.trim()}
                  onClick={handleEnhancePrompt}
                  title="Enhance prompt with Grok"
                  className="h-8 px-2.5 border border-border hover:bg-secondary/50 text-foreground font-mono text-[9px] uppercase flex items-center gap-1 transition-all shrink-0 bg-background"
                >
                  <span>✨ Grok</span>
                </button>
                <Button type="submit" size="icon" className="rounded-none h-8 w-8 bg-[#2d4a3e] hover:bg-[#2d4a3e]/90 text-white shrink-0" disabled={loading || !input.trim()}>
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
