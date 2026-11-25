import { connection } from "next/server";
import { Suspense } from "react";
import { AccountView } from "@/components/studio/account-view";
import { createServerSupabase } from "@/lib/supabase/server";
import { Loading } from "@/components/spinner";

export const metadata = { title: "Account", robots: { index: false } };

const metadataString = (metadata: Record<string, unknown>, ...keys: string[]) =>
  keys.map((key) => metadata[key]).find((value): value is string => typeof value === "string" && value.length > 0) ?? null;

/** Reads the session, so it streams in behind a Suspense boundary. */
async function AccountDetails() {
  // Supabase checks token expiry against the clock, which is request-time data.
  await connection();
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const metadata = user?.user_metadata ?? {};
  return (
    <AccountView
      email={user?.email ?? null}
      name={metadataString(metadata, "full_name", "name")}
      avatarUrl={metadataString(metadata, "avatar_url", "picture")}
    />
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 lg:py-14">
      <h1 className="mb-8 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">Account</h1>
      <Suspense fallback={<Loading label="Loading your account" className="py-20" />}>
        <AccountDetails />
      </Suspense>
    </div>
  );
}
