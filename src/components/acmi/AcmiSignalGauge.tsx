import React, { useEffect, useState, useCallback } from 'react';
import type { AcmiSignals, AcmiNamespace } from '@/lib/acmi-types';
import { getSignals } from '@/lib/acmi-client';
import './acmi-tokens.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AcmiSignalGaugeProps {
  /** Entity namespace (default: 'agent') */
  namespace?: AcmiNamespace;
  /** Entity ID to fetch signals for */
  id: string;
  /** Optional pre-loaded signals (skips fetch) */
  data?: AcmiSignals | null;
  /** Which signal keys to display (default: all) */
  keys?: string[];
  /** Keys to exclude */
  excludeKeys?: string[];
  /** Optional className override */
  className?: string;
  /** Visual density: 'comfortable' | 'compact' (default: 'comfortable') */
  density?: 'comfortable' | 'compact';
  /** Callback when a signal value is clicked */
  onSignalClick?: (key: string, value: unknown) => void;
  /** Polling interval in ms (default: 0 = no polling) */
  pollIntervalMs?: number;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

// ---------------------------------------------------------------------------
// Signal rendering helpers
// ---------------------------------------------------------------------------

/**
 * Classify a signal value to determine how to render it.
 */
type SignalType = 'string' | 'number' | 'percentage' | 'boolean' | 'array' | 'object' | 'nullish';

function classifySignal(value: unknown): SignalType {
  if (value == null) return 'nullish';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') {
    // Check if it looks like a percentage (0-100)
    if (value >= 0 && value <= 100 && Number.isFinite(value)) return 'percentage';
    return 'number';
  }
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
}

function formatSignalKey(key: string): string {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSignalValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value).slice(0, 40);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Value renderers
// ---------------------------------------------------------------------------

interface SignalValueRendererProps {
  key_: string;
  value: unknown;
  type_: SignalType;
  onClick?: () => void;
}

const SignalBoolean: React.FC<SignalValueRendererProps> = ({ value }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '1px 8px',
      borderRadius: 100,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: value
        ? 'rgba(94, 242, 198, 0.12)'
        : 'rgba(155, 188, 190, 0.08)',
      color: value ? 'var(--acmi-mint)' : 'var(--acmi-muted)',
    }}
  >
    {value ? '● True' : '○ False'}
  </span>
);

const SignalPercentage: React.FC<SignalValueRendererProps> = ({ value }) => {
  const pct = Math.min(100, Math.max(0, value as number));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: 'var(--acmi-surface-3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: pct > 80
              ? 'var(--acmi-mint)'
              : pct > 50
                ? 'var(--acmi-blue)'
                : 'var(--acmi-warning)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 32,
          textAlign: 'right',
          color: pct > 80
            ? 'var(--acmi-mint)'
            : pct > 50
              ? 'var(--acmi-blue)'
              : 'var(--acmi-warning)',
        }}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
};

const SignalNumber: React.FC<SignalValueRendererProps> = ({ value }) => (
  <span
    style={{
      fontSize: 13,
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
      color: 'var(--acmi-mint)',
    }}
  >
    {typeof value === 'number' ? value.toLocaleString() : String(value)}
  </span>
);

const SignalArray: React.FC<SignalValueRendererProps> = ({ value }) => {
  const arr = (value as unknown[]).slice(0, 5);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {arr.map((item, i) => (
        <span
          key={i}
          style={{
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: 10,
            background: 'var(--acmi-mint-bg)',
            color: 'var(--acmi-mint)',
            border: '1px solid rgba(94, 242, 198, 0.12)',
          }}
        >
          {String(item).slice(0, 20)}
        </span>
      ))}
      {(value as unknown[]).length > 5 && (
        <span style={{ fontSize: 10, color: 'var(--acmi-subtle)' }}>
          +{(value as unknown[]).length - 5} more
        </span>
      )}
    </div>
  );
};

const SignalObject: React.FC<SignalValueRendererProps> = ({ value }) => (
  <span style={{ fontSize: 11, color: 'var(--acmi-muted)', fontFamily: 'var(--acmi-font-mono)' }}>
    {JSON.stringify(value).slice(0, 40) + (JSON.stringify(value).length > 40 ? '…' : '')}
  </span>
);

const SignalNullish: React.FC = () => (
  <span style={{ fontSize: 11, color: 'var(--acmi-subtle)' }}>—</span>
);

function SignalValue({ key_, value, type_, onClick }: SignalValueRendererProps) {
  const containerStyle: React.CSSProperties = {
    ...(onClick ? { cursor: 'pointer' } : {}),
  };

  const render = () => {
    switch (type_) {
      case 'boolean':    return <SignalBoolean key_={key_} value={value} type_={type_} />;
      case 'percentage': return <SignalPercentage key_={key_} value={value} type_={type_} />;
      case 'number':     return <SignalNumber key_={key_} value={value} type_={type_} />;
      case 'array':      return <SignalArray key_={key_} value={value} type_={type_} />;
      case 'object':     return <SignalObject key_={key_} value={value} type_={type_} />;
      case 'string':     return <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--acmi-fg)' }}>{formatSignalValue(value)}</span>;
      default:           return <SignalNullish />;
    }
  };

  return <div onClick={onClick} style={containerStyle}>{render()}</div>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AcmiSignalGauge: React.FC<AcmiSignalGaugeProps> = ({
  namespace = 'agent',
  id,
  data,
  keys: propKeys,
  excludeKeys,
  className = '',
  density = 'comfortable',
  onSignalClick,
  pollIntervalMs = 0,
}) => {
  const [signals, setSignals] = useState<AcmiSignals | null>(data ?? null);
  const [loadState, setLoadState] = useState<LoadState>(data !== undefined ? 'loaded' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSignals = useCallback(async () => {
    if (data !== undefined) return;
    setLoadState('loading');
    setErrorMsg('');
    try {
      const s = await getSignals(namespace, id);
      setSignals(s);
      setLoadState('loaded');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load signals');
      setLoadState('error');
    }
  }, [namespace, id, data]);

  useEffect(() => {
    if (data !== undefined) {
      setSignals(data);
      setLoadState('loaded');
      return;
    }
    fetchSignals();
  }, [fetchSignals, data]);

  // Polling
  useEffect(() => {
    if (pollIntervalMs <= 0 || data !== undefined) return;
    const interval = setInterval(fetchSignals, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs, fetchSignals, data]);

  // Filter keys
  const excludeSet = new Set(excludeKeys ?? ['bloopers', 'blockers']);
  const signalEntries = signals
    ? Object.entries(signals).filter(([k]) => !excludeSet.has(k))
    : [];

  // If propKeys specified, reorder and filter
  const displayEntries = propKeys
    ? signalEntries.filter(([k]) => propKeys.includes(k))
        .sort((a, b) => propKeys.indexOf(a[0]) - propKeys.indexOf(b[0]))
    : signalEntries;

  // ── Loading state ───────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: 120 }}>
        <div className="acmi-spinner">Loading signals…</div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: 120 }}>
        <div className="acmi-error">
          <span className="acmi-error-icon">⚠️</span>
          <span>Failed to load signals: {errorMsg}</span>
        </div>
        <button
          onClick={fetchSignals}
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
  if (displayEntries.length === 0) {
    return (
      <div className={`acmi-card ${className}`} style={{ minHeight: 120 }}>
        <div className="acmi-card-header">
          <span className="acmi-card-title">Signals · {id}</span>
        </div>
        <div className="acmi-empty">
          <div className="acmi-empty-icon">📊</div>
          <div>No signal data available</div>
        </div>
      </div>
    );
  }

  const isCompact = density === 'compact';
  const gap = isCompact ? 4 : 10;
  const rowPadding = isCompact ? '6px 0' : '10px 0';

  return (
    <div className={`acmi-card ${className}`}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="acmi-card-header">
        <span className="acmi-card-title">Signals · {id}</span>
        <span style={{ fontSize: 11, color: 'var(--acmi-subtle)' }}>
          {displayEntries.length} key{displayEntries.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {displayEntries.map(([key, value], idx) => {
          const type_ = classifySignal(value);
          return (
            <div
              key={key}
              style={{
                display: isCompact ? 'flex' : 'grid',
                gridTemplateColumns: isCompact ? undefined : '140px 1fr',
                flexDirection: isCompact ? 'row' : undefined,
                alignItems: isCompact ? 'center' : undefined,
                gap: isCompact ? 10 : 8,
                padding: rowPadding,
                borderTop: idx > 0 ? '1px solid var(--acmi-surface-3)' : 'none',
              }}
            >
              {/* Label */}
              <span
                style={{
                  fontSize: isCompact ? 10 : 11,
                  color: 'var(--acmi-subtle)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formatSignalKey(key)}
              </span>

              {/* Value */}
              <SignalValue
                key_={key}
                value={value}
                type_={type_}
                onClick={onSignalClick ? () => onSignalClick(key, value) : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* ── Live indicator ────────────────────────────────────── */}
      {pollIntervalMs > 0 && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--acmi-subtle)' }}>
            Live · updating every {pollIntervalMs / 1000}s
          </span>
        </div>
      )}
    </div>
  );
};

export default AcmiSignalGauge;
