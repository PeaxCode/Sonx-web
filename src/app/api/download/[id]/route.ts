import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request as httpsRequest } from "node:https";
import type { IncomingMessage } from "node:http";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { Readable } from "node:stream";
import { createServerSupabase } from "@/lib/supabase/server";

// Songs live on the provider's CDN, another origin, where browsers ignore the
// download attribute and open the file in a tab. This serves the file from our
// origin as an attachment named after the song.

const MAX_BYTES = 60 * 1024 * 1024;
const MAX_REDIRECTS = 3;
/** The whole transfer, headers to last byte. */
const TIMEOUT_MS = 30_000;

// Addresses a stored URL must never reach: loopback, private, link-local (cloud
// metadata), CGNAT, benchmark, multicast/reserved, and the IPv6 forms that wrap
// IPv4 (mapped, NAT64, 6to4, Teredo, compatible) or are local/discard.
const PRIVATE = new BlockList();
for (const [net, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
] as const) {
  PRIVATE.addSubnet(net, bits, "ipv4");
}
for (const [net, bits] of [
  // ::ffff:0:0/96 (IPv4-mapped) is not listed: BlockList matches every IPv4 address against it.
  // Mapped addresses are unwrapped in isPrivate and checked against the IPv4 rules instead.
  ["::", 96], ["::1", 128], ["64:ff9b::", 96], ["64:ff9b:1::", 48], ["100::", 64],
  ["2001::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) {
  PRIVATE.addSubnet(net, bits, "ipv6");
}

function isPrivate(address: string, family: number) {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address)?.[1];
  if (mapped) return PRIVATE.check(mapped, "ipv4");
  return PRIVATE.check(address, family === 6 ? "ipv6" : "ipv4");
}

/**
 * DNS lookup used for the connection itself: the address that is checked is the
 * address connected to, so a host cannot resolve public for a check and private
 * for the request (DNS rebinding).
 */
const publicLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 0);
    const list = (addresses as unknown as LookupAddress[]).filter(({ address, family }) => !isPrivate(address, family));
    if (list.length === 0) return callback(new Error("Blocked address"), "", 0);
    if (options.all) return (callback as unknown as (error: null, addresses: LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

/** One https GET over a vetted connection; resolves once the headers arrive. */
function get(url: string, signal: AbortSignal) {
  return new Promise<IncomingMessage>((resolve, reject) => {
    const request = httpsRequest(url, { method: "GET", lookup: publicLookup, signal }, resolve);
    request.on("error", reject);
    request.end();
  });
}

/** Fetches with redirects followed by hand, each hop checked; null when it cannot be fetched safely. */
async function fetchPublic(start: string, signal: AbortSignal) {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isPublicHttps(url)) return null;
    const response = await get(url, signal).catch(() => null);
    if (!response) return null;
    const status = response.statusCode ?? 0;
    const location = response.headers.location;
    if (status >= 300 && status < 400 && location) {
      response.resume();
      url = new URL(location, url).toString();
      continue;
    }
    if (status < 200 || status >= 300) {
      response.resume();
      return null;
    }
    return response;
  }
  return null;
}

/** The body as a web stream that errors out past MAX_BYTES, whatever Content-Length claimed. */
function capped(body: IncomingMessage, abort: () => void) {
  let total = 0;
  const counter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      total += chunk.byteLength;
      if (total > MAX_BYTES) {
        abort();
        controller.error(new Error("File too large"));
        return;
      }
      controller.enqueue(chunk);
    },
  });
  return (Readable.toWeb(body) as ReadableStream<Uint8Array>).pipeThrough(counter);
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const upstream = await fetchPublic(generation.output_url, controller.signal);
  if (!upstream) {
    clearTimeout(timer);
    return new Response("The file could not be fetched. Try again in a moment.", { status: 502 });
  }
  upstream.on("close", () => clearTimeout(timer));
  const length = Number(upstream.headers["content-length"] ?? 0);
  if (length > MAX_BYTES) {
    controller.abort();
    return new Response("File too large", { status: 413 });
  }

  const type = (upstream.headers["content-type"] ?? "audio/mpeg").split(";")[0].trim().toLowerCase();
  const extension = EXTENSIONS[type] ?? new URL(generation.output_url).pathname.split(".").pop()?.toLowerCase().slice(0, 4) ?? "mp3";
  const name = fileName(generation.title ?? "", /^[a-z0-9]{2,4}$/.test(extension) ? extension : "mp3");
  // An ASCII fallback for old clients, and the real name (any language) in filename*.
  const ascii = name.normalize("NFKD").replace(/[^\x20-\x7e]/g, "").replace(/"/g, "") || "Sonx song.mp3";

  return new Response(capped(upstream, () => controller.abort()), {
    headers: {
      "Content-Type": EXTENSIONS[type] ? type : "audio/mpeg",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      ...(length ? { "Content-Length": String(length) } : {}),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
