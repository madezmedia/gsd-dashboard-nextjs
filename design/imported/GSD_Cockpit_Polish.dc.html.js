class Component extends DCLogic {
  state = { themeA: "light", themeB: "dark", themeC: "light", tenantA: "madez", tenantB: "all", tenantC: "madez" };
  mkToggle(k) { return () => this.setState(s => ({ [k]: s[k] === "light" ? "dark" : "light" })); }
  mkTenants(key, small) {
    const active = this.state[key];
    return ["all", "madez", "duane", "suzanne", "avery"].map(label => ({
      label,
      pick: () => this.setState({ [key]: label }),
      style: Object.assign({
        padding: small ? "4px 9px" : "6px 12px",
        fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", fontWeight: 700,
        letterSpacing: ".12em", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer",
        transition: "all .15s"
      }, label === active
        ? { background: "var(--primary)", color: "var(--primary-fg)", border: "1px solid var(--primary)" }
        : { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" })
    }));
  }
  renderVals() {
    const badge = tone => ({
      flexShrink: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "8px", fontWeight: 700,
      letterSpacing: ".08em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "2px",
      border: "1px solid var(--hair)",
      color: tone === "em" ? "var(--em)" : tone === "am" ? "var(--am)" : tone === "rb" ? "var(--rb)" : "var(--muted)",
      background: tone === "em" ? "var(--em-bg)" : tone === "am" ? "var(--am-bg)" : tone === "rb" ? "var(--rb-bg)" : "var(--panel)"
    });
    const dot = up => ({
      flexShrink: 0, width: "6px", height: "6px", borderRadius: "99px",
      background: up ? "var(--em)" : "var(--rb)",
      animation: up ? "gsdpulse 3s ease-in-out infinite" : "none"
    });
    const feed = [
      { t: "14:32:08", src: "agent:bentley", sum: "[milestone-shipped @mikey] AEO landing copy approved for azpetstylist", kind: "milestone", tone: "em" },
      { t: "14:29:41", src: "agent:claude-engineer", sum: "[work-update] crm-square-sync merge strategy drafted, awaiting HITL", kind: "work-update", tone: null },
      { t: "14:27:03", src: "bus:relay", sum: "heartbeat batch acknowledged · 8 agents · 0 dropped frames", kind: "heartbeat", tone: null },
      { t: "14:21:56", src: "agent:folana", sum: "[incident-update] render-farm asset fetch timeout, retry 3/3 failed", kind: "incident", tone: "rb" },
      { t: "14:18:12", src: "agent:gemini-cli", sum: "[artifact-published] weekly GEO ranking report for tenant duane", kind: "artifact", tone: null },
      { t: "14:11:47", src: "agent:bentley", sum: "[hitl-escalation @operator] deploy authorization requested", kind: "hitl", tone: "am" },
      { t: "14:04:30", src: "system:gateway", sum: "rollup snapshot persisted · 47 work items · 12 profiles", kind: "rollup", tone: null },
      { t: "13:58:22", src: "agent:claude-web", sum: "[coord-note @fleet] suzanne showcase assets migrated to CDN bucket", kind: "coord", tone: null }
    ].map(e => Object.assign(e, { badgeStyle: badge(e.tone) }));
    const services = [
      { slug: "gsd-gateway", up: true, lat: "38ms" }, { slug: "acmi-bridge", up: true, lat: "41ms" },
      { slug: "bus-relay", up: true, lat: "12ms" }, { slug: "voice-stack", up: true, lat: "96ms" },
      { slug: "crm-sync", up: true, lat: "58ms" }, { slug: "aeo-crawler", up: true, lat: "203ms" },
      { slug: "render-farm", up: false, lat: "—" }, { slug: "webhook-hub", up: true, lat: "24ms" }
    ].map(s => Object.assign(s, { dotStyle: dot(s.up) }));
    const hitlA = [
      { member: "bentley", when: "12m ago", summary: "Publish AEO landing page for azpetstylist.com — copy approved, awaiting deploy authorization" },
      { member: "claude-engineer", when: "38m ago", summary: "Square CRM sync will overwrite 214 customer records for tenant duane — confirm merge strategy" }
    ];
    const countBadge = tone => Object.assign(badge(tone), { fontSize: "9px" });
    const bar = (pct, c) => ({ width: pct + "%", height: "100%", background: c });
    const kanban = [
      { name: "[01] Backlog", count: "18 items", countStyle: countBadge(null), items: [
        { id: "wf-madez-newsroom-052", title: "Editorial calendar automation for The Dispatch", progress: 0, owner: "unassigned", barStyle: bar(2, "var(--soft)") },
        { id: "wf-avery-intake-011", title: "Client intake voice agent scripting pass", progress: 0, owner: "unassigned", barStyle: bar(2, "var(--soft)") }] },
      { name: "[02] Active", count: "14 items", countStyle: countBadge("em"), items: [
        { id: "wf-madez-aeo-047", title: "AEO landing page rollout — azpetstylist.com", progress: 82, owner: "bentley", barStyle: bar(82, "var(--em)") },
        { id: "wf-duane-crm-033", title: "Square CRM two-way sync with conflict ledger", progress: 45, owner: "claude-engineer", barStyle: bar(45, "var(--em)") }] },
      { name: "[03] Stalled", count: "3 items", countStyle: countBadge("rb"), items: [
        { id: "wf-suzanne-showcase-021", title: "Property showcase render pipeline", progress: 61, owner: "folana", barStyle: bar(61, "var(--rb)") }] },
      { name: "[04] Completed", count: "12 items", countStyle: countBadge("em"), items: [
        { id: "wf-madez-acmi-040", title: "ACMI v1.4 rollup schema migration", progress: 100, owner: "claude-engineer", barStyle: bar(100, "var(--primary)") },
        { id: "wf-duane-geo-028", title: "GEO citation audit — 6 local packs", progress: 100, owner: "gemini-cli", barStyle: bar(100, "var(--primary)") }] }
    ];
    const navRow = active => ({
      display: "flex", alignItems: "center", gap: "9px", padding: "7px 10px", borderRadius: "4px",
      fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", fontWeight: active ? 700 : 500,
      color: active ? "var(--primary)" : "var(--muted)",
      background: active ? "var(--panel)" : "transparent",
      border: active ? "1px solid var(--border)" : "1px solid transparent", cursor: "pointer"
    });
    const navBadge = live => ({
      fontFamily: "'JetBrains Mono',monospace", fontSize: "7.5px", fontWeight: 700, letterSpacing: ".08em",
      padding: "2px 4px", borderRadius: "2px", flexShrink: 0,
      background: live ? "var(--primary)" : "var(--panel)",
      color: live ? "var(--primary-fg)" : "var(--soft)",
      border: live ? "1px solid var(--primary)" : "1px solid var(--hair)"
    });
    const nav = [
      { title: "Operations", items: [
        { label: "Command Center", badge: "LIVE", rowStyle: navRow(true), badgeStyle: navBadge(true) },
        { label: "Fleet Cockpit", badge: "BUS", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "System Status", badge: "SYS", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "Scheduled Crons", badge: "CRON", rowStyle: navRow(false), badgeStyle: navBadge(false) }] },
      { title: "Work & Coord", items: [
        { label: "Todo Kanban", badge: "KBN", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "Calendar View", badge: "CAL", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "Workflow Tracker", badge: "174", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "HITL Approvals", badge: "3", rowStyle: navRow(false), badgeStyle: navBadge(false) }] },
      { title: "Agents & Hub", items: [
        { label: "Agent Console", badge: "88", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "A2A Comms Graph", badge: "SVG", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "Voice Chat", badge: "DEEP", rowStyle: navRow(false), badgeStyle: navBadge(false) }] },
      { title: "Data & Context", items: [
        { label: "Database", badge: "DB", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "Docs Outline", badge: "DOCS", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "Archival Trace", badge: "AUDIT", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "Integrations & Keys", badge: "KEY", rowStyle: navRow(false), badgeStyle: navBadge(false) },
        { label: "Settings", badge: "", rowStyle: navRow(false), badgeStyle: navBadge(false) }] }
    ];
    return {
      themeA: this.state.themeA, themeB: this.state.themeB, themeC: this.state.themeC,
      themeLabelA: this.state.themeA === "light" ? "Dark" : "Light",
      themeLabelB: this.state.themeB === "light" ? "Dark" : "Light",
      themeLabelC: this.state.themeC === "light" ? "Dark" : "Light",
      toggleA: this.mkToggle("themeA"), toggleB: this.mkToggle("themeB"), toggleC: this.mkToggle("themeC"),
      tenantA: this.state.tenantA, tenantB: this.state.tenantB, tenantC: this.state.tenantC,
      tenantsA: this.mkTenants("tenantA"), tenantsB: this.mkTenants("tenantB", true), tenantsC: this.mkTenants("tenantC", true),
      feed, services, hitlA, kanban, nav
    };
  }
}