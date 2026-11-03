"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { LayoutDashboard, Users, Building2, ShieldCheck, CalendarCheck, CreditCard, HeartHandshake, LifeBuoy, Flag, FileText, Settings, ScrollText, Plug, Star, Download, Ban, CheckCircle2, Eye, EyeOff, Trash2, PlusCircle, Activity } from "lucide-react";
import { api, post, patch, egp, fmtDate, fmtTime, Ctx, BOOKING_STATUS, LISTING_STATUS, PAY_STATUS } from "@/lib/client";
import { btnP, btnS, btnD, card, Empty, Loading, Field, inp, ConfirmBtn } from "./ui";
import { BookingCard } from "./cards";
import { trackListingReviewMutation, trackListingStatusChange, trackPropertyVerificationDecision } from "@/lib/analytics";

const MODULES = [
  { id: "overview", label: "نظرة تنفيذية", icon: LayoutDashboard },
  { id: "users", label: "المستخدمون والأدوار", icon: Users },
  { id: "listings", label: "العقارات والوحدات", icon: Building2 },
  { id: "verification", label: "مركز التوثيق", icon: ShieldCheck },
  { id: "bookings", label: "الحجوزات", icon: CalendarCheck },
  { id: "payments", label: "المدفوعات والاسترداد", icon: CreditCard },
  { id: "roommates", label: "مطابقة شركاء السكن", icon: HeartHandshake },
  { id: "support", label: "تذاكر الدعم", icon: LifeBuoy },
  { id: "reports", label: "البلاغات والإشراف", icon: Flag },
  { id: "reviews", label: "التقييمات", icon: Star },
  { id: "content", label: "المحتوى والأسئلة", icon: FileText },
  { id: "settings", label: "الإعدادات والسياسات", icon: Settings },
  { id: "audit", label: "سجل التدقيق", icon: ScrollText },
  { id: "health", label: "التكاملات وصحة النظام", icon: Plug },
];
function Stat({ label, value, sub }: any) { return <div className={card + " p-4"}><p className="text-2xl font-black text-primary">{value}</p><p className="text-xs font-bold text-deep mt-0.5">{label}</p>{sub && <p className="text-[11px] text-muted">{sub}</p>}</div>; }
function Bar({ label, v, max, color = "bg-primary" }: any) {
  return <div className="flex items-center gap-3 text-[13px]"><span className="w-36 shrink-0 text-muted font-bold truncate">{label}</span><div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden"><div className={`h-full ${color} rounded-lg transition-all`} style={{ width: max ? `${Math.round((v / max) * 100)}%` : "0%" }} /></div><span className="font-black text-deep w-24 text-end">{typeof v === "number" && v > 50 ? egp(v) : v}</span></div>;
}
const th = "px-3 py-2.5 text-start text-[11px] font-black text-muted whitespace-nowrap";
const td = "px-3 py-2.5 text-[13px] whitespace-nowrap";

export function AdminView({ ctx, initialTab }: { ctx: Ctx; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab || "overview");
  const [d, setD] = useState<any>(null);
  const load = useCallback(async () => { try { setD(await api("/api/admin")); } catch (e: any) { ctx.toast(e.message, "err"); } }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  const act = async (body: any, okMsg = "تم ✅") => { try { const r = await post("/api/admin", body); ctx.toast(r.note || okMsg); load(); return r; } catch (e: any) { ctx.toast(e.message, "err"); } };
  if (!d) return <div className="max-w-7xl mx-auto px-4 py-8"><Loading rows={5} /></div>;
  const s = d.stats;
  const nameOf = (id: number) => d.users.find((u: any) => u.id === id)?.name || `#${id}`;
  const titleOf = (id: number) => d.properties.find((p: any) => p.id === id)?.title || `#${id}`;
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div><h1 className="text-2xl font-black text-deep">وحدة تحكم الإدارة</h1><p className="text-muted text-sm">كل الأرقام محسوبة من سجلات قاعدة البيانات الفعلية • صلاحياتك: {(ctx.user?.permissions || []).length} صلاحية</p></div>
        <div className="ms-auto flex gap-2">
          <button className={btnS} onClick={async () => { const r = await act({ action: "export_bookings" }, "تم تجهيز التصدير"); if (r?.csv) { const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(r.csv); a.download = "sakani-bookings.csv"; a.click(); } }}><Download size={15} /> تصدير الحجوزات CSV</button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar lg:w-60 shrink-0">
          {MODULES.map(m => {
            const badge = m.id === "verification" ? s.pendingVerifications : m.id === "listings" ? s.pendingListings : m.id === "support" ? s.openTickets : m.id === "reports" ? s.openReports : 0;
            return <button key={m.id} onClick={() => setTab(m.id)} className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition ${tab === m.id ? "bg-deep text-white" : "bg-white border border-line text-muted hover:text-primary hover:border-primary"}`}><m.icon size={16} />{m.label}{badge > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-black">{badge}</span>}</button>;
          })}
        </div>
        <div className="flex-1 w-full min-w-0 space-y-4">
          {tab === "overview" && <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <Stat label="إجمالي المستخدمين" value={s.users} sub={`${s.students} طالب • ${s.owners} مالك`} />
              <Stat label="إعلانات منشورة" value={s.published} sub={`${s.pendingListings} بانتظار المراجعة`} />
              <Stat label="أسرّة / وحدات نشطة" value={s.beds} />
              <Stat label="حجوزات مؤكدة ومكتملة" value={s.confirmed} sub={`من إجمالي ${s.bookingsTotal}`} />
              <Stat label="نسبة تحويل الحجوزات" value={s.conversion + "٪"} sub="مؤكد ÷ كل الطلبات" />
              <Stat label="قيمة الحجوزات الإجمالية" value={egp(s.grossBookingValue)} sub="شاملة التأمين" />
              <Stat label="مدفوعات إلكترونية مسجلة" value={s.paymentsRecorded} sub="من مزود دفع فعلي" />
              <Stat label="عمولة المنصة المستحقة" value={egp(s.platformCommission)} />
              <Stat label="تأمينات مسجلة" value={egp(s.depositsHeld)} sub="ليست إيرادًا؛ لا يُنفذ الموقع استردادًا إلكترونيًا" />
              <Stat label="طلبات توثيق معلقة" value={s.pendingVerifications} />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className={card + " p-5"}><h3 className="font-black text-deep mb-3">الحجوزات حسب الحالة</h3>
                <div className="space-y-2">{Object.entries(s.byStatus || {}).map(([k, v]: any) => <Bar key={k} label={BOOKING_STATUS[k]?.ar || k} v={v} max={Math.max(1, ...Object.values(s.byStatus || {}) as number[])} />)}{s.bookingsTotal === 0 && <p className="text-muted text-sm">لا حجوزات بعد</p>}</div>
              </div>
              <div className={card + " p-5"}><h3 className="font-black text-deep mb-3">قيم الحجوزات المسجلة</h3>
                <div className="space-y-2">
                  <Bar label="قيمة حجوزات" v={s.grossBookingValue} max={s.grossBookingValue || 1} />
                  <Bar label="عمولة منصة" v={s.platformCommission} max={s.grossBookingValue || 1} color="bg-accent" />
                  <Bar label="رسوم خدمة" v={s.serviceFees} max={s.grossBookingValue || 1} color="bg-blue-400" />
                  <Bar label="تأمينات قابلة للرد" v={s.depositsHeld} max={s.grossBookingValue || 1} color="bg-violet-400" />
                </div>
                <p className="text-[11px] text-muted mt-3">هذه مبالغ محسوبة من بيانات الحجوزات، ولا تعني أن أي أموال تم تحصيلها. لا توجد بوابة دفع أو معالجة استرداد مفعّلة.</p>
              </div>
            </div>
            <div className={card + " p-5"}><h3 className="font-black text-deep mb-2">مهام الآن</h3>
              <div className="flex flex-wrap gap-2">
                {s.pendingVerifications > 0 && <button className={btnP} onClick={() => setTab("verification")}>راجع {s.pendingVerifications} طلب توثيق</button>}
                {s.pendingListings > 0 && <button className={btnP} onClick={() => setTab("listings")}>راجع {s.pendingListings} إعلان جديد</button>}
                {s.openTickets > 0 && <button className={btnS} onClick={() => setTab("support")}>{s.openTickets} تذكرة دعم مفتوحة</button>}
                {s.openReports > 0 && <button className={btnS} onClick={() => setTab("reports")}>{s.openReports} بلاغ مفتوح</button>}
                {s.pendingVerifications + s.pendingListings + s.openTickets + s.openReports === 0 && <p className="text-muted text-sm">✅ مفيش مهام معلقة — كل شيء مراجع.</p>}
              </div>
            </div>
          </>}
          {tab === "users" && <div className={card + " overflow-x-auto"}><table className="w-full min-w-[760px]">
            <thead className="bg-slate-50 border-b border-line"><tr><th className={th}>المستخدم</th><th className={th}>البريد</th><th className={th}>الدور</th><th className={th}>الحالة</th><th className={th}>موثّق</th><th className={th}>إجراءات</th></tr></thead>
            <tbody>{d.users.map((u: any) => <tr key={u.id} className="border-b border-line/60 hover:bg-mint/30">
              <td className={td}><b className="text-deep">{u.name}</b><span className="block text-[11px] text-muted">{u.university || u.city}</span></td>
              <td className={td} dir="ltr" style={{ textAlign: "right" }}>{u.email}</td>
              <td className={td}><select className="border border-line rounded-lg px-2 py-1 text-xs font-bold" value={u.role} onChange={e => act({ action: "user_role", userId: u.id, role: e.target.value })}><option value="student">طالب</option><option value="owner">مالك</option><option value="admin">مشرف</option></select></td>
              <td className={td}><span className={`text-[11px] font-bold px-2 py-1 rounded-full ${u.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>{u.status === "active" ? "نشط" : "موقوف"}</span></td>
              <td className={td}>{u.isVerified ? "✅" : "—"}</td>
              <td className={td}>{u.id !== ctx.user?.id && (u.status === "active" ? <button className="text-red-600 text-xs font-bold flex items-center gap-1" onClick={() => act({ action: "user_status", userId: u.id, suspend: true })}><Ban size={13} /> إيقاف</button> : <button className="text-emerald-600 text-xs font-bold" onClick={() => act({ action: "user_status", userId: u.id, suspend: false })}>تفعيل</button>)}</td>
            </tr>)}</tbody></table></div>}
          {tab === "listings" && <div className="space-y-3">{d.properties.map((p: any) => {
            const st = LISTING_STATUS[p.status] || { ar: p.status, cls: "" };
            return <div key={p.id} className={card + " p-4 flex flex-wrap gap-3 items-center"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images?.[0]} alt="" className="w-24 h-16 object-cover rounded-lg" />
              <div className="flex-1 min-w-[220px]"><p className="font-black text-deep text-sm flex flex-wrap gap-2 items-center">{p.title}<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.ar}</span>{p.isVerified && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">موثّق</span>}{p.featured && <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full font-black">مميز</span>}</p>
                <p className="text-xs text-muted">المالك: {nameOf(p.ownerId)} • {p.city} • 👁 {p.views} • {d.units.filter((u: any) => u.propertyId === p.id).length} وحدة • أُنشئ {fmtDate(p.createdAt)}</p></div>
              <div className="flex flex-wrap gap-2">
                {p.status === "pending_review" && <><button className={btnP} onClick={async () => { try { const r = await trackListingReviewMutation("approved", p, p.status, () => patch("/api/properties", { propertyId: p.id, action: "transition", to: "published" })); ctx.toast("اتنشر الإعلان ✅"); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}><CheckCircle2 size={15} /> موافقة ونشر</button>
                  <button className={btnD} onClick={async () => { const reason = prompt("سبب الرفض (سيصل للمالك):") || "بيانات ناقصة"; try { await trackListingReviewMutation("rejected", p, p.status, () => patch("/api/properties", { propertyId: p.id, action: "transition", to: "rejected", reason })); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}>رفض</button>
                  <button className={btnS} onClick={async () => { try { const r = await patch("/api/properties", { propertyId: p.id, action: "transition", to: "verification_required" }); trackListingStatusChange(p, p.status, r.property.status); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}>طلب توثيق</button></>}
                {p.status === "published" && <button className={btnD} onClick={async () => { try { const r = await patch("/api/properties", { propertyId: p.id, action: "transition", to: "suspended" }); trackListingStatusChange(p, p.status, r.property.status); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}>تعليق</button>}
                {p.status === "suspended" && <button className={btnP} onClick={async () => { try { const r = await patch("/api/properties", { propertyId: p.id, action: "transition", to: "published" }); trackListingStatusChange(p, p.status, r.property.status); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}>إعادة نشر</button>}
                <button className={btnS} onClick={async () => { try { await patch("/api/properties", { propertyId: p.id, featured: !p.featured }); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}>{p.featured ? "إلغاء التمييز" : "تمييز"}</button>
                <button className={btnS} onClick={() => ctx.nav({ name: "property", id: p.id })}><Eye size={15} /> عرض</button>
              </div>
            </div>; })}</div>}
          {tab === "verification" && (d.verifications.length === 0 ? <div className={card}><Empty title="لا طلبات توثيق" /></div> : <div className="space-y-3">{d.verifications.map((v: any) => (
            <div key={v.id} className={card + " p-4"}>
              <div className="flex flex-wrap gap-2 items-center"><b className="text-deep">{v.type}</b><span className="text-xs text-muted">من {nameOf(v.userId)}{v.propertyId ? ` • سكن: ${titleOf(v.propertyId)}` : " • توثيق حساب"}</span>
                <span className={`ms-auto text-[11px] font-bold px-2.5 py-1 rounded-full ${v.status === "approved" ? "bg-emerald-100 text-emerald-800" : v.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{v.status === "approved" ? "معتمد" : v.status === "rejected" ? "مرفوض" : "بانتظار المراجعة"}</span></div>
              <p className="text-sm text-muted mt-1.5">📄 <span dir="ltr">{v.documentName}</span> — {v.evidenceNote}</p>
              <p className="text-[11px] text-muted">قُدّم {fmtTime(v.createdAt)}{v.reviewedAt && ` • رُوجع ${fmtTime(v.reviewedAt)} بواسطة ${nameOf(v.reviewerId)}`}{v.reason && ` • السبب: ${v.reason}`}</p>
              {v.status === "pending" && <div className="flex gap-2 mt-3">
                <button className={btnP} onClick={async () => { const result = await act({ action: "verification_decide", verificationId: v.id, decision: "approve" }, "تم الاعتماد وظهور الشارة"); if (result?.verification?.status === "approved" && v.propertyId) { const property = d.properties.find((p: any) => p.id === v.propertyId); trackPropertyVerificationDecision(result.verification, property || {}); } }}>اعتماد التوثيق</button>
                <button className={btnD} onClick={async () => { const result = await act({ action: "verification_decide", verificationId: v.id, decision: "reject", reason: prompt("سبب الرفض:") || "المستندات غير واضحة" }); if (result?.verification?.status === "rejected" && v.propertyId) { const property = d.properties.find((p: any) => p.id === v.propertyId); trackPropertyVerificationDecision(result.verification, property || {}); } }}>رفض</button>
              </div>}
            </div>))}</div>)}
          {tab === "bookings" && <AdminBookings ctx={ctx} />}
          {tab === "payments" && <div className={card + " overflow-x-auto"}><table className="w-full min-w-[700px]">
            <thead className="bg-slate-50 border-b border-line"><tr><th className={th}>المرجع</th><th className={th}>الحجز</th><th className={th}>المستخدم</th><th className={th}>المبلغ</th><th className={th}>الطريقة / المزود</th><th className={th}>الحالة</th><th className={th}>التاريخ</th></tr></thead>
            <tbody>{d.payments.map((p: any) => <tr key={p.id} className="border-b border-line/60"><td className={td} dir="ltr" style={{ textAlign: "right" }}>{p.ref}</td><td className={td}>{d.bookings.find((b: any) => b.id === p.bookingId)?.code || p.bookingId}</td><td className={td}>{nameOf(p.userId)}</td><td className={td + (p.amount < 0 ? " text-violet-700 font-bold" : " font-bold")}>{egp(p.amount)}</td><td className={td}>{p.method} ({p.provider})</td><td className={td}>{PAY_STATUS[p.status] || p.status}</td><td className={td}>{fmtTime(p.createdAt)}</td></tr>)}</tbody></table>
            <p className="p-4 text-xs text-muted">لا توجد بوابة دفع مفعّلة؛ لا تُقبل مدفوعات أو استردادات إلكترونية من الموقع حاليًا.</p></div>}
          {tab === "roommates" && <div className={card + " p-5"}><h3 className="font-black text-deep mb-3">ملفات شركاء السكن ({d.roommates.length})</h3>
            <div className="grid sm:grid-cols-2 gap-3">{d.roommates.map((r: any) => <div key={r.id} className="bg-slate-50 rounded-xl p-3.5 text-sm"><b className="text-deep">{nameOf(r.userId)}</b> — {r.city} • {r.university}<p className="text-muted text-xs mt-0.5">ميزانية {egp(r.budget)} • {r.gender} • {r.visible ? "ظاهر" : "مخفي"} • {fmtDate(r.moveIn)}</p></div>)}</div>
            <p className="text-xs text-muted mt-3">أوزان المطابقة الحالية: المدينة ٢٠٪ • الجامعة ٢٠٪ • الميزانية حتى ٢٠٪ • المدة ١٠٪ • نمط الحياة حتى ٣٠٪. المطابقة داخل نفس النوع فقط ولا تُكشف وسائل التواصل قبل القبول.</p></div>}
          {tab === "support" && (d.tickets.length === 0 ? <div className={card}><Empty title="لا تذاكر" /></div> : <div className="space-y-3">{d.tickets.map((t: any) => <TicketRow key={t.id} t={t} userName={nameOf(t.userId)} act={act} />)}</div>)}
          {tab === "reports" && (d.reports.length === 0 ? <div className={card}><Empty title="لا بلاغات" /></div> : <div className="space-y-3">{d.reports.map((r: any) => (
            <div key={r.id} className={card + " p-4"}><p className="font-bold text-deep text-sm">{r.reason}</p><p className="text-sm text-muted mt-1">{r.details || "بدون تفاصيل"}</p>
              <p className="text-[11px] text-muted">من {nameOf(r.reporterId)}{r.propertyId ? ` • عن: ${titleOf(r.propertyId)}` : ""} • {fmtTime(r.createdAt)} • الحالة: {r.status}</p>
               {r.status === "open" && <div className="flex gap-2 mt-2"><button className={btnP} onClick={() => act({ action: "report_resolve", reportId: r.id, status: "resolved" })}>حل البلاغ</button>{r.propertyId && <button className={btnD} onClick={async () => { const property = d.properties.find((p: any) => p.id === r.propertyId); const result = await act({ action: "report_resolve", reportId: r.id, status: "resolved", suspendProperty: true }); if (result && property) trackListingStatusChange(property, property.status, "suspended"); }}>حل + تعليق الإعلان</button>}<button className={btnS} onClick={() => act({ action: "report_resolve", reportId: r.id, status: "dismissed" })}>رفض البلاغ</button></div>}
            </div>))}</div>)}
          {tab === "reviews" && <div className="space-y-3">{d.reviews.map((r: any) => (
            <div key={r.id} className={card + " p-4 flex flex-wrap gap-3 items-center"}><div className="flex-1 min-w-[220px]"><p className="font-bold text-deep text-sm">{nameOf(r.studentId)} {"⭐".repeat(r.rating)} <span className="text-xs text-muted font-medium">عن {titleOf(r.propertyId)}</span></p><p className="text-sm text-muted mt-0.5">{r.text}</p>{r.ownerResponse && <p className="text-xs mt-1"><b>رد المالك:</b> {r.ownerResponse}</p>}</div>
              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${r.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200"}`}>{r.status === "published" ? "منشور" : "مخفي"}</span>
              <button className={btnS} onClick={() => act({ action: "review_moderate", reviewId: r.id, hide: r.status === "published" })}>{r.status === "published" ? <><EyeOff size={14} /> إخفاء</> : <><Eye size={14} /> نشر</>}</button>
            </div>))}</div>}
          {tab === "content" && <ContentAdmin ctx={ctx} d={d} act={act} />}
          {tab === "settings" && <SettingsAdmin ctx={ctx} settings={d.settings} act={act} />}
          {tab === "audit" && <div className={card + " overflow-x-auto"}><table className="w-full min-w-[680px]">
            <thead className="bg-slate-50 border-b border-line"><tr><th className={th}>الوقت</th><th className={th}>الفاعل</th><th className={th}>الإجراء</th><th className={th}>الهدف</th><th className={th}>التفاصيل</th></tr></thead>
            <tbody>{d.audit.map((a: any) => <tr key={a.id} className="border-b border-line/60"><td className={td}>{fmtTime(a.createdAt)}</td><td className={td}>{a.actorName}</td><td className={td} dir="ltr" style={{ textAlign: "right" }}>{a.action}</td><td className={td} dir="ltr" style={{ textAlign: "right" }}>{a.target}</td><td className={td}>{String(a.details).slice(0, 80)}</td></tr>)}</tbody></table>
            {d.audit.length === 0 && <Empty title="لا سجلات تدقيق بعد" sub="تُسجَّل العمليات الحساسة تلقائيًا" />}</div>}
          {tab === "health" && <div className="grid md:grid-cols-2 gap-4">
            {[
              { n: "قاعدة بيانات PostgreSQL", st: "متصلة ✅", d: "Drizzle ORM — كل الجداول والعلاقات فعالة" },
              { n: "بوابة الدفع", st: "غير مفعّلة", d: "لن يُطلب أو يُسجّل أي دفع إلكتروني قبل ربط مزود فعلي واختباره." },
              { n: "رسائل SMS / OTP", st: "غير مفعّلة 🟡", d: "التسجيل بالبريد وكلمة المرور حاليًا؛ OTP ينتظر مزود رسائل" },
              { n: "البريد الإشعاري", st: "إشعارات داخلية فقط ✅", d: "البريد الخارجي يحتاج SMTP/SES — الإشعارات داخل المنصة تعمل فورًا" },
              { n: "تخزين المستندات", st: "أسماء ملفات مسجلة 🟡", d: "ربط S3 خاص بروابط موقعة خطوة ما قبل الإطلاق التجاري" },
              { n: "المصادقة والجلسات", st: "فعّالة ✅", d: "كلمات مرور مشفرة scrypt + جلسات خادم بكوكيز httpOnly" },
            ].map(x => <div key={x.n} className={card + " p-5"}><p className="font-black text-deep flex gap-2 items-center"><Activity size={17} className="text-primary" />{x.n}</p><p className="font-bold text-sm mt-1.5">{x.st}</p><p className="text-[13px] text-muted mt-1">{x.d}</p></div>)}
          </div>}
        </div>
      </div>
    </div>
  );
}
function TicketRow({ t, userName, act }: any) {
  const [reply, setReply] = useState(t.reply || "");
  return <div className={card + " p-4"}>
    <p className="font-black text-deep text-sm">{t.subject} <span className="bg-mint text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full">{t.category}</span></p>
    <p className="text-sm text-muted mt-1">{t.message}</p><p className="text-[11px] text-muted">من {userName} • {fmtTime(t.createdAt)} • {t.status}</p>
    <div className="flex gap-2 mt-2.5"><input className={inp} value={reply} onChange={e => setReply(e.target.value)} placeholder="رد الدعم…" />
      <button className={btnP} onClick={() => act({ action: "ticket_reply", ticketId: t.id, reply, status: "answered" })}>رد</button>
      <button className={btnS} onClick={() => act({ action: "ticket_reply", ticketId: t.id, reply, status: "closed" })}>إغلاق</button></div>
  </div>;
}
function AdminBookings({ ctx }: { ctx: Ctx }) {
  const [list, setList] = useState<any[]>([]);
  const load = useCallback(async () => { const r = await api("/api/bookings"); setList(r.bookings); }, []);
  useEffect(() => { load(); }, [load]);
  return <div className="space-y-4">{list.length === 0 ? <div className={card}><Empty title="لا حجوزات" /></div> : list.map(b => (
    <div key={b.id}>
      <BookingCard ctx={ctx} b={b} reload={load} perspective="admin" />
    </div>))}</div>;
}
function ContentAdmin({ ctx, d, act }: any) {
  const [nf, setNf] = useState({ q: "", a: "" });
  const [ann, setAnn] = useState(d.settings.announcement || "");
  return <div className="space-y-4">
    <div className={card + " p-5 space-y-3"}><h3 className="font-black text-deep">شريط إعلان الصفحة الرئيسية</h3>
      <div className="flex gap-2"><input className={inp} value={ann} onChange={e => setAnn(e.target.value)} /><button className={btnP} onClick={() => act({ action: "settings_save", settings: { announcement: ann } }, "تم تحديث الإعلان")}>نشر</button></div>
    </div>
    <div className={card + " p-5 space-y-3"}><h3 className="font-black text-deep">الأسئلة الشائعة</h3>
      {d.faqs.map((f: any) => <FaqRow key={f.id} f={f} act={act} />)}
      <form className="grid gap-2 pt-2 border-t border-line" onSubmit={async e => { e.preventDefault(); await act({ action: "faq_save", ...nf }, "أُضيف السؤال"); setNf({ q: "", a: "" }); }}>
        <input className={inp} placeholder="سؤال جديد…" value={nf.q} onChange={e => setNf({ ...nf, q: e.target.value })} required />
        <textarea className={inp} placeholder="الإجابة…" rows={2} value={nf.a} onChange={e => setNf({ ...nf, a: e.target.value })} required />
        <button className={btnP + " w-fit"}><PlusCircle size={15} /> إضافة سؤال</button>
      </form>
      <p className="text-xs text-muted">تغيّر المحتوى يظهر فورًا في الصفحة الرئيسية.</p>
      <button className={btnS} onClick={() => ctx.nav({ name: "home" })}>معاينة الصفحة الرئيسية</button>
    </div>
  </div>;
}
function FaqRow({ f, act }: any) {
  const [q, setQ] = useState(f.q); const [a, setA] = useState(f.a); const [open, setOpen] = useState(false);
  return <div className="bg-slate-50 rounded-xl p-3">
    <div className="flex gap-2 items-center"><p className="font-bold text-deep text-sm flex-1">{f.q}</p>
      <button className="text-xs text-primary font-bold" onClick={() => setOpen(!open)}>تعديل</button>
      <button className="text-xs text-red-600 font-bold" onClick={() => act({ action: "faq_delete", faqId: f.id })}><Trash2 size={14} /></button></div>
    {open && <div className="grid gap-2 mt-2"><input className={inp} value={q} onChange={e => setQ(e.target.value)} /><textarea className={inp} rows={2} value={a} onChange={e => setA(e.target.value)} /><button className={btnP + " w-fit"} onClick={() => act({ action: "faq_save", faqId: f.id, q, a, sort: f.sort })}>حفظ</button></div>}
  </div>;
}
function SettingsAdmin({ settings, act }: any) {
  const [s, setS] = useState<any>({ ...settings, citiesTxt: (settings.cities || []).join("، "), unisTxt: (settings.universities || []).join("\n"), amenitiesTxt: (settings.amenities || []).join("، ") });
  const save = () => act({ action: "settings_save", settings: {
    commissionPct: Number(s.commissionPct), serviceFeePct: Number(s.serviceFeePct),
    siteName: s.siteName, supportEmail: s.supportEmail, announcement: s.announcement,
    cities: s.citiesTxt.split(/[،,]/).map((x: string) => x.trim()).filter(Boolean),
    universities: s.unisTxt.split("\n").map((x: string) => x.trim()).filter(Boolean),
    amenities: s.amenitiesTxt.split(/[،,]/).map((x: string) => x.trim()).filter(Boolean),
  } }, "تم حفظ الإعدادات");
  return <form className={card + " p-5 space-y-5"} onSubmit={e => { e.preventDefault(); save(); }}>
    <h3 className="font-black text-deep text-lg">العمولات والرسوم</h3>
    <div className="grid sm:grid-cols-3 gap-4">
      <Field label="عمولة المنصة من المالك (٪)" hint="تنطبق على الحجوزات الجديدة فقط"><input type="number" min={0} max={30} className={inp} value={s.commissionPct} onChange={e => setS({ ...s, commissionPct: e.target.value })} /></Field>
      <Field label="رسوم خدمة الطالب (٪)"><input type="number" min={0} max={20} className={inp} value={s.serviceFeePct} onChange={e => setS({ ...s, serviceFeePct: e.target.value })} /></Field>
      <Field label="وضع الدفع"><input className={inp} value="غير مفعّل" readOnly /><span className="text-xs text-muted">لا يمكن تفعيله قبل ربط بوابة دفع فعلية.</span></Field>
    </div>
    <p className="rounded-xl bg-amber-50 text-amber-900 border border-amber-200 p-3 text-sm">سياسة الإلغاء والاسترداد عبر الموقع غير مفعّلة؛ لا يُنفّذ الموقع أي استرداد إلكتروني.</p>
    <h3 className="font-black text-deep text-lg">بيانات المنصة الأساسية</h3>
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="اسم المنصة"><input className={inp} value={s.siteName} onChange={e => setS({ ...s, siteName: e.target.value })} /></Field>
      <Field label="بريد الدعم"><input className={inp} dir="ltr" style={{ textAlign: "right" }} value={s.supportEmail} onChange={e => setS({ ...s, supportEmail: e.target.value })} /></Field>
      <div className="sm:col-span-2"><Field label="المدن المدعومة (افصل بفاصلة)"><input className={inp} value={s.citiesTxt} onChange={e => setS({ ...s, citiesTxt: e.target.value })} /></Field></div>
      <div className="sm:col-span-2"><Field label="الجامعات (سطر لكل جامعة)"><textarea className={inp} rows={4} value={s.unisTxt} onChange={e => setS({ ...s, unisTxt: e.target.value })} /></Field></div>
      <div className="sm:col-span-2"><Field label="المرافق المتاحة للاختيار (افصل بفاصلة)"><textarea className={inp} rows={2} value={s.amenitiesTxt} onChange={e => setS({ ...s, amenitiesTxt: e.target.value })} /></Field></div>
    </div>
    <button className={btnP}>حفظ كل الإعدادات</button>
    <p className="text-xs text-muted">⚠️ كل تغيير هنا يُسجَّل في سجل التدقيق. أسعار الحجوزات القائمة مثبّتة في عقودها ولن تتغير.</p>
  </form>;
}
