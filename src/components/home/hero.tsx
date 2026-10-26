"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { IconCreate, IconPause, IconPlay } from "@/components/icons";
import { usePlayer } from "@/components/studio/player";
import { useSession } from "@/components/studio/session";
import { GENRES } from "@/lib/billing-config";
import { trackEvent } from "@/lib/analytics";
import { readLinkedPrompt, saveDraft, saveLinkedPrompt } from "@/lib/draft";
import { MUSIC_FEATURES } from "@/lib/generations";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { SAMPLE_GENERATIONS } from "@/lib/samples";
import { STARTERS } from "./content";

const EXAMPLES = [
  "a rainy drive home at 2am",
  "my dog's birthday party",
  "the last night of summer",
  "falling for my best friend",
  "a sunrise run by the sea",
];

const BAR_COUNT = 72;
const PROMPT_LIMIT = 500;
const STEP_MS = 1500;
const SAMPLE_SONGS = SAMPLE_GENERATIONS.filter((item) => MUSIC_FEATURES.includes(item.feature));

type Phase = "idle" | "making" | "ready";

/** "Pop" reads "a pop song", "EDM" stays "an EDM song". */
function genrePhrase(name: string) {
  const word = name === name.toUpperCase() ? name : name.toLowerCase();
  return `${/^[aeiou]/i.test(word) || word === "EDM" ? "an" : "a"} ${word}`;
}

/** The opening words of a prompt, title-cased, as the song's working title ("Road Trip With My Sister"). */
function titleFrom(prompt: string) {
  const words = prompt.replace(/[^\p{L}\p{N}'\s-]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length > 1 && /^(a|an|the)$/i.test(words[0])) words.shift();
  const kept: string[] = [];
  for (const word of words) {
    if (kept.length === 6 || (kept.length >= 3 && [...kept, word].join(" ").length > 28)) break;
    kept.push(word);
  }
  return kept.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Untitled";
}

/**
 * A spectrum that answers typing: every keystroke pushes energy into a few
 * bars, which then settle. It idles with a slow breath, and stays still for
 * people who prefer reduced motion.
 */
function Spectrum({ pulseRef, gainRef }: {
  pulseRef: React.RefObject<() => void>;
  gainRef: React.RefObject<{ value: number }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Energy added by typing, on top of the idle landscape; it decays back to zero.
    const energy = new Float32Array(BAR_COUNT);
    let frame = 0;
    let raf = 0;

    pulseRef.current = () => {
      const center = Math.floor(Math.random() * BAR_COUNT);
      for (let offset = -6; offset <= 6; offset++) {
        const index = (center + offset + BAR_COUNT) % BAR_COUNT;
        energy[index] = Math.min(0.7, energy[index] + (1 - Math.abs(offset) / 7) * (0.25 + Math.random() * 0.3));
      }
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== width * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#e563f1");
      gradient.addColorStop(0.45, "#c94bff");
      gradient.addColorStop(1, "#9a57ff");
      context.fillStyle = gradient;

      const gap = 4;
      const barWidth = (width - gap * (BAR_COUNT - 1)) / BAR_COUNT;
      // The canvas can measure 0 wide before layout settles; skip that frame.
      if (barWidth <= 0 || height <= 0) {
        if (!reduceMotion) raf = requestAnimationFrame(draw);
        return;
      }
      const t = frame / 90;
      for (let index = 0; index < BAR_COUNT; index++) {
        // A slow, layered wave so the idle spectrum reads as music, not a flat line.
        const idle = 0.14 + 0.32 * (0.5 + 0.5 * Math.sin(index / 7 + t)) * (0.55 + 0.45 * Math.sin(index / 2.7 - t * 1.6));
        // gainRef rises from 0 to 1 in the hero's intro.
        const level = Math.min(1, idle + energy[index]) * gainRef.current.value;
        const barHeight = level * height;
        context.globalAlpha = 0.3 + level * 0.6;
        context.beginPath();
        context.roundRect(index * (barWidth + gap), height - barHeight, barWidth, barHeight, Math.max(0, Math.min(barWidth / 2, barHeight / 2, 6)));
        context.fill();
        if (!reduceMotion) energy[index] *= 0.965;
      }
      frame += 1;
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [pulseRef, gainRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-60 md:h-36 [mask-image:linear-gradient(to_top,black_40%,transparent)]"
    />
  );
}

/** Types each example out, holds it, deletes it, then moves to the next. */
function useTypewriter(lines: string[]) {
  const [state, setState] = useState({ text: lines[0], index: 0 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = setInterval(() => setState(({ index }) => {
        const next = (index + 1) % lines.length;
        return { text: lines[next], index: next };
      }), 3000);
      return () => clearInterval(timer);
    }
    let line = 0;
    let length = lines[0].length;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = lines[line];
      if (!deleting && length === full.length) {
        deleting = true;
        timer = setTimeout(tick, 1800);
        return;
      }
      if (deleting && length === 0) {
        deleting = false;
        line = (line + 1) % lines.length;
      }
      length += deleting ? -1 : 1;
      setState({ text: lines[line].slice(0, length), index: line });
      timer = setTimeout(tick, deleting ? 28 : 55);
    };
    timer = setTimeout(tick, 1800);
    return () => clearTimeout(timer);
  }, [lines]);

  return { text: state.text, full: lines[state.index] };
}

/** Tilted example covers either side of the prompt, playable in the player bar. */
function FloatingSample({ side }: { side: "left" | "right" }) {
  const { current, playing, play } = usePlayer();
  const song = SAMPLE_SONGS[side === "left" ? 0 : 1];
  if (!song) return null;
  const isCurrent = current?.id === song.id;
  return (
    <button type="button" onClick={() => play(song, SAMPLE_SONGS)}
      aria-label={isCurrent && playing ? `Pause ${song.title}` : `Play ${song.title}`}
      className={`hero-float group absolute top-1/2 hidden w-40 -translate-y-1/2 overflow-hidden rounded-[var(--radius-panel)] border border-line shadow-2xl transition hover:rotate-0 xl:block ${
        side === "left" ? "-left-6 -rotate-[8deg]" : "-right-6 rotate-[8deg]"
      }`}>
      <span className="relative block aspect-[3/4]">
        {song.cover_url ? <Image src={song.cover_url} alt="" fill sizes="160px" className="object-cover" /> : <CoverArt seed={song.id} className="size-full" />}
        <span className="absolute inset-0 bg-gradient-to-t from-night/90 via-transparent to-transparent" />
        <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-night/50 backdrop-blur transition group-hover:bg-paper group-hover:text-night">
          {isCurrent && playing ? <IconPause size={18} /> : <IconPlay size={18} className="translate-x-px" />}
        </span>
        <span className="absolute inset-x-3 bottom-3 truncate text-left text-sm font-medium">{song.title}</span>
      </span>
    </button>
  );
}

export function Hero() {
  const router = useRouter();
  const { signedIn, requestSignIn } = useSession();
  const { text: typed, full: example } = useTypewriter(EXAMPLES);
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("pop");
  const [instrumental, setInstrumental] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState("");
  const pulseRef = useRef<() => void>(() => undefined);
  const gainRef = useRef({ value: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  // The prompt as it arrived by link, to tell whether the visitor edited it before creating.
  const linkedRef = useRef<string | null>(null);

  const genreName = GENRES.find((item) => item.id === genre)?.name ?? "Pop";
  const steps = ["Writing the lyrics", "Composing the music", instrumental ? "Producing the track" : "Recording the vocals", "Mixing it down"];
  if (instrumental) steps.shift();

  // The entrance: copy and prompt rise in, the spectrum swells up from silence.
  useGSAP(() => {
    if (prefersReducedMotion()) {
      gainRef.current.value = 1;
      return;
    }
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".hero-reveal", { opacity: 0, y: 18, duration: 0.6, stagger: 0.08 })
      .from(".hero-float", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 }, "-=0.4")
      .to(gainRef.current, { value: 1, duration: 1.4, ease: "power2.out" }, 0.2);
  }, { scope: sectionRef });

  // Each phase eases in over the last one.
  useGSAP(() => {
    if (phase === "idle" || prefersReducedMotion()) return;
    gsap.from(".hero-phase", { opacity: 0, y: 14, duration: 0.45, ease: "power2.out" });
  }, { scope: sectionRef, dependencies: [phase] });

  // A visitor's song is "made" here first; the real one starts once they sign in.
  useEffect(() => {
    if (phase !== "making") return;
    const timer = setTimeout(() => (step + 1 >= steps.length ? setPhase("ready") : setStep(step + 1)), STEP_MS);
    return () => clearTimeout(timer);
  }, [phase, step, steps.length]);

  // The spectrum works hard while the song is being "made".
  useEffect(() => {
    if (phase !== "making") return;
    const pulse = setInterval(() => pulseRef.current(), 90);
    return () => clearInterval(pulse);
  }, [phase]);

  // ?prompt= from another site (Beatintel's "Try it in Sonx") fills the box as
  // plain text. It never starts a song: the visitor edits it and presses Create.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // URLSearchParams never throws, malformed %-escapes are kept as typed.
    const fromLink = params.get("prompt")?.trim().slice(0, PROMPT_LIMIT) || null;
    if (params.has("prompt")) {
      // Out of the address bar so a reload is not counted again and GA's page_location stays short; UTMs stay.
      params.delete("prompt");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    if (fromLink) {
      saveLinkedPrompt(fromLink);
      trackEvent("prompt_prefilled", { source: params.get("utm_source") ?? "(none)", prompt_length: fromLink.length });
    }
    // Without one in the URL, a prompt kept from before a sign-in round trip.
    const linked = fromLink ?? readLinkedPrompt();
    if (!linked) return;
    linkedRef.current = linked;
    // URL and storage are only readable after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrompt(linked);
  }, []);

  const askToSignIn = () =>
    requestSignIn({
      next: "/create?resume=1",
      title: "Your song is almost ready",
      text: "Sign in free to hear it. Your first song is on us, and it is waiting in the Sonx app too.",
    });

  const canCreate = prompt.trim().length > 0;

  const start = (event: React.FormEvent) => {
    event.preventDefault();
    // Nothing typed yet: the button is disabled and Enter does nothing.
    if (!canCreate) return;
    const text = prompt.trim().slice(0, PROMPT_LIMIT);
    if (linkedRef.current) {
      // The other half of prompt_prefilled: how many linked prompts become a song.
      trackEvent("prompt_prefilled_create", { edited: text !== linkedRef.current });
      linkedRef.current = null;
      saveLinkedPrompt(null);
    }
    // The create form picks this draft up and starts the song (create-music-form.tsx).
    saveDraft({ mode: "describe", prompt: text, lyrics: "", instrumental, voice: "random", genre, title: titleFrom(text) });
    if (signedIn) {
      router.push("/create?resume=1");
      return;
    }
    setSubmitted(text);
    setStep(0);
    setPhase("making");
  };

  const surprise = () => {
    const starter = STARTERS[Math.floor(Math.random() * STARTERS.length)];
    setPrompt(starter.prompt);
    for (let pulse = 0; pulse < 6; pulse++) pulseRef.current();
  };

  return (
    <section ref={sectionRef} aria-label="Make a song"
      className="relative isolate overflow-hidden rounded-[28px] border border-line bg-plum/60 px-5 pb-32 pt-12 md:px-10 md:pb-40 md:pt-16">
      {/* Soft brand glow behind the prompt. */}
      <div aria-hidden="true" className="absolute -left-24 -top-24 -z-10 size-96 rounded-full bg-violet/25 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-16 top-1/3 -z-10 size-80 rounded-full bg-orchid/15 blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-0 left-1/3 -z-10 size-72 rounded-full bg-iris/20 blur-3xl" />

      {phase === "idle" && (
        <>
          <FloatingSample side="left" />
          <FloatingSample side="right" />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h1 className="hero-reveal font-display text-3xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              Make {genrePhrase(genreName)} song about
              {/* Two lines are reserved so the box below never jumps while typing. */}
              <span className="mt-1 block min-h-[2.2em] text-violet" aria-live="off">
                {typed}
                <span aria-hidden="true" className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] animate-pulse bg-paper" />
              </span>
            </h1>
            <p className="hero-reveal mx-auto mt-2 max-w-lg text-fog">
              Describe a mood, a moment or a story. Sonx writes the lyrics, picks the voice and produces the track.
            </p>

            <form onSubmit={start}
              className="hero-reveal mt-8 rounded-[var(--radius-panel)] border border-line bg-night/70 p-3 text-left shadow-2xl backdrop-blur focus-within:border-violet/60">
              <label htmlFor="hero-prompt" className="sr-only">Describe your song</label>
              <textarea
                id="hero-prompt"
                value={prompt}
                rows={2}
                maxLength={PROMPT_LIMIT}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  pulseRef.current();
                  if (event.key === "Enter" && !event.shiftKey) start(event);
                }}
                placeholder={`Describe your song, like ${example}`}
                className="w-full resize-none bg-transparent px-2 py-1.5 text-base leading-relaxed placeholder:text-fog/50 focus:outline-none md:text-lg"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="relative flex items-center rounded-full border border-line bg-plum text-sm transition hover:border-violet/60 focus-within:border-violet">
                  <span className="sr-only">Genre</span>
                  <select value={genre} onChange={(event) => setGenre(event.target.value)}
                    className="cursor-pointer appearance-none bg-transparent py-2 pl-4 pr-8 focus:outline-none">
                    {GENRES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none absolute right-3 text-fog">
                    <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </label>
                <button type="button" aria-pressed={instrumental} onClick={() => setInstrumental((value) => !value)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${instrumental ? "border-violet bg-violet/15 text-paper" : "border-line bg-plum text-fog hover:text-paper"}`}>
                  Instrumental
                </button>
                <span className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={surprise} aria-label="Surprise me with a prompt" title="Surprise me"
                    className="flex size-10 items-center justify-center rounded-full border border-line bg-plum text-fog transition hover:text-paper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
                      <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
                      <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
                      <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                  <button type="submit" disabled={!canCreate}
                    className="bg-signature flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-semibold tracking-wide transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100">
                    <IconCreate size={16} />
                    Create
                  </button>
                </span>
              </div>
            </form>
            <p className="hero-reveal mt-4 text-sm text-fog">Your first song is free. Lyrics and vocals included.</p>
          </div>
        </>
      )}

      {phase === "making" && (
        <div className="hero-phase relative z-10 mx-auto flex max-w-md flex-col items-center text-center" role="status">
          <div className="relative size-36 overflow-hidden rounded-[var(--radius-panel)] shadow-2xl">
            <CoverArt seed={submitted} className="size-full animate-pulse" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold md:text-3xl">Making your song</h2>
          <p className="mt-2 line-clamp-2 text-fog">&ldquo;{submitted}&rdquo;</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-raised">
            <div className="bg-signature h-full rounded-full transition-[width] duration-[1400ms] ease-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <ol className="mt-5 flex w-full flex-col gap-2 text-left text-sm">
            {steps.map((label, index) => (
              <li key={label} className={`flex items-center gap-3 transition ${index <= step ? "text-paper" : "text-fog/50"}`}>
                <span aria-hidden="true" className={`flex size-5 items-center justify-center rounded-full text-[11px] ${
                  index < step ? "bg-violet text-paper" : index === step ? "border border-violet" : "border border-line"
                }`}>
                  {index < step ? "✓" : ""}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>
      )}

      {phase === "ready" && (
        <div className="hero-phase relative z-10 mx-auto flex max-w-md flex-col items-center text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight md:text-5xl">Your song is almost ready</h2>
          <button type="button" onClick={askToSignIn} aria-label={`Sign in to listen to ${titleFrom(submitted)}`}
            className="group mt-8 w-52 text-left">
            <span className="relative block aspect-square overflow-hidden rounded-[var(--radius-panel)] shadow-2xl">
              <CoverArt seed={submitted} className="size-full transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center bg-night/20">
                <span className="flex size-14 items-center justify-center rounded-full bg-paper text-night shadow-xl transition group-hover:scale-110">
                  <IconPlay size={22} className="translate-x-px" />
                </span>
              </span>
            </span>
            <span className="mt-3 block truncate font-medium">{titleFrom(submitted)}</span>
            <span className="block text-sm text-fog">{instrumental ? "Instrumental" : "Song with vocals"}, {genreName}</span>
          </button>
          <button type="button" onClick={askToSignIn}
            className="bg-signature mt-8 rounded-full px-8 py-3.5 font-display text-sm font-semibold tracking-wide transition hover:brightness-110">
            Sign in free to listen
          </button>
          <button type="button" onClick={() => setPhase("idle")} className="mt-3 text-sm text-fog hover:text-paper">
            Change the prompt
          </button>
        </div>
      )}

      <Spectrum pulseRef={pulseRef} gainRef={gainRef} />
    </section>
  );
}
