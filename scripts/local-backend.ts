/**
 * Local stand-in for Supabase, for running the whole site on your own
 * machine (`npm run local`). Serves the real migration from PGlite
 * (Postgres in WebAssembly) behind a PostgREST-shaped HTTP API.
 *
 * LOCAL ONLY: it trusts any JWT without checking its signature, and adds
 * dev endpoints for instant sign-in and "draw now".
 */
import http from "node:http";
import path from "node:path";
import { openDb, type TestDb } from "../tests/db";
import { runLifecycle, type RpcClient } from "../src/lib/lifecycle";

const PORT = Number(process.env.LOCAL_API_PORT || 54321);
const DATA_DIR = process.env.LOCAL_DB_DIR === "memory" ? undefined : path.resolve(process.env.LOCAL_DB_DIR || ".local-db");

type Role = "anon" | "authenticated" | "service_role";

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const fakeJwt = (payload: object) => `${b64({ alg: "none", typ: "JWT" })}.${b64({ exp: 4102444800, ...payload })}.${Buffer.from("local-unsigned").toString("base64url")}`;

function claims(header: string | undefined): Record<string, string> {
  try {
    return JSON.parse(Buffer.from((header ?? "").replace(/^Bearer /, "").split(".")[1], "base64url").toString());
  } catch {
    return {};
  }
}

function roleOf(c: Record<string, string>): { role: Role; uid: string | null } {
  if (c.role === "service_role") return { role: "service_role", uid: null };
  if (c.sub) return { role: "authenticated", uid: c.sub };
  return { role: "anon", uid: null };
}

function rpcClient(db: TestDb): RpcClient {
  return {
    async rpc(fn, args = {}) {
      const names = Object.keys(args);
      try {
        const [row] = await db.q<{ r: unknown }>(
          `select ${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(", ")}) as r`,
          names.map((n) => args[n]),
        );
        return { data: row?.r ?? null, error: null };
      } catch (err) {
        return { data: null, error: { message: (err as Error).message } };
      }
    },
  };
}

/** Dev-only: ends the current week's draw now and draws it with a live drand round. */
async function drawNow(db: TestDb) {
  const [open] = await db.q<{ id: string }>("select id from draws where status = 'open' order by week_start desc limit 1");
  if (!open) throw new Error("No open draw.");
  // Move it back to the earliest free week so a fresh draw opens for this week.
  await db.q(
    `update draws set
       week_start = (select min(week_start) - 7 from draws),
       opens_at = opens_at - interval '7 days',
       closes_at = now() - interval '1 minute',
       randomness_round = drand_round_at(now() - interval '30 seconds')
     where id = $1`,
    [open.id],
  );
  return runLifecycle(rpcClient(db));
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

async function main() {
  const db = await openDb(DATA_DIR);

  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") return send(res, 204, undefined);
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString();
    const body = raw ? JSON.parse(raw) : {};
    const jwt = claims(req.headers.authorization);
    const { role, uid } = roleOf(jwt);

    try {
      // --- dev endpoints ---------------------------------------------
      if (url.pathname === "/__dev/login") {
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) return send(res, 400, { message: "Enter an email address." });
        let [user] = await db.q<{ id: string }>("select id from auth.users where email = $1", [email]);
        if (!user) [user] = await db.q<{ id: string }>("insert into auth.users (email) values ($1) returning id", [email]);
        if (email.startsWith("admin@")) await db.q("update profiles set is_admin = true where id = $1", [user.id]);
        return send(res, 200, {
          access_token: fakeJwt({ sub: user.id, email, role: "authenticated", aud: "authenticated" }),
          refresh_token: `local-${user.id}`,
        });
      }
      if (url.pathname === "/__dev/draw-now") {
        if (role !== "authenticated" || !(await db.q("select 1 from profiles where id = $1 and is_admin", [uid])).length) {
          return send(res, 403, { message: "Admins only." });
        }
        return send(res, 200, await drawNow(db));
      }
      if (url.pathname === "/__sql" && process.env.LOCAL_ALLOW_SQL === "1") {
        return send(res, 200, await db.q(body.sql, body.params ?? []));
      }

      // --- auth (just enough for supabase-js) --------------------------
      if (url.pathname === "/auth/v1/user") {
        if (!jwt.sub) return send(res, 401, { message: "Not signed in." });
        return send(res, 200, {
          id: jwt.sub, email: jwt.email, aud: "authenticated", role: "authenticated",
          app_metadata: {}, user_metadata: {}, created_at: new Date(0).toISOString(),
        });
      }
      if (url.pathname.startsWith("/auth/v1/")) return send(res, 200, {});

      // --- PostgREST ---------------------------------------------------
      const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
      if (rpc) {
        const names = Object.keys(body);
        const sql = `select ${rpc[1]}(${names.map((n, i) => `${n} => $${i + 1}`).join(", ")}) as r`;
        const [row] = await db.as<{ r: unknown }>(role, uid, sql, names.map((n) => body[n]));
        return send(res, 200, row?.r ?? null);
      }
      const table = url.pathname.match(/^\/rest\/v1\/(\w+)$/);
      if (table && req.method === "GET") {
        const cols = (url.searchParams.get("select") ?? "*").replace(/[^\w,*]/g, "");
        const where: string[] = [];
        const params: unknown[] = [];
        for (const [k, v] of url.searchParams) {
          if (k === "select" || k === "order") continue;
          params.push(v.replace(/^eq\./, ""));
          where.push(`${k.replace(/\W/g, "")} = $${params.length}`);
        }
        const order = url.searchParams.get("order")?.split(".")[0].replace(/\W/g, "");
        const sql = `select ${cols} from ${table[1]}${where.length ? " where " + where.join(" and ") : ""}${order ? ` order by ${order}` : ""}`;
        return send(res, 200, await db.as(role, uid, sql, params));
      }
      send(res, 404, { message: "Not found." });
    } catch (err) {
      const message = (err as Error).message;
      send(res, /permission denied/.test(message) ? 403 : 400, { message, code: "P0001", details: null, hint: null });
    }
  });

  server.listen(PORT, () =>
    console.log(`Local database API on http://localhost:${PORT} (${DATA_DIR ? `data in ${DATA_DIR}` : "in memory"})`),
  );
}

main();
