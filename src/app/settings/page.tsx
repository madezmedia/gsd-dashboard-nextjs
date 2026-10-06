"use client";

import { useState, useEffect } from "react";
import { Save, Key, Palette, Database, Eye, EyeOff, Clipboard, Check, RefreshCw, XCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { acmiCall } from "@/lib/acmi-client";

export default function Settings() {
  // Existing Settings States
  const [groqKey, setGroqKey] = useState("");
  const [deepgramKey, setDeepgramKey] = useState("");
  const [savedKeys, setSavedKeys] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [compactSidebar, setCompactSidebar] = useState(false);

  // UI Flow States
  const [showActiveToken, setShowActiveToken] = useState(false);
  const [copiedActiveToken, setCopiedActiveToken] = useState(false);

  // Active Connection Info States
  const [activeToken, setActiveToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("acmi_token");
    }
    return null;
  });
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [tenantInfo, setTenantInfo] = useState<{ id: string; name: string; routingKey: string } | null>(null);

  const verifyConnectivity = async (token: string | null) => {
    setConnectionStatus("checking");
    try {
      // Attempt to invoke the SaaS telemetry status tool if implemented
      const res = await acmiCall("saas_get_status").catch(() => null);
      if (res && res.ok && res.result) {
        setConnectionStatus("connected");
        setTenantInfo({
          id: res.result.id || "default",
          name: res.result.name || "Default Shared",
          routingKey: res.result.routing_key || "gsd:acmi:shared"
        });
      } else {
        // Fallback: ping using standard acmi_list to verify database reachability
        const ping = await acmiCall("acmi_list", { namespace: "agent" }).catch(() => null);
        if (ping) {
          setConnectionStatus("connected");
          if (token) {
            setTenantInfo({
              id: "custom-tenant",
              name: "Isolated Upstash Workspace",
              routingKey: `gsd:acmi:tenant:${token.substring(0, 8)}...`
            });
          } else {
            setTenantInfo({
              id: "shared-default",
              name: "Default Shared Workspace",
              routingKey: "gsd:acmi:shared"
            });
          }
        } else {
          setConnectionStatus("offline");
          setTenantInfo(null);
        }
      }
    } catch (e) {
      console.error("Connectivity check failed:", e);
      setConnectionStatus("offline");
      setTenantInfo(null);
    }
  };

  // Verify connectivity on mount
  useEffect(() => {
    // Run asynchronously to satisfy the strict linter rule preventing synchronous setState inside effects
    const timer = setTimeout(() => {
      verifyConnectivity(activeToken);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeToken]);
  
  // Load AI credentials from localStorage on mount safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        setGroqKey(window.localStorage.getItem("groq_api_key") || "");
        setDeepgramKey(window.localStorage.getItem("deepgram_api_key") || "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDisconnectWorkspace = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("acmi_token");
      setActiveToken(null);
      window.location.reload();
    }
  };

  const handleSaveKeys = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("groq_api_key", groqKey.trim());
      window.localStorage.setItem("deepgram_api_key", deepgramKey.trim());
      setSavedKeys(true);
      setTimeout(() => setSavedKeys(false), 2000);
    }
  };

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl p-6 min-h-screen bg-[#faf9f5] text-[#2d4a3e] selection:bg-[#c4903a] selection:text-white">
      {/* Page Header */}
      <div className="border-b border-[#2d4a3e]/15 pb-5">
        <div className="font-mono text-xs uppercase tracking-widest text-[#c4903a] mb-1">
          [WORKSPACE SYSTEM ENGINE: ONLINE]
        </div>
        <h1 className="text-3xl font-bold tracking-tight font-serif text-[#2d4a3e]">
          System Settings
        </h1>
        <p className="text-sm text-[#2d4a3e]/70 mt-1 max-w-2xl">
          Configure secure API integrations and themes. Workspace registration is closed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Main SaaS Control Panel */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Active Workspace Status Panel */}
          <Card className="bg-[#f4f2eb] border-[#2d4a3e]/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#c4903a]" />
            <CardHeader className="pb-3">
              <div className="font-mono text-xs uppercase tracking-wider text-[#c4903a] mb-1">
                [WORKSPACE: ACTIVE STATUS]
              </div>
              <CardTitle className="text-lg font-serif flex items-center justify-between">
                <span>Active Connection Metrics</span>
                <span className="flex items-center gap-1.5">
                  {connectionStatus === "checking" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-amber-500/10 text-[#c4903a]">
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                      VERIFYING
                    </span>
                  )}
                  {connectionStatus === "connected" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-[#2d4a3e]/10 text-[#2d4a3e] border border-[#2d4a3e]/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2d4a3e] animate-pulse mr-1.5" />
                      SECURE
                    </span>
                  )}
                  {connectionStatus === "offline" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-red-500/10 text-red-700 border border-red-500/20">
                      <XCircle className="h-3 w-3 mr-1 text-red-600" />
                      DISCONNECTED
                    </span>
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#faf9f5] p-3 rounded border border-[#2d4a3e]/10">
                  <div className="text-[#2d4a3e]/50 mb-1">RESOLVED TENANT ID</div>
                  <div className="font-semibold text-sm truncate text-[#2d4a3e]">
                    {tenantInfo?.id || "default"}
                  </div>
                </div>
                <div className="bg-[#faf9f5] p-3 rounded border border-[#2d4a3e]/10">
                  <div className="text-[#2d4a3e]/50 mb-1">ACTIVE ROUTING KEY</div>
                  <div className="font-semibold text-sm truncate text-[#c4903a]">
                    {tenantInfo?.routingKey || "gsd:acmi:shared"}
                  </div>
                </div>
              </div>

              {/* Active Token Display */}
              <div className="bg-[#faf9f5] p-4 rounded border border-[#2d4a3e]/10 font-mono text-xs">
                <div className="flex items-center justify-between text-[#2d4a3e]/50 mb-2">
                  <span>TENANT INJECTION TOKEN (LOCAL STORAGE)</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowActiveToken(!showActiveToken)}
                      className="hover:text-[#2d4a3e] text-[#2d4a3e]/50 transition-colors cursor-pointer"
                      title={showActiveToken ? "Hide Token" : "Reveal Token"}
                    >
                      {showActiveToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    {activeToken && (
                      <button 
                        onClick={() => copyToClipboard(activeToken, setCopiedActiveToken)}
                        className="hover:text-[#2d4a3e] text-[#2d4a3e]/50 transition-colors cursor-pointer"
                        title="Copy to Clipboard"
                      >
                        {copiedActiveToken ? <Check className="h-3.5 w-3.5 text-[#2d4a3e]" /> : <Clipboard className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-[#f4f2eb] p-2.5 rounded font-mono break-all text-xs border border-[#2d4a3e]/5 flex items-center">
                  {activeToken ? (
                    <span className="font-semibold text-[#2d4a3e]">
                      {showActiveToken ? activeToken : "••••••••••••••••••••••••••••••••••••••••••••••••"}
                    </span>
                  ) : (
                    <span className="italic text-[#2d4a3e]/40">
                      No custom token cached. Operating on default shared database workspace telemetry.
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => verifyConnectivity(activeToken)}
                  className="font-mono text-xs border-[#2d4a3e]/30 text-[#2d4a3e] hover:bg-[#2d4a3e]/5 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  PING ROUTER
                </Button>
                {activeToken && (
                  <Button 
                    size="sm" 
                    onClick={handleDisconnectWorkspace}
                    className="font-mono text-xs bg-transparent border border-red-500/30 text-red-700 hover:bg-red-500/5 cursor-pointer ml-auto animate-fade-in"
                  >
                    DISCONNECT CUSTOM WORKSPACE
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#faf9f5] border-[#2d4a3e]/20 shadow-sm">
            <CardHeader className="border-b border-[#2d4a3e]/10 pb-4">
              <div className="font-mono text-xs uppercase tracking-wider text-[#c4903a] mb-1">
                [PROVISIONING: LOCKED]
              </div>
              <CardTitle className="text-xl font-serif text-[#2d4a3e]">
                Tenant registration is disabled
              </CardTitle>
              <CardDescription className="text-xs text-[#2d4a3e]/60">
                This dashboard no longer creates tenants or access tokens. An operator provisions workspaces outside this API.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-4 bg-[#2d4a3e]/10 border border-[#2d4a3e]/20 text-[#2d4a3e] text-xs font-mono rounded flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-[#c4903a] mt-0.5 flex-shrink-0" />
                <span>saas_register_tenant is closed. Requests return 403 and do not write tenant or token records.</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right 1 Column: API keys & Global Visual Customization */}
        <div className="space-y-8">
          
          {/* API Credentials Card */}
          <Card className="bg-[#faf9f5] border-[#2d4a3e]/15 shadow-sm">
            <CardHeader className="pb-3 border-b border-[#2d4a3e]/10">
              <div className="font-mono text-xs uppercase tracking-wider text-[#c4903a] mb-1">
                [COGNITION: CREDENTIALS]
              </div>
              <CardTitle className="text-sm font-serif font-bold text-[#2d4a3e] flex items-center gap-2">
                <Key className="h-4 w-4 text-[#c4903a]" /> AI API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="groq-key" className="text-xs font-mono font-medium text-[#2d4a3e]/80 uppercase">Groq API Key</Label>
                <Input
                  id="groq-key"
                  type="password"
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="bg-[#faf9f5] border-[#2d4a3e]/20 focus:border-[#2d4a3e] focus:ring-1 focus:ring-[#2d4a3e] font-mono text-xs text-[#2d4a3e]"
                />
                <p className="text-xs text-[#2d4a3e]/50 leading-normal">
                  Used as the default LLM provider for the Fleet Copilot agent.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deepgram-key" className="text-xs font-mono font-medium text-[#2d4a3e]/80 uppercase">Deepgram API Key</Label>
                <Input
                  id="deepgram-key"
                  type="password"
                  placeholder="Insert Deepgram API Key..."
                  value={deepgramKey}
                  onChange={(e) => setDeepgramKey(e.target.value)}
                  className="bg-[#faf9f5] border-[#2d4a3e]/20 focus:border-[#2d4a3e] focus:ring-1 focus:ring-[#2d4a3e] font-mono text-xs text-[#2d4a3e]"
                />
                <p className="text-xs text-[#2d4a3e]/50 leading-normal">
                  Used for real-time voice streaming and speech transcription.
                </p>
              </div>

              <Button 
                size="sm" 
                onClick={handleSaveKeys}
                disabled={!groqKey && !deepgramKey}
                className={`text-white font-mono text-xs w-full cursor-pointer transition-all duration-300 ${
                  savedKeys 
                    ? "bg-[#2d4a3e] border border-[#5ef2c6]/30 shadow-[0_0_8px_rgba(94,242,198,0.2)]" 
                    : "bg-[#2d4a3e] hover:bg-[#1f332a]"
                }`}
              >
                {savedKeys ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-[#5ef2c6] animate-pulse" />
                    Cognition Keys Saved ✔
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save Cognition Keys
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Theme & Visual Card */}
          <Card className="bg-[#faf9f5] border-[#2d4a3e]/15 shadow-sm">
            <CardHeader className="pb-3 border-b border-[#2d4a3e]/10">
              <div className="font-mono text-xs uppercase tracking-wider text-[#c4903a] mb-1">
                [INTERFACE: PARAMETERS]
              </div>
              <CardTitle className="text-sm font-serif font-bold text-[#2d4a3e] flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#c4903a]" /> Visual Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-xs text-[#2d4a3e]">Contrast Dark Mode</Label>
                  <p className="text-xs text-[#2d4a3e]/50">Toggle high-contrast theme</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <Separator className="bg-[#2d4a3e]/10" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-xs text-[#2d4a3e]">Letterpress Sidebar</Label>
                  <p className="text-xs text-[#2d4a3e]/50">Collapse navigation index</p>
                </div>
                <Switch checked={compactSidebar} onCheckedChange={setCompactSidebar} />
              </div>
            </CardContent>
          </Card>

          {/* Connected Data Sources Tracker */}
          <Card className="bg-[#faf9f5] border-[#2d4a3e]/15 shadow-sm">
            <CardHeader className="pb-3 border-b border-[#2d4a3e]/10">
              <div className="font-mono text-xs uppercase tracking-wider text-[#c4903a] mb-1">
                [CHANNELS: TELEMETRY]
              </div>
              <CardTitle className="text-sm font-serif font-bold text-[#2d4a3e] flex items-center gap-2">
                <Database className="h-4 w-4 text-[#c4903a]" /> Verified Streams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-[#2d4a3e]">ACMI Bus Stream</p>
                  <p className="text-xs text-[#2d4a3e]/50 uppercase">REAL-TIME SSE BUS</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-[#2d4a3e]" title="Active Telemetry" />
              </div>
              <Separator className="bg-[#2d4a3e]/10" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-[#2d4a3e]">Control Plane API</p>
                  <p className="text-xs text-[#2d4a3e]/50 uppercase">PROXIED CLIENT</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-[#2d4a3e]" title="Active Router" />
              </div>
              <Separator className="bg-[#2d4a3e]/10" />
              <div className="flex items-center justify-between">
                <div className="truncate max-w-[180px]">
                  <p className="font-semibold text-xs text-[#2d4a3e]">SSE Bridge</p>
                  <p className="text-xs text-[#2d4a3e]/50 uppercase truncate">/api/bus/stream</p>
                </div>
                <span className="text-xs text-[#c4903a] font-semibold bg-[#c4903a]/10 px-1.5 py-0.5 rounded">
                  BRIDGED
                </span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
