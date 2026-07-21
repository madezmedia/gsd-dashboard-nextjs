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
    <header className="relative flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-none sm:p-5">
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary" />
      <div className="flex min-w-0 flex-col gap-4 pl-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 font-serif text-sm font-bold tracking-[0.15em] text-foreground uppercase">
            Fleet{" "}
            <span className="font-sans text-sm font-light italic tracking-normal text-muted-foreground normal-case">
              Command Cockpit
            </span>
          </h1>
          <p className="mt-1 break-words font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
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
      <div className="border-t border-border mt-3 pt-5 pb-2 flex flex-wrap items-center justify-between gap-4">
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
