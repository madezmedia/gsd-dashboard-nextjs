"use client";

/**
 * Approach A: GSD chrome + real ACMI dashboard components.
 * Spec: docs/superpowers/specs/2026-07-20-gsd-real-components-shell-design.md
 */
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCockpitData } from "@/hooks/useCockpitData";
import { useCockpitStore, type TenantType } from "@/store/useCockpitStore";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { OperationsBoard } from "@/components/dashboard/OperationsBoard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { GatewayServices } from "@/components/dashboard/GatewayServices";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { RefreshCw } from "lucide-react";
import "./gsd-shell.css";
import "./gsd-components.css";

const NAV = [
  {
    title: "Operate",
    items: [
      { href: "/", label: "Overview", badge: "LIVE" },
      { href: "/hitl", label: "Approvals", badge: "HITL" },
      { href: "/acmi", label: "Activity", badge: "BUS" },
    ],
  },
  {
    title: "Work",
    items: [
      { href: "/workflows", label: "Pipeline", badge: "" },
      { href: "/todo", label: "Kanban", badge: "KBN" },
      { href: "/calendar", label: "Calendar", badge: "" },
    ],
  },
  {
    title: "Agents",
    items: [
      { href: "/agents", label: "Agents", badge: "" },
      { href: "/a2a", label: "Comms Graph", badge: "" },
      { href: "/voice", label: "Voice", badge: "" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/services", label: "Services", badge: "SYS" },
      { href: "/integrations", label: "Integrations", badge: "" },
      { href: "/settings", label: "Settings", badge: "" },
      { href: "/legacy-cockpit", label: "Legacy UI", badge: "" },
    ],
  },
];

const TENANTS: TenantType[] = ["all", "madez", "duane", "suzanne", "avery"];

export function GsdFleetHome() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const { handleForceSync, handleResolveHitl } = useCockpitData();
  const { rollup, activeTenant, setActiveTenant, syncStatus, forcingSync } = useCockpitStore();

  const connected = syncStatus !== "stalled";
  const loading = !rollup && (syncStatus === "syncing" || forcingSync);

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
                const active =
                  it.href === "/"
                    ? pathname === "/"
                    : pathname === it.href || pathname.startsWith(`${it.href}/`);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`gsd-nav-item${active ? " is-active" : ""}`}
                  >
                    <span className="gsd-nav-dot" />
                    <span className="gsd-nav-label">{it.label}</span>
                    {it.badge ? <span className="gsd-nav-badge">{it.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="gsd-aside-foot">
          <span className="gsd-aside-ver">ACMI v1.4 · live</span>
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
            <span className="gsd-page-title">Overview</span>
            <span className="gsd-page-eyebrow">Operate / Live ACMI</span>
          </div>
          <div className="gsd-top-actions">
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {TENANTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`gsd-tenant${activeTenant === t ? " is-active" : ""}`}
                  onClick={() => setActiveTenant(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="gsd-divider-v" />
            <div
              className="gsd-connected"
              style={{ color: connected ? "var(--gsd-em)" : "var(--gsd-rb)" }}
            >
              <span
                className={`gsd-connected-dot${connected ? " gsd-pulse" : ""}`}
                style={{ background: connected ? "var(--gsd-em)" : "var(--gsd-rb)" }}
              />
              <span>
                {loading
                  ? "[SYNCING]"
                  : syncStatus === "stalled"
                    ? "[STALLED]"
                    : syncStatus === "syncing"
                      ? "[SYNCING]"
                      : "[CONNECTED]"}
              </span>
            </div>
            <button
              type="button"
              className="gsd-btn-primary"
              disabled={forcingSync}
              onClick={() => handleForceSync()}
            >
              {forcingSync ? "Syncing…" : "Sync State"}
            </button>
          </div>
        </header>

        <div className="gsd-content">
          {!rollup ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 280,
                gap: 12,
                fontFamily: "var(--gsd-font-mono)",
                color: "var(--gsd-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: 10,
              }}
            >
              <RefreshCw style={{ width: 20, height: 20, color: "var(--gsd-primary)" }} />
              Establishing link with Fleet Command…
            </div>
          ) : (
            <div className="gsd-compose">
              <div className="gsd-kpi-strip">
                <KpiGrid />
              </div>
              <OperationsBoard handleResolveHitl={handleResolveHitl} />
              <div className="gsd-compose-split">
                <ActivityFeed />
                <GatewayServices handleResolveHitl={handleResolveHitl} />
              </div>
              <KanbanBoard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
