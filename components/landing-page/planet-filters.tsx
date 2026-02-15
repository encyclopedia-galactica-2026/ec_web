"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export interface PlanetFilters {
  hiMin?: number;
  hiMax?: number;
  tempMin?: number;
  tempMax?: number;
  radiusMin?: number;
  radiusMax?: number;
  massMin?: number;
  massMax?: number;
  riskLevels?: string[];
}

interface PlanetFiltersProps {
  filters: PlanetFilters;
  onChange: (filters: PlanetFilters) => void;
  visible: boolean;
}

const riskOptions = [
  { label: "Low", active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { label: "Moderate", active: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { label: "High", active: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { label: "Critical", active: "bg-red-500/20 text-red-400 border-red-500/30" },
] as const;

function countActiveFilters(filters: PlanetFilters): number {
  let count = 0;
  if (filters.hiMin != null) count++;
  if (filters.hiMax != null) count++;
  if (filters.tempMin != null) count++;
  if (filters.tempMax != null) count++;
  if (filters.radiusMin != null) count++;
  if (filters.radiusMax != null) count++;
  if (filters.massMin != null) count++;
  if (filters.massMax != null) count++;
  if (filters.riskLevels && filters.riskLevels.length > 0) count++;
  return count;
}

function NumberRangeInput({
  label,
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  minValue?: number;
  maxValue?: number;
  minPlaceholder: string;
  maxPlaceholder: string;
  onMinChange: (val?: number) => void;
  onMaxChange: (val?: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          placeholder={minPlaceholder}
          value={minValue ?? ""}
          onChange={(e) =>
            onMinChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          className="w-20 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none"
        />
        <span className="text-white/20">–</span>
        <input
          type="number"
          placeholder={maxPlaceholder}
          value={maxValue ?? ""}
          onChange={(e) =>
            onMaxChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          className="w-20 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function FilterToggle({
  filters,
  expanded,
  onToggle,
}: {
  filters: PlanetFilters;
  expanded: boolean;
  onToggle: () => void;
}) {
  const activeCount = countActiveFilters(filters);

  return (
    <button
      onClick={onToggle}
      className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${
        expanded
          ? "border-white/20 bg-white/10 text-white/80"
          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
      }`}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      Filters
      {activeCount > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-medium text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

export function PlanetFiltersPanel({
  filters,
  onChange,
}: {
  filters: PlanetFilters;
  onChange: (filters: PlanetFilters) => void;
}) {
  const activeCount = countActiveFilters(filters);

  function update(patch: Partial<PlanetFilters>) {
    onChange({ ...filters, ...patch });
  }

  function toggleRisk(level: string) {
    const current = filters.riskLevels ?? [];
    const next = current.includes(level)
      ? current.filter((r) => r !== level)
      : [...current, level];
    update({ riskLevels: next.length > 0 ? next : undefined });
  }

  function clearAll() {
    onChange({});
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-start gap-5">
        <NumberRangeInput
          label="Habitability Index"
          minValue={filters.hiMin}
          maxValue={filters.hiMax}
          minPlaceholder="0"
          maxPlaceholder="100"
          onMinChange={(v) => update({ hiMin: v })}
          onMaxChange={(v) => update({ hiMax: v })}
        />

        <NumberRangeInput
          label="Temperature (K)"
          minValue={filters.tempMin}
          maxValue={filters.tempMax}
          minPlaceholder="Min"
          maxPlaceholder="Max"
          onMinChange={(v) => update({ tempMin: v })}
          onMaxChange={(v) => update({ tempMax: v })}
        />

        <NumberRangeInput
          label="Radius (R⊕)"
          minValue={filters.radiusMin}
          maxValue={filters.radiusMax}
          minPlaceholder="Min"
          maxPlaceholder="Max"
          onMinChange={(v) => update({ radiusMin: v })}
          onMaxChange={(v) => update({ radiusMax: v })}
        />

        <NumberRangeInput
          label="Mass (M⊕)"
          minValue={filters.massMin}
          maxValue={filters.massMax}
          minPlaceholder="Min"
          maxPlaceholder="Max"
          onMinChange={(v) => update({ massMin: v })}
          onMaxChange={(v) => update({ massMax: v })}
        />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-white/40">
            Risk Level
          </span>
          <div className="flex items-center gap-1.5">
            {riskOptions.map((opt) => {
              const isActive = filters.riskLevels?.includes(opt.label);
              return (
                <button
                  key={opt.label}
                  onClick={() => toggleRisk(opt.label)}
                  className={`rounded border px-2 py-1 text-xs transition-colors ${
                    isActive
                      ? opt.active
                      : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="mt-3 flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}
    </div>
  );
}
