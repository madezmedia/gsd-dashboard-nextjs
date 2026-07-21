"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Menu, X, FileText } from "lucide-react";
import { DocsDrawer } from "@/components/openui/docs-drawer";

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handle = setTimeout(() => setIsOpen(false), 0);
    return () => clearTimeout(handle);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDocsOpen((prev) => !prev);
      }
    }
    function handleCustomToggle() {
      setDocsOpen((prev) => !prev);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-docs-drawer", handleCustomToggle);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-docs-drawer", handleCustomToggle);
    };
  }, []);

  return (
    <div className="fleet-app-shell">
      {/* Desktop sidebar */}
      <div className="fleet-app-shell__sidebar hidden lg:flex">
        <Sidebar onToggleDocs={() => setDocsOpen((prev) => !prev)} />
      </div>

      {/* Mobile top bar */}
      <header className="flex lg:hidden items-center justify-between border-b border-border bg-card px-4 h-14 shrink-0 font-mono w-full">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 border border-primary/20 bg-card cursor-pointer"
            aria-label="Open ACMI Command Menu"
          >
            <Menu className="h-3.5 w-3.5" />
            <span>[MENU]</span>
          </button>
          <button
            type="button"
            onClick={() => setDocsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 border border-primary/20 bg-card cursor-pointer"
            aria-label="Toggle Docs Drawer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>[DOCS]</span>
          </button>
        </div>
        <span className="text-xs font-bold text-foreground tracking-widest uppercase font-mono">
          [ACMI: COCKPIT]
        </span>
      </header>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative flex flex-col w-64 h-full max-h-dvh bg-sidebar border-r border-sidebar-border shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3 z-50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-muted text-muted-foreground border border-border bg-card cursor-pointer"
                aria-label="Close Command Menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex">
              <Sidebar onToggleDocs={() => setDocsOpen((prev) => !prev)} />
            </div>
          </div>
        </div>
      )}

      {/* Main scroll region */}
      <div className="fleet-app-shell__main">
        <div className="fleet-app-shell__scroll">{children}</div>
      </div>

      <DocsDrawer isOpen={docsOpen} onClose={() => setDocsOpen(false)} />
    </div>
  );
}
