/* eslint-disable */
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
  source: "mac-crontab" | "mac-launchd" | "vm-crontab" | "vm-systemd" | "n8n-webhook" | "per-agent" | "fleet-bus";
  host: "local-mac" | "cicd-qpy7t" | "n8n" | "fleet-bus";
}

// All 30+ crons across local Mac, VM cicd-qpy7t, n8n, fleet-bus, per-agent.
// Source: full audit of crontab -l + /Library/LaunchAgents on Mac, crontab -l + systemctl list-timers on VM, and per-agent schedules.
// Path resolution: logPath/scriptPath are LOCAL Mac paths (the dashboard reads them via local fs); VM/n8n paths are display-only (status will be "unknown" if log file isn't mounted).
const CRON_REGISTRY: CronItem[] = [
  // ========== LOCAL MAC — user crontab ==========
  {
    id: "mac-cron-paperclip-hil",
    name: "Paperclip HIL Monitor",
    schedule: "*/30 * * * *",
    command: "/Users/michaelshaw/clawd/tools/paperclip-hil-monitor.sh",
    logPath: "/tmp/paperclip-hil-monitor-cron.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/paperclip-hil-monitor.sh",
    description: "Checks Paperclip workflow human-in-the-loop task queues and fires notifications.",
    source: "mac-crontab",
    host: "local-mac",
  },
  {
    id: "mac-cron-hourly-agent-update",
    name: "Hourly Agent Update",
    schedule: "0 * * * *",
    command: "/Users/michaelshaw/clawd/tools/hourly-agent-update.sh",
    logPath: "/tmp/hourly-agent-update-cron.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/hourly-agent-update.sh",
    description: "Fetches and applies hourly configuration updates to local agent models.",
    source: "mac-crontab",
    host: "local-mac",
  },
  {
    id: "mac-cron-context-compact",
    name: "Context Compactor",
    schedule: "0 * * * *",
    command: "/usr/local/bin/node /Users/michaelshaw/clawd/tools/context-compactor.js check",
    logPath: "/tmp/context-compaction.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/context-compactor.js",
    description: "Hourly verification and compression of conversational agent context blocks.",
    source: "mac-crontab",
    host: "local-mac",
  },
  {
    id: "mac-cron-fanvue-orchestrate",
    name: "Fanvue Agent Orchestrator",
    schedule: "0 8 * * *",
    command: "/Users/michaelshaw/clawd/tools/fanvue-agent/fanvue_orchestrator.py run",
    logPath: "/Users/michaelshaw/clawd/tools/fanvue-agent/cron.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/fanvue-agent/fanvue_orchestrator.py",
    description: "Daily runner for the Fanvue influencer fleet orchestrator, scheduling posts and media syncs.",
    source: "mac-crontab",
    host: "local-mac",
  },
  {
    id: "mac-cron-vector-sync",
    name: "Hermes ACMI Vector Sync",
    schedule: "*/30 * * * *",
    command: "cd /Users/michaelshaw/.hermes/hermes-agent && python3 sync_acmi_vectors.py",
    logPath: "/tmp/acmi-vector-sync-cron.log",
    scriptPath: "/Users/michaelshaw/.hermes/hermes-agent/sync_acmi_vectors.py",
    description: "Synchronizes knowledge events from ACMI coordinate threads into Upstash Vector database.",
    source: "mac-crontab",
    host: "local-mac",
  },
  {
    id: "mac-cron-design-agency",
    name: "Design Agency Heartbeat",
    schedule: "0 */4 * * *",
    command: "/Users/michaelshaw/Projects/open-design/.od/projects/5bfd6fe6-b2ed-432a-bea3-cc4f4992a2c5/design-agency-cron.sh",
    logPath: "/tmp/design-agency-cron.log",
    scriptPath: "/Users/michaelshaw/Projects/open-design/.od/projects/5bfd6fe6-b2ed-432a-bea3-cc4f4992a2c5/design-agency-cron.sh",
    description: "Triggers heartbeat checks and layout generation sweeps on the Design Agency open-design pipeline.",
    source: "mac-crontab",
    host: "local-mac",
  },
  {
    id: "mac-cron-daily-lead-sync",
    name: "Daily Lead Sync",
    schedule: "0 8 * * 1-5",
    command: "/Users/michaelshaw/clawd/tools/daily-lead-sync.sh",
    logPath: "/tmp/daily-lead-sync.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/daily-lead-sync.sh",
    description: "Daily sync of leads and contacts into HubSpot and internal revops engines.",
    source: "mac-crontab",
    host: "local-mac",
  },
  {
    id: "mac-cron-folana-cns-research",
    name: "Folana CNS Daily Research",
    schedule: "45 11 * * *",
    command: "/usr/local/bin/python3 /Users/michaelshaw/clawd/agents/folana/cns_research_cron.py",
    logPath: "/Users/michaelshaw/clawd/tools/fanvue-agent/cns_research.log",
    scriptPath: "/Users/michaelshaw/clawd/agents/folana/cns_research_cron.py",
    description: "Daily MiniMax research: music culture + fashion + opinion topics. Writes to daily_brief_research.json and acmi:character:folana:v1:trends:digest.",
    source: "per-agent",
    host: "local-mac",
  },
  {
    id: "mac-cron-project-stats-sync",
    name: "Project Stats & Vercel Synchronizer",
    schedule: "*/15 * * * *",
    command: "python3 /Users/michaelshaw/clawd/tools/project-stats-sync.py",
    logPath: "/tmp/project-stats-sync-cron.log",
    scriptPath: "/Users/michaelshaw/clawd/tools/project-stats-sync.py",
    description: "Periodically synchronizes ACMI work items, active Vercel deployments, and repo commit metrics into project profiles.",
    source: "mac-crontab",
    host: "local-mac",
  },

  // ========== LOCAL MAC — launchd plists (fleet/agent services) ==========
  {
    id: "mac-launchd-acmi-bus-relay",
    name: "ACMI Bus Relay (FIXED 2026-06-30)",
    schedule: "StartInterval 300s",
    command: "/opt/homebrew/Cellar/node/26.0.0/bin/node /Users/michaelshaw/clawd/acmi-bus-relay/relay.mjs",
    logPath: "/Users/michaelshaw/clawd/acmi-bus-relay/relay.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.acmi.bus-relay.plist",
    description: "Relay that polls acmi:bus:events and fans out to Mattermost. FIXED 2026-06-30: relay.mjs patched to honour REDIS_URL via getResolvedUrl() function; vm-redis-override.env now uses native Redis at 152.53.201.27:26379. Was: 403 'Upstash error unknown command' because bridge at :8081 is itself an Upstash translator.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-acmi-redis-mcp",
    name: "ACMI Redis MCP",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/openacp-fleet/.openacp/agents/acmi-redis-mcp/index.js",
    logPath: "/tmp/acmi-redis-mcp.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.madez.acmi-redis-mcp.plist",
    description: "acmi-mcp v2.0 server (native Redis, tenant prefixes, 18 tools). The canonical comms layer.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-folana-creative",
    name: "Folana Creative (legacy)",
    schedule: "StartInterval 300s",
    command: "/bin/bash /Users/michaelshaw/clawd/agents/folana-creative.sh",
    logPath: "/Users/michaelshaw/.clawd/logs/folana-creative.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.madezmedia.folana-creative.plist",
    description: "Legacy Folana heartbeat daemon (current is a stub). Migration target: folana-vm on cicd-qpy7t (corrId folana-vm-migration-brainstorm-2026-06-30T13:00Z).",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-design-agency",
    name: "Design Agency Daemon",
    schedule: "KeepAlive",
    command: "/bin/bash /Users/michaelshaw/clawd/agents/design-agency.sh",
    logPath: "/Users/michaelshaw/.clawd/logs/design-agency.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.madezmedia.design-agency.plist",
    description: "Design agency long-running daemon. Complements the 4h cron heartbeat.",
    source: "per-agent",
    host: "local-mac",
  },
  {
    id: "mac-launchd-design-brand-guardian",
    name: "Design Brand Guardian",
    schedule: "KeepAlive",
    command: "/bin/bash /Users/michaelshaw/clawd/agents/design-brand-guardian.sh",
    logPath: "/Users/michaelshaw/.clawd/logs/design-brand-guardian.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.madezmedia.design-brand-guardian.plist",
    description: "Brand safety review agent. Next pipeline stage for biz-pipeline-agency-design after design.",
    source: "per-agent",
    host: "local-mac",
  },
  {
    id: "mac-launchd-design-visual-storyteller",
    name: "Design Visual Storyteller",
    schedule: "KeepAlive",
    command: "/bin/bash /Users/michaelshaw/clawd/agents/design-visual-storyteller.sh",
    logPath: "/Users/michaelshaw/.clawd/logs/design-visual-storyteller.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.madezmedia.design-visual-storyteller.plist",
    description: "Visual storytelling pipeline for design agency outputs.",
    source: "per-agent",
    host: "local-mac",
  },
  {
    id: "mac-launchd-folana-daily-video",
    name: "Folana Daily Video",
    schedule: "KeepAlive",
    command: "/bin/bash /Users/michaelshaw/clawd/folana-video/daily-video.sh",
    logPath: "/Users/michaelshaw/.clawd/logs/folana-daily-video.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.folana.daily-video.plist",
    description: "Daily video generation for folana (MiniMax video pipeline).",
    source: "per-agent",
    host: "local-mac",
  },
  {
    id: "mac-launchd-folana-publisher",
    name: "Folana Publisher",
    schedule: "KeepAlive",
    command: "/bin/bash /Users/michaelshaw/clawd/folana-publisher/publisher.sh",
    logPath: "/Users/michaelshaw/.clawd/logs/folana-publisher.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.folana.publisher.plist",
    description: "Publishes folana content to journal + social channels.",
    source: "per-agent",
    host: "local-mac",
  },
  {
    id: "mac-launchd-folana-social-publisher",
    name: "Folana Social Publisher",
    schedule: "KeepAlive",
    command: "/bin/bash /Users/michaelshaw/clawd/folana-social/social-publisher.sh",
    logPath: "/Users/michaelshaw/.clawd/logs/folana-social-publisher.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.folana.social-publisher.plist",
    description: "Cross-posts folana content to Twitter, LinkedIn, IG, FB, Telegram via Composio MCP.",
    source: "per-agent",
    host: "local-mac",
  },
  {
    id: "mac-launchd-openhuman-acmi",
    name: "OpenHuman ACMI Adapter",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /Users/michaelshaw/clawd/openhuman/acmi-adapter.mjs",
    logPath: "/tmp/openhuman-acmi-output.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.madezmedia.openhuman-acmi.plist",
    description: "Adapter for OpenHuman (digital human) to write to ACMI.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-avery-fleet-sync",
    name: "Avery Fleet Sync",
    schedule: "KeepAlive",
    command: "/bin/bash /opt/app/avery/fleet-sync.sh",
    logPath: "/Users/michaelshaw/.clawd/logs/avery-fleet-sync.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.avery.fleet-sync.plist",
    description: "Avery's fleet state synchronization daemon.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-hermes-gateway",
    name: "Hermes Gateway",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/hermes/gateway.mjs",
    logPath: "/tmp/hermes-gateway.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.hermes.gateway.plist",
    description: "Local Hermes gateway (Mac side). Pairs with the VM-side Hermes instance.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-hermes-kanbansync",
    name: "Hermes Kanban Sync",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/hermes/kanbansync.mjs",
    logPath: "/tmp/hermes-kanbansync.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.hermes.kanbansync.plist",
    description: "Syncs Hermes kanban state with ACMI and the dashboard.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-openclaw-gateway",
    name: "OpenClaw Gateway (Mac side)",
    schedule: "KeepAlive",
    command: "/opt/homebrew/bin/node /opt/homebrew/lib/node_modules/openclaw/dist/index.js gateway --port 18789",
    logPath: "/tmp/openclaw-gateway.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.openclaw.gateway.plist",
    description: "Local OpenClaw gateway. Mac side of the multi-agent gateway (PID 924 in current session).",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-openclaw-node",
    name: "OpenClaw Node",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/openclaw/node.mjs",
    logPath: "/tmp/openclaw-node.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.openclaw.node.plist",
    description: "OpenClaw node process on the Mac.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-openclaw-cowork-sync",
    name: "OpenClaw Cowork Sync",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/openclaw/cowork-sync.mjs",
    logPath: "/tmp/openclaw-cowork-sync.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.openclaw.cowork-sync.plist",
    description: "Syncs OpenClaw cowork sessions with ACMI.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-acmi-backup-snapshot",
    name: "ACMI Backup Snapshot",
    schedule: "KeepAlive",
    command: "/usr/local/bin/python3 /opt/app/acmi/backup-snapshot.py",
    logPath: "/tmp/acmi-backup-snapshot.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.claude.acmi.backup-snapshot.plist",
    description: "Hourly ACMI snapshot to MinIO/S3 for disaster recovery.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-acmi-drift-diff",
    name: "ACMI Drift Diff",
    schedule: "KeepAlive",
    command: "/usr/local/bin/python3 /opt/app/acmi/drift-diff.py",
    logPath: "/tmp/acmi-drift-diff.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.claude.acmi.drift-diff.plist",
    description: "Detects drift between local and canonical ACMI state.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-acmi-drift-remediator",
    name: "ACMI Drift Remediator",
    schedule: "KeepAlive",
    command: "/usr/local/bin/python3 /opt/app/acmi/drift-remediator.py",
    logPath: "/tmp/acmi-drift-remediator.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.claude.acmi.drift-remediator.plist",
    description: "Auto-remediates detected drift (e.g. fleet-signals-key-wrongtype systemic).",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-fleet-monitor-stalled",
    name: "Fleet Monitor Stalled",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/fleet/fleet-monitor-stalled.mjs",
    logPath: "/tmp/fleet-monitor-stalled.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.claude.daily-driver.fleet-monitor-stalled.plist",
    description: "Detects stalled work items in ACMI and emits stalled-alert events.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-inbox-drain-local",
    name: "Inbox Drain Local",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/fleet/inbox-drain-local.mjs",
    logPath: "/tmp/inbox-drain-local.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.claude.daily-driver.inbox-drain-local.plist",
    description: "Drains the local agent inbox from ACMI to actionable tasks.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-memory-digest",
    name: "Memory Digest",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/fleet/memory-digest.mjs",
    logPath: "/tmp/memory-digest.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.claude.daily-driver.memory-digest.plist",
    description: "Daily memory digest: compacts MEMORY.md and daily notes.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-session-rollup-digest",
    name: "Session Rollup Digest",
    schedule: "KeepAlive",
    command: "/usr/local/bin/node /opt/app/fleet/session-rollup-digest.mjs",
    logPath: "/tmp/session-rollup-digest.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.claude.daily-driver.session-rollup-digest.plist",
    description: "Daily digest of all agent rollups for human review.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-comet-updater",
    name: "Perplexity Comet Updater",
    schedule: "KeepAlive",
    command: "/usr/local/bin/perplexity-comet-updater",
    logPath: "/tmp/perplexity-comet-updater.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.perplexity.CometUpdater.wake.plist",
    description: "Comet browser nightly updater wake trigger (Perplexity / Electron app).",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-perplexity-keystone",
    name: "Perplexity Keystone Agent",
    schedule: "KeepAlive",
    command: "/Applications/Comet.app/Contents/Frameworks/Comet Framework.framework/Versions/Current/Helpers/Comet Helper.app/Contents/MacOS/Comet Helper --type=keystone",
    logPath: "/tmp/perplexity-keystone.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/ai.perplexity.keystone.agent.plist",
    description: "Perplexity Comet keystone service.",
    source: "mac-launchd",
    host: "local-mac",
  },
  {
    id: "mac-launchd-google-updater",
    name: "Google Updater",
    schedule: "KeepAlive",
    command: "/Library/Google/GoogleSoftwareUpdate/GoogleSoftwareUpdate.bundle/Contents/Helpers/ksfetch",
    logPath: "/tmp/google-updater.log",
    scriptPath: "/Users/michaelshaw/Library/LaunchAgents/com.google.GoogleUpdater.wake.plist",
    description: "Google Software Update daemon.",
    source: "mac-launchd",
    host: "local-mac",
  },

  // ========== VM cicd-qpy7t — crontab ==========
  // Note: logPath on Mac is empty for VM cron entries (logs live on /var/log on VM, not readable from Mac).
  // Status will be "unknown" until log file mounting is set up via NFS or syncthing.
  {
    id: "vm-cron-borg-backup",
    name: "Borg Backup (Sunday 1am)",
    schedule: "0 1 * * 0",
    command: "/opt/borg/backup.sh && /opt/elestio/watchtower/watchtower-upgrade.sh",
    logPath: "/var/log/borg-backup.log",
    description: "Weekly borg backup + watchtower upgrade on the VM. Elestio default.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-borg-attended-upgrades",
    name: "Borg Backup + Unattended Upgrades (Sunday 5am)",
    schedule: "0 5 * * 0",
    command: "/opt/borg/backup.sh && unattended-upgrades -d",
    logPath: "/var/log/borg-backup.log",
    description: "Weekly borg + unattended-upgrades on the VM. Elestio default.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-borg-daily",
    name: "Borg Backup (Daily 1am)",
    schedule: "0 1 * * *",
    command: "/opt/borg/backup.sh",
    logPath: "/var/log/borg-backup.log",
    description: "Daily borg backup on the VM. Elestio default.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-maintenance-daily",
    name: "VM Maintenance Daily",
    schedule: "59 12 * * *",
    command: "/opt/maintenance-daily.sh",
    logPath: "/var/log/vm-maintenance-daily.log",
    description: "Daily VM maintenance (disk cleanup, logrotate, etc). Elestio default.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-maintenance-weekly",
    name: "VM Maintenance Weekly",
    schedule: "59 13 * * 0",
    command: "/opt/maintenance.sh",
    logPath: "/var/log/vm-maintenance-weekly.log",
    description: "Weekly VM maintenance. Elestio default.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-fleet-rollup-opt",
    name: "Fleet Rollup (alt path)",
    schedule: "0 23 * * *",
    command: "python3 /opt/acmi-bridge/fleet-rollup.py",
    logPath: "/var/log/fleet-rollup.log",
    description: "Fleet rollup via /opt/acmi-bridge path. (Opencode also runs /root/.hermes/skills/fleet/fleet-rollup/scripts/rollup.py — these may be two instances of the same skill.)",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-acmi-sync-v4",
    name: "ACMI Sync v4 (5min)",
    schedule: "*/5 * * * *",
    command: "python3 /opt/acmi-bridge/acmi-sync-v4-bidirectional.py",
    logPath: "/var/log/fleet-sync.log",
    description: "Bidirectional ACMI sync between self-hosted Redis and Upstash. v4 is the latest.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-fleet-sync-skill",
    name: "Fleet Sync (5min, skill path)",
    schedule: "*/5* * * *",
    command: "/usr/bin/python3 /root/.hermes/skills/fleet/fleet-sync/scripts/sync.py",
    logPath: "/var/log/fleet-sync.log",
    description: "Fleet sync via the canonical skill path. May run alongside v4 sync.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-fleet-rollup-skill",
    name: "Fleet Rollup (skill path, daily 23:00)",
    schedule: "0 23 * * *",
    command: "/usr/bin/python3 /root/.hermes/skills/fleet/fleet-rollup/scripts/rollup.py",
    logPath: "/var/log/fleet-rollup.log",
    description: "Daily fleet rollup via canonical skill path. Per-agent rollups land at acmi:madez:agent:<id>:rollup:latest.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-sync-clawd",
    name: "Sync clawd (4h)",
    schedule: "0 */4 * * *",
    command: "/usr/local/bin/sync-clawd.sh",
    logPath: "/var/log/sync-clawd.log",
    description: "4-hourly sync of /opt/app/clawd to Mac (reverse direction of the Mac→VM file transfer).",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-codex-heartbeat",
    name: "Codex Heartbeat (2h)",
    schedule: "0 */2 * * *",
    command: "/usr/local/bin/codex-heartbeat.sh",
    logPath: "/var/log/codex-cron.log",
    description: "Codex coding agent heartbeat on the VM. Posts to #coding-agents via bus-relay.",
    source: "per-agent",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-opencode-heartbeat",
    name: "OpenCode Heartbeat (2.5h)",
    schedule: "30 */2 * * *",
    command: "/usr/local/bin/opencode-heartbeat.sh",
    logPath: "/var/log/opencode-cron.log",
    description: "OpenCode coding agent heartbeat on the VM. Posts to #coding-agents via bus-relay.",
    source: "per-agent",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-cron-sync-hermes-home",
    name: "Sync Hermes Home (4.25h)",
    schedule: "15 */4 * * *",
    command: "/usr/local/bin/sync-hermes-home.sh",
    logPath: "/var/log/sync-hermes-home.log",
    description: "Syncs /root/.hermes/hermes-home on the VM to /Users/michaelshaw/.hermes/hermes-home on the Mac.",
    source: "vm-crontab",
    host: "cicd-qpy7t",
  },

  // ========== VM cicd-qpy7t — systemd timers ==========
  {
    id: "vm-timer-open-design-fleet-live",
    name: "Open Design Fleet Live",
    schedule: "every 5min",
    command: "open-design-fleet-live.service",
    logPath: "/var/log/open-design-fleet-live.log",
    description: "Live polling of open-design fleet state (designer runs, brief intake). Every 5min per systemd timer.",
    source: "vm-systemd",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-timer-project-stats-sync",
    name: "ACMI Project Stats Sync (cron-driven)",
    schedule: "every 15min",
    command: "/usr/bin/python3 /opt/app/folana/project-stats-sync.py",
    logPath: "/var/log/project-stats-sync.log",
    description: "Scans acmi:madez:work:* profiles, groups by prefix, computes per-project rollup (counts/progress/milestones/recent events/Vercel deploys), writes 14 project profiles back to acmi:madez:project:*. Powers /projects, /todo, /calendar, /workflows. Per operator: 'anything with an active Vercel deployment is considered a project that needs tracking — the more recent the better.'",
    source: "vm-systemd",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-timer-fwupd",
    name: "Firmware Update Refresh",
    schedule: "Tue Sat 11:39 UTC",
    command: "fwupd-refresh.service",
    logPath: "/var/log/fwupd-refresh.log",
    description: "Elestio default firmware update checker.",
    source: "vm-systemd",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-timer-dpkg-backup",
    name: "DPKG DB Backup (daily)",
    schedule: "Wed 00:00 UTC",
    command: "dpkg-db-backup.service",
    logPath: "/var/log/dpkg-db-backup.log",
    description: "Daily backup of dpkg package database. Elestio default.",
    source: "vm-systemd",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-timer-logrotate",
    name: "Logrotate (hourly)",
    schedule: "Wed 00:56 UTC",
    command: "logrotate.service",
    logPath: "/var/log/logrotate.log",
    description: "Hourly log rotation. Elestio default.",
    source: "vm-systemd",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-timer-apt-daily",
    name: "APT Daily",
    schedule: "Wed 01:23 UTC",
    command: "apt-daily.service",
    logPath: "/var/log/apt-daily.log",
    description: "Daily apt update check. Elestio default.",
    source: "vm-systemd",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-timer-apt-daily-upgrade",
    name: "APT Daily Upgrade",
    schedule: "Wed 06:34 UTC",
    command: "apt-daily-upgrade.service",
    logPath: "/var/log/apt-daily-upgrade.log",
    description: "Daily apt package upgrades. Elestio default.",
    source: "vm-systemd",
    host: "cicd-qpy7t",
  },
  {
    id: "vm-timer-fstrim",
    name: "Filesystem TRIM (weekly)",
    schedule: "Mon 01:00 UTC",
    command: "fstrim.service",
    logPath: "/var/log/fstrim.log",
    description: "Weekly SSD TRIM. Elestio default.",
    source: "vm-systemd",
    host: "cicd-qpy7t",
  },

  // ========== n8n + fleet-bus webhooks ==========
  // n8n workflow: https://n8n-u70402.vm.elestio.app/ — workflow definitions live in n8n itself; not readable from Mac.
  // The webhooks fire on incoming HTTP POSTs; we register them as "pending trigger" cron entries.
  {
    id: "n8n-webhook-fleet-bus",
    name: "n8n Fleet Bus Webhook",
    schedule: "on-demand (POST trigger)",
    command: "POST https://n8n-u70402.vm.elestio.app/webhook/fleet-bus",
    logPath: "/var/log/n8n/fleet-bus.log",
    description: "n8n workflow that consumes acmi:madez:bus:events and fans to channel-specific handlers. Reachable, returns 404 on GET (POST-only).",
    source: "n8n-webhook",
    host: "n8n",
  },
  {
    id: "n8n-webhook-openacp-notify",
    name: "n8n OpenACP Notify Webhook",
    schedule: "on-demand (POST trigger)",
    command: "POST https://n8n-u70402.vm.elestio.app/webhook/openacp-notify",
    logPath: "/var/log/n8n/openacp-notify.log",
    description: "n8n workflow triggered by OpenACP session state changes. Notifies subscribed agents.",
    source: "n8n-webhook",
    host: "n8n",
  },
  {
    id: "fleet-bus-bidirectional-v4",
    name: "Fleet Bus Bidirectional v4 (5min)",
    schedule: "*/5* * * *",
    command: "/opt/acmi-bridge/acmi-sync-v4-bidirectional.py",
    logPath: "/var/log/fleet-sync.log",
    description: "v4 bidirectional ACMI sync — the canonical comms layer between fleet sources. Replaces the broken acmi-bus-relay (Upstash 403).",
    source: "fleet-bus",
    host: "fleet-bus",
  },

  // ========== Acmi-side scheduled (per skill) ==========
  {
    id: "skill-fleet-rollup-nightly",
    name: "Fleet Rollup (nightly, mechanical)",
    schedule: "0 23 * * *",
    command: "~/.hermes/skills/fleet/fleet-rollup/scripts/rollup.py (mechanical mode)",
    logPath: "/var/log/fleet-rollup.log",
    description: "Mechanical fleet rollup: per-agent event counts, top 3 kinds, top correlation IDs. Per-agent rollups land at acmi:madez:agent:<id>:rollup:latest.",
    source: "fleet-bus",
    host: "local-mac",
  },
  {
    id: "skill-fleet-sync-4h",
    name: "Fleet Sync (4h, bidirectional)",
    schedule: "0 */4 * * *",
    command: "opencode-bus-relay (PID 2857164) + acmi-sync-v4-bidirectional.py",
    logPath: "/var/log/fleet-sync.log",
    description: "4h bidirectional sync of ACMI state between sources. Backs up the 5min live sync with periodic full sweeps.",
    source: "fleet-bus",
    host: "fleet-bus",
  },
];

export async function GET() {
  const result = [];

  for (const cron of CRON_REGISTRY) {
    let status: "success" | "error" | "warning" | "unknown" = "unknown";
    let logs = "";
    let lastExecuted = "";
    let errorDetail = "";
    let scriptExists = false;

    // Check if script file exists (only for local paths; VM/n8n paths return false here)
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
      } else if (cron.host !== "local-mac") {
        // VM / n8n / fleet-bus — log isn't on the local Mac filesystem
        status = "unknown";
        logs = `[Log file at ${cron.logPath} is on ${cron.host} — not accessible from Mac dashboard. Mount via NFS or run dashboard on VM for full log view.]`;
        errorDetail = `Logs live on ${cron.host}; mount required for full read`;
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

    // Extra diagnostic overrides (known issues from this session's audit)
    if (cron.id === "mac-cron-context-compact" && logs.includes("No such file or directory")) {
      errorDetail = "CRITICAL: Node path misconfigured. Crontab uses '/usr/local/bin/node', actual path is '/opt/homebrew/bin/node'";
      status = "error";
    }
    if (cron.id === "mac-cron-hourly-agent-update" && logs.includes("No such file or directory")) {
      errorDetail = "CRITICAL: Script 'hourly-agent-update.sh' is completely missing from '/Users/michaelshaw/clawd/tools/'";
      status = "error";
    }
    if (cron.id === "mac-cron-vector-sync" && logs.includes("No such file or directory")) {
      errorDetail = "CRITICAL: Script 'sync_acmi_vectors.py' missing in /Users/michaelshaw/.hermes/hermes-agent/";
      status = "error";
    }
    if (cron.id === "mac-cron-daily-lead-sync" && (logs.includes("node: command not found") || logs.includes("npx: command not found"))) {
      errorDetail = "CRITICAL: daily-lead-sync.sh assumes node + npx on PATH; cron's PATH doesn't include /opt/homebrew/bin";
      status = "error";
    }
    if (cron.id === "mac-cron-design-agency" && logs.includes("Error: HTTP 401")) {
      errorDetail = "CRITICAL: hermes design pipeline returns 401 (LLM API key invalid/depleted). Also known: 'Unknown toolsets: messaging'";
      status = "error";
    }
    if (cron.id === "mac-launchd-acmi-bus-relay" && logs.includes("403")) {
      errorDetail = "P1: relay.mjs:85 const-captures UPSTASH_* before VM-redis-override env loads; bridge at :8081 is itself an Upstash translator. Bypass: opencode-bus-relay (PID 2857164) on VM.";
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
