"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { animate } from "animejs";
import type { Planet } from "@/lib/db/schema";
import type { OrchestratorResponse } from "@/lib/seeding/types";
import type { ShaderKeyframe } from "@/lib/seeding/shader-timeline";
import { computeSeedingKeyframes } from "@/lib/seeding/shader-timeline";
import { SeedingTimeline } from "./seeding-timeline";
import { SeedingPlanetViewer } from "./seeded-planet-viewer";
import "./seeding-timeline.css";

interface SeedingPanelProps {
    planet: Planet;
    onClose: () => void;
}

type Phase = "loading" | "ready" | "error";

export function SeedingPanel({ planet, onClose }: SeedingPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const [phase, setPhase] = useState<Phase>("loading");
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<OrchestratorResponse | null>(null);
    const [keyframes, setKeyframes] = useState<ShaderKeyframe[]>([]);
    const [activeStage, setActiveStage] = useState(0);
    const [progress, setProgress] = useState(0);
    const [playing, setPlaying] = useState(false);

    // ─── Entrance animation ────────────────────────────────────────
    useEffect(() => {
        if (panelRef.current) {
            animate(panelRef.current, {
                opacity: [0, 1],
                ease: "outExpo",
                duration: 600,
            });
        }
    }, []);

    // ─── Fetch seeding data ────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function fetchSeeding() {
            try {
                const res = await fetch(
                    `/api/seeding?planet=${encodeURIComponent(planet.plName)}`,
                );
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || `API error ${res.status}`);
                }
                const data: OrchestratorResponse = await res.json();
                if (cancelled) return;

                const kf = computeSeedingKeyframes(planet, data);
                setResponse(data);
                setKeyframes(kf);
                setPhase("ready");
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : "Unknown error");
                setPhase("error");
            }
        }

        fetchSeeding();
        return () => { cancelled = true; };
    }, [planet]);

    // ─── Stage change with animated progress ───────────────────────
    const progressRef = useRef(0);
    const stageChangeRef = useRef<(stage: number) => void>(() => { });

    stageChangeRef.current = (stage: number) => {
        setActiveStage(stage);

        const obj = { p: progressRef.current };
        animate(obj, {
            p: stage,
            ease: "outQuart",
            duration: 1200,
            onUpdate: () => {
                progressRef.current = obj.p;
                setProgress(obj.p);
            },
        });
    };

    const handleStageChange = useCallback(
        (stage: number) => stageChangeRef.current(stage),
        [],
    );

    // ─── Auto-play ─────────────────────────────────────────────────
    useEffect(() => {
        if (!playing || keyframes.length === 0) return;

        const totalStages = keyframes.length - 1;
        let current = activeStage;

        const timer = setInterval(() => {
            current = current + 1;
            if (current > totalStages) {
                current = 0;
            }
            stageChangeRef.current(current);
        }, 3000);

        return () => clearInterval(timer);
    }, [playing, keyframes.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Close animation ──────────────────────────────────────────
    const handleClose = useCallback(() => {
        setPlaying(false);
        if (panelRef.current) {
            animate(panelRef.current, {
                opacity: [1, 0],
                ease: "inExpo",
                duration: 400,
                onComplete: onClose,
            });
        } else {
            onClose();
        }
    }, [onClose]);

    return (
        <div
            ref={panelRef}
            className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
            style={{ opacity: 0 }}
        >
            {/* ─── Header ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">
                        {planet.plName}
                        {response && (
                            <span className="ml-3 text-sm font-normal text-white/40">
                                {response.selected_strategy_name}
                            </span>
                        )}
                    </h2>
                    {response && (
                        <p className="mt-0.5 text-xs text-white/30">
                            {response.total_duration_years.toLocaleString()} years ·{" "}
                            {response.asteroid_mass_required}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white/90"
                >
                    ✕ Close
                </button>
            </div>

            {/* ─── Main content ─────────────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {phase === "loading" && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
                        <p className="text-sm text-white/50">
                            Running seeding simulation…
                        </p>
                        <p className="max-w-xs text-center text-xs text-white/30">
                            The AI orchestrator is analyzing terraforming strategies. This
                            takes 10-20 seconds.
                        </p>
                    </div>
                )}

                {phase === "error" && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-6 py-4 text-center">
                            <p className="text-sm font-medium text-red-400">
                                Simulation Failed
                            </p>
                            <p className="mt-1 text-xs text-red-400/60">{error}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-xs text-white/40 hover:text-white/70"
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {phase === "ready" && (
                    <>
                        {/* Planet viewer */}
                        <div className="flex-1 min-h-0">
                            <SeedingPlanetViewer
                                keyframes={keyframes}
                                progress={progress}
                            />
                        </div>

                        {/* Timeline */}
                        <div className="shrink-0 border-t border-white/10 px-4 pb-4">
                            <SeedingTimeline
                                keyframes={keyframes}
                                activeStage={activeStage}
                                onStageChange={handleStageChange}
                                playing={playing}
                                onPlayToggle={() => setPlaying((p) => !p)}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
