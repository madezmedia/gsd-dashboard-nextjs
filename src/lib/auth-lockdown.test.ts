import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("nocodb viewer requires NOCODB_API_KEY and has no literal token fallback", () => {
  const src = readFileSync(join(srcRoot, "app/api/nocodb-viewer/route.ts"), "utf8");
  assert.equal(src.includes("nc_pat_"), false);
  assert.match(src, /process\.env\.NOCODB_API_KEY/);
  assert.match(src, /NOCODB_API_KEY is not configured/);
});

test("repo source has no NocoDB personal-access-token literal", () => {
  const files = [
    "app/api/nocodb-viewer/route.ts",
    "app/api/nocodb/[...path]/route.ts",
    "../scripts/sync-gsd-docs-to-nocodb.mjs",
    "../scripts/push-archival-to-nocodb.mjs",
  ];
  for (const file of files) {
    const src = readFileSync(join(srcRoot, file), "utf8");
    assert.equal(src.includes("nc_pat_"), false, file);
  }
});

test("saas_register_tenant is refused and does not write tenant records", () => {
  const src = readFileSync(join(srcRoot, "app/api/acmi/route.ts"), "utf8");
  const start = src.indexOf('if (tool === "saas_register_tenant")');
  assert.notEqual(start, -1);
  const slice = src.slice(start, start + 600);
  assert.match(slice, /status: 403/);
  assert.equal(slice.includes("HSET"), false);
  assert.equal(slice.includes("saas:token:"), false);
});
