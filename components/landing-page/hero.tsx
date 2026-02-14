"use client";

import { useRef, useState, useCallback, useTransition, useEffect } from "react";
import { animate } from "animejs";
import { Button } from "../ui/button";
import { Starfield } from "./starfield";
import { EarthSphere } from "./earth-sphere";
import { ExoplanetList } from "./exoplanet-list";
import { SearchBar } from "./search-bar";
import { SeedingPanel } from "@/components/seeding/seeding-panel";
import { searchPlanets } from "@/lib/actions/planets";
import type { Planet } from "@/lib/db/schema";

const PAGE_SIZE = 50;

interface HeroProps {
  initialPlanets: Planet[];
  initialHasMore: boolean;
}

export function Hero({ initialPlanets, initialHasMore }: HeroProps) {
  const heroTextRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const leftListRef = useRef<HTMLDivElement>(null);
  const rightListRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [explorerReady, setExplorerReady] = useState(false);

  const [query, setQuery] = useState("");
  const [planets, setPlanets] = useState<Planet[]>(initialPlanets);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(PAGE_SIZE);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [targetPlanet, setTargetPlanet] = useState<Planet | null>(null);
  const [traveling, setTraveling] = useState(false);
  const [starSpeed, setStarSpeed] = useState(2);
  const [planetLabel, setPlanetLabel] = useState<string | null>(null);
  const [seedingPlanet, setSeedingPlanet] = useState<Planet | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          const result = await searchPlanets(value, 0);
          setPlanets(result.planets);
          setHasMore(result.hasMore);
          setOffset(PAGE_SIZE);
        });
      }, 300);
    },
    [startTransition],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || isPending) return;

    startTransition(async () => {
      const result = await searchPlanets(query, offset);
      setPlanets((prev) => [...prev, ...result.planets]);
      setHasMore(result.hasMore);
      setOffset((prev) => prev + PAGE_SIZE);
    });
  }, [hasMore, isPending, query, offset, startTransition]);

  const handlePlanetClick = useCallback(
    (planet: Planet) => {
      if (traveling) return;
      setTraveling(true);

      const elements = [leftListRef.current, rightListRef.current, searchBarRef.current].filter(Boolean) as HTMLElement[];

      let completed = 0;
      const total = elements.length;

      elements.forEach((el) => {
        animate(el, {
          opacity: [1, 0],
          translateX: el === leftListRef.current ? [0, -80] : el === rightListRef.current ? [0, 80] : 0,
          translateY: el === searchBarRef.current ? [0, -40] : 0,
          ease: "inExpo",
          duration: 500,
          onComplete: () => {
            completed++;
            if (completed >= total) {
              setStarSpeed(40);
              setTargetPlanet(planet);
              setPlanetLabel(planet.plName);
            }
          },
        });
      });
    },
    [traveling],
  );

  const handleTravelComplete = useCallback(() => {
    setStarSpeed(2);
    setTraveling(false);

    if (!targetPlanet) {
      const elements = [leftListRef.current, rightListRef.current, searchBarRef.current].filter(Boolean) as HTMLElement[];
      elements.forEach((el) => {
        animate(el, {
          opacity: [0, 1],
          translateX: 0,
          translateY: 0,
          ease: "outExpo",
          duration: 600,
        });
      });
    }
  }, [targetPlanet]);

  const handleBackToEarth = useCallback(() => {
    if (traveling) return;
    setTraveling(true);
    setPlanetLabel(null);
    setStarSpeed(40);
    setTargetPlanet(null);
  }, [traveling]);

  const midpoint = Math.ceil(planets.length / 2);
  const leftPlanets = planets.slice(0, midpoint);
  const rightPlanets = planets.slice(midpoint);

  function handleEnter() {
    if (!heroTextRef.current) return;

    animate(heroTextRef.current, {
      scale: [1, 0],
      opacity: [1, 0],
      ease: "inExpo",
      duration: 600,
      onComplete: () => {
        setEntered(true);

        requestAnimationFrame(() => {
          if (sphereRef.current) {
            animate(sphereRef.current, {
              opacity: [0, 1],
              clipPath: ["circle(0% at 50% 50%)", "circle(71% at 50% 50%)"],
              ease: "outExpo",
              duration: 800,
              onComplete: () => setExplorerReady(true),
            });
          }

          setTimeout(() => setExplorerReady(true), 400);
        });
      },
    });
  }

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-black pt-14">
      <Starfield speed={starSpeed} />

      {!entered && (
        <div ref={heroTextRef} className="relative z-10 container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="font-serif text-4xl tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                Encyclopedia Galactica
              </h1>
              <p className="mx-auto max-w-175 text-muted-foreground md:text-xl">
                Don&apos;t just discover habitable worlds. Engineer them.
              </p>
              <Button className="mt-8" variant="ghost" onClick={handleEnter}>
                Enter
              </Button>
            </div>
          </div>
        </div>
      )}

      {entered && (
        <div className="relative z-10 flex h-full w-full flex-col items-center px-4 pt-4">
          <div ref={searchBarRef}>
            <SearchBar value={query} onChange={handleSearch} visible={explorerReady} />
          </div>

          <div className="flex flex-1 items-center justify-between w-full">
            <div ref={leftListRef}>
              <ExoplanetList
                side="left"
                planets={leftPlanets}
                visible={explorerReady}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={isPending}
                onPlanetClick={handlePlanetClick}
              />
            </div>

            <div
              ref={sphereRef}
              className="relative min-w-0 flex-1 h-[60vh]"
              style={{ opacity: 0 }}
            >
              <EarthSphere
                visible={entered}
                targetPlanet={targetPlanet}
                onTravelComplete={handleTravelComplete}
              />
              {planetLabel && !traveling && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                  <p className="text-center text-sm font-medium text-white">{planetLabel}</p>
                  <div className="mt-1 flex items-center justify-center gap-3">
                    <button
                      onClick={handleBackToEarth}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      ← Back to Earth
                    </button>
                    {targetPlanet && (
                      <button
                        onClick={() => setSeedingPlanet(targetPlanet)}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-400 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/20"
                      >
                        Begin Seeding
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div ref={rightListRef}>
              <ExoplanetList
                side="right"
                planets={rightPlanets}
                visible={explorerReady}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={isPending}
                onPlanetClick={handlePlanetClick}
              />
            </div>
          </div>
        </div>
      )}

      {seedingPlanet && (
        <SeedingPanel
          planet={seedingPlanet}
          onClose={() => setSeedingPlanet(null)}
        />
      )}
    </section>
  );
}
