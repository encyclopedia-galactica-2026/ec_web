"use client";

import { useRef, useEffect, useState } from "react";
import { animate } from "animejs";
import { Rocket, Loader2, X, RotateCcw, Check } from "lucide-react";
import type { TerraformPanelProps, SeedingStrategy } from "@/lib/terraforming/types";
import type { Planet } from "@/lib/db/schema";

function formatDelta(original: number | null | undefined, after: number): string {
  const diff = after - (original ?? 0);
  if (diff === 0) return "—";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}`;
}

function StrategyCard({
  strategy,
  planet,
  selected,
  onToggle,
}: {
  strategy: SeedingStrategy;
  planet: Planet;
  selected: boolean;
  onToggle: (s: SeedingStrategy) => void;
}) {
  return (
    <button
      onClick={() => onToggle(strategy)}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white">{strategy.name}</p>
        {selected && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/50">
        {strategy.description}
      </p>
      <div className="mt-2 flex items-center gap-3 text-[10px]">
        <span className="text-white/30">
          {strategy.estimatedYears.toLocaleString()} yrs
        </span>
        <span className="text-emerald-400/70">
          HI {formatDelta(planet.hi, strategy.afterValues.hi)}
        </span>
        <span className="text-sky-400/70">
          Temp {formatDelta(planet.plEqt, strategy.afterValues.plEqt)}K
        </span>
      </div>
    </button>
  );
}

export function TerraformPanel({
  state,
  planet,
  onStart,
  onConfirm,
  onReset,
  onRetry,
}: TerraformPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SeedingStrategy[]>([]);

  useEffect(() => {
    if (state.phase === "selecting") setSelected([]);
  }, [state.phase]);

  useEffect(() => {
    if (panelRef.current && state.phase !== "idle") {
      animate(panelRef.current, {
        opacity: [0, 1],
        translateX: [40, 0],
        ease: "outExpo",
        duration: 600,
      });
    }
  }, [state.phase]);

  const toggleStrategy = (s: SeedingStrategy) => {
    setSelected((prev) =>
      prev.some((p) => p.name === s.name)
        ? prev.filter((p) => p.name !== s.name)
        : [...prev, s],
    );
  };

  if (state.phase === "idle") {
    return (
      <div className="absolute top-20 right-6 z-20">
        <button
          onClick={onStart}
          className="group flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-4 py-2.5 text-xs text-white/60 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:text-emerald-400"
        >
          <Rocket className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
          Start Terraforming
        </button>
      </div>
    );
  }

  if (state.phase === "loading") {
    return (
      <div
        ref={panelRef}
        className="absolute top-20 right-6 z-20 w-72 rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-md"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating strategies...
        </div>
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div
        ref={panelRef}
        className="absolute top-20 right-6 z-20 w-72 rounded-xl border border-red-500/20 bg-black/60 p-4 backdrop-blur-md"
        style={{ opacity: 0 }}
      >
        <p className="text-sm text-red-400">Failed to generate strategies</p>
        <p className="mt-1 text-[11px] text-white/40">{state.message}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onRetry}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:text-white/80"
          >
            Retry
          </button>
          <button
            onClick={onReset}
            className="rounded-md px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white/60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "selecting") {
    return (
      <div
        ref={panelRef}
        className="absolute top-20 right-6 z-20 w-72 rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-md"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">
            Seeding Strategies
          </p>
          <button
            onClick={onReset}
            className="text-white/30 transition-colors hover:text-white/60"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1 text-[10px] text-white/30">
          Select one or more strategies to combine
        </p>
        <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {state.strategies.map((strategy) => (
            <StrategyCard
              key={strategy.name}
              strategy={strategy}
              planet={planet}
              selected={selected.some((s) => s.name === strategy.name)}
              onToggle={toggleStrategy}
            />
          ))}
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => onConfirm(selected)}
            className="mt-3 w-full rounded-lg bg-emerald-500/20 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
          >
            Begin Terraforming ({selected.length} strateg{selected.length === 1 ? "y" : "ies"})
          </button>
        )}
      </div>
    );
  }

  const activeStrategies = state.selected;

  return (
    <div
      ref={panelRef}
      className="absolute top-20 right-6 z-20 w-72 rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-md"
      style={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/70">
          Active Strategies
        </p>
        <button
          onClick={onReset}
          className="text-white/30 transition-colors hover:text-white/60"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 space-y-1.5">
        {activeStrategies.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-[11px]">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
            <span className="text-white/70">{s.name}</span>
            <span className="text-white/30">{s.estimatedYears.toLocaleString()} yrs</span>
          </div>
        ))}
      </div>
      {state.phase === "completed" && (
        <p className="mt-2 text-xs font-medium text-emerald-400">
          Terraforming complete
        </p>
      )}
    </div>
  );
}
