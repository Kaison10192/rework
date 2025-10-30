// src/components/common/RibbonBadge.tsx
"use client";

import React from "react";
import type { Tab } from "@/components/home/CenterLanterns";

type RibbonSpec = {
  box: number;        // กล่องคลิป
  labelWidth: number; // ความกว้างป้าย
  font: number;       // ขนาดตัวอักษร
  padX: number; padY: number;
  offsetLeft: number; offsetTop: number;
};

function RibbonCore({
  label, bgClass, textClass, spec,
}: { label: string; bgClass: string; textClass: string; spec: RibbonSpec }) {
  const { box, labelWidth, font, padX, padY, offsetLeft, offsetTop } = spec;
  return (
    <div className="absolute left-0 top-0 z-30 pointer-events-none overflow-hidden"
         style={{ width: box, height: box }}>
      <div className="absolute rotate-[-45deg]" style={{ left: offsetLeft, top: offsetTop }}>
        <div className={`${bgClass} ${textClass} rounded-[3px] shadow-sm shadow-black/30
                         font-semibold tracking-wide text-center`}
             style={{ width: labelWidth, fontSize: font, padding: `${padY}px ${padX}px` }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function RibbonBadge({
  tab,
  sizes,
}: {
  tab: Tab;
  sizes?: {
    mobile?: Partial<RibbonSpec>;
    tablet?: Partial<RibbonSpec>;
    desktop?: Partial<RibbonSpec>;
  };
}) {
  const label = tab === "comic" ? "การ์ตูน" : "นิยาย";
  const bgClass = tab === "comic" ? "bg-white" : "bg-amber-100";
  const textClass = "text-black";

  // ค่า default (ยกมาจากหน้าอัปเดต)
  const mobileDefault: RibbonSpec  = { box: 88,  labelWidth: 92,  font: 10, padX: 12, padY: 2, offsetLeft: -28, offsetTop: 10 };
  const tabletDefault: RibbonSpec  = { box: 100, labelWidth: 104, font: 15, padX: 14, padY: 3, offsetLeft: -32, offsetTop: 10 };
  const desktopDefault: RibbonSpec = { box: 112, labelWidth: 116, font: 12, padX: 16, padY: 3, offsetLeft: -35, offsetTop: 10 };

  const m = { ...mobileDefault,  ...(sizes?.mobile  || {}) } as RibbonSpec;
  const t = { ...tabletDefault,  ...(sizes?.tablet  || {}) } as RibbonSpec;
  const d = { ...desktopDefault, ...(sizes?.desktop || {}) } as RibbonSpec;

  return (
    <>
      <div className="block md:hidden">
        <RibbonCore label={label} bgClass={bgClass} textClass={textClass} spec={m} />
      </div>
      <div className="hidden md:block lg:hidden">
        <RibbonCore label={label} bgClass={bgClass} textClass={textClass} spec={t} />
      </div>
      <div className="hidden lg:block">
        <RibbonCore label={label} bgClass={bgClass} textClass={textClass} spec={d} />
      </div>
    </>
  );
}
