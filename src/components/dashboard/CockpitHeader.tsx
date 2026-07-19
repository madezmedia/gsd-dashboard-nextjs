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
    <header className="relative border border-border bg-card/40 p-5 rounded-[4px] flex flex-col gap-4 shadow-none">
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif flex items-center gap-2">
            Fleet <span className="text-muted-foreground italic font-light font-sans">Command Cockpit</span>
          </h1>
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-1 font-mono">
            ACMI Swarm Operations Center & Multi-Tenant Integration Console
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-border text-foreground hover:bg-muted text-[10px] uppercase font-mono h-8 cursor-pointer rounded-[4px] shadow-none"
            onClick={triggerDocsDrawer}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Quick Docs & Notes
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-border text-foreground hover:bg-muted text-[10px] uppercase font-mono h-8 cursor-pointer rounded-[4px] shadow-none"
            onClick={handleForceSync}
            disabled={forcingSync}
          >
            <RefreshCw
              className={cn(
                "h-3 w-3 mr-1.5 text-foreground",
                (forcingSync || syncStatus === "syncing") && "animate-spin"
              )}
            />
            {forcingSync ? "Syncing..." : "Sync State"}
          </Button>

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase bg-muted px-3 py-1.5 border border-border tracking-wider rounded-[4px]">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                syncStatus === "syncing" && "bg-blue-500 animate-pulse",
                syncStatus === "stalled" && "bg-destructive animate-pulse",
                syncStatus === "idle" && "bg-emerald-500"
              )}
            />
            {syncStatus === "syncing" && <span className="text-blue-500 font-bold">[SYNCING]</span>}
            {syncStatus === "stalled" && <span className="text-destructive font-bold">[STALLED]</span>}
            {syncStatus === "idle" && <span className="text-emerald-500 font-bold">[CONNECTED]</span>}
          </div>
        </div>
      </div>

      {/* Tenant selector buttons */}
      <div className="border-t border-border mt-3 pt-5 pb-1 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-muted-foreground/70 uppercase mr-2 flex items-center gap-1">
            <Layers className="h-3 w-3" /> Scope:
          </span>
          {(["all", "madez", "duane", "suzanne", "avery"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTenant(t)}
              className={cn(
                "px-3 py-1.5 text-[9px] font-mono border uppercase tracking-wider transition-all rounded-md cursor-pointer",
                activeTenant === t
                  ? "border-primary text-primary-foreground bg-primary font-bold"
                  : "border-border text-muted-foreground hover:text-foreground bg-card/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/70 uppercase">
          Active Tenant context: <strong className="text-foreground">{activeTenant}</strong>
        </span>
      </div>
    </header>
  );
}
