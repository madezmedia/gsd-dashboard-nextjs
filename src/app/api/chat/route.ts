import { createGroq, groq } from "@ai-sdk/groq";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const maxDuration = 60;

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

// Helper to run remote VM commands
async function runSSH(cmd: string) {
  try {
    const { stdout, stderr } = await execAsync(`ssh -o StrictHostKeyChecking=no root@152.53.201.27 "${cmd.replace(/"/g, '\\"')}"`);
    return stdout || stderr;
  } catch (e: any) {
    return `SSH execution failed: ${e.message} (stderr: ${e.stderr || ""})`;
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("[route.ts] POST request received. messages count:", messages?.length);
    console.log("[route.ts] GROQ_API_KEY env key present:", !!process.env.GROQ_API_KEY);

    // Extract custom Groq key from headers if present
    const customKey = req.headers.get("x-groq-api-key");
    console.log("[route.ts] Custom key header present:", !!customKey);
    const modelProvider = customKey ? createGroq({ apiKey: customKey }) : groq;

    console.log("[route.ts] Initializing streamText...");
    const result = streamText({
    model: modelProvider("llama-3.3-70b-versatile"),
    stopWhen: stepCountIs(5), // Enable multi-step tool-calling
    system: `You are the ACMI Fleet Copilot — an advanced, high-agency AI agent system.
You are wired with live access to:
1. ACMI: Read and write task boards / work items directly on Upstash Redis.
2. VM Channels: Query docker services, logs, memory, and sync status on the remote Elestio VM (152.53.201.27).
3. Composio Integrations: Trigger action APIs (like Google Tasks creation).
4. Super Bus: Emit signals and events to the live coordination bus.

YOUR VOICE:
- Direct, calm, infrastructure-minded.
- Avoid corporate fluff, exclamation points, and generic filler text.
- Give short, concise, technical answers unless depth is requested.

YOUR CAPABILITIES:
- If a user asks about task status, look up ACMI tasks.
- If a user asks to add or change a task, write it to Redis or trigger Composio.
- If a user asks about VM health or sync status, query the VM using SSH command tools.`,
    messages,
    onError: ({ error }: { error: any }) => {
      console.error("[route.ts] Stream failed asynchronously:", error);
    },
    tools: {
      getACMITasks: {
        description: "Fetch all ACMI work items / tasks currently registered in the database.",
        parameters: z.object({}),
        execute: async () => {
          try {
            const keys1 = await callRedis(["KEYS", "acmi:work:*:profile"]) || [];
            const keys2 = await callRedis(["KEYS", "acmi:madez:work:*:profile"]) || [];
            const allKeys = Array.from(new Set([...keys1, ...keys2]));
            
            if (allKeys.length === 0) {
              return { success: true, tasks: [] };
            }

            const values = await callRedis(["MGET", ...allKeys]) || [];
            const tasks = [];
            
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
            return { success: true, tasks };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        }
      },

      updateACMITask: {
        description: "Create or update an ACMI work item / task profile in Redis.",
        parameters: z.object({
          taskId: z.string().describe("Unique identifier of the task (e.g. 't_12b6e771')"),
          title: z.string().describe("Title of the task"),
          status: z.enum(["todo", "ready", "in_progress", "blocked", "done", "pending", "active", "stalled", "completed"]).describe("State of the task"),
          assignee: z.string().optional().describe("Who is assigned (e.g. 'user' or 'agent:bentley')"),
          workspace_kind: z.string().optional().describe("Folder/scope workspace kind (e.g. 'scratch')"),
          description: z.string().optional().describe("Optional task details / description"),
          priority: z.string().optional().describe("Optional task priority, e.g. 'P0', 'P1', 'P2'"),
          deliverables: z.array(z.string()).optional().describe("Optional deliverables array"),
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
              deliverables
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
        parameters: z.object({
          kind: z.string().describe("Event classification, e.g. 'voice-input', 'task-update'"),
          summary: z.string().optional().describe("Detail of what occurred"),
          correlationId: z.string().describe("Tracking chain identifier, e.g. 'voiceInput-1783...'"),
          source: z.string().optional().describe("Optional event source agent name"),
          signal: z.string().optional().describe("Optional stringified JSON signal payload object"),
          status: z.string().optional().describe("Optional status descriptor"),
          description: z.string().optional().describe("Optional detailed description of the event"),
          message: z.string().optional().describe("Optional message content"),
        }),
        execute: async ({ kind, summary, correlationId, source, message, description, signal, status }: any) => {
          try {
            const eventPayload: Record<string, any> = {
              source: source || "agent:voice-copilot",
              kind,
              summary: summary || message || description || "No summary provided",
              correlationId,
            };
            if (signal) {
              try {
                eventPayload.signal = JSON.parse(signal);
              } catch {
                eventPayload.signal = signal;
              }
            }
            if (status) eventPayload.status = status;
            if (description) eventPayload.description = description;
            if (message) eventPayload.message = message;

            const payload = JSON.stringify(eventPayload);
            const script = "/Users/michaelshaw/clawd/acmi-bus-relay/emit-bus-event.sh";
            await execAsync(`echo '${payload}' | ${script} --stdin`);
            return { success: true, message: "Event successfully emitted to Super Bus." };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        }
      },

      runVMCommand: {
        description: "Runs a diagnostic check, status monitor, or system command on the remote VM via SSH.",
        parameters: z.object({
          command: z.string().describe("The exact bash command to execute, e.g. 'docker ps', 'free -m', or '/opt/acmi-bridge/sync-vm-kanbans.sh'"),
        }),
        execute: async ({ command }: any) => {
          try {
            const output = await runSSH(command);
            return { success: true, output };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        }
      },

      executeComposio: {
        description: "Executes an action using the Composio API Integration (e.g. creating Google Tasks).",
        parameters: z.object({
          actionName: z.string().describe("The Composio action name (e.g. 'GOOGLETASKS_CREATE_TASK')"),
          input: z.record(z.string(), z.any()).describe("Parameters/arguments required for the Composio action"),
        }),
        execute: async ({ actionName, input }: any) => {
          try {
            const composioKey = process.env.COMPOSIO_API_KEY || "ak_xHrrW-9SrFPEC1LPv6eJ";
            const res = await fetch(`https://backend.composio.dev/api/v1/actions/${actionName}/execute`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": composioKey,
              },
              body: JSON.stringify({ entityId: "default", input }),
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

  return result.toTextStreamResponse();
  } catch (err: any) {
    console.error("API Chat route error in detail:", err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
