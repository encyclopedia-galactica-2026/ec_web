import type { Planet } from "@/lib/db/schema";

export const STRATEGY_CATEGORIES = [
  "Agritech",
  "Atmospheric Engineering",
  "Bioengineering",
  "Geothermal",
  "Hydrological",
  "Orbital Infrastructure",
] as const;

export type StrategyCategory = (typeof STRATEGY_CATEGORIES)[number];

export const CATEGORY_META: Record<
  StrategyCategory,
  { icon: string; color: string; bg: string }
> = {
  Agritech: { icon: "Sprout", color: "text-lime-400", bg: "bg-lime-400/15" },
  "Atmospheric Engineering": {
    icon: "Wind",
    color: "text-sky-400",
    bg: "bg-sky-400/15",
  },
  Bioengineering: {
    icon: "Dna",
    color: "text-violet-400",
    bg: "bg-violet-400/15",
  },
  Geothermal: {
    icon: "Flame",
    color: "text-orange-400",
    bg: "bg-orange-400/15",
  },
  Hydrological: {
    icon: "Droplets",
    color: "text-cyan-400",
    bg: "bg-cyan-400/15",
  },
  "Orbital Infrastructure": {
    icon: "Orbit",
    color: "text-amber-400",
    bg: "bg-amber-400/15",
  },
};

export interface TerraformAfterValues {
  plEqt: number;
  hi: number;
  tri: number;
  flux: number;
  atmosphereScore: number;
  tempScore: number;
  radiusScore: number;
  massScore: number;
  fluxScore: number;
  hzScore: number;
  riskLevel: string;
}

export interface SeedingStrategy {
  name: string;
  category: StrategyCategory;
  description: string;
  estimatedYears: number;
  afterValues: TerraformAfterValues;
}

export type TerraformState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "selecting"; strategies: SeedingStrategy[] }
  | {
      phase: "simulating";
      selected: SeedingStrategy[];
      totalYears: number;
      combined: TerraformAfterValues;
      year: number;
      playing: boolean;
      speed: number;
    }
  | {
      phase: "completed";
      selected: SeedingStrategy[];
      totalYears: number;
      combined: TerraformAfterValues;
    };

export interface TerraformPanelProps {
  state: TerraformState;
  planet: Planet;
  onStart: () => void;
  onConfirm: (strategies: SeedingStrategy[]) => void;
  onReset: () => void;
  onRetry: () => void;
}

export interface TimelineSliderProps {
  totalYears: number;
  year: number;
  playing: boolean;
  speed: number;
  onYearChange: (year: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
}
