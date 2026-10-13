import { StudioShell } from "@/components/studio/shell";

// The studio is open to visitors: the shell reads the session in the browser
// and asks for sign-in when they create. Every query is limited to the
// signed-in user by Row Level Security, so the shell prerenders without it.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioShell>{children}</StudioShell>;
}
