/* eslint-disable */
import { NextRequest } from "next/server";

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
      if (res[i] !== undefined && res[i + 1] !== undefined) {
        obj[res[i]] = String(res[i + 1]);
      }
    }
    return obj;
  }
  if (typeof res === "object") {
    return res as Record<string, string>;
  }
  return {};
}

async function resolveTenantConfig(token: string | null): Promise<TenantConfig> {
  if (!CENTRAL_URL || !CENTRAL_TOKEN) {
    console.warn("[bus-proxy] Central Upstash Redis configuration variables are missing!");
  }

  if (!token) {
    return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
  }

  // If token is "default_token", map to central config
  if (token === "default_token") {
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
      throw new Error(`Token look up failed with status ${tokenRes.status}`);
    }

    const tokenData = (await tokenRes.json()) as { result?: string };
    const userOrAgentId = tokenData.result;
    if (!userOrAgentId) {
      throw new Error("Invalid token");
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
      throw new Error("User details query failed");
    }

    const userDataRaw = (await userRes.json()) as { result?: unknown };
    const userData = parseHGetAll(userDataRaw.result);
    const tenantId = userData.tenant_id;
    if (!tenantId) {
      throw new Error("Tenant ID not found for user/agent");
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
      throw new Error("Tenant details query failed");
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
  } catch (error: any) {
    console.error(`[bus-proxy] Failed to resolve tenant config for token: ${error.message}`);
    throw error;
  }

  return { url: CENTRAL_URL, token: CENTRAL_TOKEN, isCustom: false };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get("since");
  const tokenParam = searchParams.get("token");
  
  // Resolve tenant config for this request
  let config: TenantConfig;
  try {
    config = await resolveTenantConfig(tokenParam);
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // Parse 'since' parameter, default to 5 minutes ago if not provided
  let lastTs = sinceParam ? parseInt(sinceParam, 10) : Date.now() - 5 * 60 * 1000;
  if (isNaN(lastTs)) {
    lastTs = Date.now() - 5 * 60 * 1000;
  }

  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper function to send SSE formatted event
      const sendEvent = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Stream might be closed
        }
      };

      // Keepalive heartbeat every 15s to keep connection open
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Main poll loop
      let isClosed = false;
      const poll = async () => {
        if (isClosed) return;
        try {
          const res = await fetch(config.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              "ZRANGEBYSCORE",
              "acmi:bus:relay:events",
              `(${lastTs}`,
              "+inf"
            ]),
          });

          if (!res.ok) {
            console.warn(`[bus-proxy] Upstash fetch failed: ${res.status}`);
            return;
          }

          const data = await res.json();
          if (data.error) {
            console.warn(`[bus-proxy] Upstash error: ${data.error}`);
            return;
          }

          const rawEvents = data.result;
          if (Array.isArray(rawEvents) && rawEvents.length > 0) {
            for (const entry of rawEvents) {
              let event: any;
              try {
                event = JSON.parse(entry);
              } catch (e) {
                continue;
              }

              // Update lastTs to the max seen
              if (event.ts && event.ts > lastTs) {
                lastTs = event.ts;
              }

              // Format event for the frontend expectation
              const formattedEvent = {
                id: event.correlationId || event.id || `evt-${event.ts}-${Math.random().toString(36).substring(2, 7)}`,
                ts: event.ts,
                type: event.kind || event.type || "unknown",
                source: event.source,
                payload: {
                  summary: event.summary,
                  title: event.title || event.summary,
                  correlationId: event.correlationId,
                  ...(typeof event.payload === "object" ? event.payload : {}),
                }
              };

              sendEvent(formattedEvent);
            }
          }
        } catch (err) {
          console.warn("[bus-proxy] Poll error:", err);
        }
      };

      // Run initial check
      await poll();

      // Poll interval setup (every 1 second)
      const intervalId = setInterval(poll, 1000);

      // Clean up when connection closes
      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(intervalId);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch (e) {
          // ignore
        }
      });
    }
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
