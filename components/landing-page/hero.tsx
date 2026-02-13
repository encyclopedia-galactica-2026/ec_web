"use client";

import { useRef, useState, useMemo } from "react";
import { animate } from "animejs";
import { Button } from "../ui/button";
import { Starfield } from "./starfield";
import { EarthSphere } from "./earth-sphere";
import { ExoplanetList } from "./exoplanet-list";
import { SearchBar } from "./search-bar";
import { filterExoplanets } from "@/lib/exoplanets";

export function Hero() {
  const heroTextRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [explorerReady, setExplorerReady] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterExoplanets(query), [query]);
  const midpoint = Math.ceil(filtered.length / 2);
  const leftPlanets = filtered.slice(0, midpoint);
  const rightPlanets = filtered.slice(midpoint);

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
      <Starfield />

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
          <SearchBar value={query} onChange={setQuery} visible={explorerReady} />

          <div className="flex flex-1 items-center justify-between w-full">
            <ExoplanetList side="left" planets={leftPlanets} visible={explorerReady} />

            <div
              ref={sphereRef}
              className="min-w-0 flex-1 h-[60vh]"
              style={{ opacity: 0 }}
            >
              <EarthSphere visible={entered} />
            </div>

            <ExoplanetList side="right" planets={rightPlanets} visible={explorerReady} />
          </div>
        </div>
      )}
    </section>
  );
}
