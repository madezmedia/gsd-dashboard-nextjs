"use client";

import React from "react";
import { Search, Eye, Sparkles } from "lucide-react";
import { AcmiEntitySearch } from "@/components/acmi/AcmiEntitySearch";

export default function AcmiSearchPage() {
  return (
    <div className="space-y-6 font-sans select-none antialiased">
      {/* ── Letterpress Header Banner ─────────────────────────── */}
      <div className="border border-[#2d4a3e]/10 bg-[#f4f2eb] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] tracking-wider font-extrabold text-[#2d4a3e] bg-[#5ef2c6]/30 px-2 py-0.5 rounded uppercase border border-[#2d4a3e]/10">
              [ DIRECTORY: GLOBAL ]
            </span>
            <span className="font-mono text-[10px] tracking-wider font-extrabold text-[#c4903a] bg-[#c4903a]/10 px-2 py-0.5 rounded uppercase border border-[#c4903a]/10">
              [ PERSISTENCE LAYER: INDEPENDENT ]
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f2a2e] flex items-center gap-2">
            <Search className="h-6 w-6 text-[#2d4a3e]" />
            ACMI Registry Explorer
          </h1>
          <p className="text-sm text-[#2d4a3e]/60 mt-1 max-w-2xl">
            Audit, query, and inspect any active or archived fleet nodes, user entities, coordination threads, or work items across multi-tenant scopes.
          </p>
        </div>
      </div>

      {/* ── Search Terminal Block ────────────────────────────── */}
      <div className="border border-[#2d4a3e]/10 bg-[#faf9f5] rounded-xl p-6 shadow-sm">
        <AcmiEntitySearch />
      </div>
    </div>
  );
}
