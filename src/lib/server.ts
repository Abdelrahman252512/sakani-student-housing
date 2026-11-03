import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { sessions, users, notifications, auditLogs, settingsTable } from "@/db/schema";
import { eq, gt } from "drizzle-orm";

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(pw: string, stored: string) {
  try {
    const [salt, hash] = stored.split(":");
    const calc = scryptSync(pw, salt, 64);
    return timingSafeEqual(Buffer.from(hash, "hex"), calc);
  } catch { return false; }
}
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex") + createHash("sha256").update(String(userId + Date.now())).digest("hex").slice(0, 16);
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt: expires });
  const c = await cookies();
  c.set("sakani_session", token, { httpOnly: true, sameSite: "lax", path: "/", expires });
  return token;
}
export async function currentUser() {
  const c = await cookies();
  const token = c.get("sakani_session")?.value;
  if (!token) return null;
  const [s] = await db.select().from(sessions).where(eq(sessions.token, token));
  if (!s || s.expiresAt < new Date()) return null;
  const [u] = await db.select().from(users).where(eq(users.id, s.userId));
  if (!u || u.status === "suspended") return null;
  return u;
}
export async function destroySession() {
  const c = await cookies();
  const token = c.get("sakani_session")?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  c.delete("sakani_session");
}
export async function notify(userId: number, title: string, body: string, type = "general") {
  await db.insert(notifications).values({ userId, title, body, type });
}
export async function audit(actor: { id?: number; name?: string } | null, action: string, target: string, details = "") {
  await db.insert(auditLogs).values({ actorId: actor?.id ?? null, actorName: actor?.name || "system", action, target, details });
}
export type SakaniSettings = {
  commissionPct: number; serviceFeePct: number; siteName: string; announcement: string;
  freeCancelDays: number; partialCancelDays: number; partialRefundPct: number;
  paymentMode: string; supportEmail: string; maintenance: boolean;
  cities: string[]; universities: string[]; amenities: string[];
};
const UNIVERSITY_OPTIONS_VERSION = "2026-10-26-v1";
const ADDITIONAL_UNIVERSITIES = [
  "معهد راس البر العالى لدراسات النوعيه والحاسب الآلى77",
  "المعهد العالى للاداره والحاسب الالى براس البر 51",
];
export const DEFAULT_SETTINGS: SakaniSettings = {
  commissionPct: 0, serviceFeePct: 0, siteName: "سكني",
  announcement: "",
  freeCancelDays: 0, partialCancelDays: 0, partialRefundPct: 0,
  paymentMode: "disabled", supportEmail: "", maintenance: false,
  cities: ["دمياط", "دمياط الجديدة", "رأس البر", "كفر سعد", "فارسكور"],
  universities: ["جامعة دمياط", "جامعة حورس", "المعهد العالي للهندسة بدمياط الجديدة", "كلية طب الأسنان – حورس", ...ADDITIONAL_UNIVERSITIES],
  amenities: ["واي فاي سريع", "تكييف", "حمام خاص", "مطبخ مجهز", "غسالة", "مكتب مذاكرة", "ثلاجة", "سخان", "أمن ٢٤ ساعة", "تنظيف أسبوعي", "مصعد", "بلكونة", "قريب من المواصلات", "مفروش بالكامل"],
};
export async function getSettings(): Promise<SakaniSettings> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.id, 1));
  if (!row) {
    await db.insert(settingsTable).values({
      id: 1,
      data: { ...DEFAULT_SETTINGS, universityOptionsVersion: UNIVERSITY_OPTIONS_VERSION } as unknown as Record<string, unknown>,
    });
    return DEFAULT_SETTINGS;
  }
  const settingsData = { ...(row.data as Record<string, unknown>) };
  if (settingsData.universityOptionsVersion !== UNIVERSITY_OPTIONS_VERSION) {
    const universities = Array.isArray(settingsData.universities)
      ? settingsData.universities.filter((value): value is string => typeof value === "string")
      : DEFAULT_SETTINGS.universities;
    settingsData.universities = [...new Set([...universities, ...ADDITIONAL_UNIVERSITIES])];
    settingsData.universityOptionsVersion = UNIVERSITY_OPTIONS_VERSION;
    await db.update(settingsTable)
      .set({ data: settingsData, updatedAt: new Date() })
      .where(eq(settingsTable.id, 1));
  }
  delete settingsData.adminPasswordVersion;
  delete settingsData.universityOptionsVersion;
  return { ...DEFAULT_SETTINGS, ...settingsData } as SakaniSettings;
}
export function publicUser(u: typeof users.$inferSelect) {
  const { passwordHash, ...rest } = u; void passwordHash; return rest;
}
// Pricing engine — integer EGP, server authoritative
export function quote(opts: { monthlyPrice: number; deposit: number; cleaningFee: number; semesterDiscountPct: number; checkIn: string; checkOut: string; serviceFeePct: number; commissionPct: number }) {
  const inD = new Date(opts.checkIn + "T12:00:00Z"); const outD = new Date(opts.checkOut + "T12:00:00Z");
  const nights = Math.round((outD.getTime() - inD.getTime()) / 86400000);
  if (!(nights > 0)) throw new Error("تواريخ الحجز غير صالحة: تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول");
  if (nights < 14) throw new Error("الحد الأدنى للإقامة ١٤ يومًا لسكن الطلاب");
  const rentSubtotal = Math.round((opts.monthlyPrice * nights) / 30);
  const discount = nights >= 120 ? Math.round((rentSubtotal * opts.semesterDiscountPct) / 100) : 0;
  const serviceFee = Math.round(((rentSubtotal - discount) * opts.serviceFeePct) / 100);
  const platformFee = Math.round(((rentSubtotal - discount) * opts.commissionPct) / 100);
  const total = rentSubtotal - discount + serviceFee + opts.cleaningFee + opts.deposit;
  const firstMonth = Math.round((opts.monthlyPrice * Math.min(nights, 30)) / 30) - (discount ? Math.round(discount * Math.min(nights, 30) / nights) : 0);
  const payableNow = Math.min(total, firstMonth + serviceFee + opts.cleaningFee + opts.deposit);
  const remaining = total - payableNow;
  const months = Math.round((nights / 30) * 10) / 10;
  return { nights, months, rentSubtotal, discount, serviceFee, platformFee, cleaningFee: opts.cleaningFee, depositAmount: opts.deposit, total, payableNow, remaining, monthlyPrice: opts.monthlyPrice };
}
export function matchScore(a: { city: string; university: string; budget: number; prefs: Record<string, string>; durationMonths: number }, b: typeof a) {
  let score = 0; const reasons: string[] = [];
  if (a.city === b.city) { score += 20; reasons.push("نفس المدينة"); }
  if (a.university && a.university === b.university) { score += 20; reasons.push("نفس الجامعة"); }
  const diff = Math.abs(a.budget - b.budget);
  if (diff <= 200) { score += 20; reasons.push("ميزانية متقاربة جدًا"); } else if (diff <= 500) { score += 12; reasons.push("ميزانية متقاربة"); } else if (diff <= 1000) score += 5;
  if (Math.abs(a.durationMonths - b.durationMonths) <= 2) { score += 10; reasons.push("مدة إقامة متوافقة"); }
  const keys = ["sleep", "smoking", "guests", "cleanliness", "study"];
  let same = 0; keys.forEach(k => { if (a.prefs?.[k] && a.prefs[k] === b.prefs?.[k]) same++; });
  score += same * 6; if (same >= 3) reasons.push(`توافق نمط حياة (${same}/٥)`);
  return { score: Math.min(100, score), reasons };
}
export function bookingCode() { return "SKN-" + randomBytes(3).toString("hex").toUpperCase(); }
export const gtHelper = gt;
