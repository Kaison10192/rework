// src/lib/cn.ts
export function cn(...vals: Array<string | undefined | false>) {
  return vals.filter(Boolean).join(" ");
}
