import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, properties, units, users, payments } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { currentUser, getSettings, quote, notify, audit, bookingCode } from "@/lib/server";

const ACTIVE = ["pending_owner", "awaiting_payment", "confirmed"];
const overlap = (aIn: string, aOut: string, bIn: string, bOut: string) => aIn < bOut && bIn < aOut;

async function enrich(list: typeof bookings.$inferSelect[]) {
  if (!list.length) return [];
  const [props, uns, us, pays] = await Promise.all([
    db.select().from(properties).where(inArray(properties.id, [...new Set(list.map(x => x.propertyId))])),
    db.select().from(units).where(inArray(units.id, [...new Set(list.map(x => x.unitId))])),
    db.select({ id: users.id, name: users.name, phone: users.phone, email: users.email, university: users.university }).from(users).where(inArray(users.id, [...new Set([...list.map(x => x.studentId), ...list.map(x => x.ownerId)])])),
    db.select().from(payments).where(inArray(payments.bookingId, list.map(x => x.id))),
  ]);
  return list.map(b => ({ ...b, property: props.find(p => p.id === b.propertyId), unit: uns.find(u => u.id === b.unitId), student: us.find(u => u.id === b.studentId), owner: us.find(u => u.id === b.ownerId), payments: pays.filter(p => p.bookingId === b.id && p.provider !== "sandbox") }));
}

export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "سجّل الدخول أولًا" }, { status: 401 });
  let list;
  if (me.role === "admin") list = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(200);
  else if (me.role === "owner") list = await db.select().from(bookings).where(eq(bookings.ownerId, me.id)).orderBy(desc(bookings.createdAt));
  else list = await db.select().from(bookings).where(eq(bookings.studentId, me.id)).orderBy(desc(bookings.createdAt));
  return NextResponse.json({ bookings: await enrich(list) });
}

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "سجّل الدخول أولًا لإتمام الحجز" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  try {
    const settings = await getSettings();
    if (b.action === "quote") {
      const [u] = await db.select().from(units).where(eq(units.id, Number(b.unitId)));
      if (!u) return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 });
      const q = quote({ monthlyPrice: u.monthlyPrice, deposit: u.deposit, cleaningFee: u.cleaningFee, semesterDiscountPct: u.semesterDiscountPct, checkIn: b.checkIn, checkOut: b.checkOut, serviceFeePct: settings.serviceFeePct, commissionPct: settings.commissionPct });
      return NextResponse.json({ quote: q });
    }
    if (b.action === "pay") {
      return NextResponse.json(
        { error: "الدفع الإلكتروني غير مفعّل حاليًا. لا ترسل بيانات بطاقتك عبر الموقع." },
        { status: 503 },
      );
    }
    // create booking
    if (me.role === "admin") return NextResponse.json({ error: "حساب الإدارة لا يحجز" }, { status: 403 });
    if (b.idempotencyKey) {
      const [existing] = await db.select().from(bookings).where(eq(bookings.idempotencyKey, String(b.idempotencyKey)));
      if (existing) return NextResponse.json({ booking: existing, duplicate: true });
    }
    const [p] = await db.select().from(properties).where(eq(properties.id, Number(b.propertyId)));
    const [u] = await db.select().from(units).where(eq(units.id, Number(b.unitId)));
    if (!p || !u || u.propertyId !== p.id) return NextResponse.json({ error: "بيانات الحجز غير صالحة" }, { status: 400 });
    if (p.status !== "published" || u.status !== "active") return NextResponse.json({ error: "السكن غير متاح للحجز حاليًا" }, { status: 400 });
    if (p.ownerId === me.id) return NextResponse.json({ error: "لا يمكنك حجز سكنك الخاص" }, { status: 400 });
    const guests = Math.max(1, Number(b.guests || 1));
    if (guests > u.capacity && !u.unitType.includes("سرير")) return NextResponse.json({ error: `السعة القصوى لهذه الوحدة ${u.capacity} أفراد` }, { status: 400 });
    if (u.unitType.includes("سرير") && guests > u.totalBeds) return NextResponse.json({ error: "عدد الأسرّة المطلوب أكبر من المتاح" }, { status: 400 });
    if (String(b.checkIn) < u.availableFrom) return NextResponse.json({ error: `الوحدة متاحة من ${u.availableFrom}` }, { status: 400 });
    const q = quote({ monthlyPrice: u.monthlyPrice, deposit: u.deposit, cleaningFee: u.cleaningFee, semesterDiscountPct: u.semesterDiscountPct, checkIn: b.checkIn, checkOut: b.checkOut, serviceFeePct: settings.serviceFeePct, commissionPct: settings.commissionPct });
    // availability check inside guarded section
    const existing = await db.select().from(bookings).where(eq(bookings.unitId, u.id));
    const used = existing.filter(x => ACTIVE.includes(x.status) && overlap(b.checkIn, b.checkOut, x.checkIn, x.checkOut)).reduce((a, x) => a + (u.unitType.includes("سرير") ? x.guests : 1), 0);
    const need = u.unitType.includes("سرير") ? guests : 1;
    if (used + need > u.totalBeds) return NextResponse.json({ error: "الوحدة ممتلئة في التواريخ دي — جرّب تواريخ أو وحدة تانية" }, { status: 409 });
    const [bk] = await db.insert(bookings).values({
      code: bookingCode(), studentId: me.id, ownerId: p.ownerId, propertyId: p.id, unitId: u.id, checkIn: b.checkIn, checkOut: b.checkOut, guests,
      status: "pending_owner", rentSubtotal: q.rentSubtotal, discount: q.discount, serviceFee: q.serviceFee, cleaningFee: q.cleaningFee, depositAmount: q.depositAmount,
      total: q.total, payableNow: q.payableNow, remaining: q.remaining, platformFee: q.platformFee,
      snapshot: { ...q, propertyTitle: p.title, unitName: u.name },
      history: [{ status: "pending_owner", at: new Date().toISOString(), by: me.name }], notes: String(b.notes || ""), idempotencyKey: b.idempotencyKey ? String(b.idempotencyKey) : null,
    }).returning();
    await notify(p.ownerId, "طلب حجز جديد", `طلب ${bk.code} في «${p.title}» من ${me.name} — راجعه وقبوله من لوحتك`, "booking");
    await audit(me, "booking.create", `booking:${bk.id}`, `${bk.code} total=${q.total}`);
    return NextResponse.json({ booking: bk });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 }); }
}

export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "سجّل الدخول" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const [bk] = await db.select().from(bookings).where(eq(bookings.id, Number(b.bookingId)));
  if (!bk) return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
  const push = (status: string, note?: string) => [...bk.history, { status, at: new Date().toISOString(), by: me.name, note }];
  try {
    if (b.action === "accept") {
      if (bk.ownerId !== me.id) return NextResponse.json({ error: "فقط مالك السكن يقبل الطلب" }, { status: 403 });
      if (bk.status !== "pending_owner") return NextResponse.json({ error: "الحجز ليس بانتظار موافقتك" }, { status: 400 });
      const [nb] = await db.update(bookings).set({ status: "awaiting_payment", history: push("awaiting_payment", "قبل المالك الطلب — الدفع الإلكتروني غير مفعّل") }).where(eq(bookings.id, bk.id)).returning();
      await notify(bk.studentId, "المالك وافق على طلبك", `حجز ${bk.code} وافق عليه المالك. الدفع الإلكتروني غير مفعّل، لذلك لم يتأكد الحجز ماليًا.`, "booking");
      return NextResponse.json({ booking: nb });
    }
    if (b.action === "reject") {
      if (bk.ownerId !== me.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      if (bk.status !== "pending_owner") return NextResponse.json({ error: "لا يمكن رفض الحجز الآن" }, { status: 400 });
      const [nb] = await db.update(bookings).set({ status: "rejected", cancelReason: String(b.reason || "غير متاح"), history: push("rejected", String(b.reason || "")) }).where(eq(bookings.id, bk.id)).returning();
      await notify(bk.studentId, "تم رفض طلب الحجز", `حجز ${bk.code}: ${b.reason || "المالك غير متاح في هذه التواريخ"}`, "booking");
      return NextResponse.json({ booking: nb });
    }
    if (b.action === "cancel") {
      if (bk.studentId !== me.id && bk.ownerId !== me.id && me.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      if (["cancelled", "refunded", "completed", "rejected"].includes(bk.status)) return NextResponse.json({ error: "الحجز منتهي أصلًا" }, { status: 400 });
      const paid = (await db.select().from(payments).where(eq(payments.bookingId, bk.id)))
        .filter(p => p.provider !== "sandbox" && p.status === "succeeded")
        .reduce((a, p) => a + p.amount, 0);
      const note = paid > 0
        ? "تم إلغاء الحجز؛ لم ينفذ الموقع استردادًا إلكترونيًا لأن بوابة الدفع غير مفعّلة."
        : "تم إلغاء الحجز قبل أي دفعة إلكترونية.";
      const [nb] = await db.update(bookings).set({ status: "cancelled", refundAmount: 0, cancelReason: String(b.reason || ""), history: push("cancelled", note) }).where(eq(bookings.id, bk.id)).returning();
      await notify(bk.studentId === me.id ? bk.ownerId : bk.studentId, "تم إلغاء حجز", `حجز ${bk.code} اتلغى. ${note}`, "booking");
      await audit(me, "booking.cancel", `booking:${bk.id}`, `cancelled; paid=${paid}`);
      return NextResponse.json({ booking: nb, refund: 0, refundAvailable: false, note });
    }
    if (b.action === "complete") {
      if (me.role !== "admin" && bk.ownerId !== me.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      if (bk.status !== "confirmed") return NextResponse.json({ error: "فقط الحجوزات المؤكدة تُستكمل" }, { status: 400 });
      const [nb] = await db.update(bookings).set({ status: "completed", history: push("completed", "انتهت الإقامة — التأمين يُرد بعد المعاينة") }).where(eq(bookings.id, bk.id)).returning();
      await notify(bk.studentId, "إقامتك انتهت — قيّم تجربتك", "دلوقتي تقدر تقيّم السكن وتساعد طلاب غيرك", "review");
      return NextResponse.json({ booking: nb });
    }
    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
