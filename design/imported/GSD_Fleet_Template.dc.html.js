class Component extends DCLogic {
  state = { theme: "dark", tenant: "all", page: "overview" };
  toggleTheme = () => this.setState(s => ({ theme: s.theme === "light" ? "dark" : "light" }));
  goTo(page) { return () => this.setState({ page }); }
  renderVals() {
    const badge = tone => ({
      flexShrink: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "8px", fontWeight: 700,
      letterSpacing: ".08em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "2px",
      border: "1px solid var(--hair)",
      color: tone === "em" ? "var(--em)" : tone === "am" ? "var(--am)" : tone === "rb" ? "var(--rb)" : "var(--muted)",
      background: tone === "em" ? "var(--em-bg)" : tone === "am" ? "var(--am-bg)" : tone === "rb" ? "var(--rb-bg)" : "var(--panel)"
    });
    const dot = up => ({ flexShrink: 0, width: "6px", height: "6px", borderRadius: "99px", background: up ? "var(--em)" : "var(--rb)", animation: up ? "gsdpulse 3s ease-in-out infinite" : "none" });
    const bar = (pct, c) => ({ width: pct + "%", height: "100%", background: c });

    const tenants = ["all", "madez", "duane", "suzanne", "avery"].map(label => ({
      label,
      pick: () => this.setState({ tenant: label }),
      style: Object.assign({
        padding: "4px 9px", fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", fontWeight: 700,
        letterSpacing: ".12em", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer", transition: "all .15s"
      }, label === this.state.tenant
        ? { background: "var(--primary)", color: "var(--primary-fg)", border: "1px solid var(--primary)" }
        : { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" })
    }));

    const navRow = active => ({
      display: "flex", alignItems: "center", gap: "9px", padding: "7px 10px", borderRadius: "4px",
      fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", fontWeight: active ? 700 : 500,
      color: active ? "var(--primary)" : "var(--muted)", background: active ? "var(--panel)" : "transparent",
      border: active ? "1px solid var(--border)" : "1px solid transparent", cursor: "pointer"
    });
    const navBadge = live => ({
      fontFamily: "'JetBrains Mono',monospace", fontSize: "7.5px", fontWeight: 700, letterSpacing: ".08em",
      padding: "2px 4px", borderRadius: "2px", flexShrink: 0,
      background: live ? "var(--primary)" : "var(--panel)", color: live ? "var(--primary-fg)" : "var(--soft)",
      border: live ? "1px solid var(--primary)" : "1px solid var(--hair)"
    });
    const p = this.state.page;
    const nv = (label, badgeTxt, key) => ({ label, badge: badgeTxt, go: this.goTo(key), rowStyle: navRow(p === key), badgeStyle: navBadge(p === key) });
    const nav = [
      { title: "Operate", items: [nv("Overview", "LIVE", "overview"), nv("Approvals", "3", "approvals"), nv("Activity", "142", "activity")] },
      { title: "Work", items: [nv("Pipeline", "47", "pipeline"), nv("Schedules", "CRON", "schedules"), nv("Calendar", "", "calendar")] },
      { title: "Agents", items: [nv("Agents", "12", "agents"), nv("Comms Graph", "", "commsgraph"), nv("Voice", "", "voice")] },
      { title: "Data", items: [nv("Records", "", "records"), nv("Documents", "", "documents"), nv("Audit Trail", "", "audit")] },
      { title: "System", items: [nv("Services", "9/11", "services"), nv("Integrations", "", "integrations"), nv("Tenants", "5", "tenants"), nv("Settings", "", "settings")] }
    ];

    const titles = { overview: ["Overview", "Operate / Live"], approvals: ["Approvals", "Operate / HITL Queue"], pipeline: ["Pipeline", "Work / Lifecycle"], agents: ["Agents", "Agents / Fleet Roster"], services: ["Services", "System / Health Matrix"], tenants: ["Tenants", "System / Multi-tenant Config"] };
    const [pageTitle, pageEyebrow] = titles[p] || titles.overview;

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

    const servicesRaw = [
      { slug: "gsd-gateway", name: "Core API gateway", up: true, lat: "38ms" }, { slug: "acmi-bridge", name: "ACMI Redis bridge", up: true, lat: "41ms" },
      { slug: "bus-relay", name: "Event bus relay", up: true, lat: "12ms" }, { slug: "voice-stack", name: "Voice agent runtime", up: true, lat: "96ms" },
      { slug: "crm-sync", name: "Square CRM sync", up: true, lat: "58ms" }, { slug: "aeo-crawler", name: "AEO/GEO crawler", up: true, lat: "203ms" },
      { slug: "render-farm", name: "Media render farm", up: false, lat: "—" }, { slug: "webhook-hub", name: "Webhook dispatcher", up: true, lat: "24ms" },
      { slug: "doc-index", name: "Document indexer", up: true, lat: "77ms" }, { slug: "notify-svc", name: "Notification service", up: false, lat: "—" }
    ];
    const services = servicesRaw.slice(0, 6).map(s => Object.assign({}, s, { dotStyle: dot(s.up) }));
    const servicesFull = servicesRaw.map(s => Object.assign({}, s, { dotStyle: dot(s.up), verified: s.up ? "verified 2m ago" : "unreachable" }));

    const hitl = [
      { member: "bentley", when: "12m ago", summary: "Publish AEO landing page for azpetstylist.com — copy approved, awaiting deploy authorization" },
      { member: "claude-engineer", when: "38m ago", summary: "Square CRM sync will overwrite 214 customer records for tenant duane — confirm merge strategy" }
    ];
    const hitlFull = [
      Object.assign({ tag: "hitl-escalation" }, hitl[0]), Object.assign({ tag: "hitl-escalation" }, hitl[1]),
      { tag: "stalled-job", member: "folana", when: "41m ago", summary: "wf-suzanne-showcase-021 · render pipeline stalled at asset fetch, no heartbeat" }
    ];
    const history = [
      { t: "13:02", member: "bentley", summary: "AEO copy pass approved for duane tenant", result: "approved", style: Object.assign(badge("em"), { fontSize: "9px" }) },
      { t: "12:41", member: "gemini-cli", summary: "Voice script variant B rejected — off-tone", result: "rejected", style: Object.assign(badge("rb"), { fontSize: "9px" }) },
      { t: "11:58", member: "claude-web", summary: "Newsletter send window confirmed for madez", result: "approved", style: Object.assign(badge("em"), { fontSize: "9px" }) },
      { t: "10:20", member: "folana", summary: "Showcase render retry authorized", result: "approved", style: Object.assign(badge("em"), { fontSize: "9px" }) }
    ];

    const countBadge = tone => Object.assign(badge(tone), { fontSize: "9px" });
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

    const agents = [
      { id: "agent:bentley", role: "Sales & Ops Voice Agent", work: "Publishing AEO landing page — azpetstylist.com", seen: "just now", tenant: "madez", up: true },
      { id: "agent:claude-engineer", role: "Systems Integration Agent", work: "Square CRM sync merge strategy review", seen: "2m ago", tenant: "duane", up: true },
      { id: "agent:folana", role: "Visual Content Render Agent", work: "wf-suzanne-showcase-021 (stalled)", seen: "41m ago", tenant: "suzanne", up: false },
      { id: "agent:gemini-cli", role: "GEO Research Agent", work: "Weekly GEO ranking report — duane", seen: "9m ago", tenant: "duane", up: true },
      { id: "agent:claude-web", role: "Content Coordination Agent", work: "Dispatch newsletter scheduling", seen: "4m ago", tenant: "madez", up: true },
      { id: "agent:tony", role: "Client Intake Agent", work: "Voice script pass for avery onboarding", seen: "17m ago", tenant: "avery", up: true }
    ].map(a => Object.assign({}, a, { dotStyle: dot(a.up) }));

    const tierBadge = tier => Object.assign({
      fontFamily: "'JetBrains Mono',monospace", fontSize: "8px", fontWeight: 700, letterSpacing: ".1em",
      textTransform: "uppercase", padding: "3px 8px", borderRadius: "3px", border: "1px solid var(--border)",
      background: "var(--panel)", color: "var(--muted)"
    });
    const tenantCards = [
      { slug: "madez", name: "Mad EZ Media", plan: "Owner", agents: 5, items: 19, urgent: 1, urgentColor: "var(--am)", badgeStyle: tierBadge() },
      { slug: "duane", name: "Duane — Local Services Co.", plan: "Client", agents: 3, items: 14, urgent: 1, urgentColor: "var(--am)", badgeStyle: tierBadge() },
      { slug: "suzanne", name: "Suzanne Realty Group", plan: "Client", agents: 2, items: 9, urgent: 1, urgentColor: "var(--rb)", badgeStyle: tierBadge() },
      { slug: "avery", name: "Avery Pet Stylist", plan: "Client", agents: 2, items: 5, urgent: 0, urgentColor: "var(--em)", badgeStyle: tierBadge() }
    ];

    return {
      theme: this.state.theme, themeLabel: this.state.theme === "light" ? "Dark" : "Light", toggleTheme: this.toggleTheme,
      activeTenant: this.state.tenant, tenants, nav, pageTitle, pageEyebrow,
      isOverview: p === "overview", isApprovals: p === "approvals", isPipeline: p === "pipeline" || p === "activity",
      isAgents: p === "agents", isServices: p === "services", isTenants: p === "tenants",
      goPipeline: this.goTo("pipeline"), goApprovals: this.goTo("approvals"), goServices: this.goTo("services"),
      kpis: [
        { label: "Total Swarms", value: "12", desc: "registered profiles", wrapStyle: { padding: "16px 20px", borderRight: "1px solid var(--hair)" }, labelColor: "var(--muted)", valueColor: "var(--fg)", descColor: "var(--soft)" },
        { label: "Active Agents", value: "8", desc: "heartbeat < 5m", wrapStyle: { padding: "16px 20px", borderRight: "1px solid var(--hair)" }, labelColor: "var(--muted)", valueColor: "var(--em)", descColor: "var(--soft)" },
        { label: "Microservices", value: "9/11", desc: "verified online", wrapStyle: { padding: "16px 20px", borderRight: "1px solid var(--hair)" }, labelColor: "var(--muted)", valueColor: "var(--fg)", descColor: "var(--soft)" },
        { label: "Work Registry", value: "14/47", desc: "active / total", wrapStyle: { padding: "16px 20px", borderRight: "1px solid var(--hair)" }, labelColor: "var(--muted)", valueColor: "var(--fg)", descColor: "var(--soft)" },
        { label: "Urgent Tasks", value: "3", desc: "operator review", wrapStyle: { padding: "16px 20px", background: "var(--am-bg)" }, labelColor: "var(--am)", valueColor: "var(--am)", descColor: "var(--am)" }
      ],
      feed, services, servicesFull, hitl, hitlFull, history, kanban, agents, tenantCards
    };
  }
}