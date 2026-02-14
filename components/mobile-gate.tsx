"use client";

import { Monitor } from "lucide-react";
import { Starfield } from "@/components/landing-page/starfield";

export function MobileGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile overlay */}
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center md:hidden">
        <Starfield speed={1} />
        <Monitor className="relative z-10 h-16 w-16 text-primary" />
        <h1 className="relative z-10 font-serif text-2xl font-medium">
          Desktop Experience Only
        </h1>
        <p className="relative z-10 max-w-sm text-muted-foreground">
          Encyclopedia Galactica is best experienced on a desktop. Please open
          this app on a larger screen.
        </p>
      </div>

      {/* Desktop content */}
      <div className="hidden md:contents">{children}</div>
    </>
  );
}
