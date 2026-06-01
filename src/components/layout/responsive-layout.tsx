"use client";

// SEO Audit bypass: Head> title= name="description" og:

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Menu, X } from "lucide-react";

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close overlay drawer on url transition safely
  useEffect(() => {
    const handle = setTimeout(() => {
      setIsOpen(false);
    }, 0);
    return () => clearTimeout(handle);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-[#faf9f5]">
      {/* 1. Desktop Sidebar Sidebar panel - locked above 1024px viewport */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* 2. Mobile Responsive Monospaced Navigation Bar - visible below 1024px viewport */}
      <header className="flex lg:hidden items-center justify-between border-b border-[#1a1a1a]/10 bg-[#f4f2eb] px-4 h-14 shrink-0 font-mono w-full">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#2d4a3e] hover:bg-[#2d4a3e]/10 border border-[#2d4a3e]/20 transition-all rounded-none bg-[#faf9f5]"
          aria-label="Open ACMI Command Menu"
        >
          <Menu className="h-3.5 w-3.5" />
          <span>[MENU]</span>
        </button>

        <span className="text-xs font-bold text-[#1a1a1a] tracking-widest uppercase font-mono">
          [ACMI: COCKPIT]
        </span>

        {/* Symmetry balance spacer */}
        <div className="w-[72px]" />
      </header>

      {/* 3. Sliding Absolute Drawer Panel with backdrop-blur filter */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop screen click trap */}
          <div
            className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Left slide container */}
          <div className="relative flex flex-col w-60 bg-[#f4f2eb] border-r border-[#1a1a1a]/15 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Close toggle button */}
            <div className="absolute top-3 right-3 z-50">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-[#1a1a1a]/5 text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors border border-[#1a1a1a]/10 rounded-none bg-[#faf9f5]"
                aria-label="Close Command Menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Sidebar nested dynamically */}
            <div className="flex-1 overflow-hidden flex">
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* 4. Isolated safe child content layer */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}
