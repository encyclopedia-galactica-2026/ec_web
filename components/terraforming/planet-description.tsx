"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import type { Planet } from "@/lib/db/schema";
import type { TerraformState } from "@/lib/terraforming/types";

function useStreamedText() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (body: Record<string, unknown>) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setText("");
      setLoading(true);

      try {
        const res = await fetch("/api/describe-planet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setLoading(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let result = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          setText(result);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setText("");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setText("");
    setLoading(false);
  }, []);

  return { text, loading, generate, reset };
}

interface PlanetDescriptionProps {
  planet: Planet;
  terraformState: TerraformState;
}

export function PlanetDescription({
  planet,
  terraformState,
}: PlanetDescriptionProps) {
  const current = useStreamedText();
  const terraformed = useStreamedText();

  const terraformedFetchedRef = useRef(false);

  useEffect(() => {
    current.generate({ planet, mode: "current" });
    return () => current.reset();
  }, [planet.plName]);

  useEffect(() => {
    if (terraformState.phase === "completed" && !terraformedFetchedRef.current) {
      terraformedFetchedRef.current = true;
      terraformed.generate({
        planet,
        mode: "terraformed",
        terraformedData: terraformState.combined,
        strategies: terraformState.selected.map((s) => ({
          name: s.name,
          description: s.description,
          estimatedYears: s.estimatedYears,
        })),
      });
    }
  }, [terraformState.phase]);

  return (
    <>
      <div className="mt-3 rounded-xl border border-white/10 bg-black/60 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-violet-400" />
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">
            AI Planet Analysis
          </p>
        </div>
        <div className="mt-2 text-xs leading-relaxed text-white/60">
          {current.loading && !current.text ? (
            <div className="flex items-center gap-2 text-white/30">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing planet...
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{current.text}</p>
          )}
        </div>
      </div>

      {(terraformState.phase === "completed" || terraformed.text) && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-black/60 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-400/50">
              Post-Terraform Analysis
            </p>
          </div>
          <div className="mt-2 text-xs leading-relaxed text-white/60">
            {terraformed.loading && !terraformed.text ? (
              <div className="flex items-center gap-2 text-white/30">
                <Loader2 className="h-3 w-3 animate-spin" />
                Projecting terraformed conditions...
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{terraformed.text}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
