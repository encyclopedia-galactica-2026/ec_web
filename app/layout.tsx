import type { Metadata } from "next";
import { Play, Instrument_Serif, Orbitron } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileGate } from "@/components/mobile-gate";

const play = Play({
  variable: "--font-play",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Encyclopedia Galactica",
  description: "Explore the vast knowledge of the galaxy",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${play.variable} ${instrumentSerif.variable} ${orbitron.variable} antialiased`}
      >
        <TooltipProvider>
          <MobileGate>{children}</MobileGate>
        </TooltipProvider>
      </body>
    </html>
  );
}
