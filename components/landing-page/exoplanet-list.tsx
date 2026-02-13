"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Planet } from "@/lib/db/schema";

interface ExoplanetListProps {
  side: "left" | "right";
  planets: Planet[];
  visible: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onPlanetClick?: (planet: Planet) => void;
}

function riskColor(level: string | null) {
  switch (level) {
    case "Low":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Moderate":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "High":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "Critical":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-white/10 text-white/50 border-white/20";
  }
}

function hiColor(hi: number | null) {
  if (!hi) return "text-white/40";
  if (hi >= 70) return "text-emerald-400";
  if (hi >= 40) return "text-amber-400";
  return "text-red-400";
}

function formatNum(n: number | null, decimals = 2) {
  if (n === null || n === undefined) return "—";
  return n.toFixed(decimals);
}

function PlanetCard({ planet, onClick }: { planet: Planet; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="w-full shrink-0 cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-base font-medium text-white">
          {planet.plName}
        </p>
        <span className={`shrink-0 text-lg font-bold tabular-nums ${hiColor(planet.hi)}`}>
          {formatNum(planet.hi, 1)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${riskColor(planet.riskLevel)}`}>
          {planet.riskLevel ?? "Unknown"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">Radius</p>
          <p className="text-sm tabular-nums text-white/70">{formatNum(planet.plRade)} R⊕</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">Mass</p>
          <p className="text-sm tabular-nums text-white/70">{formatNum(planet.plBmasse)} M⊕</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">Temp</p>
          <p className="text-sm tabular-nums text-white/70">{formatNum(planet.plEqt, 0)} K</p>
        </div>
      </div>

      <div className="mt-2 flex gap-1">
        {[
          { label: "T", value: planet.tempScore },
          { label: "R", value: planet.radiusScore },
          { label: "M", value: planet.massScore },
          { label: "F", value: planet.fluxScore },
          { label: "HZ", value: planet.hzScore },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex-1 rounded bg-white/5 px-1 py-0.5 text-center"
            title={`${label} score: ${formatNum(value, 3)}`}
          >
            <p className="text-[9px] text-white/30">{label}</p>
            <div
              className="mx-auto mt-0.5 h-0.5 rounded-full bg-emerald-500/60"
              style={{ width: `${Math.min((value ?? 0) * 100, 100)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExoplanetList({
  side,
  planets,
  visible,
  onLoadMore,
  hasMore,
  loading,
  onPlanetClick,
}: ExoplanetListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root: containerRef.current,
      rootMargin: "200px",
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div
      ref={containerRef}
      className={`scrollbar-hide w-80 shrink-0 flex-col gap-3 overflow-y-auto px-3 py-5 transition-opacity duration-500 md:w-96 ${visible ? "flex opacity-100" : "hidden opacity-0 pointer-events-none"}`}
      style={{ height: "calc(100vh - 10rem)" }}
    >
      {planets.map((planet, i) => (
        <PlanetCard key={`${planet.plName}-${side}-${i}`} planet={planet} onClick={() => onPlanetClick?.(planet)} />
      ))}

      {planets.length === 0 && !loading && (
        <p className="py-8 text-center text-sm text-white/30">No planets found</p>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          )}
        </div>
      )}
    </div>
  );
}
