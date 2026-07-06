import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const systemPrompt = `You are a prompt engineering expert specializing in ACMI agent commands and swarm coordination.
Your job is to analyze the user's input request and enhance it into a clear, detailed, structured prompt for a Swarm execution agent.
Make it highly actionable, precise, and explicit about goals or diagnostics.
Return ONLY the final enhanced prompt. Do not add introductions, code blocks, formatting tags, or explanations. Keep it under 2-3 sentences, sharp, direct, and actionable.`;

    const xaiKey = process.env.XAI_API_KEY || "";
    let enhanced = "";
    let providerUsed = "grok";

    // Attempt Grok first if API key is present
    if (xaiKey && !xaiKey.includes("placeholder")) {
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${xaiKey}`,
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Enhance this prompt: "${prompt}"` },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          enhanced = data.choices?.[0]?.message?.content || "";
        } else {
          console.warn("xAI API returned error status:", res.status);
        }
      } catch (err) {
        console.error("Failed to connect to xAI completions API:", err);
      }
    }

    // Fallback to Groq if Grok was not successful
    if (!enhanced.trim()) {
      const groqKey = process.env.GROQ_API_KEY || "";
      if (!groqKey) {
        return NextResponse.json({ success: false, error: "No API keys configured" }, { status: 500 });
      }

      try {
        providerUsed = "groq-fallback";
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Enhance this prompt: "${prompt}"` },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          enhanced = data.choices?.[0]?.message?.content || "";
        }
      } catch (err) {
        console.error("Groq fallback prompt enhancement failed:", err);
      }
    }

    if (!enhanced.trim()) {
      return NextResponse.json({ success: false, error: "Enhancement failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, enhanced: enhanced.trim(), provider: providerUsed });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
