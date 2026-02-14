"use client";

import { useRef, useState, useCallback, useTransition, useEffect, useMemo } from "react";
import { animate } from "animejs";
import { Button } from "../ui/button";
import { Starfield } from "./starfield";
import { EarthSphere } from "./earth-sphere";
import { ExoplanetList } from "./exoplanet-list";
import { SearchBar } from "./search-bar";
import { TerraformPanel } from "../terraforming/terraform-panel";
import { TimelineSlider } from "../terraforming/timeline-slider";
import { PlanetDescription } from "../terraforming/planet-description";
import { searchPlanets } from "@/lib/actions/planets";
import { interpolatePlanet, combineAfterValues } from "@/lib/terraforming/interpolate";
import type { Planet } from "@/lib/db/schema";
import type { TerraformState, SeedingStrategy } from "@/lib/terraforming/types";

const PAGE_SIZE = 50;

function getHIColor(hi: number): string {
  if (hi >= 80) return "#22c55e";
  if (hi >= 60) return "#84cc16";
  if (hi >= 40) return "#eab308";
  if (hi >= 20) return "#f97316";
  return "#ef4444";
}

function getHILabel(hi: number): string {
  if (hi >= 80) return "Excellent";
  if (hi >= 60) return "Good";
  if (hi >= 40) return "Moderate";
  if (hi >= 20) return "Poor";
  return "Hostile";
}

function formatValue(val: number | null | undefined, decimals = 2, fallback = "N/A"): string {
  if (val == null) return fallback;
  return val.toFixed(decimals);
}

function DeltaValue({
  original,
  current,
  decimals = 1,
}: {
  original: number | null | undefined;
  current: number | null | undefined;
  decimals?: number;
}) {
  if (original == null || current == null) return null;
  const diff = current - original;
  if (Math.abs(diff) < 0.05) return null;
  const sign = diff > 0 ? "+" : "";
  const color = diff > 0 ? "text-emerald-400/70" : "text-red-400/70";
  return (
    <span className={`ml-1 text-[10px] ${color}`}>
      ({sign}{diff.toFixed(decimals)})
    </span>
  );
}

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
  const planetInfoRef = useRef<HTMLDivElement>(null);

  const [terraformState, setTerraformState] = useState<TerraformState>({ phase: "idle" });

  const displayPlanet = useMemo(() => {
    if (!targetPlanet) return null;
    if (terraformState.phase === "simulating") {
      const progress = terraformState.year / terraformState.totalYears;
      return interpolatePlanet(targetPlanet, terraformState.combined, progress);
    }
    if (terraformState.phase === "completed") {
      return interpolatePlanet(targetPlanet, terraformState.combined, 1);
    }
    return targetPlanet;
  }, [targetPlanet, terraformState]);

  const handleStartTerraform = useCallback(async () => {
    if (!targetPlanet) return;
    setTerraformState({ phase: "loading" });

    try {
      const res = await fetch("/api/terraform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planet: targetPlanet }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setTerraformState({ phase: "selecting", strategies: data.strategies });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setTerraformState({ phase: "error", message });
    }
  }, [targetPlanet]);

  const handleConfirmStrategies = useCallback((strategies: SeedingStrategy[]) => {
    const totalYears = Math.max(...strategies.map((s) => s.estimatedYears));
    const combined = combineAfterValues(strategies);
    setTerraformState({
      phase: "simulating",
      selected: strategies,
      totalYears,
      combined,
      year: 0,
      playing: false,
      speed: 1,
    });
  }, []);

  const handleYearChange = useCallback((year: number) => {
    setTerraformState((prev) => {
      if (prev.phase === "completed") {
        if (year >= prev.totalYears) return prev;
        return {
          phase: "simulating",
          selected: prev.selected,
          totalYears: prev.totalYears,
          combined: prev.combined,
          year,
          playing: false,
          speed: 1,
        };
      }
      if (prev.phase !== "simulating") return prev;
      if (year >= prev.totalYears) {
        return {
          phase: "completed",
          selected: prev.selected,
          totalYears: prev.totalYears,
          combined: prev.combined,
        };
      }
      return { ...prev, year };
    });
  }, []);

  const handlePlayPause = useCallback(() => {
    setTerraformState((prev) => {
      if (prev.phase === "completed") {
        return {
          phase: "simulating",
          selected: prev.selected,
          totalYears: prev.totalYears,
          combined: prev.combined,
          year: 0,
          playing: true,
          speed: 1,
        };
      }
      if (prev.phase !== "simulating") return prev;
      return { ...prev, playing: !prev.playing };
    });
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setTerraformState((prev) => {
      if (prev.phase !== "simulating") return prev;
      return { ...prev, speed };
    });
  }, []);

  const handleResetTerraform = useCallback(() => {
    setTerraformState({ phase: "idle" });
  }, []);

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

    if (targetPlanet) {
      requestAnimationFrame(() => {
        if (planetInfoRef.current) {
          animate(planetInfoRef.current, {
            opacity: [0, 1],
            translateX: [-40, 0],
            ease: "outExpo",
            duration: 700,
          });
        }
      });
    } else {
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
    setTerraformState({ phase: "idle" });

    if (planetInfoRef.current) {
      animate(planetInfoRef.current, {
        opacity: [1, 0],
        translateX: [0, -40],
        ease: "inExpo",
        duration: 400,
        onComplete: () => {
          setPlanetLabel(null);
          setStarSpeed(40);
          setTargetPlanet(null);
        },
      });
    } else {
      setPlanetLabel(null);
      setStarSpeed(40);
      setTargetPlanet(null);
    }
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
          <div ref={searchBarRef} style={{ pointerEvents: targetPlanet ? "none" : "auto" }}>
            <SearchBar value={query} onChange={handleSearch} visible={explorerReady} />
          </div>

          <div className="flex flex-1 items-center justify-between w-full">
            <div ref={leftListRef} style={{ pointerEvents: targetPlanet ? "none" : "auto" }}>
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
                displayPlanet={displayPlanet}
                onTravelComplete={handleTravelComplete}
              />
            </div>

            <div ref={rightListRef} style={{ pointerEvents: targetPlanet ? "none" : "auto" }}>
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
      {planetLabel && !traveling && targetPlanet && displayPlanet && (
        <>
          <div
            ref={planetInfoRef}
            className="absolute top-20 bottom-20 left-6 z-20 max-w-xs overflow-y-auto"
            style={{ opacity: 0 }}
          >
            <div className="rounded-xl border border-white/10 bg-black/60 px-5 py-4 backdrop-blur-md">
              <p
                className="text-5xl font-bold tabular-nums tracking-tight"
                style={{ color: getHIColor(displayPlanet.hi ?? 0) }}
              >
                {formatValue(displayPlanet.hi, 1)}
              </p>
              <p
                className="text-sm font-semibold uppercase tracking-widest"
                style={{ color: getHIColor(displayPlanet.hi ?? 0) }}
              >
                {getHILabel(displayPlanet.hi ?? 0)}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/40">
                Habitability Index
                <DeltaValue original={targetPlanet.hi} current={displayPlanet.hi} />
              </p>

              <div className="mt-4 space-y-2 text-xs text-white/70">
                <p className="text-sm font-medium text-white">{targetPlanet.plName}</p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                  <span className="text-white/40">Eq. Temp</span>
                  <span className="text-right">
                    {formatValue(displayPlanet.plEqt, 0)} K
                    <DeltaValue original={targetPlanet.plEqt} current={displayPlanet.plEqt} decimals={0} />
                  </span>

                  <span className="text-white/40">Radius</span>
                  <span className="text-right">{formatValue(targetPlanet.plRade)} R⊕</span>

                  <span className="text-white/40">Mass</span>
                  <span className="text-right">{formatValue(targetPlanet.plBmasse)} M⊕</span>

                  <span className="text-white/40">Orbit</span>
                  <span className="text-right">{formatValue(targetPlanet.plOrbsmax, 3)} AU</span>

                  <span className="text-white/40">Stellar Flux</span>
                  <span className="text-right">
                    {formatValue(displayPlanet.flux, 2)}
                    <DeltaValue original={targetPlanet.flux} current={displayPlanet.flux} />
                  </span>

                  <span className="text-white/40">TRI</span>
                  <span className="text-right">
                    {formatValue(displayPlanet.tri, 1)}
                    <DeltaValue original={targetPlanet.tri} current={displayPlanet.tri} />
                  </span>

                  <span className="text-white/40">Atmosphere</span>
                  <span className="text-right">
                    {formatValue(displayPlanet.atmosphereScore, 2)}
                    <DeltaValue original={targetPlanet.atmosphereScore} current={displayPlanet.atmosphereScore} />
                  </span>

                  {displayPlanet.riskLevel && (
                    <>
                      <span className="text-white/40">Risk</span>
                      <span className="text-right">{displayPlanet.riskLevel}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <PlanetDescription
              key={targetPlanet.plName}
              planet={targetPlanet}
              terraformState={terraformState}
            />
          </div>

          <TerraformPanel
            state={terraformState}
            planet={targetPlanet}
            onStart={handleStartTerraform}
            onConfirm={handleConfirmStrategies}
            onReset={handleResetTerraform}
            onRetry={handleStartTerraform}
          />

          {(terraformState.phase === "simulating" || terraformState.phase === "completed") && (
            <TimelineSlider
              totalYears={terraformState.totalYears}
              year={
                terraformState.phase === "simulating"
                  ? terraformState.year
                  : terraformState.totalYears
              }
              playing={
                terraformState.phase === "simulating" ? terraformState.playing : false
              }
              speed={
                terraformState.phase === "simulating" ? terraformState.speed : 1
              }
              onYearChange={handleYearChange}
              onPlayPause={handlePlayPause}
              onSpeedChange={handleSpeedChange}
            />
          )}

          {terraformState.phase !== "simulating" && terraformState.phase !== "completed" && (
            <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
              <button
                onClick={handleBackToEarth}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 backdrop-blur-sm transition-colors hover:text-white/80"
              >
                ← Back to Earth
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
