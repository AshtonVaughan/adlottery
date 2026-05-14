import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminDrawActions } from "@/components/admin/admin-draw-actions";
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

  const [{ data: entries, count: entryCount }, { data: claim }] = await Promise.all([
    admin
      .from("entries")
      .select("id, user_id, source, source_ref, country_code, created_at", { count: "exact" })
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
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{draw.title}</CardTitle>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {draw.draw_type.replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={draw.status === "drawn" ? "info" : draw.status === "active" ? "success" : "default"}>
              {draw.status}
            </Badge>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/draws/${draw.id}/export.csv`}>Export entries CSV</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Prize">{formatCurrency(Number(draw.prize_amount), draw.currency)}</Row>
          <Row label="Window">{formatDateTime(draw.starts_at)} → {formatDateTime(draw.ends_at)}</Row>
          <Row label="Eligible">{draw.eligible_country_codes.join(", ")}</Row>
          <Row label="Excluded">{draw.excluded_country_codes.join(", ") || "—"}</Row>
          <Row label="Sponsor">{draw.sponsor_name ?? "—"}</Row>
          <Row label="Total entries">{(entryCount ?? 0).toLocaleString()}</Row>
          {draw.status === "drawn" && (
            <>
              <Row label="Public seed"><code className="break-all">{draw.public_seed}</code></Row>
              <Row label="Public seed hash"><code className="break-all text-xs">{draw.public_seed_hash}</code></Row>
              <Row label="Randomness source">{draw.randomness_source}</Row>
              <Row label="Winning entry">{draw.winning_entry_id ? maskEntryId(draw.winning_entry_id) : "—"}</Row>
            </>
          )}
        </CardContent>
      </Card>

      <AdminDrawActions draw={draw} hasEntries={(entryCount ?? 0) > 0} hasClaim={!!claim} />

      <Card>
        <CardHeader><CardTitle>Latest entries</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Entry</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Country</th>
                  <th className="py-2 pr-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {(entries as Pick<Entry, "id" | "source" | "source_ref" | "country_code" | "created_at">[] | null)?.map((e) => (
                  <tr key={e.id} className="border-t border-border/60">
                    <td className="py-1.5 pr-3"><code className="text-xs">{maskEntryId(e.id)}</code></td>
                    <td className="py-1.5 pr-3">{e.source.replace(/_/g, " ")}</td>
                    <td className="py-1.5 pr-3">{e.country_code}</td>
                    <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                      {formatDateTime(e.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words text-foreground">{children}</span>
    </div>
  );
}
