"use client";

import { useEffect, useRef } from "react";

const STAR_COUNT = 600;

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
}

interface StarfieldProps {
  speed?: number;
}

export function Starfield({ speed = 2 }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let stars: Star[] = [];

    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * devicePixelRatio;
    }

    function initStars() {
      stars = Array.from({ length: STAR_COUNT }, () => {
        const z = Math.random() * canvas!.width;
        return { x: Math.random() * canvas!.width - canvas!.width / 2, y: Math.random() * canvas!.height - canvas!.height / 2, z, pz: z };
      });
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx!.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx!.fillRect(0, 0, w, h);

      for (const star of stars) {
        star.pz = star.z;
        star.z -= speedRef.current * (w / 1000);

        if (star.z <= 0) {
          star.x = Math.random() * w - cx;
          star.y = Math.random() * h - cy;
          star.z = w;
          star.pz = w;
          continue;
        }

        const sx = (star.x / star.z) * cx + cx;
        const sy = (star.y / star.z) * cy + cy;
        const px = (star.x / star.pz) * cx + cx;
        const py = (star.y / star.pz) * cy + cy;

        const size = Math.max(0, (1 - star.z / w) * 2.5);
        const opacity = Math.max(0, 1 - star.z / w);

        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(sx, sy);
        ctx!.strokeStyle = `rgba(200, 210, 255, ${opacity})`;
        ctx!.lineWidth = size;
        ctx!.stroke();
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    initStars();
    draw();

    window.addEventListener("resize", () => {
      resize();
      initStars();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
