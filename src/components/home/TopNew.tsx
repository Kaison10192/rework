// src/components/home/TopNew.tsx
"use client";
import RibbonBadge from "@/components/home/RibbonBadge";

import { useMemo, useRef, useState, useEffect, CSSProperties } from "react";

/* ============ ปรับตำแหน่งง่าย ๆ ตรงนี้ (desktop) ============ */
const UI_POS = {
  heading: { top: -87, left: 140 },   // "10 อันดับมาแรง"
  tabs:    { top: -70, left: 400 },   // ปุ่มสลับ การ์ตูน/นิยาย
  viewAll: { top: -45, left: 1180 },  // "ดูทั้งหมด »"
};
/* ==================================================== */

// แนะนำ: import Item จาก TopPopular ถ้าต้องการใช้ร่วมกัน
export type Item = { id: string; title: string; cover: string };

/* ---------------- ปุ่มมังงะ/นิยาย (ขึ้นสีตามทรง polygon) ---------------- */
function MangaNovelButtons({
  value,
  onChange,
  className = "",
  style,
}: {
  value: "comic" | "novel";
  onChange: (v: "comic" | "novel") => void;
  className?: string;
  style?: CSSProperties;
}) {
  const isComic = value === "comic";
  return (
    <div className={`glitch-tabs ${className ?? ""}`} style={style}>
      <div className="container">
        {/* การ์ตูน */}
        <div className="radio-wrapper">
          <input
            type="radio"
            name="mn-tabs-tn"
            className="input"
            checked={isComic}
            onChange={() => onChange("comic")}
            aria-label="เลือกการ์ตูน"
          />
          <div className="btn" data-active={isComic ? "true" : "false"}>การ์ตูน</div>
        </div>
        {/* นิยาย */}
        <div className="radio-wrapper">
          <input
            type="radio"
            name="mn-tabs-tn"
            className="input"
            checked={!isComic}
            onChange={() => onChange("novel")}
            aria-label="เลือกนิยาย"
          />
          <div className="btn" data-active={!isComic ? "true" : "false"}>นิยาย</div>
        </div>
      </div>

      {/* lock active สีตาม state */}
      <style jsx>{`
        .glitch-tabs .btn {
          transition: background-color .15s ease, color .15s ease, box-shadow .15s ease, transform .08s ease;
        }
        .glitch-tabs .btn[data-active="true"] {
          --primary: #868686ff;
          --shadow-primary: #ffffffff;
          color: #ffffff;
        }
        .glitch-tabs .input:checked + .btn {
          --primary: #868686ff;
          --shadow-primary: #ffffffff;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}

/* ---------------- Page Grid (desktop) ---------------- */
const PAGE_SIZE = 5;
const SLIDE_MS = 400;

function PageGridDesktop({
  items,
  baseIndex,
  tab,
  onItemClick,
}: {
  items: Item[];
  baseIndex: number;
  tab: "comic" | "novel";
  onItemClick?: (item: Item, index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-6 w-full overflow-visible pl-[18px] pr-[18px]">
      {items.map((it, idx) => {
        const rank = baseIndex + idx + 1;
        return (
          <article
            key={it.id}
            className="relative select-none overflow-visible pb-12"
            onClick={() => onItemClick?.(it, rank - 1)}
          >
            <div className="relative rounded-xl overflow-hidden w-full h-[320px] bg-white/5">
            <RibbonBadge tab={tab} />
              <img src={it.cover} alt={it.title} className="w-full h-full object-cover" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px] bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* ลำดับ */}
            <div
              className="pointer-events-none absolute left-[-15px] bottom-[90px] z-20 font-extrabold"
              style={{
                fontSize: "72px",
                lineHeight: 1,
                color: "#000",
                WebkitTextStroke: "4px #fff",
                textShadow: "0 2px 6px rgba(0,0,0,.25)",
              }}
            >
              {rank}
            </div>

            <h3 className="mt-4 text-[16px] font-medium line-clamp-2">{it.title}</h3>
            <div className="mt-1 text-[13px] text-white/60">
              {tab === "comic" ? "โรแมนซ์แฟนตาซี" : "ดราม่า"}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ---------------- แถวสไลด์ (มือถือ/แท็บเลต) ---------------- */
function RowScrollStrip({
  items,
  tab,
  size = "mobile", // "mobile" | "tablet"
  onItemClick,
}: {
  items: Item[];
  tab: "comic" | "novel";
  size?: "mobile" | "tablet";
  onItemClick?: (item: Item, index: number) => void;
}) {
  const cardW = size === "tablet" ? 176 : 156;
  const cardH = size === "tablet" ? 252 : 224;
  const titleText = size === "tablet" ? "text-[13px]" : "text-[12px]";
  const genreText = size === "tablet" ? "text-[11px]" : "text-[10px]";

  return (
    <>
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-3 -mx-3 no-scrollbar"
        style={{ scrollPaddingLeft: 12, scrollPaddingRight: 12 }}
      >
        {items.map((it, idx) => (
          <article
            key={it.id}
            className="snap-start shrink-0"
            style={{ width: cardW }}
            onClick={() => onItemClick?.(it, idx)}
          >
            <div
              className="relative rounded-xl overflow-hidden bg-white/5"
              style={{ width: cardW, height: cardH }}
            >
              <RibbonBadge
    tab={tab}
    sizes={{
      mobile:  { box: 66, labelWidth: 72, font: 9,  padX: 10, padY: 2, offsetLeft: -22, offsetTop: 8 },
      tablet:  { box: 74, labelWidth: 80, font: 10, padX: 11, padY: 2, offsetLeft: -24, offsetTop: 8 },
      desktop: { box: 74, labelWidth: 80, font: 10, padX: 11, padY: 2, offsetLeft: -24, offsetTop: 8 },
    }}
  />
              <img src={it.cover} alt={it.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 h-[48px] bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className="absolute left-1 bottom-1 text-white/95 font-bold text-[18px] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]">
                #{idx + 1}
              </div>
            </div>
            <h3 className={`mt-2 ${titleText} font-medium line-clamp-2`}>{it.title}</h3>
            <div className={`mt-0.5 ${genreText} text-white/60`}>
              {tab === "comic" ? "โรแมนซ์แฟนตาซี" : "ดราม่า"}
            </div>
          </article>
        ))}
      </div>

      <style jsx>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}

/* ---------------- Main ---------------- */
export type TopNewProps = {
  itemsComic?: Item[];
  itemsNovel?: Item[];
  initialItems?: Item[];       // <<< เพิ่ม
  initialTab?: "comic" | "novel";
  viewAllHref?: string;
  onItemClick?: (item: Item, index: number) => void;
};


export default function TopNew({
  itemsComic,
  itemsNovel,
  initialItems,                // <<< เพิ่ม
  initialTab = "comic",
  viewAllHref = "/popular",
  onItemClick,
}: TopNewProps) {

  const [tab, setTab] = useState<"comic" | "novel">(initialTab);
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const [offsetPx, setOffsetPx] = useState(0);
  const [targetPage, setTargetPage] = useState<number | null>(null);
  const [pendingTab, setPendingTab] = useState<"comic" | "novel" | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fixedWidth = useRef<number | null>(null);

const data = useMemo(() => {
  // โหมดลิสต์เดียว: ถ้ามี initialItems (จากเบส) ให้ใช้เลย
  if (initialItems?.length) return initialItems;

  // โหมดสองแท็บ: ใช้เฉพาะข้อมูลจากเบสตามแท็บ
  return tab === "comic" ? (itemsComic ?? []) : (itemsNovel ?? []);
}, [tab, initialItems, itemsComic, itemsNovel]);


  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const currItems = data.slice(start, start + PAGE_SIZE);
  const prevItems = data.slice(Math.max(0, page - 1) * PAGE_SIZE, Math.max(0, page - 1) * PAGE_SIZE + PAGE_SIZE);
  const nextItems = data.slice(Math.min(totalPages - 1, page + 1) * PAGE_SIZE, Math.min(totalPages - 1, page + 1) * PAGE_SIZE + PAGE_SIZE);

  const doSlide = (toPage: number) => {
    if (animating || toPage === page) return;
    const forward = toPage > page;
    const vp = viewportRef.current?.clientWidth ?? 0;
    fixedWidth.current = vp;
    setDir(forward ? 1 : -1);
    setTargetPage(toPage);
    setAnimating(true);
    setOffsetPx(forward ? 0 : vp);
    requestAnimationFrame(() => setOffsetPx(forward ? vp : 0));
  };

  useEffect(() => {
    if (!animating) return;
    const el = trackRef.current;
    if (!el) return;
    const onEnd = () => {
      if (targetPage !== null) setPage(targetPage);
      setAnimating(false);
      setTargetPage(null);
      setOffsetPx(0);
      fixedWidth.current = null;
      if (pendingTab) {
        setTab(pendingTab);
        setPendingTab(null);
      }
    };
    el.addEventListener("transitionend", onEnd, { once: true });
    return () => el.removeEventListener("transitionend", onEnd);
  }, [animating, targetPage, pendingTab]);

  const goPrev = () => page > 0 && doSlide(page - 1);
  const goNext = () => page < totalPages - 1 && doSlide(page + 1);

  // desktop: สไลด์กลับหน้าแรกก่อนค่อยสลับหมวด
  const handleTabChangeDesktop = (v: "comic" | "novel") => {
    if (animating) return;
    if (page === 0) { setTab(v); setPage(0); return; }
    setPendingTab(v);
    doSlide(0);
  };

  // mobile/tablet: เปลี่ยนหมวดทันที
  const handleTabChangeMobile = (v: "comic" | "novel") => {
    setTab(v);
    setPage(0);
  };

  return (
    <>
      {/* ---------- MOBILE (<640px) ---------- */}
      <section className="sm:hidden relative mx-auto max-w-[1320px] px-4 pt-4">
        <div className="origin-top transform-gpu scale-[0.95]">
          <h2 className="text-[40px] font-semibold font-heading">10 อันดับมาแรง</h2>
          <div className="mt-[-5px]">
            <MangaNovelButtons value={tab} onChange={handleTabChangeMobile} className="mobile" />
          </div>
          <div className="mt-3">
            <RowScrollStrip items={data} tab={tab} size="mobile" onItemClick={onItemClick} />
          </div>
        </div>
      </section>

      {/* ---------- TABLET (≥640px && <1024px) ---------- */}
      <section className="hidden sm:block lg:hidden relative mx-auto max-w-[1320px] px-5 pt-10">
        <div className="origin-top transform-gpu scale-[0.98]">
          <h2 className="text-[50px] font-semibold font-heading ">10 อันดับมาแรง</h2>
          <div className="mt-[-5px]">
            <MangaNovelButtons value={tab} onChange={handleTabChangeMobile} className="mobile" />
          </div>
          <div className="mt-3">
            <RowScrollStrip items={data} tab={tab} size="tablet" onItemClick={onItemClick} />
          </div>
        </div>
      </section>

      {/* ---------- DESKTOP (≥1024px) ---------- */}
      <section className="hidden lg:block relative mx-auto max-w-[1320px] px-6 pt-9">
        {/* กรอบกลับด้าน (ตามที่คุณทำไว้) */}
        <img src="/มุมซ้ายบน.png"  alt="" className="absolute top-[0px] left-[585px]  w-[800px] z-30 pointer-events-none scale-x-[-1]" />
        <img src="/มุมขวาบน.png"  alt="" className="absolute top-[-10px] right-[1136px] w-[260px] z-30 pointer-events-none scale-x-[-1]" />
        <img src="/มุมซ้ายล่าง.png" alt="" className="absolute bottom-[-59px] left-[1160px] w-[220px] z-30 pointer-events-none scale-x-[-1]" />
        <img src="/มุมขวาล่าง.png" alt="" className="absolute bottom-[-50px] right-[829px]  w-[600px] z-30 pointer-events-none scale-x-[-1]" />

        <div className="relative z-10">
          <div className="mb-25 relative">
            {/* ดูทั้งหมด (ขวา) */}
            <a
              href={viewAllHref}
              style={{
                position: "absolute",
                top: UI_POS.viewAll.top,
                left: UI_POS.viewAll.left,
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              ดูทั้งหมด &raquo;
            </a>

            {/* หัวข้อ */}
            <h2
              className="absolute text-[30px] sm:text-[25px] md:text-[50px] font-semibold font-heading"
              style={{ left: UI_POS.heading.left, top: UI_POS.heading.top }}
            >
              10 อันดับมาแรง
            </h2>

            {/* ปุ่มมังงะ/นิยาย */}
            <MangaNovelButtons
              value={tab}
              onChange={handleTabChangeDesktop}
              className="absolute"
              style={{ top: UI_POS.tabs.top, left: UI_POS.tabs.left }}
            />
          </div>

          {/* การ์ด + สไลด์ (เดสก์ท็อป) */}
          <div className="relative">
            <div ref={viewportRef} className="overflow-hidden">
              {!animating && <PageGridDesktop items={currItems} baseIndex={start} tab={tab} onItemClick={onItemClick} />}
              {animating && (
                <div
                  ref={trackRef}
                  className="flex will-change-transform"
                  style={{
                    width: `calc(${(fixedWidth.current ?? 0)}px * 2)`,
                    transform: `translate3d(-${offsetPx}px,0,0)`,
                    transition: `transform ${SLIDE_MS}ms ease`,
                  }}
                >
                  {dir === 1 ? (
                    <>
                      <div style={{ width: fixedWidth.current ?? "100%" }} className="flex-none">
                        <PageGridDesktop items={currItems} baseIndex={start} tab={tab} onItemClick={onItemClick} />
                      </div>
                      <div style={{ width: fixedWidth.current ?? "100%" }} className="flex-none">
                        <PageGridDesktop items={nextItems} baseIndex={(page + 1) * PAGE_SIZE} tab={tab} onItemClick={onItemClick} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: fixedWidth.current ?? "100%" }} className="flex-none">
                        <PageGridDesktop items={prevItems} baseIndex={(page - 1) * PAGE_SIZE} tab={tab} onItemClick={onItemClick} />
                      </div>
                      <div style={{ width: fixedWidth.current ?? "100%" }} className="flex-none">
                        <PageGridDesktop items={currItems} baseIndex={start} tab={tab} onItemClick={onItemClick} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ปุ่มลูกศร */}
            {page > 0 && !animating && (
              <button
                onClick={goPrev}
                className="absolute z-40"
                style={{ top: "80px", left: "-160px", width: "200px", height: "200px", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                aria-label="ก่อนหน้า"
              >
                <img src="/arrow.png" alt="ก่อนหน้า" className="w-full h-full object-contain rotate-180" style={{ filter: "brightness(0) invert(1)" }} />
              </button>
            )}
            {page < totalPages - 1 && !animating && (
              <button
                onClick={goNext}
                className="absolute z-40"
                style={{ top: "80px", right: "-160px", width: "200px", height: "200px", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                aria-label="ถัดไป"
              >
                <img src="/arrow.png" alt="ถัดไป" className="w-full h-full object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
