"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { isInsufficientBalance } from "@/lib/api";
import { decodeAudio, formatTime, sliceToWav } from "@/lib/audio";
import { VIDEO_CREDIT_COSTS, type VideoDuration } from "@/lib/billing-config";
import { MUSIC_FEATURES, newRequestId, startGeneration } from "@/lib/generations";
import { SAMPLE_GENERATIONS } from "@/lib/samples";
import { uploadForGeneration } from "@/lib/uploads";
import { useBilling } from "./billing";
import { useFeedback } from "./feedback";
import { useLibrary } from "./library";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Source = { kind: "library"; generationId: string } | { kind: "file"; file: File };

// Like the app, the example songs can be used as a video's soundtrack.
const SAMPLE_SONGS = SAMPLE_GENERATIONS.filter((item) => MUSIC_FEATURES.includes(item.feature));

export function CreateVideoForm() {
  const { accessFor, billing } = useBilling();
  const { notify, openPaywall } = useFeedback();
  const { generations, track } = useLibrary();

  const ownSongs = useMemo(
    () => generations.filter((item) => MUSIC_FEATURES.includes(item.feature) && item.status === "completed" && item.output_url),
    [generations],
  );
  const songs = useMemo(() => [...ownSongs, ...SAMPLE_SONGS], [ownSongs]);

  const [image, setImage] = useState<File | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [audio, setAudio] = useState<AudioBuffer | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [length, setLength] = useState<VideoDuration>(15);
  const [start, setStart] = useState(0);
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<null | "uploading" | "starting">(null);
  const previewRef = useRef<AudioBufferSourceNode | null>(null);

  const imageUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const maxStart = audio ? Math.max(0, audio.duration - length) : 0;
  const access = accessFor("AI_MUSIC_VIDEO", VIDEO_CREDIT_COSTS[length]);
  const tooShort = audio !== null && audio.duration < length;
  const canSubmit = !busy && image && audio && !tooShort;

  const chooseSource = async (next: Source) => {
    setSource(next);
    setAudio(null);
    setStart(0);
    setLoadingAudio(true);
    try {
      const song = next.kind === "library" ? songs.find((item) => item.id === next.generationId) : null;
      setAudio(await decodeAudio(next.kind === "file" ? next.file : song!.output_url!));
      if (song && !title) setTitle(song.title);
    } catch {
      notify("That audio could not be read. Try an MP3, WAV or M4A file.", "error");
      setSource(null);
    } finally {
      setLoadingAudio(false);
    }
  };

  const previewSegment = () => {
    if (!audio) return;
    previewRef.current?.stop();
    const context = new AudioContext();
    const node = context.createBufferSource();
    node.buffer = audio;
    node.connect(context.destination);
    node.start(0, start, length);
    node.onended = () => void context.close();
    previewRef.current = node;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (access === "none") {
      openPaywall();
      return;
    }
    try {
      setBusy("uploading");
      const [audioUrl, uploadedImageUrl] = await Promise.all([
        uploadForGeneration(sliceToWav(audio, start, length), "wav"),
        uploadForGeneration(image, image.type.split("/")[1] === "jpeg" ? "jpg" : image.type.split("/")[1]),
      ]);
      setBusy("starting");
      await startGeneration({
        feature: "AI_MUSIC_VIDEO",
        clientRequestId: newRequestId("webvideo"),
        title: title.trim() || "Music video",
        imageUrl: uploadedImageUrl,
        audioUrl,
        durationSeconds: length,
        resolution,
      });
      await track("");
      setImage(null);
      setSource(null);
      setAudio(null);
      setTitle("");
      notify("Your video is being made. This usually takes a few minutes.");
    } catch (error) {
      if (isInsufficientBalance(error)) openPaywall();
      else notify(error instanceof Error ? error.message : "The video could not be started.", "error");
    } finally {
      setBusy(null);
    }
  };

  const costHint = !billing ? "" : access === "quota"
    ? billing.currentPlan === "FREE" ? "Uses your free video" : "Uses 1 video from your plan"
    : access === "credits" ? `Uses ${VIDEO_CREDIT_COSTS[length]} credits` : "Get Pro or credits in the app to create videos";

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Photo</span>
        <label className="relative flex aspect-[4/5] max-h-80 cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-panel)] border border-dashed border-line bg-plum text-center text-sm text-fog transition hover:border-violet focus-within:border-violet">
          {imageUrl ? (
            <Image src={imageUrl} alt="Selected photo" fill unoptimized className="object-cover" />
          ) : (
            <span className="px-6">Add a portrait. A face looking at the camera works best.</span>
          )}
          <input type="file" accept={IMAGE_TYPES.join(",")} className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!IMAGE_TYPES.includes(file.type)) notify("Use a JPG, PNG or WebP photo.", "error");
              else if (file.size > MAX_UPLOAD_BYTES) notify("That photo is over 20 MB. Try a smaller one.", "error");
              else setImage(file);
            }} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Song</legend>
        {songs.length > 0 && (
          <select
            value={source?.kind === "library" ? source.generationId : ""}
            onChange={(event) => event.target.value && void chooseSource({ kind: "library", generationId: event.target.value })}
            className="rounded-[var(--radius-control)] border border-line bg-plum px-4 py-3 focus:border-violet focus:outline-none"
          >
            <option value="">Pick a song</option>
            {ownSongs.length > 0 && (
              <optgroup label="Your songs">
                {ownSongs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
              </optgroup>
            )}
            <optgroup label="Examples">
              {SAMPLE_SONGS.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
            </optgroup>
          </select>
        )}
        <label className="cursor-pointer rounded-[var(--radius-control)] border border-line px-4 py-3 text-sm text-fog transition hover:text-paper focus-within:border-violet">
          {source?.kind === "file" ? source.file.name : songs.length > 0 ? "Or upload an audio file" : "Upload an audio file"}
          <input type="file" accept="audio/*" className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 50 * 1024 * 1024) notify("That file is over 50 MB.", "error");
              else void chooseSource({ kind: "file", file });
            }} />
        </label>
        {loadingAudio && <p className="text-sm text-fog">Reading the song</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Length</legend>
        <div className="grid grid-cols-2 gap-2">
          {([15, 30] as const).map((value) => (
            <button key={value} type="button" aria-pressed={length === value}
              onClick={() => { setLength(value); setStart((current) => Math.min(current, audio ? Math.max(0, audio.duration - value) : 0)); }}
              className={`rounded-[var(--radius-control)] border px-4 py-3 text-left transition ${length === value ? "border-violet bg-violet/15" : "border-line text-fog hover:text-paper"}`}>
              <span className="block font-medium">{value} seconds</span>
              <span className="block text-xs text-fog">{VIDEO_CREDIT_COSTS[value]} credits</span>
            </button>
          ))}
        </div>
      </fieldset>

      {audio && (
        <div className="flex flex-col gap-2">
          <label htmlFor="segment-start" className="text-sm font-medium">Part of the song</label>
          {tooShort ? (
            <p className="text-sm text-danger">This audio is shorter than {length} seconds. Pick a shorter length or another song.</p>
          ) : (
            <>
              <input id="segment-start" type="range" min={0} max={maxStart} step={0.5} value={start}
                onChange={(event) => setStart(Number(event.target.value))} className="accent-violet" />
              <div className="flex items-center justify-between text-xs text-fog tabular-nums">
                <span>{formatTime(start)} to {formatTime(start + length)}</span>
                <button type="button" onClick={previewSegment} className="font-medium text-violet hover:text-orchid">Listen to this part</button>
              </div>
            </>
          )}
        </div>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Quality</legend>
        <div className="flex gap-2">
          {(["720p", "1080p"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={resolution === value} onClick={() => setResolution(value)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${resolution === value ? "border-violet bg-violet/15 text-paper" : "border-line text-fog hover:text-paper"}`}>
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Title <span className="font-normal text-fog">(optional)</span></span>
        <input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} placeholder="Music video"
          className="rounded-[var(--radius-control)] border border-line bg-plum px-4 py-3 placeholder:text-fog/60 focus:border-violet focus:outline-none" />
      </label>

      <div className="flex flex-col gap-2">
        <button type="submit" disabled={!canSubmit}
          className="bg-signature rounded-[var(--radius-control)] py-3.5 font-display text-sm font-semibold tracking-wide text-paper transition hover:brightness-110 disabled:opacity-40">
          {busy === "uploading" ? "Uploading" : busy === "starting" ? "Starting your video" : "Create video"}
        </button>
        <p className="text-center text-xs text-fog">{costHint}</p>
      </div>
    </form>
  );
}
