"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { isInsufficientBalance } from "@/lib/api";
import { CREDIT_COSTS, GENRES, genreFromPrompt, isGenre, songsIn, type Feature } from "@/lib/billing-config";
import { newRequestId, startGeneration } from "@/lib/generations";
import { webCheckoutEnabled } from "@/lib/paddle";
import { saveDraft, takeBlogSource, takeDraft, type DraftMode, type DraftVoice } from "@/lib/draft";
import { generateLyrics, writeLyrics } from "@/lib/lyrics";
import { titleFromLyrics, titleFromPrompt } from "@/lib/titles";
import { prefersReducedMotion } from "@/lib/motion";
import { useBilling } from "./billing";
import { useCreateOptional } from "./create-context";
import { useFeedback } from "./feedback";
import { useLibrary } from "./library";
import { useSession } from "./session";

type Mode = DraftMode;
type Voice = DraftVoice;

const PROMPT_LIMIT = 500;
const LYRICS_LIMIT = 3000;

/** "Dec 14": when the plan's songs come back (periodEnd is in milliseconds). */
const resetDate = (periodEnd: number) =>
  new Date(periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** `restoreDraft` is off for the Suspense placeholder, so only the real form picks up a saved draft. */
export function CreateMusicForm({ initialPrompt = "", initialGenre, restoreDraft = true }: {
  initialPrompt?: string;
  initialGenre?: string;
  restoreDraft?: boolean;
}) {
  const { accessFor, remaining, billing, pending } = useBilling();
  const { notify, openPaywall } = useFeedback();
  const { track } = useLibrary();
  const { signedIn, requestSignIn } = useSession();
  const create = useCreateOptional();
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  // Set when a draft arrives to be made right away (after sign-in, or from Home's Create).
  // State, not a ref: the submit must run after the restored draft has rendered, or it sees an empty form.
  // "now": a restored draft to make at once. "after-purchase": the paywall is open; make it once the plan or credits land.
  const [resume, setResume] = useState<false | "now" | "after-purchase">(false);

  const [mode, setMode] = useState<Mode>("describe");
  const [prompt, setPrompt] = useState(initialPrompt.slice(0, PROMPT_LIMIT));
  const [lyrics, setLyrics] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [voice, setVoice] = useState<Voice>("random");
  const [genre, setGenre] = useState<string>(() =>
    isGenre(initialGenre) ? initialGenre : genreFromPrompt(initialPrompt) ?? "pop");
  // Once someone picks a genre themselves, the prompt stops moving it.
  const genrePicked = useRef(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<null | "lyrics" | "song">(null);
  // What was in the box before "Write lyrics for me" replaced it, so it can be put back.
  const [topicBefore, setTopicBefore] = useState<string | null>(null);

  // Restore a draft saved before sign-in. sessionStorage is browser-only, so this runs after hydration.
  useEffect(() => {
    if (!restoreDraft) return;
    const draft = takeDraft();
    const params = new URLSearchParams(window.location.search);
    const resuming = params.has("resume");
    if (resuming) {
      params.delete("resume");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    // A prompt that just arrived by link is newer than a draft left from an abandoned sign-in.
    if (!draft || (initialPrompt && !resuming)) return;
    // Storage is only readable after hydration, so the saved draft is applied here.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMode(draft.mode);
    setPrompt(draft.prompt);
    setLyrics(draft.lyrics);
    setInstrumental(draft.instrumental);
    setVoice(draft.voice);
    setGenre(draft.genre);
    setTitle(draft.title);
    setResume(resuming ? "now" : false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [restoreDraft, initialPrompt]);

  // A described song with vocals gets lyrics first, so it bills as a song with vocals.
  const feature: Feature = mode === "lyrics" || !instrumental ? "LYRICS_MUSIC" : "PROMPT_MUSIC";
  const access = accessFor(feature);
  const hasVocals = feature === "LYRICS_MUSIC";
  const genreLabel = GENRES.find((item) => item.id === genre)?.name ?? "Pop";
  const text = mode === "describe" ? prompt : lyrics;
  const limit = mode === "describe" ? PROMPT_LIMIT : LYRICS_LIMIT;
  const canSubmit = !busy && text.length <= limit && (mode === "describe" ? prompt.trim().length > 0 : lyrics.trim().length >= 10);

  // Start the song once the restored form has rendered and the balance has loaded; after a
  // purchase, once the new plan or credits are on the account.
  useEffect(() => {
    if (!resume || !signedIn || access === "unknown" || pending) return;
    if (resume === "after-purchase" && access === "none") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResume(false);
    if (resume === "after-purchase") takeDraft();
    formRef.current?.requestSubmit();
  }, [resume, signedIn, access, pending]);

  // An idea picked beside the form fills it and brings it into view (on phones it is far above the ideas).
  const fill = create?.fill;
  useEffect(() => {
    if (!fill) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setMode("describe");
    setPrompt(fill.prompt.slice(0, PROMPT_LIMIT));
    setGenre(fill.genre);
    setInstrumental(fill.instrumental);
    /* eslint-enable react-hooks/set-state-in-effect */
    genrePicked.current = true;
    const box = textRef.current;
    box?.focus({ preventScroll: true });
    box?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [fill]);

  const askToSignIn = (next: string) => {
    saveDraft({ mode, prompt, lyrics, instrumental, voice, genre, title });
    requestSignIn({
      next,
      title: "Create your free account to make this song",
      text: "Your first song each month is free. We start it the moment you are in. Already use the Sonx app? Same account.",
    });
  };

  // Out of songs: keep what they wrote, so the song starts right after they pay (use-checkout sends them back here).
  const paywall = () => {
    saveDraft({ mode, prompt, lyrics, instrumental, voice, genre, title });
    setResume("after-purchase");
    openPaywall(billing && !billing.isPro && remaining(feature) === 0 ? "You have used this month's free song" : undefined);
  };

  const costHint = (() => {
    if (signedIn === false) return "Your first song is free. You create your account when you press Create.";
    if (pending) return "Payment received. Your song starts as soon as your plan is active.";
    if (!billing) return "";
    if (access === "quota" && !billing.isPro) return "This is your free song for this month";
    if (access === "quota") {
      const left = remaining(feature);
      return `${left} ${left === 1 ? "song" : "songs"} left until ${resetDate(billing.periodEnd)}`;
    }
    if (access === "credits") return `Uses ${CREDIT_COSTS[feature]} credits`;
    if (billing.isPro) return "Buy credits in the Sonx app to keep creating";
    return webCheckoutEnabled
      ? `Free song used. The next one arrives ${resetDate(billing.periodEnd)}, or get Pro for ${songsIn("MONTHLY")} a month`
      : "Get Pro or credits in the Sonx app to create songs";
  })();

  const writeLyricsForMe = async () => {
    if (!lyrics.trim()) {
      notify("Type a topic first, like a summer road trip.", "error");
      return;
    }
    if (!signedIn) {
      if (signedIn === false) askToSignIn("/create");
      return;
    }
    setBusy("lyrics");
    try {
      const topic = lyrics;
      setLyrics(await generateLyrics(`${genreLabel} song about: ${lyrics.trim()}`));
      setTopicBefore(topic);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Lyrics could not be written.", "error");
    } finally {
      setBusy(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    trackEvent("create_click", { mode, instrumental: mode === "describe" && instrumental, genre, signed_in: Boolean(signedIn), access });
    // The other half of blog_cta_click. Taken once, so the submit that resumes after sign-in isn't counted again.
    const blogPost = signedIn === null ? null : takeBlogSource();
    if (blogPost) trackEvent("create_from_blog", { post_slug: blogPost });
    if (!signedIn) {
      if (signedIn === false) askToSignIn("/create?resume=1");
      return;
    }
    if (access === "none") {
      paywall();
      return;
    }

    // Sonx writes the lyrics for a described song with vocals; the card beside the form shows that step.
    const withLyrics = mode === "describe" && !instrumental;
    create?.setMaking({ stage: withLyrics ? "lyrics" : "starting", title: title.trim(), genre, withLyrics });
    try {
      let songLyrics = mode === "lyrics" ? lyrics.trim() : undefined;
      let writerTitle = "";
      if (withLyrics) {
        setBusy("lyrics");
        ({ lyrics: songLyrics, title: writerTitle } = await writeLyrics(`${genreLabel} song about: ${prompt.trim()}`));
      }
      // Unnamed songs get a real name: the lyric writer's, else the prompt's or the lyrics' opening phrase.
      const autoTitle = writerTitle || (mode === "describe" ? titleFromPrompt(prompt) : titleFromLyrics(lyrics));

      const songTitle = title.trim() || autoTitle || `${genreLabel} track`;
      create?.setMaking({ stage: "starting", title: songTitle, genre, withLyrics });

      setBusy("song");
      const { generationId } = await startGeneration({
        feature,
        clientRequestId: newRequestId("web"),
        title: songTitle,
        genre,
        ...(feature === "LYRICS_MUSIC" ? { lyrics: songLyrics, vocalGender: voice } : { prompt: prompt.trim() }),
      });
      await track("");
      create?.setTracked({ id: generationId, withLyrics });
      create?.setMaking(null);
      setPrompt("");
      setLyrics("");
      setTitle("");
      setTopicBefore(null);
      // On /create the card beside the form shows the progress; elsewhere a toast says it started.
      if (!create) notify("Your song is being made. It takes 1 to 3 minutes, and we will tell you when it is ready.");
    } catch (error) {
      create?.setMaking(null);
      if (isInsufficientBalance(error)) paywall();
      else notify(error instanceof Error ? error.message : "The song could not be started.", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} className="flex flex-col gap-6">
      <div role="radiogroup" aria-label="How to start" className="grid grid-cols-2 rounded-full bg-paper/[0.06] p-1">
        {([["describe", "Describe it"], ["lyrics", "My lyrics"]] as const).map(([value, label]) => (
          <button key={value} type="button" role="radio" aria-checked={mode === value} onClick={() => setMode(value)}
            className={`rounded-full py-2.5 text-sm font-medium transition ${mode === value ? "bg-paper text-night shadow" : "text-paper/65 hover:text-paper"}`}>
            {label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{mode === "describe" ? "What is the song about?" : "Lyrics, or a topic to write them from"}</span>
        <textarea
          ref={textRef}
          value={text}
          maxLength={mode === "describe" ? PROMPT_LIMIT : LYRICS_LIMIT}
          onChange={(event) => {
            if (mode === "describe") {
              setPrompt(event.target.value);
              const named = genrePicked.current ? null : genreFromPrompt(event.target.value);
              if (named) setGenre(named);
            } else {
              setLyrics(event.target.value);
              setTopicBefore(null);
            }
          }}
          rows={mode === "describe" ? 5 : 9}
          placeholder={mode === "describe"
            ? "A slow late-night drive through a rainy city, warm synths, a hopeful chorus"
            : "Paste your lyrics, or type a topic and let Sonx write them"}
          className="resize-none rounded-[22px] border border-paper/10 bg-paper/[0.04] px-5 py-4 text-base leading-relaxed transition-[border-color,background-color] placeholder:text-paper/35 hover:border-paper/20 focus:border-paper/35 focus:bg-paper/[0.06] focus:outline-none"
        />
        <span className="flex items-center justify-between text-xs text-fog">
          {mode === "lyrics" ? (
            <span className="flex items-center gap-2">
              <button type="button" onClick={writeLyricsForMe} disabled={busy !== null}
                className="rounded-full bg-paper/[0.08] px-3 py-1.5 font-medium text-paper transition hover:bg-paper/15 disabled:opacity-50">
                {busy === "lyrics" ? "Writing lyrics" : topicBefore !== null ? "Write again" : "Write lyrics for me"}
              </button>
              {topicBefore !== null && busy === null && (
                <button type="button" onClick={() => { setLyrics(topicBefore); setTopicBefore(null); }}
                  className="rounded-full px-3 py-1.5 font-medium text-paper/70 transition hover:text-paper">
                  Undo
                </button>
              )}
            </span>
          ) : <span />}
          <span className="tabular-nums">{text.length}/{mode === "describe" ? PROMPT_LIMIT : LYRICS_LIMIT}</span>
        </span>
      </label>

      {mode === "describe" && (
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">Instrumental</span>
            <span className="block text-xs text-fog">No vocals. Leave off to get lyrics written for you.</span>
          </span>
          <input type="checkbox" checked={instrumental} onChange={(event) => setInstrumental(event.target.checked)}
            className="peer sr-only" />
          <span aria-hidden="true"
            className="relative h-6 w-11 shrink-0 rounded-full bg-paper/15 transition peer-checked:bg-orchid peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-violet after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-paper after:transition peer-checked:after:translate-x-5" />
        </label>
      )}

      {/* Stays in place when Instrumental is on, so the genres below do not jump. */}
      <fieldset disabled={!hasVocals} className="flex flex-col gap-2 transition-opacity disabled:opacity-40">
          <legend className="mb-2 text-sm font-medium">Voice{!hasVocals && <span className="font-normal text-fog"> (not used for instrumentals)</span>}</legend>
          <div className="flex gap-2">
            {([["random", "Any"], ["female", "Female"], ["male", "Male"]] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={voice === value} onClick={() => setVoice(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${voice === value ? "bg-paper text-night" : "bg-paper/[0.06] text-paper/70 hover:bg-paper/10 hover:text-paper"}`}>
                {label}
              </button>
            ))}
          </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Genre</legend>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((item) => (
            <button key={item.id} type="button" aria-pressed={genre === item.id} onClick={() => { genrePicked.current = true; setGenre(item.id); }}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${genre === item.id ? "bg-paper text-night" : "bg-paper/[0.06] text-paper/70 hover:bg-paper/10 hover:text-paper"}`}>
              {item.name}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Title <span className="font-normal text-fog">(optional)</span></span>
        <input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} placeholder="Sonx names it for you"
          className="rounded-full border border-paper/10 bg-paper/[0.04] px-5 py-3 transition-[border-color,background-color] placeholder:text-paper/35 hover:border-paper/20 focus:border-paper/35 focus:bg-paper/[0.06] focus:outline-none" />
      </label>

      <div className="flex flex-col gap-2">
        <button type="submit" disabled={!canSubmit}
          className="bg-signature rounded-full py-4 text-base font-semibold text-paper shadow-[0_12px_32px_-12px_rgb(229_99_241/0.8)] transition hover:scale-[1.01] hover:brightness-110 active:scale-100 disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100">
          {busy === "lyrics" ? "Writing lyrics" : busy === "song" ? "Starting your song" : "Create song"}
        </button>
        <p className="text-center text-sm text-paper/55">{costHint}</p>
      </div>
    </form>
  );
}
