"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { animate } from "animejs";
import type { ShaderKeyframe } from "@/lib/seeding/shader-timeline";

interface SeedingTimelineProps {
    keyframes: ShaderKeyframe[];
    activeStage: number;
    onStageChange: (stage: number) => void;
    playing: boolean;
    onPlayToggle: () => void;
}

function formatYears(y: number): string {
    if (y === 0) return "Now";
    if (y >= 1000) return `${(y / 1000).toFixed(1)}k yr`;
    return `${y} yr`;
}

export function SeedingTimeline({
    keyframes,
    activeStage,
    onStageChange,
    playing,
    onPlayToggle,
}: SeedingTimelineProps) {
    const progressRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [hoveredStage, setHoveredStage] = useState<number | null>(null);

    // Animate progress bar width when activeStage changes
    useEffect(() => {
        if (!progressRef.current) return;
        const pct = keyframes.length > 1 ? (activeStage / (keyframes.length - 1)) * 100 : 0;

        animate(progressRef.current, {
            width: `${pct}%`,
            ease: "outExpo",
            duration: 800,
        });
    }, [activeStage, keyframes.length]);

    // Pulse the active node
    useEffect(() => {
        const node = nodeRefs.current[activeStage];
        if (!node) return;
        animate(node, {
            scale: [1, 1.25, 1],
            ease: "outElastic(1, 0.5)",
            duration: 600,
        });
    }, [activeStage]);

    const displayStage = hoveredStage ?? activeStage;
    const displayKf = keyframes[displayStage];

    return (
        <div className="seeding-timeline">
            {/* Track */}
            <div className="seeding-timeline__track">
                <div className="seeding-timeline__rail" />
                <div ref={progressRef} className="seeding-timeline__progress" style={{ width: 0 }} />

                {keyframes.map((kf, i) => {
                    const pct = keyframes.length > 1 ? (i / (keyframes.length - 1)) * 100 : 0;
                    const isActive = i === activeStage;
                    const isPast = i < activeStage;

                    return (
                        <button
                            key={i}
                            ref={(el) => { nodeRefs.current[i] = el; }}
                            className={`seeding-timeline__node ${isActive ? "active" : ""} ${isPast ? "past" : ""}`}
                            style={{ left: `${pct}%` }}
                            onClick={() => onStageChange(i)}
                            onMouseEnter={() => setHoveredStage(i)}
                            onMouseLeave={() => setHoveredStage(null)}
                            aria-label={`Stage ${i}: ${kf.label}`}
                        >
                            <span className="seeding-timeline__node-dot" />
                            <span className="seeding-timeline__node-label">
                                {i === 0 ? "Current" : `Stage ${i}`}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Detail panel */}
            {displayKf && (
                <div className="seeding-timeline__detail">
                    <div className="seeding-timeline__detail-header">
                        <span className="seeding-timeline__detail-stage">
                            {displayStage === 0 ? "Current State" : `Stage ${displayStage}`}
                        </span>
                        <span className="seeding-timeline__detail-year">
                            {formatYears(displayKf.yearOffset)}
                        </span>
                    </div>
                    <p className="seeding-timeline__detail-text">{displayKf.label}</p>
                </div>
            )}

            {/* Controls */}
            <div className="seeding-timeline__controls">
                <button
                    className="seeding-timeline__play-btn"
                    onClick={onPlayToggle}
                    aria-label={playing ? "Pause" : "Play"}
                >
                    {playing ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="3" y="2" width="4" height="12" rx="1" />
                            <rect x="9" y="2" width="4" height="12" rx="1" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 2.5v11l9-5.5L4 2.5z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
