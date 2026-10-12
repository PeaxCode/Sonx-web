"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

/** "Sign in" for visitors, "Open studio" once a session exists in this browser. */
export function HeaderAction() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session && !session.user.is_anonymous));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <Link href={signedIn ? "/create" : "/login"}
      className="rounded-full border border-line px-5 py-2 text-sm font-medium transition hover:bg-plum">
      {signedIn ? "Open studio" : "Sign in"}
    </Link>
  );
}
