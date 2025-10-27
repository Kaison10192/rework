// src/app/test/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function Page() {
  const supabase = await createSupabaseServerClient();

  // ลองอ่าน mock ข้อมูลเบื้องต้นจากตารางที่เปิด RLS ไว้ เช่น manga + manga_i18n
  const { data, error } = await supabase
    .from("manga")
    .select("id, slug, is_published, manga_i18n ( lang, title )")
    .eq("is_published", true)
    .limit(5);

  return (
    <pre style={{ whiteSpace: "pre-wrap" }}>
      {JSON.stringify({ data, error }, null, 2)}
    </pre>
  );
}
