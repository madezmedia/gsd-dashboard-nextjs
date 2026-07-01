"use client";

import { useState } from "react";
import { X, RefreshCw, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  url: string;
  onClose: () => void;
}

export function ServiceIframe({ name, url, onClose }: Props) {
  const [key, setKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border border-primary/30 shadow-2xl rounded-2xl overflow-hidden flex flex-col",
        fullscreen
          ? "inset-4"
          : "bottom-6 right-6 w-[min(900px,calc(100vw-3rem))] h-[min(620px,calc(100vh-6rem))]"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-foreground font-bold">
            {name}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/60 truncate max-w-[200px]">{url}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 cursor-pointer"
            onClick={() => setKey((k) => k + 1)}
            title="Reload"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 cursor-pointer"
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? "Restore" : "Fullscreen"}
          >
            <Maximize2 className="h-3 w-3 text-muted-foreground" />
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-6 w-6 items-center justify-center"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
          </a>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 cursor-pointer"
            onClick={onClose}
            title="Close"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
          </Button>
        </div>
      </div>

      {/* iframe */}
      <iframe
        key={key}
        src={url}
        className="flex-1 w-full border-0 bg-white"
        title={name}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
