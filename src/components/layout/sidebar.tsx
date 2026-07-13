"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Workflow,
  CheckCircle2,
  Settings,
  ChevronLeft,
  ChevronRight,
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    title: "⚡ Operations",
    items: [
      { href: "/", label: "Command Center", icon: LayoutDashboard, badge: "LIVE" },
      { href: "/acmi", label: "Fleet Cockpit", icon: Activity, badge: "BUS" },
      { href: "/services", label: "System Status", icon: Activity, badge: "SYS" },
      { href: "/mikey", label: "Mikey's Crons", icon: Cpu, badge: "CRON" },
    ]
  },
  {
    title: "📋 Work & Coord",
    items: [
      { href: "/todo", label: "Todo Kanban", icon: ListTodo, badge: "KBN" },
      { href: "/calendar", label: "Calendar View", icon: Calendar, badge: "CAL" },
      { href: "/workflows", label: "Workflow Tracker", icon: Workflow, badge: "174" },
      { href: "/hitl", label: "HITL Approvals", icon: CheckCircle2, badge: "HITL" },
    ]
  },
  {
    title: "🤖 Agents & Hub",
    items: [
      { href: "/agents", label: "Agent Console", icon: Bot, badge: "88" },
      { href: "/a2a", label: "A2A Comms Graph", icon: Network, badge: "SVG" },
      { href: "/voice", label: "Voice Chat", icon: Mic, badge: "DEEP" },
    ]
  },
  {
    title: "🗃️ Data & Context",
    items: [
      { href: "/nocodb", label: "NocoDB Database", icon: Database, badge: "DB" },
      { href: "/docs", label: "Docs Outline", icon: FileCode, badge: "DOCS" },
      { href: "/archive", label: "Fleet Archival Trace", icon: Archive, badge: "AUDIT" },
      { href: "/notes", label: "Notes Editor", icon: Notebook, badge: "NOTE" },
      { href: "/integrations", label: "Integrations & Keys", icon: Key, badge: "KEY" },
      { href: "/suzanne", label: "Suzanne Showcase", icon: Notebook, badge: "PROP" },
      { href: "/settings", label: "Settings", icon: Settings },
    ]
  }
];

export function Sidebar({ onToggleDocs }: { onToggleDocs?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  // Extract any token/session parameter to persist across navigation
  const token = searchParams.get("token");

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 rounded-none h-screen shrink-0 overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 h-14 shrink-0 bg-sidebar-accent/35">
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <div className="flex items-center justify-center w-8 h-8 rounded-none bg-sidebar-primary text-sidebar-primary-foreground shrink-0 font-mono text-sm border border-sidebar-border font-bold">
            [A]
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight uppercase font-mono tracking-wider text-sidebar-primary">
                ACMI Fleet
              </span>
              <span className="text-[8px] text-sidebar-foreground/60 leading-tight uppercase font-mono">
                Dashboard Cockpit
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-5">
          {navCategories.map((category) => (
            <div key={category.title} className="flex flex-col gap-1">
              {!collapsed && (
                <span className="text-[9px] font-mono font-extrabold text-sidebar-foreground/60 uppercase tracking-[0.15em] px-3 mb-1.5 opacity-80 block">
                  {category.title}
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                {category.items.map((item) => {
                  const isActive = item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                  // Construct link preserving token
                  const hrefWithToken = token ? `${item.href}?token=${token}` : item.href;

                  return (
                    <Link
                      key={item.href}
                      href={hrefWithToken}
                      className={cn(
                        "flex items-center gap-3 rounded-none px-3 py-2 text-xs font-mono transition-all border border-transparent select-none",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary border-sidebar-primary/20 font-bold"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-sidebar-primary" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "ml-auto text-[8px] font-mono px-1 border leading-none tracking-tight rounded-none",
                                item.badge === "LIVE"
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                                  : "bg-sidebar-accent text-sidebar-foreground/60 border-sidebar-primary/10"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 flex items-center justify-between bg-sidebar-accent/20 shrink-0">
        {!collapsed && (
          <span className="text-[8px] font-mono text-sidebar-foreground/60 px-2 uppercase">
            ACMI v1.4
          </span>
        )}
        <div className="flex items-center gap-1">
          {onToggleDocs && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-primary rounded-none cursor-pointer"
              onClick={onToggleDocs}
              title="Toggle Docs & Notes (Cmd+D)"
            >
              <FileCode className="h-4 w-4" />
            </Button>
          )}
          {!collapsed && <ThemeToggle />}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-primary rounded-none cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
