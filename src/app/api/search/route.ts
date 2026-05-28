import { NextRequest, NextResponse } from "next/server";
import { fetchWorkItems, fetchDashboardRollup } from "@/lib/acmi-client";
import { calculateSemanticScore } from "@/lib/vector-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const target = searchParams.get("target") || "work"; // "work" or "events"
  const threshold = parseFloat(searchParams.get("threshold") || "0.4");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    let itemsToSearch: Array<{ id: string; title: string; subtitle?: string; extra?: any }> = [];

    if (target === "work") {
      const workItems = await fetchWorkItems();
      itemsToSearch = workItems.map(w => ({
        id: w.id,
        title: w.title,
        subtitle: `Owner: ${w.owner || "unassigned"} | Status: ${w.status}`,
        extra: {
          status: w.status,
          progress: w.progress,
          stages: w.stages,
        }
      }));
    } else {
      const rollup = await fetchDashboardRollup();
      itemsToSearch = rollup.recentEvents.map(e => ({
        id: e.id,
        title: e.summary,
        subtitle: `Source: @${e.source} | Kind: ${e.kind}`,
        extra: {
          source: e.source,
          kind: e.kind,
          ts: e.ts,
          correlationId: e.correlationId,
        }
      }));
    }

    // Run semantic scoring
    const scored = itemsToSearch
      .map(item => {
        const score = calculateSemanticScore(query, item.title);
        return {
          ...item,
          score: Math.round(score * 100) / 100, // Round to 2 decimal places
        };
      })
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      query,
      target,
      count: scored.length,
      results: scored,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Semantic search failed", details: String(err) },
      { status: 500 }
    );
  }
}
