/**
 * ACMI Bus SSE Integration
 * Subscribes to live SSE events from the ACMI bus and dispatches them.
 */

export interface BusEvent {
  id: string;
  ts: number;
  type: string;
  source: string;
  payload: Record<string, unknown>;
}

type BusEventHandler = (event: BusEvent) => void;
type BusStatusHandler = (status: "connected" | "disconnected" | "error", error?: string) => void;

const BUS_URL = "https://gsd-dashboard-pi.vercel.app/api/bus/stream";

class BusStreamManager {
  private eventSource: EventSource | null = null;
  private listeners: Set<BusEventHandler> = new Set();
  private statusListeners: Set<BusStatusHandler> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;

  subscribe(onEvent: BusEventHandler, onStatus?: BusStatusHandler): () => void {
    this.listeners.add(onEvent);
    if (onStatus) this.statusListeners.add(onStatus);

    if (!this.eventSource) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(onEvent);
      if (onStatus) this.statusListeners.delete(onStatus);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private connect() {
    if (this.eventSource) return;

    const since = typeof window !== "undefined"
      ? localStorage.getItem("acmi:bus:lastTs") || Date.now().toString()
      : Date.now().toString();

    try {
      const url = `${BUS_URL}?since=${since}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notifyStatus("connected");
      };

      this.eventSource.onmessage = (e: MessageEvent) => {
        try {
          const event: BusEvent = JSON.parse(e.data);
          if (typeof window !== "undefined") {
            localStorage.setItem("acmi:bus:lastTs", String(event.ts));
          }
          this.listeners.forEach((fn) => fn(event));
        } catch {
          // silently ignore malformed events
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyStatus("error", "Connection lost");
        this.disconnect();
        this.scheduleReconnect();
      };
    } catch (err) {
      this.notifyStatus("error", String(err));
      this.scheduleReconnect();
    }
  }

  private disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 3000);
  }

  private notifyStatus(status: "connected" | "disconnected" | "error", message?: string) {
    this.statusListeners.forEach((fn) => fn(status, message));
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// Singleton
export const busStream = new BusStreamManager();

// Re-export the subscribe function for convenience
export const subscribeToBus = busStream.subscribe.bind(busStream);
