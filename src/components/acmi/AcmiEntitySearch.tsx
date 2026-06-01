import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { AcmiNamespace, AcmiAgent } from '@/lib/acmi-types';
import { getEntity, listIds } from '@/lib/acmi-client';
import { AcmiProfileCard } from './AcmiProfileCard';
import { AcmiTimelineStream } from './AcmiTimelineStream';
import { AcmiWorkItemCard } from './AcmiWorkItemCard';
import './acmi-tokens.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AcmiEntitySearchProps {
  /** Namespaces to search across (default: ['agent', 'work', 'thread']) */
  namespaces?: AcmiNamespace[];
  /** Optional className override */
  className?: string;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Callback when an entity is selected from results */
  onEntitySelect?: (namespace: AcmiNamespace, id: string) => void;
  /** Auto-focus the search input on mount */
  autoFocus?: boolean;
  /** Minimum query length to trigger search (default: 1) */
  minQueryLength?: number;
}

interface SearchResult {
  namespace: AcmiNamespace;
  id: string;
  matchField: string;
  matchPreview: string;
}

type SearchState = 'idle' | 'searching' | 'results' | 'no_results' | 'error';

// ---------------------------------------------------------------------------
// Namespace helpers
// ---------------------------------------------------------------------------

const NAMESPACE_LABELS: Record<string, { label: string; icon: string }> = {
  agent:   { label: 'Agent',    icon: '🤖' },
  user:    { label: 'User',     icon: '👤' },
  work:    { label: 'Work',     icon: '📋' },
  thread:  { label: 'Thread',   icon: '🧵' },
  project: { label: 'Project',  icon: '📁' },
  session: { label: 'Session',  icon: '🔌' },
  hitl:    { label: 'HITL',     icon: '🛑' },
};

function getNamespaceLabel(ns: string): { label: string; icon: string } {
  return NAMESPACE_LABELS[ns] ?? { label: ns, icon: '📦' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AcmiEntitySearch: React.FC<AcmiEntitySearchProps> = ({
  namespaces = ['agent', 'work', 'thread'],
  className = '',
  placeholder = 'Search ACMI entities…',
  onEntitySelect,
  autoFocus = true,
  minQueryLength = 1,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedNs, setSelectedNs] = useState<AcmiNamespace | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const performSearch = useCallback(async (q: string, ns: AcmiNamespace[]) => {
    if (q.length < minQueryLength) {
      setResults([]);
      setSearchState('idle');
      return;
    }

    setSearchState('searching');
    setErrorMsg('');

    try {
      const allResults: SearchResult[] = [];
      const qLower = q.toLowerCase();

      // Search each namespace — fetch IDs, then match against profile
      for (const namespace of ns) {
        let ids: string[];
        try {
          ids = await listIds(namespace);
        } catch {
          ids = [];
        }

        // Check if the query matches a known ID directly
        const matchingIds = ids.filter((id) => id.toLowerCase().includes(qLower));

        // Also try fuzzy match on entity name
        for (const id of matchingIds) {
          try {
            const entity = await getEntity(namespace, id);
            const profileName = entity.profile?.name ?? '';
            const profileRole = entity.profile?.role ?? '';
            const profileDesc = entity.profile?.description ?? '';

            let matchField = 'id';
            let matchPreview = id;

            if (profileName.toLowerCase().includes(qLower) && qLower.length > 2) {
              matchField = 'name';
              matchPreview = profileName;
            } else if (profileRole.toLowerCase().includes(qLower) && qLower.length > 2) {
              matchField = 'role';
              matchPreview = profileRole;
            } else if (profileDesc.toLowerCase().includes(qLower) && qLower.length > 3) {
              matchField = 'description';
              matchPreview = profileDesc.slice(0, 60);
            }

            allResults.push({ namespace, id, matchField, matchPreview });
          } catch {
            // Even if profile fetch fails, add the ID match
            allResults.push({ namespace, id, matchField: 'id', matchPreview: id });
          }
        }

        // If query looks like a namespace:id pattern, try direct entity fetch
        if (q.includes(':')) {
          const [nsPart, idPart] = q.split(':', 2);
          if (ns.includes(nsPart as AcmiNamespace) && idPart) {
            allResults.push({
              namespace: nsPart as AcmiNamespace,
              id: idPart,
              matchField: 'direct',
              matchPreview: `Direct reference: ${nsPart}:${idPart}`,
            });
          }
        }
      }

      setResults(allResults);
      setSearchState(allResults.length > 0 ? 'results' : 'no_results');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Search failed');
      setSearchState('error');
    }
  }, [minQueryLength]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        performSearch(val, namespaces);
      }, 250);
    },
    [namespaces, performSearch]
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setSelectedNs(result.namespace);
      setSelectedId(result.id);
      onEntitySelect?.(result.namespace, result.id);
    },
    [onEntitySelect]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearchState('idle');
    setSelectedId(null);
    setSelectedNs('');
    inputRef.current?.focus();
  }, []);

  return (
    <div className={`acmi-card ${className}`} style={{ padding: 0, overflow: 'hidden' }}>
      {/* ── Search bar ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: selectedId ? '1px solid var(--acmi-surface-3)' : 'none',
        }}
      >
        <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--acmi-fg)',
            fontSize: 14,
            fontFamily: 'var(--acmi-font)',
          }}
        />
        {query.length > 0 && (
          <button
            onClick={handleClear}
            style={{
              background: 'var(--acmi-surface-3)',
              border: 'none',
              borderRadius: '50%',
              width: 22,
              height: 22,
              cursor: 'pointer',
              color: 'var(--acmi-muted)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Search results ────────────────────────────────────── */}
      {searchState === 'searching' && (
        <div className="acmi-spinner" style={{ padding: '16px' }}>Searching…</div>
      )}

      {searchState === 'error' && (
        <div className="acmi-error" style={{ margin: '12px 16px' }}>
          <span className="acmi-error-icon">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {searchState === 'no_results' && (
        <div className="acmi-empty" style={{ padding: '24px' }}>
          <div className="acmi-empty-icon">🔎</div>
          <div>No entities found for "{query}"</div>
        </div>
      )}

      {searchState === 'results' && !selectedId && (
        <div
          className="acmi-scrollable"
          style={{
            maxHeight: 300,
            overflowY: 'auto',
            padding: '4px 6px',
          }}
        >
          {results.map((result, idx) => {
            const nsInfo = getNamespaceLabel(result.namespace);
            return (
              <div
                key={`${result.namespace}:${result.id}`}
                onClick={() => handleSelect(result)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'background var(--acmi-transition)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--acmi-surface-2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 16 }}>{nsInfo.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--acmi-fg)' }}>
                      {result.id}
                    </span>
                    <span className="acmi-badge acmi-badge--info" style={{ fontSize: 9, padding: '1px 6px' }}>
                      {nsInfo.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--acmi-subtle)', marginTop: 1 }}>
                    Matched on {result.matchField}: {result.matchPreview.length > 50
                      ? result.matchPreview.slice(0, 50) + '…'
                      : result.matchPreview}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--acmi-subtle)' }}>→</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Entity detail panel ───────────────────────────────── */}
      {selectedId && selectedNs && (
        <div
          style={{
            padding: '12px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => { setSelectedId(null); setSelectedNs(''); }}
              style={{
                background: 'var(--acmi-surface-2)',
                border: 'none',
                borderRadius: 8,
                padding: '4px 10px',
                cursor: 'pointer',
                color: 'var(--acmi-muted)',
                fontSize: 11,
                fontFamily: 'var(--acmi-font)',
              }}
            >
              ← Back to results
            </button>
            <span style={{ fontSize: 11, color: 'var(--acmi-subtle)' }}>
              {selectedNs}:{selectedId}
            </span>
          </div>

          {selectedNs === 'agent' && (
            <>
              <AcmiProfileCard namespace={selectedNs} id={selectedId} />
              <AcmiTimelineStream
                namespace={selectedNs}
                id={selectedId}
                maxEvents={8}
              />
            </>
          )}

          {selectedNs === 'work' && (
            <AcmiWorkItemCard
              id={selectedId}
              compact={false}
            />
          )}

          {selectedNs !== 'agent' && selectedNs !== 'work' && (
            <AcmiTimelineStream
              namespace={selectedNs as AcmiNamespace}
              id={selectedId}
              maxEvents={10}
            />
          )}
        </div>
      )}

      {/* ── Namespace indicator ────────────────────────────────── */}
      {searchState === 'idle' && !selectedId && (
        <div
          style={{
            padding: '10px 16px 12px',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {namespaces.map((ns) => {
            const nsInfo = getNamespaceLabel(ns);
            return (
              <span
                key={ns}
                style={{
                  padding: '2px 10px',
                  borderRadius: 100,
                  fontSize: 10,
                  background: 'var(--acmi-surface-2)',
                  color: 'var(--acmi-muted)',
                }}
              >
                {nsInfo.icon} {nsInfo.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AcmiEntitySearch;
