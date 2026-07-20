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

  // Auto-close overlays on url transition safely
  useEffect(() => {
    const handle = setTimeout(() => {
      setIsOpen(false);
    }, 0);
    return () => clearTimeout(handle);
  }, [pathname]);

  // Handle global keydown to toggle drawers (e.g. Cmd+D for Docs)
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

  // GSD Fleet Template owns its own chrome (Claude Design import)
  const isFleetTemplate = pathname === "/" || pathname.startsWith("/fleet");
  if (isFleetTemplate) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-background text-foreground">
      {/* 1. Desktop Sidebar panel - locked above 1024px viewport */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar onToggleDocs={() => setDocsOpen((prev) => !prev)} />
      </div>

      {/* 2. Mobile Responsive Monospaced Navigation Bar - visible below 1024px viewport */}
      <header className="flex lg:hidden items-center justify-between border-b border-border bg-card px-4 h-14 shrink-0 font-mono w-full">
        <div className="flex gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 border border-primary/20 transition-all rounded-none bg-card"
            aria-label="Open ACMI Command Menu"
          >
            <Menu className="h-3.5 w-3.5" />
            <span>[MENU]</span>
          </button>
          
          <button
            onClick={() => setDocsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 border border-primary/20 transition-all rounded-none bg-card"
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

      {/* 3. Sliding Absolute Sidebar Drawer with backdrop-blur filter */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop screen click trap */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Left slide container */}
          <div className="relative flex flex-col w-60 bg-card border-r border-border h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Close toggle button */}
            <div className="absolute top-3 right-3 z-50">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/5 text-foreground/60 hover:text-foreground transition-colors border border-border rounded-none bg-card"
                aria-label="Close Command Menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Sidebar nested dynamically */}
            <div className="flex-1 overflow-hidden flex">
              <Sidebar onToggleDocs={() => setDocsOpen((prev) => !prev)} />
            </div>
          </div>
        </div>
      )}

      {/* 4. Isolated safe child content layer */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4 lg:p-6 bg-background">
            {children}
          </div>
        </main>
      </div>

      {/* Global slide-out Documentation Drawer */}
      <DocsDrawer isOpen={docsOpen} onClose={() => setDocsOpen(false)} />
    </div>
  );
}
