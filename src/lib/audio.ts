/** Decodes an audio file or URL (the Sonx CDN allows cross-origin reads). */
export async function decodeAudio(source: Blob | string): Promise<AudioBuffer> {
  const bytes = typeof source === "string"
    ? await fetch(source).then((response) => {
      if (!response.ok) throw new Error("The song could not be loaded.");
      return response.arrayBuffer();
    })
    : await source.arrayBuffer();
  const context = new AudioContext();
  try {
    return await context.decodeAudioData(bytes);
  } finally {
    void context.close();
  }
}

/**
 * Cuts `duration` seconds from `start` and encodes them as 16-bit PCM WAV,
 * which the video model accepts. Mirrors the trimming the mobile app does
 * before a music video upload.
 */
export function sliceToWav(buffer: AudioBuffer, start: number, duration: number): Blob {
  const sampleRate = buffer.sampleRate;
  const channels = Math.min(buffer.numberOfChannels, 2);
  const from = Math.max(0, Math.floor(start * sampleRate));
  const to = Math.min(buffer.length, from + Math.floor(duration * sampleRate));
  const frames = Math.max(0, to - from);

  const dataSize = frames * channels * 2;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const writeString = (offset: number, text: string) =>
    [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  let offset = 44;
  for (let frame = from; frame < to; frame++) {
    for (const data of channelData) {
      const sample = Math.max(-1, Math.min(1, data[frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
}

export const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
};
