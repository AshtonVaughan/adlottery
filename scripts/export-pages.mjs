/**
 * Static preview for GitHub Pages. The real app needs a server (secret
 * draw seeds, entries, cron), so this only snapshots the demo-mode pages:
 * build with PAGES_BASE_PATH, start the server without Supabase keys,
 * save each page's HTML, and copy the static assets.
 *
 *   PAGES_BASE_PATH=/adlottery npm run build && node scripts/export-pages.mjs
 */
import { spawn } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.PAGES_BASE_PATH || "";
const port = 3200;
const origin = `http://127.0.0.1:${port}`;
const out = path.resolve("out");

const env = { ...process.env, PORT: String(port), NEXT_TELEMETRY_DISABLED: "1" };
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  delete env[key];
}
const server = spawn("npx", ["next", "start", "-p", String(port)], { env, stdio: "inherit" });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${origin}${base}/rules`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server did not start.");
}

async function save(route, file) {
  const res = await fetch(`${origin}${base}${route}`);
  if (!res.ok && route !== "/404-preview") throw new Error(`${route}: HTTP ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());
  const target = path.join(out, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  console.log(`saved ${route} -> ${file}`);
  return body.toString("utf8");
}

try {
  await waitForServer();
  await rm(out, { recursive: true, force: true });

  const home = await save("/", "index.html");
  for (const route of ["/results", "/rules", "/privacy", "/login"]) {
    await save(route, `${route.slice(1)}/index.html`);
  }
  const drawIds = [...new Set([...home.matchAll(/\/draws\/(demo-[0-9-]+)/g)].map((m) => m[1]))];
  for (const id of drawIds) await save(`/draws/${id}`, `draws/${id}/index.html`);
  await save("/icon.svg", "icon.svg");
  await save("/404-preview", "404.html");

  await cp(".next/static", path.join(out, "_next/static"), { recursive: true });
  await writeFile(path.join(out, ".nojekyll"), "");
  console.log(`Exported ${drawIds.length + 6} pages to ${out}`);
} finally {
  server.kill();
}
