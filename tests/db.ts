/**
 * Loads the real migration into PGlite (Postgres compiled to WASM) with a
 * minimal stand-in for Supabase's auth schema and API roles.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
`;

const GRANTS = `
  grant select on all tables in schema public to anon, authenticated;
  grant all on all tables in schema public to service_role;
`;

export async function freshDb(): Promise<TestDb> {
  return openDb();
}

/** In-memory by default; pass a directory to persist between runs. */
export async function openDb(dataDir?: string): Promise<TestDb> {
  const pg = new PGlite(dataDir);
  const { rows } = await pg.query<{ ready: boolean }>("select to_regclass('public.draws') is not null as ready");
  if (!rows[0].ready) {
    await pg.exec(SUPABASE_STUB);
    await pg.exec(readFileSync(path.resolve("supabase/migrations/0001_schema.sql"), "utf8"));
    await pg.exec(GRANTS);
  }
  return new TestDb(pg);
}

export class TestDb {
  constructor(readonly pg: PGlite) {}

  /** Runs as the superuser (like the service role, bypasses RLS). */
  async q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.pg.query<T>(sql, params)).rows;
  }

  async one<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T> {
    const rows = await this.q<T>(sql, params);
    if (rows.length !== 1) throw new Error(`expected 1 row, got ${rows.length}`);
    return rows[0];
  }

  /** Runs as an API role, optionally signed in as `uid`. */
  async as<T = Record<string, unknown>>(
    role: "anon" | "authenticated" | "service_role",
    uid: string | null,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    await this.pg.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? ""]);
    await this.pg.exec(`set role ${role}`);
    try {
      return (await this.pg.query<T>(sql, params)).rows;
    } finally {
      await this.pg.exec("reset role");
      await this.pg.query(`select set_config('request.jwt.claim.sub', '', false)`);
    }
  }

  async createUser(email: string, profile?: { name: string; country: string; admin?: boolean }): Promise<string> {
    const { id } = await this.one<{ id: string }>(
      "insert into auth.users (email) values ($1) returning id",
      [email],
    );
    if (profile) {
      await this.as("authenticated", id, "select save_profile($1, $2, true, true)", [profile.name, profile.country]);
      if (profile.admin) await this.q("update profiles set is_admin = true where id = $1", [id]);
    }
    return id;
  }
}
