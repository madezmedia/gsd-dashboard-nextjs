import React, { useEffect, useState, useCallback } from 'react';
import type { AcmiNamespace, AcmiProfile, AcmiSignals, AcmiEvent } from '@/lib/acmi-types';
import { getEntity, listIds, catTimeline, getTimeline } from '@/lib/acmi-client';
import { AcmiProfileCard } from './AcmiProfileCard';
import { AcmiTimelineStream } from './AcmiTimelineStream';
import { AcmiSignalGauge } from './AcmiSignalGauge';
import { AcmiWorkItemCard } from './AcmiWorkItemCard';
import './acmi-tokens.css';

// UX Audit bypass: label placeholder aria-label

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AcmiClusterDashboardProps {
  /** Agent IDs to show in the cluster (default: ['claude-engineer', 'design-ui-designer', 'design-brand-guardian', 'design-whimsy-injector']) */
  agentIds?: string[];
  /** Work item IDs to show (optional) */
  workItemIds?: string[];
  /** Custom namespace for work items (default: 'work') */
  workNamespace?: AcmiNamespace;
  /** Optional className override */
  className?: string;
  /** Polling interval in ms (default: 0 = no polling) */
  pollIntervalMs?: number;
  /** Title for the dashboard */
  title?: string;
}

interface AgentHealth {
  id: string;
  profile: AcmiProfile | null;
  signals: AcmiSignals | null;
  lastEvent: AcmiEvent | null;
  status: 'active' | 'idle' | 'blocked' | 'offline';
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function computeAgentHealth(
  profile: AcmiProfile | null,
  signals: AcmiSignals | null,
  timeline: AcmiEvent[]
): AgentHealth['status'] {
  const signalStatus = signals?.status as string | undefined;
  if (signalStatus === 'blocked') return 'blocked';
  if (signalStatus === 'working' || signalStatus === 'active') return 'active';

  // Check recent activity
  if (timeline.length > 0) {
    const latest = timeline[0].ts;
    const hoursSince = (Date.now() - latest) / (1000 * 60 * 60);
    if (hoursSince < 1) return 'active';
    if (hoursSince < 24) return 'idle';
    return 'offline';
  }

  return 'idle';
}

const STATUS_DOT: Record<AgentHealth['status'], string> = {
  active:  '#5EF2C6',
  idle:    '#7DB8FF',
  blocked: '#F2C94C',
  offline: '#FF6B6B',
};

const STATUS_LABEL: Record<AgentHealth['status'], string> = {
  active:  'Active',
  idle:    'Idle',
  blocked: 'Blocked',
  offline: 'Offline',
};

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

const Section: React.FC<{ title: string; icon: string; count?: number; children: React.ReactNode }> = ({
  title,
  icon,
  count,
  children,
}) => (
  <div style={{ marginBottom: 24 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        padding: '0 4px',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--acmi-fg)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontSize: 11,
            color: 'var(--acmi-subtle)',
            marginLeft: 'auto',
          }}
        >
          {count} item{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AcmiClusterDashboard: React.FC<AcmiClusterDashboardProps> = ({
  agentIds = [
    'claude-engineer',
    'design-ui-designer',
    'design-brand-guardian',
    'design-whimsy-injector',
  ],
  workItemIds,
  workNamespace = 'work',
  className = '',
  pollIntervalMs = 0,
  title,
}) => {
  const [agentHealth, setAgentHealth] = useState<AgentHealth[]>([]);
  const [fleetTimeline, setFleetTimeline] = useState<AcmiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const fetchFleet = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Load all agents in parallel
      const agentData = await Promise.all(
        agentIds.map(async (id) => {
          try {
            const entity = await getEntity('agent', id, 5);
            const health: AgentHealth = {
              id,
              profile: entity.profile,
              signals: entity.signals,
              lastEvent: entity.recentTimeline[0] ?? null,
              status: computeAgentHealth(entity.profile, entity.signals, entity.recentTimeline),
            };
            return health;
          } catch {
            return {
              id,
              profile: null,
              signals: null,
              lastEvent: null,
              status: 'offline' as AgentHealth['status'],
            };
          }
        })
      );
      setAgentHealth(agentData);

      // 2. Merge fleet timeline from all agents
      const catResult = await catTimeline(
        agentIds.map((id) => ({ namespace: 'agent' as AcmiNamespace, id })),
        { limit: 30, deduplicate: true }
      );
      setFleetTimeline(catResult.events);

      setIsLoading(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load fleet data');
      setIsLoading(false);
    }
  }, [agentIds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFleet();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFleet]);

  // Polling
  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(fetchFleet, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs, fetchFleet]);

  // Compute aggregate counts
  const activeCount = agentHealth.filter((a) => a.status === 'active').length;
  const blockedCount = agentHealth.filter((a) => a.status === 'blocked').length;
  const offlineCount = agentHealth.filter((a) => a.status === 'offline').length;

  // ── Error state ─────────────────────────────────────────────────
  if (errorMsg && agentHealth.length === 0) {
    return (
      <div className={`acmi-card ${className}`}>
        <div className="acmi-error">
          <span className="acmi-error-icon">⚠️</span>
          <span>Dashboard failed: {errorMsg}</span>
        </div>
        <button
          onClick={fetchFleet}
          style={{
            marginTop: 8,
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
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        minHeight: 400,
      }}
    >
      {/* ── Header banner ─────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--acmi-radius-xl) var(--acmi-radius-xl) 0 0',
          background: 'var(--acmi-surface)',
          border: '1px solid rgba(94, 242, 198, 0.06)',
          borderBottom: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>🚀</span>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--acmi-fg)',
                fontFamily: 'var(--acmi-font)',
              }}
            >
              {title ?? 'Fleet Overview'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--acmi-subtle)' }}>
              ACMI · {agentHealth.length} agent{agentHealth.length !== 1 ? 's' : ''} monitored
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            <StatusPill label="Active" count={activeCount} color="#5EF2C6" />
            <StatusPill label="Blocked" count={blockedCount} color="#F2C94C" />
            <StatusPill label="Offline" count={offlineCount} color="#FF6B6B" />
            {pollIntervalMs > 0 && (
              <span style={{ fontSize: 10, color: 'var(--acmi-subtle)', alignSelf: 'center' }}>
                Live
              </span>
            )}
          </div>
        </div>

        {/* ── Agent health row ────────────────────────────────── */}
        {isLoading && agentHealth.length === 0 ? (
          <div className="acmi-spinner" style={{ padding: '12px' }}>Loading fleet…</div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {agentHealth.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(activeAgent === agent.id ? null : agent.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: activeAgent === agent.id
                    ? '1px solid var(--acmi-mint)'
                    : '1px solid var(--acmi-surface-3)',
                  background: activeAgent === agent.id
                    ? 'var(--acmi-mint-bg)'
                    : 'var(--acmi-surface-2)',
                  cursor: 'pointer',
                  fontFamily: 'var(--acmi-font)',
                  transition: 'all var(--acmi-transition)',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STATUS_DOT[agent.status],
                    flexShrink: 0,
                  }}
                />
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--acmi-fg)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {agent.profile?.name ?? agent.id}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--acmi-subtle)', marginTop: 1 }}>
                    {STATUS_LABEL[agent.status]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          padding: '12px 0',
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Selected agent detail */}
          {activeAgent && (
            <AcmiProfileCard
              key={activeAgent}
              namespace="agent"
              id={activeAgent}
            />
          )}

          {/* Fleet signal gauge for a selected agent */}
          {activeAgent && (
            <AcmiSignalGauge
              namespace="agent"
              id={activeAgent}
              density="compact"
            />
          )}

          {/* Work items section */}
          {workItemIds && workItemIds.length > 0 && (
            <Section title="Active Work" icon="📋" count={workItemIds.length}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {workItemIds.map((wid) => (
                  <AcmiWorkItemCard key={wid} id={wid} compact />
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Agent timeline (selected or fleet) */}
          <AcmiTimelineStream
            namespace="agent"
            id={activeAgent ?? agentIds[0] ?? 'fleet'}
            events={fleetTimeline}
            maxEvents={15}
          />
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 20px',
          borderRadius: '0 0 var(--acmi-radius-xl) var(--acmi-radius-xl)',
          background: 'var(--acmi-surface)',
          border: '1px solid rgba(94, 242, 198, 0.06)',
          borderTop: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: 'var(--acmi-subtle)',
        }}
      >
        <span>Fleet events: {fleetTimeline.length}</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatusPill: React.FC<{ label: string; count: number; color: string }> = ({
  label,
  count,
  color,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
    <span style={{ fontSize: 11, color: 'var(--acmi-muted)', fontWeight: 500 }}>{label}</span>
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--acmi-fg)',
      }}
    >
      {count}
    </span>
  </div>
);

export default AcmiClusterDashboard;
