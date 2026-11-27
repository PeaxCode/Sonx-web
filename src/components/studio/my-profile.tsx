"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchMyProfile, isAllowedAvatar, saveProfile, suggestHandle, validateHandle, type ProfileInput, type PublicProfile } from "@/lib/profiles";
import { randomPresetAvatar } from "@/lib/avatars";
import { getSupabase } from "@/lib/supabase/client";
import { ProfileDialog } from "./profile-dialog";
import { useSession } from "./session";

interface MyProfileValue {
  /** undefined while loading (or signed out before the session is read); null when there is none. */
  profile: PublicProfile | null | undefined;
  refresh: () => Promise<void>;
  /** Opens the profile dialog; `then` runs after a successful save. */
  editProfile: (then?: () => void) => void;
  /** The user's profile, created from the sign-in name and picture if there is none yet. */
  ensureProfile: () => Promise<PublicProfile>;
}

const MyProfileContext = createContext<MyProfileValue | null>(null);

const metadataString = (metadata: Record<string, unknown>, ...keys: string[]) =>
  keys.map((key) => metadata[key]).find((value): value is string => typeof value === "string" && value.length > 0) ?? null;

/** The signed-in user's public profile, shared by Account, publish switches and Follow buttons. */
export function MyProfileProvider({ children }: { children: React.ReactNode }) {
  const { signedIn } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [editing, setEditing] = useState<{ initial: ProfileInput; isNew: boolean; signInAvatar: string | null } | null>(null);
  const afterSave = useRef<(() => void) | undefined>(undefined);
  // The latest profile for callbacks created before it existed (e.g. a toast's Edit button).
  const latest = useRef(profile);
  useEffect(() => {
    latest.current = profile;
  }, [profile]);

  const refresh = useCallback(async () => {
    setProfile(await fetchMyProfile().catch(() => null));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (signedIn) void refresh();
  }, [signedIn, refresh]);

  /**
   * Name, avatar and a handle suggestion from the sign-in account. Apple and email sign-ins carry
   * no picture, so those start on a random preset; `signInAvatar` is the account's own picture only.
   */
  const signInDefaults = useCallback(async (): Promise<ProfileInput & { signInAvatar: string | null }> => {
    const { data } = await getSupabase().auth.getUser();
    const metadata = data.user?.user_metadata ?? {};
    const email = data.user?.email ?? "";
    // "Hide my email" relay addresses are random letters, not a name worth showing.
    const emailName = email.endsWith("@privaterelay.appleid.com") ? "" : email.split("@")[0];
    const name = metadataString(metadata, "full_name", "name") ?? emailName;
    const avatar = metadataString(metadata, "avatar_url", "picture");
    const signInAvatar = isAllowedAvatar(avatar) ? avatar : null;
    return {
      handle: suggestHandle(name), display_name: name.slice(0, 40) || "Sonx artist", bio: "",
      avatar_url: signInAvatar ?? randomPresetAvatar(), signInAvatar,
    };
  }, []);

  const ensureProfile = useCallback(async (): Promise<PublicProfile> => {
    const existing = profile ?? (await fetchMyProfile().catch(() => null));
    if (existing) return existing;
    const defaults: ProfileInput = await signInDefaults();
    // The suggested handle, then numbered variants, then a random one: the first free one wins.
    const base = defaults.handle && !validateHandle(defaults.handle) ? defaults.handle.slice(0, 26) : "artist";
    const candidates = [base, ...[2, 3, 4, 5].map((n) => `${base}-${n}`), `${base}-${Math.random().toString(36).slice(2, 6)}`]
      .filter((handle) => !validateHandle(handle));
    let lastError: unknown;
    for (const handle of candidates) {
      try {
        await saveProfile({ ...defaults, handle });
        const created = await fetchMyProfile();
        if (created) {
          latest.current = created;
          setProfile(created);
          return created;
        }
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Your profile could not be set up.");
  }, [profile, signInDefaults]);

  const editProfile = useCallback((then?: () => void) => {
    afterSave.current = then;
    const profile = latest.current;
    // A new profile starts from the sign-in name and picture; the sign-in picture stays on offer either way.
    void signInDefaults().then(({ signInAvatar, ...defaults }) => setEditing(profile
      ? { initial: { handle: profile.handle, display_name: profile.display_name, bio: profile.bio ?? "", avatar_url: profile.avatar_url }, isNew: false, signInAvatar }
      : { initial: defaults, isNew: true, signInAvatar }));
  }, [signInDefaults]);

  const value = useMemo<MyProfileValue>(
    () => ({ profile: signedIn === false ? null : profile, refresh, editProfile, ensureProfile }),
    [signedIn, profile, refresh, editProfile, ensureProfile],
  );

  return (
    <MyProfileContext.Provider value={value}>
      {children}
      {editing && (
        <ProfileDialog initial={editing.initial} isNew={editing.isNew} signInAvatar={editing.signInAvatar} onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refresh().then(() => afterSave.current?.());
          }} />
      )}
    </MyProfileContext.Provider>
  );
}

export function useMyProfile() {
  const value = useContext(MyProfileContext);
  if (!value) throw new Error("useMyProfile must be used inside MyProfileProvider");
  return value;
}
