// src/components/home/CatalogWithLanterns.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import CenterLanterns, { Tab } from "@/components/home/CenterLanterns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/* ---------- utils (mock + helper) ---------- */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Item = {
  id: string | number;
  title: string;
  cover_url: string;
  // optional fields (บางอันจากฐานยังไม่มี แสดง placeholder ไปก่อน)
  author?: string;
  rating?: number;
  country?: string;
  views?: string;
  chapters?: number;       // ใช้ chapterNumber จาก API
  updated?: string;        // ใช้ lastReleaseAt จาก API
};

const PER_PAGE = 24;
const DEFAULT_TOTAL_PAGES = 120; // ใช้ก่อนรู้จำนวนจริง
const WARP_OFFSET = 340;

/* ---------- mock data (ใช้เป็น fallback เมื่อ API ล้มเหลว) ---------- */
function makeMock(tab: Tab, page: number, perPage: number): Item[] {
  return Array.from({ length: perPage }).map((_, i) => {
    const n = (page - 1) * perPage + i + 1;
    const seed = hashString(`${tab}-${page}-${n}`);
    const rnd = mulberry32(seed);
    return {
      id: `${tab}-${n}`,
      title: tab === "comic" ? `การ์ตูนตัวอย่าง #${n}` : `นิยายตัวอย่าง #${n}`,
      author: tab === "comic" ? "สตูดิโอ X" : "นักเขียน Y",
      cover_url: `https://picsum.photos/seed/${tab}-${n}/600/800`,
      rating: Math.round((rnd() * 2 + 3) * 10) / 10,
      country: "KR",
      views: `${(rnd() * 8 + 0.7).toFixed(1)}k`,
      chapters: Math.floor(rnd() * 80) + 10,
      updated: `${Math.floor(rnd() * 24)} ชั่วโมงที่แล้ว`,
    };
  });
}

/* ---------- หา scroll container ---------- */
function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  if (!node) return window;
  let el: HTMLElement | null = node;
  while (el && el.parentElement) {
    const style = getComputedStyle(el);
    const oy = style.overflowY;
    if (/(auto|scroll|overlay)/.test(oy) && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  const se = document.scrollingElement as HTMLElement | null;
  return se ?? window;
}

/* =========================
   Main Component
========================= */
export default function CatalogWithLanterns() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>(() => {
    const tFromUrl = (searchParams?.get("tab") || "").toLowerCase();
    if (tFromUrl === "comic" || tFromUrl === "novel") return tFromUrl as Tab;
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("takiang_tab");
      if (t === "comic" || t === "novel") return t as Tab;
    }
    return "comic";
  });

  const [page, setPage] = useState<number>(() => {
    const pFromUrl = Number(searchParams?.get("page") || NaN);
    if (Number.isFinite(pFromUrl)) {
      const clamped = Math.max(1, Math.min(DEFAULT_TOTAL_PAGES, Math.floor(pFromUrl)));
      if (clamped) return clamped;
    }
    if (typeof window !== "undefined") {
      const pStr = localStorage.getItem("takiang_page");
      const p = pStr ? Number(pStr) : NaN;
      if (Number.isFinite(p)) {
        const clamped = Math.max(1, Math.min(DEFAULT_TOTAL_PAGES, Math.floor(p)));
        if (clamped) return clamped;
      }
    }
    return 1;
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const warpNext = useRef(false);

  /* ---------- ข้อมูลจริง + จำนวนทั้งหมดแยกตามแท็บ ---------- */
  const [itemsComic, setItemsComic] = useState<Item[]>([]);
  const [itemsNovel, setItemsNovel] = useState<Item[]>([]);
  const [totalComic, setTotalComic] = useState<number | null>(null);
  const [totalNovel, setTotalNovel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const TOTAL_PAGES =
    tab === "comic"
      ? Math.max(1, Math.ceil((totalComic ?? PER_PAGE) / PER_PAGE))
      : Math.max(1, Math.ceil((totalNovel ?? PER_PAGE) / PER_PAGE));

  /* ---------- ดึงข้อมูลจาก API ทุกครั้งที่ tab/page เปลี่ยน ---------- */
  useEffect(() => {
  let abort = false;
  async function run() {
    setLoading(true);
    try {
      console.log("[Catalog] fetch", { tab, page, perPage: PER_PAGE });
      const res = await fetch(`/api/updates?kind=${tab}&page=${page}&perPage=${PER_PAGE}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`bad response: ${res.status}`);
      const json = await res.json();
      console.log("[Catalog] ok", { tab, page, total: json?.total, len: json?.items?.length, sample: json?.items?.[0] });

      const rows: Item[] = (json.items || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        cover_url: r.cover,
        chapters: r.chapterNumber ?? undefined,
        updated: r.lastReleaseAt ?? undefined,
      }));

      if (abort) return;
      if (tab === "comic") {
        setItemsComic(rows);
        setTotalComic(json.total ?? rows.length);
      } else {
        setItemsNovel(rows);
        setTotalNovel(json.total ?? rows.length);
      }
    } catch (err) {
      console.error("[Catalog] fetch error", { tab, page, err });
      // fallback mock
      const mock = makeMock(tab, page, PER_PAGE);
      if (abort) return;
      if (tab === "comic") {
        setItemsComic(mock);
        setTotalComic(DEFAULT_TOTAL_PAGES * PER_PAGE);
      } else {
        setItemsNovel(mock);
        setTotalNovel(DEFAULT_TOTAL_PAGES * PER_PAGE);
      }
    } finally {
      if (!abort) setLoading(false);
    }
  }
  run();
  return () => { abort = true; };
}, [tab, page]);


  /* ---------- warp สกรอลล์ขึ้น ---------- */
  function warpToTop(_label = "effect", retry = 0) {
    const anchor = gridRef.current;
    if (!anchor) return;

    const scroller = getScrollParent(anchor);
    const scrollerRect =
      scroller instanceof Window ? { top: 0 } : (scroller as HTMLElement).getBoundingClientRect();

    const anchorRect = anchor.getBoundingClientRect();
    const distanceFromScrollerTop =
      anchorRect.top - (scroller instanceof Window ? 0 : scrollerRect.top);
    const currentScrollTop =
      scroller instanceof Window ? window.scrollY : (scroller as HTMLElement).scrollTop;
    const target = currentScrollTop + distanceFromScrollerTop - WARP_OFFSET;

    if (Math.abs(distanceFromScrollerTop) < 10 && retry < 8) {
      setTimeout(() => warpToTop("effect", retry + 1), 80);
      return;
    }

    if (scroller instanceof Window) {
      window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    } else {
      (scroller as HTMLElement).scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }
  }
  const forceWarpSoon = () => {
    requestAnimationFrame(() => setTimeout(() => warpToTop("force"), 60));
  };
  useEffect(() => {
    if (warpNext.current) {
      warpNext.current = false;
      requestAnimationFrame(() => setTimeout(() => warpToTop("effect"), 60));
    }
  }, [page]);

  /* ---------- sync URL + localStorage ---------- */
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString());
    let changed = false;
    if (sp.get("tab") !== tab) {
      sp.set("tab", tab);
      changed = true;
    }
    if (sp.get("page") !== String(page)) {
      sp.set("page", String(page));
      changed = true;
    }
    if (changed) router.replace(`${pathname}?${sp.toString()}`, { scroll: false });

    try {
      localStorage.setItem("takiang_tab", tab);
      localStorage.setItem("takiang_page", String(page));
    } catch {}
  }, [tab, page, router, pathname]);

  /* ---------- เลือกรายการที่จะแสดง ---------- */
  const items = useMemo(() => {
    const base = tab === "comic" ? itemsComic : itemsNovel;
    // ถ้ายังโหลดครั้งแรกไม่ทัน ให้ใส่ mock กันหน้าว่าง
    if (!loading && base.length === 0) return makeMock(tab, page, PER_PAGE);
    return base;
  }, [tab, page, itemsComic, itemsNovel, loading]);

  const goPrevBottom = () => {
    if (page > 1) {
      warpNext.current = true;
      setPage((p) => p - 1);
      forceWarpSoon();
    }
  };
  const goNextBottom = () => {
    if (page < TOTAL_PAGES) {
      warpNext.current = true;
      setPage((p) => p + 1);
      forceWarpSoon();
    }
  };
  const jumpBottom = (p: number) => {
    warpNext.current = true;
    setPage(p);
    forceWarpSoon();
  };

  return (
    <section className="relative w-full">
      {/* ===== ตะเกียงบน ===== */}
      <div className="relative mx-auto max-w-[1320px] overflow-visible h-[340px] sm:h-[500px] md:h-[600px]">
        <CenterLanterns
          tab={tab}
          onSelect={(t) => {
            setTab(t);
            warpNext.current = true;
            setPage(1);
            forceWarpSoon();
          }}
          page={page}
          totalPages={TOTAL_PAGES}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
          onJump={(p) => setPage(p)}
          showSidePages
          sideCount={2}
          anchor="center"
          x={50}
          y={60}
          unit="%"
          scale={0.76}
          z={10}
          pointer="auto"
          containerClassName="mx-auto"
          ringSize={420}
          ringRotate={0}
          ringOpacity={1}
          ringGlow={0}
          ringOffsetX={0}
          ringOffsetY={0}
          arrowSize={200}
          arrowOffset={34}
          arrowScaleLeft={1}
          arrowScaleRight={1}
          arrowShiftLeft={{ x: -70, y: -28 }}
          arrowShiftRight={{ x: 70, y: -28 }}
          // มือถือ
          mobileWrapHeight={320}
          mobilePackShiftY={-20}
          mobilePagerGap={6}
          // แท็บเล็ต
          tabletWrapHeight={560}
          tabletPackShiftY={-30}
          tabletPagerGap={10}
        />
      </div>

      {/* ===== กริด ===== */}
      <div ref={gridRef} className="mx-auto max-w-[1320px] px-4 sm:px-5 -mt-4 sm:-mt-2 md:mt-0">
        <div className="mt-6 sm:mt-3 mb-3 sm:mb-5 flex items-center justify-between">
          <h2 className="text-[30px] sm:text-[25px] md:text-[50px] font-semibold tracking-wide font-heading">
            {tab === "comic" ? "การ์ตูน" : "นิยาย"}อัพเดทล่าสุด
          </h2>
        </div>

        <motion.div
          key={`${tab}-${page}-${items.length}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4 lg:gap-6"
        >
          {items.map((it) => (
            <DetailCard key={it.id} it={it} tab={tab} />
          ))}
        </motion.div>
      </div>

      {/* ===== ตะเกียงล่าง ===== */}
      <div
        className="
          relative mx-auto max-w-[1320px] mt-10 mb-8
          h-[380px] sm:h-[400px] md:h-[520px]
          overflow-visible md:overflow-hidden lg:overflow-visible
        "
      >
        <CenterLanterns
          tab={tab}
          onSelect={(t) => {
            setTab(t);
            warpNext.current = true;
            setPage(1);
            forceWarpSoon();
          }}
          page={page}
          totalPages={TOTAL_PAGES}
          onPrev={goPrevBottom}
          onNext={goNextBottom}
          onJump={jumpBottom}
          showSidePages
          sideCount={2}
          anchor="center"
          x={50}
          y={40}
          unit="%"
          scale={0.76}
          z={10}
          pointer="auto"
          containerClassName="mx-auto"
          ringSize={420}
          ringRotate={0}
          ringOpacity={1}
          ringGlow={0}
          ringOffsetX={0}
          ringOffsetY={0}
          arrowSize={200}
          arrowOffset={34}
          arrowScaleLeft={1}
          arrowScaleRight={1}
          arrowShiftLeft={{ x: -70, y: -28 }}
          arrowShiftRight={{ x: 70, y: -28 }}
          sideStep={120}
        />
      </div>
    </section>
  );
}

/* =========================
   ⭐ Star
========================= */
function Star({ rating = 4.2, uid }: { rating?: number; uid: string }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const arr = Array.from({ length: 5 }).map((_, i) => {
    if (i < full) return "full";
    if (i === full && half) return "half";
    return "empty";
  });
  return (
    <span className="inline-flex items-center text-[#e5e5e5]">
      {arr.map((t, i) => (
        <svg key={i} viewBox="0 0 24 24" className="mr-[2px] w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px]">
          {t === "full" && (
            <path
              d="M12 2l3.09 6.36 7.01 1.02-5.05 4.92 1.19 6.94L12 18.77 5.76 21.24l1.19-6.94L1.9 9.38l7.01-1.02L12 2z"
              fill="#e5e5e5"
            />
          )}
          {t === "half" && (
            <>
              <defs>
                <linearGradient id={`g-${uid}-${i}`} x1="0" x2="1">
                  <stop offset="50%" stopColor="#e5e5e5" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M12 2l3.09 6.36 7.01 1.02-5.05 4.92 1.19 6.94L12 18.77 5.76 21.24l1.19-6.94L1.9 9.38l7.01-1.02L12 2z"
                fill={`url(#g-${uid}-${i})`}
                stroke="#e5e5e5"
              />
            </>
          )}
          {t === "empty" && (
            <path d="M12 2l3.09 6.36 7.01 1.02-5.05 4.92 1.19 6.94L12 18.77 5.76 21.24l1.19-6.94L1.9 9.38l7.01-1.02L12 2z" fill="none" stroke="#e5e5e5" />
          )}
        </svg>
      ))}
      <span className="ml-1 text-[#cfcfcf] text-[10px] sm:text-[11px] md:text-[12px]">{rating.toFixed(1)}</span>
    </span>
  );
}

/* =========================
   🔖 บุ๊คมาร์ก
========================= */
function LanternBookmarkButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label="บุ๊คมาร์ก"
      className={`
        absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 grid place-items-center
        w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] md:w-8 md:h-8
        rounded-full border border-white/20 bg-black/30 backdrop-blur-sm
        hover:bg-white/10 transition-all duration-150
        ${active ? "text-white" : "text-white/80"}
      `}
    >
      {active ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2a2 2 0 0 0-2 2v18l8-5 8 5V4a2 2 0 0 0-2-2H6z" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}

/* =========================
   ➕ ปุ่มติดตาม
========================= */
function FollowButton({
  following,
  onToggle,
}: {
  following: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={following ? "กำลังติดตาม" : "ติดตาม"}
      className={`
        ml-1.5 sm:ml-2 inline-grid place-items-center
        h-[15px] w-[15px] sm:h-[16px] sm:w-[16px] md:h-[20px] md:w-[20px]
        rounded-full transition-colors duration-150
        ${following ? "bg-white text-black border border-white/0" : "bg-transparent text-white/85 border border-white/25 hover:bg-white/10"}
      `}
    >
      {following ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M16 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
          <circle cx="10" cy="7" r="3" />
          <path d="M19 8v6" />
          <path d="M22 11h-6" />
        </svg>
      )}
    </button>
  );
}

/* =========================
   🎗️ ริบบิ้นมุมซ้ายบน
========================= */
type RibbonSpec = {
  box: number;
  labelWidth: number;
  font: number;
  padX: number;
  padY: number;
  offsetLeft: number;
  offsetTop: number;
};

function RibbonCore({
  label,
  bgClass,
  textClass,
  spec,
}: {
  label: string;
  bgClass: string;
  textClass: string;
  spec: RibbonSpec;
}) {
  const { box, labelWidth, font, padX, padY, offsetLeft, offsetTop } = spec;
  return (
    <div className="absolute left-0 top-0 z-30 pointer-events-none overflow-hidden" style={{ width: box, height: box }}>
      <div className="absolute rotate-[-45deg]" style={{ left: offsetLeft, top: offsetTop }}>
        <div
          className={`${bgClass} ${textClass} rounded-[3px] shadow-sm shadow-black/30 font-semibold tracking-wide text-center`}
          style={{ width: labelWidth, fontSize: font, padding: `${padY}px ${padX}px` }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function RibbonBadge({
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

  const mobileDefault: RibbonSpec = { box: 88, labelWidth: 92, font: 10, padX: 12, padY: 2, offsetLeft: -28, offsetTop: 10 };
  const tabletDefault: RibbonSpec = { box: 100, labelWidth: 104, font: 15, padX: 14, padY: 3, offsetLeft: -32, offsetTop: 10 };
  const desktopDefault: RibbonSpec = { box: 112, labelWidth: 116, font: 12, padX: 16, padY: 3, offsetLeft: -35, offsetTop: 10 };

  const m = { ...mobileDefault, ...(sizes?.mobile || {}) } as RibbonSpec;
  const t = { ...tabletDefault, ...(sizes?.tablet || {}) } as RibbonSpec;
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

/* =========================
   📘 การ์ดหลัก (desktop compact)
========================= */
function DetailCard({ it, tab }: { it: Item; tab: Tab }) {
  const last = Math.max(1, it.chapters ?? 1);
  const recents = [last, Math.max(1, last - 1), Math.max(1, last - 2)];
  const agoList = ["1 ชั่วโมงที่แล้ว", "7 วันก่อน", "7 วันก่อน"];

  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);

  return (
    <article
      className="
        group relative overflow-hidden
        w-full rounded-2xl border border-white/10
        bg-white/[0.03] hover:bg-white/[0.05] transition-colors duration-150
        p-2 sm:p-2.5 md:p-3 lg:p-2.5
      "
    >
      {/* ริบบิ้นบนการ์ด */}
      <RibbonBadge tab={tab} />

      {/* ปุ่มบุ๊คมาร์ก */}
      <LanternBookmarkButton active={bookmarked} onToggle={() => setBookmarked((v) => !v)} />

      <div className="flex items-stretch gap-2 sm:gap-2.5 md:gap-3.5 lg:gap-3">
        {/* รูปปก */}
        <div
          className="
            relative shrink-0
            w-[104px] h-[156px]
            sm:w-[132px] sm:h-[198px]
            md:w-[148px] md:h-[210px]
            lg:w-[140px] lg:h-[200px]
            overflow-hidden rounded-xl border border-white/15
          "
        >
          <img src={it.cover_url} alt={it.title} className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02]" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none" />
        </div>

        {/* ขวา */}
        <div className="flex-1 min-w-0 flex flex-col gap-2 sm:gap-2.5 lg:gap-2">
          <div
            className="
              rounded-xl border border-white/10
              bg-neutral-800/80 backdrop-blur-[1px]
              p-2 sm:p-2.5 md:p-3 lg:p-3
              pr-6 sm:pr-8 md:pr-10 lg:pr-9
              h-[90px] sm:h-[110px] md:h-[110px] lg:h-[110px]
              flex flex-col justify-between
            "
          >
            {/* ชื่อเรื่อง */}
            <div className="space-y-[2px] sm:space-y-1 md:space-y-1.5 lg:space-y-1">
              <h3
                className="
                  text-[12.5px] sm:text-[14px] md:text-[16px] lg:text-[16px]
                  font-semibold leading-tight
                  whitespace-nowrap overflow-hidden text-ellipsis
                "
                title={it.title}
              >
                {it.title}
              </h3>
            </div>

            {/* ผู้แต่ง + ปุ่มติดตาม (ฐานยังไม่มีผู้แต่ง ใช้ placeholder) */}
            <div
              className="
                mt-1 sm:mt-1.5
                flex items-center
                text-[11px] sm:text-[12.5px] md:text-[14px] lg:text-[13.5px]
                text-white/85 leading-tight
              "
            >
              <span className="mr-1 shrink-0">ผู้แต่ง:</span>
              <span className="text-white font-medium truncate">{it.author ?? "—"}</span>
              <FollowButton following={following} onToggle={() => setFollowing((v) => !v)} />
            </div>

            {/* ดาว / ตอน / วิว (วิว/เรตติ้งยังเป็น placeholder) */}
            <div
              className="
                flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-2.5
                text-[11px] sm:text-[12.5px] md:text-[14px] lg:text-[13px]
                leading-tight
              "
            >
              <span className="flex items-center">
                <Star rating={it.rating ?? 4.2} uid={String(it.id)} />
              </span>
              <div className="h-[9px] w-px bg-white/15" />
              <span className="text-white/80 whitespace-nowrap">ตอน {it.chapters ?? "-"}</span>
              <div className="h-[9px] w-px bg-white/15" />
              <span className="text-white/80 whitespace-nowrap">{it.views ?? "—"} วิว</span>
            </div>
          </div>

          {/* ตอนล่าสุด */}
          <div className="flex flex-col">
            <div className="h-px bg-white/10 mb-[4px] sm:mb-[5px]" />
            <ul className="space-y-[5px] sm:space-y-[7px] md:space-y-[10px] lg:space-y-[12px]">
              {recents.map((ch, idx) => (
  <li key={`${it.id}-${ch}-${idx}`} className="flex items-center justify-between leading-tight">

                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[12px] md:text-[13px] lg:text-[12.5px]">
                    <span>
                      ตอนที่ <span className="font-semibold">{ch}</span>
                    </span>
                    <span className="text-white/80" aria-hidden>
                      🪙
                    </span>
                  </div>
                  <span className="text-[10.5px] sm:text-[12px] md:text-[13px] lg:text-[12.5px] text-white/65 whitespace-nowrap">
                    {it.updated ?? ["1 ชั่วโมงที่แล้ว", "7 วันก่อน", "7 วันก่อน"][idx]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
