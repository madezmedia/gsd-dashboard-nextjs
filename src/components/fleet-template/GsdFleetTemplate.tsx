"use client";

/**
 * GSD Fleet Template — faithful port of Claude Design
 * GSD Fleet Template.dc.html (project a378a26c-7385-439b-9979-e939d6de1e62)
 *
 * Uses isolated --gsd-* CSS vars so Tailwind/shadcn tokens cannot break layout.
 */
import { useState } from "react";
import "./gsd-shell.css";
import { NAV, PAGE_TITLES, TENANTS, type Tone } from "./demo-data";
import { useCockpitData } from "@/hooks/useCockpitData";
import { useGsdFleetModel } from "./useGsdFleetModel";
import type { HitlTicket } from "@/store/useCockpitStore";
import type { TenantType } from "@/store/useCockpitStore";

function badgeTone(tone: Tone) {
  if (tone === "em") return "is-em";
  if (tone === "am") return "is-am";
  if (tone === "rb") return "is-rb";
  return "";
}

function barColor(tone: Tone | "primary" | "soft") {
  if (tone === "em") return "var(--gsd-em)";
  if (tone === "rb") return "var(--gsd-rb)";
  if (tone === "primary") return "var(--gsd-primary)";
  return "var(--gsd-soft)";
}

export function GsdFleetTemplate() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [page, setPage] = useState("overview");
  const { handleForceSync, handleResolveHitl } = useCockpitData();
  const m = useGsdFleetModel();

  const [pageTitle, pageEyebrow] = PAGE_TITLES[page] || PAGE_TITLES.overview;
  const tenant = m.activeTenant;
  const setTenant = (t: string) => m.setActiveTenant(t as TenantType);
  const FEED = m.feed;
  const HITL = m.hitl;
  const services = m.services;
  const servicesFull = m.servicesFull;
  const KANBAN = m.kanban;
  const AGENTS = m.agents;
  const TENANT_CARDS = m.tenantCards;
  const k = m.kpis;
  const pipe = m.pipelineCounts;

  return (
    <div className="gsd-shell" data-theme={theme}>
      <aside className="gsd-aside">
        <div className="gsd-brand">
          <div className="gsd-mark">[A]</div>
          <div>
            <span className="gsd-brand-title">ACMI Fleet</span>
            <span className="gsd-brand-sub">GSD Cockpit</span>
          </div>
        </div>

        <nav className="gsd-nav">
          {NAV.map((cat) => (
            <div key={cat.title}>
              <span className="gsd-nav-cat-title">{cat.title}</span>
              {cat.items.map((it) => {
                const active = page === it.key;
                return (
                  <button
                    key={it.key}
                    type="button"
                    className={`gsd-nav-item${active ? " is-active" : ""}`}
                    onClick={() => setPage(it.key)}
                  >
                    <span className="gsd-nav-dot" />
                    <span className="gsd-nav-label">{it.label}</span>
                    {it.badge ? <span className="gsd-nav-badge">{it.badge}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="gsd-aside-foot">
          <span className="gsd-aside-ver">ACMI v1.4</span>
          <button
            type="button"
            className="gsd-btn-ghost"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </aside>

      <div className="gsd-main">
        <header className="gsd-topbar">
          <div>
            <span className="gsd-page-title">{pageTitle}</span>
            <span className="gsd-page-eyebrow">{pageEyebrow}</span>
          </div>
          <div className="gsd-top-actions">
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {TENANTS.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`gsd-tenant${tenant === label ? " is-active" : ""}`}
                  onClick={() => setTenant(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="gsd-divider-v" />
            <div className="gsd-connected" style={{ color: m.connected ? "var(--gsd-em)" : "var(--gsd-rb)" }}>
              <span
                className={`gsd-connected-dot${m.connected ? " gsd-pulse" : ""}`}
                style={{ background: m.connected ? "var(--gsd-em)" : "var(--gsd-rb)" }}
              />
              <span>
                {m.loading
                  ? "[SYNCING]"
                  : m.connected
                    ? "[CONNECTED]"
                    : "[STALLED]"}
              </span>
            </div>
            <button
              type="button"
              className="gsd-btn-primary"
              disabled={m.forcingSync}
              onClick={() => handleForceSync()}
            >
              {m.forcingSync ? "Syncing…" : "Sync State"}
            </button>
          </div>
        </header>

        <div className="gsd-content">
          {page === "overview" && (
            <>
              <div className="gsd-kpis">
                <div className="gsd-kpi">
                  <p className="gsd-kpi-label">Total Swarms</p>
                  <span className="gsd-kpi-value">{k.totalAgents}</span>
                  <p className="gsd-kpi-desc">registered profiles</p>
                </div>
                <div className="gsd-kpi">
                  <p className="gsd-kpi-label">Active Agents</p>
                  <span className="gsd-kpi-value is-em">{k.activeAgents}</span>
                  <p className="gsd-kpi-desc">heartbeat &lt; 5m</p>
                </div>
                <div className="gsd-kpi">
                  <p className="gsd-kpi-label">Microservices</p>
                  <span className="gsd-kpi-value">{k.servicesOnline}/{k.servicesTotal || "—"}</span>
                  <p className="gsd-kpi-desc">verified online</p>
                </div>
                <div className="gsd-kpi">
                  <p className="gsd-kpi-label">Work Registry</p>
                  <span className="gsd-kpi-value">{k.activeWork}/{k.totalWork}</span>
                  <p className="gsd-kpi-desc">active / total</p>
                </div>
                <div className={`gsd-kpi${k.urgent > 0 ? " is-urgent" : ""}`}>
                  <p className="gsd-kpi-label">Urgent Tasks</p>
                  <span className="gsd-kpi-value">{k.urgent}</span>
                  <p className="gsd-kpi-desc">HITL + stalled</p>
                </div>
              </div>

              <div className="gsd-overview-grid">
                <div className="gsd-stack">
                  <section className="gsd-panel">
                    <div className="gsd-panel-head">
                      <span className="gsd-panel-title">[Console Activity Stream]</span>
                      <span className="gsd-chip">{FEED.length} events</span>
                    </div>
                    <div className="gsd-feed">
                      {FEED.length === 0 ? (
                        <div className="gsd-feed-row" style={{ color: "var(--gsd-soft)", font: "400 11px var(--gsd-font-mono)" }}>No live events yet — waiting for ACMI / bus…</div>
                      ) : null}
                      {FEED.map((e) => (
                        <div key={e.key} className="gsd-feed-row">
                          <div className="gsd-feed-main">
                            <span className="gsd-feed-t">[{e.t}]</span>
                            <span className="gsd-feed-src">{e.src}</span>
                            <span className="gsd-feed-sum">{e.sum}</span>
                          </div>
                          <span className={`gsd-badge ${badgeTone(e.tone)}`}>{e.kind}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="gsd-panel">
                    <div className="gsd-panel-head">
                      <span className="gsd-panel-title">[Pipeline Summary]</span>
                      <span className="gsd-chip">
                        {pipe.total} items ·{" "}
                        <button type="button" className="gsd-link" onClick={() => setPage("pipeline")}>
                          view all
                        </button>
                      </span>
                    </div>
                    <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div className="gsd-pipe-bar">
                        <div style={{ width: "38%", background: "var(--gsd-soft)", opacity: 0.5 }} />
                        <div style={{ width: "30%", background: "var(--gsd-em)" }} />
                        <div style={{ width: "6%", background: "var(--gsd-rb)" }} />
                        <div style={{ width: "26%", background: "var(--gsd-primary)" }} />
                      </div>
                    </div>
                    <div className="gsd-pipe-stats">
                      {[
                        { n: "Backlog", c: String(pipe.backlog), col: "var(--gsd-soft)", op: 0.6 },
                        { n: "Active", c: String(pipe.active), col: "var(--gsd-em)", op: 1 },
                        { n: "Stalled", c: String(pipe.stalled), col: "var(--gsd-rb)", op: 1, val: "var(--gsd-rb)" },
                        { n: "Completed", c: String(pipe.completed), col: "var(--gsd-primary)", op: 1 },
                      ].map((x) => (
                        <div key={x.n} className="gsd-pipe-stat">
                          <span
                            className="gsd-pipe-stat-dot"
                            style={{ background: x.col, opacity: x.op }}
                          />
                          <span className="gsd-pipe-stat-label">{x.n}</span>
                          <span className="gsd-pipe-stat-val" style={{ color: x.val || "var(--gsd-fg)" }}>
                            {x.c}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="gsd-stack">
                  <section className="gsd-hitl">
                    <div className="gsd-hitl-head">
                      <span className="gsd-hitl-head-title">Decision Queue · {HITL.length}</span>
                      <button type="button" className="gsd-link" style={{ color: "var(--gsd-am)" }} onClick={() => setPage("approvals")}>
                        View all →
                      </button>
                    </div>
                    <div className="gsd-hitl-body">
                      {HITL.length === 0 ? (
                        <div style={{ font: "400 10px var(--gsd-font-mono)", color: "var(--gsd-soft)" }}>
                          Queue clear — no HITL escalations
                        </div>
                      ) : null}
                      {HITL.slice(0, 2).map((h) => (
                        <div key={h.member + h.when + h.summary.slice(0, 20)} className="gsd-hitl-card">
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              font: "400 9px var(--gsd-font-mono)",
                              color: "var(--gsd-soft)",
                            }}
                          >
                            <span style={{ fontWeight: 700, textTransform: "uppercase", color: "var(--gsd-fg)" }}>
                              {h.member}
                            </span>
                            <span>{h.when}</span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              font: "500 10px/1.5 var(--gsd-font-mono)",
                              color: "var(--gsd-fg)",
                            }}
                          >
                            {h.summary}
                          </p>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="gsd-btn-em"
                              disabled={m.actioningMember === h.ticket.member}
                              onClick={() => handleResolveHitl(h.ticket as HitlTicket, "approve")}
                            >
                              {m.actioningMember === h.ticket.member ? "…" : "Approve"}
                            </button>
                            <button
                              type="button"
                              className="gsd-btn-outline"
                              disabled={m.actioningMember === h.ticket.member}
                              onClick={() => handleResolveHitl(h.ticket as HitlTicket, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="gsd-panel">
                    <div className="gsd-panel-head">
                      <span className="gsd-panel-title">[Services Health]</span>
                      <button type="button" className="gsd-link" onClick={() => setPage("services")}>
                        View all →
                      </button>
                    </div>
                    <div style={{ padding: "10px 14px" }}>
                      {services.map((s) => (
                        <div key={s.slug} className="gsd-svc-row">
                          <span
                            style={{
                              font: "700 9px var(--gsd-font-mono)",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: "var(--gsd-fg)",
                            }}
                          >
                            {s.slug}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ font: "400 8.5px var(--gsd-font-mono)", color: "var(--gsd-soft)" }}>
                              {s.lat}
                            </span>
                            <span
                              className={`gsd-status-dot ${s.up ? "is-up gsd-pulse" : "is-down"}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}

          {page === "approvals" && (
            <>
              <section className="gsd-panel" style={{ borderColor: "var(--gsd-border)" }}>
                <div
                  className="gsd-panel-head"
                  style={{ background: "var(--gsd-am-bg)", borderBottomColor: "var(--gsd-border)" }}
                >
                  <span className="gsd-panel-title" style={{ color: "var(--gsd-am)" }}>
                    Pending Approvals · {HITL.length}
                  </span>
                  <span
                    className="gsd-chip"
                    style={{ color: "var(--gsd-am)", borderColor: "var(--gsd-border)" }}
                  >
                    Requires operator action
                  </span>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {HITL.length === 0 ? (
                    <div style={{ font: "400 11px var(--gsd-font-mono)", color: "var(--gsd-soft)" }}>
                      No pending approvals in ACMI queue.
                    </div>
                  ) : null}
                  {HITL.map((h) => (
                    <div key={h.member + h.tag + h.summary.slice(0, 24)} className="gsd-approval-row">
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span className="gsd-tag">{h.tag}</span>
                          <span
                            style={{
                              font: "700 10px var(--gsd-font-mono)",
                              textTransform: "uppercase",
                              color: "var(--gsd-fg)",
                            }}
                          >
                            {h.member}
                          </span>
                          <span style={{ font: "400 10px var(--gsd-font-mono)", color: "var(--gsd-soft)" }}>
                            {h.when}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            font: "500 11px/1.5 var(--gsd-font-mono)",
                            color: "var(--gsd-fg)",
                            background: "var(--gsd-panel)",
                            border: "1px solid var(--gsd-hair)",
                            borderRadius: 3,
                            padding: "8px 10px",
                          }}
                        >
                          {h.summary}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8, width: 212, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="gsd-btn-em"
                          style={{ height: 30 }}
                          disabled={m.actioningMember === h.ticket.member}
                          onClick={() => handleResolveHitl(h.ticket as HitlTicket, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="gsd-btn-outline"
                          style={{ height: 30 }}
                          disabled={m.actioningMember === h.ticket.member}
                          onClick={() => handleResolveHitl(h.ticket as HitlTicket, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="gsd-panel">
                <div className="gsd-panel-head">
                  <span className="gsd-panel-title">[Recent Fleet Events]</span>
                </div>
                <div className="gsd-feed">
                  {FEED.slice(0, 8).map((h) => (
                    <div key={h.key} className="gsd-feed-row" style={{ font: "400 11px var(--gsd-font-mono)" }}>
                      <span style={{ width: 64, color: "var(--gsd-soft)" }}>{h.t}</span>
                      <span style={{ width: 130, fontWeight: 700, color: "var(--gsd-fg)" }}>{h.src}</span>
                      <span className="gsd-feed-sum" style={{ flex: 1 }}>
                        {h.sum}
                      </span>
                      <span className={`gsd-badge ${badgeTone(h.tone)}`} style={{ fontSize: 9 }}>
                        {h.kind}
                      </span>
                    </div>
                  ))}
                  {FEED.length === 0 ? (
                    <div style={{ padding: 12, font: "400 11px var(--gsd-font-mono)", color: "var(--gsd-soft)" }}>
                      Waiting for ACMI timeline / bus events…
                    </div>
                  ) : null}
                </div>
              </section>
            </>
          )}

          {(page === "pipeline" || page === "activity") && (
            <section className="gsd-panel">
              <div className="gsd-panel-head">
                <span className="gsd-panel-title">[Work Item Pipeline]</span>
                <span className="gsd-chip">{pipe.total} total · scope: {tenant}</span>
              </div>
              <div className="gsd-kanban">
                {KANBAN.map((col) => (
                  <div key={col.name} className="gsd-kanban-col">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--gsd-hair)",
                        paddingBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          font: "700 10px var(--gsd-font-mono)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--gsd-fg)",
                        }}
                      >
                        {col.name}
                      </span>
                      <span className={`gsd-badge ${badgeTone(col.tone)}`} style={{ fontSize: 9 }}>
                        {col.count}
                      </span>
                    </div>
                    {col.items.map((w) => (
                      <div key={w.id} className="gsd-work-card">
                        <span
                          style={{
                            font: "700 9px var(--gsd-font-mono)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--gsd-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {w.id}
                        </span>
                        <p
                          style={{
                            margin: 0,
                            font: "600 11px/1.4 var(--gsd-font-sans)",
                            color: "var(--gsd-fg)",
                          }}
                        >
                          {w.title}
                        </p>
                        <div className="gsd-progress">
                          <span
                            style={{
                              width: `${Math.max(w.progress, 2)}%`,
                              background: barColor(
                                w.progress === 100
                                  ? "primary"
                                  : col.tone === "rb"
                                    ? "rb"
                                    : col.tone === "em"
                                      ? "em"
                                      : "soft",
                              ),
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            font: "400 9px var(--gsd-font-mono)",
                            color: "var(--gsd-soft)",
                          }}
                        >
                          <span>{w.progress}%</span>
                          <span>{w.owner}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {page === "agents" && (
            <div className="gsd-agent-grid">
              {AGENTS.map((a) => (
                <div key={a.id} className="gsd-agent-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        font: "700 11px var(--gsd-font-mono)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--gsd-fg)",
                      }}
                    >
                      {a.id}
                    </span>
                    <span className={`gsd-status-dot ${a.up ? "is-up gsd-pulse" : "is-down"}`} />
                  </div>
                  <p style={{ margin: 0, font: "500 10px var(--gsd-font-mono)", color: "var(--gsd-muted)" }}>
                    {a.role}
                  </p>
                  <div style={{ borderTop: "1px solid var(--gsd-hair)", paddingTop: 9 }}>
                    <span
                      style={{
                        font: "600 8px var(--gsd-font-mono)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--gsd-soft)",
                      }}
                    >
                      Current work
                    </span>
                    <p
                      style={{
                        margin: "5px 0 0",
                        font: "400 11px var(--gsd-font-sans)",
                        color: "var(--gsd-fg)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.work}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      font: "400 9px var(--gsd-font-mono)",
                      color: "var(--gsd-soft)",
                    }}
                  >
                    <span>Last seen: {a.seen}</span>
                    <span>{a.tenant}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {page === "services" && (
            <section className="gsd-panel">
              <div className="gsd-panel-head">
                <span className="gsd-panel-title">[Services Health Matrix]</span>
                <span className="gsd-chip">{k.servicesOnline} of {k.servicesTotal} online</span>
              </div>
              <div style={{ padding: "8px 16px 12px" }}>
                {servicesFull.map((s) => (
                  <div
                    key={s.slug}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "9px 0",
                      borderBottom: "1px solid var(--gsd-hair)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className={`gsd-status-dot ${s.up ? "is-up gsd-pulse" : "is-down"}`} />
                    <span
                      style={{
                        width: 150,
                        font: "700 10px var(--gsd-font-mono)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--gsd-fg)",
                      }}
                    >
                      {s.slug}
                    </span>
                    <span style={{ flex: 1, font: "400 11px var(--gsd-font-sans)", color: "var(--gsd-muted)" }}>
                      {s.name}
                    </span>
                    <span style={{ width: 70, font: "400 9px var(--gsd-font-mono)", color: "var(--gsd-soft)" }}>
                      {s.lat}
                    </span>
                    <span style={{ width: 110, font: "400 9px var(--gsd-font-mono)", color: "var(--gsd-soft)" }}>
                      {s.verified}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {page === "tenants" && (
            <div className="gsd-tenant-grid">
              {TENANT_CARDS.map((tc) => (
                <div key={tc.slug} className="gsd-tenant-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ font: "600 15px var(--gsd-font-serif)", color: "var(--gsd-fg)" }}>
                      {tc.name}
                    </span>
                    <span className="gsd-chip">{tc.plan}</span>
                  </div>
                  <p style={{ margin: 0, font: "400 11px var(--gsd-font-mono)", color: "var(--gsd-soft)" }}>
                    tenant key: acmi:{tc.slug}:*
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      borderTop: "1px solid var(--gsd-hair)",
                      paddingTop: 10,
                    }}
                  >
                    <div>
                      <span style={{ display: "block", font: "600 18px var(--gsd-font-serif)", color: "var(--gsd-fg)" }}>
                        {tc.agents}
                      </span>
                      <span
                        style={{
                          font: "500 8px var(--gsd-font-mono)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--gsd-soft)",
                        }}
                      >
                        Agents
                      </span>
                    </div>
                    <div>
                      <span style={{ display: "block", font: "600 18px var(--gsd-font-serif)", color: "var(--gsd-fg)" }}>
                        {tc.items}
                      </span>
                      <span
                        style={{
                          font: "500 8px var(--gsd-font-mono)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--gsd-soft)",
                        }}
                      >
                        Work items
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          display: "block",
                          font: "600 18px var(--gsd-font-serif)",
                          color:
                            tc.urgentTone === "em"
                              ? "var(--gsd-em)"
                              : tc.urgentTone === "rb"
                                ? "var(--gsd-rb)"
                                : "var(--gsd-am)",
                        }}
                      >
                        {tc.urgent}
                      </span>
                      <span
                        style={{
                          font: "500 8px var(--gsd-font-mono)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--gsd-soft)",
                        }}
                      >
                        Urgent
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!["overview", "approvals", "pipeline", "activity", "agents", "services", "tenants"].includes(
            page,
          ) && (
            <section className="gsd-panel">
              <div className="gsd-panel-head">
                <span className="gsd-panel-title">[{pageTitle}]</span>
              </div>
              <div style={{ padding: 24, font: "400 11px var(--gsd-font-mono)", color: "var(--gsd-muted)" }}>
                Placeholder for <strong style={{ color: "var(--gsd-fg)" }}>{page}</strong> — IA slot from
                GSD Fleet Template. Wire live ACMI next.
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
