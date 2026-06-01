import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { AcmiEvent, AcmiNamespace, AcmiEventFilter } from '@/lib/acmi-types';
import { AcmiEventKinds } from '@/lib/acmi-types';
import { getTimeline } from '@/lib/acmi-client';
import './acmi-tokens.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AcmiTimelineStreamProps {
  /** Entity namespace (default: 'agent') */
  namespace?: AcmiNamespace;
  /** Entity ID to fetch timeline for */
  id: string;
  /** Optional pre-loaded events (skips fetch) */
  events?: AcmiEvent[];
  /** Filter by event kinds */
  filterKind?: string[];
  /** Max events to display (default: 50) */
  maxEvents?: number;
  /** Polling interval in ms (default: 0 = no polling) */
  pollIntervalMs?: number;
  /** Optional className override */
  className?: string;
  /** Callback when an event is clicked */
  onEventClick?: (event: AcmiEvent) => void;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

// ---------------------------------------------------------------------------
// Kind helpers
// ---------------------------------------------------------------------------

const KIND_CATEGORIES: { id: string; label: string; prefix: string; color: string }[] = [
  { id: 'all',         label: 'All',          prefix: '',                    color: '' },
  { id: 'milestone',   label: 'Milestones',   prefix: 'milestone',           color: '--acmi-mint' },
  { id: 'handoff',     label: 'Handoffs',      prefix: 'handoff',             color: '--acmi-warning' },
  { id: 'work',        label: 'Work Items',   prefix: 'work-',               color: '--acmi-blue' },
  { id: 'incident',    label: 'Incidents',    prefix: 'incident',            color: '--acmi-danger' },
  { id: 'coord',       label: 'Coordination', prefix: 'coord',               color: '--acmi-mint' },
  { id: 'hitl',        label: 'Human-in-loop',prefix: 'hitl',                color: '--acmi-warning' },
  { id: 'spawn',       label: 'Spawns',       prefix: 'spawn',               color: '--acmi-blue' },
];

function getKindBadgeClass(kind: string): string {
  if (kind.startsWith('spawn') || kind === 'session-start') return 'acmi-kind-badge--spawn';
  if (kind.startsWith('milestone')) return 'acmi-kind-badge--milestone';
  if (kind.startsWith('handoff') || kind.startsWith('task-')) return 'acmi-kind-badge--handoff';
  if (kind.startsWith('work-')) return 'acmi-kind-badge--work';
  if (kind.startsWith('incident')) return 'acmi-kind-badge--incident';
  if (kind.startsWith('coord') || kind.startsWith('team-')) return 'acmi-kind-badge--coord';
  if (kind === 'heartbeat') return 'acmi-kind-badge--heartbeat';
  if (kind.startsWith('hitl')) return 'acmi-kind-badge--hitl';
  if (kind.startsWith('journal')) return 'acmi-kind-badge--journal';
  if (kind.startsWith('artifact')) return 'acmi-kind-badge--artifact';
  if (kind === 'decision' || kind.startsWith('scope-')) return 'acmi-kind-badge--decision';
  if (kind.startsWith('namespace')) return 'acmi-kind-badge--namespace';
  if (kind.startsWith('review')) return 'acmi-kind-badge--review';
  return 'acmi-kind-badge--default';
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diffMs = now - ts;

  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
  if (diffMs < 604_800_000) return `${Math.floor(diffMs / 86_400_000)}d ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getSourceLabel(source: string): string {
  const parts = source.split(':');
  return parts.length > 1 ? parts[1] : source;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AcmiTimelineStream: React.FC<AcmiTimelineStreamProps> = ({
  namespace = 'agent',
  id,
  events: propsEvents,
  filterKind,
  maxEvents = 50,
  pollIntervalMs = 0,
  className = '',
  onEventClick,
}) => {
  const [allEvents, setAllEvents] = useState<AcmiEvent[]>(propsEvents ?? []);
  const [loadState, setLoadState] = useState<LoadState>(propsEvents ? 'loaded' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoadState('loading');
    setErrorMsg('');
    try {
      const events = await getTimeline(namespace, id, { limit: maxEvents, reverse: true });
      setAllEvents(events);
      setLoadState('loaded');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load timeline');
      setLoadState('error');
    }
  }, [namespace, id, maxEvents]);

  useEffect(() => {
    if (propsEvents) {
      setAllEvents(propsEvents);
      setLoadState('loaded');
      return;
    }
    fetchEvents();
  }, [fetchEvents, propsEvents]);

  // Polling
  useEffect(() => {
    if (pollIntervalMs <= 0 || propsEvents) return;
    pollRef.current = setInterval(fetchEvents, pollIntervalMs);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollIntervalMs, fetchEvents, propsEvents]);

  // Client-side kind filter
  const filtered = filterKind
    ? allEvents.filter((e) => filterKind.includes(e.kind))
    : activeCategory === 'all'
      ? allEvents
      : allEvents.filter((e) => {
          const cat = KIND_CATEGORIES.find((c) => c.id === activeCategory);
          return cat ? e.kind.startsWith(cat.prefix) : true;
        });

  // ── Loading state ───────────────────────────────────────────────
  if (loadState === 'loading' && allEvents.length === 0) {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: 200 }}>
        <div className="acmi-spinner">Loading timeline…</div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────
  if (loadState === 'error' && allEvents.length === 0) {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: 200 }}>
        <div className="acmi-error">
          <span className="acmi-error-icon">⚠️</span>
          <span>Failed to load timeline: {errorMsg}</span>
        </div>
        <button
          onClick={fetchEvents}
          style={{
            marginTop: 12,
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid var(--acmi-mint)',
            background: 'transparent',
            color: 'var(--acmi-mint)',
            cursor: 'pointer',
            fontFamily: 'var(--acmi-font)',
            fontSize: 12,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`acmi-card ${className}`} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="acmi-card-header">
        <span className="acmi-card-title">Timeline · {id}</span>
        <span style={{ fontSize: 11, color: 'var(--acmi-subtle)' }}>
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Kind filter chips (only when no filterKind prop) ──── */}
      {!filterKind && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 12,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
          className="acmi-scrollable"
        >
          {KIND_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '3px 12px',
                borderRadius: 100,
                border: activeCategory === cat.id
                  ? '1px solid var(--acmi-mint)'
                  : '1px solid var(--acmi-surface-3)',
                background: activeCategory === cat.id
                  ? 'var(--acmi-mint-bg)'
                  : 'var(--acmi-surface)',
                color: activeCategory === cat.id ? 'var(--acmi-mint)' : 'var(--acmi-muted)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                fontFamily: 'var(--acmi-font)',
                transition: 'all var(--acmi-transition)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="acmi-empty">
          <div className="acmi-empty-icon">📭</div>
          <div>No timeline events yet</div>
          <div style={{ fontSize: 11 }}>Events appear here once the agent starts reporting</div>
        </div>
      )}

      {/* ── Event list ────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div
          ref={scrollRef}
          className="acmi-scrollable"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minHeight: 0,
          }}
        >
          {filtered.map((event, idx) => (
            <div
              key={event.correlationId + idx}
              onClick={() => onEventClick?.(event)}
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                background: idx % 2 === 0 ? 'var(--acmi-surface-2)' : 'transparent',
                cursor: onEventClick ? 'pointer' : 'default',
                transition: 'background var(--acmi-transition)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--acmi-surface-3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  idx % 2 === 0 ? 'var(--acmi-surface-2)' : 'transparent';
              }}
            >
              {/* Row 1: kind badge + source + time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className={`acmi-badge ${getKindBadgeClass(event.kind)}`}>
                  {event.kind}
                </span>
                <span style={{ fontSize: 10, color: 'var(--acmi-subtle)' }}>
                  {getSourceLabel(event.source)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--acmi-subtle)', marginLeft: 'auto' }}>
                  {formatTimestamp(event.ts)}
                </span>
              </div>
              {/* Row 2: summary */}
              <div style={{ fontSize: 12, color: 'var(--acmi-muted)', lineHeight: 1.4 }}>
                {event.summary.length > 120
                  ? event.summary.slice(0, 120) + '…'
                  : event.summary}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Auto-refresh indicator ────────────────────────────── */}
      {pollIntervalMs > 0 && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--acmi-subtle)' }}>
            Live · refreshing every {pollIntervalMs / 1000}s
          </span>
        </div>
      )}
    </div>
  );
};

export default AcmiTimelineStream;
