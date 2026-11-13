"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconAccount, IconCreate, IconHome, IconLibrary, IconPricing } from "@/components/icons";
import { PLAN_LABELS } from "@/lib/billing-config";
import { BillingProvider, useBilling } from "./billing";
import { FeedbackProvider } from "./feedback";
import { LibraryProvider } from "./library";
import { PlayerProvider } from "./player";
import { PlayerBar } from "./player-bar";
import { SessionProvider, useSession } from "./session";

const NAV = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/create", label: "Create", icon: IconCreate },
  // Hidden pending payment provider review (restore IconVideo import too):
  // { href: "/video", label: "Video", icon: IconVideo },
  { href: "/library", label: "Library", icon: IconLibrary },
  { href: "/pricing", label: "Pricing", icon: IconPricing },
  { href: "/account", label: "Account", icon: IconAccount },
];

function Balance() {
  const { billing } = useBilling();
  const { signedIn, requestSignIn } = useSession();
  const pathname = usePathname();
  if (signedIn === false) {
    return (
      <div className="rounded-[var(--radius-control)] border border-line p-3">
        <p className="text-sm font-medium">Sign in to create</p>
        <p className="mt-0.5 text-xs text-fog">Use your Sonx Pro account from the app.</p>
        <button type="button" onClick={() => requestSignIn({ next: pathname, title: "Sign in to Sonx" })}
          className="bg-signature mt-3 w-full rounded-[10px] py-2 text-sm font-semibold transition hover:brightness-110">
          Sign in
        </button>
      </div>
    );
  }
  if (!billing) return <div className="h-10" />;
  return (
    <div className="rounded-[var(--radius-control)] border border-line px-3 py-2.5">
      <p className="text-sm font-medium">{PLAN_LABELS[billing.currentPlan]}</p>
      <p className="text-xs text-fog tabular-nums">{billing.credits} credits</p>
    </div>
  );
}

/** Visitors get a sign-in entry where the account page would be. */
function AccountEntry({ compact }: { compact?: boolean }) {
  const { signedIn, requestSignIn } = useSession();
  const pathname = usePathname();
  if (signedIn !== false) return null;
  return (
    <button type="button" onClick={() => requestSignIn({ next: pathname, title: "Sign in to Sonx" })}
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
                className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-raised text-paper" : "text-fog hover:bg-plum hover:text-paper"
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <AccountEntry />
        </nav>
        <div className="mt-auto"><Balance /></div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-line bg-night md:hidden">
        {items.map(({ href, label, icon: Icon }) => {
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

/** Studio: navigation, shared library, billing and the player. Open to visitors. */
export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BillingProvider>
        <LibraryProvider>
          <PlayerProvider>
            <FeedbackProvider>
              <Navigation />
              <main className="min-h-dvh pb-40 md:pl-60 md:pb-28">{children}</main>
              <PlayerBar />
            </FeedbackProvider>
          </PlayerProvider>
        </LibraryProvider>
      </BillingProvider>
    </SessionProvider>
  );
}
