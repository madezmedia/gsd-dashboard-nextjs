// ============================================================================
// ACMI Dashboard Components — Barrel Export
// ============================================================================

// ── CSS tokens ─────────────────────────────────────────────────────────────
import './acmi-tokens.css';

// ── Components ─────────────────────────────────────────────────────────────
export { AcmiProfileCard } from './AcmiProfileCard';
export type { AcmiProfileCardProps } from './AcmiProfileCard';

export { AcmiTimelineStream } from './AcmiTimelineStream';
export type { AcmiTimelineStreamProps } from './AcmiTimelineStream';

export { AcmiSignalGauge } from './AcmiSignalGauge';
export type { AcmiSignalGaugeProps } from './AcmiSignalGauge';

export { AcmiWorkItemCard } from './AcmiWorkItemCard';
export type { AcmiWorkItemCardProps } from './AcmiWorkItemCard';

export { AcmiEntitySearch } from './AcmiEntitySearch';
export type { AcmiEntitySearchProps } from './AcmiEntitySearch';

export { AcmiClusterDashboard } from './AcmiClusterDashboard';
export type { AcmiClusterDashboardProps } from './AcmiClusterDashboard';

// ── Convenience ────────────────────────────────────────────────────────────
export * from '@/lib/acmi-types';
export { acmiClient, getMockBootstrap, hasRedisCredentials } from '@/lib/acmi-client';
export type { AcmiClient, MockDataOverrides } from '@/lib/acmi-client';
