import type { Planet } from "@/lib/db/schema";

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
