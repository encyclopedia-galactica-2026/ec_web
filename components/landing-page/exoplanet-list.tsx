"use client";

import { useRef } from "react";
import type { Exoplanet } from "@/lib/exoplanets";

interface ExoplanetListProps {
  side: "left" | "right";
  planets: Exoplanet[];
  visible: boolean;
}

export function ExoplanetList({ side, planets, visible }: ExoplanetListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={`scrollbar-hide w-80 shrink-0 flex-col gap-3 overflow-y-auto px-3 py-5 transition-opacity duration-500 md:w-96 ${visible ? "flex opacity-100" : "hidden opacity-0 pointer-events-none"}`}
      style={{ height: "calc(100vh - 10rem)" }}
    >
      {planets.map((planet, i) => (
        <div
          key={planet.name}
          className="w-full shrink-0 cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10"
        >
            <p className="truncate text-base font-medium text-white">{planet.name}</p>
            <p className="mt-1 truncate text-sm text-white/50">
              {planet.distance} ly &middot; {planet.type}
            </p>
            <p
              className="mt-2 text-sm leading-relaxed text-white/40"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {planet.description}
            </p>
          </div>
        ))}
      {planets.length === 0 && (
        <p className="py-8 text-center text-sm text-white/30">No planets found</p>
      )}
    </div>
  );
}
