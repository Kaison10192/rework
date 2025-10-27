// src/app/page.tsx
import TopPopular from "@/components/home/TopPopular";
import TopNew from "@/components/home/TopNew";
import CatalogWithLanterns from "@/components/home/CatalogWithLanterns";
import { getTopPopularUI, getTopNewUI, getLatestUpdatesUI } from "@/lib/queries";

export default async function HomePage() {
  // 10 อันดับ (การ์ตูน/นิยาย)
  const [popularComic, popularNovel] = await Promise.all([
    getTopPopularUI("comic", 10),
    getTopPopularUI("novel", 10),
  ]);
  const [newComic, newNovel] = await Promise.all([
    getTopNewUI("comic", 10),
    getTopNewUI("novel", 10),
  ]);

  // อัพเดทล่าสุด (แสดงใน CatalogWithLanterns – ตรงนี้แค่หน้าตัวอย่าง)
  // CatalogWithLanterns ยังใช้ mock อยู่ คุณยังไม่ต้อง feed data ก็ได้
  // ถ้าจะ feed จริง ให้ปรับไฟล์นั้นเพิ่ม props

  return (
    <main className="relative min-h-screen bg-background text-text pt-16 overflow-hidden">
      {/* TOP 10 ยอดนิยม */}
      <TopPopular
        itemsComic={popularComic}
        itemsNovel={popularNovel}
        initialTab="comic"
        viewAllHref="/popular"
      />

      {/* TOP 10 มาแรง */}
      <TopNew
        itemsComic={newComic}
        itemsNovel={newNovel}
        initialTab="comic"
        viewAllHref="/trending"
      />

      {/* การ์ดอัพเดทล่าสุด (ตอนนี้ยังใช้ mock ภายใน component) */}
      <CatalogWithLanterns />
    </main>
  );
}
