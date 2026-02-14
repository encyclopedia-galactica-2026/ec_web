"use client";

import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";
import { Play, Pause } from "lucide-react";
import type { TimelineSliderProps } from "@/lib/terraforming/types";

const SPEEDS = [1, 2, 5, 10] as const;

export function TimelineSlider({
  totalYears,
  year,
  playing,
  speed,
  onYearChange,
  onPlayPause,
  onSpeedChange,
}: TimelineSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const yearRef = useRef(year);

  yearRef.current = year;

  useEffect(() => {
    if (containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        translateY: [30, 0],
        ease: "outExpo",
        duration: 600,
      });
    }
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const yearsPerSecond = speed * 10;
      const nextYear = Math.min(
        yearRef.current + dt * yearsPerSecond,
        totalYears,
      );

      onYearChange(nextYear);

      if (nextYear < totalYears) {
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [speed, totalYears, onYearChange],
  );

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, tick]);

  const progress = totalYears > 0 ? year / totalYears : 0;

  const formatYear = (y: number) => {
    if (y >= 1000) return `${(y / 1000).toFixed(1)}k`;
    return Math.round(y).toString();
  };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-black/70 px-6 py-4 backdrop-blur-md"
      style={{ opacity: 0 }}
    >
      <div className="mx-auto flex max-w-4xl items-center gap-4">
        <button
          onClick={onPlayPause}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 translate-x-[1px]" />
          )}
        </button>

        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-white/40">
            <span>Year {formatYear(year)}</span>
            <span>{formatYear(totalYears)} yrs total</span>
          </div>

          <div className="group relative w-full py-2">
            <div className="relative h-1.5 w-full rounded-full bg-white/10">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500/80 to-emerald-500/80"
                style={{ width: `${progress * 100}%` }}
              />
              <div
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white shadow-sm transition-transform group-hover:scale-125"
                style={{ left: `${progress * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={totalYears}
              step={totalYears / 1000}
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                speed === s
                  ? "bg-white/15 text-white"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
