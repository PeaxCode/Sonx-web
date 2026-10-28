import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import { AuthEvents } from "@/components/auth-events";
import "./globals.css";

const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL("https://getsonx.com"),
  title: { default: "Sonx: make songs with AI", template: "%s | Sonx" },
  description: "Describe a song or write lyrics and Sonx turns it into music. Your songs sync with the Sonx app.",
  openGraph: {
    siteName: "Sonx",
    type: "website",
    images: [{ url: "/og-image-v2.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image-v2.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${unbounded.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh">
        {children}
        <AuthEvents />
      </body>
      {/* Same GA4 property as the static Journal and legal pages in public/, so all traffic lands in one report. */}
      <GoogleAnalytics gaId="G-1F8ZGT6QEJ" />
    </html>
  );
}
