import { useCockpitStore } from "@/store/useCockpitStore";
import { FileText, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CockpitHeaderProps {
  handleForceSync: () => Promise<void>;
}

export function CockpitHeader({ handleForceSync }: CockpitHeaderProps) {
  const { activeTenant, setActiveTenant, syncStatus, forcingSync } = useCockpitStore();

  const triggerDocsDrawer = () => {
    window.dispatchEvent(new CustomEvent("toggle-docs-drawer"));
  };

  return (
    <header className="relative border border-[#e5e3d7] bg-[#f5f4ed]/40 p-5 rounded-[4px] flex flex-col gap-4 shadow-none">
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#0d1b2a]" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-[#0d1b2a] uppercase font-serif flex items-center gap-2">
            Fleet <span className="text-[#2c3e50] italic font-light font-sans">Command Cockpit</span>
          </h1>
          <p className="text-[10px] text-[#2c3e50]/70 uppercase tracking-wider mt-1 font-mono">
            ACMI Swarm Operations Center & Multi-Tenant Integration Console
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-[#e5e3d7] text-[#0d1b2a] hover:bg-[#f5f4ed] text-[10px] uppercase font-mono h-8 cursor-pointer rounded-[4px] shadow-none"
            onClick={triggerDocsDrawer}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Quick Docs & Notes
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-[#e5e3d7] text-[#0d1b2a] hover:bg-[#f5f4ed] text-[10px] uppercase font-mono h-8 cursor-pointer rounded-[4px] shadow-none"
            onClick={handleForceSync}
            disabled={forcingSync}
          >
            <RefreshCw
              className={cn(
                "h-3 w-3 mr-1.5 text-[#0d1b2a]",
                (forcingSync || syncStatus === "syncing") && "animate-spin"
              )}
            />
            {forcingSync ? "Syncing..." : "Sync State"}
          </Button>

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase bg-[#f5f4ed] px-3 py-1.5 border border-[#e5e3d7] tracking-wider rounded-[4px]">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                syncStatus === "syncing" && "bg-blue-500 animate-pulse",
                syncStatus === "stalled" && "bg-[#c0392b] animate-pulse",
                syncStatus === "idle" && "bg-[#27ae60]"
              )}
            />
            {syncStatus === "syncing" && <span className="text-blue-500 font-bold">[SYNCING]</span>}
            {syncStatus === "stalled" && <span className="text-[#c0392b] font-bold">[STALLED]</span>}
            {syncStatus === "idle" && <span className="text-[#27ae60] font-bold">[CONNECTED]</span>}
          </div>
        </div>
      </div>

      {/* Tenant selector buttons */}
      <div className="border-t border-[#e5e3d7] pt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-[#2c3e50]/70 uppercase mr-2 flex items-center gap-1">
            <Layers className="h-3 w-3" /> Scope:
          </span>
          {(["all", "madez", "duane", "suzanne", "avery"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTenant(t)}
              className={cn(
                "px-3 py-1 text-[9px] font-mono border uppercase tracking-wider transition-all rounded-[4px] cursor-pointer",
                activeTenant === t
                  ? "border-[#0d1b2a] text-[#0d1b2a] bg-[#f5f4ed] font-bold"
                  : "border-[#e5e3d7] text-[#2c3e50] hover:text-[#0d1b2a] bg-[#fbfaf5]/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-[9px] font-mono text-[#2c3e50]/70 uppercase">
          Active Tenant context: <strong className="text-[#0d1b2a]">{activeTenant}</strong>
        </span>
      </div>
    </header>
  );
}
