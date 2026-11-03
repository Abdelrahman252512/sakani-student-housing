import { NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, reviews, bookings, conversations, messages, notifications, roommateProfiles, roommateRequests, supportTickets, reports, verifications, properties, users } from "@/db/schema";
import { eq, desc, or, and, inArray } from "drizzle-orm";
import { currentUser, notify, matchScore, audit } from "@/lib/server";

export async function GET(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "سجّل الدخول" }, { status: 401 });
  const sp = new URL(req.url).searchParams; const kind = sp.get("kind");
  try {
    if (kind === "favorites") {
      const favs = await db.select().from(favorites).where(eq(favorites.userId, me.id));
      const props = favs.length ? await db.select().from(properties).where(inArray(properties.id, favs.map(f => f.propertyId))) : [];
      const { units: unitsTable, reviews: reviewsTable } = await import("@/db/schema");
      const uns = props.length ? await db.select().from(unitsTable).where(inArray(unitsTable.propertyId, props.map(p => p.id))) : [];
      const revs = props.length ? await db.select().from(reviewsTable).where(inArray(reviewsTable.propertyId, props.map(p => p.id))) : [];
      const enriched = props.map(p => { const pu = uns.filter(u => u.propertyId === p.id); const pr = revs.filter(r => r.propertyId === p.id && r.status === "published"); return { ...p, units: pu, minPrice: pu.length ? Math.min(...pu.map(u => u.monthlyPrice)) : null, rating: pr.length ? Math.round((pr.reduce((a, r) => a + r.rating, 0) / pr.length) * 10) / 10 : null, reviewCount: pr.length }; });
      return NextResponse.json({ favorites: favs, properties: enriched });
    }
    if (kind === "notifications") {
      const list = await db.select().from(notifications).where(eq(notifications.userId, me.id)).orderBy(desc(notifications.createdAt)).limit(50);
      return NextResponse.json({ notifications: list, unread: list.filter(n => !n.isRead).length });
    }
    if (kind === "conversations") {
      const convs = await db.select().from(conversations).where(or(eq(conversations.studentId, me.id), eq(conversations.ownerId, me.id))).orderBy(desc(conversations.updatedAt));
      const otherIds = [...new Set(convs.map(c => c.studentId === me.id ? c.ownerId : c.studentId))];
      const others = otherIds.length ? await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(inArray(users.id, otherIds)) : [];
      const props = convs.length ? await db.select({ id: properties.id, title: properties.title }).from(properties).where(inArray(properties.id, convs.map(c => c.propertyId || 0))) : [];
      const allMsgs = convs.length ? await db.select().from(messages).where(inArray(messages.conversationId, convs.map(c => c.id))) : [];
      return NextResponse.json({ conversations: convs.map(c => ({ ...c, other: others.find(o => o.id === (c.studentId === me.id ? c.ownerId : c.studentId)), property: props.find(p => p.id === c.propertyId), unread: allMsgs.filter(m => m.conversationId === c.id && m.senderId !== me.id && !m.isRead).length })) });
    }
    if (kind === "messages") {
      const cid = Number(sp.get("conversationId"));
      const [c] = await db.select().from(conversations).where(eq(conversations.id, cid));
      if (!c || (c.studentId !== me.id && c.ownerId !== me.id)) return NextResponse.json({ error: "غير مصرح بقراءة محادثة غيرك" }, { status: 403 });
      await db.update(messages).set({ isRead: true }).where(and(eq(messages.conversationId, cid), eq(messages.isRead, false)));
      const msgs = await db.select().from(messages).where(eq(messages.conversationId, cid)).orderBy(messages.createdAt);
      return NextResponse.json({ messages: msgs });
    }
    if (kind === "roommates") {
      const profiles = await db.select().from(roommateProfiles).where(eq(roommateProfiles.visible, true));
      const mine = profiles.find(p => p.userId === me.id) || null;
      const us = await db.select({ id: users.id, name: users.name, university: users.university, faculty: users.faculty }).from(users).where(inArray(users.id, profiles.map(p => p.userId)));
      const list = profiles.filter(p => p.userId !== me.id && (!mine || p.gender === mine.gender)).map(p => ({ ...p, user: us.find(u => u.id === p.userId), match: mine ? matchScore({ city: mine.city, university: mine.university, budget: mine.budget, prefs: mine.prefs, durationMonths: mine.durationMonths }, { city: p.city, university: p.university, budget: p.budget, prefs: p.prefs, durationMonths: p.durationMonths }) : null })).sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
      const reqs = await db.select().from(roommateRequests).where(or(eq(roommateRequests.fromId, me.id), eq(roommateRequests.toId, me.id))).orderBy(desc(roommateRequests.createdAt));
      const reqUsers = reqs.length ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, [...new Set([...reqs.map(r => r.fromId), ...reqs.map(r => r.toId)])])) : [];
      return NextResponse.json({ mine, profiles: list, requests: reqs.map(r => ({ ...r, from: reqUsers.find(u => u.id === r.fromId), to: reqUsers.find(u => u.id === r.toId) })) });
    }
    if (kind === "tickets") {
      const list = me.role === "admin" ? await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)) : await db.select().from(supportTickets).where(eq(supportTickets.userId, me.id)).orderBy(desc(supportTickets.createdAt));
      const us = list.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, list.map(t => t.userId))) : [];
      return NextResponse.json({ tickets: list.map(t => ({ ...t, user: us.find(u => u.id === t.userId) })) });
    }
    if (kind === "verifications") {
      const list = me.role === "admin" ? await db.select().from(verifications).orderBy(desc(verifications.createdAt)) : await db.select().from(verifications).where(eq(verifications.userId, me.id)).orderBy(desc(verifications.createdAt));
      const us = list.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, list.map(v => v.userId))) : [];
      const props = list.length ? await db.select({ id: properties.id, title: properties.title }).from(properties).where(inArray(properties.id, list.map(v => v.propertyId || 0))) : [];
      return NextResponse.json({ verifications: list.map(v => ({ ...v, user: us.find(u => u.id === v.userId), property: props.find(p => p.id === v.propertyId) })) });
    }
    return NextResponse.json({ error: "kind?" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "سجّل الدخول أولًا" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  try {
    switch (b.action) {
      case "toggle_fav": {
        const pid = Number(b.propertyId);
        const [ex] = await db.select().from(favorites).where(and(eq(favorites.userId, me.id), eq(favorites.propertyId, pid)));
        if (ex) { await db.delete(favorites).where(eq(favorites.id, ex.id)); return NextResponse.json({ fav: false }); }
        await db.insert(favorites).values({ userId: me.id, propertyId: pid }); return NextResponse.json({ fav: true });
      }
      case "review": {
        const bkId = Number(b.bookingId);
        const [bk] = await db.select().from(bookings).where(eq(bookings.id, bkId));
        if (!bk || bk.studentId !== me.id) return NextResponse.json({ error: "الحجز غير موجود" }, { status: 403 });
        if (bk.status !== "completed") return NextResponse.json({ error: "التقييم متاح فقط بعد انتهاء الإقامة (حجز مكتمل)" }, { status: 400 });
        const [dup] = await db.select().from(reviews).where(eq(reviews.bookingId, bkId));
        if (dup) return NextResponse.json({ error: "قيّمت الحجز ده قبل كده" }, { status: 409 });
        const rating = Math.min(5, Math.max(1, Number(b.rating || 5)));
        const [r] = await db.insert(reviews).values({ propertyId: bk.propertyId, bookingId: bkId, studentId: me.id, rating, text: String(b.text || "").trim() }).returning();
        await notify(bk.ownerId, "تقييم جديد لسكنك", `قيّم طالب سكنك بـ${rating} نجوم`, "review");
        return NextResponse.json({ review: r });
      }
      case "review_respond": {
        const [r] = await db.select().from(reviews).where(eq(reviews.id, Number(b.reviewId)));
        if (!r) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
        const [p] = await db.select().from(properties).where(eq(properties.id, r.propertyId));
        if (p.ownerId !== me.id && me.role !== "admin") return NextResponse.json({ error: "الرد من مالك السكن فقط" }, { status: 403 });
        const [nr] = await db.update(reviews).set(me.role === "admin" && b.hide ? { status: "hidden" } : { ownerResponse: String(b.text || "") }).where(eq(reviews.id, r.id)).returning();
        return NextResponse.json({ review: nr });
      }
      case "start_conversation": {
        const [p] = await db.select().from(properties).where(eq(properties.id, Number(b.propertyId)));
        if (!p) return NextResponse.json({ error: "السكن غير موجود" }, { status: 404 });
        if (p.ownerId === me.id) return NextResponse.json({ error: "ده سكنك" }, { status: 400 });
        let [c] = await db.select().from(conversations).where(and(eq(conversations.studentId, me.id), eq(conversations.ownerId, p.ownerId), eq(conversations.propertyId, p.id)));
        if (!c) [c] = await db.insert(conversations).values({ studentId: me.id, ownerId: p.ownerId, propertyId: p.id, lastText: "" }).returning();
        if (b.text) {
          await db.insert(messages).values({ conversationId: c.id, senderId: me.id, text: String(b.text) });
          await db.update(conversations).set({ lastText: String(b.text), updatedAt: new Date() }).where(eq(conversations.id, c.id));
          await notify(p.ownerId, "رسالة جديدة عن سكنك", String(b.text).slice(0, 120), "message");
        }
        return NextResponse.json({ conversation: c });
      }
      case "send_message": {
        const cid = Number(b.conversationId);
        const [c] = await db.select().from(conversations).where(eq(conversations.id, cid));
        if (!c || (c.studentId !== me.id && c.ownerId !== me.id)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        const [m] = await db.insert(messages).values({ conversationId: cid, senderId: me.id, text: String(b.text || "").trim() }).returning();
        await db.update(conversations).set({ lastText: m.text, updatedAt: new Date() }).where(eq(conversations.id, cid));
        await notify(c.studentId === me.id ? c.ownerId : c.studentId, "رسالة جديدة", m.text.slice(0, 120), "message");
        return NextResponse.json({ message: m });
      }
      case "read_notifications": {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, me.id));
        return NextResponse.json({ ok: true });
      }
      case "roommate_profile": {
      const budget = Number(b.budget);
      const durationMonths = Number(b.durationMonths);
      if (!String(b.city || "").trim() || !String(b.university || "").trim() || !["بنين", "بنات"].includes(String(b.gender)) || !Number.isFinite(budget) || budget < 300 || !Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 24) {
        return NextResponse.json({ error: "أكمل بيانات المدينة والجامعة والنوع والميزانية والمدة" }, { status: 400 });
      }
      const vals = { userId: me.id, city: String(b.city), university: String(b.university), budget, moveIn: String(b.moveIn || new Date().toISOString().slice(0, 10)), durationMonths, gender: String(b.gender), prefs: (b.prefs || {}) as Record<string, string>, bio: String(b.bio || ""), visible: b.visible !== false };
        const [ex] = await db.select().from(roommateProfiles).where(eq(roommateProfiles.userId, me.id));
        const [p] = ex ? await db.update(roommateProfiles).set(vals).where(eq(roommateProfiles.id, ex.id)).returning() : await db.insert(roommateProfiles).values(vals).returning();
        return NextResponse.json({ profile: p });
      }
      case "roommate_request": {
        const toId = Number(b.toId);
        if (toId === me.id) return NextResponse.json({ error: "لا يمكنك مراسلة نفسك" }, { status: 400 });
        const [mine] = await db.select().from(roommateProfiles).where(eq(roommateProfiles.userId, me.id));
        const [theirs] = await db.select().from(roommateProfiles).where(eq(roommateProfiles.userId, toId));
        if (!theirs || !theirs.visible) return NextResponse.json({ error: "الملف غير متاح" }, { status: 404 });
        if (mine && theirs.gender !== mine.gender) return NextResponse.json({ error: "المطابقة تتم داخل نفس النوع فقط حفاظًا على الخصوصية" }, { status: 400 });
        const dup = await db.select().from(roommateRequests).where(and(eq(roommateRequests.fromId, me.id), eq(roommateRequests.toId, toId), eq(roommateRequests.status, "pending")));
        if (dup.length) return NextResponse.json({ error: "بعت طلب قبل كده ولسه بانتظار الرد" }, { status: 409 });
        const sc = mine ? matchScore({ city: mine.city, university: mine.university, budget: mine.budget, prefs: mine.prefs, durationMonths: mine.durationMonths }, { city: theirs.city, university: theirs.university, budget: theirs.budget, prefs: theirs.prefs, durationMonths: theirs.durationMonths }).score : 0;
        const [r] = await db.insert(roommateRequests).values({ fromId: me.id, toId, message: String(b.message || ""), score: sc }).returning();
        await notify(toId, "طلب شريك سكن جديد", `${me.name} مهتم يشاركك السكن (توافق ${sc}٪)`, "roommate");
        return NextResponse.json({ request: r });
      }
      case "roommate_respond": {
        const [r] = await db.select().from(roommateRequests).where(eq(roommateRequests.id, Number(b.requestId)));
        if (!r) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
        if (b.decision === "withdraw") {
          if (r.fromId !== me.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
          const [nr] = await db.update(roommateRequests).set({ status: "withdrawn" }).where(eq(roommateRequests.id, r.id)).returning();
          return NextResponse.json({ request: nr });
        }
        if (r.toId !== me.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        const [nr] = await db.update(roommateRequests).set({ status: b.decision === "accept" ? "accepted" : "rejected" }).where(eq(roommateRequests.id, r.id)).returning();
        await notify(r.fromId, b.decision === "accept" ? "قُبل طلب شريك السكن 🎉" : "تم رفض طلب شريك السكن", b.decision === "accept" ? "دلوقتي تقدروا تتواصلوا عبر الرسائل" : "", "roommate");
        return NextResponse.json({ request: nr });
      }
      case "ticket": {
        const [t] = await db.insert(supportTickets).values({ userId: me.id, category: String(b.category || "عام"), subject: String(b.subject || "").trim(), message: String(b.message || "") }).returning();
        if (!t.subject) return NextResponse.json({ error: "عنوان التذكرة مطلوب" }, { status: 400 });
        return NextResponse.json({ ticket: t });
      }
      case "report": {
        const [r] = await db.insert(reports).values({ reporterId: me.id, propertyId: b.propertyId ? Number(b.propertyId) : null, reason: String(b.reason || "معلومات غير دقيقة"), details: String(b.details || "") }).returning();
        await audit(me, "report.create", `property:${b.propertyId}`, r.reason);
        return NextResponse.json({ report: r });
      }
      case "verification_submit": {
        if (me.role !== "owner" && me.role !== "admin") return NextResponse.json({ error: "التوثيق للملاك" }, { status: 403 });
        const [v] = await db.insert(verifications).values({ userId: me.id, propertyId: b.propertyId ? Number(b.propertyId) : null, type: String(b.type || "ملكية العقار"), evidenceNote: String(b.evidenceNote || ""), documentName: String(b.documentName || "document.pdf") }).returning();
        return NextResponse.json({ verification: v });
      }
      default: return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
    }
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
