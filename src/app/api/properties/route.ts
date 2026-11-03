import { NextResponse } from "next/server";
import { db } from "@/db";
import { properties, units, reviews, users, bookings, verifications, favorites } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { currentUser, audit, notify } from "@/lib/server";

const ACTIVE = ["pending_owner", "awaiting_payment", "confirmed"];
function overlaps(aIn: string, aOut: string, bIn: string, bOut: string) { return aIn < bOut && bIn < aOut; }

async function enrich(list: typeof properties.$inferSelect[], checkIn?: string, checkOut?: string, meId?: number) {
  if (!list.length) return [];
  const ids = list.map(p => p.id);
  const [allUnits, allReviews, allBookings] = await Promise.all([
    db.select().from(units).where(inArray(units.propertyId, ids)),
    db.select().from(reviews).where(inArray(reviews.propertyId, ids)),
    db.select().from(bookings).where(inArray(bookings.propertyId, ids)),
  ]);
  const ownerIds = [...new Set(list.map(p => p.ownerId))];
  const owners = await db.select({ id: users.id, name: users.name, isVerified: users.isVerified, createdAt: users.createdAt }).from(users).where(inArray(users.id, ownerIds));
  const favs = meId ? await db.select().from(favorites).where(eq(favorites.userId, meId)) : [];
  return list.map(p => {
    const pUnits = allUnits.filter(u => u.propertyId === p.id && u.status === "active").map(u => {
      let freeBeds = u.totalBeds;
      if (checkIn && checkOut) {
        const used = allBookings.filter(bk => bk.unitId === u.id && ACTIVE.includes(bk.status) && overlaps(checkIn, checkOut, bk.checkIn, bk.checkOut)).reduce((a, bk) => a + (u.unitType.includes("سرير") ? bk.guests : 1), 0);
        freeBeds = Math.max(0, u.totalBeds - used);
      }
      return { ...u, freeBeds };
    });
    const pReviews = allReviews.filter(r => r.propertyId === p.id && r.status === "published");
    const rating = pReviews.length ? Math.round((pReviews.reduce((a, r) => a + r.rating, 0) / pReviews.length) * 10) / 10 : null;
    return { ...p, units: pUnits, minPrice: pUnits.length ? Math.min(...pUnits.map(u => u.monthlyPrice)) : null, rating, reviewCount: pReviews.length, owner: owners.find(o => o.id === p.ownerId) || null, isFav: favs.some(f => f.propertyId === p.id), availableUnits: pUnits.filter(u => u.freeBeds > 0).length };
  });
}

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const me = await currentUser();
    if (sp.get("mine") === "1") {
      if (!me) return NextResponse.json({ error: "سجّل الدخول أولًا" }, { status: 401 });
      const list = me.role === "admin" ? await db.select().from(properties).orderBy(desc(properties.createdAt)) : await db.select().from(properties).where(eq(properties.ownerId, me.id)).orderBy(desc(properties.createdAt));
      return NextResponse.json({ properties: await enrich(list, undefined, undefined, me.id) });
    }
    const id = sp.get("id");
    if (id) {
      const [p] = await db.select().from(properties).where(eq(properties.id, Number(id)));
      if (!p) return NextResponse.json({ error: "السكن غير موجود" }, { status: 404 });
      const canSee = p.status === "published" || (me && (me.id === p.ownerId || me.role === "admin"));
      if (!canSee) return NextResponse.json({ error: "السكن غير متاح حاليًا" }, { status: 404 });
      await db.update(properties).set({ views: p.views + 1 }).where(eq(properties.id, p.id));
      const [enriched] = await enrich([p], sp.get("checkIn") || undefined, sp.get("checkOut") || undefined, me?.id);
      const revs = await db.select().from(reviews).where(eq(reviews.propertyId, p.id)).orderBy(desc(reviews.createdAt));
      const revUsers = revs.length ? await db.select({ id: users.id, name: users.name, university: users.university }).from(users).where(inArray(users.id, revs.map(r => r.studentId))) : [];
      const vers = await db.select().from(verifications).where(eq(verifications.propertyId, p.id));
      const pBookings = await db.select({ checkIn: bookings.checkIn, checkOut: bookings.checkOut, status: bookings.status, unitId: bookings.unitId }).from(bookings).where(eq(bookings.propertyId, p.id));
      return NextResponse.json({ property: enriched, reviews: revs.filter(r => r.status === "published" || me?.role === "admin").map(r => ({ ...r, student: revUsers.find(u => u.id === r.studentId) })), verifications: vers.filter(v => v.status === "approved").map(v => ({ id: v.id, type: v.type, reviewedAt: v.reviewedAt })), bookedRanges: pBookings.filter(b => ACTIVE.includes(b.status)) });
    }
    // public search
    let list = await db.select().from(properties).where(eq(properties.status, "published")).orderBy(desc(properties.featured), desc(properties.createdAt));
    const q = (sp.get("q") || "").trim();
    if (q) list = list.filter(p => (p.title + p.description + p.neighborhood + p.city + p.university).includes(q));
    if (sp.get("city")) list = list.filter(p => p.city === sp.get("city"));
    if (sp.get("type")) list = list.filter(p => p.type === sp.get("type"));
    if (sp.get("gender")) list = list.filter(p => p.gender === sp.get("gender") || p.gender === "الكل");
    if (sp.get("university")) list = list.filter(p => p.university === sp.get("university"));
    if (sp.get("verified") === "1") list = list.filter(p => p.isVerified);
    const ams = (sp.get("amenities") || "").split(",").filter(Boolean);
    if (ams.length) list = list.filter(p => ams.every(a => (p.amenities || []).includes(a)));
    const maxDist = Number(sp.get("maxDistance") || 0);
    if (maxDist) list = list.filter(p => p.distanceKm <= maxDist);
    let enriched = await enrich(list, sp.get("checkIn") || undefined, sp.get("checkOut") || undefined, me?.id);
    const budget = Number(sp.get("maxBudget") || 0);
    if (budget) enriched = enriched.filter(p => p.minPrice !== null && p.minPrice <= budget);
    if (sp.get("checkIn") && sp.get("checkOut")) enriched = enriched.filter(p => p.availableUnits > 0);
    const sort = sp.get("sort") || "recommended";
    if (sort === "price_asc") enriched.sort((a, b) => (a.minPrice ?? 1e9) - (b.minPrice ?? 1e9));
    if (sort === "price_desc") enriched.sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
    if (sort === "rating") enriched.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "distance") enriched.sort((a, b) => a.distanceKm - b.distanceKm);
    const page = Math.max(1, Number(sp.get("page") || 1)); const perPage = 9;
    const total = enriched.length;
    return NextResponse.json({ properties: enriched.slice((page - 1) * perPage, page * perPage), total, page, pages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

const TRANSITIONS: Record<string, string[]> = {
  draft: ["pending_review", "archived"], pending_review: ["published", "rejected", "verification_required", "draft"],
  verification_required: ["pending_review", "draft"], published: ["paused", "suspended", "archived"],
  paused: ["published", "archived"], rejected: ["draft", "archived"], suspended: ["published", "archived"], archived: ["draft"],
};

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me || (me.role !== "owner" && me.role !== "admin")) return NextResponse.json({ error: "لازم حساب مالك عشان تضيف سكن" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  try {
    if (!String(b.title || "").trim()) return NextResponse.json({ error: "عنوان السكن مطلوب" }, { status: 400 });
    const unitsIn = Array.isArray(b.units) ? b.units : [];
    if (!unitsIn.length || unitsIn.some((u: any) => !String(u.name || "").trim() || !Number.isFinite(Number(u.monthlyPrice)) || Number(u.monthlyPrice) < 100)) {
      return NextResponse.json({ error: "أدخل اسم كل وحدة وسعرها الشهري الحقيقي قبل الحفظ" }, { status: 400 });
    }
    if (!String(b.city || "").trim() || !String(b.neighborhood || "").trim() || !String(b.university || "").trim() || !String(b.type || "").trim() || !String(b.gender || "").trim() || !Number.isFinite(Number(b.distanceKm)) || Number(b.distanceKm) <= 0) {
      return NextResponse.json({ error: "أكمل المدينة والمنطقة والجامعة والمسافة ونوع السكن" }, { status: 400 });
    }
    const images = Array.isArray(b.images) ? b.images.filter((image: unknown) => typeof image === "string" && image.startsWith("https://")) : [];
    if (b.submit && !images.length) return NextResponse.json({ error: "أضف صورة حقيقية للسكن قبل إرساله للمراجعة" }, { status: 400 });
    const [p] = await db.insert(properties).values({
      ownerId: me.id, title: String(b.title).trim(), description: String(b.description || ""), city: String(b.city), neighborhood: String(b.neighborhood),
      university: String(b.university), distanceKm: Number(b.distanceKm), type: String(b.type), gender: String(b.gender),
      status: b.submit ? "pending_review" : "draft", amenities: Array.isArray(b.amenities) ? b.amenities : [], rules: String(b.rules || ""),
      images,
    }).returning();
    for (const u of unitsIn) {
      await db.insert(units).values({ propertyId: p.id, name: String(u.name).trim(), unitType: String(u.unitType || "غرفة خاصة"), totalBeds: Math.max(1, Number(u.totalBeds || 1)), capacity: Math.max(1, Number(u.capacity || 1)), monthlyPrice: Number(u.monthlyPrice), deposit: Math.max(0, Number(u.deposit || 0)), cleaningFee: Math.max(0, Number(u.cleaningFee || 0)), availableFrom: String(u.availableFrom || new Date().toISOString().slice(0, 10)), semesterDiscountPct: 0 });
    }
    await audit(me, "listing.create", `property:${p.id}`, p.title);
    return NextResponse.json({ property: p });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "سجّل الدخول أولًا" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  try {
    if (b.unitId) { // update/delete unit
      const [u] = await db.select().from(units).where(eq(units.id, Number(b.unitId)));
      if (!u) return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 });
      const [p] = await db.select().from(properties).where(eq(properties.id, u.propertyId));
      if (p.ownerId !== me.id && me.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      if (b.action === "delete_unit") { await db.update(units).set({ status: "inactive" }).where(eq(units.id, u.id)); return NextResponse.json({ ok: true }); }
      const activeBookings = await db.select().from(bookings).where(eq(bookings.unitId, u.id));
      if (b.monthlyPrice && Number(b.monthlyPrice) !== u.monthlyPrice && activeBookings.some(x => x.status === "confirmed")) {
        // allowed but does not alter existing snapshots — note returned
      }
      const [nu] = await db.update(units).set({
        name: String(b.name || u.name), totalBeds: Math.max(1, Number(b.totalBeds || u.totalBeds)), capacity: Math.max(1, Number(b.capacity || u.capacity)),
        monthlyPrice: Math.max(100, Number(b.monthlyPrice || u.monthlyPrice)), deposit: Math.max(0, Number(b.deposit ?? u.deposit)), cleaningFee: Math.max(0, Number(b.cleaningFee ?? u.cleaningFee)), availableFrom: String(b.availableFrom || u.availableFrom),
      }).where(eq(units.id, u.id)).returning();
      return NextResponse.json({ unit: nu, note: "تعديل السعر لا يؤثر في الحجوزات المؤكدة سابقًا (الأسعار مثبّتة في عقد كل حجز)" });
    }
    if (b.action === "add_unit") {
      const [p] = await db.select().from(properties).where(eq(properties.id, Number(b.propertyId)));
      if (!p || (p.ownerId !== me.id && me.role !== "admin")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      if (!String(b.name || "").trim() || !Number.isFinite(Number(b.monthlyPrice)) || Number(b.monthlyPrice) < 100) return NextResponse.json({ error: "أدخل اسم الوحدة وسعرها الشهري الحقيقي" }, { status: 400 });
      const [u] = await db.insert(units).values({ propertyId: p.id, name: String(b.name).trim(), unitType: String(b.unitType || "غرفة خاصة"), totalBeds: Math.max(1, Number(b.totalBeds || 1)), capacity: Math.max(1, Number(b.capacity || 1)), monthlyPrice: Number(b.monthlyPrice), deposit: Math.max(0, Number(b.deposit || 0)), cleaningFee: Math.max(0, Number(b.cleaningFee || 0)), availableFrom: new Date().toISOString().slice(0, 10), semesterDiscountPct: 0 }).returning();
      return NextResponse.json({ unit: u });
    }
    const [p] = await db.select().from(properties).where(eq(properties.id, Number(b.propertyId)));
    if (!p) return NextResponse.json({ error: "السكن غير موجود" }, { status: 404 });
    const isOwner = p.ownerId === me.id, isAdmin = me.role === "admin";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "غير مصرح بتعديل سكن مالك آخر" }, { status: 403 });
    const nextImages = Array.isArray(b.images) ? b.images.filter((image: unknown) => typeof image === "string" && image.startsWith("https://")) : p.images;
    if (p.status === "published" && !nextImages.length) return NextResponse.json({ error: "لا يمكن نشر إعلان من دون صورة حقيقية" }, { status: 400 });
    if (b.action === "transition") {
      const to = String(b.to);
      if (!(TRANSITIONS[p.status] || []).includes(to)) return NextResponse.json({ error: `انتقال غير صالح من ${p.status} إلى ${to}` }, { status: 400 });
      if ((to === "published" || to === "rejected" || to === "suspended") && !isAdmin && !(to === "published" && p.status === "paused")) return NextResponse.json({ error: "النشر والرفض والتعليق من صلاحية الإدارة فقط" }, { status: 403 });
      const [np] = await db.update(properties).set({ status: to, rejectReason: to === "rejected" ? String(b.reason || "") : p.rejectReason }).where(eq(properties.id, p.id)).returning();
      await audit(me, "listing.transition", `property:${p.id}`, `${p.status} → ${to} ${b.reason || ""}`);
      if (isAdmin && p.ownerId !== me.id) await notify(p.ownerId, "تحديث حالة إعلانك", `تم تغيير حالة «${p.title}» إلى ${to}${b.reason ? " — السبب: " + b.reason : ""}`, "listing");
      return NextResponse.json({ property: np });
    }
    // edit fields (owner cannot self-verify / self-publish from review)
    const [np] = await db.update(properties).set({
      title: String(b.title || p.title), description: String(b.description ?? p.description), city: String(b.city || p.city), neighborhood: String(b.neighborhood ?? p.neighborhood),
      university: String(b.university ?? p.university), distanceKm: Number(b.distanceKm ?? p.distanceKm), type: String(b.type || p.type), gender: String(b.gender || p.gender),
      amenities: Array.isArray(b.amenities) ? b.amenities : p.amenities, rules: String(b.rules ?? p.rules), images: nextImages,
      featured: isAdmin && b.featured !== undefined ? Boolean(b.featured) : p.featured,
      status: p.status === "published" ? "published" : p.status,
    }).where(eq(properties.id, p.id)).returning();
    await audit(me, "listing.edit", `property:${p.id}`, np.title);
    return NextResponse.json({ property: np });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
export async function DELETE(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "سجّل الدخول" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const [p] = await db.select().from(properties).where(eq(properties.id, id));
  if (!p || (p.ownerId !== me.id && me.role !== "admin")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const active = await db.select().from(bookings).where(eq(bookings.propertyId, id));
  if (active.some(x => ["confirmed", "awaiting_payment", "pending_owner"].includes(x.status))) return NextResponse.json({ error: "لا يمكن حذف سكن عليه حجوزات نشطة — أرشِفه بدلًا من ذلك" }, { status: 400 });
  await db.update(properties).set({ status: "archived" }).where(eq(properties.id, id));
  await audit(me, "listing.archive", `property:${id}`, p.title);
  return NextResponse.json({ ok: true });
}
