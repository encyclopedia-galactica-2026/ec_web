"use client";

import Image from "next/image";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <a href="/" className="flex items-center" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }}>
          <Image src="/logo.svg" alt="Encyclopedia Galactica" width={40} height={31} className="h-8 w-auto" />
        </a>
      </div>
    </header>
  );
}
