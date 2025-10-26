// src/app/page.tsx
"use client";

import TopPopular from "@/components/home/TopPopular";
import TopNew from "@/components/home/TopNew";
import CatalogWithLanterns from "@/components/home/CatalogWithLanterns";
import Fireflies from "@/components/home/Fireflies"; // ✅ เพิ่ม import

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-background text-text pt-16 overflow-hidden">
      {/* ✅ หิ่งห้อยพื้นหลังเฉพาะหน้านี้ */}
      <Fireflies
        position="absolute"
        inset="0 0 0 0"  // ครอบเต็มหน้าจอ
        z={0}            // อยู่ใต้เนื้อหา
        blend="screen"
        count={60}
        opacity={0.9}
        className="pointer-events-none"
      />

      {/* ✅ เนื้อหาหน้า Home */}
      <div className="relative z-10">
        <TopPopular />
        <TopNew />
        <CatalogWithLanterns />
      </div>
    </main>
  );
}
