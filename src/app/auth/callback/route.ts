import { NextResponse } from "next/server";
import { AUTH_EVENT_COOKIE } from "@/lib/auth-event";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Only same-site paths are accepted, so the callback cannot redirect elsewhere.
 * Browsers read "\" as "/" and drop tabs and newlines, so "/\evil.com" is refused too.
 */
const safeNext = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") && !/[\\\u0000-\u001f]/.test(value) ? value : "/create";

/** OAuth (PKCE) return: exchanges the code for a session cookie. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // A first sign-in creates the account in the same moment, so the two
      // timestamps match; accounts made earlier (here or in the app) count as a login.
      const { created_at, last_sign_in_at, app_metadata } = data.user;
      const isNew = Math.abs(Date.parse(last_sign_in_at ?? "") - Date.parse(created_at)) < 10_000;
      const method = app_metadata.provider ?? "unknown";
      // Read once by <AuthEvents /> on the next page, which reports it to GA4.
      response.cookies.set(AUTH_EVENT_COOKIE, `${isNew ? "sign_up" : "login"}:${method}`, {
        path: "/", maxAge: 60, sameSite: "lax", secure: origin.startsWith("https:"),
      });
      return response;
    }
  }
  return NextResponse.redirect(`${origin}/login?error=signin`);
}
