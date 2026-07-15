import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "ShareBite — Reduce Food Waste. Feed Someone Today.",
    template: "%s · ShareBite",
  },
  description:
    "ShareBite connects food donors with people in need. Post surplus food, request a pickup, and turn waste into meals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-background text-foreground`}
      >
        <div className="noise-overlay" aria-hidden />
        <div
          className="ambient-orb -top-40 left-1/2 h-[400px] w-[500px] -translate-x-1/2 md:h-[600px] md:w-[800px]"
          aria-hidden
        />
        <div
          className="ambient-orb bottom-0 right-0 h-[300px] w-[400px] md:h-[500px] md:w-[600px]"
          aria-hidden
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
