import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const scriptPath = path.resolve(process.cwd(), "scripts/mirror-git-repos.sh");
    console.log(`Executing mirror script at: ${scriptPath}`);
    
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`);
    
    return NextResponse.json({
      success: true,
      log: stdout || stderr,
    });
  } catch (err: any) {
    console.error("Failed to run mirror sync script:", err);
    return NextResponse.json({
      success: false,
      error: err.message,
      log: err.stdout || err.stderr || "Unknown execution error",
    }, { status: 500 });
  }
}
