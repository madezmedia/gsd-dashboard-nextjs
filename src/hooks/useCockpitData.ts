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
    const success = await triggerFleetSync();
    if (success) {
      setTimeout(() => {
        loadData();
        setForcingSync(false);
      }, 1500);
    } else {
      setForcingSync(false);
    }
  }, [loadData, setForcingSync]);

  // Actioning (resolving) HITL tickets
  const handleResolveHitl = useCallback(
    async (ticket: HitlTicket, action: "approve" | "reject") => {
      const member = ticket.member;
      setActioningMember(member);
      try {
        const success = await resolveHitlTicket(
          member,
          action,
          feedbackNote,
          ticket.work_item_id || ticket.id
        );
        if (success) {
          setFeedbackNote("");
          await loadData();
        }
      } catch (err) {
        console.error("Failed to action HITL ticket:", err);
      } finally {
        setActioningMember(null);
      }
    },
    [feedbackNote, loadData, setActioningMember, setFeedbackNote]
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
