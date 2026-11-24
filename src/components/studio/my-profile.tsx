"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchMyProfile, suggestHandle, type ProfileInput, type PublicProfile } from "@/lib/profiles";
import { getSupabase } from "@/lib/supabase/client";
import { ProfileDialog } from "./profile-dialog";
import { useSession } from "./session";

interface MyProfileValue {
  /** undefined while loading (or signed out before the session is read); null when there is none. */
  profile: PublicProfile | null | undefined;
  refresh: () => Promise<void>;
  /** Opens the profile dialog; `then` runs after a successful save (e.g. publish the song). */
  editProfile: (then?: () => void) => void;
}

const MyProfileContext = createContext<MyProfileValue | null>(null);

const metadataString = (metadata: Record<string, unknown>, ...keys: string[]) =>
  keys.map((key) => metadata[key]).find((value): value is string => typeof value === "string" && value.length > 0) ?? null;

/** The signed-in user's public profile, shared by Account, publish switches and Follow buttons. */
export function MyProfileProvider({ children }: { children: React.ReactNode }) {
  const { signedIn } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [editing, setEditing] = useState<{ initial: ProfileInput; isNew: boolean } | null>(null);
  const afterSave = useRef<(() => void) | undefined>(undefined);

  const refresh = useCallback(async () => {
    setProfile(await fetchMyProfile().catch(() => null));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (signedIn) void refresh();
  }, [signedIn, refresh]);

  const editProfile = useCallback((then?: () => void) => {
    afterSave.current = then;
    if (profile) {
      setEditing({ initial: { handle: profile.handle, display_name: profile.display_name, bio: profile.bio ?? "", avatar_url: profile.avatar_url }, isNew: false });
      return;
    }
    // A new profile starts from the sign-in name and picture.
    void getSupabase().auth.getUser().then(({ data }) => {
      const metadata = data.user?.user_metadata ?? {};
      const name = metadataString(metadata, "full_name", "name") ?? data.user?.email?.split("@")[0] ?? "";
      const avatar = metadataString(metadata, "avatar_url", "picture");
      setEditing({
        initial: { handle: suggestHandle(name), display_name: name.slice(0, 40), bio: "", avatar_url: avatar?.startsWith("https://") ? avatar : null },
        isNew: true,
      });
    });
  }, [profile]);

  const value = useMemo<MyProfileValue>(
    () => ({ profile: signedIn === false ? null : profile, refresh, editProfile }),
    [signedIn, profile, refresh, editProfile],
  );

  return (
    <MyProfileContext.Provider value={value}>
      {children}
      {editing && (
        <ProfileDialog initial={editing.initial} isNew={editing.isNew} onClose={() => setEditing(null)}
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
