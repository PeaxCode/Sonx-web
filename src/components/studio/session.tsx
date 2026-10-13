"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppleSignInButton } from "@/components/apple-button";
import { GoogleSignInButton } from "@/components/google-button";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { getSupabase } from "@/lib/supabase/client";

interface SignInRequest {
  /** Where the OAuth round trip lands, so the visitor picks up where they left off. */
  next: string;
  title?: string;
  text?: string;
}

interface SessionValue {
  /** null until the browser session has been read. */
  signedIn: boolean | null;
  requestSignIn: (request: SignInRequest) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

function SignInDialog({ request, onClose }: { request: SignInRequest; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { opacity: 0, duration: 0.2 });
    gsap.from(".signin-panel", { scale: 0.96, y: 8, opacity: 0, duration: 0.3, ease: "power2.out" });
  }, { scope: ref });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="signin-panel w-full max-w-sm rounded-[var(--radius-panel)] border border-line bg-plum p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <Image src="/images/sonx-icon.png" alt="" width={40} height={40} className="rounded-xl" />
        <h2 id="signin-title" className="mt-5 font-display text-xl font-semibold">
          {request.title ?? "Sign in to create your song"}
        </h2>
        <p className="mt-3 text-fog">
          {request.text ?? "Your first song is free. Use the same account as the Sonx app and everything stays in sync."}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <AppleSignInButton next={request.next} />
          <GoogleSignInButton next={request.next} />
        </div>
        <p className="mt-5 text-xs text-fog">
          By continuing you agree to the{" "}
          <a href="https://www.getsonx.com/terms.html" className="underline hover:text-paper">terms</a> and{" "}
          <a href="https://www.getsonx.com/privacy.html" className="underline hover:text-paper">privacy policy</a>.
        </p>
        <button type="button" onClick={onClose} className="mt-4 w-full py-2 text-sm text-fog hover:text-paper">
          Not now
        </button>
      </div>
    </div>
  );
}

/**
 * The studio is open to visitors; sign-in is asked for only when they act
 * (create, write lyrics), through a dialog that returns them to `next`.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [request, setRequest] = useState<SignInRequest | null>(null);

  useEffect(() => {
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session && !session.user.is_anonymous));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const close = useCallback(() => setRequest(null), []);
  const value = useMemo<SessionValue>(() => ({ signedIn, requestSignIn: setRequest }), [signedIn]);

  return (
    <SessionContext.Provider value={value}>
      {children}
      {request && <SignInDialog request={request} onClose={close} />}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
