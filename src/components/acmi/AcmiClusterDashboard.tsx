import React, { useEffect, useState, useCallback } from 'react';
import type { AcmiNamespace, AcmiProfile, AcmiSignals, AcmiEvent } from '@/lib/acmi-types';
import { getEntity, listIds, catTimeline, getTimeline } from '@/lib/acmi-client';
import { AcmiProfileCard } from './AcmiProfileCard';
import { AcmiTimelineStream } from './AcmiTimelineStream';
import { AcmiSignalGauge } from './AcmiSignalGauge';
import { AcmiWorkItemCard } from './AcmiWorkItemCard';
import './acmi-tokens.css';
import { cn } from '@/lib/utils';

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
  const [lastUpdated, setLastUpdated] = useState<string>('');

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
      setLastUpdated(new Date().toLocaleTimeString());

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
    <div className={cn("flex flex-col min-h-[400px]", className)}>
      {/* ── Header banner ─────────────────────────────────────── */}
      <div className="p-5 border border-border border-b-0 bg-card rounded-t-2xl shadow-md flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <div>
              <h2 className="text-sm font-bold tracking-[0.1em] text-foreground uppercase font-serif">
                {title ?? 'Fleet Overview'}
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                ACMI · {agentHealth.length} agent{agentHealth.length !== 1 ? 's' : ''} monitored
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label="Active" count={activeCount} color="#5EF2C6" />
            <StatusPill label="Blocked" count={blockedCount} color="#F2C94C" />
            <StatusPill label="Offline" count={offlineCount} color="#FF6B6B" />
            {pollIntervalMs > 0 && (
              <span className="font-mono text-[9px] text-muted-foreground/50 uppercase ml-1 animate-pulse">
                [Live]
              </span>
            )}
          </div>
        </div>

        {/* ── Agent health row ────────────────────────────────── */}
        {isLoading && agentHealth.length === 0 ? (
          <div className="acmi-spinner" style={{ padding: '12px' }}>Loading fleet…</div>
        ) : (
          <div className="flex flex-wrap md:flex-nowrap gap-2">
            {agentHealth.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(activeAgent === agent.id ? null : agent.id)}
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer min-w-[120px] max-w-full md:max-w-none",
                  activeAgent === agent.id
                    ? "bg-primary/10 text-primary border-primary"
                    : "bg-secondary text-foreground/80 border-border hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_DOT[agent.status] }}
                />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-bold truncate text-foreground text-[11px]">
                    {agent.profile?.name ?? agent.id}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase font-mono tracking-tight">
                    {STATUS_LABEL[agent.status]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        {/* Left column */}
        <div className="flex flex-col gap-3">
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
              <div className="flex flex-col gap-2">
                {workItemIds.map((wid) => (
                  <AcmiWorkItemCard key={wid} id={wid} compact />
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
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
      <div className="px-5 py-2.5 border border-border border-t-0 bg-card rounded-b-2xl shadow-md flex justify-between font-mono text-[9px] text-muted-foreground uppercase tracking-wide">
        <span>Fleet events: {fleetTimeline.length}</span>
        <span>Last updated: {lastUpdated || 'Syncing...'}</span>
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
  <div className="flex items-center gap-1.5 font-mono text-[10px]">
    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <span className="text-muted-foreground uppercase">{label}</span>
    <span className="font-bold text-foreground bg-secondary px-1 border border-border/40 min-w-[16px] text-center rounded-sm">
      {count}
    </span>
  </div>
);

export default AcmiClusterDashboard;
