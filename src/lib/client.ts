/* eslint-disable @typescript-eslint/no-explicit-any */
export async function api(path: string, opts: RequestInit = {}) {
  const r = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "حدث خطأ، حاول تاني");
  return data;
}
export const post = (path: string, body: any) => api(path, { method: "POST", body: JSON.stringify(body) });
export const patch = (path: string, body: any) => api(path, { method: "PATCH", body: JSON.stringify(body) });

export const egp = (n: number | null | undefined) => n === null || n === undefined ? "—" : new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n) + " ج.م";
export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" && d.length === 10 ? new Date(d + "T12:00:00") : new Date(d as any);
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(dt);
};
export const fmtTime = (d: any) => d ? new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(d)) : "—";
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (base: string, days: number) => { const d = new Date(base + "T12:00:00"); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

export const BOOKING_STATUS: Record<string, { ar: string; cls: string }> = {
  pending_owner: { ar: "بانتظار موافقة المالك", cls: "bg-amber-100 text-amber-800" },
  awaiting_payment: { ar: "بانتظار تفعيل الدفع", cls: "bg-blue-100 text-blue-800" },
  confirmed: { ar: "مؤكد ✅", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { ar: "مرفوض", cls: "bg-red-100 text-red-700" },
  cancelled: { ar: "ملغي", cls: "bg-slate-200 text-slate-600" },
  refunded: { ar: "مسترد بالكامل", cls: "bg-violet-100 text-violet-800" },
  partially_refunded: { ar: "مسترد جزئيًا", cls: "bg-violet-100 text-violet-700" },
  completed: { ar: "إقامة مكتملة", cls: "bg-teal-100 text-teal-800" },
  expired: { ar: "منتهي", cls: "bg-slate-200 text-slate-500" },
};
export const LISTING_STATUS: Record<string, { ar: string; cls: string }> = {
  draft: { ar: "مسودة", cls: "bg-slate-200 text-slate-600" },
  pending_review: { ar: "قيد مراجعة الإدارة", cls: "bg-amber-100 text-amber-800" },
  verification_required: { ar: "يحتاج توثيق", cls: "bg-orange-100 text-orange-800" },
  published: { ar: "منشور", cls: "bg-emerald-100 text-emerald-800" },
  paused: { ar: "موقوف مؤقتًا", cls: "bg-slate-200 text-slate-600" },
  rejected: { ar: "مرفوض", cls: "bg-red-100 text-red-700" },
  suspended: { ar: "مُعلّق من الإدارة", cls: "bg-red-100 text-red-800" },
  archived: { ar: "مؤرشف", cls: "bg-slate-200 text-slate-500" },
};
export const PAY_STATUS: Record<string, string> = { succeeded: "تم الدفع", failed: "فشل", refunded: "استرداد", partially_refunded: "استرداد جزئي", pending: "معلّق" };
export const PROP_TYPES = ["شقة كاملة", "غرفة خاصة", "سرير مشترك", "استوديو", "سكن طالبات"];
export const UNIT_TYPES = ["سرير في غرفة مشتركة", "غرفة خاصة", "شقة كاملة", "استوديو"];
export type View = { name: string; id?: number; tab?: string; q?: any };
export type Ctx = {
  user: any; settings: any; nav: (v: View) => void; toast: (m: string, t?: "ok" | "err") => void;
  openAuth: (mode?: "login" | "register") => void; setUser: (u: any) => void; boot: any; refreshBoot: () => void;
};
