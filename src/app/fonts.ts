// src/app/fonts.ts
import localFont from "next/font/local";

export const rimthang = localFont({
  src: [
    { path: "./fonts/sov-rimthang/DRjoyful.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-rimthang",
  display: "swap",
});
