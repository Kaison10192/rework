// src/lib/queries.ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type UIItem = {
  id: string;
  title: string;
  cover: string;
  chapterNumber?: number;
  lastReleaseAt?: string;
};


const PLACEHOLDER = "https://picsum.photos/seed/fallback/600/800";
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE || "";
function buildCoverUrl(imagePath?: string | null): string {
  if (!imagePath) return PLACEHOLDER;             // <<< ตรงนี้
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

/** ============ 10 อันดับยอดนิยม ============ */
// ✅ ใช้ angle brackets ไม่ใช่ square brackets

// ✅ TOP POPULAR (10 อันดับ)
export async function getTopPopularUI(
  kind: "comic" | "novel",
  limit = 10
): Promise<UIItem[]> {
  console.log("[getTopPopularUI] start:", kind);

  const supabase = await createSupabaseServerClient();
  const table =
    kind === "comic" ? "v_top_popular_comic" : "v_top_popular_novel";
  console.log("[getTopPopularUI] querying table:", table);

  // เลือกเฉพาะคอลัมน์ที่มีจริงใน view
  const { data, error } = await supabase
    .from(table)
    .select("id, title, cover_url")
    .limit(limit);

  if (error) {
    console.error("[getTopPopularUI] error:", JSON.stringify(error, null, 2));
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    title: r.title ?? "",
    // view นี้มีแต่ cover_url
    cover: buildCoverUrl(r.cover_url),
  }));
}

// ✅ TOP NEW (10 อันดับมาแรง)
export async function getTopNewUI(
  kind: "comic" | "novel",
  limit = 10
): Promise<UIItem[]> {
  console.log("[getTopNewUI] start:", kind);

  const supabase = await createSupabaseServerClient();
  const table = kind === "comic" ? "v_top_new_comic" : "v_top_new_novel";
  console.log("[getTopNewUI] querying table:", table);

  // เลือกเฉพาะคอลัมน์ที่มีจริงใน view
  const { data, error } = await supabase
    .from(table)
    .select("id, title, cover_url")
    .limit(limit);

  if (error) {
    console.error("[getTopNewUI] error:", JSON.stringify(error, null, 2));
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    title: r.title ?? "",
    cover: buildCoverUrl(r.cover_url),
  }));
}



/** อัพเดทล่าสุด (การ์ตูน|นิยาย) – แบ่งหน้า */
// src/lib/queries.ts

// ...ด้านบนคงเดิม

export async function getLatestUpdatesUI(
  kind: "comic" | "novel",
  page = 1,
  perPage = 24
): Promise<{ items: UIItem[]; total: number }> {
  console.log("[getLatestUpdatesUI] start:", { kind, page, perPage });

  const supabase = await createSupabaseServerClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const table =
    kind === "comic" ? "v_latest_updates_comic" : "v_latest_updates_novel";
  console.log("[getLatestUpdatesUI] querying table:", table, "range:", from, "-", to);

  // helper: map -> UIItem
  const toItems = (rows: any[]) =>
    (rows ?? []).map((r: any) => ({
      id: String(r.id),
      title: r.title ?? "",
      cover: buildCoverUrl(r.cover_path ?? r.cover_url),
      chapterNumber: r.chapter_number ?? undefined,
      lastReleaseAt: r.last_release_at ?? undefined,
    })) as UIItem[];

  // 1st try: assume cover_path exists
  let data: any[] | null = null;
  let count: number | null = null;

  let q1 = await supabase
    .from(table)
    .select("id, title, cover_path, chapter_number, last_release_at", { count: "exact" })
    .range(from, to);

  if (q1.error) {
    console.error(
      "[getLatestUpdatesUI] try#1 error:",
      JSON.stringify(q1.error, null, 2)
    );
    // ถ้าคอลัมน์ไม่เจอ (42703) → ลองรูปแบบที่ 2
    if ((q1.error as any)?.code === "42703") {
      console.log("[getLatestUpdatesUI] retry try#2 with cover_url …");
      const q2 = await supabase
        .from(table)
        .select("id, title, cover_url, chapter_number, last_release_at", { count: "exact" })
        .range(from, to);
      if (q2.error) {
        console.error(
          "[getLatestUpdatesUI] try#2 error:",
          JSON.stringify(q2.error, null, 2)
        );
        return { items: [], total: 0 };
      }
      data = q2.data ?? [];
      count = q2.count ?? data.length;
    } else {
      // error อื่นๆ
      return { items: [], total: 0 };
    }
  } else {
    data = q1.data ?? [];
    count = q1.count ?? data.length;
  }

  console.log("[getLatestUpdatesUI] data length:", data.length, "total:", count);
  if (data.length) console.log("[getLatestUpdatesUI] sample row:", data[0]);

  const items = toItems(data);
  console.log("[getLatestUpdatesUI] mapped len:", items.length, "first:", items[0]);

  return { items, total: count ?? items.length };
}
