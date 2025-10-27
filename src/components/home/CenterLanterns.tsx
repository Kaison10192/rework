// src/components/home/CenterLanterns.tsx
"use client";

import Image from "next/image";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";

/* ===============================================================
   🔆 NEON CONFIG
================================================================ */
const NEON = {
  colorRGB: "255,255,255",
  rim: 4,
  strong: 1,
  soft: 1,
};

function neonFilter(
  colorRGB: string = NEON.colorRGB,
  rim: number = NEON.rim,
  strong: number = NEON.strong,
  soft: number = NEON.soft
) {
  return `
    drop-shadow(0 0 ${Math.max(1, rim)}px rgb(${colorRGB}))
    drop-shadow(0 0 ${Math.max(1, strong)}px rgb(${colorRGB}))
    drop-shadow(0 0 ${Math.max(1, soft)}px rgba(${colorRGB},.45))
  `;
}

/* ===============================================================
   🌀 RING IMAGE
================================================================ */
function RingImage({
  size = 320,
  rotate = 0,
  opacity = 1,
  glow = 0,
  glowColor = "#ffffff",
  glowStrong = 0,
  offsetX = 0,
  offsetY = 0,
  className = "",
}: {
  size?: number;
  rotate?: number;
  opacity?: number;
  glow?: number;
  glowColor?: string;
  glowStrong?: number;
  offsetX?: number;
  offsetY?: number;
  className?: string;
}) {
  const filterStr =
    glow > 0 || glowStrong > 0
      ? `drop-shadow(0 0 ${glow}px ${glowColor}) drop-shadow(0 0 ${glowStrong}px ${glowColor})`
      : neonFilter();

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        transform: `translate(-50%,-50%) translate(${offsetX}px,${offsetY}px) rotate(${rotate}deg)`,
        opacity,
      }}
      aria-hidden
    >
      <Image
        src="/วงแหวน.png"
        alt="ring"
        fill
        sizes={`${size}px`}
        className="object-contain select-none pointer-events-none"
        priority
        style={{ filter: filterStr, mixBlendMode: "screen" }}
      />
    </div>
  );
}

/* ===============================================================
   🏮 CENTER LANTERNS
================================================================ */

export type Tab = "comic" | "novel";
type Vec2 = { x: number; y: number };

type PagerProps = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  arrowOffset?: number;

  arrowSize?: number;
  arrowScaleLeft?: number;
  arrowScaleRight?: number;
  arrowShiftLeft?: Vec2;
  arrowShiftRight?: Vec2;

  ringSize: number;
  ringOffsetX: number;
  ringOffsetY: number;
};

const LABEL_COLOR = "#EEE9DD";
const LABEL_COLOR_ACTIVE = "#FFFFFF";

function LabelWord({
  src,
  width,
  height,
  active,
}: {
  src: string;
  width: number;
  height: number;
  active: boolean;
}) {
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        width,
        height,
        backgroundColor: active ? LABEL_COLOR_ACTIVE : LABEL_COLOR,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        transition: "background-color 200ms ease, filter 200ms ease",
        filter: active ? "brightness(1.04)" : "none",
      }}
    />
  );
}

type Anchor = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

/* ===============================================================
   🔢 Bottom number pager (มือถือ/แท็บเล็ต)
================================================================ */
function buildNumberWindow(
  current: number,
  total: number,
  maxSlots: number
): (number | "…")[] {
  const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n));
  current = clamp(current, 1, total);

  const MIN_CORE = 5;
  const slots = Math.max(MIN_CORE + 4, maxSlots); // +4 สำหรับ 1, …, …, last

  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);

  const last = total;
  const edge = 2;
  const core = slots - 4;

  const leftBound = clamp(
    current - Math.floor(core / 2),
    2,
    Math.max(2, last - core - 1)
  );
  const rightBound = leftBound + core - 1;

  const seq: (number | "…")[] = [1];
  if (leftBound > 2 + edge) seq.push("…");
  for (let p = leftBound; p <= rightBound; p++) seq.push(p);
  if (rightBound < last - 1 - edge) seq.push("…");
  seq.push(last);
  return seq;
}

function BottomNumberPager({
  page,
  total,
  onJump,
  pagerGap = 10,
}: {
  page: number;
  total: number;
  onJump: (p: number) => void;
  pagerGap?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setBp("mobile");
      else if (w < 1024) setBp("tablet");
      else setBp("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setWidth(el.clientWidth));
    obs.observe(el);
    setWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const maxSlots = useMemo(() => {
    if (!width) return 9;
    const approxPerItem = bp === "mobile" ? 60 : bp === "tablet" ? 52 : 44;
    const base = Math.floor(width / approxPerItem);
    return bp === "mobile"
      ? Math.min(base, 7)
      : bp === "tablet"
      ? Math.min(base, 11)
      : Math.max(9, base);
  }, [width, bp]);

  const items = useMemo(
    () => buildNumberWindow(page, total, maxSlots),
    [page, total, maxSlots]
  );
  const fontSize =
    bp === "mobile"
      ? "clamp(26px, 6vw, 40px)"
      : bp === "tablet"
      ? "clamp(20px, 3.6vw, 32px)"
      : "clamp(18px, 2.6vw, 30px)";

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto"
      style={{
        position: "absolute",
        left: "50%",
        top: "100%",
        transform: `translate(-50%, ${bp === "mobile" ? "25px" : "-4px"})`,
        marginTop: pagerGap,
        width: bp === "tablet" ? "90%" : "94%",
        maxWidth: bp === "tablet" ? 740 : undefined,
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center justify-center gap-3 select-none flex-wrap"
        style={{ padding: "6px 8px" }}
      >
        {items.map((it, idx) =>
          it === "…" ? (
            <span key={`dots-${idx}`} className="text-white/80 px-1" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={`p-${it}-${idx}`} 
              onClick={() => onJump(it)}
              className="text-white hover:opacity-100 opacity-95"
              style={{
                padding: bp === "mobile" ? "6px 12px" : "4px 10px",
                lineHeight: 1.1,
                borderBottom:
                  it === page ? "3px solid #ffffff" : "3px solid transparent",
                fontSize,
                borderRadius: 6,
                willChange: "opacity, transform",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
              aria-current={it === page ? "page" : undefined}
              aria-label={`ไปหน้า ${it}`}
              suppressHydrationWarning
            >
              {it}
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* ===============================================================
   Component หลัก
================================================================ */
export default function CenterLanterns({
  /* ——— แท็บ ——— */
  tab,
  onSelect,

  /* ——— วงแหวน ——— */
  ringSize = 320,
  ringRotate = 0,
  ringOpacity = 1,
  ringGlow = 0,
  ringOffsetX = 0,
  ringOffsetY = 0,

  /* ——— Pager ——— */
  page,
  totalPages,
  onPrev,
  onNext,

  /* ——— ลูกศร ——— */
  arrowSize = 230,
  arrowScaleLeft = 1,
  arrowScaleRight = 1,
  arrowShiftLeft = { x: 0, y: -55 },
  arrowShiftRight = { x: 0, y: -55 },
  arrowOffset = 28,

  /* ——— เลขหน้าข้างลูกศร ——— */
  onJump,
  showSidePages = false,
  sideCount = 2,
  sideStep = 140,
  sideY = -6,

  /* ——— วางตำแหน่งชุดตะเกียง ——— */
  anchor = "center",
  x = 50,
  y = 50,
  unit = "%",
  scale = 1,
  z = 10,
  pointer = "auto",
  containerClassName = "",

  /* 📱 มือถือเฉพาะ */
  mobileWrapHeight = 400,
  mobilePackShiftY = -150,
  mobileTopPadding = 0,
  mobilePagerGap = 10,

  /* 📲 แท็บเล็ตเฉพาะ */
  tabletWrapHeight = 560,
  tabletPackShiftY = -30,
  tabletPagerGap = 10,
}: {
  tab: Tab;
  onSelect: (t: Tab) => void;

  ringSize?: number;
  ringRotate?: number;
  ringOpacity?: number;
  ringGlow?: number;
  ringOffsetX?: number;
  ringOffsetY?: number;

  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;

  arrowSize?: number;
  arrowScaleLeft?: number;
  arrowScaleRight?: number;
  arrowShiftLeft?: Vec2;
  arrowShiftRight?: Vec2;
  arrowOffset?: number;

  onJump?: (p: number) => void;
  showSidePages?: boolean;
  sideCount?: number;
  sideStep?: number;
  sideY?: number;

  anchor?: Anchor;
  x?: number;
  y?: number;
  unit?: "%" | "px";
  scale?: number;
  z?: number;
  pointer?: "auto" | "none";
  containerClassName?: string;

  /* mobile props */
  mobileWrapHeight?: number;
  mobilePackShiftY?: number;
  mobileTopPadding?: number;
  mobilePagerGap?: number;

  /* tablet props */
  tabletWrapHeight?: number;
  tabletPackShiftY?: number;
  tabletPagerGap?: number;
}) {
  /* ----------------------------------------------------------------
     📱 Breakpoints
  ---------------------------------------------------------------- */
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 768) setBp("mobile");
      else if (w < 1024) setBp("tablet");
      else setBp("desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  /* ----------------------------------------------------------------
     🎛 Knobs
  ---------------------------------------------------------------- */
  const responsiveScale = isMobile ? 0.72 : 1;
  const RS = isMobile ? Math.min(ringSize, 300) : ringSize;
  const AS = isMobile ? Math.min(arrowSize, 170) : arrowSize;
  const AOFF = isMobile ? Math.max(18, arrowOffset - 6) : arrowOffset;
  const aShiftL: Vec2 = isMobile ? { x: -60, y: -6 } : arrowShiftLeft;
  const aShiftR: Vec2 = isMobile ? { x: 60, y: -6 } : arrowShiftRight;

  const LANTERN_W = isMobile ? 240 : 300;
  const LANTERN_H = Math.round(LANTERN_W * 1.4);

  const COMIC_POS = isMobile
    ? { rot: -20, dx: -140, dy: -36, labelX: 135, labelY: -98, labelS: 1.5 }
    : { rot: -22, dx: -190, dy: -60, labelX: 185, labelY: -120, labelS: 2.3 };

  const NOVEL_POS = isMobile
    ? { rot: 16, dx: 110, dy: 30, labelX: -110, labelY: 110, labelS: 1.32 }
    : { rot: 18, dx: 130, dy: 50, labelX: -130, labelY: 140, labelS: 2.0 };

  // ความกว้าง/สูงของกล่องรวม — แยก tablet แล้ว
  const WRAP_W = isMobile ? 580 : 1200;
  const WRAP_H = isMobile ? mobileWrapHeight : isTablet ? tabletWrapHeight : 800;

  /* 🧭 helper: คำนวณ anchor translate */
  function anchorTranslate(a: Anchor) {
    switch (a) {
      case "center":
        return "translate(-50%, -50%)";
      case "top-left":
        return "translate(0, 0)";
      case "top-right":
        return "translate(-100%, 0)";
      case "bottom-left":
        return "translate(0, -100%)";
      case "bottom-right":
        return "translate(-100%, -100%)";
    }
  }

  /* 🏮 ปุ่มตะเกียง */
  function LanternBtn({
    t,
    rotateDeg,
    dx,
    dy,
    glowX,
    glowY,
    labelOffsetX,
    labelOffsetY,
    labelScale,
  }: {
    t: Tab;
    rotateDeg: number;
    dx: number;
    dy: number;
    glowX: number;
    glowY: number;
    labelOffsetX: number;
    labelOffsetY: number;
    labelScale: number;
  }) {
    const active = tab === t;
    const glowOpacity = useMotionValue(1);
    const groupY = useMotionValue(0);

    useAnimationFrame((tms: number) => {
      const tsec = tms / 1000;
      groupY.set(Math.sin(tsec * 0.8) * 4);
      const base = 0.85 + Math.sin(tsec * 2.2) * 0.08;
      const micro = 0.04 * (Math.sin(tsec * 17.0) * Math.sin(tsec * 13.1));
      glowOpacity.set(active ? base + micro : 0.55);
    });

    return (
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px)`,
        }}
      >
        <motion.button
          type="button"
          onClick={() => onSelect(t)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="relative block"
          aria-label={t === "comic" ? "การ์ตูน" : "นิยาย"}
          style={{
            filter: active ? "brightness(1.3)" : "brightness(0.5) grayscale(0.15)",
          }}
        >
          <motion.div
            style={{ y: groupY, rotate: rotateDeg, transformOrigin: "50% 40%" }}
            className="relative"
          >
            {/* glow ภายในโคมไฟ */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: LANTERN_W * 1.2,
                height: LANTERN_W * 1.2,
                top: glowY - (LANTERN_W * 1.1) / 2,
                left: glowX - (LANTERN_W * 1.1) / 2,
                opacity: glowOpacity,
                filter: "blur(50px)",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.22) 28%, rgba(255,170,0,0.12) 45%, rgba(196,29,29,0) 70%)",
              }}
            />
            <Image
              src="/lantern2.png"
              alt={t === "comic" ? "การ์ตูน" : "นิยาย"}
              width={LANTERN_W}
              height={LANTERN_H}
              className="object-contain pointer-events-none select-none drop-shadow-[0_10px_30px_rgba(0,0,0,.5)]"
              draggable={false}
              priority
            />
          </motion.div>

          {/* ป้ายคำ */}
          <div
            className="absolute z-10"
            style={{
              left: `calc(50% + ${labelOffsetX}px)`,
              top: `calc(50% + ${labelOffsetY}px)`,
              transform: `translate(-50%, -50%) scale(${labelScale})`,
            }}
          >
            <LabelWord
              src={t === "comic" ? "/การ์ตูน.png" : "/นิยาย.png"}
              width={180}
              height={70}
              active={active}
            />
          </div>
        </motion.button>
      </div>
    );
  }

  /* 🎯 ปุ่มลูกศร + เลขกลางวง + เลขข้าง */
  function CenterPager({
    page,
    totalPages,
    onPrev,
    onNext,
    arrowOffset = 28,
    arrowSize = 220,
    arrowScaleLeft = 1,
    arrowScaleRight = 1,
    arrowShiftLeft = { x: 0, y: 0 },
    arrowShiftRight = { x: 0, y: 0 },
    ringSize,
    ringOffsetX,
    ringOffsetY,
  }: PagerProps) {
    // สำคัญ: set mounted ก่อนเพนต์เฟรมแรก ลดแว้บ
    const [mounted, setMounted] = useState(false);
    useLayoutEffect(() => setMounted(true), []);

    function ArrowImgBtn({
      dir = "left",
      sizeBase = 220,
      onClick,
    }: {
      dir?: "left" | "right";
      sizeBase?: number;
      onClick: () => void;
    }) {
      const glow = neonFilter();
      return (
        <motion.button
          type="button"
          onClick={onClick}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          aria-label={dir === "left" ? "ก่อนหน้า" : "ถัดไป"}
          style={{ display: "block", position: "relative", zIndex: 50 }}
        >
          <div
            style={{
              position: "relative",
              width: sizeBase,
              height: sizeBase,
              transform: dir === "left" ? "scaleX(-1)" : "none",
            }}
          >
            <Image
              src="/arrow.png"
              alt=""
              width={sizeBase}
              height={sizeBase}
              unoptimized
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                filter: glow,
                mixBlendMode: "screen",
                opacity: 0.95,
                pointerEvents: "none",
              }}
            />
            <Image
              src="/arrow.png"
              alt={dir === "left" ? "ก่อนหน้า" : "ถัดไป"}
              width={sizeBase}
              height={sizeBase}
              unoptimized
              draggable={false}
              style={{ position: "relative", display: "block", pointerEvents: "none" }}
            />
          </div>
        </motion.button>
      );
    }

    const clamped = Math.max(1, Math.min(totalPages, page));

    const numberStyleCenter: React.CSSProperties = {
      fontSize: isMobile ? 64 : 76,
      color: "#000",
      WebkitTextStroke: isMobile ? "2.2px #fff" : "2.5px #fff",
      textShadow:
        "0 0 10px rgba(255,255,255,.25), 0 0 3px rgba(255,255,255,.25)",
      letterSpacing: 2,
      willChange: "opacity, transform",
      backfaceVisibility: "hidden",
      transform: "translateZ(0)",
    };

    const numberStyleSide: React.CSSProperties = {
      fontSize: isMobile ? 52 : 58,
      color: "#000",
      WebkitTextStroke: isMobile ? "1.8px #fff" : "2px #fff",
      textShadow:
        "0 0 8px rgba(255,255,255,.25), 0 0 3px rgba(255,255,255,.2)",
      letterSpacing: 1,
      willChange: "opacity, transform",
      backfaceVisibility: "hidden",
      transform: "translateZ(0)",
    };

    const shouldShowSides = showSidePages && clamped > 1;
    const leftPages = shouldShowSides
      ? Array.from({ length: sideCount })
          .map((_, i) => clamped - (sideCount - i))
          .filter((p) => p >= 1)
      : [];
    const rightPages = shouldShowSides
      ? Array.from({ length: sideCount })
          .map((_, i) => clamped + (i + 1))
          .filter((p) => p <= totalPages)
      : [];

    const baseLeft =
      -(ringSize / 2 + arrowOffset) + arrowShiftLeft.x - arrowSize * 0.55;
    const baseRight =
      +(ringSize / 2 + arrowOffset) + arrowShiftRight.x + arrowSize * 0.55;

    const makeSideX = (base: number, index: number, dir: "L" | "R") =>
      dir === "L"
        ? base - (index + 1) * sideStep
        : base + (index + 1) * sideStep;

    const SideNumber = ({ p, x }: { p: number; x: number }) => (
      <button
        type="button"
        onClick={() => onJump?.(p)}
        className="absolute z-40 select-none"
        style={{
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translate(${x}px, ${sideY}px)`,
          opacity: mounted ? 1 : 0,
        }}
        title={`ไปหน้า ${p}`}
      >
        <span style={numberStyleSide} suppressHydrationWarning>
          {p}
        </span>
      </button>
    );

    return (
      <>
        {/* เลขตรงกลางวง */}
        <div
          className="absolute z-40 select-none"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${ringOffsetX}px, ${ringOffsetY}px)`,
          }}
        >
          <span
            style={{ ...numberStyleCenter, opacity: mounted ? 1 : 0 }}
            suppressHydrationWarning
          >
            {mounted ? clamped : 1}
          </span>
        </div>

        {/* ลูกศร */}
        <div
          className="absolute z-40"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${
              ringOffsetX - ringSize / 2 - arrowOffset + aShiftL.x
            }px, ${ringOffsetY + aShiftL.y}px)`,
          }}
        >
          <ArrowImgBtn dir="left" sizeBase={AS} onClick={onPrev} />
        </div>

        <div
          className="absolute z-40"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${
              ringOffsetX + ringSize / 2 + arrowOffset + aShiftR.x
            }px, ${ringOffsetY + aShiftR.y}px)`,
          }}
        >
          <ArrowImgBtn dir="right" sizeBase={AS} onClick={onNext} />
        </div>

        {/* เลขหน้าข้างลูกศร */}
        {shouldShowSides && (
          <>
            {leftPages.map((p, idx) => (
              <SideNumber
                key={`SL-${p}`}
                p={p}
                x={makeSideX(baseLeft, leftPages.length - 1 - idx, "L")}
              />
            ))}
            {rightPages.map((p, idx) => (
              <SideNumber key={`SR-${p}`} p={p} x={makeSideX(baseRight, idx, "R")} />
            ))}
          </>
        )}
      </>
    );
  }

  /* ---------------- Layout ---------------- */
  return (
    <div
      className={containerClassName}
      style={{
        position: "absolute",
        left: unit === "%" ? `${x}%` : x,
        top: unit === "%" ? `${y}%` : y,
        transform: `${anchorTranslate(anchor)} scale(${scale * responsiveScale})`,
        transformOrigin: "center",
        zIndex: z,
        pointerEvents: pointer,
      }}
    >
      {/* กล่องรวม */}
      <div
        className="relative"
        style={{ width: WRAP_W, height: WRAP_H, paddingTop: isMobile ? mobileTopPadding : 0 }}
      >
        {/* แพ็กทั้งหมด */}
        <div
          className="absolute inset-0"
          style={{
            transform: isMobile
              ? `translateY(${mobilePackShiftY}px)`
              : isTablet
              ? `translateY(${tabletPackShiftY}px)`
              : undefined,
          }}
        >
          <RingImage
            size={RS}
            rotate={ringRotate}
            opacity={ringOpacity}
            offsetX={ringOffsetX}
            offsetY={ringOffsetY}
          />

          <CenterPager
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            arrowOffset={AOFF}
            arrowSize={AS}
            arrowScaleLeft={1}
            arrowScaleRight={1}
            arrowShiftLeft={aShiftL}
            arrowShiftRight={aShiftR}
            ringSize={RS}
            ringOffsetX={ringOffsetX}
            ringOffsetY={ringOffsetY}
          />

          {/* ปุ่มเลือกแท็บ */}
          <LanternBtn
            t="comic"
            rotateDeg={COMIC_POS.rot}
            dx={COMIC_POS.dx}
            dy={COMIC_POS.dy}
            glowX={LANTERN_W * 0.6}
            glowY={Math.round(LANTERN_H * 0.5)}
            labelOffsetX={COMIC_POS.labelX}
            labelOffsetY={COMIC_POS.labelY}
            labelScale={COMIC_POS.labelS}
          />
          <LanternBtn
            t="novel"
            rotateDeg={NOVEL_POS.rot}
            dx={NOVEL_POS.dx}
            dy={NOVEL_POS.dy}
            glowX={LANTERN_W * 0.6}
            glowY={Math.round(LANTERN_H * 0.5)}
            labelOffsetX={NOVEL_POS.labelX}
            labelOffsetY={NOVEL_POS.labelY}
            labelScale={NOVEL_POS.labelS}
          />

          {/* 🔢 แถบเลขหน้า (มือถือ/แท็บเล็ตเท่านั้น) */}
          {(isMobile || isTablet) && onJump && (
            <BottomNumberPager
              page={page}
              total={totalPages}
              onJump={onJump}
              pagerGap={isMobile ? mobilePagerGap : tabletPagerGap}
            />
          )}
        </div>
      </div>
    </div>
  );
}
