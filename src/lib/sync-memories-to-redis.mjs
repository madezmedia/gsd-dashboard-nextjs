import fs from 'fs';
import path from 'path';

const CENTRAL_URL = "http://152.53.201.27:8081/exec";
const CLAWD_DIR = "/Users/michaelshaw/clawd";

async function executeCommand(command) {
  const res = await fetch(CENTRAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`Redis HTTP failed: ${res.statusText}`);
  }
  return res.json();
}

async function sync() {
  console.log("Starting Claude memory sync to ACMI Redis...");
  
  // Files to sync
  const files = [
    { relativePath: "memory/2026-07-16-AUDIT-ROLLUP.md", slug: "memory-2026-07-16-audit-rollup", title: "ACMI Fleet Governance Rollup 2026-07-16" },
    { relativePath: "memory/2026-07-16.md", slug: "memory-2026-07-16", title: "Claude Memory 2026-07-16" },
    { relativePath: "memory/2026-07-15.md", slug: "memory-2026-07-15", title: "Claude Memory 2026-07-15" },
    { relativePath: "memory/2026-07-14.md", slug: "memory-2026-07-14", title: "Claude Memory 2026-07-14" },
    { relativePath: "MEMORY.md", slug: "memory-root", title: "Mad EZ Master Memory" }
  ];

  for (const f of files) {
    const filePath = path.join(CLAWD_DIR, f.relativePath);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const profileKey = `acmi:madez:doc:${f.slug}:profile`;
    const signalsKey = `acmi:madez:doc:${f.slug}:signals`;

    const profileData = {
      id: f.slug,
      actor_type: "system",
      title: f.title,
      type: "Memory",
      content,
    };

    console.log(`Syncing memory: ${f.relativePath} -> key: ${profileKey}`);
    await executeCommand(["SET", profileKey, JSON.stringify(profileData)]);
    await executeCommand(["SET", signalsKey, JSON.stringify({ lastModified: Date.now() })]);
    
    // Also push a sync event to the timeline of this memory doc
    const event = {
      ts: Date.now(),
      source: "local-sync",
      kind: "sync",
      summary: `Synced memory document ${f.relativePath} to ACMI Redis`
    };
    await executeCommand(["ZADD", `acmi:madez:doc:${f.slug}:timeline`, String(Date.now()), JSON.stringify(event)]);
  }
  
  console.log("Memory sync complete!");
}

sync().catch(console.error);
