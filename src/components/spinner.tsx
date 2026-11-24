/**
 * A spinning ring for anything that waits on the network: an arc of the signature
 * colour turning over a faint track. Under reduced motion it pulses instead of spinning.
 */
export function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      className={`shrink-0 animate-spin motion-reduce:animate-pulse ${className}`}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" />
      <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="url(#sonx-spinner-arc)" strokeWidth="3" strokeLinecap="round" />
      <defs>
        <linearGradient id="sonx-spinner-arc" x1="12" y1="2.5" x2="21.5" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-orchid)" />
          <stop offset="1" stopColor="var(--color-violet)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** A spinner with a short label, for a section or page that is loading. */
export function Loading({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 py-10 text-sm text-paper/60 ${className}`}>
      <Spinner size={22} />
      <span>{label}</span>
    </div>
  );
}
