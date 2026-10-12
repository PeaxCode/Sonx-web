"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const EXAMPLES = [
  "a rainy drive home at 2am",
  "my dog's birthday party",
  "the last night of summer",
  "falling for my best friend",
  "a sunrise run by the sea",
];

const BAR_COUNT = 72;

/**
 * A spectrum that answers typing: every keystroke pushes energy into a few
 * bars, which then settle. It idles with a slow breath, and stays still for
 * people who prefer reduced motion.
 */
function Spectrum({ pulseRef }: { pulseRef: React.RefObject<() => void> }) {
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
      const t = frame / 90;
      for (let index = 0; index < BAR_COUNT; index++) {
        // A slow, layered wave so the idle spectrum reads as music, not a flat line.
        const idle = 0.14 + 0.32 * (0.5 + 0.5 * Math.sin(index / 7 + t)) * (0.55 + 0.45 * Math.sin(index / 2.7 - t * 1.6));
        const level = Math.min(1, idle + energy[index]);
        const barHeight = level * height;
        context.globalAlpha = 0.3 + level * 0.6;
        context.beginPath();
        context.roundRect(index * (barWidth + gap), height - barHeight, barWidth, barHeight, Math.min(barWidth / 2, 6));
        context.fill();
        if (!reduceMotion) energy[index] *= 0.965;
      }
      frame += 1;
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [pulseRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-52 w-full md:h-72 [mask-image:linear-gradient(to_top,black_55%,transparent)]"
    />
  );
}

export function Hero() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const pulseRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const timer = setInterval(() => setExampleIndex((index) => (index + 1) % EXAMPLES.length), 2800);
    return () => clearInterval(timer);
  }, []);

  const start = (event: React.FormEvent) => {
    event.preventDefault();
    // proxy.ts sends signed-out visitors to sign in and back here with the prompt.
    router.push(`/create?prompt=${encodeURIComponent(topic.trim() || EXAMPLES[exampleIndex])}`);
  };

  return (
    <section className="relative overflow-hidden px-4 pb-48 pt-16 md:px-8 md:pb-64 md:pt-24">
      <form onSubmit={start} className="relative z-10 mx-auto max-w-5xl">
        <label htmlFor="topic" className="block font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
          Make a song about
        </label>
        <textarea
          id="topic"
          value={topic}
          rows={2}
          maxLength={500}
          onChange={(event) => setTopic(event.target.value)}
          onKeyDown={(event) => {
            pulseRef.current();
            if (event.key === "Enter" && !event.shiftKey) start(event);
          }}
          placeholder={EXAMPLES[exampleIndex]}
          className="mt-2 w-full resize-none bg-transparent font-display text-4xl font-semibold leading-[1.1] tracking-tight text-violet placeholder:text-fog/35 focus:outline-none md:text-7xl"
        />
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
          <button type="submit"
            className="bg-signature rounded-[var(--radius-control)] px-7 py-4 font-display text-sm font-semibold tracking-wide transition hover:brightness-110">
            Create song
          </button>
          <p className="text-sm text-fog">Your first song is free. Lyrics and vocals included.</p>
        </div>
      </form>
      <Spectrum pulseRef={pulseRef} />
    </section>
  );
}
