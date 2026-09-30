import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSession()) redirect("/account");
  const { error } = await searchParams;
  return (
    <div className="container max-w-md py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in to enter</h1>
      <p className="mt-2 text-muted">We&apos;ll email you a sign-in link. No password, and it&apos;s always free.</p>
      {error === "link" && (
        <p className="mt-6 rounded-xl border border-bad/30 bg-bad/5 p-3 text-sm text-bad">
          That link has expired or was already used. Request a new one.
        </p>
      )}
      <div className="mt-8">
        {isSupabaseConfigured() ? (
          <LoginForm />
        ) : (
          <p className="card p-4 text-sm text-muted">Sign-in is off in demo mode. Add your Supabase keys to enable it.</p>
        )}
      </div>
    </div>
  );
}
