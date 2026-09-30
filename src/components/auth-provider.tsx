"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getMyStatus } from "@/lib/queries";
import { DEMO } from "@/lib/config";
import type { MyStatus } from "@/lib/types";

interface AuthState {
  demo: boolean;
  ready: boolean;
  session: Session | null;
  me: MyStatus | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  demo: DEMO,
  ready: false,
  session: null,
  me: null,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(DEMO);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MyStatus | null>(null);

  const load = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) {
      setMe(null);
    } else {
      try {
        setMe(await getMyStatus());
      } catch {
        setMe(null);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const db = supabase();
    if (!db) return;
    db.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = db.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const value: AuthState = {
    demo: DEMO,
    ready,
    session,
    me,
    refresh: async () => load(session),
    signOut: async () => {
      await supabase()?.auth.signOut();
      await load(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
