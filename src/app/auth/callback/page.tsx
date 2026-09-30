"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DEMO } from "@/lib/config";

/** Magic-link landing page: exchanges the ?code= for a session. */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(DEMO);

  useEffect(() => {
    const db = supabase();
    if (!db) return;
    const code = new URLSearchParams(window.location.search).get("code");
    const done = (ok: boolean) => (ok ? router.replace("/") : setFailed(true));

    // detectSessionInUrl may already have exchanged the code.
    db.auth.getSession().then(async ({ data }) => {
      if (data.session) return done(true);
      if (!code) return done(false);
      const { error } = await db.auth.exchangeCodeForSession(code);
      done(!error);
    });
  }, [router]);

  return (
    <div className="container max-w-md py-24 text-center">
      {failed ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">That link didn&apos;t work</h1>
          <p className="mt-2 text-muted">It may have expired or been opened in a different browser.</p>
          <Link href="/login/" className="btn-dark mt-8">Get a new link</Link>
        </>
      ) : (
        <p className="text-muted">Signing you in…</p>
      )}
    </div>
  );
}
