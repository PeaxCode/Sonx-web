import { STORE_LINKS } from "@/lib/billing-config";

/** Target of the "scan with your phone" QR codes: the store for the phone that scanned it. */
export function GET(request: Request) {
  const agent = request.headers.get("user-agent") ?? "";
  const store = /android/i.test(agent) ? STORE_LINKS.android : STORE_LINKS.ios;
  return new Response(null, {
    status: 302,
    headers: { Location: store, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
