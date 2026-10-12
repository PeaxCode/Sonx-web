import { StudioShell } from "@/components/studio/shell";

// proxy.ts keeps signed-out visitors out of the studio, and every query is
// limited to the signed-in user by Row Level Security, so the shell itself
// prerenders without reading the session.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioShell>{children}</StudioShell>;
}
