/**
 * `npm run local`: runs the whole site on your machine, no accounts needed.
 * Starts the local database API and the Next.js dev server pointed at it.
 * Data persists in .local-db/ (delete it to start over).
 */
import { spawn } from "node:child_process";

const API_PORT = process.env.LOCAL_API_PORT || "54321";
const SITE_PORT = process.env.PORT || "3000";
const env = {
  ...process.env,
  LOCAL_API_PORT: API_PORT,
  NEXT_PUBLIC_LOCAL_DEV: "1",
  NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${API_PORT}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local",
  NEXT_PUBLIC_APP_URL: `http://localhost:${SITE_PORT}`,
  NEXT_PUBLIC_BASE_PATH: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

const procs = [
  spawn("npx", ["tsx", "scripts/local-backend.ts"], { env, stdio: "inherit" }),
  spawn("npx", ["next", "dev", "-p", SITE_PORT], { env, stdio: "inherit" }),
];

setTimeout(() => {
  console.log(`\n  The Weekly Pot is running at http://localhost:${SITE_PORT}`);
  console.log("  Sign in with any email. Use admin@example.com for the admin page.\n");
}, 4000);

const stop = () => {
  for (const p of procs) p.kill();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const p of procs) p.on("exit", (code) => code && stop());
