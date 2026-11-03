import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, createSession, destroySession, currentUser, publicUser, audit } from "@/lib/server";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === "logout") { await destroySession(); return NextResponse.json({ ok: true }); }
    if (b.action === "register") {
      const name = String(b.name || "").trim(), email = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
      if (name.length < 3) return NextResponse.json({ error: "الاسم لازم يكون ٣ أحرف على الأقل" }, { status: 400 });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
      if (pw.length < 8) return NextResponse.json({ error: "كلمة المرور لازم تكون ٨ أحرف على الأقل" }, { status: 400 });
      const role = b.role === "owner" ? "owner" : "student";
      const [exists] = await db.select().from(users).where(eq(users.email, email));
      if (exists) return NextResponse.json({ error: "البريد ده مسجل قبل كده، جرّب تسجيل الدخول" }, { status: 409 });
      const [u] = await db.insert(users).values({ name, email, phone: String(b.phone || ""), passwordHash: hashPassword(pw), role, university: String(b.university || ""), faculty: String(b.faculty || ""), city: String(b.city || "دمياط") }).returning();
      await createSession(u.id); await audit(u, "auth.register", `user:${u.id}`, role);
      return NextResponse.json({ user: publicUser(u) });
    }
    if (b.action === "login") {
      const email = String(b.email || "").trim().toLowerCase();
      const [u] = await db.select().from(users).where(eq(users.email, email));
      if (!u || !verifyPassword(String(b.password || ""), u.passwordHash)) return NextResponse.json({ error: "البريد أو كلمة المرور غير صحيحة" }, { status: 401 });
      if (u.status === "suspended") return NextResponse.json({ error: "الحساب موقوف، تواصل مع الدعم" }, { status: 403 });
      await createSession(u.id);
      return NextResponse.json({ user: publicUser(u) });
    }
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "سجّل الدخول أولًا" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const patch: Record<string, string> = {};
  if (b.name) patch.name = String(b.name).trim();
  if (b.phone !== undefined) patch.phone = String(b.phone);
  if (b.university !== undefined) patch.university = String(b.university);
  if (b.faculty !== undefined) patch.faculty = String(b.faculty);
  if (b.city) patch.city = String(b.city);
  if (b.newPassword) {
    if (!verifyPassword(String(b.currentPassword || ""), me.passwordHash)) return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    if (String(b.newPassword).length < 8) return NextResponse.json({ error: "كلمة المرور الجديدة قصيرة" }, { status: 400 });
    patch.passwordHash = hashPassword(String(b.newPassword));
  }
  const [u] = await db.update(users).set(patch).where(eq(users.id, me.id)).returning();
  return NextResponse.json({ user: publicUser(u) });
}
