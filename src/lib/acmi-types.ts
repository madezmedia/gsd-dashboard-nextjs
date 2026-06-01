// ============================================================================
// ACMI — Agentic Context Memory Interface: TypeScript Type Definitions
// Protocol v1.3 + Fleet Comms v1.5
// ============================================================================
// Pure types only — no runtime code. Includes type guards (type predicates)
// for runtime validation without dependencies.
// ============================================================================

// ---------------------------------------------------------------------------
// §1 — Key structure
// ---------------------------------------------------------------------------

/**
 * Canonical ACMI namespaces used across the fleet.
 */
export type AcmiNamespace =
  | 'agent'
  | 'user'
  | 'thread'
  | 'work'
  | 'project'
  | 'session'
  | 'registry'
  | 'hitl'
  | (string & {});

/**
 * The three data slots every ACMI entity has.
 */
export type AcmiSlot = 'profile' | 'signals' | 'timeline';

/**
 * Full Redis key: `acmi:<namespace>:<id>:<slot>`
 */
export type AcmiKey = `acmi:${AcmiNamespace}:${string}:${AcmiSlot}`;

/** Valid actor types per SPEC §11 — Multi-actor */
export type AcmiActorType = 'agent' | 'human' | 'system' | 'external';

/** Valid HITL statuses */
export type AcmiHitlStatus = 'open' | 'closed';

/** Role an agent can have in a thread */
export type AcmiThreadRole = 'participant' | 'lead';

/** Work item status ladder */
export type AcmiWorkStatus =
  | 'DRAFT'
  | 'RATIFIED'
  | 'IN_PROGRESS'
  | 'SHIPPED'
  | 'CANCELLED';

/** Work item priority */
export type AcmiWorkPriority = 'P0' | 'P1' | 'P2' | 'P3';

/** Speaker type for distinguishing agent reasoning from human input (v1.3) */
export type AcmiSpeakerType = 'agent' | 'human' | 'system';

// ---------------------------------------------------------------------------
// §2 — Profile
// ---------------------------------------------------------------------------

/**
 * ACMI Profile — the "who" slot.
 */
export interface AcmiProfile {
  actor_type: AcmiActorType;
  tenant_id?: string;
  name?: string;
  role?: string;
  host_id?: string;
  description?: string;
  avatar?: string;
  color?: string;
  expertise?: string[];
  skills?: string[];
  primary_threads?: string[];
  fleet_role?: string;
  wake_window_utc?: string;
  primary_id?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// §3 — Signals
// ---------------------------------------------------------------------------

/**
 * ACMI Signals — the "now" slot.
 * A mutable KV map of JSON values representing current state.
 */
export interface AcmiSignals {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// §4 — Timeline Events
// ---------------------------------------------------------------------------

/**
 * ACMI Timeline Event (Comms v1.5 envelope).
 */
export interface AcmiEvent {
  /** Wall-clock ms */
  ts: number;
  /** Who wrote the event. Entity-ID format: `"agent:<id>"`, `"user:<id>"` */
  source: string;
  /** Event taxonomy — a verb in kebab-case */
  kind: string;
  /** Chain identifier: `<camelCase>-<msEpoch>` */
  correlationId: string;
  /** Human-readable one-line summary, ≤500 chars */
  summary: string;
  /** Links this event to a parent correlationId, forming a chain */
  parentCorrelationId?: string;
  /** Arbitrary structured payload */
  payload?: AcmiEventPayload;
  /** Free-form string tags for filtering */
  tags?: string[];
  /** v1.3 — distinguishes synthesizable vs lived experience */
  speaker_type?: AcmiSpeakerType;
  [key: string]: unknown;
}

export interface AcmiEventPayload extends Record<string, unknown> {
  logAssessment?: number;
  rubric?: string;
  entryId?: string;
  thought?: string;
}

/**
 * Event selection/query options for timeline reads.
 */
export interface AcmiTimelineOptions {
  limit?: number;
  reverse?: boolean;
  since?: number;
  until?: number;
}

/** Sorting direction for timeline queries */
export type AcmiSortDirection = 'asc' | 'desc';
export type AcmiSortField = 'ts' | 'kind' | 'source';

export interface AcmiSortSpec {
  field: AcmiSortField;
  direction: AcmiSortDirection;
}

/** Filter specification for timeline queries */
export interface AcmiEventFilter {
  kinds?: string[];
  sources?: string[];
  correlationIdPrefix?: string;
  tags?: string[];
  speakerTypes?: AcmiSpeakerType[];
}

// ---------------------------------------------------------------------------
// §5 — Fleet Comms enums (v1.5 event kinds)
// ---------------------------------------------------------------------------

export const AcmiEventKinds = {
  DECISION: 'decision',
  TASK_DELEGATION: 'task-delegation',
  HANDOFF_ACK: 'handoff-ack',
  MILESTONE_SHIPPED: 'milestone-shipped',
  WORK_CREATED: 'work-created',
  WORK_UPDATE: 'work-update',
  WORK_COMPLETED: 'work-completed',
  WORK_RATIFIED: 'work-ratified',
  INCIDENT_OPENED: 'incident-opened',
  INCIDENT_UPDATE: 'incident-update',
  INCIDENT_RESOLVED: 'incident-resolved',
  SCOPE_DECISION: 'scope-decision',
  COORD_NOTE: 'coord-note',
  HEARTBEAT: 'heartbeat',
  ARTIFACT_PUBLISHED: 'artifact-published',
  TEAM_LOOP: 'team-loop',
  NAMESPACE_ARCHIVED: 'namespace-archived',
  HITL_REQUIRED: 'hitl-required',
  HITL_RESOLVED: 'hitl-resolved',
  JOURNAL_ENTRY: 'journal_entry',
  SPAWN: 'spawn',
} as const;

export type AcmiEventKind = (typeof AcmiEventKinds)[keyof typeof AcmiEventKinds];

export const AcmiTags = {
  HITL: 'hitl',
  P0: 'p0',
  PRODUCTION: 'production',
  TEST: 'test',
  AUTOMATED: 'automated',
  COORDINATION: 'coordination',
} as const;

export type AcmiTag = (typeof AcmiTags)[keyof typeof AcmiTags];

// ---------------------------------------------------------------------------
// §6 — CorrelationId chain types
// ---------------------------------------------------------------------------

export type AcmiCorrelationId = `${string}-${number}`;

export interface AcmiCorrelationChain {
  rootCorrelationId: string;
  events: AcmiEvent[];
  sources: string[];
}

// ---------------------------------------------------------------------------
// §7 — Entity types
// ---------------------------------------------------------------------------

export interface AcmiAgent {
  id: string;
  profile: AcmiProfile | null;
  signals: AcmiSignals | null;
  timeline: AcmiEvent[];
}

export interface AcmiUser {
  id: string;
  profile: AcmiProfile | null;
  signals: AcmiSignals | null;
  timeline: AcmiEvent[];
  hitlOpen?: AcmiEvent[];
}

export interface AcmiThread {
  id: string;
  profile: AcmiProfile | null;
  signals: AcmiSignals | null;
  timeline: AcmiEvent[];
  activeAgents?: string[];
}

export interface AcmiWorkItem {
  id: string;
  profile: AcmiWorkProfile | null;
  signals: AcmiWorkSignals | null;
  timeline: AcmiEvent[];
}

// ---------------------------------------------------------------------------
// §8 — Work item types
// ---------------------------------------------------------------------------

export interface AcmiWorkProfile {
  title: string;
  owner?: string;
  status?: AcmiWorkStatus;
  priority?: AcmiWorkPriority;
  deliverables?: string[];
  parentWorkId?: string;
  description?: string;
  [key: string]: unknown;
}

export interface AcmiWorkSignals extends AcmiSignals {
  status?: AcmiWorkStatus;
  progress_pct?: number;
  blockers?: string[];
  artifacts?: string[];
  active_session_id?: string;
  last_activity_ts?: number;
}

// ---------------------------------------------------------------------------
// §9 — Bootstrap response
// ---------------------------------------------------------------------------

export interface AcmiBootstrap {
  profile: AcmiProfile | null;
  signals: AcmiSignals | null;
  recentTimeline: AcmiEvent[];
  rollup?: AcmiRollup;
  activeThreads?: AcmiActiveThread[];
  recentSpawns?: AcmiEvent[];
}

export interface AcmiActiveThread {
  threadKey: string;
  role: AcmiThreadRole;
}

export interface AcmiRollup {
  session_summary?: string;
  decisions_made?: AcmiRollupDecision[];
  open_blockers?: string[];
  next_session_priorities?: string[];
  key_correlation_ids?: string[];
  session_duration_min?: number;
  [key: string]: unknown;
}

export interface AcmiRollupDecision {
  id: string;
  rationale?: string;
  cid?: string;
}

// ---------------------------------------------------------------------------
// §10 — Cat / Multi-stream types
// ---------------------------------------------------------------------------

export interface AcmiCatOptions {
  since?: string;
  limit?: number;
  sinceMs?: number;
  deduplicate?: boolean;
}

export interface AcmiCatResult {
  events: AcmiEvent[];
  total: number;
  streamsQueried: number;
}

export interface AcmiListResult {
  namespace: AcmiNamespace;
  ids: string[];
  count: number;
}

// ---------------------------------------------------------------------------
// §11 — Type guards
// ---------------------------------------------------------------------------

export function isEventKind<T extends AcmiEvent>(
  event: T,
  kind: string
): event is T & { kind: typeof kind } {
  return event.kind === kind;
}

export function hasParentCorrelationId(
  event: AcmiEvent
): event is AcmiEvent & { parentCorrelationId: string } {
  return typeof event.parentCorrelationId === 'string' && event.parentCorrelationId.length > 0;
}

export function hasPayload(
  event: AcmiEvent
): event is AcmiEvent & { payload: AcmiEventPayload } {
  return typeof event.payload === 'object' && event.payload !== null;
}

export function isAcmiNamespace(value: unknown): value is AcmiNamespace {
  if (typeof value !== 'string') return false;
  return ['agent', 'user', 'thread', 'work', 'project', 'session', 'registry', 'hitl'].includes(value);
}

export function isValidAcmiEvent(value: unknown): value is AcmiEvent {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.ts === 'number' &&
    typeof e.source === 'string' &&
    typeof e.kind === 'string' &&
    typeof e.correlationId === 'string' &&
    typeof e.summary === 'string'
  );
}

export function isValidAcmiProfile(value: unknown): value is AcmiProfile {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  if (!p.actor_type) return false;
  return ['agent', 'human', 'system', 'external'].includes(p.actor_type as string);
}

export function isAcmiWorkStatus(value: unknown): value is AcmiWorkStatus {
  if (typeof value !== 'string') return false;
  return ['DRAFT', 'RATIFIED', 'IN_PROGRESS', 'SHIPPED', 'CANCELLED'].includes(value);
}
