"use client";

import { useEffect, useState, useCallback } from "react";
import { Server, Activity, ExternalLink, ShieldCheck, Database, RefreshCw, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchServices } from "@/lib/acmi-client";

interface ServiceRegistry {
  slug: string;
  name: string;
  url?: string;
  internal?: string;
  role?: string;
  verified_at?: number;
  setup_at?: number;
  setup_by?: string;
  depends_on?: string[];
  [key: string]: unknown;
}

export default function ServicesStatusPage() {
  const [services, setServices] = useState<ServiceRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mountedTime] = useState(() => Date.now());

  const loadServices = useCallback(async () => {
    try {
      const list = await fetchServices();
      setServices(list as ServiceRegistry[]);
    } catch (err) {
      console.error("Failed to load services status", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadServices();
    }, 0);
    const interval = setInterval(loadServices, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadServices]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase animate-pulse">
          Scanning system status...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="relative border border-border bg-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-2xl" />
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase font-serif">
            System <span className="text-primary italic font-light font-sans">Status Console</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-mono">
            Fleet Microservices & Infrastructure Operations Control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-border text-foreground hover:bg-secondary text-[10px] uppercase font-mono h-8 cursor-pointer"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-mono text-primary uppercase tracking-tight">
              Operational
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => {
          const isVerified = svc.verified_at ? (mountedTime - Number(svc.verified_at) < 86400000) : false;
          
          return (
            <Card 
              key={svc.slug} 
              className="border border-border bg-card hover:border-primary/50 transition-all rounded-2xl flex flex-col justify-between shadow-md"
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2 space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-tight">
                      {svc.slug}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground tracking-wide font-serif">
                    {svc.name}
                  </CardTitle>
                </div>
                <Badge 
                  className={isVerified ? "bg-primary/10 text-primary border border-primary/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}
                >
                  {isVerified ? "Online" : "Unverified"}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {svc.role && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {svc.role}
                    </p>
                  )}

                  {/* Metadata fields */}
                  <div className="bg-secondary p-3 rounded-xl border border-border font-mono text-[10px] space-y-1">
                    {svc.internal && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground/60 uppercase">Internal:</span>
                        <span className="font-bold truncate max-w-[140px] text-foreground">{svc.internal}</span>
                      </div>
                    )}
                    {svc.setup_by && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground/60 uppercase">Owner:</span>
                        <span className="font-bold text-foreground">{svc.setup_by}</span>
                      </div>
                    )}
                    {svc.setup_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground/60 uppercase">Created:</span>
                        <span className="text-foreground">{new Date(svc.setup_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 mt-auto">
                  {svc.depends_on && svc.depends_on.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-muted-foreground/50" />
                      <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">
                        Deps: {svc.depends_on.join(", ")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3 text-muted-foreground/50" />
                      <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">
                        Standalone
                      </span>
                    </div>
                  )}

                  {svc.url && (
                    <a 
                      href={svc.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary-hover transition-colors uppercase cursor-pointer"
                    >
                      <span>Console</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
