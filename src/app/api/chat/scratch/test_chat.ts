import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
  const groqKey = process.env.GROQ_API_KEY;
  console.log("GROQ KEY EXISTS:", !!groqKey);
  const groq = createGroq({ apiKey: groqKey });
  
  try {
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: "You are a helpful assistant.",
      messages: [{ role: "user", content: "hi" }]
    });
    
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log("\nDone");
  } catch (err) {
    console.error("Stream failed:", err);
  }
}

test();
