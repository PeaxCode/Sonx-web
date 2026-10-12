import { Suspense } from "react";
import { AccountView } from "@/components/studio/account-view";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Account" };

const metadataString = (metadata: Record<string, unknown>, ...keys: string[]) =>
  keys.map((key) => metadata[key]).find((value): value is string => typeof value === "string" && value.length > 0) ?? null;

/** Reads the session, so it streams in behind a Suspense boundary. */
async function AccountDetails() {
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
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 lg:py-12">
      <h1 className="mb-8 font-display text-2xl font-semibold">Account</h1>
      <Suspense fallback={<p className="text-fog">Loading your account</p>}>
        <AccountDetails />
      </Suspense>
    </div>
  );
}
