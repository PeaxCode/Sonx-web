import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The studio is open to visitors and asks for sign-in when they create
// (components/studio/session.tsx); only the account page needs a session up front.
const PROTECTED_PATHS = ["/account"];

/** Refreshes the Supabase session and keeps the account page behind sign-in. */
export async function proxy(request: NextRequest) {
  // Read the path as requested: request.nextUrl re-applies Next.js's own
  // trailing-slash formatting, which is what these redirects need to override.
  const requested = new URL(request.url);
  const path = requested.pathname;

  // One host for search engines, with the path kept exactly (slash included).
  if (request.headers.get("host") === "www.getsonx.com") {
    return NextResponse.redirect(`https://getsonx.com${path}${requested.search}`, 308);
  }
  // The private test deployment asks every crawler to stay out (see next.config.ts).
  if (request.headers.get("host") === "dev.getsonx.com" && path === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" },
    });
  }
  // next.config.ts turns off Next.js's trailing-slash redirect so the Journal
  // keeps its indexed /blog/<slug>/ URLs; everything else drops the slash as before.
  if (path === "/blog" || /^\/blog\/[^/.]+$/.test(path)) {
    return redirectTo(request, `${path}/`);
  }
  if (path.length > 1 && path.endsWith("/") && !path.startsWith("/blog/")) {
    return redirectTo(request, path.replace(/\/+$/, "") || "/");
  }
  // The Journal and files carried over from the old site (privacy.html, blog
  // images, robots.txt...) are public and static: skip the session check.
  if (path.startsWith("/blog/") || /\.[a-z0-9]+$/i.test(path)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getUser validates the token with Supabase Auth instead of trusting the cookie.
  const { data: { user } } = await supabase.auth.getUser();
  const signedIn = Boolean(user && !user.is_anonymous);
  const { pathname, search } = request.nextUrl;

  if (!signedIn && PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  if (signedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/create", request.url));
  }
  return response;
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Static media (images, bundled examples) never needs the session check.
  matcher: ["/((?!_next/static|_next/image|images/|samples/|favicon.ico).*)"],
};
