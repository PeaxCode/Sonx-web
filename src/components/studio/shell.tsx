"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconAccount, IconCreate, IconLibrary, IconVideo } from "@/components/icons";
import { PLAN_LABELS } from "@/lib/billing-config";
import { BillingProvider, useBilling } from "./billing";
import { FeedbackProvider } from "./feedback";
import { LibraryProvider } from "./library";
import { PlayerProvider } from "./player";
import { PlayerBar } from "./player-bar";

const NAV = [
  { href: "/create", label: "Create", icon: IconCreate },
  { href: "/video", label: "Video", icon: IconVideo },
  { href: "/library", label: "Library", icon: IconLibrary },
  { href: "/account", label: "Account", icon: IconAccount },
];

function Balance() {
  const { billing } = useBilling();
  if (!billing) return <div className="h-10" />;
  return (
    <div className="rounded-[var(--radius-control)] border border-line px-3 py-2.5">
      <p className="text-sm font-medium">{PLAN_LABELS[billing.currentPlan]}</p>
      <p className="text-xs text-fog tabular-nums">{billing.credits} credits</p>
    </div>
  );
}

function Navigation() {
  const pathname = usePathname();
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-night px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <Image src="/images/sonx-icon.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="font-display text-lg font-semibold">Sonx</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
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
        </nav>
        <div className="mt-auto"><Balance /></div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-line bg-night md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-paper" : "text-fog"}`}>
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

/** Signed-in studio: navigation, shared library, billing and the player. */
export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
