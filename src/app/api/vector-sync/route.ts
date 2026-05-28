import { NextRequest, NextResponse } from "next/server";
import { fetchWorkItems, fetchDashboardRollup, updateWorkItemMilestones } from "@/lib/acmi-client";
import { calculateSemanticScore } from "@/lib/vector-engine";

interface SyncResult {
  workItemId: string;
  workItemTitle: string;
  milestoneName: string;
  eventSummary: string;
  score: number;
  updatedProgress: number;
  completed: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const workItems = await fetchWorkItems();
    const rollup = await fetchDashboardRollup();
    const recentEvents = rollup.recentEvents;

    const syncLogs: SyncResult[] = [];

    for (const item of workItems) {
      if (item.status === "completed") continue;

      const milestones = item.stages || [];
      if (milestones.length === 0) continue;

      const currentCompleted = milestones.filter(m => m.done).map(m => m.name);
      const newlyCompleted: string[] = [...currentCompleted];
      let stateChanged = false;

      for (const milestone of milestones) {
        if (milestone.done) continue;

        // Try to find a matching event
        let highestScore = 0;
        let matchingEventSummary = "";

        for (const event of recentEvents) {
          // Compare event summary to milestone name
          const score = calculateSemanticScore(event.summary, milestone.name);
          if (score > highestScore) {
            highestScore = score;
            matchingEventSummary = event.summary;
          }
        }

        // Vector gate threshold is 85% (>0.85)
        if (highestScore >= 0.85) {
          newlyCompleted.push(milestone.name);
          stateChanged = true;

          // Compute new progress
          const totalCount = milestones.length;
          const completedCount = newlyCompleted.length;
          const progress = Math.min(100, Math.round((completedCount / totalCount) * 100));
          const newStatus = progress === 100 ? "completed" : item.status;

          // Dispatch update to ACMI Redis proxy
          await updateWorkItemMilestones(item.id, newlyCompleted, progress, newStatus);

          syncLogs.push({
            workItemId: item.id,
            workItemTitle: item.title,
            milestoneName: milestone.name,
            eventSummary: matchingEventSummary,
            score: Math.round(highestScore * 100) / 100,
            updatedProgress: progress,
            completed: progress === 100,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedWorkItems: workItems.length,
      eventsChecked: recentEvents.length,
      matchesSynced: syncLogs.length,
      syncLogs,
    });
  } catch (err) {
    console.error("Vector sync failed:", err);
    return NextResponse.json(
      { error: "Vector sync transaction failed", details: String(err) },
      { status: 500 }
    );
  }
}

// Support GET for fast triggering from UI
export async function GET(req: NextRequest) {
  return POST(req);
}
