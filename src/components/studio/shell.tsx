"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { IconAccount, IconBlog, IconCreate, IconExplore, IconHome, IconLibrary, IconMail, IconPolicy, IconPricing } from "@/components/icons";
import { PLAN_LABELS, SONG_POOL } from "@/lib/billing-config";
import { exploreEnabled } from "@/lib/flags";
import { BillingProvider, useBilling } from "./billing";
import { FeedbackProvider } from "./feedback";
import { LibraryProvider } from "./library";
import { MyProfileProvider } from "./my-profile";
import { PlayerProvider } from "./player";
import { PlayerBar } from "./player-bar";
import { ReadyAlerts } from "./ready-alerts";
import { SessionProvider, useSession } from "./session";

const NAV = [
  { href: "/", label: "Home", icon: IconHome },
  // Sample content until the social feed is real; hidden on the live site (lib/flags.ts).
  ...(exploreEnabled ? [{ href: "/explore", label: "Explore", icon: IconExplore }] : []),
  { href: "/create", label: "Create", icon: IconCreate },
  // Hidden pending payment provider review (restore IconVideo import too):
  // { href: "/video", label: "Video", icon: IconVideo },
  { href: "/library", label: "Library", icon: IconLibrary },
  // The phone tab bar has room for five; with Explore there, Pricing moves to the phone's top bar.
  { href: "/pricing", label: "Pricing", icon: IconPricing, desktopOnly: exploreEnabled },
  { href: "/account", label: "Account", icon: IconAccount },
];

// TODO: confirm this inbox exists before launch; it is the only contact shown in the studio.
const FEEDBACK_EMAIL = "support@getsonx.com";

// Plain <a>: the Journal and legal pages are static HTML, not app routes.
const FOOTER_LINKS = [
  { href: "/blog/", label: "Blog", icon: IconBlog },
  { href: `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("Sonx feedback")}`, label: "Feedback", icon: IconMail },
  { href: "/terms.html", label: "Terms & Policies", icon: IconPolicy },
];

function Balance() {
  const { billing, remaining } = useBilling();
  const { signedIn, requestSignIn } = useSession();
  const pathname = usePathname();
  if (signedIn === false) {
    return (
      <div className="rounded-[var(--radius-control)] border border-line p-3">
        <p className="text-sm font-medium">Create your free account</p>
        <p className="mt-0.5 text-xs text-fog">Already use the Sonx app? The same account works here.</p>
        <button type="button" onClick={() => requestSignIn({ next: pathname })}
          className="bg-signature mt-3 w-full rounded-[10px] py-2 text-sm font-semibold transition hover:brightness-110">
          Get started
        </button>
      </div>
    );
  }
  if (!billing) return <div className="h-10" />;
  const songsLeft = remaining(SONG_POOL);
  return (
    <div className="rounded-[var(--radius-control)] border border-line px-3 py-2.5">
      <p className="text-sm font-medium">{PLAN_LABELS[billing.currentPlan]}</p>
      <p className="text-xs text-fog tabular-nums">
        {songsLeft} {songsLeft === 1 ? "song" : "songs"} left
        {/* Credits are a subscriber top-up: free accounts see songs only. */}
        {billing.isPro && ` · ${billing.credits} credits`}
      </p>
      {!billing.isPro && (
        <Link href="/pricing" className="bg-signature mt-2.5 block rounded-[10px] py-2 text-center text-sm font-semibold transition hover:brightness-110">
          Upgrade
        </Link>
      )}
    </div>
  );
}

/** Visitors get a sign-in entry where the account page would be. */
function AccountEntry({ compact }: { compact?: boolean }) {
  const { signedIn, requestSignIn } = useSession();
  const pathname = usePathname();
  if (signedIn !== false) return null;
  return (
    <button type="button" onClick={() => requestSignIn({ next: pathname })}
      className={compact
        ? "flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-fog"
        : "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-fog transition hover:bg-plum hover:text-paper"}>
      <IconAccount size={compact ? 20 : 18} />
      Sign in
    </button>
  );
}

// "/" prefixes every path, so Home is active only on an exact match.
const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

function Navigation() {
  const pathname = usePathname();
  const { signedIn } = useSession();
  // Until a visitor signs in, the account page is replaced by a sign-in entry.
  const items = signedIn === false ? NAV.filter((item) => item.href !== "/account") : NAV;
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-night px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <Image src="/images/sonx-icon.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="font-display text-lg font-semibold">Sonx</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-raised text-paper" : "text-fog hover:bg-plum hover:text-paper"
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <AccountEntry />
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <ul className="flex flex-col">
            {FOOTER_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <a href={href} className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm text-fog/80 transition hover:bg-plum hover:text-paper">
                  <Icon size={16} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Balance />
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-line bg-night md:hidden">
        {items.filter((item) => !item.desktopOnly).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-paper" : "text-fog"}`}>
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
        <AccountEntry compact />
      </nav>
    </>
  );
}

/**
 * Phones have no sidebar: this bar carries the logo, the plan (or a way to
 * upgrade) and the links that live in the sidebar footer on desktop.
 */
function MobileTopBar() {
  const { billing } = useBilling();
  const { signedIn } = useSession();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => menuRef.current?.removeAttribute("open");
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-night/85 px-4 backdrop-blur-md md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/images/sonx-icon.png" alt="" width={28} height={28} className="rounded-lg" />
        <span className="font-display text-base font-semibold">Sonx</span>
      </Link>
      <div className="flex items-center gap-2">
        {billing?.isPro ? (
          <Link href="/account" className="rounded-full bg-paper/[0.08] px-3 py-1.5 text-xs font-medium tabular-nums">
            {PLAN_LABELS[billing.currentPlan]} · {billing.credits} credits
          </Link>
        ) : signedIn === null ? null : (
          <Link href="/pricing" className="bg-signature rounded-full px-3.5 py-1.5 text-xs font-semibold">
            {signedIn ? "Upgrade" : "Pricing"}
          </Link>
        )}
        <details ref={menuRef} className="relative">
          <summary aria-label="More" className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full text-fog transition hover:bg-paper/10 hover:text-paper [&::-webkit-details-marker]:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
            </svg>
          </summary>
          <ul className="absolute right-0 mt-2 w-52 rounded-[var(--radius-control)] border border-line bg-raised p-1.5 shadow-2xl">
            <li>
              <Link href="/pricing" onClick={closeMenu} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm hover:bg-paper/10">
                <IconPricing size={16} /> Pricing
              </Link>
            </li>
            {FOOTER_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <a href={href} onClick={closeMenu} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm hover:bg-paper/10">
                  <Icon size={16} /> {label}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </header>
  );
}

/** Studio: navigation, shared library, billing and the player. Open to visitors. */
export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BillingProvider>
        <LibraryProvider>
          <PlayerProvider>
            <FeedbackProvider>
              <MyProfileProvider>
              <MobileTopBar />
              <Navigation />
              <ReadyAlerts />
              <main className="min-h-dvh pb-40 md:pl-60 md:pb-28">{children}</main>
              <PlayerBar />
              </MyProfileProvider>
            </FeedbackProvider>
          </PlayerProvider>
        </LibraryProvider>
      </BillingProvider>
    </SessionProvider>
  );
}
