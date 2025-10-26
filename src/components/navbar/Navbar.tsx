"use client";
import { useEffect, useRef, useState } from "react";
import LanternIcon from "./LanternIcon";

/* ---------- SVG icons (inline, ไม่ต้องติดตั้ง lib) ---------- */
function IconMegaphone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l6 3V7L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M14 7a6 6 0 0 0 0 10" />
    </svg>
  );
}
function IconBook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 19a2 2 0 0 1 2-2h13" />
      <path d="M4 5h13a2 2 0 0 1 2 2v12" />
      <path d="M8 5v14" />
    </svg>
  );
}
function IconComic(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 4h13a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H9l-5 3V6a2 2 0 0 1 2-2Z" />
      <path d="M8 9h6M8 13h8" />
    </svg>
  );
}
function IconSettings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.17a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.17a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.12 3.4l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.17a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.25 1 1.51H21a2 2 0 1 1 0 4h-.17a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconPen(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}
function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 8a6 6 0 1 1 12 0v5l2 2H4l2-2Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

/* ---------- Navbar ---------- */
export default function Navbar() {
  const [active, setActive] = useState<"news" | "novel" | "comic">("news");
  const [openUser, setOpenUser] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setOpenUser(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const menu = [
    { key: "news" as const, label: "ข่าว/ประกาศ", Icon: IconMegaphone },
    { key: "novel" as const, label: "นิยาย", Icon: IconBook },
    { key: "comic" as const, label: "การ์ตูน", Icon: IconComic },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10">
      <nav className="mx-auto max-w-[1320px] h-14 px-4 sm:px-6 flex items-center justify-between">
        {/* ---- โลโก้ ---- */}
        <div className="flex items-center gap-2">
          <LanternIcon className="w-6 h-6 text-lantern lantern-pulse" />
          <span className="font-heading text-[19px] tracking-[0.02em] text-text">
            ReadRealm
          </span>
        </div>

        {/* ---- เมนูกลาง (Desktop only) ---- */}
        <ul className="hidden md:flex items-center gap-2">
          {menu.map(({ key, label, Icon }) => {
            const isActive = active === key;
            return (
              <li key={key}>
                <button
                  onClick={() => setActive(key)}
                  className={`
                    group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl
                    transition-colors duration-150
                    ${isActive ? "bg-white/10 text-flame" : "text-white/70 hover:text-white"}
                  `}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="font-heading tracking-[0.02em]">{label}</span>
                </button>
                {/* indicator bar */}
                <div
                  className={`h-[2px] mt-1 rounded-full transition-all duration-200 ${isActive ? "bg-flame w-full" : "bg-transparent w-0"}`}
                />
              </li>
            );
          })}
        </ul>

        {/* ---- กลุ่มไอคอนขวา ---- */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            aria-label="ตั้งค่า"
            className="grid place-items-center w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <IconSettings className="w-[18px] h-[18px]" />
          </button>

          <div className="hidden sm:block h-6 w-px bg-white/10" />

          <button
            aria-label="ค้นหา"
            className="grid place-items-center w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <IconSearch className="w-[18px] h-[18px]" />
          </button>
          <button
            aria-label="เขียน"
            className="grid place-items-center w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <IconPen className="w-[18px] h-[18px]" />
          </button>
          <button
            aria-label="แจ้งเตือน"
            className="relative grid place-items-center w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <IconBell className="w-[18px] h-[18px]" />
            {/* จุดแจ้งเตือน */}
            <span className="absolute -right-0.5 -top-0.5 w-2 h-2 bg-flame rounded-full shadow-[0_0_0_2px_rgba(11,11,13,0.9)]" />
          </button>

          {/* โปรไฟล์ */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => setOpenUser((v) => !v)}
              className="relative inline-grid place-items-center w-9 h-9 rounded-full ring-2 ring-purple-400/70 hover:ring-purple-300 transition"
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-white/90 to-white/70" />
            </button>

            {/* เมนูโปรไฟล์ */}
            {openUser && (
              <div
                className="absolute right-0 mt-3 w-[320px] rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,.35)] p-3"
                role="menu"
              >
                {/* card บน */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/90 to-white/70" />
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">LittleTurtle</div>
                    <div className="text-white/60 text-sm truncate">@103270091607392...</div>
                  </div>
                  <button className="ml-auto px-3 py-1.5 rounded-lg bg-purple-500/30 text-white hover:bg-purple-500/40 transition text-sm">
                    เติมเหรียญ
                  </button>
                </div>

                {/* รายการ */}
                <ul className="mt-2 space-y-1 text-[15px]">
                  {[
                    "กระเป๋าเงินนักอ่าน",
                    "หน้านักเขียน",
                    "ชั้นหนังสือ",
                    "ประวัติการอ่าน",
                    "ประวัติการซื้อ",
                    "การตั้งค่า",
                    "แนะนำเพื่อน",
                    "ติดต่อแอดมิน",
                  ].map((label) => (
                    <li key={label}>
                      <button
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/8 text-white/80 hover:text-white transition"
                        role="menuitem"
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                  <li className="pt-1 border-t border-white/10 mt-2">
                    <button className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
                      ออกจากระบบ
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
