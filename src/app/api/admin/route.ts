import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, properties, units, bookings, payments, verifications, supportTickets, reports, auditLogs, faqs, reviews, settingsTable, roommateProfiles } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { currentUser, getSettings, publicUser, audit, notify, DEFAULT_SETTINGS } from "@/lib/server";

async function guard(perm?: string) {
  const me = await currentUser();
  if (!me || me.role !== "admin") return { err: NextResponse.json({ error: "صلاحية إدارة مطلوبة" }, { status: 403 }) };
  if (perm && !(me.permissions || []).includes(perm)) return { err: NextResponse.json({ error: `صلاحية ${perm} مطلوبة` }, { status: 403 }) };
  return { me };
}
export async function GET() {
  const g = await guard(); if ("err" in g && g.err) return g.err;
  const [allUsers, allProps, allUnits, allBookings, allPayments, allVers, allTickets, allReports, logs, allFaqs, settings, allReviews, roommates] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)), db.select().from(properties).orderBy(desc(properties.createdAt)),
    db.select().from(units), db.select().from(bookings).orderBy(desc(bookings.createdAt)), db.select().from(payments).orderBy(desc(payments.createdAt)),
    db.select().from(verifications).orderBy(desc(verifications.createdAt)), db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)),
    db.select().from(reports).orderBy(desc(reports.createdAt)), db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100),
    db.select().from(faqs).orderBy(asc(faqs.sort)), getSettings(), db.select().from(reviews).orderBy(desc(reviews.createdAt)), db.select().from(roommateProfiles),
  ]);
  const paid = allPayments.filter(p => p.provider !== "sandbox" && p.status === "succeeded");
  const refunds = allPayments.filter(p => p.provider !== "sandbox" && p.status === "refunded");
  const confirmed = allBookings.filter(b => ["confirmed", "completed"].includes(b.status));
  const stats = {
    users: allUsers.length, students: allUsers.filter(u => u.role === "student").length, owners: allUsers.filter(u => u.role === "owner").length,
    published: allProps.filter(p => p.status === "published").length, pendingListings: allProps.filter(p => p.status === "pending_review").length,
    beds: allUnits.filter(u => u.status === "active").reduce((a, u) => a + u.totalBeds, 0),
    pendingVerifications: allVers.filter(v => v.status === "pending").length,
    bookingsTotal: allBookings.length, confirmed: confirmed.length,
    byStatus: Object.fromEntries([...new Set(allBookings.map(b => b.status))].map(s => [s, allBookings.filter(b => b.status === s).length])),
    grossBookingValue: confirmed.reduce((a, b) => a + b.total, 0),
    paymentsRecorded: paid.length,
    depositsHeld: confirmed.reduce((a, b) => a + b.depositAmount, 0),
    platformCommission: confirmed.reduce((a, b) => a + b.platformFee, 0),
    serviceFees: confirmed.reduce((a, b) => a + b.serviceFee, 0),
    refunds: Math.abs(refunds.reduce((a, p) => a + p.amount, 0)) + allBookings.reduce((a, b) => a + b.refundAmount, 0) * 0,
    openTickets: allTickets.filter(t => t.status === "open").length, openReports: allReports.filter(r => r.status === "open").length,
    roommateProfiles: roommates.length,
    conversion: allBookings.length ? Math.round((confirmed.length / allBookings.length) * 100) : 0,
  };
  return NextResponse.json({
    stats, settings,
    users: allUsers.map(publicUser), properties: allProps, units: allUnits, bookings: allBookings, payments: allPayments.filter(p => p.provider !== "sandbox"),
    verifications: allVers, tickets: allTickets, reports: allReports, audit: logs, faqs: allFaqs, reviews: allReviews, roommates,
  });
}
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  try {
    switch (b.action) {
      case "user_status": {
        const g = await guard("users.suspend"); if ("err" in g && g.err) return g.err;
        if (Number(b.userId) === g.me!.id) return NextResponse.json({ error: "لا يمكنك إيقاف حسابك" }, { status: 400 });
        const [u] = await db.update(users).set({ status: b.suspend ? "suspended" : "active" }).where(eq(users.id, Number(b.userId))).returning();
        await audit(g.me, b.suspend ? "user.suspend" : "user.activate", `user:${u.id}`, u.email);
        return NextResponse.json({ user: publicUser(u) });
      }
      case "user_role": {
        const g = await guard("staff.permissions.manage"); if ("err" in g && g.err) return g.err;
        const role = ["student", "owner", "admin"].includes(b.role) ? b.role : "student";
        const perms = role === "admin" ? (Array.isArray(b.permissions) ? b.permissions : ["users.read", "listings.review", "bookings.read"]) : [];
        const [u] = await db.update(users).set({ role, permissions: perms }).where(eq(users.id, Number(b.userId))).returning();
        await audit(g.me, "user.role", `user:${u.id}`, role);
        return NextResponse.json({ user: publicUser(u) });
      }
      case "verification_decide": {
        const g = await guard("verification.review"); if ("err" in g && g.err) return g.err;
        const [v] = await db.select().from(verifications).where(eq(verifications.id, Number(b.verificationId)));
        if (!v) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
        if (v.userId === g.me!.id) return NextResponse.json({ error: "لا يمكنك اعتماد توثيقك بنفسك" }, { status: 403 });
        const approve = b.decision === "approve";
        const [nv] = await db.update(verifications).set({ status: approve ? "approved" : "rejected", reviewerId: g.me!.id, reason: String(b.reason || ""), reviewedAt: new Date() }).where(eq(verifications.id, v.id)).returning();
        if (v.propertyId) {
          if (approve) await db.update(properties).set({ isVerified: true, verifiedAt: new Date() }).where(eq(properties.id, v.propertyId));
          else await db.update(properties).set({ isVerified: false, status: "verification_required" }).where(eq(properties.id, v.propertyId));
        } else if (approve) await db.update(users).set({ isVerified: true }).where(eq(users.id, v.userId));
        await notify(v.userId, approve ? "تم اعتماد التوثيق ✅" : "تم رفض التوثيق", approve ? "شارة التوثيق ظهرت دلوقتي على سكنك" : String(b.reason || "راجع المستندات وقدّم تاني"), "verification");
        await audit(g.me, "verification." + (approve ? "approve" : "reject"), `verification:${v.id}`, String(b.reason || ""));
        return NextResponse.json({ verification: nv });
      }
      case "ticket_reply": {
        const g = await guard("users.read"); if ("err" in g && g.err) return g.err;
        const [t] = await db.update(supportTickets).set({ reply: String(b.reply || ""), status: String(b.status || "answered") }).where(eq(supportTickets.id, Number(b.ticketId))).returning();
        await notify(t.userId, "رد الدعم على تذكرتك", String(b.reply || "").slice(0, 140), "support");
        await audit(g.me, "ticket.reply", `ticket:${t.id}`, t.status);
        return NextResponse.json({ ticket: t });
      }
      case "report_resolve": {
        const g = await guard("listings.review"); if ("err" in g && g.err) return g.err;
        const [r] = await db.update(reports).set({ status: String(b.status || "resolved") }).where(eq(reports.id, Number(b.reportId))).returning();
        if (b.suspendProperty && r.propertyId) await db.update(properties).set({ status: "suspended" }).where(eq(properties.id, r.propertyId));
        await audit(g.me, "report.resolve", `report:${r.id}`, r.status + (b.suspendProperty ? " +suspend" : ""));
        return NextResponse.json({ report: r });
      }
      case "review_moderate": {
        const g = await guard("listings.review"); if ("err" in g && g.err) return g.err;
        const [r] = await db.update(reviews).set({ status: b.hide ? "hidden" : "published" }).where(eq(reviews.id, Number(b.reviewId))).returning();
        return NextResponse.json({ review: r });
      }
      case "settings_save": {
        const g = await guard("settings.manage"); if ("err" in g && g.err) return g.err;
        const cur = await getSettings();
        const next = { ...cur, ...(b.settings || {}) };
        const [storedSettings] = await db.select({ data: settingsTable.data }).from(settingsTable).where(eq(settingsTable.id, 1));
        const storedData = (storedSettings?.data || {}) as Record<string, unknown>;
        next.commissionPct = Math.min(30, Math.max(0, Number(next.commissionPct)));
        next.serviceFeePct = Math.min(20, Math.max(0, Number(next.serviceFeePct)));
        next.freeCancelDays = 0;
        next.partialCancelDays = 0;
        next.partialRefundPct = 0;
        next.paymentMode = "disabled";
        const persistedSettings = {
          ...next,
          ...(typeof storedData.adminPasswordVersion === "string" && { adminPasswordVersion: storedData.adminPasswordVersion }),
          ...(typeof storedData.universityOptionsVersion === "string" && { universityOptionsVersion: storedData.universityOptionsVersion }),
        };
        await db.update(settingsTable).set({ data: persistedSettings as unknown as Record<string, unknown>, updatedAt: new Date() }).where(eq(settingsTable.id, 1));
        await audit(g.me, "settings.update", "settings:1", JSON.stringify(Object.keys(b.settings || {})));
        return NextResponse.json({ settings: next, note: "الإعدادات الجديدة تنطبق على الحجوزات الجديدة فقط — الحجوزات القائمة تحتفظ بعقود أسعارها المثبتة" });
      }
      case "faq_save": {
        const g = await guard("content.manage"); if ("err" in g && g.err) return g.err;
        if (b.faqId) { const [f] = await db.update(faqs).set({ q: String(b.q), a: String(b.a), sort: Number(b.sort || 0) }).where(eq(faqs.id, Number(b.faqId))).returning(); return NextResponse.json({ faq: f }); }
        const [f] = await db.insert(faqs).values({ q: String(b.q || ""), a: String(b.a || ""), sort: Number(b.sort || 99) }).returning();
        await audit(g.me, "faq.create", `faq:${f.id}`, f.q);
        return NextResponse.json({ faq: f });
      }
      case "faq_delete": {
        const g = await guard("content.manage"); if ("err" in g && g.err) return g.err;
        await db.delete(faqs).where(eq(faqs.id, Number(b.faqId)));
        return NextResponse.json({ ok: true });
      }
      case "refund_initiate": {
        const g = await guard("refunds.initiate"); if ("err" in g && g.err) return g.err;
        return NextResponse.json({ error: "الاسترداد الإلكتروني غير متاح قبل ربط بوابة دفع فعلية." }, { status: 503 });
      }
      case "export_bookings": {
        const g = await guard("bookings.read"); if ("err" in g && g.err) return g.err;
        const rows = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
        const csv = "code,status,checkIn,checkOut,total,payableNow,platformFee,deposit\n" + rows.map(r => [r.code, r.status, r.checkIn, r.checkOut, r.total, r.payableNow, r.platformFee, r.depositAmount].join(",")).join("\n");
        return NextResponse.json({ csv, count: rows.length });
      }
      default: return NextResponse.json({ error: "إجراء غير معروف", defaults: DEFAULT_SETTINGS }, { status: 400 });
    }
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
