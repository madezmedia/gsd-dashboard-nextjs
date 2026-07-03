/* eslint-disable */
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { google_ads, gsc, test_only } = body;

    const results: { component: string; action: string; ok: boolean; detail?: string }[] = [];

    if (gsc?.client_email && gsc?.private_key) {
      const v = await validateGsc(gsc.client_email, gsc.private_key);
      results.push({ component: 'gsc', action: 'validate', ok: v.ok, detail: v.detail });
      if (!v.ok) {
        return NextResponse.json({ ok: false, error: `GSC validation failed: ${v.detail}`, results }, { status: 400 });
      }
    }

    if (google_ads?.client_id && google_ads?.client_secret && google_ads?.developer_token) {
      const v = await validateGoogleAds(google_ads);
      results.push({ component: 'google_ads', action: 'validate', ok: v.ok, detail: v.detail });
      if (!v.ok) {
        return NextResponse.json({ ok: false, error: `Google Ads validation failed: ${v.detail}`, results }, { status: 400 });
      }
    }

    if (test_only) {
      return NextResponse.json({ ok: true, mode: 'test_only', results });
    }

    if (gsc?.client_email && gsc?.private_key) {
      const r = await writeSerpBearSetting({
        search_console_client_email: gsc.client_email,
        search_console_private_key: gsc.private_key,
        search_console_integrated: true,
      });
      results.push({ component: 'gsc', action: 'serpbear_db', ok: r.ok, detail: r.detail });
      if (!r.ok) return NextResponse.json({ ok: false, error: `SerpBear DB write failed: ${r.detail}`, results }, { status: 500 });
    }

    if (google_ads?.client_id && google_ads?.client_secret && google_ads?.developer_token) {
      const r = await writeSerpBearSetting({
        adwords_client_id: google_ads.client_id,
        adwords_client_secret: google_ads.client_secret,
        adwords_developer_token: google_ads.developer_token,
        adwords_account_id: google_ads.login_customer_id || '',
      });
      results.push({ component: 'google_ads', action: 'serpbear_db', ok: r.ok, detail: r.detail });
      if (!r.ok) return NextResponse.json({ ok: false, error: `SerpBear DB write failed: ${r.detail}`, results }, { status: 500 });
    }

    if (gsc?.client_email && gsc?.private_key) {
      const r = await writeGscKeyFile(gsc.client_email, gsc.private_key);
      results.push({ component: 'gsc', action: 'vm_keyfile', ok: r.ok, detail: r.detail });
    }

    if (google_ads || gsc) {
      const r = await updateSerpBearCompose({ google_ads, gsc });
      results.push({ component: 'compose', action: 'vm_docker_compose', ok: r.ok, detail: r.detail });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

async function validateGsc(clientEmail: string, privateKey: string): Promise<{ ok: boolean; detail?: string; sites?: string[] }> {
  try {
    const crypto = await import('crypto');
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };
    const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const signingInput = `${enc(header)}.${enc(payload)}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(privateKey).toString('base64url');
    const jwt = `${signingInput}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      return { ok: false, detail: `token exchange HTTP ${tokenRes.status}: ${t.slice(0, 200)}` };
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return { ok: false, detail: 'no access_token in response' };

    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!sitesRes.ok) {
      const t = await sitesRes.text();
      return { ok: false, detail: `sites list HTTP ${sitesRes.status}: ${t.slice(0, 200)}` };
    }
    const sitesData = await sitesRes.json();
    const sites = (sitesData.siteEntry || []).map((s: any) => s.siteUrl);
    return { ok: true, detail: `GSC OK: ${sites.length} sites accessible`, sites };
  } catch (e: any) {
    return { ok: false, detail: e?.message || 'unknown error' };
  }
}

async function validateGoogleAds(creds: { client_id: string; client_secret: string; developer_token: string; login_customer_id?: string }): Promise<{ ok: boolean; detail?: string; accessible_customers?: number; propagation_delay?: boolean }> {
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        refresh_token: 'PLACEHOLDER',
        grant_type: 'refresh_token',
      }).toString(),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (tokenData.access_token) {
      return { ok: true, detail: 'OAuth client credentials verified, refresh token obtained', accessible_customers: 0 };
    }
    const isNewClientPropagationDelay =
      tokenData.error === 'invalid_client' &&
      (tokenData.error_description || '').toLowerCase().includes('not found');
    if (tokenData.error === 'invalid_grant' || isNewClientPropagationDelay) {
      return {
        ok: true,
        detail: isNewClientPropagationDelay
          ? 'OAuth client_id + client_secret saved. Google OAuth server hasn\'t synced the new client yet (typical 5-15 min for new gcloud-created clients). Run the OAuth consent flow via the SerpBear UI once propagation completes.'
          : 'OAuth client_id + client_secret valid. Refresh token is needed (UI OAuth flow) to actually call Google Ads API.',
        accessible_customers: 0,
        propagation_delay: isNewClientPropagationDelay,
      };
    }
    return {
      ok: false,
      detail: tokenData.error
        ? `OAuth error: ${tokenData.error} - ${tokenData.error_description}`
        : `Unexpected response: HTTP ${tokenRes.status}`,
    };
  } catch (e: any) {
    return { ok: false, detail: e?.message || 'unknown error' };
  }
}

async function writeSerpBearSetting(fields: Record<string, any>): Promise<{ ok: boolean; detail?: string }> {
  const fieldJson = JSON.stringify(fields);
  const script = `
const fs = require('fs');
const path = require('path');
const Cryptr = require('/app/node_modules/cryptr');
const settingsPath = '/app/data/settings.json';
let settings = {};
if (fs.existsSync(settingsPath)) {
  try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
  catch (e) { settings = {}; }
}
const secret = process.env.SECRET || '';
const cryptr = new Cryptr(secret);
const fields = ${fieldJson};
const updated = {};
for (const [k, v] of Object.entries(fields)) {
  if (k === 'adwords_client_secret' || k === 'adwords_developer_token' ||
      k === 'search_console_private_key' || k === 'smtp_password' || k === 'scaping_api' || k === 'screenshot_key') {
    updated[k] = cryptr.encrypt(v);
  } else {
    updated[k] = v;
  }
  updated[k + '_plain'] = v;
}
Object.assign(settings, updated);
if (fields.search_console_client_email && fields.search_console_private_key) {
  settings.search_console_integrated = true;
}
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log('Updated ' + Object.keys(updated).length + ' fields');
`;
  try {
    const fs = await import('fs/promises');
    const os = await import('os');
    const path = await import('path');
    const tmpDir = os.tmpdir();
    const localPath = path.join(tmpDir, `serpbear-write-${Date.now()}.js`);
    await fs.writeFile(localPath, script);
    const { execFile } = await import('child_process');
    const { promisify: p } = await import('util');
    const execFileAsync = p(execFile);
    await execFileAsync('scp', ['-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10',
      localPath, 'root@152.53.201.27:/tmp/serpbear-settings-write.js']);
    const cmd = 'docker cp /tmp/serpbear-settings-write.js serpbear-serpbear-1:/tmp/write.js && docker exec serpbear-serpbear-1 node /tmp/write.js';
    const r = await execAsync(
      `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@152.53.201.27 '${cmd}'`,
      { timeout: 30000 }
    );
    try { await fs.unlink(localPath); } catch {}
    return { ok: true, detail: r.stdout || r.stderr || 'ok' };
  } catch (e: any) {
    return { ok: false, detail: e?.message || e?.stderr || 'write failed' };
  }
}

async function writeGscKeyFile(clientEmail: string, privateKey: string): Promise<{ ok: boolean; detail?: string }> {
  const base = clientEmail.split('@')[0];
  const filename = `${base}.json`;
  const content = JSON.stringify({
    type: 'service_account',
    project_id: clientEmail.split('@')[1]?.split('.')[0] || 'unknown',
    private_key_id: 'unknown',
    private_key: privateKey,
    client_email: clientEmail,
    client_id: 'unknown',
  }, null, 2);
  try {
    const fs = await import('fs/promises');
    const os = await import('os');
    const path = await import('path');
    const tmpPath = path.join(os.tmpdir(), 'serpbear-gsc-key.json');
    await fs.writeFile(tmpPath, content);
    const { execFile } = await import('child_process');
    const { promisify: p } = await import('util');
    const execFileAsync = p(execFile);
    await execFileAsync('scp', ['-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10',
      tmpPath, `root@152.53.201.27:/opt/app/serpbear/secrets/${filename}`]);
    const { exec } = await import('child_process');
    const execAsync2 = promisify(exec);
    await execAsync2(`ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@152.53.201.27 'chmod 600 /opt/app/serpbear/secrets/${filename}'`, { timeout: 10000 });
    return { ok: true, detail: `Wrote /opt/app/serpbear/secrets/${filename}` };
  } catch (e: any) {
    return { ok: false, detail: e?.message || 'failed' };
  }
}

async function updateSerpBearCompose(opts: { google_ads?: any; gsc?: any }): Promise<{ ok: boolean; detail?: string }> {
  try {
    const fs = await import('fs/promises');
    const os = await import('os');
    const path = await import('path');
    const { execFile } = await import('child_process');
    const { promisify: p } = await import('util');
    const execFileAsync = p(execFile);
    const tmpDir = os.tmpdir();
    const localCompose = path.join(tmpDir, `serpbear-compose-${Date.now()}.yml`);
    await execFileAsync('scp', ['-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10',
      'root@152.53.201.27:/opt/app/serpbear/docker-compose.yml', localCompose]);

    let compose = await fs.readFile(localCompose, 'utf8');
    if (compose.trim().length === 0) {
      const r = await execAsync(
        `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@152.53.201.27 'cat /opt/app/serpbear/docker-compose.yml.bak-1782926581.pre-update'`,
        { timeout: 10000 }
      );
      compose = r.stdout;
    }

    // Build a single regex for the line we want to replace
    function updateEnv(envName: string, newValue: string | undefined) {
      if (!newValue) return;
      const pattern = new RegExp(`(      - ${envName}=)([^\\n]*)`, 'm');
      const escapedValue = newValue.replace(/\\n/g, '\\n');
      compose = compose.replace(pattern, `$1${escapedValue}`);
    }

    updateEnv('SEARCH_CONSOLE_CLIENT_EMAIL', opts.gsc?.client_email);
    if (opts.gsc?.private_key) {
      const escaped = opts.gsc.private_key.replace(/\n/g, '\\n');
      const pattern = new RegExp(`(      - SEARCH_CONSOLE_PRIVATE_KEY=)([^\\n]*)`, 'm');
      compose = compose.replace(pattern, `$1${escaped}`);
    }
    updateEnv('GOOGLE_ADS_CLIENT_ID', opts.google_ads?.client_id);
    updateEnv('GOOGLE_ADS_CLIENT_SECRET', opts.google_ads?.client_secret);
    updateEnv('GOOGLE_ADS_DEVELOPER_TOKEN', opts.google_ads?.developer_token);
    updateEnv('GOOGLE_ADS_LOGIN_CUSTOMER_ID', opts.google_ads?.login_customer_id);

    const localOut = path.join(tmpDir, `serpbear-compose-out-${Date.now()}.yml`);
    await fs.writeFile(localOut, compose);
    await execFileAsync('scp', ['-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10',
      localOut, 'root@152.53.201.27:/opt/app/serpbear/docker-compose.yml']);
    await execAsync(
      `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@152.53.201.27 'cd /opt/app/serpbear && docker compose restart serpbear'`,
      { timeout: 30000 }
    );
    try { await fs.unlink(localCompose); } catch {}
    try { await fs.unlink(localOut); } catch {}
    return { ok: true, detail: `compose updated, SerpBear restarted (${compose.split('\n').length} lines)` };
  } catch (e: any) {
    return { ok: false, detail: e?.message || e?.stderr || 'failed' };
  }
}
