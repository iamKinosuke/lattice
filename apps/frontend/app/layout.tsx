import type { Metadata, Viewport } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";

import { THEME_BOOTSTRAP } from "@/lib/theme";

import "./globals.css";

const display = Lexend({
  variable: "--font-lattice-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const sans = Source_Sans_3({
  variable: "--font-lattice-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lattice",
    template: "%s · Lattice",
  },
  description:
    "A realtime collaborative whiteboard with a self-hosted CRDT sync server.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#101014" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        {children}
      </body>
    </html>
  );
}
