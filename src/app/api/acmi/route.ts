/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";

// Keep in-memory flag for self-healing seed optimization
let isSeeded = false;

const CENTRAL_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const CENTRAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

interface TenantConfig {
  url: string;
  token: string;
  isCustom: boolean;
}

// Global helper to parse HGETALL flat array into a key-value object
function parseHGetAll(res: unknown): Record<string, string> {
  if (!res) return {};
  if (Array.isArray(res)) {
    const obj: Record<string, string> = {};
    for (let i = 0; i < res.length; i += 2) {
      const key = res[i];
      const val = res[i + 1];
      if (typeof key === "string" && val !== undefined) {
        obj[key] = String(val);
      }
    }
    return obj;
  }
  if (typeof res === "object") {
    const record: Record<string, string> = {};
    for (const [key, val] of Object.entries(res as Record<string, unknown>)) {
      if (val !== undefined) {
        record[key] = String(val);
      }
    }
    return record;
  }
  return {};
}

// Global helper to parse individual stringified JSON signals (relaxed read mapping)
function parseSignals(rawSignals: Record<string, string>): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rawSignals)) {
    if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
      try {
        parsed[key] = JSON.parse(val) as Record<string, unknown> | unknown[];
      } catch {
        parsed[key] = val;
      }
    } else {
      parsed[key] = val;
    }
  }
  return parsed;
}

// In-Memory Self-Healing Check
async function ensureSeeded() {
  if (isSeeded) return;

  try {
    const existsRes = await fetch(CENTRAL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CENTRAL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["EXISTS", "saas:tenant:default_tenant"]),
    });

    if (existsRes.ok) {
      const existsData = (await existsRes.json()) as { result?: number };
      if (existsData.result === 1) {
        isSeeded = true;
        return;
      }
    }

    // Key doesn't exist, seed it!
    const timestamp = String(Date.now());
    await Promise.all([
      fetch(CENTRAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CENTRAL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          "HSET",
          "saas:tenant:default_tenant",
          "id",
          "default_tenant",
          "name",
          "Default Workspace",
          "status",
          "active",
          "created_at",
          timestamp,
        ]),
      }),
      fetch(CENTRAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CENTRAL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          "HSET",
          "saas:user_agent:default_user",
          "id",
          "default_user",
          "type",
          "human",
          "role",
          "admin",
          "token",
          "default_token",
          "tenant_id",
          "default_tenant",
        ]),
      }),
      fetch(CENTRAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CENTRAL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", "saas:token:default_token", "default_user"]),
      }),
    ]);

    isSeeded = true;
    console.log("Successfully seeded default SaaS Workspace & user agent");
  } catch (error) {
    console.error("Error seeding default workspace:", error);
  }
}

// Resolve Tenant configuration based on bearer token
async function resolveTenantConfig(req: Request): Promise<TenantConfig> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
  }

  try {
    // 1. Get user_or_agent_id
    const tokenRes = await fetch(CENTRAL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CENTRAL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", `saas:token:${token}`]),
    });

    if (!tokenRes.ok) {
      return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
    }

    const tokenData = (await tokenRes.json()) as { result?: string };
    const userOrAgentId = tokenData.result;
    if (!userOrAgentId) {
      return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
    }

    // 2. Query user_agent details
    const userRes = await fetch(CENTRAL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CENTRAL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["HGETALL", `saas:user_agent:${userOrAgentId}`]),
    });

    if (!userRes.ok) {
      return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
    }

    const userDataRaw = (await userRes.json()) as { result?: unknown };
    const userData = parseHGetAll(userDataRaw.result);
    const tenantId = userData.tenant_id;
    if (!tenantId) {
      return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
    }

    // 3. Query tenant details
    const tenantRes = await fetch(CENTRAL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CENTRAL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["HGETALL", `saas:tenant:${tenantId}`]),
    });

    if (!tenantRes.ok) {
      return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
    }

    const tenantDataRaw = (await tenantRes.json()) as { result?: unknown };
    const tenantData = parseHGetAll(tenantDataRaw.result);

    if (
      tenantData.status === "active" &&
      tenantData.redis_url &&
      tenantData.redis_token
    ) {
      return {
        url: tenantData.redis_url,
        token: tenantData.redis_token,
        isCustom: true,
      };
    }
  } catch (error) {
    console.error("Failed to resolve tenant config, falling back to central:", error);
  }

  return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
}

// Resolve Tenant details based on bearer token for saas_get_status
async function resolveTenantDetails(req: Request): Promise<{ id: string; name: string; routing_key: string }> {
  const authHeader = req.headers.get("Authorization");
  const defaultDetails = {
    id: "default_tenant",
    name: "Default Workspace",
    routing_key: "gsd:acmi:shared"
  };

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return defaultDetails;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return defaultDetails;
  }

  try {
    // 1. Get user_or_agent_id
    const tokenRes = await fetch(CENTRAL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CENTRAL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", `saas:token:${token}`]),
    });

    if (!tokenRes.ok) return defaultDetails;
    const tokenData = (await tokenRes.json()) as { result?: string };
    const userOrAgentId = tokenData.result;
    if (!userOrAgentId) return defaultDetails;

    // 2. Query user_agent details
    const userRes = await fetch(CENTRAL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CENTRAL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["HGETALL", `saas:user_agent:${userOrAgentId}`]),
    });

    if (!userRes.ok) return defaultDetails;
    const userDataRaw = (await userRes.json()) as { result?: unknown };
    const userData = parseHGetAll(userDataRaw.result);
    const tenantId = userData.tenant_id;
    if (!tenantId) return defaultDetails;

    // 3. Query tenant details
    const tenantRes = await fetch(CENTRAL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CENTRAL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["HGETALL", `saas:tenant:${tenantId}`]),
    });

    if (!tenantRes.ok) return defaultDetails;
    const tenantDataRaw = (await tenantRes.json()) as { result?: unknown };
    const tenantData = parseHGetAll(tenantDataRaw.result);

    if (tenantData.status === "active") {
      return {
        id: tenantId,
        name: tenantData.name || "Custom Workspace",
        routing_key: `gsd:acmi:tenant:${tenantId}`
      };
    }
  } catch (error) {
    console.error("Failed to resolve tenant details:", error);
  }

  return defaultDetails;
}

// Executes an Upstash Redis Command, enforcing custom database resiliency rule
async function executeUpstashCommand(
  config: TenantConfig,
  command: unknown[],
  isWrite: boolean
): Promise<{ result?: unknown }> {
  if (config.isCustom) {
    try {
      const res = await fetch(config.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (res.ok) {
        return (await res.json()) as { result?: unknown };
      } else {
        throw new Error(`Custom database responded with status ${res.status}`);
      }
    } catch (error) {
      console.warn(`Custom database connection failed for command: ${JSON.stringify(command)}. Error:`, error);
      if (isWrite) {
        // Strict Write Policy: fail and do not write to central
        throw new Error("Custom database unreachable for write command");
      }
      // Relaxed Read Policy: gracefully fallback to central database
      console.log("Gracefully falling back to central database for read command");
    }
  }

  // Execute on central Upstash instance (shared workspace / fallback)
  const res = await fetch(CENTRAL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CENTRAL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    throw new Error(`Central database responded with status ${res.status}`);
  }

  return (await res.json()) as { result?: unknown };
}

// Helper to determine the namespace
function getNamespace(tool: string, params: Record<string, unknown> | null | undefined): string {
  if (params?.namespace) return String(params.namespace);
  if (tool.includes("_work_") || tool === "acmi_work_list") return "work";
  return "agent";
}

interface ACMIEventPayload {
  id: string;
  ts: string | number;
  source: string;
  kind: string;
  summary: string;
  correlationId?: string;
}

// Helper to fetch signals in a type-aware, resilient way supporting both Hash and String
async function fetchSignalsResilient(config: TenantConfig, key: string): Promise<Record<string, unknown>> {
  try {
    const typeRes = await executeUpstashCommand(config, ["TYPE", key], false);
    const type = typeof typeRes?.result === "string" ? typeRes.result : "none";
    if (type === "hash") {
      const hgetAllRes = await executeUpstashCommand(config, ["HGETALL", key], false);
      const parsed = parseHGetAll(hgetAllRes?.result);
      return parseSignals(parsed);
    } else if (type === "string") {
      const getRes = await executeUpstashCommand(config, ["GET", key], false);
      if (typeof getRes?.result === "string") {
        try {
          return JSON.parse(getRes.result) as Record<string, unknown>;
        } catch {
          return {};
        }
      }
    }
  } catch (err) {
    console.error(`Resilient signals fetch failed for key ${key}:`, err);
  }
  return {};
}

// Helper to write signals in a type-aware way to avoid WRONGTYPE errors
async function writeSignalsResilient(config: TenantConfig, key: string, newSignals: Record<string, unknown>): Promise<void> {
  const typeRes = await executeUpstashCommand(config, ["TYPE", key], false);
  const type = typeof typeRes?.result === "string" ? typeRes.result : "none";

  if (type === "string") {
    // Read string, merge, write string
    let currentSignals: Record<string, unknown> = {};
    const getRes = await executeUpstashCommand(config, ["GET", key], false);
    if (typeof getRes?.result === "string") {
      try {
        currentSignals = JSON.parse(getRes.result) as Record<string, unknown>;
      } catch {}
    }
    const merged = { ...currentSignals, ...newSignals };
    await executeUpstashCommand(config, ["SET", key, JSON.stringify(merged)], true);
  } else {
    // If it's a hash, or none (doesn't exist), write as hash
    const flatPairs: string[] = [];
    for (const [k, v] of Object.entries(newSignals)) {
      if (v !== undefined && v !== null) {
        flatPairs.push(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      }
    }
    if (flatPairs.length > 0) {
      await executeUpstashCommand(config, ["HSET", key, ...flatPairs], true);
    }
  }
}

// Helper to fetch details of a specific entity in a namespace
async function getEntityData(config: TenantConfig, namespace: string, id: string) {
  const profileCmd = ["GET", `acmi:${namespace}:${id}:profile`];
  const timelineCmd = ["ZRANGE", `acmi:${namespace}:${id}:timeline`, "0", "-1", "WITHSCORES"];

  let rawProfile: unknown = null;
  let parsedSignals: Record<string, unknown> = {};
  let rawTimeline: any = null;

  try {
    const res = await executeUpstashCommand(config, profileCmd, false);
    rawProfile = res?.result;
  } catch {}

  try {
    parsedSignals = await fetchSignalsResilient(config, `acmi:${namespace}:${id}:signals`);
  } catch {}

  try {
    const res = await executeUpstashCommand(config, timelineCmd, false);
    rawTimeline = res?.result;
  } catch {}

  // Relaxed Read Policy: Fallback to GET if ZRANGE failed or didn't return an array
  if (!rawTimeline || !Array.isArray(rawTimeline)) {
    try {
      const getRes = await executeUpstashCommand(config, ["GET", `acmi:${namespace}:${id}:timeline`], false);
      const strVal = getRes?.result;
      if (typeof strVal === "string" && strVal.trim().startsWith("[")) {
        const parsed = JSON.parse(strVal);
        if (Array.isArray(parsed)) {
          rawTimeline = [];
          for (const ev of parsed) {
            if (ev && typeof ev === "object") {
              const ts = ev.ts || Date.now();
              rawTimeline.push(JSON.stringify(ev), String(ts));
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[acmi-client] getEntityData GET fallback failed for ${namespace}:${id}:`, e);
    }
  }

  let profileParsed: Record<string, unknown> = {};
  if (rawProfile) {
    try {
      profileParsed = typeof rawProfile === "string" ? JSON.parse(rawProfile) : rawProfile;
    } catch {
      profileParsed = { id, name: id, role: "agent", status: "active", capabilities: [] };
    }
  } else {
    profileParsed = { id, name: id, role: "agent", status: "active", capabilities: [] };
  }

  const events: ACMIEventPayload[] = [];
  if (Array.isArray(rawTimeline)) {
    for (let i = 0; i < rawTimeline.length; i += 2) {
      const payloadStr = rawTimeline[i];
      const score = rawTimeline[i + 1];
      if (payloadStr === undefined) continue;

      const scoreStr = typeof score === "string" || typeof score === "number" ? String(score) : "";
      let eventObj: ACMIEventPayload;
      try {
        eventObj = JSON.parse(String(payloadStr)) as ACMIEventPayload;
      } catch {
        eventObj = {
          id: "evt-fallback-" + Math.random().toString(36).substring(2, 11),
          ts: new Date(Number(scoreStr || Date.now())).toISOString(),
          source: "system",
          kind: "legacy-event",
          summary: String(payloadStr),
        };
      }
      events.push(eventObj);
    }
  }

  events.sort((a, b) => {
    const timeA = a.ts ? new Date(a.ts).getTime() : 0;
    const timeB = b.ts ? new Date(b.ts).getTime() : 0;
    return timeB - timeA;
  });

  return {
    id,
    profile: profileParsed,
    signals: parsedSignals,
    timeline: events,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Phase 1: Self-Healing Seed check
    await ensureSeeded();

    // Parse request body
    const body = (await req.json()) as { tool?: string; params?: Record<string, unknown> };
    const { tool, params } = body || {};

    if (!tool) {
      return NextResponse.json({ error: "Missing required field 'tool'" }, { status: 400 });
    }

    // Phase 2: Custom SaaS Registration Tool Handling
    if (tool === "saas_register_tenant") {
      const { id, name, redis_url, redis_token } = params || {};
      if (!id) {
        return NextResponse.json({ error: "Missing required parameter 'id' for registration" }, { status: 400 });
      }

      const idStr = String(id);
      const nameStr = name ? String(name) : `Workspace ${idStr}`;
      const urlStr = redis_url ? String(redis_url) : "";
      const tokenStr = redis_token ? String(redis_token) : "";

      const timestamp = String(Date.now());
      const tenantKey = `saas:tenant:${idStr}`;
      const userKey = `saas:user_agent:${idStr}_user`;
      const tokenKey = `saas:token:${idStr}_token`;

      // Always write registration details directly to the central control plane Upstash instance
      const tenantRes = await fetch(CENTRAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CENTRAL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          "HSET",
          tenantKey,
          "id", idStr,
          "name", nameStr,
          "status", "active",
          "redis_url", urlStr,
          "redis_token", tokenStr,
          "created_at", timestamp,
        ]),
      });

      if (!tenantRes.ok) {
        throw new Error(`Failed to write tenant registry: ${tenantRes.status}`);
      }

      const userRes = await fetch(CENTRAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CENTRAL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          "HSET",
          userKey,
          "id", `${idStr}_user`,
          "type", "human",
          "role", "admin",
          "token", `${idStr}_token`,
          "tenant_id", idStr,
        ]),
      });

      if (!userRes.ok) {
        throw new Error(`Failed to write user registry: ${userRes.status}`);
      }

      const tokenRes = await fetch(CENTRAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CENTRAL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", tokenKey, `${idStr}_user`]),
      });

      if (!tokenRes.ok) {
        throw new Error(`Failed to write token map: ${tokenRes.status}`);
      }

      return NextResponse.json({
        success: true,
        token: `${idStr}_token`,
        tenant_id: idStr,
      });
    }

    // Phase 3: SaaS Multi-Tenant Configuration Resolution
    const config = await resolveTenantConfig(req);

    // Common Parameter Extraction
    const namespace = getNamespace(tool, params);
    const id = params?.id ? String(params.id) : undefined;

    // Validate ID requirement for entity-specific tools
    if (
      !id &&
      tool !== "acmi_list" &&
      tool !== "acmi_work_list" &&
      tool !== "acmi_dashboard_bootstrap" &&
      tool !== "dashboardBootstrap" &&
      tool !== "saas_get_status" &&
      tool !== "acmi_service_list" &&
      tool !== "acmi_hitl_list" &&
      tool !== "fleet_sync_trigger" &&
      tool !== "acmi_rollup_get"
    ) {
      return NextResponse.json({ error: "Missing required parameter 'id'" }, { status: 400 });
    }

    // Phase 4: ACMI Tool Command Translation
    switch (tool) {
      case "acmi_list":
      case "acmi_work_list": {
        const keysCmd = ["KEYS", `acmi:${namespace}:*:profile`];
        const keysRes = await executeUpstashCommand(config, keysCmd, false);
        const keysList = Array.isArray(keysRes?.result) ? (keysRes.result as string[]) : [];

        const prefix = `acmi:${namespace}:`;
        const suffix = `:profile`;
        const extractedIds = keysList
          .map((k: string) => {
            if (k.startsWith(prefix) && k.endsWith(suffix)) {
              return k.substring(prefix.length, k.length - suffix.length);
            }
            return null;
          })
          .filter((val): val is string => val !== null);

        return NextResponse.json({ result: extractedIds });
      }

      case "acmi_get":
      case "acmi_work_get": {
        const profileCmd = ["GET", `acmi:${namespace}:${id}:profile`];
        const timelineCmd = ["ZRANGE", `acmi:${namespace}:${id}:timeline`, "0", "-1", "WITHSCORES"];

        let rawProfile: unknown = null;
        let parsedSignals: Record<string, unknown> = {};
        let rawTimeline: any = null;

        // Fetch each piece individually with robust error handling for maximum flexibility (relaxed read)
        try {
          const res = await executeUpstashCommand(config, profileCmd, false);
          rawProfile = res?.result;
        } catch {
          console.error(`Failed to fetch profile for ${id}`);
        }

        try {
          parsedSignals = await fetchSignalsResilient(config, `acmi:${namespace}:${id}:signals`);
        } catch {
          console.error(`Failed to fetch signals for ${id}`);
        }

        try {
          const res = await executeUpstashCommand(config, timelineCmd, false);
          rawTimeline = res?.result;
        } catch {
          console.error(`Failed to fetch timeline for ${id}`);
        }

        // Relaxed Read Policy: Fallback to GET if ZRANGE failed or didn't return an array
        if (!rawTimeline || !Array.isArray(rawTimeline)) {
          try {
            const getRes = await executeUpstashCommand(config, ["GET", `acmi:${namespace}:${id}:timeline`], false);
            const strVal = getRes?.result;
            if (typeof strVal === "string" && strVal.trim().startsWith("[")) {
              const parsed = JSON.parse(strVal);
              if (Array.isArray(parsed)) {
                rawTimeline = [];
                for (const ev of parsed) {
                  if (ev && typeof ev === "object") {
                    const ts = ev.ts || Date.now();
                    rawTimeline.push(JSON.stringify(ev), String(ts));
                  }
                }
              }
            }
          } catch (e) {
            console.warn(`[acmi-client] acmi_get GET fallback failed for ${namespace}:${id}:`, e);
          }
        }

        // Profile Parser (Try parsing stringified JSON; construct default if missing/failed)
        let profileParsed: Record<string, unknown> = {};
        if (rawProfile) {
          try {
            profileParsed = typeof rawProfile === "string" ? (JSON.parse(rawProfile) as Record<string, unknown>) : (rawProfile as Record<string, unknown>);
          } catch {
            profileParsed = { id, name: id, role: "agent", status: "active", capabilities: [] };
          }
        } else {
          profileParsed = { id, name: id, role: "agent", status: "active", capabilities: [] };
        }



        // Timeline WITHSCORES Parser (Try parsing; apply fallback event format if fails)
        const events: ACMIEventPayload[] = [];
        if (Array.isArray(rawTimeline)) {
          for (let i = 0; i < rawTimeline.length; i += 2) {
            const payloadStr = rawTimeline[i];
            const score = rawTimeline[i + 1];
            if (payloadStr === undefined) continue;

            const scoreStr = typeof score === "string" || typeof score === "number" ? String(score) : "";
            let eventObj: ACMIEventPayload;
            try {
              eventObj = JSON.parse(String(payloadStr)) as ACMIEventPayload;
            } catch {
              // Fallback parser as instructed by orchestrator
              eventObj = {
                id: "evt-fallback-" + Math.random().toString(36).substring(2, 11),
                ts: new Date(Number(scoreStr || Date.now())).toISOString(),
                source: "system",
                kind: "legacy-event",
                summary: String(payloadStr),
              };
            }
            events.push(eventObj);
          }
        }

        // Sort descending chronologically (most recent first)
        events.sort((a, b) => {
          const timeA = a.ts ? new Date(a.ts).getTime() : 0;
          const timeB = b.ts ? new Date(b.ts).getTime() : 0;
          return timeB - timeA;
        });

        // Maintain dual structure to ensure 100% backward compatibility
        const output = {
          profile: profileParsed,
          signals: parsedSignals,
          timeline: events,
          timeline_recent: events.slice(0, 50),
          result: {
            profile: profileParsed,
            signals: parsedSignals,
            timeline: events,
            timeline_recent: events.slice(0, 50),
          },
        };

        return NextResponse.json(output);
      }

      case "acmi_profile": {
        const rawProfile = params?.profile;
        const profileStr = typeof rawProfile === "object" ? JSON.stringify(rawProfile) : String(rawProfile || "");
        const profileCmd = ["SET", `acmi:${namespace}:${id}:profile`, profileStr];

        await executeUpstashCommand(config, profileCmd, true);
        return NextResponse.json({ result: "OK", success: true });
      }

      case "acmi_signal":
      case "acmi_work_signal": {
        let signalsObj: Record<string, unknown> = {};
        const incomingSignals = params?.signals;

        if (typeof incomingSignals === "string") {
          try {
            signalsObj = JSON.parse(incomingSignals) as Record<string, unknown>;
          } catch {
            signalsObj = {};
          }
        } else if (incomingSignals && typeof incomingSignals === "object") {
          signalsObj = incomingSignals as Record<string, unknown>;
        }

        if (Object.keys(signalsObj).length === 0) {
          return NextResponse.json({ result: "OK", success: true });
        }

        await writeSignalsResilient(config, `acmi:${namespace}:${id}:signals`, signalsObj);
        return NextResponse.json({ result: "OK", success: true });
      }

      case "acmi_event":
      case "acmi_work_event": {
        const ts = Number(params?.ts || Date.now());
        const payload = {
          id: params?.id ? String(params.id) : `evt-${Math.random().toString(36).substring(2, 11)}`,
          ts: ts,
          source: params?.source ? String(params.source) : "system",
          kind: params?.kind ? String(params.kind) : "info",
          summary: params?.summary ? String(params.summary) : "",
          correlationId: params?.correlationId ? String(params.correlationId) : "",
        };

        const payloadStr = JSON.stringify(payload);
        const scoreStr = String(ts);
        const zaddCmd = ["ZADD", `acmi:${namespace}:${id}:timeline`, scoreStr, payloadStr];
        const zaddBusCmd = ["ZADD", "acmi:bus:relay:events", scoreStr, payloadStr];

        await Promise.all([
          executeUpstashCommand(config, zaddCmd, true),
          executeUpstashCommand(config, zaddBusCmd, true),
        ]);
        return NextResponse.json({ result: "OK", success: true });
      }

      case "acmi_work_create": {
        const title = params?.title ? String(params.title) : "Untitled Work Item";
        const description = params?.description ? String(params.description) : "";
        const owner = params?.owner ? String(params.owner) : "unassigned";
        const priority = params?.priority ? String(params.priority) : "P2";
        const status = params?.status ? String(params.status) : "pending";
        const deliverables = Array.isArray(params?.deliverables) ? params.deliverables.map(String) : [];

        const profileData = {
          id,
          title,
          description,
          owner,
          priority,
          status,
          deliverables,
        };

        const signalsData = {
          progress_pct: 0,
          last_activity_ts: Date.now(),
          blockers: [],
        };

        const initialEvent = {
          id: `evt-creation-${Date.now()}`,
          ts: Date.now(),
          source: owner !== "unassigned" ? owner : "system",
          kind: "spawn",
          summary: `[work-created] Seeded new project: ${title}`,
          correlationId: `cid-creation-${id}`,
        };

        await Promise.all([
          executeUpstashCommand(config, ["SET", `acmi:work:${id}:profile`, JSON.stringify(profileData)], true),
          executeUpstashCommand(config, ["SET", `acmi:work:${id}:signals`, JSON.stringify(signalsData)], true),
          executeUpstashCommand(config, ["ZADD", `acmi:work:${id}:timeline`, String(Date.now()), JSON.stringify(initialEvent)], true),
          executeUpstashCommand(config, ["ZADD", "acmi:bus:relay:events", String(Date.now()), JSON.stringify(initialEvent)], true)
        ]);

        return NextResponse.json({ result: "OK", success: true });
      }

      case "dashboardBootstrap":
      case "acmi_dashboard_bootstrap": {
        // Fetch keys for all namespaces
        const [agentKeysRes, workKeysRes, taskKeysRes, noteKeysRes, eventKeysRes, docKeysRes] = await Promise.all([
          executeUpstashCommand(config, ["KEYS", "acmi:agent:*:profile"], false).catch(() => ({ result: [] })),
          executeUpstashCommand(config, ["KEYS", "acmi:work:*:profile"], false).catch(() => ({ result: [] })),
          executeUpstashCommand(config, ["KEYS", "acmi:task:*:profile"], false).catch(() => ({ result: [] })),
          executeUpstashCommand(config, ["KEYS", "acmi:note:*:profile"], false).catch(() => ({ result: [] })),
          executeUpstashCommand(config, ["KEYS", "acmi:event:*:profile"], false).catch(() => ({ result: [] })),
          executeUpstashCommand(config, ["KEYS", "acmi:doc:*:profile"], false).catch(() => ({ result: [] })),
        ]);

        const extractIds = (keysList: unknown, prefix: string): string[] => {
          const list = Array.isArray(keysList) ? (keysList as string[]) : [];
          return list
            .map(k => typeof k === "string" && k.startsWith(prefix) && k.endsWith(":profile") ? k.substring(prefix.length, k.length - 8) : null)
            .filter((val): val is string => val !== null);
        };

        const agentIds = extractIds(agentKeysRes?.result, "acmi:agent:");
        const workIds = extractIds(workKeysRes?.result, "acmi:work:");
        const taskIds = extractIds(taskKeysRes?.result, "acmi:task:");
        const noteIds = extractIds(noteKeysRes?.result, "acmi:note:");
        const eventIds = extractIds(eventKeysRes?.result, "acmi:event:");
        const docIds = extractIds(docKeysRes?.result, "acmi:doc:");

        // Detailed parallel fetching limited to safe batch sizes
        const agents = await Promise.all(agentIds.slice(0, 10).map(id => getEntityData(config, "agent", id).catch(() => null))).then(r => r.filter(Boolean));
        const workItems = await Promise.all(workIds.slice(0, 15).map(id => getEntityData(config, "work", id).catch(() => null))).then(r => r.filter(Boolean));
        const tasks = await Promise.all(taskIds.slice(0, 20).map(id => getEntityData(config, "task", id).catch(() => null))).then(r => r.filter(Boolean));
        const notes = await Promise.all(noteIds.slice(0, 20).map(id => getEntityData(config, "note", id).catch(() => null))).then(r => r.filter(Boolean));
        const events = await Promise.all(eventIds.slice(0, 50).map(id => getEntityData(config, "event", id).catch(() => null))).then(r => r.filter(Boolean));
        const docs = await Promise.all(docIds.slice(0, 20).map(id => getEntityData(config, "doc", id).catch(() => null))).then(r => r.filter(Boolean));

        // Config fetch
        let dashboardConfig = {};
        try {
          const cfgRes = await executeUpstashCommand(config, ["GET", "acmi:config:dashboard:profile"], false);
          if (cfgRes?.result) {
            dashboardConfig = JSON.parse(String(cfgRes.result));
          }
        } catch {}

        // Timeline fetch (agent coordination central stream)
        let timeline: ACMIEventPayload[] = [];
        try {
          const timelineCmd = ["ZRANGE", "acmi:thread:agent-coordination:timeline", "0", "-1", "WITHSCORES"];
          const tlRes = await executeUpstashCommand(config, timelineCmd, false);
          let rawTimeline: any = tlRes?.result;

          // Relaxed Read Policy: Fallback to GET if ZRANGE failed or didn't return an array
          if (!rawTimeline || !Array.isArray(rawTimeline)) {
            try {
              const getRes = await executeUpstashCommand(config, ["GET", "acmi:thread:agent-coordination:timeline"], false);
              const strVal = getRes?.result;
              if (typeof strVal === "string" && strVal.trim().startsWith("[")) {
                const parsed = JSON.parse(strVal);
                if (Array.isArray(parsed)) {
                  rawTimeline = [];
                  for (const ev of parsed) {
                    if (ev && typeof ev === "object") {
                      const ts = ev.ts || Date.now();
                      rawTimeline.push(JSON.stringify(ev), String(ts));
                    }
                  }
                }
              }
            } catch (e) {
              console.warn("[bus-proxy] bootstrap timeline GET fallback failed:", e);
            }
          }

          if (Array.isArray(rawTimeline)) {
            for (let i = 0; i < rawTimeline.length; i += 2) {
              const payloadStr = rawTimeline[i];
              const score = rawTimeline[i + 1];
              if (payloadStr === undefined) continue;

              const scoreStr = typeof score === "string" || typeof score === "number" ? String(score) : "";
              let eventObj: ACMIEventPayload;
              try {
                eventObj = JSON.parse(String(payloadStr)) as ACMIEventPayload;
              } catch {
                eventObj = {
                  id: "evt-fallback-" + Math.random().toString(36).substring(2, 11),
                  ts: new Date(Number(scoreStr || Date.now())).toISOString(),
                  source: "system",
                  kind: "legacy-event",
                  summary: String(payloadStr),
                };
              }
              timeline.push(eventObj);
            }
          }
          timeline.sort((a, b) => {
            const timeA = a.ts ? new Date(a.ts).getTime() : 0;
            const timeB = b.ts ? new Date(b.ts).getTime() : 0;
            return timeB - timeA;
          });
        } catch {}

        return NextResponse.json({
          agents,
          workItems,
          config: dashboardConfig,
          timeline: timeline.slice(0, 50),
          events,
          docs,
          notes,
          tasks,
          result: {
            agents,
            workItems,
            config: dashboardConfig,
            timeline: timeline.slice(0, 50),
            events,
            docs,
            notes,
            tasks,
          }
        });
      }

      case "acmi_hitl_list": {
        const hitlZsetKey = `acmi:user:mikey:hitl-queue`;
        const zrangeRes = await executeUpstashCommand(config, ["ZRANGE", hitlZsetKey, "0", "-1", "WITHSCORES"], false).catch(() => ({ result: [] }));
        const rawList = Array.isArray(zrangeRes?.result) ? zrangeRes.result : [];
        
        const list: Record<string, unknown>[] = [];
        for (let i = 0; i < rawList.length; i += 2) {
          const memberStr = rawList[i];
          const score = rawList[i + 1];
          if (memberStr === undefined) continue;

          let parsedMember: Record<string, unknown> = {};
          try {
            parsedMember = JSON.parse(String(memberStr));
          } catch {
            parsedMember = { summary: String(memberStr) };
          }
          list.push({
            member: memberStr,
            ts: Number(score || Date.now()),
            ...parsedMember
          });
        }
        // Sort descending (newest first)
        list.sort((a, b) => Number(b.ts) - Number(a.ts));
        return NextResponse.json({ result: list });
      }

      case "acmi_hitl_action": {
        const member = params?.member ? String(params.member) : "";
        const action = params?.action ? String(params.action) : "";
        const note = params?.note ? String(params.note) : "";
        const id = params?.id ? String(params.id) : undefined;
        if (!member) {
          return NextResponse.json({ error: "Missing required parameter 'member'" }, { status: 400 });
        }
        
        const hitlZsetKey = `acmi:user:mikey:hitl-queue`;
        
        // 1. Remove from HITL ZSET
        await executeUpstashCommand(config, ["ZREM", hitlZsetKey, String(member)], true);
        
        // 2. Post resolved event to user timeline
        const scoreStr = String(Date.now());
        const resolvedPayload = {
          id: `hitl-resolved-${Date.now()}`,
          ts: Date.now(),
          source: "user:mikey",
          kind: "hitl-resolved",
          summary: `[hitl-resolved] Intervened on ticket: "${action.toUpperCase()}". Note: ${note || "None"}`,
          payload: { action, note, memberParsed: JSON.parse(String(member)) }
        };
        await executeUpstashCommand(config, ["ZADD", `acmi:user:mikey:timeline`, scoreStr, JSON.stringify(resolvedPayload)], true);

        // 3. Post to coordination timeline
        await executeUpstashCommand(config, ["ZADD", `acmi:thread:agent-coordination:timeline`, scoreStr, JSON.stringify({
          ...resolvedPayload,
          summary: `[hitl-resolution] Human Mikey resolved ticket: ${action.toUpperCase()}. Note: ${note || "None"}`
        })], true);

        // 4. Optionally update work item status if id is provided
        if (id) {
          const nextStatus = action === "approve" ? "active" : "pending";
          await writeSignalsResilient(config, `acmi:work:${id}:signals`, { status: nextStatus });
          await executeUpstashCommand(config, ["ZADD", `acmi:work:${id}:timeline`, scoreStr, JSON.stringify({
            id: `hitl-work-update-${Date.now()}`,
            ts: Date.now(),
            source: "user:mikey",
            kind: "hitl-resolution",
            summary: `[hitl-resolution] Work item status updated to ${nextStatus}`
          })], true);
        }

        return NextResponse.json({ result: "OK", success: true });
      }

      case "acmi_rollup_get": {
        const key = params?.key ? String(params.key) : "acmi:madez:agent:ops-center:rollup:latest";
        const res = await executeUpstashCommand(config, ["GET", key], false);
        let parsed = null;
        if (res?.result) {
          try {
            parsed = JSON.parse(String(res.result));
          } catch {
            parsed = res.result;
          }
        }
        return NextResponse.json({ result: parsed, success: true });
      }

      case "fleet_sync_trigger": {
        await executeUpstashCommand(config, ["PUBLISH", "fleet:sync", "trigger"], false);
        return NextResponse.json({ result: "OK", success: true });
      }

      case "acmi_service_list": {
        const keysCmd = ["KEYS", `acmi:registry:service:*`];
        const keysRes = await executeUpstashCommand(config, keysCmd, false).catch(() => ({ result: [] }));
        const keysList = Array.isArray(keysRes?.result) ? (keysRes.result as string[]) : [];

        const tenantKeysCmd = ["KEYS", `acmi:${namespace}:registry:service:*`];
        const tenantKeysRes = await executeUpstashCommand(config, tenantKeysCmd, false).catch(() => ({ result: [] }));
        const tenantKeysList = Array.isArray(tenantKeysRes?.result) ? (tenantKeysRes.result as string[]) : [];

        const allKeys = Array.from(new Set([...keysList, ...tenantKeysList]));
        const services: Record<string, unknown>[] = [];

        if (allKeys.length > 0) {
          const results = await Promise.allSettled(
            allKeys.map(key => executeUpstashCommand(config, ["GET", key], false))
          );
          
          for (let i = 0; i < allKeys.length; i++) {
            const key = allKeys[i];
            const res = results[i];
            if (res.status !== "fulfilled" || !res.value) continue;

            const rawVal = (res.value as Record<string, unknown>)?.result;
            if (!rawVal) continue;

            const name = key.replace(/acmi:(?:[a-zA-Z0-9_-]+:)?registry:service:/, "");
            let parsedVal: Record<string, unknown> = {};
            try {
              parsedVal = JSON.parse(String(rawVal));
            } catch {
              parsedVal = { description: String(rawVal) };
            }

            services.push({
              key,
              name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " "),
              slug: name,
              ...parsedVal,
            });
          }
        }

        return NextResponse.json({ result: services });
      }

      case "saas_get_status": {
        const details = await resolveTenantDetails(req);
        return NextResponse.json({
          ok: true,
          result: details
        });
      }

      default: {
        return NextResponse.json({ error: `Unsupported ACMI tool: ${tool}` }, { status: 400 });
      }
    }
  } catch (err: unknown) {
    console.error("ACMI connection router error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const isConnectionError = errMsg.includes("unreachable") || errMsg.includes("connection");
    const status = isConnectionError ? 503 : 500;
    return NextResponse.json(
      { error: "ACMI Connection routing failed", details: errMsg },
      { status }
    );
  }
}
