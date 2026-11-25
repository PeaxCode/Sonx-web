"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMyProfile } from "@/components/studio/my-profile";
import { useSession } from "@/components/studio/session";
import { isAllowedAvatar, isFollowing, setFollowing } from "@/lib/profiles";

/** Round avatar: the profile picture, or the first letter on the signature gradient. */
export function Avatar({ url, name, size, className = "" }: { url: string | null; name: string; size: number; className?: string }) {
  if (isAllowedAvatar(url)) {
    // Only Google sign-in pictures and getsonx.com (the database refuses other hosts).
    return <Image src={url} alt="" width={size} height={size} unoptimized referrerPolicy="no-referrer" className={`rounded-full bg-raised object-cover ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden="true" className={`bg-signature flex items-center justify-center rounded-full font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Follow / Following. Visitors get the sign-in window; it is hidden on your own profile.
 * `onChange` gets +1 or -1 so the caller can update the follower count it shows.
 */
export function FollowButton({ handle, name, size = "md", onChange }: {
  handle: string;
  name: string;
  size?: "sm" | "md";
  onChange?: (delta: 1 | -1) => void;
}) {
  const { signedIn, requestSignIn } = useSession();
  const myHandle = useMyProfile().profile?.handle;
  const [following, setFollowingState] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    isFollowing(handle).then((value) => active && setFollowingState(value)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [signedIn, handle]);

  if (myHandle === handle) return null;

  const onClick = async () => {
    if (signedIn === false) {
      requestSignIn({ next: window.location.pathname, title: `Follow ${name} on Sonx`, text: "Create your free account to follow artists and hear their new songs first." });
      return;
    }
    if (!signedIn || following === null || busy) return;
    const next = !following;
    setBusy(true);
    setFollowingState(next);
    onChange?.(next ? 1 : -1);
    try {
      await setFollowing(handle, next);
    } catch {
      setFollowingState(!next);
      onChange?.(next ? -1 : 1);
    } finally {
      setBusy(false);
    }
  };

  const on = following === true;
  return (
    <button type="button" onClick={onClick} aria-pressed={on} disabled={busy}
      aria-label={on ? `Unfollow ${name}` : `Follow ${name}`}
      className={`rounded-full font-semibold transition disabled:opacity-60 ${size === "sm" ? "px-3 py-1 text-xs" : "px-5 py-2 text-sm"} ${
        on ? "border border-paper/25 text-paper hover:border-paper/50" : "bg-paper text-night hover:bg-paper/85"
      }`}>
      {on ? "Following" : "Follow"}
    </button>
  );
}
