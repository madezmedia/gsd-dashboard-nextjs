import { readFileSync, readdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import dotenv from 'dotenv';

// Load local environment variables from .env.local
dotenv.config({ path: '.env.local' });

const NOCODB_URL = process.env.NOCODB_URL || 'https://nocodb-u70402.vm.elestio.app';
const NOCODB_API_KEY = process.env.NOCODB_API_KEY || 'nc_pat_DdPSCZ7WnU3Ra7TdSxmMXgEvlkpiI5GxJnYwUKad';
const BASE_ID = 'pm9mqdzjuh98a0n';
const DOCS_TABLE = 'm0mqrqpi5imzs2h'; // Documents table

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || 'http://152.53.201.27:8081/exec';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'default_token';

// Helper to make API calls to NocoDB
async function api(method, path, body) {
  const res = await fetch(`${NOCODB_URL}${path}`, {
    method,
    headers: {
      'xc-token': NOCODB_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return data;
}

// Helper to make Redis calls via bridge
async function callRedis(command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${REDIS_TOKEN}`,
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`Redis bridge error: ${res.statusText}`);
  }
  const json = await res.json();
  return json.result;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// Collect local markdown files from workspace root
function collectLocalDocs() {
  const rootDir = process.cwd();
  const files = readdirSync(rootDir);
  const docs = [];
  for (const file of files) {
    if (extname(file) === '.md' && file !== 'CLAUDE.md' && file !== 'AGENTS.md') {
      const filePath = join(rootDir, file);
      docs.push({
        path: file,
        fullPath: filePath,
        title: basename(file, '.md').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      });
    }
  }
  return docs;
}

async function findBySlug(slug) {
  const q = encodeURIComponent(`(Slug,eq,${slug})`);
  const res = await api('GET', `/api/v3/data/${BASE_ID}/${DOCS_TABLE}/records?where=${q}&limit=1`);
  return res?.list?.[0] || null;
}

async function main() {
  console.log("Starting GSD Docs synchronization...");
  const docs = collectLocalDocs();
  console.log(`Found ${docs.length} local GSD documents to sync.`);

  const stats = { created: 0, updated: 0, redisSynced: 0, errors: 0 };

  for (const doc of docs) {
    try {
      const slug = slugify(doc.path);
      const content = readFileSync(doc.fullPath, 'utf8');

      // 1. Sync to NocoDB using NocoDB v3 payload structures
      const row = {
        Title: doc.title,
        Slug: slug,
        Category: 'Plan',
        Status: 'Current',
        Body: content,
        'Source Path': `gsd-dashboard/${doc.path}`,
        'Owner Agent': 'antigravity-cli',
        'Last Verified': new Date().toISOString().slice(0, 10),
      };

      const existing = await findBySlug(slug);
      if (existing?.id) {
        await api('PATCH', `/api/v3/data/${BASE_ID}/${DOCS_TABLE}/records/${existing.id}`, { fields: row });
        stats.updated++;
        console.log(`✓ Updated NocoDB: ${doc.path}`);
      } else {
        await api('POST', `/api/v3/data/${BASE_ID}/${DOCS_TABLE}/records`, { fields: row });
        stats.created++;
        console.log(`+ Created NocoDB: ${doc.path}`);
      }

      // 2. Sync to ACMI Redis (so dashboard frontend displays them)
      const profileKey = `acmi:doc:${slug}:profile`;
      const profile = {
        id: slug,
        title: doc.title,
        type: 'Plan',
        content: content,
        actor_type: 'system',
      };
      await callRedis(['SET', profileKey, JSON.stringify(profile)]);
      await callRedis(['SET', `acmi:signal:doc:${slug}:lastModified`, String(Date.now())]);
      stats.redisSynced++;
      console.log(`✓ Synced Redis key: ${profileKey}`);
    } catch (err) {
      stats.errors++;
      console.error(`✗ Error syncing ${doc.path}:`, err.message);
    }
  }

  console.log("\nSynchronization finished!");
  console.log(JSON.stringify(stats, null, 2));

  // If there are no errors, notify the bus
  if (stats.errors === 0) {
    try {
      const payload = {
        source: "agent:antigravity-cli",
        kind: "sync-note",
        correlationId: `gsdDocsSync-${Date.now()}`,
        summary: `[sync-note @fleet] Synced ${docs.length} GSD markdown documents with NocoDB Base 'Fleet Docs Hub' and ACMI Redis.`
      };
      
      // Emit directly to ACMI bus events
      await callRedis(["LPUSH", "acmi:madez:bus:events", JSON.stringify(payload)]);
      console.log("✓ Event successfully emitted directly to ACMI bus events.");
    } catch (e) {
      console.warn("Could not emit bus event:", e.message);
    }
  }
}

main().catch(err => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
