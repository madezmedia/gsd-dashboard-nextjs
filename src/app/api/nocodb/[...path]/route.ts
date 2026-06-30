import { NextRequest, NextResponse } from "next/server";

const NOCODB_URL = process.env.NOCODB_URL || "https://nocodb-u70402.vm.elestio.app";
const NOCODB_API_KEY = process.env.NOCODB_API_KEY || "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const subpath = resolvedParams.path.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${NOCODB_URL}/api/v2/${subpath}${searchParams ? `?${searchParams}` : ""}`;

    console.log(`[NocoDB Proxy] GET -> ${targetUrl}`);

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "xc-token": NOCODB_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `NocoDB responded with status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("NocoDB proxy error:", error);
    const errMsg = error instanceof Error ? error.message : "Proxy failed";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const subpath = resolvedParams.path.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${NOCODB_URL}/api/v2/${subpath}${searchParams ? `?${searchParams}` : ""}`;
    const body = await req.json().catch(() => ({}));

    console.log(`[NocoDB Proxy] POST -> ${targetUrl}`);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "xc-token": NOCODB_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `NocoDB responded with status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("NocoDB proxy error:", error);
    const errMsg = error instanceof Error ? error.message : "Proxy failed";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
