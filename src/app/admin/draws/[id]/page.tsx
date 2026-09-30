import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminDrawActions } from "@/components/admin/admin-draw-actions";
import { DrawEditForm } from "@/components/admin/draw-edit-form";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDateTime, maskEntryId } from "@/lib/utils";
import type { Draw, Entry, WinnerClaim } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDrawDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = getSupabaseAdminClient();
  const { data: draw } = await admin
    .from("draws")
    .select("*")
    .eq("id", id)
    .maybeSingle<Draw>();
  if (!draw) notFound();

  const [{ data: entries, count: entryCount }, { data: claim }] =
    await Promise.all([
      admin
        .from("entries")
        .select(
          "id, user_id, source, source_ref, country_code, created_at",
          { count: "exact" },
        )
        .eq("draw_id", draw.id)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("winner_claims")
        .select("*")
        .eq("draw_id", draw.id)
        .maybeSingle<WinnerClaim>(),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/draws"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← All draws
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant={
                draw.status === "drawn"
                  ? "info"
                  : draw.status === "active"
                  ? "success"
                  : draw.status === "locked"
                  ? "warning"
                  : "default"
              }
            >
              {draw.status}
            </Badge>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {draw.draw_type.replace(/_/g, " ")}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {draw.title}
          </h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/draws/${draw.id}/export.csv`}>
            <Download className="h-4 w-4" /> Entries CSV
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-6 text-sm">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Prize &amp; window
            </p>
            <p className="stat text-3xl font-semibold">
              {formatCurrency(Number(draw.prize_amount), draw.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(draw.starts_at)} → {formatDateTime(draw.ends_at)}
            </p>
            <p className="text-xs text-muted-foreground">
              {(entryCount ?? 0).toLocaleString()} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-6 text-sm">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Eligibility
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground">Eligible: </span>
              <span className="break-all font-mono">
                {draw.eligible_country_codes.join(", ")}
              </span>
            </p>
            {draw.excluded_country_codes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground">Excluded: </span>
                <span className="break-all font-mono">
                  {draw.excluded_country_codes.join(", ")}
                </span>
              </p>
            )}
            {draw.sponsor_name && (
              <p className="text-xs text-muted-foreground">
                Sponsor:{" "}
                <span className="text-foreground">{draw.sponsor_name}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {draw.status === "drawn" && (
        <Card>
          <CardContent className="space-y-2 p-6 font-mono text-xs">
            <p className="font-sans text-[11px] uppercase tracking-widest text-muted-foreground">
              Fairness proof
            </p>
            <p>
              <span className="text-muted-foreground">public_seed: </span>
              <span className="break-all">{draw.public_seed}</span>
            </p>
            <p>
              <span className="text-muted-foreground">public_seed_hash: </span>
              <span className="break-all">{draw.public_seed_hash}</span>
            </p>
            <p>
              <span className="text-muted-foreground">randomness_round: </span>
              {draw.randomness_round ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">randomness_source: </span>
              <span className="break-all">{draw.randomness_source}</span>
            </p>
            <p>
              <span className="text-muted-foreground">winning_entry: </span>
              {draw.winning_entry_id ? maskEntryId(draw.winning_entry_id) : "—"}
            </p>
          </CardContent>
        </Card>
      )}

      <AdminDrawActions
        draw={draw}
        hasEntries={(entryCount ?? 0) > 0}
        hasClaim={!!claim}
      />

      {draw.status === "draft" && <DrawEditForm draw={draw} />}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-baseline justify-between px-6 py-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Latest entries
            </p>
            <span className="text-xs text-muted-foreground">
              showing up to 50
            </span>
          </div>
          <div className="overflow-x-auto border-t border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 pl-6 pr-3 font-medium">Entry</th>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Country</th>
                  <th className="py-2 pr-6 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {(
                  entries as
                    | Pick<
                        Entry,
                        | "id"
                        | "source"
                        | "source_ref"
                        | "country_code"
                        | "created_at"
                      >[]
                    | null
                )?.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                  >
                    <td className="py-2 pl-6 pr-3">
                      <code className="font-mono text-xs">
                        {maskEntryId(e.id)}
                      </code>
                    </td>
                    <td className="py-2 pr-3 text-foreground/80">
                      {e.source.replace(/_/g, " ")}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {e.country_code}
                    </td>
                    <td className="py-2 pr-6 text-xs text-muted-foreground">
                      {formatDateTime(e.created_at)}
                    </td>
                  </tr>
                ))}
                {(!entries || entries.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="border-t border-white/[0.04] py-10 text-center text-sm text-muted-foreground"
                    >
                      No entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
