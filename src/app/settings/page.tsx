"use client";

import { useState } from "react";
import { Save, Key, Palette, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const [groqKey, setGroqKey] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure API keys, theme, and data sources.</p>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4" /> API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groq-key">Groq API Key</Label>
            <Input
              id="groq-key"
              type="password"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used as the default LLM provider for the Fleet Copilot.
            </p>
          </div>
          <Button size="sm" disabled={!groqKey}>
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Key
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Compact Sidebar</Label>
              <p className="text-xs text-muted-foreground">Collapse sidebar by default</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" /> Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">ACMI Bus</p>
              <p className="text-xs text-muted-foreground">Real-time event stream</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500" title="Connected" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">ACMI Fleet API</p>
              <p className="text-xs text-muted-foreground">Agent profiles and signals</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500" title="Connected" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bus SSE Stream</p>
              <p className="text-xs text-muted-foreground">
                gsd-dashboard-pi.vercel.app/api/bus/stream
              </p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500" title="Via Proxy" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
