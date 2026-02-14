import { Navbar } from "@/components/landing-page/navbar";
import { Hero } from "@/components/landing-page/hero";
import { getInitialPlanets } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { planets, hasMore } = await getInitialPlanets();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero initialPlanets={planets} initialHasMore={hasMore} />
      </main>
    </div>
  );
}
