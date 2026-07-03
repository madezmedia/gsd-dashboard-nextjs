"use client";

import { useState } from "react";
import {
  Key,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  RefreshCcw,
  ExternalLink,
} from "lucide-react";

type SaveResult = {
  ok: boolean;
  error?: string;
  results?: { component: string; action: string; ok: boolean; detail?: string }[];
  mode?: string;
};

type GscForm = {
  client_email: string;
  private_key: string;
};
type GoogleAdsForm = {
  client_id: string;
  client_secret: string;
  developer_token: string;
  login_customer_id: string;
};

export default function IntegrationsPage() {
  const [gsc, setGsc] = useState<GscForm>({ client_email: "", private_key: "" });
  const [googleAds, setGoogleAds] = useState<GoogleAdsForm>({
    client_id: "",
    client_secret: "",
    developer_token: "",
    login_customer_id: "",
  });
  const [showGscKey, setShowGscKey] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showDevToken, setShowDevToken] = useState(false);

  const [testing, setTesting] = useState<"gsc" | "ads" | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Test the credentials end-to-end (calls the save route in test mode)
  async function testCredentials(target: "gsc" | "ads") {
    setTesting(target);
    setError(null);
    setResult(null);
    try {
      const body = target === "gsc"
        ? { gsc, test_only: true }
        : { google_ads: googleAds, test_only: true };
      const res = await fetch("/api/integrations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Test failed");
    } finally {
      setTesting(null);
    }
  }

  // Save everything
  async function saveAll() {
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/integrations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gsc, google_ads: googleAds }),
      });
      const data = await res.json();
      setResult(data);
      if (!data.ok) setError(data.error || "Save failed");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] font-sans text-[#1a1a1a]">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold font-mono uppercase tracking-tight flex items-center gap-3">
            <Key className="h-8 w-8 text-[#2d4a3e]" />
            Integrations
          </h1>
          <p className="text-sm text-[#1a1a1a]/60 mt-2 font-mono">
            Add Google Search Console + Google Ads credentials. Validated end-to-end
            before save. Stored in SerpBear DB + VM key files + docker-compose env.
          </p>
        </header>

        {/* GOOGLE SEARCH CONSOLE */}
        <section className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mono uppercase flex items-center gap-2">
              <Search className="h-5 w-5" />
              Google Search Console
            </h2>
            <a
              href="https://console.cloud.google.com/iam-admin/serviceaccounts"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-[#2d4a3e] hover:underline flex items-center gap-1"
            >
              Create service account <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="text-xs font-mono text-[#1a1a1a]/60">
            Requires a service account JSON key + the service account email must
            be added as a user in Google Search Console for each domain.
            See <a className="underline" href="https://docs.serpbear.com/miscellaneous/integrate-google-search-console" target="_blank" rel="noreferrer">docs</a>.
          </p>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1">
              Service Account Email
            </label>
            <input
              type="text"
              value={gsc.client_email}
              onChange={(e) => setGsc({ ...gsc, client_email: e.target.value })}
              placeholder="my-sa@my-project.iam.gserviceaccount.com"
              className="w-full px-3 py-2 border border-[#1a1a1a]/20 bg-[#faf9f5] font-mono text-sm focus:outline-none focus:border-[#2d4a3e]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1">
              Private Key (paste full -----BEGIN PRIVATE KEY----- block)
            </label>
            <div className="relative">
              <textarea
                value={gsc.private_key}
                onChange={(e) => setGsc({ ...gsc, private_key: e.target.value })}
                placeholder="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
                rows={6}
                className="w-full px-3 py-2 pr-10 border border-[#1a1a1a]/20 bg-[#faf9f5] font-mono text-xs focus:outline-none focus:border-[#2d4a3e] resize-y"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
              />
              <button
                type="button"
                onClick={() => setShowGscKey(!showGscKey)}
                className="absolute top-2 right-2 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/80"
              >
                {showGscKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => testCredentials("gsc")}
              disabled={testing === "gsc" || !gsc.client_email || !gsc.private_key}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-[#1a1a1a] bg-[#faf9f5] hover:bg-[#1a1a1a]/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing === "gsc" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Test GSC
            </button>
          </div>
        </section>

        {/* GOOGLE ADS */}
        <section className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mono uppercase flex items-center gap-2">
              <Key className="h-5 w-5" />
              Google Ads
            </h2>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-[#2d4a3e] hover:underline flex items-center gap-1"
            >
              OAuth credentials <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="text-xs font-mono text-[#1a1a1a]/60">
            Requires OAuth 2.0 client + a developer token from Google Ads API Center.
            After saving here, complete the OAuth flow in SerpBear UI to get a refresh token.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1">
                OAuth Client ID
              </label>
              <input
                type="text"
                value={googleAds.client_id}
                onChange={(e) => setGoogleAds({ ...googleAds, client_id: e.target.value })}
                placeholder="xxxxx.apps.googleusercontent.com"
                className="w-full px-3 py-2 border border-[#1a1a1a]/20 bg-[#faf9f5] font-mono text-sm focus:outline-none focus:border-[#2d4a3e]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1">
                OAuth Client Secret
              </label>
              <div className="relative">
                <input
                  type={showClientSecret ? "text" : "password"}
                  value={googleAds.client_secret}
                  onChange={(e) => setGoogleAds({ ...googleAds, client_secret: e.target.value })}
                  placeholder="GOCSPX-..."
                  className="w-full px-3 py-2 pr-10 border border-[#1a1a1a]/20 bg-[#faf9f5] font-mono text-sm focus:outline-none focus:border-[#2d4a3e]"
                />
                <button
                  type="button"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/80"
                >
                  {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1">
                Developer Token
              </label>
              <div className="relative">
                <input
                  type={showDevToken ? "text" : "password"}
                  value={googleAds.developer_token}
                  onChange={(e) => setGoogleAds({ ...googleAds, developer_token: e.target.value })}
                  placeholder="xxx-yy-zzzz"
                  className="w-full px-3 py-2 pr-10 border border-[#1a1a1a]/20 bg-[#faf9f5] font-mono text-sm focus:outline-none focus:border-[#2d4a3e]"
                />
                <button
                  type="button"
                  onClick={() => setShowDevToken(!showDevToken)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/80"
                >
                  {showDevToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1">
                Login Customer ID (MCC / test account, optional)
              </label>
              <input
                type="text"
                value={googleAds.login_customer_id}
                onChange={(e) => setGoogleAds({ ...googleAds, login_customer_id: e.target.value })}
                placeholder="590-948-9101"
                className="w-full px-3 py-2 border border-[#1a1a1a]/20 bg-[#faf9f5] font-mono text-sm focus:outline-none focus:border-[#2d4a3e]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => testCredentials("ads")}
              disabled={
                testing === "ads" ||
                !googleAds.client_id ||
                !googleAds.client_secret ||
                !googleAds.developer_token
              }
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-[#1a1a1a] bg-[#faf9f5] hover:bg-[#1a1a1a]/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing === "ads" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Test Google Ads
            </button>
          </div>
        </section>

        {/* ACTIONS */}
        <section className="flex items-center gap-4 sticky bottom-4 bg-[#faf9f5] p-4 border-t-2 border-[#2d4a3e]">
          <button
            onClick={saveAll}
            disabled={
              saving ||
              (!gsc.client_email && !googleAds.client_id)
            }
            className="px-6 py-3 text-sm font-mono uppercase tracking-wider bg-[#2d4a3e] text-[#faf9f5] hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save & Apply to SerpBear
          </button>
          <button
            onClick={() => {
              setGsc({ client_email: "", private_key: "" });
              setGoogleAds({ client_id: "", client_secret: "", developer_token: "", login_customer_id: "" });
              setResult(null);
              setError(null);
            }}
            className="px-4 py-3 text-sm font-mono uppercase tracking-wider border border-[#1a1a1a]/20 hover:bg-[#1a1a1a]/5 flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Clear
          </button>
          <a
            href="https://serpbear-u70402.vm.elestio.app/settings"
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs font-mono text-[#2d4a3e] hover:underline flex items-center gap-1"
          >
            Open SerpBear settings <ExternalLink className="h-3 w-3" />
          </a>
        </section>

        {/* RESULT */}
        {error && (
          <div className="border border-red-500 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono uppercase tracking-wider text-sm text-red-900">Error</h3>
              <pre className="text-xs text-red-800 mt-1 whitespace-pre-wrap font-mono">{error}</pre>
            </div>
          </div>
        )}
        {result && result.ok && (
          <div className="border border-emerald-500 bg-emerald-50 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-mono uppercase tracking-wider text-sm text-emerald-900">
                  {result.mode === "test_only" ? "Validation OK" : "Saved OK"}
                </h3>
                <p className="text-xs text-emerald-800 mt-1 font-mono">
                  {result.mode === "test_only"
                    ? "Credentials validated end-to-end. Click 'Save & Apply' to persist."
                    : "Credentials saved to SerpBear. Restart may take a few seconds."}
                </p>
                {result.results && (
                  <ul className="mt-3 space-y-1 text-xs font-mono">
                    {result.results.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {r.ok ? (
                          <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-bold">{r.component}/{r.action}:</span> {r.detail}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        {result && !result.ok && (
          <div className="border border-red-500 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono uppercase tracking-wider text-sm text-red-900">Failed</h3>
              <pre className="text-xs text-red-800 mt-1 whitespace-pre-wrap font-mono">{result.error}</pre>
            </div>
          </div>
        )}

        {/* NEXT STEPS */}
        <section className="border border-[#1a1a1a]/15 bg-[#faf9f5] p-6 text-sm space-y-2">
          <h3 className="font-mono uppercase tracking-wider font-bold text-xs">After saving</h3>
          <ol className="list-decimal list-inside space-y-1 text-xs font-mono text-[#1a1a1a]/70">
            <li>
              <strong>For GSC:</strong> In Google Search Console, add the service account email
              as a user with "Full" permission for each of the 5 properties.
            </li>
            <li>
              <strong>For Google Ads:</strong> Open SerpBear settings → Google Ads → "Connect",
              complete the OAuth consent flow. The refresh_token gets stored automatically.
            </li>
            <li>
              <strong>Restart SerpBear</strong> if the env vars changed: <code className="bg-[#1a1a1a]/5 px-1">cd /opt/app/serpbear && docker compose restart serpbear</code>
            </li>
            <li>
              <strong>Trigger GSC data fetch</strong> from the SerpBear UI: domain settings → "Refresh Search Console Data".
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
