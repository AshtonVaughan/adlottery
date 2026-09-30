/**
 * Minimal in-memory stand-in for the supabase-js query builder, covering
 * the calls the server lifecycle makes. Enforces the schema's unique
 * constraints (error code 23505) and PostgREST's 1000-row response cap.
 */
import { randomUUID } from "node:crypto";

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { code?: string; message: string } | null; count?: number | null };

const UNIQUE: Record<string, string[][]> = {
  draws: [["week_start"]],
  draw_secrets: [["draw_id"]],
  entries: [["draw_id", "user_id", "entry_date"]],
  winners: [["draw_id"]],
};
const ROW_CAP = 1000;

// Column defaults from supabase/migrations/0001_schema.sql.
const DEFAULTS: Record<string, Row> = {
  draws: {
    status: "open", currency: "USD", sponsor_id: null, seed: null, randomness: null,
    total_entries: null, winner_index: null, winning_entry_id: null, prize_amount: null, drawn_at: null,
  },
  winners: { status: "pending", legal_name: null, payout_details: null, payout_reference: null, claimed_at: null, paid_at: null },
};

export class FakeDb {
  tables: Record<string, Row[]> = {};
  private clock = Date.parse("2025-01-01T00:00:00Z");

  rows(table: string): Row[] {
    return (this.tables[table] ??= []);
  }
  tick(): string {
    this.clock += 1000;
    return new Date(this.clock).toISOString();
  }
  from(table: string) {
    return new Query(this, table);
  }
}

class Query implements PromiseLike<Result> {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private filters: ((r: Row) => boolean)[] = [];
  private orders: [string, boolean][] = [];
  private payload: Row | Row[] | null = null;
  private returning = false;
  private head = false;
  private wantCount = false;
  private from_ = 0;
  private to_ = Infinity;
  private limit_ = Infinity;

  constructor(private db: FakeDb, private table: string) {}

  select(_cols?: string, opts?: { head?: boolean; count?: string }) {
    if (this.op === "select") {
      this.head = Boolean(opts?.head);
      this.wantCount = Boolean(opts?.count);
    } else {
      this.returning = true;
    }
    return this;
  }
  insert(p: Row | Row[]) { this.op = "insert"; this.payload = p; return this; }
  update(p: Row) { this.op = "update"; this.payload = p; return this; }
  delete() { this.op = "delete"; return this; }
  eq(c: string, v: unknown) { this.filters.push((r) => r[c] === v); return this; }
  in(c: string, v: unknown[]) { this.filters.push((r) => v.includes(r[c])); return this; }
  lt(c: string, v: string) { this.filters.push((r) => String(r[c]) < v); return this; }
  lte(c: string, v: string) { this.filters.push((r) => String(r[c]) <= v); return this; }
  gt(c: string, v: string) { this.filters.push((r) => String(r[c]) > v); return this; }
  order(c: string, o?: { ascending?: boolean }) { this.orders.push([c, o?.ascending !== false]); return this; }
  range(a: number, b: number) { this.from_ = a; this.to_ = b; return this; }
  limit(n: number) { this.limit_ = n; return this; }

  async single(): Promise<Result> {
    const r = await this.exec();
    const rows = r.data as Row[];
    if (r.error) return r;
    if (rows.length !== 1) return { data: null, error: { message: "not exactly one row" } };
    return { data: rows[0], error: null };
  }
  async maybeSingle(): Promise<Result> {
    const r = await this.exec();
    return r.error ? r : { data: (r.data as Row[])[0] ?? null, error: null };
  }
  then<A, B>(ok?: (r: Result) => A | PromiseLike<A>, bad?: (e: unknown) => B | PromiseLike<B>) {
    return this.exec().then(ok, bad);
  }

  private matching(): Row[] {
    return this.db.rows(this.table).filter((r) => this.filters.every((f) => f(r)));
  }

  private async exec(): Promise<Result> {
    const all = this.db.rows(this.table);
    if (this.op === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const created: Row[] = [];
      for (const item of items) {
        const row: Row = { id: randomUUID(), created_at: this.db.tick(), ...DEFAULTS[this.table], ...item };
        for (const cols of UNIQUE[this.table] ?? []) {
          if (all.some((r) => cols.every((c) => r[c] === row[c]))) {
            return { data: null, error: { code: "23505", message: `duplicate ${cols.join(",")}` } };
          }
        }
        all.push(row);
        created.push(row);
      }
      return { data: this.returning ? created : null, error: null };
    }
    if (this.op === "update") {
      const rows = this.matching();
      rows.forEach((r) => Object.assign(r, this.payload));
      return { data: this.returning ? rows : null, error: null };
    }
    if (this.op === "delete") {
      const rows = this.matching();
      this.db.tables[this.table] = all.filter((r) => !rows.includes(r));
      return { data: null, error: null };
    }
    let rows = this.matching();
    if (this.head) return { data: null, error: null, count: rows.length };
    for (const [c, asc] of [...this.orders].reverse()) {
      rows = [...rows].sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : String(a[c]) > String(b[c]) ? 1 : 0) * (asc ? 1 : -1));
    }
    const end = Math.min(this.to_ + 1, this.from_ + ROW_CAP, this.from_ + this.limit_);
    return { data: rows.slice(this.from_, end), error: null, count: this.wantCount ? rows.length : undefined };
  }
}
