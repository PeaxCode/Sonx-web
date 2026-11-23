import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { createServerSupabase } from "@/lib/supabase/server";

// Songs live on the provider's CDN, another origin, where browsers ignore the
// download attribute and open the file in a tab. This serves the file from our
// origin as an attachment named after the song.

const MAX_BYTES = 60 * 1024 * 1024;
const MAX_REDIRECTS = 3;

// Addresses a stored URL must never reach: loopback, private, link-local (cloud metadata), CGNAT, ULA.
const PRIVATE = new BlockList();
for (const [net, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16], ["224.0.0.0", 3]] as const) {
  PRIVATE.addSubnet(net, bits, "ipv4");
}
for (const [net, bits] of [["::", 127], ["fc00::", 7], ["fe80::", 10], ["::ffff:0:0", 96]] as const) {
  PRIVATE.addSubnet(net, bits, "ipv6");
}

/** Every address the host resolves to is public. */
async function resolvesPublic(host: string) {
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every(({ address, family }) => !PRIVATE.check(address, family === 6 ? "ipv6" : "ipv4"));
  } catch {
    return false;
  }
}

/** Fetches with redirects followed by hand, so each hop is checked before it is requested. */
async function fetchPublic(start: string) {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isPublicHttps(url) || !(await resolvesPublic(new URL(url).hostname))) return null;
    const response = await fetch(url, { redirect: "manual", cache: "no-store" }).catch(() => null);
    if (!response) return null;
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url).toString();
      continue;
    }
    return response;
  }
  return null;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXTENSIONS: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "video/mp4": "mp4",
};

/** Only public https hosts: the URL is stored data, so it never reaches into private networks. */
function isPublicHttps(raw: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !isIP(host.replace(/^\[|\]$/g, "")) && host.includes(".") &&
      !host.endsWith(".local") && !host.endsWith(".internal") && host !== "localhost";
  } catch {
    return false;
  }
}

/** "Rainy Drive Home" -> "Rainy Drive Home.mp3", safe on every OS. */
function fileName(title: string, extension: string) {
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "Sonx song";
  return `${base}.${extension}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  // Row Level Security limits this to the signed-in user's own songs.
  const supabase = await createServerSupabase();
  const { data: generation } = await supabase
    .from("generations")
    .select("title,status,output_url")
    .eq("id", id)
    .maybeSingle();
  if (!generation || generation.status !== "completed" || !generation.output_url) {
    return new Response("Not found", { status: 404 });
  }
  if (!isPublicHttps(generation.output_url)) return new Response("Not available", { status: 422 });

  // MP3 downloads come with a plan (free songs play only). Asked of the same billing
  // endpoint the app uses, with the caller's session; any doubt counts as no plan.
  const { data: billing } = await supabase.functions.invoke<{ isPro?: boolean }>("provider-proxy", {
    body: { action: "billing-state" },
  });
  if (!billing?.isPro) return new Response("MP3 downloads come with a plan", { status: 403 });

  // output_url is stored data (the app's library import accepts URLs), so it is treated as untrusted.
  const upstream = await fetchPublic(generation.output_url);
  if (!upstream?.ok || !upstream.body) {
    return new Response("The file could not be fetched. Try again in a moment.", { status: 502 });
  }
  const length = Number(upstream.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) return new Response("File too large", { status: 413 });

  const type = (upstream.headers.get("content-type") ?? "audio/mpeg").split(";")[0].trim().toLowerCase();
  const extension = EXTENSIONS[type] ?? new URL(generation.output_url).pathname.split(".").pop()?.toLowerCase().slice(0, 4) ?? "mp3";
  const name = fileName(generation.title ?? "", /^[a-z0-9]{2,4}$/.test(extension) ? extension : "mp3");
  // An ASCII fallback for old clients, and the real name (any language) in filename*.
  const ascii = name.normalize("NFKD").replace(/[^\x20-\x7e]/g, "").replace(/"/g, "") || "Sonx song.mp3";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": EXTENSIONS[type] ? type : "audio/mpeg",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      ...(length ? { "Content-Length": String(length) } : {}),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
