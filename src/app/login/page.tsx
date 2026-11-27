import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { AppleSignInButton } from "@/components/apple-button";
import { EmailSignIn, OrDivider } from "@/components/email-sign-in";
import { GoogleSignInButton } from "@/components/google-button";

export const metadata = { title: "Sign in or create your account", robots: { index: false } };

/** Same-site paths only. Browsers read "\" as "/" and drop tabs and newlines, so "/\evil.com" is refused too. */
const safeNext = (value?: string) =>
  value && value.startsWith("/") && !value.startsWith("//") && !/[\\\u0000-\u001f]/.test(value) ? value : "/create";

type LoginSearchParams = Promise<{ next?: string; error?: string }>;

async function SignInError({ searchParams }: { searchParams: LoginSearchParams }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p role="alert" className="mt-6 rounded-[var(--radius-control)] border border-danger/40 px-4 py-3 text-sm">
      Sign-in did not finish. Try again.
    </p>
  );
}

async function SignInButton({ searchParams }: { searchParams: LoginSearchParams }) {
  const { next } = await searchParams;
  return (
    <div className="flex flex-col gap-3">
      <GoogleSignInButton next={safeNext(next)} />
      <AppleSignInButton next={safeNext(next)} />
      <OrDivider />
      <EmailSignIn next={safeNext(next)} />
    </div>
  );
}

export default function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4">
      <Link href="/" className="absolute left-4 top-5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-fog transition hover:bg-paper/10 hover:text-paper md:left-8">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to Sonx
      </Link>
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2.5">
          <Image src="/images/sonx-icon.png" alt="" width={40} height={40} className="rounded-xl" />
          <span className="font-display text-xl font-semibold">Sonx</span>
        </Link>
        <h1 className="text-center font-display text-2xl font-semibold">Create your free account</h1>
        <p className="mt-3 text-center text-fog">
          Turn a sentence or your own lyrics into a full song with AI vocals.
        </p>
        <p className="mt-2 text-center text-sm text-fog">
          Already use the Sonx app? Sign in with the same account and your songs, credits and plan are here.
        </p>
        <Suspense fallback={null}>
          <SignInError searchParams={searchParams} />
        </Suspense>
        <div className="mt-8">
          <Suspense fallback={<GoogleSignInButton />}>
            <SignInButton searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-fog">
          By continuing you agree to the{" "}
          <a href="https://www.getsonx.com/terms.html" className="underline hover:text-paper">terms</a> and{" "}
          <a href="https://www.getsonx.com/privacy.html" className="underline hover:text-paper">privacy policy</a>.
        </p>
      </div>
    </main>
  );
}
