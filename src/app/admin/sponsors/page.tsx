import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader><CardTitle>Sponsors</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Sponsors fund prize pools or run sponsored draws. CRUD is read-only
          in this MVP — use the Supabase dashboard to add or deactivate
          sponsors for now.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">URL</th>
                <th className="py-2 pr-3">Contact</th>
                <th className="py-2 pr-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="py-1.5 pr-3 font-medium">{s.name}</td>
                  <td className="py-1.5 pr-3"><code className="text-xs">{s.url ?? "—"}</code></td>
                  <td className="py-1.5 pr-3 text-xs">{s.contact_email ?? "—"}</td>
                  <td className="py-1.5 pr-3">{s.active ? "yes" : "no"}</td>
                </tr>
              ))}
              {sponsors.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No sponsors.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
