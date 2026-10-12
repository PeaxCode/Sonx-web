import Image from "next/image";
import { STORE_LINKS } from "@/lib/billing-config";

/**
 * Official App Store and Google Play badges. The Play badge artwork carries
 * built-in padding, so it is drawn larger with negative margins to match the
 * App Store badge's visible height, as Google's badge guidelines suggest.
 */
export function StoreBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      <a href={STORE_LINKS.ios} target="_blank" rel="noreferrer" aria-label="Download on the App Store"
        className="rounded-[10px] transition hover:opacity-85">
        <Image src="/images/badges/app-store.svg" alt="Download on the App Store" width={144} height={48} className="h-12 w-auto" />
      </a>
      <a href={STORE_LINKS.android} target="_blank" rel="noreferrer" aria-label="Get it on Google Play"
        className="-my-[11px] transition hover:opacity-85">
        <Image src="/images/badges/google-play.png" alt="Get it on Google Play" width={181} height={70} className="h-[70px] w-auto" />
      </a>
    </div>
  );
}
