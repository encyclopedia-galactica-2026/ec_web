import { Navbar } from "@/components/landing-page/navbar"
import { Hero } from "@/components/landing-page/hero"

export default function LandingPage() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Navbar />
            <main className="flex-1">
                <Hero />
            </main>
        </div>
    )
}
