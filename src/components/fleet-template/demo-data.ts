/** Demo data mirrored from Claude Design GSD Fleet Template.dc.html logic. */

export type Tone = "em" | "am" | "rb" | null;

export const FEED = [
  {
    t: "14:32:08",
    src: "agent:bentley",
    sum: "[milestone-shipped @mikey] AEO landing copy approved for azpetstylist",
    kind: "milestone",
    tone: "em" as Tone,
  },
  {
    t: "14:29:41",
    src: "agent:claude-engineer",
    sum: "[work-update] crm-square-sync merge strategy drafted, awaiting HITL",
    kind: "work-update",
    tone: null as Tone,
  },
  {
    t: "14:27:03",
    src: "bus:relay",
    sum: "heartbeat batch acknowledged · 8 agents · 0 dropped frames",
    kind: "heartbeat",
    tone: null as Tone,
  },
  {
    t: "14:21:56",
    src: "agent:folana",
    sum: "[incident-update] render-farm asset fetch timeout, retry 3/3 failed",
    kind: "incident",
    tone: "rb" as Tone,
  },
  {
    t: "14:18:12",
    src: "agent:gemini-cli",
    sum: "[artifact-published] weekly GEO ranking report for tenant duane",
    kind: "artifact",
    tone: null as Tone,
  },
  {
    t: "14:11:47",
    src: "agent:bentley",
    sum: "[hitl-escalation @operator] deploy authorization requested",
    kind: "hitl",
    tone: "am" as Tone,
  },
  {
    t: "14:04:30",
    src: "system:gateway",
    sum: "rollup snapshot persisted · 47 work items · 12 profiles",
    kind: "rollup",
    tone: null as Tone,
  },
  {
    t: "13:58:22",
    src: "agent:claude-web",
    sum: "[coord-note @fleet] suzanne showcase assets migrated to CDN bucket",
    kind: "coord",
    tone: null as Tone,
  },
];

export const SERVICES_RAW = [
  { slug: "gsd-gateway", name: "Core API gateway", up: true, lat: "38ms" },
  { slug: "acmi-bridge", name: "ACMI Redis bridge", up: true, lat: "41ms" },
  { slug: "bus-relay", name: "Event bus relay", up: true, lat: "12ms" },
  { slug: "voice-stack", name: "Voice agent runtime", up: true, lat: "96ms" },
  { slug: "crm-sync", name: "Square CRM sync", up: true, lat: "58ms" },
  { slug: "aeo-crawler", name: "AEO/GEO crawler", up: true, lat: "203ms" },
  { slug: "render-farm", name: "Media render farm", up: false, lat: "—" },
  { slug: "webhook-hub", name: "Webhook dispatcher", up: true, lat: "24ms" },
  { slug: "doc-index", name: "Document indexer", up: true, lat: "77ms" },
  { slug: "notify-svc", name: "Notification service", up: false, lat: "—" },
];

export const HITL = [
  {
    member: "bentley",
    when: "12m ago",
    summary:
      "Publish AEO landing page for azpetstylist.com — copy approved, awaiting deploy authorization",
    tag: "hitl-escalation",
  },
  {
    member: "claude-engineer",
    when: "38m ago",
    summary:
      "Square CRM sync will overwrite 214 customer records for tenant duane — confirm merge strategy",
    tag: "hitl-escalation",
  },
  {
    member: "folana",
    when: "41m ago",
    summary:
      "wf-suzanne-showcase-021 · render pipeline stalled at asset fetch, no heartbeat",
    tag: "stalled-job",
  },
];

export const HISTORY = [
  {
    t: "13:02",
    member: "bentley",
    summary: "AEO copy pass approved for duane tenant",
    result: "approved",
    tone: "em" as Tone,
  },
  {
    t: "12:41",
    member: "gemini-cli",
    summary: "Voice script variant B rejected — off-tone",
    result: "rejected",
    tone: "rb" as Tone,
  },
  {
    t: "11:58",
    member: "claude-web",
    summary: "Newsletter send window confirmed for madez",
    result: "approved",
    tone: "em" as Tone,
  },
  {
    t: "10:20",
    member: "folana",
    summary: "Showcase render retry authorized",
    result: "approved",
    tone: "em" as Tone,
  },
];

export const KANBAN = [
  {
    name: "[01] Backlog",
    count: "18 items",
    tone: null as Tone,
    items: [
      {
        id: "wf-madez-newsroom-052",
        title: "Editorial calendar automation for The Dispatch",
        progress: 0,
        owner: "unassigned",
      },
      {
        id: "wf-avery-intake-011",
        title: "Client intake voice agent scripting pass",
        progress: 0,
        owner: "unassigned",
      },
    ],
  },
  {
    name: "[02] Active",
    count: "14 items",
    tone: "em" as Tone,
    items: [
      {
        id: "wf-madez-aeo-047",
        title: "AEO landing page rollout — azpetstylist.com",
        progress: 82,
        owner: "bentley",
      },
      {
        id: "wf-duane-crm-033",
        title: "Square CRM two-way sync with conflict ledger",
        progress: 45,
        owner: "claude-engineer",
      },
    ],
  },
  {
    name: "[03] Stalled",
    count: "3 items",
    tone: "rb" as Tone,
    items: [
      {
        id: "wf-suzanne-showcase-021",
        title: "Property showcase render pipeline",
        progress: 61,
        owner: "folana",
      },
    ],
  },
  {
    name: "[04] Completed",
    count: "12 items",
    tone: "em" as Tone,
    items: [
      {
        id: "wf-madez-acmi-040",
        title: "ACMI v1.4 rollup schema migration",
        progress: 100,
        owner: "claude-engineer",
      },
      {
        id: "wf-duane-geo-028",
        title: "GEO citation audit — 6 local packs",
        progress: 100,
        owner: "gemini-cli",
      },
    ],
  },
];

export const AGENTS = [
  {
    id: "agent:bentley",
    role: "Sales & Ops Voice Agent",
    work: "Publishing AEO landing page — azpetstylist.com",
    seen: "just now",
    tenant: "madez",
    up: true,
  },
  {
    id: "agent:claude-engineer",
    role: "Systems Integration Agent",
    work: "Square CRM sync merge strategy review",
    seen: "2m ago",
    tenant: "duane",
    up: true,
  },
  {
    id: "agent:folana",
    role: "Visual Content Render Agent",
    work: "wf-suzanne-showcase-021 (stalled)",
    seen: "41m ago",
    tenant: "suzanne",
    up: false,
  },
  {
    id: "agent:gemini-cli",
    role: "GEO Research Agent",
    work: "Weekly GEO ranking report — duane",
    seen: "9m ago",
    tenant: "duane",
    up: true,
  },
  {
    id: "agent:claude-web",
    role: "Content Coordination Agent",
    work: "Dispatch newsletter scheduling",
    seen: "4m ago",
    tenant: "madez",
    up: true,
  },
  {
    id: "agent:tony",
    role: "Client Intake Agent",
    work: "Voice script pass for avery onboarding",
    seen: "17m ago",
    tenant: "avery",
    up: true,
  },
];

export const TENANT_CARDS = [
  {
    slug: "madez",
    name: "Mad EZ Media",
    plan: "Owner",
    agents: 5,
    items: 19,
    urgent: 1,
    urgentTone: "am" as const,
  },
  {
    slug: "duane",
    name: "Duane — Local Services Co.",
    plan: "Client",
    agents: 3,
    items: 14,
    urgent: 1,
    urgentTone: "am" as const,
  },
  {
    slug: "suzanne",
    name: "Suzanne Realty Group",
    plan: "Client",
    agents: 2,
    items: 9,
    urgent: 1,
    urgentTone: "rb" as const,
  },
  {
    slug: "avery",
    name: "Avery Pet Stylist",
    plan: "Client",
    agents: 2,
    items: 5,
    urgent: 0,
    urgentTone: "em" as const,
  },
];

export const NAV: { title: string; items: { label: string; badge: string; key: string }[] }[] = [
  {
    title: "Operate",
    items: [
      { label: "Overview", badge: "LIVE", key: "overview" },
      { label: "Approvals", badge: "3", key: "approvals" },
      { label: "Activity", badge: "142", key: "activity" },
    ],
  },
  {
    title: "Work",
    items: [
      { label: "Pipeline", badge: "47", key: "pipeline" },
      { label: "Schedules", badge: "CRON", key: "schedules" },
      { label: "Calendar", badge: "", key: "calendar" },
    ],
  },
  {
    title: "Agents",
    items: [
      { label: "Agents", badge: "12", key: "agents" },
      { label: "Comms Graph", badge: "", key: "commsgraph" },
      { label: "Voice", badge: "", key: "voice" },
    ],
  },
  {
    title: "Data",
    items: [
      { label: "Records", badge: "", key: "records" },
      { label: "Documents", badge: "", key: "documents" },
      { label: "Audit Trail", badge: "", key: "audit" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Services", badge: "9/11", key: "services" },
      { label: "Integrations", badge: "", key: "integrations" },
      { label: "Tenants", badge: "5", key: "tenants" },
      { label: "Settings", badge: "", key: "settings" },
    ],
  },
];

export const PAGE_TITLES: Record<string, [string, string]> = {
  overview: ["Overview", "Operate / Live"],
  approvals: ["Approvals", "Operate / HITL Queue"],
  activity: ["Activity", "Operate / Console Stream"],
  pipeline: ["Pipeline", "Work / Lifecycle"],
  agents: ["Agents", "Agents / Fleet Roster"],
  services: ["Services", "System / Health Matrix"],
  tenants: ["Tenants", "System / Multi-tenant Config"],
};

export const TENANTS = ["all", "madez", "duane", "suzanne", "avery"] as const;
