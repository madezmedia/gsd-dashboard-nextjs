/**
 * Canonical fleet nav — matches legacy sidebar.
 * Keep all real ACMI / ops routes reachable from every shell.
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bot,
  Workflow,
  CheckCircle2,
  Settings,
  Mic,
  Network,
  ListTodo,
  Notebook,
  Calendar,
  FileCode,
  Activity,
  Cpu,
  Key,
  Database,
  Archive,
} from "lucide-react";

export interface FleetNavItem {
  href: string;
  label: string;
  badge?: string;
  icon?: LucideIcon;
  /** Primary data plane */
  data: "acmi" | "acmi-bus" | "external" | "static" | "mixed";
  note?: string;
}

export interface FleetNavCategory {
  title: string;
  items: FleetNavItem[];
}

/** Full legacy sidebar inventory (must preserve). */
export const FLEET_NAV: FleetNavCategory[] = [
  {
    title: "Operate",
    items: [
      {
        href: "/",
        label: "Command Center",
        badge: "LIVE",
        icon: LayoutDashboard,
        data: "acmi",
        note: "GSD shell + KpiGrid/HITL/feed/services/kanban via useCockpitData",
      },
      {
        href: "/acmi",
        label: "Fleet Cockpit",
        badge: "BUS",
        icon: Activity,
        data: "acmi",
        note: "AcmiClusterDashboard + bus SSE + rollup poll + broadcast",
      },
      {
        href: "/services",
        label: "System Status",
        badge: "SYS",
        icon: Activity,
        data: "acmi",
        note: "fetchServices()",
      },
      {
        href: "/mikey",
        label: "Mikey's Crons",
        badge: "CRON",
        icon: Cpu,
        data: "external",
        note: "/api/mikey/crons",
      },
    ],
  },
  {
    title: "Work",
    items: [
      {
        href: "/todo",
        label: "Todo Kanban",
        badge: "KBN",
        icon: ListTodo,
        data: "acmi",
        note: "acmiClient tasks + project activity + bus",
      },
      {
        href: "/calendar",
        label: "Calendar View",
        badge: "CAL",
        icon: Calendar,
        data: "acmi",
        note: "ACMI-backed calendar",
      },
      {
        href: "/workflows",
        label: "Workflow Tracker",
        badge: "174",
        icon: Workflow,
        data: "acmi",
        note: "work items / workflows",
      },
      {
        href: "/hitl",
        label: "HITL Approvals",
        badge: "HITL",
        icon: CheckCircle2,
        data: "acmi",
        note: "HITL queue + approve/reject",
      },
    ],
  },
  {
    title: "Agents",
    items: [
      {
        href: "/agents",
        label: "Agent Console",
        badge: "88",
        icon: Bot,
        data: "acmi",
        note: "fetchAgents + /agents/[id] bootstrap",
      },
      {
        href: "/a2a",
        label: "A2A Comms Graph",
        badge: "SVG",
        icon: Network,
        data: "acmi",
        note: "comms graph from ACMI",
      },
      {
        href: "/voice",
        label: "Voice Chat",
        badge: "DEEP",
        icon: Mic,
        data: "mixed",
        note: "voice API + ACMI context",
      },
    ],
  },
  {
    title: "Data",
    items: [
      {
        href: "/nocodb",
        label: "NocoDB Database",
        badge: "DB",
        icon: Database,
        data: "external",
        note: "/api/nocodb proxy",
      },
      {
        href: "/docs",
        label: "Docs Outline",
        badge: "DOCS",
        icon: FileCode,
        data: "acmi",
        note: "doc profiles in ACMI",
      },
      {
        href: "/archive",
        label: "Fleet Archival Trace",
        badge: "AUDIT",
        icon: Archive,
        data: "static",
        note: "audit/trace UI — verify data source",
      },
      {
        href: "/notes",
        label: "Notes Editor",
        badge: "NOTE",
        icon: Notebook,
        data: "acmi",
        note: "notes via ACMI profiles",
      },
      {
        href: "/integrations",
        label: "Integrations & Keys",
        badge: "KEY",
        icon: Key,
        data: "static",
        note: "keys/config UI",
      },
      {
        href: "/suzanne",
        label: "Suzanne Showcase",
        badge: "PROP",
        icon: Notebook,
        data: "static",
        note: "showcase page",
      },
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        data: "mixed",
        note: "settings + some ACMI signals",
      },
    ],
  },
];

/** Nested ACMI routes not in sidebar but live */
export const FLEET_NAV_EXTRA: FleetNavItem[] = [
  {
    href: "/legacy-cockpit",
    label: "Legacy Cockpit",
    data: "acmi",
    note: "pre-GSD home composition",
  },
  {
    href: "/approvals",
    label: "Approvals (alt)",
    data: "acmi",
    note: "fetchApprovals alternate UI",
  },
  {
    href: "/projects",
    label: "Projects",
    data: "acmi",
    note: "project activity",
  },
  {
    href: "/acmi/pipeline",
    label: "ACMI Pipeline",
    data: "acmi",
    note: "nested under /acmi",
  },
  {
    href: "/acmi/search",
    label: "ACMI Search",
    data: "acmi",
    note: "nested under /acmi",
  },
  {
    href: "/acmi/roundtable",
    label: "ACMI Roundtable",
    data: "acmi",
    note: "nested under /acmi",
  },
  {
    href: "/agents/[id]",
    label: "Agent detail",
    data: "acmi",
    note: "fetchAgentBootstrap",
  },
  {
    href: "/workflows/[id]",
    label: "Workflow detail",
    data: "acmi",
    note: "work item detail",
  },
  {
    href: "/fleet",
    label: "Fleet alias",
    data: "acmi",
    note: "same as / (GSD home)",
  },
];
