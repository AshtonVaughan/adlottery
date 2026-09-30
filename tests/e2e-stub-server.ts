/**
 * Local stand-in for the Supabase REST API (PostgREST), backed by the real
 * migration in PGlite. Used only by the browser end-to-end check; it trusts
 * the JWT's `sub` claim without verifying it.
 *
 *   npx tsx tests/e2e-stub-server.ts   (listens on :54321)
 */
import http from "node:http";
import { freshDb } from "./db";

const PORT = Number(process.env.STUB_PORT || 54321);

function roleFromAuth(header: string | undefined): { role: "anon" | "authenticated" | "service_role"; uid: string | null } {
  const token = header?.replace(/^Bearer /, "") ?? "";
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    if (payload.role === "service_role") return { role: "service_role", uid: null };
    if (payload.sub) return { role: "authenticated", uid: payload.sub };
  } catch {}
  return { role: "anon", uid: null };
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
const db = await freshDb();
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, undefined);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString() || "{}") : {};
  const { role, uid } = roleFromAuth(req.headers.authorization);

  try {
    // Test control endpoint: run raw SQL as superuser.
    if (url.pathname === "/__sql") {
      return send(res, 200, await db.q(body.sql, body.params ?? []));
    }
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
    if (url.pathname.startsWith("/auth/v1/")) return send(res, 200, {});
    send(res, 404, { message: "not found" });
  } catch (err) {
    const message = (err as Error).message;
    send(res, /permission denied/.test(message) ? 403 : 400, { message, code: "P0001", details: null, hint: null });
  }
});

server.listen(PORT, () => console.log(`stub supabase on :${PORT}`));
}

main();
