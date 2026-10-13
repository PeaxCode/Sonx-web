import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The studio is open to visitors and asks for sign-in when they create
// (components/studio/session.tsx); only the account page needs a session up front.
const PROTECTED_PATHS = ["/account"];

/** Refreshes the Supabase session and keeps the account page behind sign-in. */
export async function proxy(request: NextRequest) {
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

export const config = {
  // Static media (images, bundled examples) never needs the session check.
  matcher: ["/((?!_next/static|_next/image|images/|samples/|favicon.ico).*)"],
};
