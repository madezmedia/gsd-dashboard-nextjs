#!/usr/bin/env node

/**
 * Bi-directional sync between Hermes SQLite kanban.db and Upstash Redis ACMI work items.
 */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const KANBAN_DB_PATH = "/Users/michaelshaw/.hermes/kanban.db";
const ENV_PATH = "/Users/michaelshaw/Projects/gsd-dashboard-nextjs/.env.local";

// Status Mappings
const SQLITE_TO_REDIS_STATUS = {
  todo: "pending",
  ready: "pending",
  in_progress: "active",
  blocked: "stalled",
  done: "completed",
};

const REDIS_TO_SQLITE_STATUS = {
  pending: "ready",
  active: "in_progress",
  stalled: "blocked",
  completed: "done",
};

// 1. Resolve environment credentials
let REDIS_URL = "http://152.53.201.27:8081/exec";
let REDIS_TOKEN = "default_token";

if (fs.existsSync(ENV_PATH)) {
  const envContent = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of envContent.split("\n")) {
    const matchUrl = line.match(/^UPSTASH_REDIS_REST_URL="?([^"]+)"?/);
    const matchToken = line.match(/^UPSTASH_REDIS_REST_TOKEN="?([^"]+)"?/);
    if (matchUrl) REDIS_URL = matchUrl[1];
    if (matchToken) REDIS_TOKEN = matchToken[1];
  }
}

// 2. Redis Command Helper
async function redisCall(command) {
  try {
    const res = await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) {
      throw new Error(`Upstash returned status ${res.status}`);
    }
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error(`[Redis Error] Command failed: ${JSON.stringify(command)} -`, err.message);
    return null;
  }
}

// 3. Main Sync Routine
async function runSync() {
  console.log(`[${new Date().toISOString()}] Starting Hermes ⇆ ACMI Sync...`);

  if (!fs.existsSync(KANBAN_DB_PATH)) {
    console.error(`Hermes database not found at ${KANBAN_DB_PATH}`);
    return;
  }

  const db = new DatabaseSync(KANBAN_DB_PATH);

  // Fetch all tasks from SQLite
  let sqliteTasks = [];
  try {
    const query = db.prepare("SELECT * FROM tasks");
    sqliteTasks = query.all();
  } catch (err) {
    console.error("Failed to read SQLite tasks:", err.message);
    db.close();
    return;
  }

  // Fetch all work items from Upstash Redis
  const keys = await redisCall(["KEYS", "acmi:work:*:profile"]);
  const redisTasks = {};

  if (Array.isArray(keys) && keys.length > 0) {
    const profileCmds = keys.map(k => ["GET", k]);
    const signalCmds = keys.map(k => ["GET", k.replace(":profile", ":signals")]);

    // Batch query
    const profiles = await Promise.all(profileCmds.map(cmd => redisCall(cmd)));
    const signals = await Promise.all(signalCmds.map(cmd => redisCall(cmd)));

    keys.forEach((key, idx) => {
      const parts = key.split(":");
      const id = parts[2];
      
      let profile = {};
      let signal = {};

      try { profile = JSON.parse(profiles[idx] || "{}"); } catch {}
      try { signal = JSON.parse(signals[idx] || "{}"); } catch {}

      redisTasks[id] = { profile, signals: signal };
    });
  }

  // A. Sync from SQLite to Redis (or update both based on timestamps)
  for (const sqlTask of sqliteTasks) {
    const id = sqlTask.id;
    const redisTask = redisTasks[id];

    // Map priority
    const priority = sqlTask.priority === 0 ? "P2" : sqlTask.priority === 1 ? "P1" : sqlTask.priority === 2 ? "P0" : "P3";
    const mappedStatus = SQLITE_TO_REDIS_STATUS[sqlTask.status] || "pending";
    const sqliteTime = Math.max(
      (sqlTask.completed_at || 0) * 1000,
      (sqlTask.started_at || 0) * 1000,
      (sqlTask.created_at || 0) * 1000
    );

    if (!redisTask) {
      // 1. Create in Redis
      console.log(`[Sync] Creating task "${id}" in Redis (ACMI)...`);
      const profile = {
        id,
        title: sqlTask.title,
        description: sqlTask.body || "",
        owner: sqlTask.assignee ? `agent:${sqlTask.assignee}` : "unassigned",
        priority,
        status: mappedStatus,
        deliverables: [],
      };

      const signals = {
        progress_pct: sqlTask.status === "done" ? 100 : 0,
        last_activity_ts: sqliteTime || Date.now(),
        blockers: [],
      };

      const event = {
        id: `evt-sync-init-${Date.now()}`,
        ts: Date.now(),
        source: "system:sync-daemon",
        kind: "spawn",
        summary: `[sync] Seeded new task "${sqlTask.title}" from Hermes database`,
      };

      await Promise.all([
        redisCall(["SET", `acmi:work:${id}:profile`, JSON.stringify(profile)]),
        redisCall(["SET", `acmi:work:${id}:signals`, JSON.stringify(signals)]),
        redisCall(["ZADD", `acmi:work:${id}:timeline`, String(Date.now()), JSON.stringify(event)]),
        redisCall(["ZADD", "acmi:bus:relay:events", String(Date.now()), JSON.stringify(event)]),
      ]);
    } else {
      // 2. Reconcile existing task
      const redisStatus = redisTask.profile?.status || "pending";
      const redisTime = redisTask.signals?.last_activity_ts || 0;

      if (mappedStatus !== redisStatus) {
        if (sqliteTime > redisTime) {
          // SQLite is newer: Update Redis status
          console.log(`[Sync] Propagating SQLite newer status "${sqlTask.status}" -> Redis "${mappedStatus}" for "${id}"`);
          
          const updatedProfile = { ...redisTask.profile, status: mappedStatus };
          const updatedSignals = { 
            ...redisTask.signals, 
            status: mappedStatus, 
            last_activity_ts: sqliteTime,
            progress_pct: mappedStatus === "completed" ? 100 : redisTask.signals?.progress_pct || 0
          };

          const event = {
            id: `evt-sync-update-${Date.now()}`,
            ts: Date.now(),
            source: "system:sync-daemon",
            kind: "milestone",
            summary: `[sync] Synced status from Hermes local database: ${mappedStatus}`,
          };

          await Promise.all([
            redisCall(["SET", `acmi:work:${id}:profile`, JSON.stringify(updatedProfile)]),
            redisCall(["SET", `acmi:work:${id}:signals`, JSON.stringify(updatedSignals)]),
            redisCall(["ZADD", `acmi:work:${id}:timeline`, String(Date.now()), JSON.stringify(event)]),
            redisCall(["ZADD", "acmi:bus:relay:events", String(Date.now()), JSON.stringify(event)]),
          ]);
        } else {
          // Redis is newer: Update SQLite status
          const nextSqlStatus = REDIS_TO_SQLITE_STATUS[redisStatus] || "ready";
          console.log(`[Sync] Propagating Redis newer status "${redisStatus}" -> SQLite "${nextSqlStatus}" for "${id}"`);

          const tsSec = Math.floor(redisTime / 1000);
          try {
            if (nextSqlStatus === "done") {
              const stmt = db.prepare("UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?");
              stmt.run(nextSqlStatus, tsSec, id);
            } else if (nextSqlStatus === "in_progress") {
              const stmt = db.prepare("UPDATE tasks SET status = ?, started_at = ? WHERE id = ?");
              stmt.run(nextSqlStatus, tsSec, id);
            } else {
              const stmt = db.prepare("UPDATE tasks SET status = ? WHERE id = ?");
              stmt.run(nextSqlStatus, id);
            }
          } catch (err) {
            console.error(`Failed to update SQLite task ${id}:`, err.message);
          }
        }
      }
    }
  }

  // B. Sync from Redis to SQLite (creation of new items made in dashboard)
  for (const id of Object.keys(redisTasks)) {
    const exists = sqliteTasks.some(t => t.id === id);
    if (!exists) {
      console.log(`[Sync] Creating task "${id}" in SQLite (Hermes) from Redis...`);
      const { profile, signals } = redisTasks[id];
      const title = profile?.title || "Untitled Task";
      const body = profile?.description || "";
      const assignee = profile?.owner ? profile.owner.replace("agent:", "") : "default";
      const redisStatus = profile?.status || "pending";
      const sqlStatus = REDIS_TO_SQLITE_STATUS[redisStatus] || "ready";
      const tsSec = Math.floor((signals?.last_activity_ts || Date.now()) / 1000);

      try {
        const stmt = db.prepare(`
          INSERT INTO tasks (id, title, body, assignee, status, priority, created_by, created_at, workspace_kind)
          VALUES (?, ?, ?, ?, ?, 0, 'user', ?, 'scratch')
        `);
        stmt.run(id, title, body, assignee, sqlStatus, tsSec);
      } catch (err) {
        console.error(`Failed to seed new task ${id} into SQLite:`, err.message);
      }
    }
  }

  db.close();
  console.log(`[${new Date().toISOString()}] Sync cycle completed!`);
}

// 4. Run Execution Mode
const isOnce = process.argv.includes("--once");

if (isOnce) {
  runSync().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  runSync();
  setInterval(runSync, 15000); // Poll every 15s
}
