import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface CronItem {
  id: string;
  name: string;
  schedule: string;
  command: string;
  logPath: string;
  scriptPath?: string;
  description: string;
}

const CRON_REGISTRY: CronItem[] = [
  {
    id: "lead-sync",
    name: "Daily Lead Sync",
    schedule: "0 8 * * 1-5",
    command: "/Users/michaelshaw/clawd/tools/daily-lead-sync.sh",
    logPath: "/tmp/daily-lead-sync.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/daily-lead-sync.sh",
    description: "Daily sync of leads and contacts into HubSpot and internal revops engines.",
  },
  {
    id: "context-compact",
    name: "Context Compactor",
    schedule: "0 * * * *",
    command: "/usr/local/bin/node /Users/michaelshaw/clawd/tools/context-compactor.js check",
    logPath: "/tmp/context-compaction.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/context-compactor.js",
    description: "Hourly verification and compression of conversational agent context blocks.",
  },
  {
    id: "fanvue-orchestrate",
    name: "Fanvue Agent Orchestrator",
    schedule: "0 8 * * *",
    command: "/Users/michaelshaw/clawd/tools/fanvue-agent/fanvue_orchestrator.py run",
    logPath: "/Users/michaelshaw/clawd/tools/fanvue-agent/cron.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/fanvue-agent/fanvue_orchestrator.py",
    description: "Daily runner for the Fanvue influencer fleet orchestrator, scheduling posts and media syncs.",
  },
  {
    id: "vector-sync",
    name: "Hermes ACMI Vector Sync",
    schedule: "*/30 * * * *",
    command: "cd /Users/michaelshaw/.hermes/hermes-agent && python3 sync_acmi_vectors.py",
    logPath: "/tmp/acmi-vector-sync-cron.log",
    scriptPath: "/Users/michaelshaw/.hermes/hermes-agent/sync_acmi_vectors.py",
    description: "Synchronizes knowledge events from ACMI coordinate threads into Upstash Vector database.",
  },
  {
    id: "design-agency",
    name: "Design Agency Heartbeat",
    schedule: "0 */4 * * *",
    command: "/Users/michaelshaw/Projects/open-design/.od/projects/5bfd6fe6-b2ed-432a-bea3-cc4f4992a2c5/design-agency-cron.sh",
    logPath: "/tmp/design-agency-cron.log",
    scriptPath: "/Users/michaelshaw/Projects/open-design/.od/projects/5bfd6fe6-b2ed-432a-bea3-cc4f4992a2c5/design-agency-cron.sh",
    description: "Triggers heartbeat checks and layout generation sweeps on the Design Agency open-design pipeline.",
  },
  {
    id: "hourly-agent-update",
    name: "Hourly Agent Update",
    schedule: "0 * * * *",
    command: "/Users/michaelshaw/clawd/tools/hourly-agent-update.sh",
    logPath: "/tmp/hourly-agent-update-cron.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/hourly-agent-update.sh",
    description: "Fetches and applies hourly configuration updates to local agent models.",
  },
  {
    id: "paperclip-hil",
    name: "Paperclip HIL Monitor",
    schedule: "*/30 * * * *",
    command: "/Users/michaelshaw/clawd/tools/paperclip-hil-monitor.sh",
    logPath: "/tmp/paperclip-hil-monitor-cron.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/paperclip-hil-monitor.sh",
    description: "Checks Paperclip workflow human-in-the-loop task queues and fires notifications.",
  }
];

export async function GET() {
  const result = [];

  for (const cron of CRON_REGISTRY) {
    let status: "success" | "error" | "warning" | "unknown" = "unknown";
    let logs = "";
    let lastExecuted = "";
    let errorDetail = "";
    let scriptExists = false;

    // Check if script file exists
    if (cron.scriptPath) {
      try {
        scriptExists = fs.existsSync(cron.scriptPath);
      } catch {
        scriptExists = false;
      }
    }

    // Attempt to read log file on local filesystem
    try {
      if (fs.existsSync(cron.logPath)) {
        const stats = fs.statSync(cron.logPath);
        lastExecuted = stats.mtime.toISOString();

        // Read last 25 lines of log
        const content = fs.readFileSync(cron.logPath, "utf-8");
        const lines = content.split("\n");
        logs = lines.slice(-25).join("\n");

        // Simple log status heuristic
        const lowerLogs = logs.toLowerCase();
        if (
          lowerLogs.includes("error") || 
          lowerLogs.includes("failed") || 
          lowerLogs.includes("no such file") || 
          lowerLogs.includes("not found") || 
          lowerLogs.includes("exit code: 1")
        ) {
          status = "error";
          if (lowerLogs.includes("no such file or directory")) {
            errorDetail = "Executable binary or path missing in shell environment";
          } else if (lowerLogs.includes("not found")) {
            errorDetail = "Command or script not found";
          } else {
            errorDetail = "Execution returned errors or non-zero code";
          }
        } else if (lowerLogs.includes("complete") || lowerLogs.includes("success") || lowerLogs.includes("watermark updated") || lowerLogs.includes("upserted")) {
          status = "success";
        } else {
          status = "warning";
          errorDetail = "Unrecognized status signature in logs";
        }
      } else {
        status = "warning";
        logs = `[No log file exists at ${cron.logPath}]`;
        errorDetail = "Log file missing — has not run or directory permissions blocking";
      }
    } catch (err: any) {
      // Fallback for Vercel/Remote Sandbox environments
      status = "unknown";
      logs = `[ACMI remote sandbox fallback mode - local logs unavailable: ${err.message}]`;
      errorDetail = "Filesystem path inaccessible in sandboxed web environment";
    }

    // Extra diagnostic overrides
    if (cron.id === "context-compact" && logs.includes("No such file or directory")) {
      errorDetail = "CRITICAL: Node path misconfigured. Crontab uses '/usr/local/bin/node', actual path is '/opt/homebrew/bin/node'";
      status = "error";
    }
    if (cron.id === "hourly-agent-update" && logs.includes("No such file or directory")) {
      errorDetail = "CRITICAL: Script 'hourly-agent-update.sh' is completely missing from '/Users/michaelshaw/clawd/tools/'";
      status = "error";
    }

    result.push({
      ...cron,
      status,
      logs,
      lastExecuted: lastExecuted || new Date(Date.now() - 3600000).toISOString(), // Fallback
      errorDetail,
      scriptExists
    });
  }

  return NextResponse.json(result);
}
