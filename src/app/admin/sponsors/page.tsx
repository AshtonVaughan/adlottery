import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Sponsor {
  id: string;
  name: string;
  url: string | null;
  contact_email: string | null;
  active: boolean;
  created_at: string;
}

export default async function AdminSponsorsPage() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("sponsors")
    .select("*")
    .order("created_at", { ascending: false });
  const sponsors = (data as Sponsor[]) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Sponsors</h2>
        <p className="text-sm text-muted-foreground">
          Sponsors fund prize pools and run sponsored draws. CRUD is read-only
          here — use the Supabase dashboard or a follow-up admin form to add
          new sponsors.
        </p>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-3 pl-5 pr-3 font-medium">Name</th>
                  <th className="py-3 pr-3 font-medium">URL</th>
                  <th className="py-3 pr-3 font-medium">Contact</th>
                  <th className="py-3 pr-5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="py-2 pl-5 pr-3 font-medium">{s.name}</td>
                    <td className="py-2 pr-3">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-foreground hover:underline"
                        >
                          {s.url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {s.contact_email ?? "—"}
                    </td>
                    <td className="py-2 pr-5">
                      <Badge variant={s.active ? "success" : "default"}>
                        {s.active ? "active" : "inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {sponsors.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No sponsors yet.
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
