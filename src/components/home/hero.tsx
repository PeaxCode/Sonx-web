"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Aurora } from "@/components/aurora";
import { CoverArt } from "@/components/cover-art";
import { IconCreate, IconPause, IconPlay } from "@/components/icons";
import { usePlayer } from "@/components/studio/player";
import { useSession } from "@/components/studio/session";
import { GENRES, genreFromPrompt } from "@/lib/billing-config";
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
const SAMPLE_SONGS = SAMPLE_GENERATIONS.filter((item) => MUSIC_FEATURES.includes(item.feature));

/** "Pop" reads "a pop song", "EDM" stays "an EDM song". */
function genrePhrase(name: string) {
  const word = name === name.toUpperCase() ? name : name.toLowerCase();
  return `${/^[aeiou]/i.test(word) || word === "EDM" ? "an" : "a"} ${word}`;
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
      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-30 md:h-36 [mask-image:linear-gradient(to_top,black_40%,transparent)]"
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
  // GSAP reveals the wrapper; the button owns the hover transitions, so the two never fight.
  return (
    <div className={`hero-float absolute top-[52%] z-0 hidden w-44 -translate-y-1/2 hover:z-20 xl:block ${
      side === "left" ? "-left-8" : "-right-8"
    }`}>
    <button type="button" onClick={() => play(song, SAMPLE_SONGS)}
      aria-label={isCurrent && playing ? `Pause ${song.title}` : `Play ${song.title}`}
      className={`group block w-full overflow-hidden rounded-[22px] shadow-[0_30px_60px_-15px_rgb(0_0_0/0.7)] brightness-75 transition duration-500 ease-out hover:rotate-0 hover:scale-105 hover:brightness-100 focus-visible:rotate-0 focus-visible:brightness-100 ${
        side === "left" ? "-rotate-[11deg]" : "rotate-[11deg]"
      }`}>
      <span className="relative block aspect-[3/4]">
        {song.cover_url ? <Image src={song.cover_url} alt="" fill sizes="176px" className="object-cover transition duration-700 group-hover:scale-110" /> : <CoverArt seed={song.id} className="size-full transition duration-700 group-hover:scale-110" />}
        <span className="absolute inset-0 bg-gradient-to-t from-night/90 via-transparent to-transparent" />
        <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-night/40 backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-paper group-hover:text-night">
          {isCurrent && playing ? <IconPause size={18} /> : <IconPlay size={18} />}
        </span>
        <span className="absolute inset-x-3 bottom-3 truncate text-left text-sm font-medium">{song.title}</span>
      </span>
    </button>
    </div>
  );
}

export function Hero() {
  const router = useRouter();
  const { signedIn, requestSignIn } = useSession();
  const { text: typed, full: example } = useTypewriter(EXAMPLES);
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("pop");
  const [instrumental, setInstrumental] = useState(false);
  const pulseRef = useRef<() => void>(() => undefined);
  const gainRef = useRef({ value: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  // The prompt as it arrived by link, to tell whether the visitor edited it before creating.
  const linkedRef = useRef<string | null>(null);

  const genreName = GENRES.find((item) => item.id === genre)?.name ?? "Pop";

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
    /* eslint-disable react-hooks/set-state-in-effect */
    setPrompt(linked);
    const named = genreFromPrompt(linked);
    if (named) setGenre(named);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Visitors sign up right where they pressed Create; the song starts as soon as they are back.
  const askToSignIn = () =>
    requestSignIn({
      next: "/create?resume=1",
      title: "Create your free account to make this song",
      text: "Your first song each month is free. We start it the moment you are in. Already use the Sonx app? Same account.",
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
    // No title: the create form names the song (the lyric writer's title, else the prompt's).
    saveDraft({ mode: "describe", prompt: text, lyrics: "", instrumental, voice: "random", genre, title: "" });
    // Signed in or not, the real song is made on Create; visitors sign up first (the draft survives it).
    if (signedIn === false) askToSignIn();
    else if (signedIn) router.push("/create?resume=1");
  };

  const surprise = () => {
    const starter = STARTERS[Math.floor(Math.random() * STARTERS.length)];
    setPrompt(starter.prompt);
    setGenre(starter.genre);
    for (let pulse = 0; pulse < 6; pulse++) pulseRef.current();
  };

  return (
    <section ref={sectionRef} aria-label="Make a song"
      className="relative isolate flex min-h-[min(100svh,880px)] items-center overflow-hidden px-5 pb-32 pt-20 md:px-10 md:pb-40">
      <Aurora />

          <FloatingSample side="left" />
          <FloatingSample side="right" />
          <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
            {/* Same words as before for search, set as a title and a subtitle. */}
            <h1 className="hero-reveal">
              <span className="block text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-5xl md:text-[4.25rem]">
                AI Song Generator
              </span>
              <span className="mt-4 block text-base font-medium tracking-[-0.01em] text-paper/85 md:text-xl">
                Make full songs with vocals from text
              </span>
            </h1>
            <p className="hero-reveal mt-8 text-base font-medium leading-snug text-paper/70 md:text-lg">
              Make {genrePhrase(genreName)} song about
              {/* Two lines are reserved on phones so the box below never jumps while typing. */}
              <span className="block min-h-[2.75em] font-semibold text-paper md:min-h-[1.375em]" aria-live="off">
                {typed}
                <span aria-hidden="true" className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] animate-pulse bg-paper" />
              </span>
            </p>

            <form onSubmit={start}
              className="hero-reveal mt-6 rounded-[28px] border border-paper/10 bg-[#120a18]/70 p-3 text-left shadow-[0_24px_80px_-24px_rgb(0_0_0/0.8)] backdrop-blur-md transition-[border-color,background-color] focus-within:border-paper/30 focus-within:bg-[#120a18]/80">
              <label htmlFor="hero-prompt" className="sr-only">Describe your song</label>
              <textarea
                id="hero-prompt"
                value={prompt}
                rows={2}
                maxLength={PROMPT_LIMIT}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  // A genre named in the prompt ("a lo-fi beat") moves the picker with it.
                  const named = genreFromPrompt(event.target.value);
                  if (named) setGenre(named);
                }}
                onKeyDown={(event) => {
                  pulseRef.current();
                  if (event.key === "Enter" && !event.shiftKey) start(event);
                }}
                placeholder={`Describe your song, like ${example}`}
                className="w-full resize-none bg-transparent px-2 py-1.5 text-base leading-relaxed placeholder:text-fog/50 focus:outline-none md:text-lg"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="relative flex items-center rounded-full bg-paper/10 text-sm transition hover:bg-paper/15 focus-within:ring-1 focus-within:ring-paper/40">
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
                  className={`rounded-full px-4 py-2 text-sm transition ${instrumental ? "bg-paper text-night" : "bg-paper/10 text-paper/80 hover:bg-paper/15 hover:text-paper"}`}>
                  Instrumental
                </button>
                <span className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={surprise} aria-label="Surprise me with a prompt" title="Surprise me"
                    className="flex size-10 items-center justify-center rounded-full bg-paper/10 text-paper/80 transition hover:rotate-12 hover:bg-paper/15 hover:text-paper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
                      <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
                      <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
                      <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                  <button type="submit" disabled={!canCreate}
                    className="bg-signature flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_24px_-8px_rgb(229_99_241/0.8)] transition hover:scale-[1.03] hover:brightness-110 active:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100">
                    <IconCreate size={16} />
                    Create
                  </button>
                </span>
              </div>
            </form>
            <p className="hero-reveal mt-4 text-sm text-paper/60">Sonx writes the lyrics, picks the voice and produces the track.</p>
          </div>

      <Spectrum pulseRef={pulseRef} gainRef={gainRef} />
    </section>
  );
}
