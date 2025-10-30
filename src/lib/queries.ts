// src/lib/queries.ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type UIItem = {
  id: string;
  title: string;
  cover: string;
  chapterNumber?: number;
  lastReleaseAt?: string;

  // ✅ เพิ่มสองบรรทัดนี้เข้าไป
  ratingAvg?: number;
  viewsCount?: number;
  authorName?: string;
};


const PLACEHOLDER = "https://picsum.photos/seed/fallback/600/800";
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE || "";
function buildCoverUrl(imagePath?: string | null): string {
  if (!imagePath) return PLACEHOLDER;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

/* ===========================================================
   ✅ 1. ยอดนิยม (Top Popular)
=========================================================== */
// ✅ Top Popular
export async function getTopPopularUI(
  kind: "comic" | "novel",
  limit = 10
): Promise<UIItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_card_latest")
    // ⬇️ เพิ่มคอลัมน์
    .select("id, title, cover_url, author_name, views_count, rating_avg")
    .eq("kind", kind)
    .order("views_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getTopPopularUI] error:", {
      code: (error as any)?.code,
      message: (error as any)?.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    });
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    title: r.title ?? "",
    cover: buildCoverUrl(r.cover_url),
    // ⬇️ map ค่าเพิ่ม
    authorName: r.author_name ?? "",
    ratingAvg: r.rating_avg ?? undefined,
    viewsCount: r.views_count ?? undefined,
  }));
}




/* ===========================================================
   ✅ 2. มาแรงล่าสุด (Top New)
=========================================================== */
// ✅ Top New
// 10 อันดับมาแรง = เรื่องใหม่ช่วงล่าสุด + เรียงตามวิว
export async function getTopNewUI(
  kind: "comic" | "novel",
  limit = 10,
  daysWindow = 30                   // 👉 นิยาม “มาใหม่” กี่วัน
): Promise<UIItem[]> {
  const supabase = await createSupabaseServerClient();
  const cutoff = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000).toISOString();

  // ----- TRY #1: ใช้ created_at (คือ “เรื่องใหม่จริง ๆ”) -----
  let q1 = await supabase
    .from("v_card_latest")
    .select("id, title, cover_url, author_name, created_at, last_chapter_at, views_count, rating_avg")
    .eq("kind", kind)
    .gte("created_at", cutoff)                    // ⬅️ กรองเรื่องใหม่
    .order("views_count", { ascending: false })   // ⬅️ ยอดวิวมากก่อน
    .order("last_chapter_at", { ascending: false })
    .limit(limit);

  // ถ้า view ไม่มี created_at (error code 42703) → fallback ใช้ last_chapter_at
  if (q1.error && (q1.error as any)?.code === "42703") {
    const q2 = await supabase
      .from("v_card_latest")
      .select("id, title, cover_url, author_name, last_chapter_at, views_count, rating_avg")
      .eq("kind", kind)
      .gte("last_chapter_at", cutoff)             // ⬅️ มาใหม่จาก “อัปเดตล่าสุด”
      .order("views_count", { ascending: false })
      .order("last_chapter_at", { ascending: false })
      .limit(limit);

    if (q2.error) {
      console.error("[getTopNewUI] fallback error:", q2.error);
      return [];
    }
    return (q2.data ?? []).map((r: any) => ({
      id: String(r.id),
      title: r.title ?? "",
      cover: buildCoverUrl(r.cover_url),
      authorName: r.author_name ?? "",
      ratingAvg: r.rating_avg ?? undefined,
      viewsCount: r.views_count ?? undefined,
    }));
  }

  if (q1.error) {
    console.error("[getTopNewUI] error:", q1.error);
    return [];
  }

  return (q1.data ?? []).map((r: any) => ({
    id: String(r.id),
    title: r.title ?? "",
    cover: buildCoverUrl(r.cover_url),
    authorName: r.author_name ?? "",
    ratingAvg: r.rating_avg ?? undefined,
    viewsCount: r.views_count ?? undefined,
  }));
}



/* ===========================================================
   ✅ 3. อัปเดตล่าสุด (หน้าอัปเดต)
=========================================================== */
// ✅ Latest Updates (หน้าอัปเดต)
export async function getLatestUpdatesUI(
  kind: "comic" | "novel",
  page = 1,
  perPage = 24
): Promise<{ items: UIItem[]; total: number }> {
  const supabase = await createSupabaseServerClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count, error } = await supabase
    .from("v_card_latest")
    // ⬇️ เพิ่มคอลัมน์
    .select("id, title, cover_url, author_name, last_chapter_at, latest3, views_count, rating_avg", { count: "exact" })
    .eq("kind", kind)
    .order("last_chapter_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getLatestUpdatesUI] error:", error);
    return { items: [], total: 0 };
  }

  const items: UIItem[] = (data ?? []).map((r: any) => ({
    id: String(r.id),
    title: r.title ?? "",
    cover: buildCoverUrl(r.cover_url),
    authorName: r.author_name ?? "",
    ratingAvg: r.rating_avg ?? undefined,
    viewsCount: r.views_count ?? undefined,
    chapterNumber:
      Array.isArray(r.latest3) && r.latest3[0]?.number != null
        ? r.latest3[0].number
        : undefined,
    lastReleaseAt: r.last_chapter_at ?? r.latest3?.[0]?.release_at ?? undefined,
  }));

  return { items, total: count ?? items.length };
}

