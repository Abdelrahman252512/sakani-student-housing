"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { CalendarCheck, Heart, Bell, UserRound, LayoutDashboard, Building2, PlusCircle, ShieldCheck, Star, Wallet, Trash2, Pencil, Pause, Play, Send, BedDouble, TrendingUp, FileCheck2, Archive } from "lucide-react";
import { api, post, patch, egp, fmtDate, fmtTime, Ctx, LISTING_STATUS, PROP_TYPES, UNIT_TYPES } from "@/lib/client";
import { btnP, btnS, btnD, card, Empty, Loading, Field, inp, Modal, VerifiedBadge, ConfirmBtn } from "./ui";
import { BookingCard, PropertyCard } from "./cards";
import { trackEvent, trackListingStatusChange } from "@/lib/analytics";

function SideNav({ items, tab, setTab }: any) {
  return <div className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar lg:w-56 shrink-0">
    {items.map((it: any) => <button key={it.id} onClick={() => setTab(it.id)} className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition ${tab === it.id ? "bg-primary text-white shadow shadow-primary/25" : "bg-white border border-line text-muted hover:text-primary hover:border-primary"}`}><it.icon size={17} />{it.label}{it.count !== undefined && it.count > 0 && <span className={`text-[10px] px-1.5 rounded-full ${tab === it.id ? "bg-white text-primary" : "bg-red-500 text-white"}`}>{it.count}</span>}</button>)}
  </div>;
}

export function StudentDash({ ctx, initialTab }: { ctx: Ctx; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab || "bookings");
  const [bookings, setBookings] = useState<any[]>([]);
  const [favs, setFavs] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: ctx.user?.name || "", phone: ctx.user?.phone || "", university: ctx.user?.university || "", faculty: ctx.user?.faculty || "", city: ctx.user?.city || "دمياط", currentPassword: "", newPassword: "" });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, f, n] = await Promise.all([api("/api/bookings"), api("/api/social?kind=favorites"), api("/api/social?kind=notifications")]);
      setBookings(b.bookings); setFavs(f.properties); setNotifs(n.notifications);
    } catch (e: any) { ctx.toast(e.message, "err"); } finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  const upcoming = bookings.filter(b => ["pending_owner", "awaiting_payment", "confirmed"].includes(b.status));
  const past = bookings.filter(b => !["pending_owner", "awaiting_payment", "confirmed"].includes(b.status));
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div><h1 className="text-2xl font-black text-deep">أهلًا {ctx.user?.name} 👋</h1><p className="text-muted text-sm">{ctx.user?.university || "طالب"} {ctx.user?.faculty && `• كلية ${ctx.user.faculty}`}</p></div>
        <div className="flex gap-3 ms-auto">
          <div className={card + " px-4 py-2.5 text-center"}><p className="text-xl font-black text-primary">{upcoming.length}</p><p className="text-[11px] text-muted font-bold">حجز نشط</p></div>
          <div className={card + " px-4 py-2.5 text-center"}><p className="text-xl font-black text-primary">{favs.length}</p><p className="text-[11px] text-muted font-bold">في المفضلة</p></div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <SideNav tab={tab} setTab={setTab} items={[
          { id: "bookings", label: "حجوزاتي", icon: CalendarCheck, count: upcoming.filter(b => b.status === "awaiting_payment").length },
          { id: "favorites", label: "المفضلة", icon: Heart },
          { id: "notifications", label: "الإشعارات", icon: Bell, count: notifs.filter(n => !n.isRead).length },
          { id: "profile", label: "بياناتي والأمان", icon: UserRound },
        ]} />
        <div className="flex-1 w-full min-w-0">
          {loading ? <Loading /> : tab === "bookings" ? (
            <div className="space-y-4">
              {upcoming.length === 0 && past.length === 0 ? <div className={card}><Empty title="لسه معندكش حجوزات" sub="ابحث عن سكن قريب من جامعتك واحجز مكانك للترم الجاي" action={<button className={btnP} onClick={() => ctx.nav({ name: "search" })}>ابحث عن سكن</button>} /></div> : <>
                {upcoming.map(b => <BookingCard key={b.id} ctx={ctx} b={b} reload={load} perspective="student" />)}
                {past.length > 0 && <><h3 className="font-black text-deep pt-2">حجوزات سابقة ومنتهية</h3>{past.map(b => <BookingCard key={b.id} ctx={ctx} b={b} reload={load} perspective="student" />)}</>}
              </>}
            </div>
          ) : tab === "favorites" ? (
            favs.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{favs.map((p: any) => <PropertyCard key={p.id} ctx={ctx} p={{ ...p, isFav: true }} onFavToggle={() => load()} />)}</div>
              : <div className={card}><Empty title="المفضلة فاضية" sub="اضغط على القلب في أي سكن يعجبك وهيظهر هنا" action={<button className={btnP} onClick={() => ctx.nav({ name: "search" })}>تصفح السكن</button>} /></div>
          ) : tab === "notifications" ? (
            <div className={card + " p-4"}>
              <div className="flex justify-between mb-3"><h3 className="font-black text-deep">إشعاراتك</h3><button className="text-xs font-bold text-primary" onClick={async () => { await post("/api/social", { action: "read_notifications" }); load(); ctx.refreshBoot(); }}>تعليم الكل كمقروء</button></div>
              {notifs.length === 0 ? <Empty title="لا توجد إشعارات" /> : <div className="divide-y divide-line">{notifs.map(n => <div key={n.id} className={`py-3 ${n.isRead ? "opacity-70" : ""}`}><p className="font-bold text-sm text-deep flex gap-2">{!n.isRead && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}{n.title}</p><p className="text-[13px] text-muted">{n.body}</p><p className="text-[11px] text-muted/70 mt-0.5">{fmtTime(n.createdAt)}</p></div>)}</div>}
            </div>
          ) : (
            <form className={card + " p-5 space-y-4"} onSubmit={async e => { e.preventDefault(); try { const r = await patch("/api/auth", profile); ctx.setUser(r.user); ctx.toast("تم حفظ بياناتك ✅"); setProfile(p => ({ ...p, currentPassword: "", newPassword: "" })); } catch (err: any) { ctx.toast(err.message, "err"); } }}>
              <h3 className="font-black text-deep text-lg">البيانات الشخصية</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="الاسم"><input className={inp} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required /></Field>
                <Field label="رقم الموبايل"><input className={inp} dir="ltr" style={{ textAlign: "right" }} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></Field>
                <Field label="الجامعة"><select className={inp} value={profile.university} onChange={e => setProfile({ ...profile, university: e.target.value })}><option value="">—</option>{(ctx.settings?.universities || []).map((u: string) => <option key={u}>{u}</option>)}</select></Field>
                <Field label="الكلية"><input className={inp} value={profile.faculty} onChange={e => setProfile({ ...profile, faculty: e.target.value })} /></Field>
                <Field label="المدينة"><select className={inp} value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })}>{(ctx.settings?.cities || []).map((c: string) => <option key={c}>{c}</option>)}</select></Field>
                <Field label="البريد الإلكتروني"><input className={inp} value={ctx.user?.email} disabled dir="ltr" style={{ textAlign: "right" }} /></Field>
              </div>
              <h3 className="font-black text-deep text-lg pt-2">تغيير كلمة المرور</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="الحالية"><input type="password" className={inp} value={profile.currentPassword} onChange={e => setProfile({ ...profile, currentPassword: e.target.value })} /></Field>
                <Field label="الجديدة (٨+ أحرف)"><input type="password" className={inp} value={profile.newPassword} onChange={e => setProfile({ ...profile, newPassword: e.target.value })} /></Field>
              </div>
              <button className={btnP}>حفظ التعديلات</button>
              <p className="text-xs text-muted">حالة التوثيق: {ctx.user?.isVerified ? "✅ حساب موثّق" : "غير موثّق بعد — التوثيق بيتم بواسطة الإدارة بعد مراجعة الإثبات الجامعي"}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function OwnerDash({ ctx, initialTab }: { ctx: Ctx; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab || "overview");
  const [props, setProps] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [vers, setVers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verForm, setVerForm] = useState({ type: "ملكية العقار", evidenceNote: "", documentName: "", propertyId: "" });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, b, v] = await Promise.all([api("/api/properties?mine=1"), api("/api/bookings"), api("/api/social?kind=verifications")]);
      setProps(p.properties); setBookings(b.bookings); setVers(v.verifications);
    } catch (e: any) { ctx.toast(e.message, "err"); } finally { setLoading(false); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  const transition = async (pid: number, to: string) => { try { const property = props.find(p => p.id === pid); const r = await patch("/api/properties", { propertyId: pid, action: "transition", to }); if (property) trackListingStatusChange(property, property.status, r.property.status); ctx.toast("تم تحديث حالة الإعلان"); load(); } catch (e: any) { ctx.toast(e.message, "err"); } };
  const active = bookings.filter(b => ["confirmed", "awaiting_payment", "pending_owner"].includes(b.status));
  const revenue = bookings.filter(b => ["confirmed", "completed"].includes(b.status)).reduce((a, b) => a + (b.rentSubtotal - b.discount - b.platformFee), 0);
  const pendingReqs = bookings.filter(b => b.status === "pending_owner");
  const views = props.reduce((a, p) => a + p.views, 0);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div><h1 className="text-2xl font-black text-deep">لوحة المالك — {ctx.user?.name}</h1><p className="text-muted text-sm flex items-center gap-2">{ctx.user?.isVerified ? <VerifiedBadge small /> : <span className="text-amber-700 font-bold">حسابك غير موثّق بعد — قدّم مستنداتك من تبويب التوثيق</span>}</p></div>
        <button className={btnP + " ms-auto"} onClick={() => setTab("new")}><PlusCircle size={17} /> أضف سكن جديد</button>
      </div>
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <SideNav tab={tab} setTab={setTab} items={[
          { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
          { id: "listings", label: "إعلاناتي", icon: Building2 },
          { id: "new", label: "إضافة سكن", icon: PlusCircle },
          { id: "bookings", label: "طلبات الحجز", icon: CalendarCheck, count: pendingReqs.length },
          { id: "verification", label: "التوثيق", icon: ShieldCheck, count: vers.filter((v: any) => v.status === "rejected").length },
          { id: "reviews", label: "التقييمات", icon: Star },
          { id: "earnings", label: "الأرباح", icon: Wallet },
        ]} />
        <div className="flex-1 w-full min-w-0">
          {loading ? <Loading /> : tab === "overview" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[{ l: "إعلانات منشورة", v: props.filter(p => p.status === "published").length, i: Building2 }, { l: "طلبات بانتظارك", v: pendingReqs.length, i: CalendarCheck }, { l: "حجوزات نشطة", v: active.length, i: TrendingUp }, { l: "مشاهدات إعلاناتك", v: views, i: Star }].map(s => (
                  <div key={s.l} className={card + " p-4"}><s.i className="text-primary mb-2" size={22} /><p className="text-2xl font-black text-deep">{s.v}</p><p className="text-xs text-muted font-bold">{s.l}</p></div>
                ))}
              </div>
              <div className={card + " p-5"}><h3 className="font-black text-deep mb-2">قيمة الحجوزات المؤكدة (تقديرية)</h3><p className="text-3xl font-black text-primary">{egp(revenue)}</p><p className="text-xs text-muted mt-1">الدفع الإلكتروني غير مفعّل؛ لا تُسجّل المنصة مبالغ محصّلة أو تحويلات.</p></div>
              {pendingReqs.length > 0 && <div className="space-y-3"><h3 className="font-black text-deep">طلبات تحتاج ردك</h3>{pendingReqs.map(b => <BookingCard key={b.id} ctx={ctx} b={b} reload={load} perspective="owner" />)}</div>}
            </div>
          ) : tab === "listings" ? (
            <div className="space-y-4">
              {props.length === 0 ? <div className={card}><Empty title="معندكش إعلانات لسه" sub="أضف أول سكن ليك وابدأ تستقبل طلبات الطلاب" action={<button className={btnP} onClick={() => setTab("new")}>أضف سكن</button>} /></div> :
                props.map(p => <OwnerListingRow key={p.id} ctx={ctx} p={p} load={load} transition={transition} />)}
            </div>
          ) : tab === "new" ? <ListingForm ctx={ctx} onDone={() => { load(); setTab("listings"); }} />
            : tab === "bookings" ? (
              bookings.length === 0 ? <div className={card}><Empty title="لا توجد حجوزات بعد" sub="لما طالب يحجز عندك هيظهر طلبه هنا للموافقة" /></div> :
                <div className="space-y-4">{bookings.map(b => <BookingCard key={b.id} ctx={ctx} b={b} reload={load} perspective="owner" />)}</div>
            ) : tab === "verification" ? (
              <div className="space-y-4">
                <form className={card + " p-5 space-y-4"} onSubmit={async e => { e.preventDefault(); try { await post("/api/social", { action: "verification_submit", ...verForm, propertyId: verForm.propertyId || undefined }); ctx.toast("تم إرسال طلب التوثيق للإدارة ✅"); setVerForm({ type: "ملكية العقار", evidenceNote: "", documentName: "", propertyId: "" }); load(); } catch (err: any) { ctx.toast(err.message, "err"); } }}>
                  <h3 className="font-black text-deep flex items-center gap-2"><FileCheck2 className="text-primary" /> تقديم مستندات توثيق</h3>
                  <p className="text-[13px] text-muted">التوثيق بيتم بمراجعة بشرية من فريق سكني — الشارة لا تظهر إلا بعد اعتماد حقيقي مسجل. المستندات تُحفظ بشكل خاص ولا تظهر للطلاب.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="نوع التوثيق"><select className={inp} value={verForm.type} onChange={e => setVerForm({ ...verForm, type: e.target.value })}><option>ملكية العقار</option><option>هوية المالك</option><option>حق التأجير من الباطن</option><option>معاينة ميدانية</option></select></Field>
                    <Field label="السكن المرتبط (اختياري)"><select className={inp} value={verForm.propertyId} onChange={e => setVerForm({ ...verForm, propertyId: e.target.value })}><option value="">توثيق حسابي الشخصي</option>{props.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
                    <Field label="اسم المستند"><input className={inp} placeholder="مثال: عقد الملكية.pdf" value={verForm.documentName} onChange={e => setVerForm({ ...verForm, documentName: e.target.value })} required /></Field>
                    <Field label="رفع المستند"><input type="file" accept=".pdf,.jpg,.png" className={inp} onChange={e => setVerForm({ ...verForm, documentName: e.target.files?.[0]?.name || verForm.documentName })} /></Field>
                  </div>
                  <Field label="اشرح المستندات المرفقة"><textarea className={inp} rows={3} value={verForm.evidenceNote} onChange={e => setVerForm({ ...verForm, evidenceNote: e.target.value })} placeholder="عقد ملكية مسجل + بطاقة رقم قومي سارية…" required /></Field>
                  <button className={btnP}><Send size={16} /> إرسال للمراجعة</button>
                </form>
                <div className={card + " p-5"}><h3 className="font-black text-deep mb-3">طلباتي السابقة</h3>
                  {vers.length === 0 ? <p className="text-muted text-sm">لا توجد طلبات بعد</p> : <div className="divide-y divide-line">{vers.map((v: any) => <div key={v.id} className="py-3 flex flex-wrap gap-2 items-center"><span className="font-bold text-sm text-deep">{v.type}</span>{v.property && <span className="text-xs text-muted">{v.property.title}</span>}<span className={`ms-auto text-[11px] font-bold px-2.5 py-1 rounded-full ${v.status === "approved" ? "bg-emerald-100 text-emerald-800" : v.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{v.status === "approved" ? "معتمد ✅" : v.status === "rejected" ? "مرفوض" : "قيد المراجعة ⏳"}</span>{v.reason && <p className="w-full text-xs text-red-600">سبب الرفض: {v.reason} — عدّل وقدّم تاني</p>}<p className="w-full text-[11px] text-muted">{v.documentName} • قُدّم {fmtDate(v.createdAt)}{v.reviewedAt && ` • رُوجع ${fmtDate(v.reviewedAt)}`}</p></div>)}</div>}
                </div>
              </div>
            ) : tab === "reviews" ? <OwnerReviews ctx={ctx} props={props} />
              : (
                <div className={card + " p-5"}>
                  <h3 className="font-black text-deep mb-4">الأرباح لكل سكن (حجوزات مؤكدة ومكتملة)</h3>
                  {props.map(p => { const bs = bookings.filter(b => b.propertyId === p.id && ["confirmed", "completed"].includes(b.status)); const gross = bs.reduce((a, b) => a + b.rentSubtotal - b.discount, 0); const fee = bs.reduce((a, b) => a + b.platformFee, 0); return (
                    <div key={p.id} className="flex flex-wrap gap-x-6 gap-y-1 py-3 border-b border-line last:border-0"><span className="font-bold text-deep flex-1 min-w-[180px]">{p.title}</span><span className="text-sm">حجوزات: <b>{bs.length}</b></span><span className="text-sm">إجمالي: <b>{egp(gross)}</b></span><span className="text-sm text-muted">عمولة: −{egp(fee)}</span><span className="text-sm text-primary font-black">صافي: {egp(gross - fee)}</span></div>); })}
                  <p className="text-2xl font-black text-primary mt-4">الصافي الكلي: {egp(revenue)}</p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

function OwnerListingRow({ ctx, p, load, transition }: any) {
  const [open, setOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: "", unitType: "غرفة خاصة", totalBeds: 1, capacity: 1, monthlyPrice: 0, deposit: 0, cleaningFee: 0 });
  const st = LISTING_STATUS[p.status] || { ar: p.status, cls: "" };
  return (
    <div className={card + " p-4"}>
      <div className="flex flex-wrap gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full sm:w-40 h-32 object-cover rounded-xl cursor-pointer" onClick={() => p.status === "published" && ctx.nav({ name: "property", id: p.id })} /> : <div className="w-full sm:w-40 h-32 rounded-xl bg-slate-100 text-muted text-xs flex items-center justify-center">لم تُضف صورة بعد</div>}
        <div className="flex-1 min-w-[220px]">
          <p className="font-black text-deep flex flex-wrap items-center gap-2">{p.title} <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.ar}</span>{p.isVerified && <VerifiedBadge small />}</p>
          <p className="text-[13px] text-muted">{p.neighborhood}، {p.city} • {p.type} • 👁 {p.views} مشاهدة • {(p.units || []).length} وحدة • يبدأ من {egp(p.minPrice)}/شهر</p>
          {p.rejectReason && p.status === "rejected" && <p className="text-xs text-red-600 mt-1">سبب الرفض: {p.rejectReason}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {p.status === "draft" && <button className={btnP} onClick={() => transition(p.id, "pending_review")}><Send size={15} /> إرسال لمراجعة الإدارة</button>}
            {p.status === "verification_required" && <button className={btnP} onClick={() => transition(p.id, "pending_review")}>قدّمت التوثيق — أعد الإرسال للمراجعة</button>}
            {p.status === "published" && <button className={btnS} onClick={() => transition(p.id, "paused")}><Pause size={15} /> إيقاف مؤقت</button>}
            {p.status === "paused" && <button className={btnP} onClick={() => transition(p.id, "published")}><Play size={15} /> إعادة النشر</button>}
            {p.status === "rejected" && <button className={btnS} onClick={() => transition(p.id, "draft")}>رجوع لمسودة والتعديل</button>}
            <button className={btnS} onClick={() => setOpen(!open)}><BedDouble size={15} /> {open ? "إخفاء" : "إدارة"} الغرف والأسعار</button>
            <ConfirmBtn label="أرشفة" className={btnS + " !text-red-600"} confirmLabel="تأكيد الأرشفة؟" onConfirm={async () => { try { await api(`/api/properties?id=${p.id}`, { method: "DELETE" }); trackListingStatusChange(p, p.status, "archived"); ctx.toast("تمت الأرشفة"); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }} />
          </div>
        </div>
      </div>
      {open && <div className="mt-4 pt-4 border-t border-line space-y-3">
        {(p.units || []).map((u: any) => <UnitEditor key={u.id} ctx={ctx} u={u} load={load} />)}
        <form className="bg-mint/50 rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-3 items-end" onSubmit={async e => { e.preventDefault(); try { await patch("/api/properties", { action: "add_unit", propertyId: p.id, ...unitForm }); ctx.toast("اتضافت الوحدة ✅"); load(); } catch (err: any) { ctx.toast(err.message, "err"); } }}>
          <Field label="اسم الوحدة الجديدة"><input className={inp} value={unitForm.name} onChange={e => setUnitForm({ ...unitForm, name: e.target.value })} placeholder="غرفة بحمام" required /></Field>
          <Field label="النوع"><select className={inp} value={unitForm.unitType} onChange={e => setUnitForm({ ...unitForm, unitType: e.target.value })}>{UNIT_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="عدد الأسِرّة / الوحدات"><input type="number" min={1} className={inp} value={unitForm.totalBeds} onChange={e => setUnitForm({ ...unitForm, totalBeds: Number(e.target.value) })} /></Field>
          <Field label="السعر الشهري (ج.م)"><input type="number" min={100} required className={inp} value={unitForm.monthlyPrice || ""} onChange={e => setUnitForm({ ...unitForm, monthlyPrice: Number(e.target.value) })} /></Field>
          <Field label="التأمين"><input type="number" min={0} className={inp} value={unitForm.deposit} onChange={e => setUnitForm({ ...unitForm, deposit: Number(e.target.value) })} /></Field>
          <Field label="السعة (أفراد)"><input type="number" min={1} className={inp} value={unitForm.capacity} onChange={e => setUnitForm({ ...unitForm, capacity: Number(e.target.value) })} /></Field>
          <button className={btnP + " col-span-2"}>إضافة وحدة</button>
        </form>
      </div>}
    </div>
  );
}
function UnitEditor({ ctx, u, load }: any) {
  const [f, setF] = useState({ name: u.name, totalBeds: u.totalBeds, capacity: u.capacity, monthlyPrice: u.monthlyPrice, deposit: u.deposit, cleaningFee: u.cleaningFee, availableFrom: u.availableFrom });
  return (
    <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
      <Field label="الوحدة"><input className={inp} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="أسرّة / وحدات متاحة"><input type="number" min={1} className={inp} value={f.totalBeds} onChange={e => setF({ ...f, totalBeds: Number(e.target.value) })} /></Field>
      <Field label="شهري (ج.م)"><input type="number" min={100} className={inp} value={f.monthlyPrice} onChange={e => setF({ ...f, monthlyPrice: Number(e.target.value) })} /></Field>
      <Field label="التأمين"><input type="number" min={0} className={inp} value={f.deposit} onChange={e => setF({ ...f, deposit: Number(e.target.value) })} /></Field>
      <Field label="رسوم تنظيف"><input type="number" min={0} className={inp} value={f.cleaningFee} onChange={e => setF({ ...f, cleaningFee: Number(e.target.value) })} /></Field>
      <Field label="متاح من"><input type="date" className={inp} value={f.availableFrom} onChange={e => setF({ ...f, availableFrom: e.target.value })} /></Field>
      <div className="flex gap-2 col-span-2">
        <button className={btnP} onClick={async () => { try { const r = await patch("/api/properties", { unitId: u.id, ...f }); ctx.toast(r.note || "تم الحفظ"); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}><Pencil size={14} /> حفظ</button>
        <button className={btnD} onClick={async () => { try { await patch("/api/properties", { unitId: u.id, action: "delete_unit" }); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}
function OwnerReviews({ ctx, props }: any) {
  const [data, setData] = useState<any[]>([]); const [resp, setResp] = useState<Record<number, string>>({});
  const load = useCallback(async () => {
    const out: any[] = [];
    for (const p of props) { const r = await api(`/api/properties?id=${p.id}`); (r.reviews || []).forEach((x: any) => out.push({ ...x, propTitle: p.title })); }
    setData(out);
  }, [props]);
  useEffect(() => { if (props.length) load(); }, [load, props.length]);
  if (!props.length) return <div className={card}><Empty title="لا إعلانات بعد" /></div>;
  return <div className="space-y-3">
    {data.length === 0 ? <div className={card}><Empty title="لا تقييمات بعد" sub="التقييمات بتظهر بعد إقامات مكتملة عندك" /></div> : data.map(r => (
      <div key={r.id} className={card + " p-4"}>
        <p className="text-xs text-muted">{r.propTitle}</p>
        <p className="font-bold text-deep text-sm">{r.student?.name} {"⭐".repeat(r.rating)}</p>
        <p className="text-sm text-muted mt-1">{r.text}</p>
        {r.ownerResponse ? <p className="text-[13px] bg-mint/60 rounded-lg p-2.5 mt-2"><b>ردك:</b> {r.ownerResponse}</p> : (
          <div className="flex gap-2 mt-2"><input className={inp} placeholder="اكتب ردك على التقييم…" value={resp[r.id] || ""} onChange={e => setResp({ ...resp, [r.id]: e.target.value })} />
            <button className={btnP} onClick={async () => { try { await post("/api/social", { action: "review_respond", reviewId: r.id, text: resp[r.id] }); ctx.toast("اتنشر ردك ✅"); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}>رد</button></div>
        )}
      </div>))}
  </div>;
}

export function ListingForm({ ctx, onDone }: { ctx: Ctx; onDone: () => void }) {
  const [f, setF] = useState({ title: "", description: "", city: "", neighborhood: "", university: "", distanceKm: 0, type: "", gender: "", rules: "", amenities: [] as string[], images: [] as string[], customImage: "" });
  const [units, setUnits] = useState([{ name: "", unitType: "غرفة خاصة", totalBeds: 1, capacity: 1, monthlyPrice: 0, deposit: 0, cleaningFee: 0 }]);
  const [busy, setBusy] = useState(false);
  const submit = async (sendReview: boolean) => {
    if (f.title.trim().length < 8) return ctx.toast("عنوان السكن قصير — اكتب عنوان وصفي أوضح", "err");
    if (!f.city || !f.neighborhood.trim() || !f.university || !f.type || !f.gender || f.distanceKm <= 0) return ctx.toast("أكمل المدينة والمنطقة والجامعة والمسافة ونوع السكن", "err");
    if (!units.length || units.some(u => !u.name.trim() || u.monthlyPrice < 100)) return ctx.toast("أدخل اسم كل وحدة وسعرها الشهري الحقيقي", "err");
    const imgs = [...f.images, ...(f.customImage.startsWith("https://") ? [f.customImage] : [])];
    if (sendReview && !imgs.length) return ctx.toast("أضف صورة حقيقية للسكن قبل إرساله للمراجعة", "err");
    setBusy(true);
    try {
      await post("/api/properties", { ...f, images: imgs, units, submit: sendReview });
      trackEvent("owner_listing_created", {
        property_type: String(f.type || "unknown"),
        submitted_for_review: sendReview,
        unit_count: units.length,
      });
      ctx.toast(sendReview ? "اتبعت إعلانك لمراجعة الإدارة ✅" : "اتحفظ كمسودة ✅"); onDone();
    } catch (e: any) { ctx.toast(e.message, "err"); } finally { setBusy(false); }
  };
  return (
    <div className={card + " p-5 space-y-5"}>
      <h3 className="font-black text-deep text-lg">إضافة سكن جديد</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Field label="عنوان الإعلان"><input className={inp} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="مثال: غرف مفروشة للطلاب بجوار جامعة دمياط" /></Field></div>
        <Field label="المدينة"><select className={inp} value={f.city} onChange={e => setF({ ...f, city: e.target.value })}><option value="">اختر المدينة</option>{(ctx.settings?.cities || []).map((c: string) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="الحي / المنطقة"><input className={inp} value={f.neighborhood} onChange={e => setF({ ...f, neighborhood: e.target.value })} placeholder="اكتب المنطقة الفعلية" /></Field>
        <Field label="أقرب جامعة"><select className={inp} value={f.university} onChange={e => setF({ ...f, university: e.target.value })}><option value="">اختر الجامعة</option>{(ctx.settings?.universities || []).map((u: string) => <option key={u}>{u}</option>)}</select></Field>
        <Field label="المسافة للجامعة (كم)"><input type="number" step="0.1" min={0.1} className={inp} value={f.distanceKm || ""} onChange={e => setF({ ...f, distanceKm: Number(e.target.value) })} /></Field>
        <Field label="نوع السكن"><select className={inp} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="">اختر النوع</option>{PROP_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
        <Field label="مخصص لـ"><select className={inp} value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })}><option value="">اختر</option><option>بنين</option><option>بنات</option><option>الكل</option></select></Field>
        <div className="sm:col-span-2"><Field label="وصف السكن"><textarea className={inp} rows={4} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="اوصف الغرف والموقع والمميزات بصدق…" /></Field></div>
        <div className="sm:col-span-2"><Field label="قوانين السكن"><input className={inp} value={f.rules} onChange={e => setF({ ...f, rules: e.target.value })} placeholder="ممنوع التدخين • الهدوء بعد ١١ مساءً…" /></Field></div>
      </div>
      <div><p className="font-bold text-sm text-deep mb-2">المرافق المتوفرة</p>
        <div className="flex flex-wrap gap-2">{(ctx.settings?.amenities || []).map((a: string) => <button type="button" key={a} onClick={() => setF({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] })} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${f.amenities.includes(a) ? "bg-primary text-white border-primary" : "bg-white border-line text-muted"}`}>{a}</button>)}</div>
      </div>
      <div><p className="font-bold text-sm text-deep mb-2">صور السكن</p>
        <div className="flex gap-2 flex-wrap">{f.images.map(s => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s} src={s} alt="صورة السكن" onClick={() => setF({ ...f, images: f.images.filter(x => x !== s) })} className="w-24 h-16 object-cover rounded-lg cursor-pointer border-2 border-primary" />
        ))}</div>
        {!f.images.length && <p className="text-xs text-muted">لم تُضف صورًا بعد.</p>}
        <input className={inp + " mt-2"} placeholder="الصق رابط صورة حقيقية من السكن https://…" dir="ltr" style={{ textAlign: "right" }} value={f.customImage} onChange={e => setF({ ...f, customImage: e.target.value })} />
        <p className="text-[11px] text-muted mt-1">أضف صورًا حقيقية للسكن فقط. لا تُستخدم صور افتراضية.</p>
      </div>
      <div className="space-y-3"><p className="font-bold text-sm text-deep">الغرف والأسعار</p>
        {units.map((u, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="اسم الوحدة"><input className={inp} value={u.name} onChange={e => setUnits(units.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></Field>
            <Field label="النوع"><select className={inp} value={u.unitType} onChange={e => setUnits(units.map((x, j) => j === i ? { ...x, unitType: e.target.value } : x))}>{UNIT_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
            <Field label="عدد الأسِرّة/الوحدات"><input type="number" min={1} className={inp} value={u.totalBeds} onChange={e => setUnits(units.map((x, j) => j === i ? { ...x, totalBeds: Number(e.target.value) } : x))} /></Field>
            <Field label="السعر الشهري"><input type="number" min={100} className={inp} value={u.monthlyPrice} onChange={e => setUnits(units.map((x, j) => j === i ? { ...x, monthlyPrice: Number(e.target.value) } : x))} /></Field>
            <Field label="التأمين"><input type="number" min={0} className={inp} value={u.deposit} onChange={e => setUnits(units.map((x, j) => j === i ? { ...x, deposit: Number(e.target.value) } : x))} /></Field>
            <Field label="سعة الوحدة"><input type="number" min={1} className={inp} value={u.capacity} onChange={e => setUnits(units.map((x, j) => j === i ? { ...x, capacity: Number(e.target.value) } : x))} /></Field>
            {units.length > 1 && <button className={btnD + " self-end"} onClick={() => setUnits(units.filter((_, j) => j !== i))}><Trash2 size={15} /></button>}
          </div>))}
        <button className={btnS} onClick={() => setUnits([...units, { name: "", unitType: "غرفة خاصة", totalBeds: 1, capacity: 1, monthlyPrice: 0, deposit: 0, cleaningFee: 0 }])}><PlusCircle size={15} /> وحدة أخرى</button>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button className={btnS} disabled={busy} onClick={() => submit(false)}><Archive size={16} /> حفظ كمسودة</button>
        <button className={btnP} disabled={busy} onClick={() => submit(true)}><Send size={16} /> إرسال لمراجعة الإدارة والنشر</button>
      </div>
      <p className="text-xs text-muted">الإعلانات لا تظهر للطلاب إلا بعد مراجعة الإدارة. شارك العنوان الدقيق مع الطلاب فقط بعد تأكيد الحجز.</p>
    </div>
  );
}
export { Modal };
