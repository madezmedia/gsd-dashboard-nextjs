"use client";

/* eslint-disable */

import React, { useEffect, useState } from "react";
import { Activity, CheckCircle, Clock, AlertTriangle, Ban, ArrowRight, RefreshCw } from "lucide-react";
import { acmiCall } from "@/lib/acmi-client";

const STAGES = [
  { id: "biz-pipeline-agency-design", name: "Agency Design", status: "done", owner: "design-agency", desc: "Brand identity, design tokens, component library" },
  { id: "biz-pipeline-go-to-market", name: "Go To Market", status: "stalled", owner: "opencode", desc: "Marketing channels, campaigns, positioning" },
  { id: "biz-pipeline-operations", name: "Operations", status: "stalled", owner: "bentley-main", desc: "Pipeline automation, CRM, workflows" },
  { id: "biz-pipeline-product-engineering", name: "Product Engineering", status: "stalled", owner: "antigravity", desc: "Platform development, features, deployment" },
  { id: "biz-pipeline-security-web3", name: "Security & Web3", status: "backlog", owner: "claude-engineer", desc: "Infrastructure, access control, blockchain" },
];

const STATUS_COLORS = {
  done: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: CheckCircle },
  active: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: Activity },
  stalled: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: AlertTriangle },
  backlog: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400", icon: Ban },
};

export default function PipelinePage() {
  const [workItems, setWorkItems] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const results: Record<string, any> = {};
      for (const stage of STAGES) {
        try {
          const data = await acmiCall("acmi_work_get", { id: stage.id });
          results[stage.id] = data;
        } catch { results[stage.id] = null; }
      }
      setWorkItems(results);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business Lifecycle Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">End-to-end business pipeline status across all departments</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading pipeline data...</div>
      ) : (
        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const sc = STATUS_COLORS[stage.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.backlog;
            const Icon = sc.icon;
            const workData = workItems[stage.id];
            const lastActivity = workData?.timeline?.[0];
            const lastTime = lastActivity?.ts ? new Date(lastActivity.ts).toLocaleString() : "N/A";

            return (
              <div key={stage.id} className={`rounded-lg border ${sc.border} ${sc.bg} p-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${sc.text}`}><Icon className="w-5 h-5" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{stage.name}</h3>
                        <span className={`text-[10px] uppercase tracking-wider font-medium ${sc.text}`}>{stage.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{stage.desc}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                        <span>Owner: {stage.owner}</span>
                        <span>Last: {lastTime}</span>
                      </div>
                    </div>
                  </div>
                  {workData?.signals?.progress && (
                    <div className="text-right">
                      <div className="text-lg font-semibold">{workData.signals.progress}%</div>
                      <div className="text-[10px] text-gray-400">complete</div>
                    </div>
                  )}
                </div>
                {i < STAGES.length - 1 && (
                  <div className="flex justify-center mt-2">
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
