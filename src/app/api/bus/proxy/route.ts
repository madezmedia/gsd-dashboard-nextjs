import { NextRequest, NextResponse } from "next/server";

const BUS_STREAM_URL = "https://gsd-dashboard-pi.vercel.app/api/bus/stream";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since") || Date.now().toString();

  try {
    const busUrl = `${BUS_STREAM_URL}?since=${since}`;
    const busRes = await fetch(busUrl);

    if (!busRes.ok) {
      return NextResponse.json(
        { error: "Bus stream unavailable", status: busRes.status },
        { status: busRes.status }
      );
    }

    // Return the stream directly as SSE
    return new NextResponse(busRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to connect to bus stream", details: String(error) },
      { status: 502 }
    );
  }
}
