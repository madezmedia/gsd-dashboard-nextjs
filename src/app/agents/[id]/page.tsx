"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Activity, Clock, Zap, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchAgentBootstrap, type ACMIBootstrap, type ACMISignal, type ACMIEvent } from "@/lib/acmi-client";
import { formatRelativeTime } from "@/lib/utils";

const kindColors: Record<string, string> = {
  "handoff-complete": "bg-[#2d4a3e]",
  "step-done": "bg-[#2d4a3e]",
  decision: "bg-[#c4903a]",
  "signal-update": "bg-amber-500",
  "work-progress": "bg-[#2d4a3e]/60",
};

function SignalBadge({ signal }: { signal: ACMISignal }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground capitalize">{signal.key}</span>
      <span className="font-medium">{String(signal.value)}</span>
    </div>
  );
}

function TimelineItem({ event }: { event: ACMIEvent }) {
  return (
    <div className="flex gap-3 py-2 border-b last:border-0">
      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${kindColors[event.kind] || "bg-gray-400"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{event.summary}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {event.kind}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(event.ts).getTime())} {event.correlationId && `· ${event.correlationId}`}
        </p>
      </div>
    </div>
  );
}

export default function AgentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ACMIBootstrap | null>(null);

  useEffect(() => {
    fetchAgentBootstrap(id).then(setData);
  }, [id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading agent profile...</div>
      </div>
    );
  }

  const { profile, signals, timeline } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-sm capitalize ml-auto"
        >
          {profile.status}
        </Badge>
      </div>

      {/* Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">{cap}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Model & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{profile.model || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Active</span>
                  <span className="font-medium">
                    {profile.lastActive ? formatRelativeTime(new Date(profile.lastActive).getTime()) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{profile.status}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Rollup Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{String(data.rollup.decisions || 0)}</p>
                    <p>Decisions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{String(data.rollup.actions || 0)}</p>
                    <p>Actions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{timeline.length}</p>
                    <p>Recent Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {signals.map((sig) => (
                  <SignalBadge key={sig.key} signal={sig} />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {timeline.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No recent events.</p>
                )}
                {timeline.map((evt) => (
                  <TimelineItem key={evt.id} event={evt} />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
