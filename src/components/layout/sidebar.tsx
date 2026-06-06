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
  Folders,
  Calendar,
  FileCode,
  Activity,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  {
    href: "/",
    label: "Command Center",
    icon: LayoutDashboard,
    badge: "LIVE",
  },
  {
    href: "/acmi",
    label: "ACMI Fleet Cockpit",
    icon: Activity,
    badge: "BUS",
  },
  {
    href: "/mikey",
    label: "Mikey's Crons",
    icon: Cpu,
    badge: "CRON",
  },
  {
    href: "/agents",
    label: "Agent Console",
    icon: Bot,
    badge: "88",
  },
  {
    href: "/workflows",
    label: "Workflow Tracker",
    icon: Workflow,
    badge: "174",
  },
  {
    href: "/todo",
    label: "Todo Kanban",
    icon: ListTodo,
    badge: "KBN",
  },
  {
    href: "/notes",
    label: "Notes Editor",
    icon: Notebook,
    badge: "NOTE",
  },
  {
    href: "/projects",
    label: "Project Tracker",
    icon: Folders,
    badge: "PIPE",
  },
  {
    href: "/calendar",
    label: "Calendar & Events",
    icon: Calendar,
    badge: "CAL",
  },
  {
    href: "/docs",
    label: "Docs Outline",
    icon: FileCode,
    badge: "DOCS",
  },
  {
    href: "/voice",
    label: "Voice Chat",
    icon: Mic,
    badge: "DEEP",
  },
  {
    href: "/a2a",
    label: "A2A Comms Graph",
    icon: Network,
    badge: "SVG",
  },
  {
    href: "/approvals",
    label: "Approval Queue",
    icon: CheckCircle2,
    badge: "12",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  // Extract any token/session parameter to persist across navigation
  const token = searchParams.get("token");

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[#1a1a1a]/10 bg-[#f4f2eb] text-[#1a1a1a] transition-all duration-300 rounded-none",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#1a1a1a]/10 px-4 h-14 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-none bg-[#2d4a3e] text-[#faf9f5] shrink-0 font-mono text-sm border border-[#1a1a1a]/20">
            [A]
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight uppercase font-mono tracking-wider text-[#2d4a3e]">ACMI Fleet</span>
              <span className="text-[9px] text-[#1a1a1a]/60 leading-tight uppercase font-mono">Dashboard v3</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
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
                  "flex items-center gap-3 rounded-none px-3 py-2 text-xs font-mono transition-all border border-transparent",
                  isActive
                    ? "bg-[#2d4a3e]/10 text-[#2d4a3e] font-semibold border-[#2d4a3e]/20"
                    : "hover:bg-[#1a1a1a]/5 text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "ml-auto text-[9px] font-mono px-1 py-0.5 border leading-none tracking-tight",
                          item.badge === "LIVE"
                            ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]"
                            : "bg-[#1a1a1a]/5 text-[#1a1a1a]/60 border-[#1a1a1a]/10"
                        )}
                      >
                        [{item.badge}]
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-[#1a1a1a]/10 p-2 flex items-center justify-between bg-[#faf9f5]/50">
        {!collapsed && (
          <span className="text-[9px] font-mono text-[#1a1a1a]/50 px-2 uppercase">ACMI v1.3</span>
        )}
        <div className="flex items-center gap-1">
          {!collapsed && <ThemeToggle />}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#1a1a1a]/5 rounded-none"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
