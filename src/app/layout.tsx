import "./globals.css";
import { rimthang } from "./fonts";
import Navbar from "@/components/navbar/Navbar";

export const metadata = {
  title: "ตะเกียง (Takiang)",
  description: "แพลตฟอร์มอ่านการ์ตูนและนิยาย",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="dark">
      {/* ✅ เพิ่ม rimthang.variable เข้ามาใน body เพื่อให้ใช้ฟอนต์ได้ทั่วเว็บ */}
      <body className={`${rimthang.variable} bg-background text-text font-[var(--font-body)] antialiased`}>
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
