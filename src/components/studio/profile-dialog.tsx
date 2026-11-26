"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import Image from "next/image";
import { avatarSrc, PRESET_AVATARS, presetAvatarUrl } from "@/lib/avatars";
import { isAllowedAvatar, saveProfile, validateHandle, type ProfileInput } from "@/lib/profiles";

const field = "w-full rounded-[var(--radius-control)] border border-line bg-night px-4 py-2.5 text-sm focus:border-paper/40 focus:outline-none";

/** A round picture, or the first letter of the name on the signature gradient. */
function AvatarPreview({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (isAllowedAvatar(url)) {
    return <Image src={avatarSrc(url)} alt="" width={size} height={size} unoptimized referrerPolicy="no-referrer"
      className="rounded-full bg-raised object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden="true" className="bg-signature flex items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {(name.trim() || "S").charAt(0).toUpperCase()}
    </span>
  );
}

const choice = (selected: boolean) =>
  `rounded-full p-0.5 ring-2 transition focus-visible:outline-none focus-visible:ring-paper ${selected ? "ring-orchid" : "ring-transparent hover:ring-paper/30"}`;

/** Create or edit the public profile: picture, handle, name and bio. Saves through save_profile. */
export function ProfileDialog({ initial, isNew, signInAvatar, onClose, onSaved }: {
  initial: ProfileInput;
  isNew: boolean;
  /** The sign-in account's picture (Google), offered next to the presets. */
  signInAvatar: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [handle, setHandle] = useState(initial.handle);
  const [name, setName] = useState(initial.display_name);
  const [bio, setBio] = useState(initial.bio);
  const [avatar, setAvatar] = useState(initial.avatar_url);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const accountAvatar = isAllowedAvatar(signInAvatar) ? signInAvatar : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleError = handle ? validateHandle(handle) : null;
  const ready = !busy && !handleError && handle.trim().length > 0 && name.trim().length > 0;

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { opacity: 0, duration: 0.2 });
    gsap.from(".profile-panel", { scale: 0.96, y: 8, opacity: 0, duration: 0.25, ease: "power2.out" });
  }, { scope: ref });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await saveProfile({ handle, display_name: name, bio, avatar_url: avatar });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be saved.");
      setBusy(false);
    }
  };

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => !busy && onClose()}>
      <form className="profile-panel max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[var(--radius-panel)] border border-line bg-plum p-6"
        onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <h2 id={titleId} className="font-display text-xl font-semibold">{isNew ? "Set up your profile" : "Edit profile"}</h2>
        <p className="mt-1 text-sm text-paper/65">
          {isNew ? "Songs you publish show here, and people can follow you." : "This is what people see on your profile."}
        </p>

        <div className="mt-5 flex items-center gap-4">
          <AvatarPreview url={avatar} name={name} size={72} />
          <button type="button" onClick={() => setPickingAvatar((open) => !open)} aria-expanded={pickingAvatar}
            aria-controls={`${titleId}-avatars`}
            className="rounded-full bg-paper/[0.08] px-4 py-2 text-sm font-medium transition hover:bg-paper/15">
            {pickingAvatar ? "Done" : "Change picture"}
          </button>
        </div>
        {pickingAvatar && (
          <div id={`${titleId}-avatars`} role="radiogroup" aria-label="Profile picture"
            className="mt-3 grid grid-cols-6 gap-2 rounded-[var(--radius-control)] border border-line bg-night p-3">
            {PRESET_AVATARS.map((preset) => {
              const url = presetAvatarUrl(preset.id);
              return (
                <button key={preset.id} type="button" role="radio" aria-checked={avatar === url} aria-label={preset.label}
                  title={preset.label} onClick={() => setAvatar(url)} className={choice(avatar === url)}>
                  <Image src={avatarSrc(url)} alt="" width={48} height={48} unoptimized className="aspect-square w-full rounded-full" />
                </button>
              );
            })}
            {accountAvatar && (
              <button type="button" role="radio" aria-checked={avatar === accountAvatar} aria-label="Your Google picture"
                title="Your Google picture" onClick={() => setAvatar(accountAvatar)} className={choice(avatar === accountAvatar)}>
                <Image src={accountAvatar} alt="" width={48} height={48} unoptimized referrerPolicy="no-referrer"
                  className="aspect-square w-full rounded-full object-cover" />
              </button>
            )}
            <button type="button" role="radio" aria-checked={!avatar} aria-label="No picture, show my initial"
              title="No picture" onClick={() => setAvatar(null)} className={choice(!avatar)}>
              <span aria-hidden="true" className="bg-signature flex aspect-square w-full items-center justify-center rounded-full text-lg font-semibold">
                {(name.trim() || "S").charAt(0).toUpperCase()}
              </span>
            </button>
          </div>
        )}

        <label className="mt-5 block text-sm font-medium">
          Handle
          <span className="relative mt-1.5 block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/45">@</span>
            <input value={handle} autoFocus={!pickingAvatar} autoCapitalize="none" autoComplete="off" spellCheck={false} maxLength={30}
              onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/\s+/g, "-"))}
              aria-invalid={Boolean(handleError)} className={`${field} pl-8`} />
          </span>
          <span className={`mt-1 block text-xs ${handleError ? "text-danger" : "text-fog"}`}>
            {handleError ?? `getsonx.com/artist/${handle || "your-handle"}`}
          </span>
        </label>

        <label className="mt-4 block text-sm font-medium">
          Name
          <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} className={`${field} mt-1.5`} />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Bio <span className="font-normal text-fog">(optional)</span>
          <textarea value={bio} maxLength={160} rows={3} onChange={(event) => setBio(event.target.value)}
            placeholder="What kind of songs do you make?" className={`${field} mt-1.5 resize-none`} />
          <span className="mt-1 block text-right text-xs text-fog tabular-nums">{bio.length}/160</span>
        </label>

        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-paper/80 transition hover:bg-paper/10 hover:text-paper disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={!ready}
            className="rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-night transition hover:bg-paper/90 disabled:opacity-40">
            {busy ? "Saving" : isNew ? "Create profile" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
