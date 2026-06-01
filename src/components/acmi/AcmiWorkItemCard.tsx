import React, { useEffect, useState, useCallback } from 'react';
import type {
  AcmiWorkItem,
  AcmiWorkProfile,
  AcmiWorkSignals,
  AcmiWorkStatus,
  AcmiWorkPriority,
} from '@/lib/acmi-types';
import { getWorkItem } from '@/lib/acmi-client';
import './acmi-tokens.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AcmiWorkItemCardProps {
  /** Work item ID to fetch */
  id: string;
  /** Optional pre-loaded work item data (skips fetch) */
  data?: AcmiWorkItem;
  /** Optional className override */
  className?: string;
  /** Callback when the card is clicked */
  onClick?: (item: AcmiWorkItem) => void;
  /** Show compact variant (default: false) */
  compact?: boolean;
  /** Poll for updates (ms, default: 0 = no polling) */
  pollIntervalMs?: number;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<AcmiWorkStatus, { label: string; badgeClass: string }> = {
  DRAFT:       { label: 'Draft',        badgeClass: 'acmi-badge--info' },
  RATIFIED:    { label: 'Ratified',     badgeClass: 'acmi-badge--blue' },
  IN_PROGRESS: { label: 'In Progress',  badgeClass: 'acmi-badge--mint' },
  SHIPPED:     { label: 'Shipped',      badgeClass: 'acmi-badge--success' },
  CANCELLED:   { label: 'Cancelled',    badgeClass: 'acmi-badge--danger' },
};

const PRIORITY_CONFIG: Record<AcmiWorkPriority, string> = {
  P0: 'acmi-badge--danger',
  P1: 'acmi-badge--warning',
  P2: 'acmi-badge--blue',
  P3: 'acmi-badge--info',
};

function getSignalStatus(signals: AcmiWorkSignals | null): AcmiWorkStatus | undefined {
  if (!signals) return undefined;
  const s = signals['status'] as AcmiWorkStatus | undefined;
  if (s && ['DRAFT', 'RATIFIED', 'IN_PROGRESS', 'SHIPPED', 'CANCELLED'].includes(s)) return s;
  return undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AcmiWorkItemCard: React.FC<AcmiWorkItemCardProps> = ({
  id,
  data,
  className = '',
  onClick,
  compact = false,
  pollIntervalMs = 0,
}) => {
  const [workItem, setWorkItem] = useState<AcmiWorkItem | null>(data ?? null);
  const [loadState, setLoadState] = useState<LoadState>(data ? 'loaded' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchItem = useCallback(async () => {
    if (data) return;
    setLoadState('loading');
    setErrorMsg('');
    try {
      const item = await getWorkItem(id);
      setWorkItem(item);
      setLoadState('loaded');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load work item');
      setLoadState('error');
    }
  }, [id, data]);

  useEffect(() => {
    if (data) {
      setWorkItem(data);
      setLoadState('loaded');
      return;
    }
    fetchItem();
  }, [fetchItem, data]);

  // Polling
  useEffect(() => {
    if (pollIntervalMs <= 0 || data) return;
    const interval = setInterval(fetchItem, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs, fetchItem, data]);

  // ── Loading state ───────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: compact ? 80 : 140 }}>
        <div className="acmi-spinner">Loading work item…</div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: compact ? 80 : 140 }}>
        <div className="acmi-error">
          <span className="acmi-error-icon">⚠️</span>
          <span>{errorMsg}</span>
        </div>
        <button
          onClick={fetchItem}
          style={{
            marginTop: 8,
            padding: '4px 12px',
            borderRadius: 8,
            border: '1px solid var(--acmi-mint)',
            background: 'transparent',
            color: 'var(--acmi-mint)',
            cursor: 'pointer',
            fontFamily: 'var(--acmi-font)',
            fontSize: 11,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────
  if (!workItem || (!workItem.profile && !workItem.signals)) {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: compact ? 80 : 140 }}>
        <div className="acmi-empty">
          <div className="acmi-empty-icon">📋</div>
          <div>No work item data for <strong>{id}</strong></div>
        </div>
      </div>
    );
  }

  const profile = workItem.profile;
  const signals = workItem.signals;
  const status = profile?.status ?? getSignalStatus(signals) ?? 'DRAFT';
  const priority = profile?.priority ?? (signals?.priority as AcmiWorkPriority | undefined);
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const progress = signals?.progress_pct ?? 0;
  const blockers = signals?.blockers ?? [];

  // ── Compact variant ─────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={`acmi-card ${className}`}
        onClick={() => workItem && onClick?.(workItem)}
        style={{
          cursor: onClick ? 'pointer' : 'default',
          padding: '10px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {priority && (
            <span className={`acmi-badge ${PRIORITY_CONFIG[priority]}`}>
              {priority}
            </span>
          )}
          <span className={statusCfg.badgeClass} style={{ fontSize: 10, padding: '1px 8px' }}>
            {statusCfg.label}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--acmi-fg)', flex: 1 }}>
            {profile?.title ?? id}
          </span>
          <span style={{ fontSize: 12, color: 'var(--acmi-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {progress}%
          </span>
          {signals?.last_activity_ts && (
            <span style={{ fontSize: 10, color: 'var(--acmi-subtle)' }}>
              {formatRelativeTime(signals.last_activity_ts as number)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Full variant ────────────────────────────────────────────────
  return (
    <div
      className={`acmi-card ${className}`}
      onClick={() => workItem && onClick?.(workItem)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* ── Header row ────────────────────────────────────────── */}
      <div className="acmi-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={statusCfg.badgeClass} style={{ fontSize: 11, padding: '2px 10px' }}>
            {statusCfg.label}
          </span>
          {priority && (
            <span className={`acmi-badge ${PRIORITY_CONFIG[priority]}`}>
              {priority}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--acmi-subtle)', fontFamily: 'var(--acmi-font-mono)' }}>
          {id}
        </span>
      </div>

      {/* ── Title ─────────────────────────────────────────────── */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--acmi-fg)',
          margin: '0 0 6px 0',
        }}
      >
        {profile?.title ?? 'Untitled'}
      </h3>

      {/* ── Description ───────────────────────────────────────── */}
      {profile?.description && (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--acmi-muted)',
            margin: '0 0 14px 0',
          }}
        >
          {profile.description.length > 160
            ? profile.description.slice(0, 160) + '…'
            : profile.description}
        </p>
      )}

      {/* ── Owner + deliverables ──────────────────────────────── */}
      {profile?.owner && (
        <div style={{ fontSize: 11, color: 'var(--acmi-subtle)', marginBottom: 6 }}>
          Owner: <span style={{ color: 'var(--acmi-muted)' }}>{profile.owner}</span>
        </div>
      )}

      {profile?.deliverables && profile.deliverables.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {profile.deliverables.slice(0, 4).map((d) => (
            <span
              key={d}
              style={{
                padding: '1px 8px',
                borderRadius: 100,
                fontSize: 10,
                background: 'var(--acmi-blue-bg)',
                color: 'var(--acmi-blue)',
              }}
            >
              {d}
            </span>
          ))}
          {profile.deliverables.length > 4 && (
            <span style={{ fontSize: 10, color: 'var(--acmi-subtle)' }}>
              +{profile.deliverables.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* ── Progress bar ──────────────────────────────────────── */}
      {(typeof progress === 'number' && progress > 0) && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--acmi-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Progress
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color: progress > 80 ? 'var(--acmi-mint)' : progress > 50 ? 'var(--acmi-blue)' : 'var(--acmi-warning)',
              }}
            >
              {Math.round(progress as number)}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--acmi-surface-3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, progress as number))}%`,
                height: '100%',
                borderRadius: 3,
                background: progress > 80
                  ? 'var(--acmi-mint)'
                  : progress > 50
                    ? 'var(--acmi-blue)'
                    : 'var(--acmi-warning)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Blockers ──────────────────────────────────────────── */}
      {blockers.length > 0 && (
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 10,
            background: 'rgba(255, 107, 107, 0.06)',
            border: '1px solid rgba(255, 107, 107, 0.12)',
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--acmi-danger)', fontWeight: 600, marginBottom: 2 }}>
            ⚠ Blocker{blockers.length > 1 ? 's' : ''}
          </div>
          {(blockers as string[]).slice(0, 2).map((b, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--acmi-muted)', paddingLeft: 4 }}>
              · {b}
            </div>
          ))}
          {blockers.length > 2 && (
            <div style={{ fontSize: 10, color: 'var(--acmi-subtle)', paddingLeft: 4 }}>
              +{blockers.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* ── Footer metadata ───────────────────────────────────── */}
      {signals?.last_activity_ts && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid var(--acmi-surface-3)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: 'var(--acmi-subtle)',
          }}
        >
          <span>Last activity: {formatRelativeTime(signals.last_activity_ts as number)}</span>
          {signals?.active_session_id && (
            <span>Session: {String(signals.active_session_id).slice(0, 12)}…</span>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
  return `${Math.floor(diffMs / 86_400_000)}d ago`;
}

export default AcmiWorkItemCard;
