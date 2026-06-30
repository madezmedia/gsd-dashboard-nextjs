import fs from 'fs';
import path from 'path';

const CENTRAL_URL = "http://152.53.201.27:8081/exec";
const FLEET_DIR = "/Users/michaelshaw/clawd/fleet";

const CANONICAL_DOCS = [
  'FLEET-ALIGNMENT.md',
  'AGENT-SSO-OPENACP.md',
  'TELEMETRY-LANGFUSE.md',
  'LANGFUSE-ROADMAP.md',
  'STACK-MAXIMIZATION-AUDIT.md',
  'OPENACP-MATTERMOST-PLAN.md',
  'STACK-AUDIT-2026.md',
  'LEAN-STACK-POLICY.md',
  'ACMI-SESSION-ROLLUP.md',
  'onboarding/grok-local-mac.md',
  'onboarding/grok-local-mac-prompt.md',
  'onboarding/LOCAL-AGENT-FLEET-INTEGRATION.md',
  'onboarding/local-agent-master-prompt.md',
  'onboarding/bentley-main-mac-prompt.md',
  'onboarding/claude-code-local-prompt.md',
  'onboarding/claude-acmi-selfhosted-prompt.md',
  'onboarding/grok-elestio-devops-lead.md',
  'onboarding/bentley-alignment.md',
];

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
  console.log("Starting documentation sync to ACMI Redis...");
  for (const doc of CANONICAL_DOCS) {
    const filePath = path.join(FLEET_DIR, doc);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const slug = doc.replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
    const title = doc.replace(/^onboarding\//, '').replace(/\.md$/, '').replace(/-/g, ' ');
    
    // Determine type
    let type = "Spec";
    if (doc.includes("onboarding/")) type = "Guide";
    else if (doc.includes("PLAN")) type = "Plan";
    else if (doc.includes("AUDIT")) type = "Brief";

    const profileKey = `acmi:doc:${slug}:profile`;
    const signalsKey = `acmi:doc:${slug}:signals`;

    const profileData = {
      id: slug,
      actor_type: "system",
      title: title.charAt(0).toUpperCase() + title.slice(1),
      type,
      content,
    };

    console.log(`Syncing doc: ${doc} -> key: ${profileKey} [Type: ${type}]`);
    await executeCommand(["SET", profileKey, JSON.stringify(profileData)]);
    await executeCommand(["SET", signalsKey, JSON.stringify({ lastModified: Date.now() })]);
  }
  console.log("Docs sync complete!");
}

sync().catch(console.error);
