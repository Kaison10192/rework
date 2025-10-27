import { NextResponse } from "next/server";
import { getLatestUpdatesUI } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawKind = (searchParams.get("kind") || "").toLowerCase();
  const kind: "comic" | "novel" = rawKind === "novel" ? "novel" : "comic";
  const page = Math.max(1, Math.floor(Number(searchParams.get("page") || "1") || 1));
  const perPage = Math.max(1, Math.min(48, Math.floor(Number(searchParams.get("perPage") || "24") || 24)));

  console.log("[api/updates] start", { kind, page, perPage });

  try {
    const { items, total } = await getLatestUpdatesUI(kind, page, perPage);
    console.log("[api/updates] ok", { kind, page, len: items.length, total, sample: items[0] });
    return NextResponse.json({ items, total });
  } catch (err) {
    console.error("[api/updates] fatal", err);
    return NextResponse.json({ items: [], total: 0 }, { status: 500 });
  }
}
