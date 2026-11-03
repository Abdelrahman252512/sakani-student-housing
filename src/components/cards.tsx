"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Heart, MapPin, BedDouble, Star, Eye, CreditCard, MessageCircle, XCircle, CheckCircle2, Flag, Scale } from "lucide-react";
import { useRef, useState } from "react";
import { Ctx, egp, fmtDate, BOOKING_STATUS, PAY_STATUS, patch, post } from "@/lib/client";
import { btnP, btnS, btnD, VerifiedBadge, Modal, Field, inp, Stars, Avatar, ConfirmBtn } from "./ui";
import { trackEvent, trackBookingOutcome, type BookingOutcomeAction } from "@/lib/analytics";

export function PropertyCard({ ctx, p, onFavToggle, compare, onCompare, availabilityDatesSelected = false }: { ctx: Ctx; p: any; onFavToggle?: (id: number, fav: boolean) => void; compare?: number[]; onCompare?: (id: number) => void; availabilityDatesSelected?: boolean }) {
  const [fav, setFav] = useState(!!p.isFav);
  const toggleFav = async (e: any) => {
    e.stopPropagation();
    if (!ctx.user) return ctx.openAuth("login");
    try { const r = await post("/api/social", { action: "toggle_fav", propertyId: p.id }); trackEvent("favorite_toggled", { favorited: Boolean(r.fav), property_type: String(p.type || "unknown") }); setFav(r.fav); onFavToggle?.(p.id, r.fav); ctx.toast(r.fav ? "أُضيف للمفضلة ❤️" : "أُزيل من المفضلة"); }
    catch (err: any) { ctx.toast(err.message, "err"); }
  };
  return (
    <article className="bg-white rounded-2xl border border-line overflow-hidden hover:shadow-xl hover:shadow-deep/10 hover:-translate-y-1 transition-all cursor-pointer group" onClick={() => ctx.nav({ name: "property", id: p.id })}>
      <div className="relative h-52 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
        <div className="absolute top-3 inset-inline-start-3 flex gap-2" style={{ insetInlineStart: 12 }}>
          {p.isVerified && <VerifiedBadge small />}
          {p.featured && <span className="rounded-full bg-accent text-deep text-[10px] font-black px-2 py-0.5">مميز</span>}
        </div>
        <button onClick={toggleFav} className="absolute top-3 bg-white/90 backdrop-blur p-2 rounded-full shadow hover:scale-110 transition" style={{ insetInlineEnd: 12 }} aria-label="مفضلة">
          <Heart size={17} className={fav ? "fill-red-500 text-red-500" : "text-muted"} />
        </button>
        <span className="absolute bottom-3 bg-deep/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur" style={{ insetInlineStart: 12 }}>{p.type} • {p.gender}</span>
        {onCompare && (
          <button onClick={e => { e.stopPropagation(); onCompare(p.id); }} className={`absolute bottom-3 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${compare?.includes(p.id) ? "bg-primary text-white" : "bg-white/90 text-deep"}`} style={{ insetInlineEnd: 12 }}>
            <Scale size={12} /> {compare?.includes(p.id) ? "في المقارنة" : "قارن"}
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-deep leading-snug line-clamp-2 min-h-[44px]">{p.title}</h3>
          {p.rating !== null && p.rating !== undefined && <span className="flex items-center gap-1 text-sm font-black text-deep shrink-0"><Star size={15} className="fill-amber-400 text-amber-400" />{p.rating}<span className="text-muted font-medium text-xs">({p.reviewCount})</span></span>}
        </div>
        <p className="flex items-center gap-1.5 text-[13px] text-muted mt-1"><MapPin size={14} className="text-primary" />{p.neighborhood}، {p.city}</p>
        <p className="flex items-center gap-1.5 text-[13px] text-muted"><BedDouble size={14} className="text-primary" />يبعد {p.distanceKm} كم عن {p.university} • {p.units?.length || 0} وحدة</p>
        {availabilityDatesSelected && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-mint px-2 py-1 text-[11px] font-bold text-primary-dark"><CheckCircle2 size={13} />متاح للفترة: {Number(p.availableUnits || 0)} من {p.units?.length || 0} وحدة</p>}
        <div className="flex flex-wrap gap-1 mt-2.5">{(p.amenities || []).slice(0, 3).map((a: string) => <span key={a} className="bg-mint text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full">{a}</span>)}{(p.amenities?.length || 0) > 3 && <span className="bg-slate-100 text-muted text-[10px] font-bold px-2 py-0.5 rounded-full">+{p.amenities.length - 3}</span>}</div>
        <div className="flex items-end justify-between mt-3 pt-3 border-t border-line">
          <div><span className="text-[11px] text-muted block">يبدأ من</span><span className="font-black text-primary text-lg">{egp(p.minPrice)}</span><span className="text-muted text-xs"> / شهريًا</span></div>
          <span className="flex items-center gap-1 text-[11px] text-muted"><Eye size={13} />{p.views}</span>
        </div>
      </div>
    </article>
  );
}

export function QuoteBox({ q, settings }: { q: any; settings: any }) {
  const Row = ({ l, v, bold, neg }: any) => <div className={`flex justify-between text-sm ${bold ? "font-black text-deep text-base" : "text-muted"}`}><span>{l}</span><span className={neg ? "text-emerald-600 font-bold" : bold ? "text-primary" : "font-bold text-ink"}>{neg ? "− " : ""}{egp(v)}</span></div>;
  return (
    <div className="bg-mint/60 border border-primary/15 rounded-2xl p-4 space-y-2">
      <p className="font-black text-deep flex justify-between"><span>تفصيل السعر (محسوب من الخادم)</span><span className="text-xs bg-white px-2 py-0.5 rounded-full border border-line font-bold">{q.nights} ليلة ≈ {q.months} شهر</span></p>
      <Row l={`الإيجار (${egp(q.monthlyPrice)} × ${q.months} شهر)`} v={q.rentSubtotal} />
      {q.discount > 0 && <Row l="خصم الفصل الدراسي (إقامة ٤ شهور+)" v={q.discount} neg />}
      <Row l={`رسوم خدمة سكني (${settings?.serviceFeePct ?? 0}٪)`} v={q.serviceFee} />
      {q.cleaningFee > 0 && <Row l="رسوم تنظيف عند الاستلام" v={q.cleaningFee} />}
      <Row l="التأمين المسجّل للسكن" v={q.depositAmount} />
      <div className="border-t border-primary/15 pt-2 space-y-2">
        <Row l="إجمالي التكلفة المقدّرة" v={q.total} bold />
        <Row l="المبلغ المتوقع عند تفعيل الدفع" v={q.payableNow} bold />
        {q.remaining > 0 && <p className="text-xs text-muted">المتبقي التقديري {egp(q.remaining)} عن مدة الإقامة.</p>}
      </div>
    </div>
  );
}

export function PayModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="الدفع الإلكتروني غير مفعّل" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted leading-relaxed">
          لا يمكن إتمام الدفع أو تأكيد الحجز إلكترونيًا حاليًا. لا تُدخل بيانات بطاقة أو محفظة في الموقع.
        </p>
        <button className={btnP + " w-full"} onClick={onClose}>إغلاق</button>
      </div>
    </Modal>
  );
}

export function BookingCard({ ctx, b, reload, perspective }: { ctx: Ctx; b: any; reload: () => void; perspective: "student" | "owner" | "admin" }) {
  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5); const [rtext, setRtext] = useState("");
  const [busy, setBusy] = useState(false);
  const acting = useRef(false);
  const act = async (action: BookingOutcomeAction, extra: any = {}) => {
    if (acting.current) return;
    acting.current = true;
    setBusy(true);
    try {
      const update = () => action === "confirm"
        ? post("/api/bookings", { bookingId: b.id, action: "pay", ...extra })
        : patch("/api/bookings", { bookingId: b.id, action, ...extra });
      const r = await trackBookingOutcome(action, perspective, update);
      ctx.toast(action === "cancel" ? (r.note || "تم إلغاء الحجز؛ لا يُنفّذ الموقع استردادًا إلكترونيًا.") : "تم التنفيذ ✅");
      reload();
    }
    catch (e: any) { ctx.toast(e.message, "err"); } finally { acting.current = false; setBusy(false); }
  };
  const message = async () => {
    try { const r = await post("/api/social", { action: "start_conversation", propertyId: b.propertyId }); ctx.nav({ name: "messages", id: r.conversation.id }); }
    catch (e: any) { ctx.toast(e.message, "err"); }
  };
  const st = BOOKING_STATUS[b.status] || { ar: b.status, cls: "bg-slate-100" };
  return (
    <div className="bg-white rounded-2xl border border-line p-4 sm:p-5">
      <div className="flex flex-wrap gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.property?.images?.[0]} alt="" className="w-full sm:w-36 h-32 sm:h-28 object-cover rounded-xl cursor-pointer" onClick={() => ctx.nav({ name: "property", id: b.propertyId })} />
        <div className="flex-1 min-w-[240px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-deep cursor-pointer hover:text-primary" onClick={() => ctx.nav({ name: "property", id: b.propertyId })}>{b.property?.title}</span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.ar}</span>
            <span className="text-[11px] bg-slate-100 px-2 py-1 rounded-full font-bold text-muted" dir="ltr">{b.code}</span>
          </div>
          <p className="text-[13px] text-muted mt-1">{b.unit?.name} • {b.guests} {b.guests > 1 ? "أفراد" : "فرد"} • من {fmtDate(b.checkIn)} إلى {fmtDate(b.checkOut)}</p>
          {perspective !== "student" && <p className="text-[13px] text-muted flex items-center gap-2 mt-1"><Avatar name={b.student?.name || ""} size={22} /> الطالب: <b className="text-ink">{b.student?.name}</b> {b.student?.university && `— ${b.student.university}`} {b.status === "confirmed" && <span dir="ltr" className="font-bold text-primary">{b.student?.phone}</span>}</p>}
          {perspective === "student" && <p className="text-[13px] text-muted mt-1">المالك: <b className="text-ink">{b.owner?.name}</b>{b.status === "confirmed" && <> • <span dir="ltr" className="font-bold text-primary">{b.owner?.phone}</span> • العنوان: {b.property?.neighborhood}، {b.property?.city} (التفصيلي مع المالك)</>}</p>}
          {b.notes && <p className="text-[13px] bg-slate-50 rounded-lg px-3 py-2 mt-2 text-muted">📝 {b.notes}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5 text-[13px]">
            <span>الإجمالي: <b className="text-primary">{egp(b.total)}</b></span>
            <span>الدفعة الأولى: <b>{egp(b.payableNow)}</b></span>
            <span>التأمين: <b>{egp(b.depositAmount)}</b></span>
            {b.refundAmount > 0 && <span className="text-violet-700">المسترد: <b>{egp(b.refundAmount)}</b></span>}
          </div>
          {b.payments?.length > 0 && <div className="mt-2 space-y-1">{b.payments.map((p: any) => <p key={p.id} className="text-[11px] text-muted flex gap-2"><CreditCard size={13} /> {egp(Math.abs(p.amount))} — {PAY_STATUS[p.status] || p.status} <span dir="ltr">{p.ref}</span></p>)}</div>}
          <details className="mt-2"><summary className="text-xs text-primary font-bold cursor-pointer">سجل حالة الحجز</summary>
            <div className="mt-1.5 space-y-1 border-s-2 border-mint ps-3">{(b.history || []).map((h: any, i: number) => <p key={i} className="text-[11px] text-muted"><b className="text-deep">{BOOKING_STATUS[h.status]?.ar || h.status}</b> — {h.by} • {new Date(h.at).toLocaleDateString("ar-EG")}{h.note ? ` • ${h.note}` : ""}</p>)}</div>
          </details>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-line">
        {perspective === "student" && b.status === "awaiting_payment" && <button className={btnS} onClick={() => setPayOpen(true)}><CreditCard size={16} /> حالة الدفع</button>}
        {perspective === "student" && b.status === "completed" && <button className={btnP} onClick={() => setReviewOpen(true)}><Star size={16} /> قيّم إقامتك</button>}
        {perspective === "owner" && b.status === "pending_owner" && <><button className={btnP} disabled={busy} onClick={() => act("accept")}><CheckCircle2 size={16} /> قبول الطلب</button><button className={btnD} disabled={busy} onClick={() => act("reject", { reason: "غير متاح في التواريخ دي" })}><XCircle size={16} /> رفض</button></>}
        {(perspective === "owner" || perspective === "admin") && b.status === "confirmed" && <button className={btnS} disabled={busy} onClick={() => act("complete")}>إنهاء الإقامة (اكتملت)</button>}
        {["pending_owner", "awaiting_payment", "confirmed"].includes(b.status) && <ConfirmBtn label="إلغاء الحجز" className={btnS + " !text-red-600 !border-red-200 hover:!border-red-400"} confirmLabel="اضغط تاني لتأكيد الإلغاء" onConfirm={() => act("cancel", { reason: "إلغاء من " + (perspective === "student" ? "الطالب" : "المالك") })} />}
        <button className={btnS} onClick={message}><MessageCircle size={16} /> مراسلة</button>
        {perspective === "student" && <button className={btnS} onClick={async () => { try { await post("/api/social", { action: "report", propertyId: b.propertyId, reason: "مشكلة في حجز " + b.code, details: prompt("اكتب تفاصيل البلاغ للإدارة:") || "" }); ctx.toast("وصل بلاغك للإدارة وهيتراجع"); } catch (e: any) { ctx.toast(e.message, "err"); } }}><Flag size={15} /> إبلاغ</button>}
      </div>
      {payOpen && <PayModal onClose={() => setPayOpen(false)} />}
      {reviewOpen && <Modal title="قيّم إقامتك" onClose={() => setReviewOpen(false)}>
        <div className="space-y-4">
          <Field label="التقييم"><Stars v={rating} set={setRating} size={30} /></Field>
          <Field label="اكتب تجربتك بصراحة"><textarea className={inp} rows={4} value={rtext} onChange={e => setRtext(e.target.value)} placeholder="المكان كان… أنصح بيه لـ…" /></Field>
          <button className={btnP + " w-full"} onClick={async () => { try { await post("/api/social", { action: "review", bookingId: b.id, rating, text: rtext }); ctx.toast("شكرًا! تقييمك اتنشر"); setReviewOpen(false); reload(); } catch (e: any) { ctx.toast(e.message, "err"); } }}>نشر التقييم</button>
        </div>
      </Modal>}
    </div>
  );
}
