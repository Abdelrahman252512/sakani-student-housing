"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from "react";
import { Send, Users, HeartHandshake, ShieldCheck, LifeBuoy, MessageCircle, BadgePercent } from "lucide-react";
import { api, post, egp, fmtDate, fmtTime, today, Ctx } from "@/lib/client";
import { btnP, btnS, card, Empty, Loading, Field, inp, Avatar } from "./ui";

export function MessagesView({ ctx, initialConv }: { ctx: Ctx; initialConv?: number }) {
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<number | null>(initialConv || null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const loadConvs = useCallback(async () => { try { const r = await api("/api/social?kind=conversations"); setConvs(r.conversations); if (!active && r.conversations.length) setActive(initialConv || r.conversations[0].id); } catch (e: any) { ctx.toast(e.message, "err"); } finally { setLoading(false); } }, []); // eslint-disable-line
  useEffect(() => { loadConvs(); }, [loadConvs]);
  const loadMsgs = useCallback(async () => { if (!active) return; try { const r = await api(`/api/social?kind=messages&conversationId=${active}`); setMsgs(r.messages); setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60); } catch {} }, [active]);
  useEffect(() => { loadMsgs(); const t = setInterval(loadMsgs, 8000); return () => clearInterval(t); }, [loadMsgs]);
  const send = async () => { if (!text.trim() || !active) return; try { await post("/api/social", { action: "send_message", conversationId: active, text }); setText(""); loadMsgs(); loadConvs(); } catch (e: any) { ctx.toast(e.message, "err"); } };
  const cur = convs.find(c => c.id === active);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-deep mb-1">رسائلي</h1>
      <p className="text-muted text-sm mb-5">تواصل آمن داخل المنصة — متشاركش بيانات دفع خارج سكني أبدًا.</p>
      {loading ? <Loading /> : convs.length === 0 ? <div className={card}><Empty title="لا محادثات بعد" sub="من صفحة أي سكن اضغط «مراسلة المالك» وابدأ محادثة" action={<button className={btnP} onClick={() => ctx.nav({ name: "search" })}>تصفح السكن</button>} /></div> : (
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="md:w-80 shrink-0 space-y-2 max-h-[320px] md:max-h-[560px] overflow-y-auto">
            {convs.map(c => (
              <button key={c.id} onClick={() => setActive(c.id)} className={`w-full text-start p-3.5 rounded-2xl border flex gap-3 items-center transition ${active === c.id ? "bg-mint border-primary/40" : "bg-white border-line hover:border-primary/40"}`}>
                <Avatar name={c.other?.name || "؟"} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-deep text-sm truncate">{c.other?.name} <span className="text-[10px] text-muted font-bold">{c.other?.role === "owner" ? "مالك" : "طالب"}</span></p>
                  <p className="text-xs text-primary font-bold truncate">{c.property?.title}</p>
                  <p className="text-xs text-muted truncate">{c.lastText || "ابدأ المحادثة…"}</p>
                </div>
                {c.unread > 0 && <span className="bg-primary text-white text-[11px] font-black rounded-full px-2 py-0.5">{c.unread}</span>}
              </button>))}
          </div>
          <div className={card + " flex-1 flex flex-col min-h-[480px]"}>
            {cur && <div className="p-4 border-b border-line flex items-center gap-3"><Avatar name={cur.other?.name || ""} /><div><p className="font-black text-deep">{cur.other?.name}</p><p className="text-xs text-muted">{cur.property?.title}</p></div></div>}
            <div className="flex-1 p-4 space-y-2.5 overflow-y-auto bg-[#fafcfc]">
              {msgs.length === 0 && <p className="text-center text-muted text-sm py-8">لا رسائل بعد — قول مرحبًا 👋 واستفسر عن السكن وموعد الاستلام</p>}
              {msgs.map(m => (
                <div key={m.id} className={`flex ${m.senderId === ctx.user?.id ? "justify-start flex-row-reverse" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${m.senderId === ctx.user?.id ? "bg-primary text-white rounded-ts-md" : "bg-white border border-line text-ink rounded-te-md"}`}>
                    {m.text}<span className={`block text-[10px] mt-1 ${m.senderId === ctx.user?.id ? "text-white/70" : "text-muted"}`}>{fmtTime(m.createdAt)}</span>
                  </div>
                </div>))}
              <div ref={endRef} />
            </div>
            <form className="p-3 border-t border-line flex gap-2" onSubmit={e => { e.preventDefault(); send(); }}>
              <input className={inp} value={text} onChange={e => setText(e.target.value)} placeholder="اكتب رسالتك…" />
              <button className={btnP} type="submit"><Send size={16} /></button>
            </form>
          </div>
        </div>)}
    </div>
  );
}

const PREF_Q = [
  { k: "sleep", l: "مواعيد النوم", opts: ["أنام بدري", "أسهر", "مرن"] },
  { k: "smoking", l: "التدخين", opts: ["غير مدخن", "مدخن (برا الغرفة)", "عادي"] },
  { k: "guests", l: "الزيارات", opts: ["ممنوع الزيارات", "زيارات نادرة", "عادي الزيارات"] },
  { k: "cleanliness", l: "النظافة والنظام", opts: ["منظم جدًا", "منظم", "عشوائي شوية"] },
  { k: "study", l: "أسلوب المذاكرة", opts: ["مذاكرة هادئة", "مذاكرة جماعية", "بذاكر برا"] },
];
export function RoommatesView({ ctx }: { ctx: Ctx }) {
  const [data, setData] = useState<any>(null);
  const [f, setF] = useState<any>({ city: "", university: "", budget: 0, moveIn: today(), durationMonths: 0, gender: "", bio: "", visible: true, prefs: {} });
  const [edit, setEdit] = useState(false);
  const [msgTo, setMsgTo] = useState<Record<number, string>>({});
  const load = useCallback(async () => { try { const r = await api("/api/social?kind=roommates"); setData(r); if (r.mine) setF({ ...r.mine }); } catch (e: any) { ctx.toast(e.message, "err"); } }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  if (!data) return <div className="max-w-6xl mx-auto px-4 py-8"><Loading /></div>;
  const showForm = !data.mine || edit;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-deep flex items-center gap-2"><HeartHandshake className="text-primary" /> ابحث عن شريك سكن (رووم ميت)</h1>
      <p className="text-muted text-sm mb-6">مطابقة ذكية وشفافة: نسبة التوافق محسوبة من المدينة والجامعة والميزانية ومدة الإقامة ونمط الحياة — وبيانات تواصلك لا تظهر لحد إلا بعد قبولك الطلب. المطابقة داخل نفس النوع فقط.</p>
      {showForm ? (
        <form className={card + " p-5 space-y-4 mb-6"} onSubmit={async e => { e.preventDefault(); if (!f.city || !f.university || !f.gender || f.budget < 300 || f.durationMonths < 1) return ctx.toast("أكمل المدينة والجامعة والنوع والميزانية والمدة الفعلية"); try { await post("/api/social", { action: "roommate_profile", ...f }); ctx.toast("ملفك جاهز ✅ دلوقتي تقدر تشوف المطابقات"); setEdit(false); load(); } catch (err: any) { ctx.toast(err.message, "err"); } }}>
          <h3 className="font-black text-deep">{data.mine ? "تعديل ملفي" : "أنشئ ملف شريك السكن"}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="مدينة السكن"><select className={inp} value={f.city} onChange={e => setF({ ...f, city: e.target.value })}><option value="">اختر المدينة</option>{(ctx.settings?.cities || []).map((c: string) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="الجامعة"><select className={inp} value={f.university} onChange={e => setF({ ...f, university: e.target.value })}><option value="">—</option>{(ctx.settings?.universities || []).map((u: string) => <option key={u}>{u}</option>)}</select></Field>
            <Field label="النوع"><select className={inp} value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })}><option value="">اختر النوع</option><option>بنين</option><option>بنات</option></select></Field>
            <Field label="ميزانيتك الشهرية (ج.م)"><input type="number" min={300} step={50} className={inp} value={f.budget || ""} onChange={e => setF({ ...f, budget: Number(e.target.value) })} /></Field>
            <Field label="تاريخ الانتقال"><input type="date" className={inp} value={f.moveIn} onChange={e => setF({ ...f, moveIn: e.target.value })} /></Field>
            <Field label="مدة الإقامة (شهور)"><input type="number" min={1} max={24} className={inp} value={f.durationMonths || ""} onChange={e => setF({ ...f, durationMonths: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{PREF_Q.map(q => (
            <Field key={q.k} label={q.l}><select className={inp} value={f.prefs?.[q.k] || ""} onChange={e => setF({ ...f, prefs: { ...(f.prefs || {}), [q.k]: e.target.value } })}><option value="">— اختر —</option>{q.opts.map(o => <option key={o}>{o}</option>)}</select></Field>
          ))}</div>
          <Field label="نبذة عنك"><textarea className={inp} rows={3} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} placeholder="طالب هندسة سنة تانية، بدور على…" /></Field>
          <label className="flex items-center gap-2 text-sm font-bold text-deep"><input type="checkbox" checked={f.visible !== false} onChange={e => setF({ ...f, visible: e.target.checked })} className="w-4 h-4 accent-[#087F8C]" /> ملفي ظاهر للطلاب الآخرين</label>
          <div className="flex gap-2"><button className={btnP}>حفظ الملف</button>{data.mine && <button type="button" className={btnS} onClick={() => setEdit(false)}>إلغاء</button>}</div>
        </form>
      ) : (
        <div className={card + " p-4 mb-6 flex flex-wrap items-center gap-3"}>
          <Avatar name={ctx.user?.name || ""} size={46} />
          <div className="flex-1 min-w-[200px]"><p className="font-black text-deep">ملفي: {data.mine.city} • {data.mine.university} • ميزانية {egp(data.mine.budget)}</p><p className="text-[13px] text-muted">انتقال {fmtDate(data.mine.moveIn)} • {data.mine.durationMonths} شهور • {data.mine.visible ? "ظاهر للآخرين" : "مخفي"}</p></div>
          <button className={btnS} onClick={() => setEdit(true)}>تعديل ملفي</button>
        </div>
      )}
      {(data.requests || []).length > 0 && (
        <div className={card + " p-5 mb-6"}><h3 className="font-black text-deep mb-3">طلبات شراكة السكن</h3>
          <div className="space-y-3">{data.requests.map((r: any) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 bg-slate-50 rounded-xl p-3.5">
              <span className="text-sm flex-1 min-w-[220px]">{r.fromId === ctx.user?.id ? <>أرسلت طلبًا إلى <b>{r.to?.name}</b></> : <><b>{r.from?.name}</b> مهتم يشاركك السكن</>} <span className="text-primary font-black">({r.score}٪ توافق)</span>{r.message && <span className="block text-muted text-xs mt-0.5">«{r.message}»</span>}</span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${r.status === "accepted" ? "bg-emerald-100 text-emerald-800" : r.status === "rejected" ? "bg-red-100 text-red-700" : r.status === "withdrawn" ? "bg-slate-200" : "bg-amber-100 text-amber-800"}`}>{r.status === "accepted" ? "مقبول — تواصلوا بالرسائل 🎉" : r.status === "rejected" ? "مرفوض" : r.status === "withdrawn" ? "مسحوب" : "بانتظار الرد"}</span>
              {r.status === "pending" && r.toId === ctx.user?.id && <div className="flex gap-2"><button className={btnP} onClick={async () => { await post("/api/social", { action: "roommate_respond", requestId: r.id, decision: "accept" }); ctx.toast("قُبل الطلب 🎉"); load(); }}>قبول</button><button className={btnS} onClick={async () => { await post("/api/social", { action: "roommate_respond", requestId: r.id, decision: "reject" }); load(); }}>رفض</button></div>}
              {r.status === "pending" && r.fromId === ctx.user?.id && <button className={btnS} onClick={async () => { await post("/api/social", { action: "roommate_respond", requestId: r.id, decision: "withdraw" }); load(); }}>سحب الطلب</button>}
            </div>))}
          </div>
        </div>)}
      <h3 className="font-black text-deep text-lg mb-3">مطابقات مقترحة ليك</h3>
      {!data.mine ? <div className={card}><Empty title="أنشئ ملفك أولًا" sub="بعد إنشاء ملفك هنحسب توافقك مع باقي الطلاب ونعرض الأسباب" /></div> :
        data.profiles.length === 0 ? <div className={card}><Empty title="لا توجد ملفات متاحة حاليًا من نفس النوع" sub="جرّب توسّع المدينة أو الميزانية، أو ارجع قريبًا" /></div> :
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{data.profiles.map((p: any) => (
            <div key={p.id} className={card + " p-5"}>
              <div className="flex items-center gap-3">
                <Avatar name={p.user?.name || ""} size={48} />
                <div className="flex-1"><p className="font-black text-deep">{p.user?.name}</p><p className="text-xs text-muted">{p.user?.university}{p.user?.faculty ? ` — ${p.user.faculty}` : ""}</p></div>
                {p.match && <div className="text-center"><p className={`text-2xl font-black ${p.match.score >= 70 ? "text-emerald-600" : p.match.score >= 45 ? "text-amber-600" : "text-muted"}`}>{p.match.score}٪</p><p className="text-[10px] text-muted font-bold">توافق</p></div>}
              </div>
              <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden"><div className="h-full bg-gradient-to-l from-primary to-emerald-400 rounded-full transition-all" style={{ width: `${p.match?.score || 0}%` }} /></div>
              {p.match?.reasons?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2.5">{p.match.reasons.map((r: string) => <span key={r} className="bg-mint text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><BadgePercent size={11} />{r}</span>)}</div>}
              <p className="text-[13px] text-muted mt-3">{p.bio}</p>
              <div className="grid grid-cols-2 gap-1.5 text-[12px] mt-3 text-muted">
                <span>🏙 {p.city}</span><span>💰 ميزانية {egp(p.budget)}</span><span>📅 انتقال {fmtDate(p.moveIn)}</span><span>⏳ {p.durationMonths} شهور</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">{PREF_Q.map(q => p.prefs?.[q.k] && <span key={q.k} className="bg-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-600">{q.l}: {p.prefs[q.k]}</span>)}</div>
              <div className="flex gap-2 mt-4">
                <input className={inp} placeholder="رسالة قصيرة…" value={msgTo[p.userId] || ""} onChange={e => setMsgTo({ ...msgTo, [p.userId]: e.target.value })} />
                <button className={btnP} onClick={async () => { try { await post("/api/social", { action: "roommate_request", toId: p.userId, message: msgTo[p.userId] || "" }); ctx.toast("اتبعت طلبك ✅"); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}><Users size={15} /> اهتم</button>
              </div>
              <button className="text-[11px] text-muted underline mt-2" onClick={async () => { await post("/api/social", { action: "report", reason: "ملف شريك سكن مشبوه: " + p.user?.name }); ctx.toast("تم إرسال البلاغ للإدارة"); }}>إبلاغ / حظر</button>
            </div>))}
          </div>}
      <p className="text-xs text-muted mt-5 flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary" /> لأمانك: قابل شريك السكن أول مرة في مكان عام، ومتدفعش أي مبلغ خارج منصة سكني.</p>
    </div>
  );
}

export function SupportView({ ctx }: { ctx: Ctx }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [f, setF] = useState({ category: "حجوزات", subject: "", message: "" });
  const load = useCallback(async () => { try { const r = await api("/api/social?kind=tickets"); setTickets(r.tickets); } catch (e: any) { ctx.toast(e.message, "err"); } }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-deep flex items-center gap-2"><LifeBuoy className="text-primary" /> الدعم الفني</h1>
      <p className="text-muted text-sm mb-6">فريق الدعم بيرد خلال يوم عمل. للتذاكر العاجلة الخاصة بالحجوزات اذكر كود الحجز.</p>
      <form className={card + " p-5 space-y-4 mb-6"} onSubmit={async e => { e.preventDefault(); if (!f.subject.trim()) return ctx.toast("اكتب عنوان المشكلة", "err"); try { await post("/api/social", { action: "ticket", ...f }); ctx.toast("اتبعتت تذكرتك ✅"); setF({ category: "حجوزات", subject: "", message: "" }); load(); } catch (err: any) { ctx.toast(err.message, "err"); } }}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="التصنيف"><select className={inp} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}><option>حجوزات</option><option>مدفوعات واسترداد</option><option>توثيق سكن</option><option>مشكلة تقنية</option><option>إبلاغ عن سلوك</option><option>عام</option></select></Field>
          <Field label="عنوان المشكلة"><input className={inp} value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /></Field>
        </div>
        <Field label="تفاصيل المشكلة"><textarea className={inp} rows={4} value={f.message} onChange={e => setF({ ...f, message: e.target.value })} /></Field>
        <button className={btnP}><MessageCircle size={16} /> إرسال التذكرة</button>
      </form>
      <div className="space-y-3">
        {tickets.length === 0 ? <div className={card}><Empty title="لا تذاكر سابقة" /></div> : tickets.map(t => (
          <div key={t.id} className={card + " p-4"}>
            <div className="flex flex-wrap gap-2 items-center"><span className="font-black text-deep">{t.subject}</span><span className="bg-mint text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full">{t.category}</span><span className={`ms-auto text-[11px] font-bold px-2.5 py-1 rounded-full ${t.status === "open" ? "bg-amber-100 text-amber-800" : t.status === "closed" ? "bg-slate-200" : "bg-emerald-100 text-emerald-800"}`}>{t.status === "open" ? "قيد الانتظار ⏳" : t.status === "closed" ? "مغلقة" : "تم الرد ✅"}</span></div>
            <p className="text-sm text-muted mt-1">{t.message}</p>
            {t.reply && <p className="bg-mint/60 rounded-xl p-3 text-sm mt-2"><b className="text-primary-dark">رد الدعم:</b> {t.reply}</p>}
            <p className="text-[11px] text-muted mt-1.5">{fmtTime(t.createdAt)}</p>
          </div>))}
      </div>
    </div>
  );
}
