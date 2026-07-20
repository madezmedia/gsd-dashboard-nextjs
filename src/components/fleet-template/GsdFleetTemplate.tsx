"use client";

/**
 * GSD Fleet Template — implemented from Claude Design
 * project a378a26c-7385-439b-9979-e939d6de1e62 · GSD Fleet Template.dc.html
 */
import { useMemo, useState, type ReactNode } from "react";
import "./gsd-tokens.css";
import {
  AGENTS,
  FEED,
  HISTORY,
  HITL,
  KANBAN,
  NAV,
  PAGE_TITLES,
  SERVICES_RAW,
  TENANT_CARDS,
  TENANTS,
  type Tone,
} from "./demo-data";

type PageKey = string;

function badgeClass(tone: Tone) {
  if (tone === "em") return "text-[var(--em)] bg-[var(--em-bg)]";
  if (tone === "am") return "text-[var(--am)] bg-[var(--am-bg)]";
  if (tone === "rb") return "text-[var(--rb)] bg-[var(--rb-bg)]";
  return "text-[var(--muted)] bg-[var(--panel)]";
}

function barColor(tone: Tone | "primary" | "soft") {
  if (tone === "em") return "var(--em)";
  if (tone === "rb") return "var(--rb)";
  if (tone === "primary") return "var(--primary)";
  return "var(--soft)";
}

export function GsdFleetTemplate() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [tenant, setTenant] = useState<string>("all");
  const [page, setPage] = useState<PageKey>("overview");

  const [pageTitle, pageEyebrow] = PAGE_TITLES[page] || PAGE_TITLES.overview;
  const isOverview = page === "overview";
  const isApprovals = page === "approvals";
  const isPipeline = page === "pipeline" || page === "activity";
  const isAgents = page === "agents";
  const isServices = page === "services";
  const isTenants = page === "tenants";

  const services = useMemo(() => SERVICES_RAW.slice(0, 6), []);
  const servicesFull = useMemo(
    () =>
      SERVICES_RAW.map((s) => ({
        ...s,
        verified: s.up ? "verified 2m ago" : "unreachable",
      })),
    [],
  );

  return (
    <div
      className="gsd flex min-h-screen w-full"
      data-theme={theme}
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      {/* Sidebar */}
      <aside
        className="hidden w-56 shrink-0 flex-col border-r md:flex"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div
          className="flex h-14 items-center gap-2.5 border-b px-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="font-mono flex h-[30px] w-[30px] items-center justify-center rounded text-[11px] font-bold"
            style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
          >
            [A]
          </div>
          <div className="flex flex-col">
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "var(--primary)" }}
            >
              ACMI Fleet
            </span>
            <span
              className="font-mono text-[8px] font-medium uppercase tracking-[0.12em]"
              style={{ color: "var(--soft)" }}
            >
              GSD Cockpit
            </span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-[18px] overflow-auto p-3.5">
          {NAV.map((cat) => (
            <div key={cat.title} className="flex flex-col gap-0.5">
              <span
                className="font-mono px-2.5 pb-1.5 text-[8.5px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "var(--soft)" }}
              >
                {cat.title}
              </span>
              {cat.items.map((it) => {
                const active = page === it.key;
                return (
                  <button
                    key={it.key}
                    type="button"
                    onClick={() => setPage(it.key)}
                    className="font-mono flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[10px] transition-colors"
                    style={{
                      fontWeight: active ? 700 : 500,
                      color: active ? "var(--primary)" : "var(--muted)",
                      background: active ? "var(--panel)" : "transparent",
                      border: active
                        ? "1px solid var(--border)"
                        : "1px solid transparent",
                    }}
                  >
                    <span
                      className="h-[5px] w-[5px] shrink-0 rounded-[1px] opacity-55"
                      style={{ background: "currentColor" }}
                    />
                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                    {it.badge ? (
                      <span
                        className="font-mono shrink-0 rounded-[2px] px-1 py-0.5 text-[7.5px] font-bold tracking-[0.08em]"
                        style={{
                          background: active ? "var(--primary)" : "var(--panel)",
                          color: active ? "var(--primary-fg)" : "var(--soft)",
                          border: active
                            ? "1px solid var(--primary)"
                            : "1px solid var(--hair)",
                        }}
                      >
                        {it.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div
          className="flex items-center justify-between border-t px-4 py-2.5"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="font-mono text-[8px] font-medium uppercase tracking-[0.14em]"
            style={{ color: "var(--soft)" }}
          >
            ACMI v1.4
          </span>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="font-mono h-6 rounded-[3px] border px-2 text-[8px] font-bold uppercase tracking-[0.12em]"
            style={{
              background: "var(--panel)",
              color: "var(--fg)",
              borderColor: "var(--border)",
            }}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-[22px]"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-base font-semibold" style={{ color: "var(--fg)" }}>
              {pageTitle}
            </span>
            <span
              className="font-mono hidden text-[9px] font-medium uppercase tracking-[0.16em] sm:inline"
              style={{ color: "var(--soft)" }}
            >
              {pageEyebrow}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-1.5 sm:flex">
              {TENANTS.map((label) => {
                const active = tenant === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setTenant(label)}
                    className="font-mono rounded px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] transition-all"
                    style={
                      active
                        ? {
                            background: "var(--primary)",
                            color: "var(--primary-fg)",
                            border: "1px solid var(--primary)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--muted)",
                            border: "1px solid var(--border)",
                          }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="hidden h-5 w-px sm:block" style={{ background: "var(--border)" }} />
            <div className="font-mono flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em]">
              <span
                className="gsd-pulse h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--em)" }}
              />
              <span style={{ color: "var(--em)" }}>[CONNECTED]</span>
            </div>
            <button
              type="button"
              className="font-mono h-7 rounded border px-2.5 text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{
                background: "var(--primary)",
                color: "var(--primary-fg)",
                borderColor: "var(--primary)",
              }}
            >
              Sync State
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-[18px] overflow-auto p-4 md:px-[22px] md:py-5">
          {isOverview && (
            <>
              {/* KPIs */}
              <div
                className="grid grid-cols-2 overflow-hidden rounded-md border md:grid-cols-5"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                {[
                  { label: "Total Swarms", value: "12", desc: "registered profiles", urgent: false },
                  { label: "Active Agents", value: "8", desc: "heartbeat < 5m", urgent: false, em: true },
                  { label: "Microservices", value: "9/11", desc: "verified online", urgent: false },
                  { label: "Work Registry", value: "14/47", desc: "active / total", urgent: false },
                  { label: "Urgent Tasks", value: "3", desc: "operator review", urgent: true },
                ].map((k, i) => (
                  <div
                    key={k.label}
                    className="px-5 py-4"
                    style={{
                      borderRight: i < 4 ? "1px solid var(--hair)" : undefined,
                      background: k.urgent ? "var(--am-bg)" : undefined,
                    }}
                  >
                    <p
                      className="font-mono mb-2.5 text-[9px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: k.urgent ? "var(--am)" : "var(--muted)" }}
                    >
                      {k.label}
                    </p>
                    <span
                      className="font-serif text-[28px] font-semibold leading-none"
                      style={{
                        color: k.urgent ? "var(--am)" : k.em ? "var(--em)" : "var(--fg)",
                      }}
                    >
                      {k.value}
                    </span>
                    <p
                      className="font-mono mt-2 text-[9px] font-medium"
                      style={{ color: k.urgent ? "var(--am)" : "var(--soft)" }}
                    >
                      {k.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-[18px] xl:grid-cols-[1fr_340px]">
                <div className="flex min-w-0 flex-col gap-[18px]">
                  {/* Activity */}
                  <Panel
                    title="[Console Activity Stream]"
                    right={
                      <span
                        className="font-mono rounded-[3px] border px-2 py-0.5 text-[9px] font-medium"
                        style={{
                          color: "var(--fg)",
                          background: "var(--panel)",
                          borderColor: "var(--hair)",
                        }}
                      >
                        142 events
                      </span>
                    }
                  >
                    <div className="px-4 pb-3 pt-2">
                      {FEED.map((e) => (
                        <div
                          key={e.t + e.src}
                          className="flex items-center justify-between gap-3 border-b py-1.5"
                          style={{ borderColor: "var(--hair)" }}
                        >
                          <div className="font-mono flex min-w-0 flex-1 items-center gap-2 text-[11px]">
                            <span className="shrink-0" style={{ color: "var(--soft)" }}>
                              [{e.t}]
                            </span>
                            <span className="shrink-0 font-bold" style={{ color: "var(--fg)" }}>
                              {e.src}
                            </span>
                            <span className="truncate" style={{ color: "var(--muted)" }}>
                              {e.sum}
                            </span>
                          </div>
                          <span
                            className={`font-mono shrink-0 rounded-[2px] border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] ${badgeClass(e.tone)}`}
                            style={{ borderColor: "var(--hair)" }}
                          >
                            {e.kind}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  {/* Pipeline summary */}
                  <Panel
                    title="[Pipeline Summary]"
                    right={
                      <span className="font-mono text-[9px]" style={{ color: "var(--soft)" }}>
                        47 items ·{" "}
                        <button
                          type="button"
                          onClick={() => setPage("pipeline")}
                          className="underline"
                          style={{ color: "var(--primary)" }}
                        >
                          view all
                        </button>
                      </span>
                    }
                  >
                    <div className="flex flex-col gap-2.5 px-4 py-3.5">
                      <div
                        className="flex h-2 overflow-hidden rounded border"
                        style={{ borderColor: "var(--hair)" }}
                      >
                        <div className="w-[38%] opacity-50" style={{ background: "var(--soft)" }} />
                        <div className="w-[30%]" style={{ background: "var(--em)" }} />
                        <div className="w-[6%]" style={{ background: "var(--rb)" }} />
                        <div className="w-[26%]" style={{ background: "var(--primary)" }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                        {[
                          { n: "Backlog", c: "18", col: "var(--soft)" },
                          { n: "Active", c: "14", col: "var(--em)" },
                          { n: "Stalled", c: "3", col: "var(--rb)", val: "var(--rb)" },
                          { n: "Completed", c: "12", col: "var(--primary)" },
                        ].map((x) => (
                          <div
                            key={x.n}
                            className="flex items-center gap-2 rounded border px-3 py-2"
                            style={{ borderColor: "var(--hair)", background: "var(--bg)" }}
                          >
                            <span
                              className="h-[7px] w-[7px] rounded-[2px]"
                              style={{ background: x.col, opacity: x.n === "Backlog" ? 0.6 : 1 }}
                            />
                            <span
                              className="font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
                              style={{ color: "var(--muted)" }}
                            >
                              {x.n}
                            </span>
                            <span
                              className="font-serif ml-auto text-sm font-semibold"
                              style={{ color: x.val || "var(--fg)" }}
                            >
                              {x.c}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Panel>
                </div>

                <div className="flex flex-col gap-[18px]">
                  {/* HITL */}
                  <div
                    className="overflow-hidden rounded-md border"
                    style={{ borderColor: "var(--am)", background: "var(--card)" }}
                  >
                    <div
                      className="flex items-center justify-between border-b px-3.5 py-2.5"
                      style={{ background: "var(--am-bg)", borderColor: "var(--border)" }}
                    >
                      <span
                        className="font-mono text-[9px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: "var(--am)" }}
                      >
                        Decision Queue · 3
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage("approvals")}
                        className="font-mono text-[8px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: "var(--am)" }}
                      >
                        View all →
                      </button>
                    </div>
                    <div className="flex flex-col gap-2.5 p-3.5">
                      {HITL.slice(0, 2).map((h) => (
                        <div
                          key={h.member + h.when}
                          className="flex flex-col gap-2 rounded border p-2.5"
                          style={{ borderColor: "var(--hair)", background: "var(--bg)" }}
                        >
                          <div
                            className="font-mono flex justify-between text-[9px]"
                            style={{ color: "var(--soft)" }}
                          >
                            <span className="font-bold uppercase" style={{ color: "var(--fg)" }}>
                              {h.member}
                            </span>
                            <span>{h.when}</span>
                          </div>
                          <p
                            className="font-mono m-0 text-[10px] font-medium leading-relaxed"
                            style={{ color: "var(--fg)" }}
                          >
                            {h.summary}
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              className="font-mono h-[26px] flex-1 rounded-[3px] text-[8px] font-bold uppercase tracking-[0.1em] text-white"
                              style={{ background: "var(--em)", border: "1px solid var(--em)" }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="font-mono h-[26px] flex-1 rounded-[3px] border text-[8px] font-bold uppercase tracking-[0.1em]"
                              style={{
                                background: "var(--card)",
                                color: "var(--fg)",
                                borderColor: "var(--border)",
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Panel
                    title="[Services Health]"
                    right={
                      <button
                        type="button"
                        onClick={() => setPage("services")}
                        className="font-mono text-[8px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: "var(--primary)" }}
                      >
                        View all →
                      </button>
                    }
                  >
                    <div className="flex flex-col px-3.5 py-2.5">
                      {services.map((s) => (
                        <div
                          key={s.slug}
                          className="flex items-center justify-between gap-2 border-b py-1.5"
                          style={{ borderColor: "var(--hair)" }}
                        >
                          <span
                            className="font-mono text-[9px] font-bold uppercase tracking-[0.06em]"
                            style={{ color: "var(--fg)" }}
                          >
                            {s.slug}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[8.5px]" style={{ color: "var(--soft)" }}>
                              {s.lat}
                            </span>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${s.up ? "gsd-pulse" : ""}`}
                              style={{ background: s.up ? "var(--em)" : "var(--rb)" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            </>
          )}

          {isApprovals && (
            <>
              <div
                className="overflow-hidden rounded-md border"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <div
                  className="flex items-center justify-between border-b px-4 py-2.5"
                  style={{ background: "var(--am-bg)", borderColor: "var(--border)" }}
                >
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "var(--am)" }}
                  >
                    Pending Approvals · 3
                  </span>
                  <span
                    className="font-mono rounded-[3px] border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      color: "var(--am)",
                      background: "var(--card)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Requires operator action
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 p-4">
                  {HITL.map((h) => (
                    <div
                      key={h.member + h.tag}
                      className="flex flex-col items-stretch justify-between gap-4 rounded border p-3 md:flex-row md:items-center"
                      style={{ borderColor: "var(--hair)", background: "var(--bg)" }}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className="font-mono rounded-[2px] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white"
                            style={{ background: "var(--am)" }}
                          >
                            {h.tag}
                          </span>
                          <span
                            className="font-mono text-[10px] font-bold uppercase"
                            style={{ color: "var(--fg)" }}
                          >
                            {h.member}
                          </span>
                          <span className="font-mono text-[10px]" style={{ color: "var(--soft)" }}>
                            {h.when}
                          </span>
                        </div>
                        <p
                          className="font-mono m-0 rounded-[3px] border p-2 text-[11px] font-medium leading-relaxed"
                          style={{
                            color: "var(--fg)",
                            background: "var(--panel)",
                            borderColor: "var(--hair)",
                          }}
                        >
                          {h.summary}
                        </p>
                      </div>
                      <div className="flex w-full shrink-0 gap-2 md:w-[212px] md:justify-end">
                        <button
                          type="button"
                          className="font-mono h-[30px] flex-1 rounded border text-[9px] font-bold uppercase tracking-[0.1em] text-white md:w-[98px] md:flex-none"
                          style={{ background: "var(--em)", borderColor: "var(--em)" }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="font-mono h-[30px] flex-1 rounded border text-[9px] font-bold uppercase tracking-[0.1em] md:w-[98px] md:flex-none"
                          style={{
                            background: "var(--card)",
                            color: "var(--fg)",
                            borderColor: "var(--border)",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Panel title="[Resolution History]">
                <div className="px-4 pb-3 pt-2">
                  {HISTORY.map((h) => (
                    <div
                      key={h.t + h.member}
                      className="font-mono flex items-center gap-3 border-b py-2 text-[11px]"
                      style={{ borderColor: "var(--hair)" }}
                    >
                      <span className="w-16" style={{ color: "var(--soft)" }}>
                        {h.t}
                      </span>
                      <span className="w-[130px] font-bold" style={{ color: "var(--fg)" }}>
                        {h.member}
                      </span>
                      <span className="min-w-0 flex-1 truncate" style={{ color: "var(--muted)" }}>
                        {h.summary}
                      </span>
                      <span
                        className={`rounded-[2px] border px-1.5 py-0.5 text-[9px] font-bold uppercase ${badgeClass(h.tone)}`}
                        style={{ borderColor: "var(--hair)" }}
                      >
                        {h.result}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {isPipeline && (
            <Panel
              title="[Work Item Pipeline]"
              right={
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.08em]"
                  style={{ color: "var(--soft)" }}
                >
                  47 total · scope: {tenant}
                </span>
              }
            >
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                {KANBAN.map((col) => (
                  <div
                    key={col.name}
                    className="flex flex-col gap-2 rounded border p-3"
                    style={{ borderColor: "var(--hair)", background: "var(--bg)" }}
                  >
                    <div
                      className="flex items-center justify-between border-b pb-2"
                      style={{ borderColor: "var(--hair)" }}
                    >
                      <span
                        className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: "var(--fg)" }}
                      >
                        {col.name}
                      </span>
                      <span
                        className={`font-mono rounded-[2px] border px-1.5 py-0.5 text-[9px] font-bold uppercase ${badgeClass(col.tone)}`}
                        style={{ borderColor: "var(--hair)" }}
                      >
                        {col.count}
                      </span>
                    </div>
                    {col.items.map((w) => (
                      <div
                        key={w.id}
                        className="flex flex-col gap-1 rounded-[3px] border p-2.5"
                        style={{ borderColor: "var(--hair)", background: "var(--card)" }}
                      >
                        <span
                          className="font-mono truncate text-[9px] font-bold uppercase tracking-[0.06em]"
                          style={{ color: "var(--muted)" }}
                        >
                          {w.id}
                        </span>
                        <p
                          className="m-0 text-[11px] font-semibold leading-snug"
                          style={{ color: "var(--fg)" }}
                        >
                          {w.title}
                        </p>
                        <div
                          className="h-[3px] overflow-hidden rounded"
                          style={{ background: "var(--hair)" }}
                        >
                          <div
                            className="h-full"
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
                          className="font-mono flex justify-between text-[9px]"
                          style={{ color: "var(--soft)" }}
                        >
                          <span>{w.progress}%</span>
                          <span>{w.owner}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {isAgents && (
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {AGENTS.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-2.5 rounded-md border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg)" }}
                    >
                      {a.id}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${a.up ? "gsd-pulse" : ""}`}
                      style={{ background: a.up ? "var(--em)" : "var(--rb)" }}
                    />
                  </div>
                  <p className="font-mono m-0 text-[10px] font-medium" style={{ color: "var(--muted)" }}>
                    {a.role}
                  </p>
                  <div
                    className="flex flex-col gap-1 border-t pt-2"
                    style={{ borderColor: "var(--hair)" }}
                  >
                    <span
                      className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--soft)" }}
                    >
                      Current work
                    </span>
                    <p className="m-0 truncate text-[11px]" style={{ color: "var(--fg)" }}>
                      {a.work}
                    </p>
                  </div>
                  <div
                    className="font-mono flex justify-between text-[9px]"
                    style={{ color: "var(--soft)" }}
                  >
                    <span>Last seen: {a.seen}</span>
                    <span>{a.tenant}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isServices && (
            <Panel
              title="[Services Health Matrix]"
              right={
                <span className="font-mono text-[9px]" style={{ color: "var(--soft)" }}>
                  9 of 11 online
                </span>
              }
            >
              <div className="px-4 pb-3 pt-2">
                {servicesFull.map((s) => (
                  <div
                    key={s.slug}
                    className="flex flex-wrap items-center gap-3 border-b py-2"
                    style={{ borderColor: "var(--hair)" }}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${s.up ? "gsd-pulse" : ""}`}
                      style={{ background: s.up ? "var(--em)" : "var(--rb)" }}
                    />
                    <span
                      className="font-mono w-[150px] text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg)" }}
                    >
                      {s.slug}
                    </span>
                    <span className="min-w-0 flex-1 text-[11px]" style={{ color: "var(--muted)" }}>
                      {s.name}
                    </span>
                    <span className="font-mono w-[70px] text-[9px]" style={{ color: "var(--soft)" }}>
                      {s.lat}
                    </span>
                    <span className="font-mono w-[110px] text-[9px]" style={{ color: "var(--soft)" }}>
                      {s.verified}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {isTenants && (
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {TENANT_CARDS.map((tc) => (
                <div
                  key={tc.slug}
                  className="flex flex-col gap-3 rounded-md border p-[18px]"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[15px] font-semibold" style={{ color: "var(--fg)" }}>
                      {tc.name}
                    </span>
                    <span
                      className="font-mono rounded-[3px] border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em]"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--panel)",
                        color: "var(--muted)",
                      }}
                    >
                      {tc.plan}
                    </span>
                  </div>
                  <p className="font-mono m-0 text-[11px]" style={{ color: "var(--soft)" }}>
                    tenant key: acmi:{tc.slug}:*
                  </p>
                  <div
                    className="grid grid-cols-3 border-t pt-2.5"
                    style={{ borderColor: "var(--hair)" }}
                  >
                    <div>
                      <span className="font-serif block text-lg font-semibold" style={{ color: "var(--fg)" }}>
                        {tc.agents}
                      </span>
                      <span
                        className="font-mono text-[8px] font-medium uppercase tracking-[0.08em]"
                        style={{ color: "var(--soft)" }}
                      >
                        Agents
                      </span>
                    </div>
                    <div>
                      <span className="font-serif block text-lg font-semibold" style={{ color: "var(--fg)" }}>
                        {tc.items}
                      </span>
                      <span
                        className="font-mono text-[8px] font-medium uppercase tracking-[0.08em]"
                        style={{ color: "var(--soft)" }}
                      >
                        Work items
                      </span>
                    </div>
                    <div>
                      <span
                        className="font-serif block text-lg font-semibold"
                        style={{
                          color:
                            tc.urgentTone === "em"
                              ? "var(--em)"
                              : tc.urgentTone === "rb"
                                ? "var(--rb)"
                                : "var(--am)",
                        }}
                      >
                        {tc.urgent}
                      </span>
                      <span
                        className="font-mono text-[8px] font-medium uppercase tracking-[0.08em]"
                        style={{ color: "var(--soft)" }}
                      >
                        Urgent
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isOverview &&
            !isApprovals &&
            !isPipeline &&
            !isAgents &&
            !isServices &&
            !isTenants && (
              <Panel title={`[${pageTitle}]`}>
                <div className="font-mono p-6 text-[11px]" style={{ color: "var(--muted)" }}>
                  Placeholder view for <strong style={{ color: "var(--fg)" }}>{page}</strong> —
                  structure matches GSD Fleet Template IA. Wire live ACMI data next.
                </div>
              </Panel>
            )}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: "var(--hair)" }}
      >
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: "var(--muted)" }}
        >
          {title}
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}
