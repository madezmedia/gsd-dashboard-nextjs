import { createGroq, groq } from "@ai-sdk/groq";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { Client } from "ssh2";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Helper to run Redis commands
async function callRedis(command: any[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL || "http://152.53.201.27:8081/";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "default_token";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`Redis bridge error: ${res.statusText}`);
  }
  const json = await res.json();
  return json.result;
}

// Helper to run remote VM commands using ssh2 library
async function runSSH(cmd: string): Promise<string> {
  console.log("[runSSH] Received command to run on VM:", cmd);
  console.log("[runSSH] process.env.SSH_PRIVATE_KEY present:", !!process.env.SSH_PRIVATE_KEY);
  
  if (!process.env.SSH_PRIVATE_KEY) {
    return "SSH execution failed: SSH_PRIVATE_KEY environment variable is not defined.";
  }

  return new Promise((resolve) => {
    const conn = new Client();
    conn.on("ready", () => {
      console.log("[runSSH] SSH connection established successfully.");
      conn.exec(cmd, (err, stream) => {
        if (err) {
          console.error("[runSSH] conn.exec failed:", err);
          resolve(`SSH execution failed: ${err.message}`);
          conn.end();
          return;
        }
        let stdout = "";
        let stderr = "";
        stream.on("close", (code: number, signal: any) => {
          console.log(`[runSSH] Stream closed with code ${code}.`);
          conn.end();
          resolve(stdout || stderr || `Command completed with exit code ${code}`);
        })
        .on("data", (data: any) => {
          stdout += data.toString();
        })
        .stderr.on("data", (data: any) => {
          stderr += data.toString();
        });
      });
    })
    .on("error", (err) => {
      console.error("[runSSH] SSH connection error:", err);
      resolve(`SSH connection failed: ${err.message}`);
    })
    .connect({
      host: "152.53.201.27",
      port: 22,
      username: "root",
      privateKey: process.env.SSH_PRIVATE_KEY,
      readyTimeout: 10000,
    });
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("[route.ts] POST request received. messages count:", messages?.length);
    console.log("[route.ts] GROQ_API_KEY env key present:", !!process.env.GROQ_API_KEY);

    // Filter out leading assistant messages to ensure request starts with user role for Groq compatibility
    let apiMessages = messages || [];
    while (apiMessages.length > 0 && apiMessages[0].role === "assistant") {
      apiMessages = apiMessages.slice(1);
    }
    console.log("[route.ts] Filtered messages count for API:", apiMessages.length);

    // Normalize messages: convert simple content string messages to modern parts schema
    const normalizedMessages = apiMessages.map((msg: any) => {
      if (!msg.parts && msg.content !== undefined) {
        return {
          ...msg,
          parts: [{ type: "text", text: msg.content }]
        };
      }
      return msg;
    });

    // Extract custom Groq key from headers if present
    const customKey = req.headers.get("x-groq-api-key");
    console.log("[route.ts] Custom key header present:", !!customKey);
    
    const modelProvider = createGroq({
      apiKey: customKey || process.env.GROQ_API_KEY || "",
    });

    console.log("[route.ts] Initializing streamText...");
    const result = streamText({
    model: modelProvider("llama-3.3-70b-versatile"),
    stopWhen: stepCountIs(5), // Enable multi-step tool-calling
    system: `You are the ACMI Fleet Copilot — an advanced, high-agency AI agent system.

ACMI PROTOCOL KNOWLEDGE:
- ACMI stands for Agentic Context Memory Interface.
- It is an open protocol giving AI agents persistent context memory via three entities:
  1. Profile (who): Stable identity, configuration, and role metadata (actor_type: agent/human/system/external).
  2. Signals (now): Mutable key-value maps of current state, flags, and metrics.
  3. Timeline (then): Chronological append-only event log.
- Entities are stored under Redis keys: "acmi:<namespace>:<id>:profile", "acmi:<namespace>:<id>:signals", "acmi:<namespace>:<id>:timeline".
- Canonical namespaces include: "agent" (e.g. agent:bentley, agent:claude-engineer), "user" (e.g. user:madez), "thread" (e.g. thread:agent-coordination), and "work" (e.g. work:task-id).
- The default tenant is "madez".

YOUR WIRE CONNECTIONS:
1. ACMI: Read and write task boards, signals, profiles, and work items directly on the local self-hosted Redis database.
2. VM Channels: Query docker services, logs, memory, and sync status on the remote Elestio VM (152.53.201.27) using SSH command execution.
3. Composio Integrations: Trigger external action APIs (e.g. Google Tasks creation).
4. Super Bus: Emit signals, heartbeats, and events to the live coordination bus ("acmi:thread:agent-coordination:timeline", "acmi:bus:relay:events", channel "acmi:bus:channel").

YOUR VOICE:
- Direct, calm, infrastructure-minded.
- Avoid corporate fluff, exclamation points, and generic filler text.
- Give short, concise, technical answers unless depth is requested.

YOUR CAPABILITIES:
- If a user asks about task status, look up ACMI tasks using the getACMITasks tool.
- If a user asks to add or change a task, write it to Redis or trigger Composio.
- If a user asks about VM health or sync status, query the VM using SSH command tools.`,
    messages: await convertToModelMessages(normalizedMessages),
    onError: ({ error }: { error: any }) => {
      console.error("[route.ts] Stream failed asynchronously:", error);
    },
    tools: {
      getACMITasks: {
        description: "Fetch all ACMI work items / tasks currently registered in the database.",
        inputSchema: z.object({
          limit: z.string().optional().describe("Optional limit of tasks to fetch (numeric string)"),
        }),
        execute: async ({ limit }: { limit?: string }) => {
          try {
            const keys1 = await callRedis(["KEYS", "acmi:work:*:profile"]) || [];
            const keys2 = await callRedis(["KEYS", "acmi:madez:work:*:profile"]) || [];
            const allKeys = Array.from(new Set([...keys1, ...keys2]));
            
            if (allKeys.length === 0) {
              return { success: true, tasks: [] };
            }

            const values = await callRedis(["MGET", ...allKeys]) || [];
            let tasks = [];
            
            for (let i = 0; i < allKeys.length; i++) {
              const raw = values[i];
              if (raw) {
                try {
                  tasks.push(JSON.parse(raw));
                } catch {
                  const key = allKeys[i];
                  const parts = key.split(":");
                  const wid = parts[parts.length - 2];
                  tasks.push({ id: wid, title: wid, status: "unknown" });
                }
              }
            }

            if (limit) {
              const parsedLimit = parseInt(limit, 10);
              if (!isNaN(parsedLimit)) {
                tasks = tasks.slice(0, parsedLimit);
              }
            }

            return { success: true, tasks };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        }
      },

      updateACMITask: {
        description: "Create or update an ACMI work item / task profile in Redis.",
        inputSchema: z.object({
          taskId: z.string().describe("Unique identifier of the task (e.g. 't_12b6e771')"),
          title: z.string().describe("Title of the task"),
          status: z.string().describe("State of the task (e.g. 'todo', 'in_progress', 'done')"),
          assignee: z.string().optional().describe("Who is assigned (e.g. 'user' or 'agent:bentley')"),
          workspace_kind: z.string().optional().describe("Folder/scope workspace kind (e.g. 'scratch')"),
          description: z.string().optional().describe("Optional task details / description"),
          priority: z.string().optional().describe("Optional task priority, e.g. 'P0', 'P1', 'P2'"),
          deliverables: z.string().optional().describe("Optional comma-separated deliverables list"),
        }),
        execute: async ({ taskId, title, status, assignee, workspace_kind, description, priority, deliverables }: any) => {
          try {
            const profileKey = `acmi:work:${taskId}:profile`;
            const profile = {
              id: taskId,
              title,
              status,
              assignee: assignee || "user",
              created_by: "user",
              created_at: new Date().toISOString(),
              workspace_kind: workspace_kind || "scratch",
              description,
              priority,
              deliverables: deliverables ? deliverables.split(",").map((d: string) => d.trim()) : undefined
            };
            await callRedis(["SET", profileKey, JSON.stringify(profile)]);
            return { success: true, taskId, message: "Task profile successfully updated in Redis." };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        }
      },

      emitSignal: {
        description: "Emits a coordination signal or log event to the ACMI Super Bus relay.",
        inputSchema: z.object({
          kind: z.string().describe("Event classification, e.g. 'voice-input', 'task-update'"),
          summary: z.string().optional().describe("Detail of what occurred"),
          correlationId: z.string().describe("Tracking chain identifier, e.g. 'voiceInput-1783...'"),
          source: z.string().optional().describe("Optional event source agent name"),
          signalObject: z.record(z.string(), z.any()).optional().describe("Optional signal payload object / metadata dictionary"),
          signalString: z.string().optional().describe("Optional signal payload raw text string"),
          status: z.string().optional().describe("Optional status descriptor string"),
          description: z.string().optional().describe("Optional detailed description of the event"),
          message: z.string().optional().describe("Optional message content"),
          event: z.string().optional().describe("Optional event tag or content name"),
        }),
        execute: async ({ kind, summary, correlationId, source, message, description, signalObject, signalString, status, event }: any) => {
          try {
            const builtEvent: Record<string, any> = {
              ts: Date.now(),
              source: source || "agent:voice-copilot",
              kind,
              summary: summary || message || description || event || "No summary provided",
              correlationId: correlationId || `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              tenant_id: "madez",
              speaker_type: "system",
            };

            const rawSignal = signalObject || signalString;
            const payloadObj: Record<string, any> = {};
            if (rawSignal !== undefined && rawSignal !== null) {
              if (typeof rawSignal === "string") {
                try {
                  payloadObj.signal = JSON.parse(rawSignal);
                } catch {
                  payloadObj.signal = rawSignal;
                }
              } else {
                payloadObj.signal = rawSignal;
              }
            }
            if (status !== undefined && status !== null) {
              payloadObj.status = status;
            }
            if (description) payloadObj.description = description;
            if (message) payloadObj.message = message;
            if (event) payloadObj.event = event;

            if (Object.keys(payloadObj).length > 0) {
              builtEvent.payload = payloadObj;
            }

            const eventStr = JSON.stringify(builtEvent);
            const timelineKey = "acmi:thread:agent-coordination:timeline";
            const relayEventsKey = "acmi:bus:relay:events";
            const busChannel = "acmi:bus:channel";

            // Write to normal timeline, relay events ZSET, and publish to bus channel
            await callRedis(["ZADD", timelineKey, String(builtEvent.ts), eventStr]);
            await callRedis(["ZADD", relayEventsKey, String(builtEvent.ts), eventStr]);
            await callRedis(["PUBLISH", busChannel, eventStr]);

            return { success: true, message: "Event successfully emitted to Super Bus." };
          } catch (e: any) {
            console.error("[route.ts:emitSignal] Failed to emit event:", e);
            return { success: false, error: e.message };
          }
        }
      },

      runVMCommand: {
        description: "Runs a diagnostic check, status monitor, or system command on the remote VM via SSH.",
        inputSchema: z.object({
          command: z.string().describe("The exact bash command to execute, e.g. 'docker ps', 'free -m', or '/opt/acmi-bridge/sync-vm-kanbans.sh'"),
        }),
        execute: async ({ command }: any) => {
          console.log("[route.ts:runVMCommand] Tool execution started with command:", command);
          try {
            const output = await runSSH(command);
            console.log("[route.ts:runVMCommand] Tool execution finished. output length:", output?.length);
            return { success: true, output };
          } catch (e: any) {
            console.error("[route.ts:runVMCommand] Tool execution failed:", e);
            return { success: false, error: e.message };
          }
        }
      },

      executeComposio: {
        description: "Executes an action using the Composio API Integration (e.g. creating Google Tasks).",
        inputSchema: z.object({
          actionName: z.string().describe("The Composio action name (e.g. 'GOOGLETASKS_CREATE_TASK')"),
          input: z.string().describe("Stringified JSON object with the parameters required for the Composio action"),
        }),
        execute: async ({ actionName, input }: any) => {
          try {
            let parsedInput = {};
            if (typeof input === "string") {
              try {
                parsedInput = JSON.parse(input);
              } catch {
                parsedInput = {};
              }
            } else {
              parsedInput = input || {};
            }
            const composioKey = process.env.COMPOSIO_API_KEY || "ak_xHrrW-9SrFPEC1LPv6eJ";
            const res = await fetch(`https://backend.composio.dev/api/v1/actions/${actionName}/execute`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": composioKey,
              },
              body: JSON.stringify({ entityId: "default", input: parsedInput }),
            });
            if (!res.ok) {
              const text = await res.text();
              return { success: false, error: `Composio returned status ${res.status}: ${text}` };
            }
            const data = await res.json();
            return { success: true, data };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        }
      },
    }
  } as any);

  return result.toUIMessageStreamResponse({
    headers: {
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-cache, no-transform",
    }
  });
  } catch (err: any) {
    console.error("API Chat route error in detail:", err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
