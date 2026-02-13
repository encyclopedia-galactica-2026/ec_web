"use client"

import { Globe } from "lucide-react"

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="flex items-center gap-2">
                    <Globe className="h-6 w-6" />
                    <span className="text-lg font-semibold">Encyclopedia Galactica</span>
                </div>
            </div>
        </header>
    )
}
