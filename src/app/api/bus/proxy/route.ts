import { NextRequest } from "next/server";

const CENTRAL_URL = process.env.UPSTASH_REDIS_REST_URL || "https://loved-platypus-102968.upstash.io";
const CENTRAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "gQAAAAAAAZI4AAIgcDJhNDFlNmUwMjQ5ZWI0ZDNmYWUzNDU2NDc4ZWUxMmQwOA";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get("since");
  
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
          const res = await fetch(CENTRAL_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${CENTRAL_TOKEN}`,
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
