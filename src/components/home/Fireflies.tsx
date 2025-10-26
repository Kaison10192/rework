"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

/** หิ่งห้อยพื้นหลังทั่วหน้า */
export default function Fireflies({
  count = 60,
  seed = 20251019,
  maxSize = 5,
  minSize = 2,
  maxDrift = 140,
  maxRise = 120,
  minDur = 8,
  maxDur = 16,
  opacity = 0.9,

  /** ใหม่: จัดตำแหน่ง/พื้นที่/เลเยอร์/ผสมสี */
  position = "fixed",
  inset = "0 0 0 0",        // CSS shorthand: top right bottom left
  z = 0,
  blend = "screen",         // screen | lighten | normal ...
  pointer = "none",
  className = "",
}: {
  count?: number;
  seed?: number;
  maxSize?: number;
  minSize?: number;
  maxDrift?: number;
  maxRise?: number;
  minDur?: number;
  maxDur?: number;
  opacity?: number;

  position?: "fixed" | "absolute";
  inset?: string;            // เช่น "0 0 0 0" หรือ "80px 0 0 0" เพื่อเว้น Navbar
  z?: number;
  blend?: React.CSSProperties["mixBlendMode"];
  pointer?: "auto" | "none";
  className?: string;
}) {
  function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = useMemo(() => mulberry32(seed), [seed]);

  const bugs = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const x = rnd() * 100;
        const y = rnd() * 100;
        const s = minSize + rnd() * (maxSize - minSize);
        const dx = (rnd() * 2 - 1) * maxDrift;
        const dy = (rnd() * 2 - 1) * maxRise;
        const d = minDur + rnd() * (maxDur - minDur);
        const delay = rnd() * 6;
        const twinkle = 0.4 + rnd() * 0.6;
        return { id: i, x, y, s, dx, dy, d, delay, twinkle };
      }),
    [count, rnd, minSize, maxSize, maxDrift, maxRise, minDur, maxDur]
  );

  // parse inset "t r b l"
  const [t, r, b, l] = inset.split(" ").map((v) => v.trim());

  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{
        position,
        top: t,
        right: r,
        bottom: b,
        left: l,
        zIndex: z,
        pointerEvents: pointer,
      }}
    >
      {bugs.map((bug) => (
        <motion.span
          key={bug.id}
          className="absolute"
          style={{
            left: `${bug.x}%`,
            top: `${bug.y}%`,
            width: bug.s,
            height: bug.s,
            borderRadius: 9999,
            background:
              "radial-gradient(closest-side, rgba(255,255,210,1), rgba(255,255,210,0.0))",
            boxShadow:
              "0 0 6px 2px rgba(255,255,210,.65), 0 0 22px 6px rgba(235,203,139,.35)",
            opacity: 0.0,
            willChange: "transform, opacity",
            mixBlendMode: blend,
            pointerEvents: "none",
          }}
          animate={{
            x: [0, bug.dx * 0.6, -bug.dx, bug.dx * 0.3, 0],
            y: [0, -bug.dy, bug.dy * 0.5, -bug.dy * 0.3, 0],
            opacity: [0, opacity * bug.twinkle, opacity * 0.2, opacity * bug.twinkle, 0],
            scale: [1, 1.25, 0.9, 1.15, 1],
          }}
          transition={{
            duration: bug.d,
            delay: bug.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
