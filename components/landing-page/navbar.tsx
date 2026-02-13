"use client";

import { Globe } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center">
          <Globe className="h-6 w-6" />
        </div>
      </div>
    </header>
  );
}
