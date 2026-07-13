import { create } from "zustand";
import { type ACMIDashboardRollup } from "@/lib/acmi-client";
import { type BusEvent } from "@/lib/bus-stream";

export interface HitlTicket {
  member: string;
  ts: number;
  id?: string;
  source?: string;
  kind?: string;
  summary: string;
  correlationId?: string;
  work_item_id?: string;
}

export interface ServiceRegistry {
  slug: string;
  name: string;
  url?: string;
  internal?: string;
  role?: string;
  verified_at?: number;
  setup_at?: number;
}

export type TenantType = "all" | "madez" | "duane" | "suzanne" | "avery";

interface CockpitState {
  // State
  rollup: ACMIDashboardRollup | null;
  hitlQueue: HitlTicket[];
  services: ServiceRegistry[];
  busEvents: BusEvent[];
  activeTenant: TenantType;
  syncStatus: "idle" | "syncing" | "stalled";
  forcingSync: boolean;
  actioningMember: string | null;
  feedbackNote: string;
  copiedId: string | null;

  // Actions
  setRollup: (rollup: ACMIDashboardRollup | null) => void;
  setHitlQueue: (queue: HitlTicket[]) => void;
  setServices: (services: ServiceRegistry[]) => void;
  appendBusEvent: (event: BusEvent) => void;
  setActiveTenant: (tenant: TenantType) => void;
  setSyncStatus: (status: "idle" | "syncing" | "stalled") => void;
  setForcingSync: (forcing: boolean) => void;
  setActioningMember: (member: string | null) => void;
  setFeedbackNote: (note: string) => void;
  setCopiedId: (id: string | null) => void;
  copyText: (val: string, key: string) => void;
}

export const useCockpitStore = create<CockpitState>((set) => ({
  // Initial State
  rollup: null,
  hitlQueue: [],
  services: [],
  busEvents: [],
  activeTenant: "all",
  syncStatus: "idle",
  forcingSync: false,
  actioningMember: null,
  feedbackNote: "",
  copiedId: null,

  // Actions
  setRollup: (rollup) => set({ rollup }),
  setHitlQueue: (hitlQueue) => set({ hitlQueue }),
  setServices: (services) => set({ services }),
  appendBusEvent: (event) =>
    set((state) => ({
      busEvents: [event, ...state.busEvents].slice(0, 15),
    })),
  setActiveTenant: (activeTenant) => set({ activeTenant }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setForcingSync: (forcingSync) => set({ forcingSync }),
  setActioningMember: (actioningMember) => set({ actioningMember }),
  setFeedbackNote: (feedbackNote) => set({ feedbackNote }),
  setCopiedId: (copiedId) => set({ copiedId }),
  copyText: (val, key) => {
    navigator.clipboard.writeText(val);
    set({ copiedId: key });
    setTimeout(() => set({ copiedId: null }), 1500);
  },
}));
