import React, { useEffect, useState, useCallback } from 'react';
import type { AcmiProfile, AcmiSignals } from '@/lib/acmi-types';
import { getProfile, getSignals, getEntity } from '@/lib/acmi-client';
import type { AcmiNamespace } from '@/lib/acmi-types';
import './acmi-tokens.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AcmiProfileCardProps {
  /** Entity namespace (default: 'agent') */
  namespace?: AcmiNamespace;
  /** Entity ID to fetch profile + signals for */
  id: string;
  /** Optional pre-loaded data (skips fetch) */
  data?: {
    profile: AcmiProfile | null;
    signals: AcmiSignals | null;
  };
  /** Optional className override */
  className?: string;
  /** Callback when entity is clicked */
  onSelect?: (id: string) => void;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTOR_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  agent:   { label: 'Agent',    icon: '🤖' },
  human:   { label: 'Human',    icon: '👤' },
  system:  { label: 'System',   icon: '⚙️' },
  external:{ label: 'External', icon: '🔗' },
};

const STATUS_COLORS: Record<string, string> = {
  active:   'acmi-badge--success',
  idle:     'acmi-badge--info',
  working:  'acmi-badge--mint',
  blocked:  'acmi-badge--warning',
  error:    'acmi-badge--danger',
  offline:  'acmi-badge--danger',
};

function getStatusClass(status: unknown): string {
  const s = String(status ?? '').toLowerCase();
  return STATUS_COLORS[s] ?? 'acmi-badge--info';
}

function formatRole(role: string | undefined): string {
  if (!role) return '';
  return role
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AcmiProfileCard: React.FC<AcmiProfileCardProps> = ({
  namespace = 'agent',
  id,
  data,
  className = '',
  onSelect,
}) => {
  const [profile, setProfile] = useState<AcmiProfile | null>(data?.profile ?? null);
  const [signals, setSignals] = useState<AcmiSignals | null>(data?.signals ?? null);
  const [loadState, setLoadState] = useState<LoadState>(data ? 'loaded' : 'idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchData = useCallback(async () => {
    if (data) return;
    setLoadState('loading');
    setErrorMsg('');
    try {
      const entity = await getEntity(namespace, id);
      setProfile(entity.profile);
      setSignals(entity.signals);
      setLoadState('loaded');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load profile');
      setLoadState('error');
    }
  }, [namespace, id, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading state ───────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: 180 }}>
        <div className="acmi-spinner">Loading profile…</div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: 180 }}>
        <div className="acmi-error">
          <span className="acmi-error-icon">⚠️</span>
          <span>Failed to load profile: {errorMsg}</span>
        </div>
        <button
          onClick={fetchData}
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

  // ── Empty state ─────────────────────────────────────────────────
  if (!profile && !signals) {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: 180 }}>
        <div className="acmi-empty">
          <div className="acmi-empty-icon">📋</div>
          <div>No profile data for <strong>{id}</strong></div>
          <div style={{ fontSize: 11 }}>Entity exists but has no profile or signals yet</div>
        </div>
      </div>
    );
  }

  const at = profile?.actor_type ?? 'agent';
  const actorInfo = ACTOR_TYPE_LABELS[at] ?? ACTOR_TYPE_LABELS.agent;
  const status = signals?.status ?? profile?.fleet_role ?? 'active';

  return (
    <div
      className={`acmi-card ${className}`}
      onClick={() => onSelect?.(id)}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      {/* ── Header row ────────────────────────────────────────── */}
      <div className="acmi-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--acmi-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            {profile?.avatar ?? actorInfo.icon}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--acmi-fg)' }}>
              {profile?.name ?? id}
            </div>
            <div style={{ fontSize: 11, color: 'var(--acmi-subtle)', marginTop: 1 }}>
              {actorInfo.label} · {profile?.primary_id ?? id}
            </div>
          </div>
        </div>
        <span className={`acmi-badge ${getStatusClass(status)}`}>
          {String(status).toLowerCase()}
        </span>
      </div>

      {/* ── Role ──────────────────────────────────────────────── */}
      {(profile?.role || profile?.fleet_role) && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--acmi-muted)',
            marginBottom: 12,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--acmi-surface-2)',
            display: 'inline-block',
          }}
        >
          {formatRole(profile?.fleet_role ?? profile?.role)}
        </div>
      )}

      {/* ── Description ───────────────────────────────────────── */}
      {profile?.description && (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--acmi-muted)',
            margin: '0 0 12px 0',
          }}
        >
          {profile.description}
        </p>
      )}

      {/* ── Skills / Expertise ────────────────────────────────── */}
      {(profile?.expertise?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {(profile?.expertise ?? profile?.skills ?? []).slice(0, 6).map((skill) => (
            <span
              key={skill}
              style={{
                padding: '2px 8px',
                borderRadius: 100,
                fontSize: 10,
                fontWeight: 500,
                background: 'var(--acmi-mint-bg)',
                color: 'var(--acmi-mint)',
                border: '1px solid rgba(94, 242, 198, 0.12)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* ── Signals bar ───────────────────────────────────────── */}
      {signals && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 10,
            borderTop: '1px solid var(--acmi-surface-3)',
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {Object.entries(signals)
            .filter(([k]) => !['status', 'bloopers'].includes(k))
            .slice(0, 4)
            .map(([key, val]) => (
              <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--acmi-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {key.replace(/[_-]/g, ' ')}
                </span>
                <span style={{ fontSize: 11, color: 'var(--acmi-mint)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {String(val ?? '—')}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AcmiProfileCard;
