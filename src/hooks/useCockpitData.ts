import { useEffect, useCallback } from "react";
import { useCockpitStore, type HitlTicket, type ServiceRegistry } from "@/store/useCockpitStore";
import {
  fetchDashboardRollup,
  fetchHitlQueue,
  fetchServices,
  triggerFleetSync,
  resolveHitlTicket,
} from "@/lib/acmi-client";
import { busStream } from "@/lib/bus-stream";

export function useCockpitData() {
  const {
    setRollup,
    setHitlQueue,
    setServices,
    appendBusEvent,
    setSyncStatus,
    setForcingSync,
    setActioningMember,
    setFeedbackNote,
    feedbackNote,
  } = useCockpitStore();

  const loadData = useCallback(async () => {
    setSyncStatus("syncing");
    try {
      const [rollupData, queueData, servicesData] = await Promise.all([
        fetchDashboardRollup(),
        fetchHitlQueue(),
        fetchServices(),
      ]);

      setRollup(rollupData);
      setHitlQueue(queueData as unknown as HitlTicket[]);
      setServices(servicesData as unknown as ServiceRegistry[]);
      setSyncStatus("idle");
    } catch (err) {
      console.error("Failed to load cockpit data:", err);
      setSyncStatus("stalled");
    }
  }, [setRollup, setHitlQueue, setServices, setSyncStatus]);

  // Force synchronizing the fleet state
  const handleForceSync = useCallback(async () => {
    setForcingSync(true);
    try {
      const success = await triggerFleetSync();
      if (success) {
        await loadData();
      } else {
        // Still refresh local view even if remote trigger is a no-op
        await loadData();
      }
    } catch (err) {
      console.error("fleet sync failed", err);
      alert("Fleet sync trigger failed — check ACMI proxy.");
    } finally {
      setForcingSync(false);
    }
  }, [loadData, setForcingSync]);

  // Actioning (resolving) HITL tickets — same proven path as /hitl page
  const handleResolveHitl = useCallback(
    async (ticket: HitlTicket, action: "approve" | "reject") => {
      const member = ticket.member;
      if (!member) {
        console.error("HITL ticket missing member", ticket);
        alert("Cannot resolve: ticket has no agent member id.");
        return false;
      }
      setActioningMember(member);
      try {
        const success = await resolveHitlTicket(
          member,
          action,
          feedbackNote || "",
          ticket.work_item_id || ticket.id
        );
        if (success) {
          // Optimistic: drop from queue immediately, then reload
          setHitlQueue(
            useCockpitStore.getState().hitlQueue.filter((t) => t.member !== member)
          );
          setFeedbackNote("");
          await loadData();
          return true;
        }
        alert("Failed to submit approval action to ACMI (acmi_hitl_action).");
        return false;
      } catch (err) {
        console.error("Failed to action HITL ticket:", err);
        alert("Error resolving HITL ticket — check ACMI proxy.");
        return false;
      } finally {
        setActioningMember(null);
      }
    },
    [feedbackNote, loadData, setActioningMember, setFeedbackNote, setHitlQueue]
  );

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!intervalId) {
        loadData();
        intervalId = setInterval(loadData, 5000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Check visibility state to pause/resume fetching
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Initial load and start
    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Subscribe to real-time bus stream
    const unsubscribe = busStream.subscribe((event) => {
      appendBusEvent(event);
    });

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribe();
    };
  }, [loadData, appendBusEvent]);

  return {
    loadData,
    handleForceSync,
    handleResolveHitl,
  };
}
