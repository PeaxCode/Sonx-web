"use client";

/**
 * Drifting brand-colour light behind a section. Fills its nearest positioned
 * parent. The motion stops for people who prefer reduced motion (globals.css).
 */
export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`aurora -z-10 ${className}`}>
      <span className="aurora-blob aurora-a" />
      <span className="aurora-blob aurora-b" />
      <span className="aurora-blob aurora-c" />
      <span className="aurora-blob aurora-d" />
      <span className="aurora-grain" />
    </div>
  );
}
