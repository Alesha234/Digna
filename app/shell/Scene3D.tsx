"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type SceneKind = "orb" | "waves" | "particles" | "rings" | "globe" | "shapes";

/** Whether this device can draw 3D at all. */
function canDraw3d(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2") ?? document.createElement("canvas").getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

export default function Scene3D({ kind, accent, second, style }: { kind: SceneKind; accent: string; second: string; style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canDraw3d()) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const light = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches || ((navigator as { deviceMemory?: number }).deviceMemory ?? 8) < 4;
    let stop: (() => void) | undefined;
    let gone = false;
    Promise.all([import("three"), import("./start-scene")])
      .then(([THREE, m]) => {
        if (gone) return;
        stop = m.startScene(THREE, canvas, { kind, accent, second, still, light }).stop;
        setDrawn(true);
      })
      .catch(() => {});
    return () => {
      gone = true;
      stop?.();
      setDrawn(false);
    };
  }, [kind, accent, second]);
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: drawn ? undefined : `radial-gradient(circle at 68% 42%, ${accent}66, transparent 58%), radial-gradient(circle at 30% 72%, ${second}55, transparent 55%)`, ...style }}>
      <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
