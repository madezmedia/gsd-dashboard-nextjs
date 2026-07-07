#!/usr/bin/env node
/**
 * Push Fleet Archival Trace to NocoDB Tasks table
 * Agent Todos base: plrjwos5se3uu50
 * Tasks table: mtizkx4ji0accqt
 */

const NOCODB_URL = "https://nocodb-u70402.vm.elestio.app";
const API_KEY = "nc_pat_DdPSCZ7WnU3Ra7TdSxmMXgEvlkpiI5GxJnYwUKad";
const TABLE_ID = "mtizkx4ji0accqt";
const BASE_ID = "plrjwos5se3uu50";

const records = [
  { Title: "FLEET ARCHIVE: NPM_TOKEN for ops-center", Status: "backlog", Priority: "urgent", "Assignee Agent": "agent:mikey", Notes: "Blocked on npm publish. acmi-mcp v2.0.0 already published — may be resolved. Silence: 204.8h", "ACMI Mission ID": "t_84c63bc9", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: Replace Upstash with self-hosted Redis", Status: "backlog", Priority: "medium", "Assignee Agent": "agent:grok", Notes: "SUPERSEDED — grok-local already running on self-hosted v2. Silence: 210.9h", "ACMI Mission ID": "t_d140ea6b", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: Deploy standalone kanban subdomain", Status: "backlog", Priority: "high", "Assignee Agent": "agent:grok", Notes: "Never deployed. GSD dashboard serves kanban at /workflows. Silence: 210.9h", "ACMI Mission ID": "t_a805c594", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: Port Ops-Center-v2 to Cowork/SwarmOS", Status: "backlog", Priority: "high", "Assignee Agent": "mikey/claude-engineer", Notes: "Gated on done-state. 1317h silent. GSD dashboard serves similar function.", "ACMI Mission ID": "ops-center-port-to-cowork-swarmos", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: Smithery specialist agent", Status: "backlog", Priority: "medium", "Assignee Agent": "mikey/claude-engineer", Notes: "Deferred delegation. 1357h silent. Universal ACMI skill covers scope.", "ACMI Mission ID": "smithery-specialist-agent", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: cmdEvent namespace footgun bug", Status: "backlog", Priority: "urgent", "Assignee Agent": "TBD", Notes: "P1 bug RATIFIED but never assigned. cmdEvent silent orphan-write. 1357h silent.", "ACMI Mission ID": "acmi-cli-cmdevent-namespace-footgun", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: UPSTASH rotation execution", Status: "backlog", Priority: "urgent", "Assignee Agent": "bentley-temp", Notes: "Blocked on Mikey Phase 1. 1320h silent. Self-hosted migration via different path.", "ACMI Mission ID": "upstash-rotation-execution-2026-05-13", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: Folana VM Migration", Status: "backlog", Priority: "high", "Assignee Agent": "agent:default", Notes: "99.6h silence — under 200h threshold. Successor work item opened.", "ACMI Mission ID": "folana-vm-migration", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: folana-journal brain-ingest seam", Status: "done", Priority: "high", "Assignee Agent": "folana-journal", Notes: "SHIPPED via PR #2. 6/6 AC met. Operator: apply migration + set BRAIN_INGEST_TOKEN.", "ACMI Mission ID": "folana-journal-brain-ingest-seam", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: Prune Folana moodboard assets", Status: "done", Priority: "high", "Assignee Agent": "agent:ops-center", Notes: "Done 2026-07-07. 4.1MB recovered. Removed duo/duo-v2/ moodboard iterations.", "ACMI Mission ID": "folana-asset-tree-prune", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: ACMI MCP OAuth", Status: "done", Priority: "urgent", "Assignee Agent": "bentley-temp", Notes: "SHIPPED via PR #14. 9/9 smoke tests. CF Workers migration deferred.", "ACMI Mission ID": "acmi-mcp-oauth-cloudflare", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: AI Zenoti competitor platform", Status: "backlog", Priority: "high", "Assignee Agent": "unknown", Notes: "5 phases shipped, 4 draft/dormant. Needs owner.", "ACMI Mission ID": "operator-ai-workforce", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: Register android-worker ACMI profile", Status: "cancelled", Priority: "high", "Assignee Agent": "agent:ops-worker", Notes: "Already archived 2026-07-05. 100% complete.", "ACMI Mission ID": "t_d072fde7", "Task Type": "fleet" },
  { Title: "FLEET ARCHIVE: Deploy Android Hermes install", Status: "cancelled", Priority: "high", "Assignee Agent": "agent:android-worker", Notes: "Already archived 2026-07-05. 100% complete.", "ACMI Mission ID": "t_3a406658", "Task Type": "fleet" }
];

async function main() {
  let success = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const res = await fetch(
        `${NOCODB_URL}/api/v3/data/${BASE_ID}/${TABLE_ID}/records`,
        {
          method: "POST",
          headers: {
            "xc-token": API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify([{ fields: record }])
        }
      );

      if (!res.ok) {
        const text = await res.text();
        const short = text.length > 200 ? text.slice(0, 200) + "..." : text;
        console.error(`FAIL [${record.Title.slice(0, 40).padEnd(40)}] ${res.status}: ${short}`);
        failed++;
      } else {
        const data = await res.json();
        console.log(`OK   [${record.Title.slice(0, 40).padEnd(40)}] inserted`);
        success++;
      }
    } catch (err) {
      console.error(`ERR  [${record.Title.slice(0, 40)}]: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} created, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
