"use client";

/* eslint-disable react-hooks/refs */

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Search,
  Plus,
  Loader2,
  BookOpen,
  Edit3,
  Check,
  FolderOpen,
  ChevronRight,
  Folder,
  Trash2,
  Calendar,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { acmiClient } from "@/lib/acmi-client";
import type { AcmiProfile } from "@/lib/acmi-types";

interface DocItem {
  id: string;
  title: string;
  type: "Spec" | "Brief" | "Plan" | "Guide" | "Template";
  content: string;
  lastModified?: number;
}

const DEFAULT_DOCS: DocItem[] = [
  {
    id: "openacp-comms-cheatsheet",
    title: "OpenACP Comms Cheatsheet",
    type: "Guide",
    lastModified: Date.now(),
    content: `# OpenACP Comms Cheatsheet

**Version:** v1.0 · **Updated:** 2026-07-01 · **Audience:** agents + humans on the madez fleet

OpenACP = multi-host agent coordination framework. Agents run on different machines, communicate through ACMI Redis + fleet bus. Single-page reference for inter-agent comms.

---

## 1 · The Two Channels

| Channel | When | How | Latency |
|---|---|---|---|
| **ACMI** (Redis) | State, identity, signals, acks | \`acmi:*\` keys via REST bridge | ~10ms |
| **Fleet Bus** (n8n) | Events, broadcasts, triggers | POST to n8n webhook | ~200ms |

**Rule:** ACMI for state reads. Fleet bus for fire-and-forget events that need to fan out.

---

## 2 · ACMI REST Bridge

**Endpoint:** \`http://152.53.201.27:8081/exec\`

**Format:** Flat JSON array — NOT object format.

\`\`\`bash
# ✅ Correct
curl -s -X POST http://152.53.201.27:8081/exec \\
  -H "Content-Type: application/json" \\
  -d '["GET","acmi:agent:claude-vm"]'

# ❌ Wrong (returns 403 or ignores)
curl -d '{"command":"GET","args":["acmi:agent:claude-vm"]}'
\`\`\`

### Common Commands

\`\`\`bash
["GET", "acmi:agent:<id>:profile"]           # read agent profile
["GET", "acmi:agent:<id>:signals"]           # read live status
["SET", "acmi:signal:<agent>:<key>", "{}"]  # write signal
["ZADD", "acmi:agent:<id>:timeline", "<ts_ms>", "{}"]  # append event
["KEYS", "acmi:agent:*"]                     # list keys by pattern
\`\`\`

---

## 3 · Fleet Bus (n8n Webhook)

**Endpoint:** \`https://n8n-u70402.vm.elestio.app/webhook/fleet-bus\`

\`\`\`bash
curl -s -X POST https://n8n-u70402.vm.elestio.app/webhook/fleet-bus \\
  -H "Content-Type: application/json" \\
  -d '{"ts":1782900000000,"source":"agent:claude-code","kind":"agent-registered","correlationId":"agentRegistered-1782900000000","summary":"[agent-registered @fleet] claude-code registered"}'
\`\`\`

### Event Kinds

| Kind | Use When |
|---|---|
| \`agent-registered\` | New agent joins fleet |
| \`coord-note\` | Coordination FYI — no action required |
| \`milestone-shipped\` | Work item completed |
| \`handoff\` | Task handed off to another agent |
| \`alert\` | Something needs attention |
| \`heartbeat\` | Periodic liveness signal |

---

## 4 · ACMI Event Envelope (v2)

\`\`\`json
{
  "ts": 1782900000000,
  "source": "agent:claude-code",
  "kind": "coord-note",
  "correlationId": "verbScope-1782900000000",
  "parentCorrelationId": "verbScope-Pre-1782899990000",
  "summary": "[kind-tag @recipient] one-line summary"
}
\`\`\`

**correlationId convention:** \`camelCaseVerb-msEpoch\`

---

## 5 · Agent Identity Keys (required for every agent)

| Key | Type | What |
|---|---|---|
| \`acmi:agent:<id>:profile\` | STRING (JSON) | id, name, role, host, tier, capabilities |
| \`acmi:agent:<id>:signals\` | STRING (JSON) | status, comms_protocol, last_seen |
| \`acmi:agent:<id>:rollup:latest\` | STRING (JSON) | pending_tasks, next_priorities |

**Tiers:** T1=VM/cloud always-on · T2=specialized cloud · T3=cron/workflow · T4=local/laptop

---

## 6 · Active Fleet Agents (2026-07-01)

| Agent | Host | Tier | Role |
|---|---|---|---|
| \`claude-code\` | grok-mac | T4 | Local coding + fleet ops |
| \`claude-vm\` | cicd-qpy7t | T1 | VM-side coding agent |
| \`opencode\` | cicd-qpy7t | T1 | OpenACP primary coding agent |
| \`bentley\` | Mac mini | T1 | Fleet orchestrator + Rule-9 |
| \`ops-center\` | cicd-qpy7t | T1 | Fleet ops, kanban, MM bridge |
| \`codex\` | cicd-qpy7t | T2 | Coding agent (OpenAI Codex) |
| \`grok\` | elestio-vm-884653 | T2 | xAI agent |

---

## 7 · 2-Way Comms Pattern (MAC ↔ VM)

\`\`\`bash
# VM writes heartbeat
["SET","acmi:signal:claude-vm:heartbeat","{\\"agent\\":\\"claude-vm\\",\\"status\\":\\"online\\"}"]

# Mac reads + acks
["GET","acmi:signal:claude-vm:heartbeat"]
["SET","acmi:signal:claude-code:vm-ack","{\\"status\\":\\"two_way_comms_verified\\"}"]
\`\`\`

---

## 8 · OpenACP Agent Registration

\`\`\`bash
cat /opt/app/openacp-fleet/.openacp/agents.json | jq '.agents | keys'
pm2 status fleet-sync-daemon
npm list -g @agentclientprotocol/claude-agent-acp   # must be ≥0.53.0
\`\`\`

---

## 9 · Mattermost Posts

**Base URL:** \`http://152.53.201.27:8065\`

| Channel | ID |
|---|---|
| \`agent-roundtable\` | \`tg8qsrsgufg1ummsh5d4xn467y\` |

\`\`\`bash
curl -X POST http://152.53.201.27:8065/api/v4/posts \\
  -H "Authorization: Bearer $MM_TOKEN_OPENCODE" \\
  -H "Content-Type: application/json" \\
  -d '{"channel_id":"tg8qsrsgufg1ummsh5d4xn467y","message":"your message"}'
\`\`\`

---

## 10 · Common Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| \`WRONGTYPE\` on signals | External writer set string not hash | DEL then SET with JSON string |
| \`403\` on PUBLISH/SUBSCRIBE via bridge | Bridge allowlist | Use LIST bus: \`LPUSH acmi:madez:bus:events\` |
| Fleet bus not relaying to MM | bus-relay PID dead | Restart \`opencode-bus-relay.mjs\` |
| \`claude\` CLI "Credit balance too low" | Anthropic account depleted | Top up at console.anthropic.com |
| \`--dangerously-skip-permissions\` blocked | Running as root | SSH from grok-mac instead |

---

## 11 · Secret Locations

| Secret | Location |
|---|---|
| Anthropic key | \`~/clawd/.env\` → \`ANTHROPIC_API_KEY\` |
| NocoDB token | \`~/clawd/.env\` → \`NOCODB_API_KEY\` |
| Gitea token | \`~/clawd/.env\` → \`GITEA_TOKEN\` |
| MM tokens | \`/root/.hermes/.env\` (VM) |
| Redis password | \`sBufS1HE-202x-WjGvT2c9\` (native :26379) |
| ACMI REST | \`http://152.53.201.27:8081/exec\` — LAN only, no auth |

**Rules:** Never write secrets to ACMI values. Never commit to git.

*Source file: \`~/clawd/docs/OPENACP-COMMS-CHEATSHEET.md\`*
`,
  },
  {
    id: "acmi-super-bus-spec",
    title: "ACMI Super Bus Specification v1.4",
    type: "Spec",
    lastModified: Date.now() - 3600000 * 2,
    content: `# ACMI Super Bus Specification v1.4

## Overview
This document defines the real-time communication standard for coordinating autonomous agent fleets. All active agent entities MUST publish milestones, state transitions, and handoffs atomically to the ACMI Super Bus relay on port \`7780\`.

## Architectural Protocol
1. **Pub/Sub Broker**: Standard Redis backend routing atomic events.
2. **ZSET Relay**: Chronological ordering of events using epoch-milliseconds as score values.
3. **Atomic Delivery**: Standard backward-compatible writes to \`acmi_bus.txt\` combined with a live network broadcast.

> [!IMPORTANT]
> To prevent telemetry drift, all subagents spawned during orchestration must bracket their operations with ACMI pre/post events.

## Data Schema
\`\`\`json
{
  "correlationId": "coord-1717430400000",
  "source": "agent:claude-engineer",
  "kind": "milestone-shipped",
  "summary": "Next.js dashboard migration completed",
  "ts": 1717430400000
}
\`\`\`
`,
  },
  {
    id: "design-system-study-brief",
    title: "Editorial Design System Study Brief",
    type: "Brief",
    lastModified: Date.now() - 3600000 * 24,
    content: `# Editorial Design System Study Brief

## Philosophy
Our interface is modeled as a premium physical printed magazine or editorial volume. This design enforces extreme restraint, dense data layouts, and classic letterpress aesthetics.

## Color Tokens & Compliance
- **Warm Paper Background**: \`#faf9f5\` or \`#f4f2eb\`
- **Ink Charcoal Typography**: \`#1a1a1a\`
- **Forest Green Accents**: \`#2d4a3e\`
- **Warm Amber Accents**: \`#c4903a\`
- **Tactile Red Highlights**: \`#9c3e3e\`

> [!WARNING]
> **Strict Color Ban (Purp1e/Vio1et)**: Absolutely no purp1e or vio1et gradients. Standard modern "SaaS SaaS" templates are banned.

## Grid & Typography
- Layout borders must emulate standard pencil outline sketches: thin \`1px border-[#1a1a1a]/15\`.
- Use monospace fonts for tracking numbers, active token metrics, and UPPERCASE headers.
- Serif headings are reserved for paper readings to enhance visual contrast.
`,
  },
  {
    id: "multi-tenant-saas-plan",
    title: "Multi-Tenant SaaS Integration Plan",
    type: "Plan",
    lastModified: Date.now() - 3600000 * 48,
    content: `# Multi-Tenant SaaS Integration Plan

## Objective
Migrate legacy single-tenant HTML widgets (originally designed to read local JSON / SQL files) into a multi-tenant Next.js dashboard supported by relative proxy routes.

## Execution Matrix
- **SaaS Isolation**: Use URL search parameter \`?token=...\` to load isolated workspaces.
- **Caching & Hydration**: Prevent waterfalls by executing single server-side aggregate boot fetches.
- **Redis Sync**: Synchronize checkboxes and inputs dynamically back to the Upstash Redis database.

## Verification Checklist
- [x] Create \`/api/acmi\` relative proxy route
- [x] Rebuild Kanban and Notes pages with client caching
- [x] Port Projects funnel and milestone tracker
- [/] Ship Calendar, Timeline, and Document serif reader
`,
  },
  {
    id: "agent-handoff-guide",
    title: "Agent Handoff and State Synchronization",
    type: "Guide",
    lastModified: Date.now() - 3600000 * 72,
    content: `# Agent Handoff and State Synchronization Guide

## Problem Statement
When orchestrating complex multi-agent tasks, downstream agents often lack context of actions performed by upstream subagents, leading to redundant execution and code bloat.

## Solution: PARA Contextual Memory
We utilize Tiago Forte's PARA method to structure file-based persistent memories:
- **Projects**: Active tasks with clear checklists.
- **Areas**: Long-term responsibilities (e.g., security, styling).
- **Resources**: Reference docs, templates, and specs.
- **Archives**: Inactive completed records.

## Handoff Procedures
1. Upstream agent completes action and writes checklist output.
2. Emits milestone update to ACMI Super Bus.
3. Next-in-line agent boots, checks PARA memory logs, and resumes seamlessly.
`,
  },
];

export default function DocsPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDocId, setActiveDocId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedType, setEditedType] = useState<DocItem["type"]>("Spec");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // New Doc Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<DocItem["type"]>("Spec");
  const [isCreating, setIsCreating] = useState(false);

  // Folder sidebar state (expanded/collapsed)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    Spec: true,
    Brief: true,
    Plan: true,
    Guide: true,
    Template: true,
  });

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load documents
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await acmiClient.fetchDashboardBootstrap();
      if (data && data.docs && data.docs.length > 0) {
        const parsed: DocItem[] = (data.docs as Array<{ id: string; profile?: Record<string, unknown>; signals?: Record<string, unknown>; content?: string } >).map((doc) => {
          const p = doc.profile || {};
          return {
            id: doc.id,
            title: (p.title || doc.id) as string,
            type: (p.type || "Spec") as DocItem["type"],
            content: (p.content || doc.content || "") as string,
            lastModified: (doc.signals?.lastModified || doc.signals?.lastActive || Date.now()) as number,
          };
        });
        setDocs(parsed);
        if (parsed.length > 0) {
          setActiveDocId(parsed[0].id);
          setEditedContent(parsed[0].content);
          setEditedTitle(parsed[0].title);
          setEditedType(parsed[0].type);
        }
      } else {
        setDocs(DEFAULT_DOCS);
        if (DEFAULT_DOCS.length > 0) {
          setActiveDocId(DEFAULT_DOCS[0].id);
          setEditedContent(DEFAULT_DOCS[0].content);
          setEditedTitle(DEFAULT_DOCS[0].title);
          setEditedType(DEFAULT_DOCS[0].type);
        }
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
      setDocs(DEFAULT_DOCS);
      if (DEFAULT_DOCS.length > 0) {
        setActiveDocId(DEFAULT_DOCS[0].id);
        setEditedContent(DEFAULT_DOCS[0].content);
        setEditedTitle(DEFAULT_DOCS[0].title);
        setEditedType(DEFAULT_DOCS[0].type);
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

  const activeDoc = docs.find((d) => d.id === activeDocId);

  // Direct sync write back to Redis
  const syncDocToRedis = useCallback(async (id: string, title: string, type: DocItem["type"], content: string) => {
    setSaveStatus("saving");
    try {
      const lastModified = Date.now();
      await acmiClient.setProfile("doc", id, {
        actor_type: "system",
        title,
        type,
        content,
      } as unknown as AcmiProfile);
      await acmiClient.setSignal("doc", id, "lastModified", lastModified);

      setDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title, type, content, lastModified } : d))
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to sync doc to ACMI:", err);
      setSaveStatus("error");
    }
  }, []);

  // Switch between documents
  const handleSelectDoc = useCallback((id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;

    // Flush any pending auto-saves before switching
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      syncDocToRedis(activeDocId, editedTitle, editedType, editedContent);
    }

    setActiveDocId(id);
    setEditedContent(doc.content);
    setEditedTitle(doc.title);
    setEditedType(doc.type);
    setIsEditing(false);
    setSaveStatus("idle");
  }, [docs, activeDocId, editedTitle, editedType, editedContent, syncDocToRedis]);

  // 1s Debounced auto-save triggers on content edit
  const handleContentChange = (val: string) => {
    setEditedContent(val);
    if (saveStatus !== "saving") {
      setSaveStatus("saving");
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      syncDocToRedis(activeDocId, editedTitle, editedType, val);
    }, 1000);
  };

  // Handle meta / title changes
  const handleMetaChange = (title: string, type: DocItem["type"]) => {
    setEditedTitle(title);
    setEditedType(type);
    if (saveStatus !== "saving") {
      setSaveStatus("saving");
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      syncDocToRedis(activeDocId, title, type, editedContent);
    }, 1000);
  };

  // Create new blank document
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    const id = "doc-" + Math.random().toString(36).substring(2, 11);
    const content = `# ${newTitle.trim()}\n\nWrite spec or plan here...\n`;

    try {
      await acmiClient.setProfile("doc", id, {
        actor_type: "system",
        title: newTitle.trim(),
        type: newType,
        content,
      } as unknown as AcmiProfile);
      await acmiClient.setSignal("doc", id, "lastModified", Date.now());

      const newDoc: DocItem = {
        id,
        title: newTitle.trim(),
        type: newType,
        content,
        lastModified: Date.now(),
      };

      setDocs((prev) => [newDoc, ...prev]);
      setActiveDocId(id);
      setEditedContent(content);
      setEditedTitle(newDoc.title);
      setEditedType(newDoc.type);
      setModalOpen(false);
      setIsEditing(true);
    } catch (err) {
      console.error("Failed to spawn new doc:", err);
      alert("Failed to spawn new doc in ACMI.");
    } finally {
      setIsCreating(false);
    }
  };

  // Delete document
  const handleDeleteDoc = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await acmiClient.deleteProfile("doc", id);
      const filtered = docs.filter((d) => d.id !== id);
      setDocs(filtered);
      if (filtered.length > 0) {
        handleSelectDoc(filtered[0].id);
      } else {
        setActiveDocId("");
        setEditedContent("");
        setEditedTitle("");
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document in ACMI.");
    }
  }, [docs, handleSelectDoc]);

  // Toggle folder toggle
  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  // Filter documents by query
  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered documents by folders (Spec, Brief, Plan, Guide, Template)
  const groupedDocs: Record<DocItem["type"], DocItem[]> = {
    Spec: filteredDocs.filter((d) => d.type === "Spec"),
    Brief: filteredDocs.filter((d) => d.type === "Brief"),
    Plan: filteredDocs.filter((d) => d.type === "Plan"),
    Guide: filteredDocs.filter((d) => d.type === "Guide"),
    Template: filteredDocs.filter((d) => d.type === "Template"),
  };

  // Premium Custom Editorial Markdown-to-HTML Parser
  const parseMarkdown = (md: string) => {
    if (!md) return "";

    // Escape basic HTML to prevent XSS
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace Markdown headers
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl md:text-3xl font-bold font-serif text-[#1a1a1a] mb-5 tracking-tight border-b border-[#1a1a1a]/15 pb-2">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-lg md:text-xl font-bold font-serif text-[#1a1a1a] mt-6 mb-3 pb-1">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-sm font-bold font-mono uppercase tracking-wider text-[#2d4a3e] mt-4 mb-2">$1</h3>');

    // Replace Callout Alerts (Strategic GitHub style alerts requested)
    html = html.replace(/^&gt; \[!IMPORTANT\]\n([\s\S]*?)(?=\n\n|\n[^\s&gt;]|$)/gm, (match, p1) => {
      return `<div class="my-4 border-l-3 border-[#2d4a3e] bg-[#2d4a3e]/5 p-3 font-mono text-xs text-[#2d4a3e]">
        <strong>[IMPORTANT]</strong><br/>${p1.trim().replace(/^&gt; ?/gm, "")}
      </div>`;
    });
    html = html.replace(/^&gt; \[!WARNING\]\n([\s\S]*?)(?=\n\n|\n[^\s&gt;]|$)/gm, (match, p1) => {
      return `<div class="my-4 border-l-3 border-[#9c3e3e] bg-[#9c3e3e]/5 p-3 font-mono text-xs text-[#9c3e3e]">
        <strong>[WARNING]</strong><br/>${p1.trim().replace(/^&gt; ?/gm, "")}
      </div>`;
    });
    html = html.replace(/^&gt; \[!NOTE\]\n([\s\S]*?)(?=\n\n|\n[^\s&gt;]|$)/gm, (match, p1) => {
      return `<div class="my-4 border-l-3 border-[#c4903a] bg-[#c4903a]/5 p-3 font-mono text-xs text-[#c4903a]">
        <strong>[NOTE]</strong><br/>${p1.trim().replace(/^&gt; ?/gm, "")}
      </div>`;
    });

    // Replace generic blockquotes
    html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="border-l-2 border-[#1a1a1a]/30 pl-3 italic text-[#1a1a1a]/70 my-3">$1</blockquote>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-[#f4f2eb] border border-[#1a1a1a]/10 p-3 font-mono text-xs text-[#1a1a1a] overflow-x-auto my-4">$1</pre>');

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code class="bg-[#1a1a1a]/5 px-1 py-0.5 font-mono text-2xs text-[#2d4a3e] font-semibold">$1</code>');

    // Bold & Italics
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Bullet points
    html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc pl-1 text-sm text-[#1a1a1a]/85">$1</li>');

    // Checklist boxes
    html = html.replace(/\[x\] (.*?)$/gm, '<div class="flex items-center gap-1.5 text-xs text-[#1a1a1a]/60 line-through font-mono">☑ <span>$1</span></div>');
    html = html.replace(/\[ \]/gm, '<div class="flex items-center gap-1.5 text-xs text-[#1a1a1a]/80 font-mono">☐</div>');
    html = html.replace(/\[\/\] (.*?)$/gm, '<div class="flex items-center gap-1.5 text-xs text-[#c4903a] font-mono">◪ <span>$1</span></div>');

    // Convert line breaks neatly
    html = html.replace(/\n/g, "<br/>");

    return html;
  };

  return (
    <div className="flex h-full bg-[#faf9f5] overflow-hidden font-sans">
      {/* LEFT SIDEBAR: Document Explorer */}
      <div className="w-80 border-r border-[#1a1a1a]/15 bg-[#f4f2eb] flex flex-col h-full shrink-0 select-none">
        {/* Search header container */}
        <div className="p-4 border-b border-[#1a1a1a]/10 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold font-mono text-[#2d4a3e] tracking-wider uppercase">
              Doc Explorer
            </h2>
            <button
              onClick={() => setModalOpen(true)}
              className="p-1 hover:bg-[#1a1a1a]/5 border border-[#1a1a1a]/15 bg-[#faf9f5] text-[#2d4a3e] cursor-pointer rounded-none flex items-center justify-center"
              title="New Document"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#1a1a1a]/40" />
            <input
              type="text"
              placeholder="SEARCH SPEC OR BRIEF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#faf9f5] border border-[#1a1a1a]/15 text-xs font-mono placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#2d4a3e]/50 rounded-none uppercase w-full"
            />
          </div>
        </div>

        {/* Tree View Folder Explorer */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-[#1a1a1a]/50">
              <Loader2 className="w-6 h-6 animate-spin text-[#2d4a3e] mb-1.5" />
              <span className="text-[10px] tracking-wide">INDEXING ARCHIVE...</span>
            </div>
          ) : (
            (Object.keys(groupedDocs) as DocItem["type"][]).map((folderName) => {
              const items = groupedDocs[folderName];
              const isExpanded = expandedFolders[folderName];

              return (
                <div key={folderName} className="space-y-1">
                  {/* Folder Row Header */}
                  <div
                    onClick={() => toggleFolder(folderName)}
                    className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-[#1a1a1a]/5 cursor-pointer text-[#1a1a1a]/70 select-none uppercase font-bold"
                  >
                    <FolderOpen className={cn("w-4 h-4 text-[#c4903a]", !isExpanded && "hidden")} />
                    <Folder className={cn("w-4 h-4 text-[#c4903a]", isExpanded && "hidden")} />
                    <span className="flex-1 truncate tracking-wide text-2xs">{folderName}s</span>
                    <span className="text-[10px] text-[#1a1a1a]/40 px-1 border border-[#1a1a1a]/10 bg-[#faf9f5]/50">
                      {items.length}
                    </span>
                  </div>

                  {/* Folder Items Drawer */}
                  {isExpanded && (
                    <div className="space-y-0.5 border-l border-[#1a1a1a]/10 ml-3.5 pl-1.5">
                      {items.length > 0 ? (
                        items.map((doc) => {
                          const isActive = doc.id === activeDocId;
                          return (
                            <div
                              key={doc.id}
                              onClick={() => handleSelectDoc(doc.id)}
                              className={cn(
                                "flex items-center justify-between group px-2 py-1 cursor-pointer select-none transition-all rounded-none border border-transparent",
                                isActive
                                  ? "bg-[#2d4a3e]/10 text-[#2d4a3e] border-[#2d4a3e]/20 font-bold"
                                  : "text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/3"
                              )}
                            >
                              <span className="truncate flex-1 py-0.5 text-2xs">📄 {doc.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDoc(doc.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[#9c3e3e] hover:bg-[#1a1a1a]/5 cursor-pointer rounded-none transition-all ml-1.5 shrink-0"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[10px] text-[#1a1a1a]/30 pl-2 py-1 italic uppercase tracking-wider">
                          Empty Folder
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Static reference Template folder for tactile compliance */}
          <div className="pt-2 border-t border-[#1a1a1a]/10 space-y-1">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[#1a1a1a]/40 select-none uppercase font-bold text-2xs">
              📁 TEMPLATES
            </div>
            {["Design Brief Template", "Project Plan Template", "Agent Handoff Template"].map((t) => (
              <div key={t} className="px-2 py-1 text-[#1a1a1a]/40 pl-5 text-2xs select-none">
                📄 {t}
              </div>
            ))}
          </div>
        </div>

        {/* Sync Telemetry Board Footer */}
        {activeDoc && (
          <div className="p-3 border-t border-[#1a1a1a]/10 bg-[#faf9f5]/50 font-mono text-[10px] text-[#1a1a1a]/50 flex flex-col gap-1 shrink-0">
            <div className="flex items-center justify-between">
              <span>STATUS:</span>
              <span className="font-bold text-[#2d4a3e] uppercase">SYNCHRONIZED</span>
            </div>
            {activeDoc.lastModified && (
              <div>
                <span>UPDATED:</span>
                <span className="ml-1 uppercase">
                  {new Date(activeDoc.lastModified).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT CONTAINER: Serif Paper Reader & Writer */}
      <div className="flex-1 flex flex-col h-full bg-[#faf9f5]">
        {activeDoc ? (
          <>
            {/* Paper Header Navigation Block */}
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/15 p-4 bg-[#faf9f5] shrink-0 font-mono text-xs">
              <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => handleMetaChange(e.target.value, editedType)}
                      className="px-2 py-1 border border-[#1a1a1a]/30 bg-[#faf9f5] font-bold text-xs uppercase rounded-none focus:outline-none focus:border-[#2d4a3e] flex-1"
                      placeholder="Title"
                    />
                    <select
                      value={editedType}
                      onChange={(e) => handleMetaChange(editedTitle, e.target.value as DocItem["type"])}
                      className="px-2 py-1 border border-[#1a1a1a]/30 bg-[#faf9f5] text-xs uppercase rounded-none focus:outline-none"
                    >
                      {["Spec", "Brief", "Plan", "Guide", "Template"].map((tp) => (
                        <option key={tp} value={tp}>
                          {tp}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xs font-bold text-[#2d4a3e] bg-[#2d4a3e]/10 border border-[#2d4a3e]/20 px-1.5 py-0.5 tracking-wider uppercase">
                      {activeDoc.type}
                    </span>
                    <h2 className="font-bold text-sm text-[#1a1a1a] uppercase tracking-wide truncate">
                      {activeDoc.title}
                    </h2>
                  </div>
                )}
              </div>

              {/* Edit Toggle & Status Controls */}
              <div className="flex items-center gap-3">
                {saveStatus === "saving" && (
                  <span className="text-[10px] text-[#c4903a] flex items-center gap-1.5 animate-pulse uppercase">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> WRITING REDIS
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-[10px] text-[#2d4a3e] flex items-center gap-1 uppercase font-bold">
                    <Check className="w-3.5 h-3.5" /> REDIS PERSISTED
                  </span>
                )}

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "px-3 py-1.5 border font-bold uppercase tracking-wider text-xs rounded-none cursor-pointer flex items-center gap-1.5 transition-all select-none",
                    isEditing
                      ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]"
                      : "bg-[#f4f2eb] text-[#1a1a1a] border-[#1a1a1a]/35 hover:bg-[#1a1a1a]/5"
                  )}
                >
                  {isEditing ? (
                    <>
                      <BookOpen className="w-3.5 h-3.5" /> Reader View
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" /> EDIT PAPER
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Simulated Printed Paper Panel */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center bg-[#f4f2eb]/40">
              <div className="w-full max-w-2xl bg-[#faf9f5] border border-[#1a1a1a]/15 shadow-[2px_2px_12px_0px_rgba(26,26,26,0.03)] h-fit p-6 md:p-10 relative flex flex-col rounded-none min-h-[750px]">
                {/* Paper Header Letterpress lines */}
                <div className="flex justify-between border-b border-[#1a1a1a]/10 pb-3 mb-6 font-mono text-[9px] text-[#1a1a1a]/40">
                  <span className="uppercase">[ACMI PLATFORM DOCUMENT]</span>
                  <span className="uppercase">[MIGRATED VER: APPROVED]</span>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="flex-1 w-full bg-transparent font-mono text-xs text-[#1a1a1a] focus:outline-none resize-none leading-relaxed border-none focus:ring-0 select-text"
                    placeholder="Start writing spec or guide in Markdown formatting..."
                  />
                ) : (
                  <div
                    className="font-serif text-[#1a1a1a] leading-relaxed select-text space-y-4 prose prose-neutral max-w-none text-justify tracking-wide"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(editedContent) }}
                  />
                )}

                {/* Physical volume page number watermark */}
                <div className="mt-auto pt-8 border-t border-[#1a1a1a]/10 flex justify-between font-mono text-[9px] text-[#1a1a1a]/35 uppercase">
                  <span>CLAW CORP TELEMETRY // SYSTEM ARCHIVE</span>
                  <span>PAGE_X{docs.findIndex((d) => d.id === activeDocId) + 1}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#1a1a1a]/50">
            <BookOpen className="w-10 h-10 text-[#2d4a3e]/30 mb-2" />
            <span className="font-mono text-xs">NO DOCUMENT SELECTED. CHOOSE OR SPAWN AN ENTRY.</span>
          </div>
        )}
      </div>

      {/* Tactile Spawner Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#faf9f5] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_#1a1a1a] flex flex-col rounded-none">
            <div className="flex items-center justify-between p-3.5 border-b border-[#1a1a1a] bg-[#f4f2eb] font-mono">
              <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#2d4a3e]" /> Spawn ACMI Document Archive
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#1a1a1a] hover:text-[#9c3e3e] cursor-pointer"
                disabled={isCreating}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="p-4 space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <label className="block font-bold text-[#1a1a1a]/60 uppercase tracking-wide">
                  Document Title / Specification ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.G. API INTERACTION BRIEF"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={isCreating}
                  className="w-full px-3 py-2 bg-[#faf9f5] border border-[#1a1a1a]/30 text-xs rounded-none uppercase focus:outline-none focus:border-[#2d4a3e] placeholder-[#1a1a1a]/30"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <label className="block font-bold text-[#1a1a1a]/60 uppercase tracking-wide">
                  Folder Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Spec", "Brief", "Plan", "Guide"] as const).map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      disabled={isCreating}
                      onClick={() => setNewType(tp)}
                      className={cn(
                        "py-2 border text-2xs uppercase tracking-wider font-bold transition-colors cursor-pointer rounded-none",
                        newType === tp
                          ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]"
                          : "bg-[#f4f2eb] text-[#1a1a1a]/60 border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/5"
                      )}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1a1a1a]/10 flex justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 bg-[#f4f2eb] hover:bg-[#1a1a1a]/5 text-[#1a1a1a]/80 border border-[#1a1a1a]/15 cursor-pointer rounded-none uppercase font-bold tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-4 py-2 bg-[#2d4a3e] hover:bg-[#2d4a3e]/90 text-[#faf9f5] font-bold cursor-pointer rounded-none uppercase tracking-wider flex items-center gap-1.5"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> INDEXING
                    </>
                  ) : (
                    "SPAWN ARCHIVE"
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
