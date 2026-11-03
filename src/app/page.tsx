"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Home as HomeIcon, Search, MapPin, ShieldCheck, BedDouble, Users, Heart, Bell, Menu, X, ChevronDown,
  CalendarDays, Wallet, GraduationCap, Building2, MessageCircle, Star, CheckCircle2, Clock, Flag,
  Wifi, Snowflake, Bath, UtensilsCrossed, WashingMachine, BookOpen, Refrigerator, ShieldCheck as Sec, Sparkles,
  ArrowLeft, LogOut, LayoutDashboard, HeartHandshake, LifeBuoy, SlidersHorizontal, Eye, EyeOff, Share2, BadgeCheck, FileText, Scale,
} from "lucide-react";
import { api, post, egp, fmtDate, today, addDays, Ctx, View, PROP_TYPES } from "@/lib/client";
import { btnP, btnS, card, Empty, Loading, Field, inp, Modal, VerifiedBadge, Stars, Avatar } from "@/components/ui";
import { PropertyCard, QuoteBox } from "@/components/cards";
import { StudentDash, OwnerDash } from "@/components/dashboards";
import { AdminView } from "@/components/admin";
import { MessagesView, RoommatesView, SupportView } from "@/components/extra";
import { PwaInstallButton } from "@/components/pwa-install";
import { trackEvent } from "@/lib/analytics";

const AMENITY_ICON: Record<string, any> = { "واي فاي سريع": Wifi, "تكييف": Snowflake, "حمام خاص": Bath, "مطبخ مجهز": UtensilsCrossed, "غسالة": WashingMachine, "مكتب مذاكرة": BookOpen, "ثلاجة": Refrigerator, "أمن ٢٤ ساعة": Sec, "تنظيف أسبوعي": Sparkles };
export default function App() {
  const [boot, setBoot] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<View>({ name: "home" });
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const [authMode, setAuthMode] = useState<null | "login" | "register">(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any>({ notifications: [], unread: 0 });

  const toast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);
  const refreshBoot = useCallback(async () => {
    try { const b = await api("/api/bootstrap"); setBoot(b); setUser(b.me); } catch {}
  }, []);
  useEffect(() => { refreshBoot(); }, [refreshBoot]);
  useEffect(() => {
    const syncViewFromLocation = () => {
      const propertyParam = new URLSearchParams(window.location.search).get("property");
      const propertyId = propertyParam ? Number(propertyParam) : NaN;
      if (Number.isInteger(propertyId) && propertyId > 0) {
        setView({ name: "property", id: propertyId });
        return;
      }
      const savedView = window.history.state?.sakaniView as View | undefined;
      setView(savedView && typeof savedView.name === "string" ? savedView : { name: "home" });
    };
    syncViewFromLocation();
    window.addEventListener("popstate", syncViewFromLocation);
    return () => window.removeEventListener("popstate", syncViewFromLocation);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); setMenuOpen(false); setUserMenu(false); setNotifOpen(false); }, [view]);
  const loadNotifs = useCallback(async () => { if (!user) return; try { setNotifs(await api("/api/social?kind=notifications")); } catch {} }, [user]);
  useEffect(() => { loadNotifs(); const t = setInterval(loadNotifs, 30000); return () => clearInterval(t); }, [loadNotifs]);

  const nav = useCallback((v: View) => {
    setView(v);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (v.name === "property" && Number.isInteger(v.id) && (v.id || 0) > 0) {
      url.searchParams.set("property", String(v.id));
    } else {
      url.searchParams.delete("property");
    }
    const currentState = window.history.state && typeof window.history.state === "object"
      ? window.history.state as Record<string, unknown>
      : {};
    window.history.pushState(
      { ...currentState, sakaniView: v },
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);
  const ctx: Ctx = useMemo(() => ({ user, settings: boot?.settings, nav, toast, openAuth: (m = "login") => setAuthMode(m), setUser, boot, refreshBoot }), [user, boot, nav, toast, refreshBoot]);
  const settings = boot?.settings;
  const dashFor = () => user?.role === "admin" ? { name: "admin" } : user?.role === "owner" ? { name: "owner" } : { name: "dashboard" };
  const guarded = (v: View) => { if (!user) { setAuthMode("login"); toast("سجّل دخولك أولًا", "err"); return; } nav(v); };
  const logout = async () => { await post("/api/auth", { action: "logout" }); setUser(null); setNotifs({ notifications: [], unread: 0 }); nav({ name: "home" }); toast("تم تسجيل الخروج"); };

  const navLink = (v: View, label: string, needAuth = false) => (
    <button onClick={() => needAuth ? guarded(v) : nav(v)} className={`px-3 py-2 rounded-lg text-sm font-bold transition ${view.name === v.name ? "text-primary bg-mint" : "text-ink hover:text-primary"}`}>{label}</button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* announcement */}
      {settings?.announcement?.trim() && <div className="bg-deep text-white text-center text-[12.5px] font-bold py-2 px-4">{settings.announcement}</div>}
      {/* header */}
      <header className="sticky top-0 z-[60] bg-white/95 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 h-[68px] flex items-center gap-2">
          <button className="flex items-center gap-2.5 shrink-0" onClick={() => nav({ name: "home" })} aria-label="سكني - الرئيسية">
            <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-2xl object-cover shadow shadow-primary/20" />
            <span className="leading-none text-start"><span className="block font-black text-deep text-xl">سكني</span><span className="block text-[10px] text-muted font-bold -mt-0.5">سكن طلابي موثّق</span></span>
          </button>
          <nav className="hidden lg:flex items-center gap-1 mx-4" aria-label="التنقل الرئيسي">
            {navLink({ name: "search" }, "ابحث عن سكن")}
            {navLink({ name: "roommates" }, "شريك سكن", true)}
            {navLink({ name: "how" }, "كيف يعمل؟")}
            {navLink({ name: "owners" }, "للملّاك")}
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <PwaInstallButton />
            {user ? <>
              <button className="p-2.5 rounded-xl hover:bg-mint text-deep relative" onClick={() => guarded({ name: "favorites" })} aria-label="المفضلة"><Heart size={20} /></button>
              <button className="p-2.5 rounded-xl hover:bg-mint text-deep relative" onClick={() => guarded({ name: "messages" })} aria-label="الرسائل"><MessageCircle size={20} /></button>
              <div className="relative">
                <button className="p-2.5 rounded-xl hover:bg-mint text-deep relative" onClick={() => { setNotifOpen(!notifOpen); setUserMenu(false); loadNotifs(); }} aria-label="الإشعارات">
                  <Bell size={20} />{notifs.unread > 0 && <span className="absolute top-1.5 start-1.5 bg-red-500 text-white text-[10px] font-black rounded-full px-1 leading-4">{notifs.unread}</span>}
                </button>
                {notifOpen && <div className="absolute end-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-line rounded-2xl shadow-xl p-2 z-[70]">
                  <div className="flex justify-between px-2 py-1.5"><b className="text-deep text-sm">الإشعارات</b><button className="text-xs text-primary font-bold" onClick={async () => { await post("/api/social", { action: "read_notifications" }); loadNotifs(); }}>تعليم الكل كمقروء</button></div>
                  {notifs.notifications.length === 0 ? <p className="text-sm text-muted p-3">لا إشعارات بعد</p> : notifs.notifications.slice(0, 12).map((n: any) => <div key={n.id} className="px-2 py-2 rounded-lg hover:bg-slate-50"><p className="text-[13px] font-bold text-deep flex gap-1.5">{!n.isRead && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}{n.title}</p><p className="text-xs text-muted">{n.body}</p></div>)}
                </div>}
              </div>
              <div className="relative">
                <button className="flex items-center gap-2 rounded-full border border-line hover:border-primary ps-1 pe-3 py-1 transition" onClick={() => { setUserMenu(!userMenu); setNotifOpen(false); }}>
                  <Avatar name={user.name} size={32} /><span className="text-sm font-black text-deep hidden sm:block max-w-[110px] truncate">{user.name}</span><ChevronDown size={15} className="text-muted" />
                </button>
                {userMenu && <div className="absolute end-0 top-full mt-2 w-60 bg-white border border-line rounded-2xl shadow-xl p-2 z-[70]">
                  <div className="px-3 py-2 border-b border-line mb-1"><p className="font-black text-deep text-sm">{user.name}</p><p className="text-xs text-muted" dir="ltr" style={{ textAlign: "right" }}>{user.email}</p><span className="text-[10px] bg-mint text-primary-dark font-black px-2 py-0.5 rounded-full">{user.role === "admin" ? "مشرف" : user.role === "owner" ? "مالك سكن" : "طالب"}{user.isVerified ? " • موثّق ✅" : ""}</span></div>
                  {[{ v: dashFor(), l: user.role === "admin" ? "وحدة تحكم الإدارة" : user.role === "owner" ? "لوحة المالك" : "لوحتي وحجوزاتي", i: LayoutDashboard }, { v: { name: "messages" }, l: "رسائلي", i: MessageCircle }, { v: { name: "roommates" }, l: "شريك السكن", i: HeartHandshake }, { v: { name: "support" }, l: "الدعم الفني", i: LifeBuoy }].map(x => (
                    <button key={x.l} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-ink hover:bg-mint hover:text-primary" onClick={() => nav(x.v as View)}><x.i size={16} />{x.l}</button>))}
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50" onClick={logout}><LogOut size={16} /> تسجيل الخروج</button>
                </div>}
              </div>
            </> : <>
              <button className={btnS + " !py-2 hidden sm:inline-flex"} onClick={() => setAuthMode("login")}>دخول</button>
              <button className={btnP + " !py-2"} onClick={() => setAuthMode("register")}>حساب جديد</button>
            </>}
            <button className="lg:hidden p-2.5 rounded-xl hover:bg-mint" onClick={() => setMenuOpen(!menuOpen)} aria-label="القائمة">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        {menuOpen && <nav className="lg:hidden border-t border-line px-4 py-3 flex flex-col gap-1 bg-white">
          {navLink({ name: "search" }, "ابحث عن سكن")}{navLink({ name: "roommates" }, "شريك سكن", true)}{navLink({ name: "how" }, "كيف يعمل؟")}{navLink({ name: "owners" }, "للملّاك")}
          {!user && <button className={btnP + " mt-2"} onClick={() => setAuthMode("login")}>تسجيل الدخول</button>}
        </nav>}
      </header>

      <main className="flex-1">
        {!boot ? <div className="max-w-7xl mx-auto px-4 py-10"><Loading rows={4} /></div> :
          view.name === "home" ? <Home ctx={ctx} boot={boot} /> :
          view.name === "search" ? <SearchView ctx={ctx} initial={view.q} /> :
          view.name === "property" ? <PropertyDetail ctx={ctx} id={view.id!} /> :
          view.name === "how" ? <HowView ctx={ctx} boot={boot} /> :
          view.name === "owners" ? <OwnersInfo ctx={ctx} /> :
          !user ? <div className={card + " max-w-lg mx-auto my-16"}><Empty title="سجّل دخولك أولًا" sub="الصفحة دي للأعضاء فقط" action={<button className={btnP} onClick={() => setAuthMode("login")}>تسجيل الدخول</button>} /></div> :
          view.name === "dashboard" ? <StudentDash ctx={ctx} initialTab={view.tab} /> :
          view.name === "favorites" ? <StudentDash ctx={ctx} initialTab="favorites" /> :
          view.name === "owner" ? <OwnerDash ctx={ctx} initialTab={view.tab} /> :
          view.name === "admin" ? (user.role === "admin" ? <AdminView ctx={ctx} initialTab={view.tab} /> : <div className={card + " max-w-lg mx-auto my-16"}><Empty title="غير مصرح" sub="وحدة تحكم الإدارة للمشرفين فقط" /></div>) :
          view.name === "messages" ? <MessagesView ctx={ctx} initialConv={view.id} /> :
          view.name === "roommates" ? <RoommatesView ctx={ctx} /> :
          view.name === "support" ? <SupportView ctx={ctx} /> :
          <Home ctx={ctx} boot={boot} />}
      </main>

      <footer className="bg-deep text-white mt-4">
        <div className="max-w-7xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3"><img src="/icon-192.png" alt="" className="w-10 h-10 rounded-2xl object-cover" /><span className="font-black text-xl">سكني</span></div>
            <p className="text-white/70 text-sm leading-relaxed">منصة السكن الطلابي الموثّق في دمياط ودمياط الجديدة ورأس البر. أسعار واضحة من أول لحظة، وتوثيق حقيقي بالمستندات والمعاينة.</p>
          </div>
          <div><h4 className="font-black mb-3">للطلاب</h4><div className="flex flex-col gap-2 text-sm text-white/70">
            <button className="text-start hover:text-white" onClick={() => nav({ name: "search" })}>ابحث عن سكن</button>
            <button className="text-start hover:text-white" onClick={() => guarded({ name: "roommates" })}>شريك سكن</button>
            <button className="text-start hover:text-white" onClick={() => guarded({ name: "dashboard" })}>حجوزاتي</button>
            <button className="text-start hover:text-white" onClick={() => guarded({ name: "support" })}>الدعم الفني</button></div></div>
          <div><h4 className="font-black mb-3">للملّاك</h4><div className="flex flex-col gap-2 text-sm text-white/70">
            <button className="text-start hover:text-white" onClick={() => nav({ name: "owners" })}>اعرض سكنك</button>
            <button className="text-start hover:text-white" onClick={() => guarded({ name: "owner" })}>لوحة المالك</button>
            <span>العمولة الحالية {settings?.commissionPct ?? 0}٪</span></div></div>
          <div><h4 className="font-black mb-3">ثقة وأمان</h4><div className="text-sm text-white/70 space-y-2">
            <p>مراجعة مستندات التوثيق قبل ظهور الشارة</p><p>راجع شروط الإلغاء قبل إرسال طلب الحجز</p>
            <p>تفاصيل الأسعار تُحفظ مع طلب الحجز</p>{settings?.supportEmail && <p dir="ltr" style={{ textAlign: "right" }}>{settings.supportEmail}</p>}</div></div>
        </div>
        <div className="border-t border-white/10"><div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-2 justify-between text-[12px] text-white/50">
          <span>© ٢٠٢٦ سكني — دمياط، مصر.</span>
          <span>الدفع الإلكتروني غير مفعّل حاليًا.</span>
        </div></div>
      </footer>

      {authMode && <AuthModal ctx={ctx} mode={authMode} setMode={setAuthMode} onClose={() => setAuthMode(null)} />}
      <div className="fixed bottom-4 start-4 z-[90] space-y-2 max-w-[calc(100vw-2rem)]">
        {toasts.map(t => <div key={t.id} className={`fade-up px-4 py-3 rounded-2xl shadow-xl text-sm font-bold text-white ${t.type === "err" ? "bg-red-600" : "bg-deep"}`}>{t.msg}</div>)}
      </div>
    </div>
  );
}

function AuthModal({ ctx, mode, setMode, onClose }: any) {
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", role: "student", university: "", faculty: "" });
  const [busy, setBusy] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const submit = async (e: any) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await post("/api/auth", mode === "login" ? { action: "login", email: f.email, password: f.password } : { action: "register", ...f });
      trackEvent(mode === "login" ? "sign_in_completed" : "sign_up_completed", { role: r.user.role });
      ctx.setUser(r.user); ctx.toast(mode === "login" ? `أهلًا بعودتك ${r.user.name} 👋` : "تم إنشاء حسابك، أهلًا بيك في سكني 🎉");
      onClose(); ctx.nav(r.user.role === "admin" ? { name: "admin" } : r.user.role === "owner" ? { name: "owner" } : { name: "search" });
    } catch (err: any) { ctx.toast(err.message, "err"); } finally { setBusy(false); }
  };
  return (
    <Modal title={mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"} onClose={onClose}>
      <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 mb-5">
        {(["login", "register"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`py-2 rounded-lg text-sm font-black transition ${mode === m ? "bg-white text-primary shadow" : "text-muted"}`}>{m === "login" ? "دخول" : "حساب جديد"}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && <>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: "student", l: "أنا طالب 🎓" }, { v: "owner", l: "أنا مالك سكن 🏠" }].map(r => <button type="button" key={r.v} onClick={() => setF({ ...f, role: r.v })} className={`py-2.5 rounded-xl border-2 font-black text-sm transition ${f.role === r.v ? "border-primary bg-mint text-primary-dark" : "border-line text-muted"}`}>{r.l}</button>)}
          </div>
          <Field label="الاسم بالكامل"><input className={inp} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required placeholder="مثال: أحمد محمود" /></Field>
          <Field label="رقم الموبايل"><input className={inp} dir="ltr" style={{ textAlign: "right" }} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="01xxxxxxxxx" /></Field>
          {f.role === "student" && <div className="grid grid-cols-2 gap-3">
            <Field label="الجامعة"><select className={inp} value={f.university} onChange={e => setF({ ...f, university: e.target.value })}><option value="">— اختر —</option>{(ctx.settings?.universities || []).map((u: string) => <option key={u}>{u}</option>)}</select></Field>
            <Field label="الكلية"><input className={inp} value={f.faculty} onChange={e => setF({ ...f, faculty: e.target.value })} placeholder="الهندسة" /></Field>
          </div>}
        </>}
        <Field label="البريد الإلكتروني"><input type="email" dir="ltr" style={{ textAlign: "right" }} className={inp} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required placeholder="you@example.com" /></Field>
        <Field label="كلمة المرور" hint={mode === "register" ? "٨ أحرف على الأقل — تُحفظ مشفرة ولا يراها أحد" : undefined}>
          <div className="relative">
            <input type={passwordVisible ? "text" : "password"} className={inp} style={{ paddingInlineEnd: 42 }} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required />
            <button type="button" className="absolute top-1/2 -translate-y-1/2 text-muted hover:text-primary" style={{ insetInlineEnd: 12 }} onClick={() => setPasswordVisible(visible => !visible)} aria-label={passwordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={passwordVisible}>
              {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
        <button id="auth-submit" className={btnP + " w-full !py-3"} disabled={busy}>{busy ? "لحظة…" : mode === "login" ? "دخول" : "إنشاء الحساب"}</button>
      </form>
    </Modal>
  );
}

function Home({ ctx, boot }: { ctx: Ctx; boot: any }) {
  const s = boot?.settings || {};
  const [featured, setFeatured] = useState<any[]>([]);
  const [search, setSearch] = useState({ city: "", university: "", type: "", maxBudget: "", checkIn: today(), checkOut: addDays(today(), 30), guests: 1 });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useEffect(() => { api("/api/properties?sort=recommended").then(r => setFeatured((r.properties || []).filter((p: any) => p.featured).slice(0, 6).length ? (r.properties || []).filter((p: any) => p.featured).slice(0, 6) : (r.properties || []).slice(0, 6))).catch(() => {}); }, []);
  const go = () => {
    trackEvent("housing_search_started", {
      source: "home",
      has_city: Boolean(search.city),
      has_university: Boolean(search.university),
      has_type: Boolean(search.type),
      has_budget: Boolean(search.maxBudget),
      has_dates: Boolean(search.checkIn && search.checkOut),
    });
    ctx.nav({ name: "search", q: { ...search, maxBudget: search.maxBudget ? Number(search.maxBudget) : undefined } });
  };
  const st = boot?.stats || {};
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-deep">
        <div className="absolute inset-0 bg-gradient-to-l from-deep via-deep/85 to-deep/40" />
        <div className="relative max-w-7xl mx-auto px-4 py-8 lg:py-20">
          <div className="max-w-2xl text-white fade-up">
            <span className="inline-flex items-center gap-1.5 bg-primary/90 text-xs font-black px-3 py-1.5 rounded-full"><ShieldCheck size={14} /> مراجعة الإعلانات ومستندات التوثيق</span>
            <h1 className="text-3xl lg:text-[52px] font-black leading-[1.15] mt-3 lg:mt-4">سكنك الطلابي في دمياط ورأس البر، <span className="text-accent">بدون لف ودوران</span></h1>
            <p className="text-white/80 text-base lg:text-lg mt-2 lg:mt-3 leading-relaxed">ابحث في الإعلانات المنشورة، وقارن بيانات السكن والأسعار قبل إرسال طلبك. الدفع الإلكتروني غير مفعّل حاليًا.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 lg:gap-x-6 lg:gap-y-2 mt-4 lg:mt-6 text-sm">
              {[[st.published, "سكن منشور"], [st.beds, "سرير / وحدة"], [st.verifiedCount, "سكن موثّق ✅"], [st.confirmedBookings, "حجز مؤكد"]].map(([v, l]: any) => (
                <div key={l}><span className="text-xl lg:text-2xl font-black">{v ?? "—"}</span> <span className="text-white/70">{l}</span></div>
              ))}
            </div>
          </div>
          {/* search box */}
          <div className="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-5 mt-6 lg:mt-9 fade-up">
            <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
              <Field label="المدينة"><select className={inp} value={search.city} onChange={e => setSearch({ ...search, city: e.target.value })}><option value="">كل المدن</option>{(s.cities || []).map((c: string) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="الجامعة"><select className={inp} value={search.university} onChange={e => setSearch({ ...search, university: e.target.value })}><option value="">الكل</option>{(s.universities || []).map((u: string) => <option key={u}>{u}</option>)}</select></Field>
              <Field label="نوع السكن"><select className={inp} value={search.type} onChange={e => setSearch({ ...search, type: e.target.value })}><option value="">الكل</option>{PROP_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
              <Field label="الميزانية الشهرية حتى"><select className={inp} value={search.maxBudget} onChange={e => setSearch({ ...search, maxBudget: e.target.value })}><option value="">بدون حد</option><option value="1000">١٠٠٠ ج.م</option><option value="1500">١٥٠٠ ج.م</option><option value="2500">٢٥٠٠ ج.م</option><option value="4000">٤٠٠٠ ج.م</option><option value="8000">٨٠٠٠ ج.م</option></select></Field>
              <Field label="من تاريخ"><input type="date" className={inp} value={search.checkIn} onChange={e => setSearch({ ...search, checkIn: e.target.value })} /></Field>
              <Field label="إلى تاريخ"><input type="date" className={inp} value={search.checkOut} onChange={e => setSearch({ ...search, checkOut: e.target.value })} /></Field>
              <div className="flex items-end col-span-2 lg:col-span-1"><button className={btnP + " w-full !py-3 !text-base"} onClick={go}><Search size={19} /> ابحث</button></div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 text-[11px] text-muted items-center"><span className="font-bold">بحث سريع:</span>
              {[{ l: "سكن بنات آمن", q: { gender: "بنات" } }, { l: "أقل من ١٢٠٠/شهر", q: { maxBudget: 1200 } }, { l: "قرب جامعة حورس", q: { university: "جامعة حورس" } }, { l: "موثّق فقط ✅", q: { verified: true } }, { l: "رأس البر 🌊", q: { city: "رأس البر" } }].map(x => (
                <button key={x.l} className="bg-mint hover:bg-primary hover:text-white text-primary-dark font-bold px-2.5 py-1 rounded-full transition" onClick={() => ctx.nav({ name: "search", q: x.q })}>{x.l}</button>))}
            </div>
          </div>
        </div>
      </section>

      {/* trust strip */}
      <section className="max-w-7xl mx-auto px-4 -mt-2 pt-8">
        <div className="grid sm:grid-cols-3 gap-4">
          {[{ i: ShieldCheck, t: "توثيق حقيقي مش مجرد شارة", d: "كل شارة «موثّق» مرتبطة بسجل مراجعة مستندات ومعاينة — وتقدر تشوف تاريخ التوثيق في صفحة السكن." },
            { i: Wallet, t: "تفاصيل السعر قبل الطلب", d: "تعرض الصفحة الإيجار والتأمين والرسوم المسجلة. الأرقام تقديرية ولا تعني تحصيل أموال." },
            { i: CalendarDays, t: "الدفع الإلكتروني غير مفعّل", d: "يمكن إرسال طلب للمالك، لكن لا يُؤكد الطلب ماليًا ولا تُدخل بيانات بطاقة." }].map(x => (
            <div key={x.t} className={card + " p-5 flex gap-3.5"}><span className="w-11 h-11 rounded-2xl bg-mint text-primary flex items-center justify-center shrink-0"><x.i size={22} /></span><div><h3 className="font-black text-deep">{x.t}</h3><p className="text-sm text-muted leading-relaxed mt-1">{x.d}</p></div></div>))}
        </div>
      </section>

      {/* cities */}
      <section className="max-w-7xl mx-auto px-4 pt-12">
        <div className="flex items-end justify-between mb-5"><div><h2 className="text-2xl font-black text-deep">استكشف حسب المدينة</h2><p className="text-muted text-sm">أحياء الطلاب في محافظة دمياط</p></div>
          <button className="text-primary font-black text-sm flex items-center gap-1" onClick={() => ctx.nav({ name: "search" })}>كل السكن <ArrowLeft size={16} /></button></div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {(st.cityStats || []).map((c: any) => (
            <button key={c.city} onClick={() => ctx.nav({ name: "search", q: { city: c.city } })} className="relative h-36 rounded-2xl overflow-hidden group text-start bg-gradient-to-br from-primary to-primary-dark">
              <span className="absolute inset-0 bg-gradient-to-t from-deep/60 to-transparent" />
              <span className="absolute bottom-3 start-3 text-white"><span className="block font-black text-lg">{c.city}</span><span className="text-xs text-white/80">{c.count} سكن منشور</span></span>
            </button>))}
          {(st.cityStats || []).length === 0 && <p className="text-muted">لا مدن بها سكن منشور بعد</p>}
        </div>
      </section>

      {/* featured */}
      <section className="max-w-7xl mx-auto px-4 pt-12">
        <div className="flex items-end justify-between mb-5"><div><h2 className="text-2xl font-black text-deep">سكن مميز النهاردة</h2><p className="text-muted text-sm">من السكن المنشور والمتاح فعلًا للحجز</p></div>
          <button className="text-primary font-black text-sm flex items-center gap-1" onClick={() => ctx.nav({ name: "search" })}>عرض الكل <ArrowLeft size={16} /></button></div>
        {featured.length === 0 ? <div className={card}><Empty title="لسه مفيش سكن منشور" sub="كن أول مالك يعرض سكنه للطلاب في دمياط" action={<button className={btnP} onClick={() => ctx.nav({ name: "owners" })}>اعرض سكنك</button>} /></div>
          : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{featured.map((p: any) => <PropertyCard key={p.id} ctx={ctx} p={p} />)}</div>}
      </section>

      {/* types */}
      <section className="max-w-7xl mx-auto px-4 pt-12">
        <h2 className="text-2xl font-black text-deep mb-5">اختار أسلوب سكنك</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[{ t: "سرير مشترك", d: "الأرخص — من ٨٥٠/شهر", i: BedDouble }, { t: "غرفة خاصة", d: "خصوصية ومكتب مذاكرة", i: BookOpen }, { t: "استوديو", d: "مستقل بالكامل", i: HomeIcon }, { t: "شقة كاملة", d: "للمجموعات والأصدقاء", i: Building2 }, { t: "سكن طالبات", d: "إشراف نسائي وأمن كامل", i: ShieldCheck }].map(x => (
            <button key={x.t} onClick={() => ctx.nav({ name: "search", q: { type: x.t } })} className={card + " p-5 text-start hover:border-primary hover:shadow-lg transition group"}>
              <x.i size={26} className="text-primary mb-2.5 group-hover:scale-110 transition" /><p className="font-black text-deep">{x.t}</p><p className="text-xs text-muted mt-0.5">{x.d}</p>
            </button>))}
        </div>
      </section>

      {/* how + verification */}
      <section className="max-w-7xl mx-auto px-4 pt-14 grid lg:grid-cols-2 gap-5">
        <div className={card + " p-6"}>
          <h2 className="text-xl font-black text-deep mb-4">إزاي تحجز على سكني؟</h2>
          {[{ n: 1, t: "ابحث وقارن", d: "فلتر بالمدينة والجامعة والميزانية وقارن لحد ٣ سكن جنب بعض." }, { n: 2, t: "شوف السعر الكامل", d: "اختار التواريخ والوحدة — السعر يتحسب من الخادم وبيتثبّت في حجزك." }, { n: 3, t: "المالك يقبل طلبك", d: "طلبك بيروح للمالك، وبعد القبول تدفع الدفعة الأولى بأمان." }, { n: 4, t: "استلم سكنك", d: "بيظهر لك العنوان التفصيلي وبيانات المالك، وراسله داخل المنصة." }].map(x => (
            <div key={x.n} className="flex gap-3.5 py-3 border-b border-line last:border-0"><span className="w-8 h-8 rounded-full bg-primary text-white font-black flex items-center justify-center shrink-0">{x.n}</span><div><p className="font-black text-deep text-sm">{x.t}</p><p className="text-sm text-muted">{x.d}</p></div></div>))}
          <button className={btnP + " mt-4"} onClick={() => ctx.nav({ name: "search" })}>ابدأ البحث دلوقتي</button>
        </div>
        <div className="rounded-2xl bg-deep text-white p-6 relative overflow-hidden">
          <ShieldCheck size={150} className="absolute -bottom-6 -start-6 text-white/5" />
          <h2 className="text-xl font-black mb-3 relative">شارة التوثيق عندنا معناها إيه فعلًا؟</h2>
          <ul className="space-y-2.5 text-sm text-white/85 relative">
            {["المالك قدّم مستندات هوية وملكية (أو حق تأجير) وفريق سكني راجعها يدويًا.", "في حالات المعاينة بيتم زيارة السكن والتأكد من مطابقته للصور والوصف.", "الشارة مرتبطة بسجل توثيق له تاريخ ومراجِع — لا يستطيع المالك منحها لنفسه.", "لو التوثيق اترفض أو انتهى، الشارة بتتشال والإعلان بيرجع لحالة «يحتاج توثيق»."].map(x => <li key={x} className="flex gap-2"><CheckCircle2 size={17} className="text-accent shrink-0 mt-0.5" />{x}</li>)}
          </ul>
          <div className="mt-5 flex gap-2 relative">
            <button className="bg-accent text-deep font-black text-sm px-5 py-2.5 rounded-xl" onClick={() => ctx.nav({ name: "search", q: { verified: true } })}>السكن الموثّق فقط</button>
            <button className="border border-white/30 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/10" onClick={() => ctx.nav({ name: "owners" })}>أنا مالك — وثّق سكني</button>
          </div>
        </div>
      </section>

      {/* roommate CTA */}
      <section className="max-w-7xl mx-auto px-4 pt-10">
        <div className="rounded-3xl bg-mint border border-primary/15 p-6 sm:p-8 flex flex-wrap items-center gap-5">
          <span className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center"><HeartHandshake size={28} /></span>
          <div className="flex-1 min-w-[240px]"><h2 className="text-xl font-black text-deep">بدور على رووم ميت يشاركك الإيجار؟</h2><p className="text-muted text-sm mt-1">مطابقة ذكية بتوضح أسباب التوافق — ميزانية وجامعة ونمط حياة. بياناتك لا تظهر إلا بعد قبولك.</p></div>
          <button className={btnP + " !py-3"} onClick={() => ctx.user ? ctx.nav({ name: "roommates" }) : ctx.openAuth("register")}>اعرض مطابقاتي</button>
        </div>
      </section>

      {/* FAQ */}
      {!!boot?.faqs?.length && <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-black text-deep text-center mb-6">أسئلة شائعة</h2>
        <div className="space-y-2.5">
          {(boot?.faqs || []).map((f: any, i: number) => (
            <div key={f.id} className={card + " overflow-hidden"}>
              <button className="w-full flex items-center justify-between gap-3 px-5 py-4 text-start font-black text-deep text-[15px]" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>{f.q}<ChevronDown size={18} className={`text-primary shrink-0 transition ${openFaq === i ? "rotate-180" : ""}`} /></button>
              {openFaq === i && <p className="px-5 pb-5 text-sm text-muted leading-relaxed">{f.a}</p>}
            </div>))}
        </div>
      </section>}
    </div>
  );
}

function SearchView({ ctx, initial }: { ctx: Ctx; initial?: any }) {
  const s = ctx.settings || {};
  const [f, setF] = useState<any>({ q: "", city: "", type: "", gender: "", university: "", maxBudget: "", verified: false, amenities: [], maxDistance: "", checkIn: "", checkOut: "", sort: "recommended", page: 1, ...(initial || {}) });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [compare, setCompare] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const trackedFirstResults = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (f.q) sp.set("q", f.q); if (f.city) sp.set("city", f.city); if (f.type) sp.set("type", f.type); if (f.gender) sp.set("gender", f.gender);
    if (f.university) sp.set("university", f.university); if (f.maxBudget) sp.set("maxBudget", String(f.maxBudget)); if (f.verified) sp.set("verified", "1");
    if (f.amenities?.length) sp.set("amenities", f.amenities.join(",")); if (f.maxDistance) sp.set("maxDistance", String(f.maxDistance));
    if (f.checkIn && f.checkOut) { sp.set("checkIn", f.checkIn); sp.set("checkOut", f.checkOut); }
    sp.set("sort", f.sort); sp.set("page", String(f.page));
    try { setData(await api("/api/properties?" + sp.toString())); } catch (e: any) { ctx.toast(e.message, "err"); } finally { setLoading(false); }
  }, [f]); // eslint-disable-line
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    if (!data || trackedFirstResults.current) return;
    trackedFirstResults.current = true;
    trackEvent("search_results_viewed", {
      result_count: Number(data.total || 0),
      has_filters: Boolean(f.q || f.city || f.type || f.gender || f.university || f.maxBudget || f.verified || f.amenities?.length || f.maxDistance),
    });
  }, [data, f]);
  const set = (patch: any) => setF((x: any) => ({ ...x, ...patch, page: patch.page ?? 1 }));
  const comparedProps = (data?.properties || []).filter((p: any) => compare.includes(p.id));
  const filters = (
    <div className="space-y-4">
      <Field label="بحث بالاسم أو الحي"><div className="relative"><Search size={16} className="absolute top-3.5 text-muted" style={{ insetInlineStart: 12 }} /><input className={inp + " !ps-9"} style={{ paddingInlineStart: 36 }} value={f.q} onChange={e => set({ q: e.target.value })} placeholder="مثال: ميدان سرور…" /></div></Field>
      <Field label="المدينة"><select className={inp} value={f.city} onChange={e => set({ city: e.target.value })}><option value="">كل المدن</option>{(s.cities || []).map((c: string) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="الجامعة القريبة"><select className={inp} value={f.university} onChange={e => set({ university: e.target.value })}><option value="">الكل</option>{(s.universities || []).map((u: string) => <option key={u}>{u}</option>)}</select></Field>
      <Field label="نوع السكن"><select className={inp} value={f.type} onChange={e => set({ type: e.target.value })}><option value="">الكل</option>{PROP_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
      <Field label="مخصص لـ"><select className={inp} value={f.gender} onChange={e => set({ gender: e.target.value })}><option value="">الكل</option><option>بنين</option><option>بنات</option></select></Field>
      <Field label={`الميزانية الشهرية حتى: ${f.maxBudget ? egp(Number(f.maxBudget)) : "بدون حد"}`}>
        <input type="range" min={800} max={8000} step={100} className="w-full accent-[#087F8C]" value={f.maxBudget || 8000} onChange={e => set({ maxBudget: Number(e.target.value) >= 8000 ? "" : Number(e.target.value) })} />
      </Field>
      <Field label="المسافة القصوى من الجامعة"><select className={inp} value={f.maxDistance} onChange={e => set({ maxDistance: e.target.value })}><option value="">أي مسافة</option><option value="1">أقل من ١ كم 🚶</option><option value="3">أقل من ٣ كم</option><option value="5">أقل من ٥ كم</option><option value="15">أقل من ١٥ كم</option></select></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="وصول"><input type="date" className={inp} value={f.checkIn} onChange={e => set({ checkIn: e.target.value })} /></Field>
        <Field label="مغادرة"><input type="date" className={inp} value={f.checkOut} onChange={e => set({ checkOut: e.target.value })} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold text-deep bg-mint/60 rounded-xl px-3 py-2.5"><input type="checkbox" className="w-4 h-4 accent-[#087F8C]" checked={f.verified} onChange={e => set({ verified: e.target.checked })} /> موثّق فقط ✅</label>
      <div><p className="text-[13px] font-bold text-deep mb-2">مرافق لازم تكون موجودة</p>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pe-1">{(s.amenities || []).map((a: string) => (
          <label key={a} className="flex items-center gap-2 text-[13px] text-muted hover:text-ink cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-[#087F8C]" checked={(f.amenities || []).includes(a)} onChange={e => set({ amenities: e.target.checked ? [...(f.amenities || []), a] : (f.amenities || []).filter((x: string) => x !== a) })} />{a}</label>))}
        </div></div>
      <button className={btnS + " w-full"} onClick={() => setF({ q: "", city: "", type: "", gender: "", university: "", maxBudget: "", verified: false, amenities: [], maxDistance: "", checkIn: "", checkOut: "", sort: f.sort, page: 1 })}>مسح كل الفلاتر</button>
    </div>
  );
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div><h1 className="text-2xl font-black text-deep">السكن المتاح</h1><p className="text-muted text-sm">{loading ? "جارٍ البحث…" : `${data?.total ?? 0} نتيجة من قاعدة البيانات`}{f.checkIn && f.checkOut ? ` • متاح فعليًا من ${fmtDate(f.checkIn)} إلى ${fmtDate(f.checkOut)}` : ""}</p></div>
        <div className="ms-auto flex gap-2">
          <button className={btnS + " lg:hidden"} onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> فلاتر</button>
          <select className={inp + " !w-auto"} value={f.sort} onChange={e => set({ sort: e.target.value })} aria-label="ترتيب">
            <option value="recommended">الأكثر توصية</option><option value="price_asc">السعر: الأرخص</option><option value="price_desc">السعر: الأغلى</option><option value="rating">الأعلى تقييمًا</option><option value="distance">الأقرب للجامعة</option>
          </select>
        </div>
      </div>
      <div className="flex gap-5 items-start">
        <aside className={card + " hidden lg:block w-72 shrink-0 p-5 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto"}>{filters}</aside>
        <div className="flex-1 min-w-0">
          {loading ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skel h-80" />)}</div>
            : !data?.properties?.length ? <div className={card}><Empty title="لا نتائج مطابقة لبحثك" sub="جرّب توسّع الميزانية أو تشيل بعض المرافق أو تغيّر التواريخ — الإتاحة بتتحسب من الحجوزات الفعلية" action={<button className={btnP} onClick={() => setF({ q: "", city: "", type: "", gender: "", university: "", maxBudget: "", verified: false, amenities: [], maxDistance: "", checkIn: "", checkOut: "", sort: "recommended", page: 1 })}>عرض كل السكن</button>} /></div>
            : <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.properties.map((p: any) => <PropertyCard key={p.id} ctx={ctx} p={p} availabilityDatesSelected={Boolean(f.checkIn && f.checkOut)} compare={compare} onCompare={id => setCompare(c => c.includes(id) ? c.filter(x => x !== id) : c.length >= 3 ? (ctx.toast("المقارنة بحد أقصى ٣ سكن", "err"), c) : [...c, id])} />)}
              </div>
              {data.pages > 1 && <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: data.pages }).map((_, i) => <button key={i} onClick={() => set({ page: i + 1 })} className={`w-10 h-10 rounded-xl font-black ${f.page === i + 1 ? "bg-primary text-white" : "bg-white border border-line"}`}>{i + 1}</button>)}
              </div>}
            </>}
        </div>
      </div>
      {filtersOpen && <Modal title="فلاتر البحث" onClose={() => setFiltersOpen(false)} wide>{filters}<button className={btnP + " w-full mt-4"} onClick={() => setFiltersOpen(false)}>عرض النتائج</button></Modal>}
      {compare.length > 0 && <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 z-[65] bg-deep text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3" style={{ insetInlineStart: "50%", transform: "translateX(50%)" }}>
        <Scale size={18} /><span className="text-sm font-bold">{compare.length} في المقارنة</span>
        <button className="bg-accent text-deep text-sm font-black px-4 py-1.5 rounded-lg" onClick={() => setShowCompare(true)}>قارن الآن</button>
        <button className="text-white/70 text-xs underline" onClick={() => setCompare([])}>مسح</button>
      </div>}
      {showCompare && <Modal title="مقارنة السكن" onClose={() => setShowCompare(false)} wide>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
          <thead><tr><th className="p-2 text-start text-muted">وجه المقارنة</th>{comparedProps.map((p: any) => <th key={p.id} className="p-2 text-start"><span className="text-primary hover:underline cursor-pointer font-black" onClick={() => { setShowCompare(false); ctx.nav({ name: "property", id: p.id }); }}>{p.title}</span></th>)}</tr></thead>
          <tbody>{[
            ["أقل سعر شهري", (p: any) => p.minPrice ? egp(p.minPrice) : "—"],
            ["التقييم الحقيقي", (p: any) => p.rating ? `${p.rating} ⭐ (${p.reviewCount})` : "لا تقييمات بعد"],
            ["التوثيق", (p: any) => p.isVerified ? "✅ موثّق" : "غير موثّق"],
            ["المسافة للجامعة", (p: any) => `${p.distanceKm} كم عن ${p.university}`],
            ["النوع / مخصص", (p: any) => `${p.type} • ${p.gender}`],
            ["المنطقة", (p: any) => `${p.neighborhood}، ${p.city}`],
            ["عدد المرافق", (p: any) => `${(p.amenities || []).length} مرفق`],
            ["وحدات متاحة للتواريخ", (p: any) => String(p.availableUnits ?? p.units?.length ?? "—")],
          ].map(([l, fn]: any) => <tr key={l} className="border-t border-line"><td className="p-2.5 text-muted font-bold">{l}</td>{comparedProps.map((p: any) => <td key={p.id} className="p-2.5 font-bold text-deep">{fn(p)}</td>)}</tr>)}
          </tbody></table></div>
      </Modal>}
    </div>
  );
}

function PropertyDetail({ ctx, id }: { ctx: Ctx; id: number }) {
  const [data, setData] = useState<any>(null);
  const [img, setImg] = useState(0);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 30));
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [quoteData, setQuoteData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [idemKey] = useState(() => "web-" + Math.random().toString(36).slice(2) + Date.now());
  const load = useCallback(async () => {
    try { const r = await api(`/api/properties?id=${id}&checkIn=${checkIn}&checkOut=${checkOut}`); setData(r); if (!unitId && r.property?.units?.[0]) setUnitId(r.property.units[0].id); }
    catch (e: any) { ctx.toast(e.message, "err"); ctx.nav({ name: "search" }); }
  }, [id, checkIn, checkOut]); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!data?.property) return;
    trackEvent("property_detail_viewed", {
      property_type: String(data.property.type || "unknown"),
      city: String(data.property.city || "unknown"),
      verified: Boolean(data.property.isVerified),
    });
  }, [data?.property?.id]);
  const fetchQuote = useCallback(async () => {
    if (!unitId) return;
    try { const r = await post("/api/bookings", { action: "quote", unitId, checkIn, checkOut }); setQuoteData(r.quote); }
    catch (e: any) { setQuoteData(null); ctx.toast(e.message, "err"); }
  }, [unitId, checkIn, checkOut]); // eslint-disable-line
  useEffect(() => { const t = setTimeout(fetchQuote, 300); return () => clearTimeout(t); }, [fetchQuote]);
  if (!data) return <div className="max-w-7xl mx-auto px-4 py-8"><Loading rows={5} /></div>;
  const p = data.property; const unit = (p.units || []).find((u: any) => u.id === unitId);
  const book = async () => {
    if (!ctx.user) return ctx.openAuth("login");
    if (!unit) return ctx.toast("اختار وحدة أولًا", "err");
    setBusy(true);
    try {
      const r = await post("/api/bookings", { propertyId: p.id, unitId, checkIn, checkOut, guests, notes, idempotencyKey: idemKey });
      trackEvent("booking_request_submitted", { property_type: String(p.type || "unknown"), role: String(ctx.user.role) });
      ctx.toast(`تم إرسال طلب الحجز ${r.booking.code} للمالك ✅`);
      ctx.nav(ctx.user.role === "owner" ? { name: "owner", tab: "bookings" } : { name: "dashboard" });
    } catch (e: any) { ctx.toast(e.message, "err"); } finally { setBusy(false); }
  };
  const messageOwner = async () => {
    if (!ctx.user) return ctx.openAuth("login");
    try { const r = await post("/api/social", { action: "start_conversation", propertyId: p.id, text: `أهلًا، مهتم بسكن «${p.title}» وحابب أستفسر عن التوفر من ${checkIn}.` }); ctx.nav({ name: "messages", id: r.conversation.id }); }
    catch (e: any) { ctx.toast(e.message, "err"); }
  };
  const copyPropertyLink = async () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.search = "";
    shareUrl.searchParams.set("property", String(p.id));
    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      ctx.toast("تم نسخ رابط السكن");
    } catch {
      ctx.toast("تعذر نسخ الرابط؛ انسخه من شريط العنوان", "err");
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button className="text-primary font-bold text-sm flex items-center gap-1 mb-4" onClick={() => ctx.nav({ name: "search" })}><ArrowLeft size={16} style={{ transform: "scaleX(-1)" }} /> رجوع لنتائج البحث</button>
      <div className="flex flex-wrap gap-3 items-start">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl sm:text-3xl font-black text-deep leading-snug">{p.title}</h1>
          <p className="text-muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="flex items-center gap-1"><MapPin size={15} className="text-primary" />{p.neighborhood}، {p.city}</span>
            <span className="flex items-center gap-1"><GraduationCap size={15} className="text-primary" />{p.distanceKm} كم من {p.university}</span>
            {p.rating && <span className="flex items-center gap-1 font-black text-deep"><Star size={15} className="fill-amber-400 text-amber-400" />{p.rating} ({p.reviewCount} تقييم حقيقي)</span>}
            <span className="flex items-center gap-1"><Eye size={15} />{p.views} مشاهدة</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">{p.isVerified && <VerifiedBadge />}
          <button className={btnS + " !px-2"} onClick={copyPropertyLink} aria-label="نسخ رابط السكن" title="نسخ رابط السكن"><Share2 size={16} /> نسخ الرابط</button>
          <button className={btnS + " !px-3"} onClick={async () => { if (!ctx.user) return ctx.openAuth("login"); try { const r = await post("/api/social", { action: "toggle_fav", propertyId: p.id }); trackEvent("favorite_toggled", { favorited: Boolean(r.fav), property_type: String(p.type || "unknown") }); ctx.toast(r.fav ? "أُضيف للمفضلة ❤️" : "أُزيل من المفضلة"); load(); } catch (e: any) { ctx.toast(e.message, "err"); } }}><Heart size={17} className={p.isFav ? "fill-red-500 text-red-500" : ""} /></button>
          <button className={btnS + " !px-3"} onClick={() => ctx.user ? setReportOpen(true) : ctx.openAuth("login")} aria-label="إبلاغ"><Flag size={16} /></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6 items-start">
        <div className="lg:col-span-2 space-y-5 min-w-0">
          <div>
            <div className="rounded-3xl overflow-hidden h-[320px] sm:h-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images?.[img]} alt={p.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2 mt-2.5">{(p.images || []).map((im: string, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={im} alt="" onClick={() => setImg(i)} className={`w-24 h-16 object-cover rounded-xl cursor-pointer border-2 transition ${img === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`} />))}
            </div>
          </div>

          <section className={card + " p-5"}>
            <h2 className="font-black text-deep text-lg mb-2">عن السكن</h2>
            <div className="flex flex-wrap gap-2 mb-3">{[p.type, `مخصص: ${p.gender}`, `الحالة: منشور ومتاح`].map(x => <span key={x} className="bg-mint text-primary-dark text-xs font-bold px-3 py-1 rounded-full">{x}</span>)}</div>
            <p className="text-muted leading-relaxed text-[15px]">{p.description}</p>
            {p.rules && <><h3 className="font-black text-deep mt-5 mb-1.5">قوانين السكن</h3><p className="text-muted text-sm leading-relaxed">{p.rules}</p></>}
          </section>

          <section className={card + " p-5"}>
            <h2 className="font-black text-deep text-lg mb-3.5">المرافق والخدمات</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">{(p.amenities || []).map((a: string) => { const I = AMENITY_ICON[a] || CheckCircle2; return <span key={a} className="flex items-center gap-2 bg-slate-50 border border-line/60 rounded-xl px-3 py-2.5 text-sm font-bold text-deep"><I size={17} className="text-primary shrink-0" />{a}</span>; })}</div>
          </section>

          <section className={card + " p-5"}>
            <h2 className="font-black text-deep text-lg mb-3.5">الغرف والوحدات — الإتاحة للتواريخ المختارة</h2>
            <div className="space-y-3">{(p.units || []).map((u: any) => (
              <button key={u.id} onClick={() => setUnitId(u.id)} className={`w-full text-start rounded-2xl border-2 p-4 transition ${unitId === u.id ? "border-primary bg-mint/50" : "border-line bg-white hover:border-primary/50"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-deep">{u.name}</span>
                  <span className="text-[11px] bg-slate-100 font-bold px-2 py-0.5 rounded-full text-muted">{u.unitType}</span>
                  <span className={`ms-auto text-[11px] font-black px-2.5 py-1 rounded-full ${u.freeBeds > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>{u.freeBeds > 0 ? `متاح (${u.freeBeds} من ${u.totalBeds})` : "ممتلئ بالتواريخ دي"}</span>
                </div>
                <p className="text-[13px] text-muted mt-1.5 flex flex-wrap gap-x-4"><span>شهريًا: <b className="text-primary">{egp(u.monthlyPrice)}</b></span><span>تأمين: {egp(u.deposit)}</span><span>تنظيف: {egp(u.cleaningFee)}</span><span>سعة: {u.capacity} {u.capacity > 1 ? "أفراد" : "فرد"}</span><span>من {fmtDate(u.availableFrom)}</span><span>خصم ترم: {u.semesterDiscountPct}٪</span></p>
              </button>))}
            </div>
            {(data.bookedRanges || []).length > 0 && <div className="mt-4"><h3 className="font-bold text-deep text-sm mb-1.5 flex items-center gap-1.5"><Clock size={15} className="text-primary" /> فترات محجوزة فعلًا</h3>
              <div className="flex flex-wrap gap-1.5">{data.bookedRanges.map((r: any, i: number) => <span key={i} className="text-[11px] bg-red-50 text-red-700 border border-red-100 font-bold px-2.5 py-1 rounded-full">{fmtDate(r.checkIn)} ← {fmtDate(r.checkOut)}</span>)}</div></div>}
          </section>

          <section className={card + " p-5"}>
            <h2 className="font-black text-deep text-lg mb-1">التقييمات الحقيقية {p.rating && <span className="text-primary">⭐ {p.rating}</span>}</h2>
            <p className="text-xs text-muted mb-4">التقييم متاح فقط للطلاب أصحاب الإقامات المكتملة — عشان كده التقييمات هنا موثوقة.</p>
            {(data.reviews || []).length === 0 ? <p className="text-muted text-sm">لا توجد تقييمات لهذا السكن بعد.</p> : <div className="space-y-4">{data.reviews.map((r: any) => (
              <div key={r.id} className="border-b border-line last:border-0 pb-4">
                <div className="flex items-center gap-3"><Avatar name={r.student?.name || ""} size={36} /><div><p className="font-black text-deep text-sm">{r.student?.name} <span className="text-muted font-medium text-xs">{r.student?.university}</span></p><Stars v={r.rating} size={14} /></div><span className="ms-auto text-[11px] text-muted">{fmtDate(r.createdAt)}</span></div>
                <p className="text-sm text-muted mt-2 leading-relaxed">{r.text}</p>
                {r.ownerResponse && <p className="bg-mint/60 rounded-xl p-3 text-[13px] mt-2"><b className="text-primary-dark">رد المالك:</b> {r.ownerResponse}</p>}
              </div>))}</div>}
          </section>

          <section className={card + " p-5 flex flex-wrap items-center gap-4"}>
            <Avatar name={p.owner?.name || ""} size={54} />
            <div className="flex-1 min-w-[180px]">
              <p className="font-black text-deep">{p.owner?.name} {p.owner?.isVerified && <span className="text-primary text-xs font-black">مالك موثّق ✅</span>}</p>
              <p className="text-xs text-muted">عضو منذ {fmtDate(p.owner?.createdAt)}</p>
              {p.isVerified && data.verifications?.length > 0 && <p className="text-xs text-primary-dark font-bold mt-1 flex items-center gap-1"><BadgeCheck size={14} /> آخر توثيق: {data.verifications[0].type} — {fmtDate(data.verifications[0].reviewedAt)}</p>}
            </div>
            <button className={btnS} onClick={messageOwner}><MessageCircle size={16} /> مراسلة المالك</button>
          </section>
          <p className="text-xs text-muted flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary" /> {p.addressNote} — العنوان التفصيلي وبيانات الاتصال لا تظهر إلا بعد تأكيد الحجز حمايةً للخصوصية.</p>
        </div>

        {/* Booking panel */}
        <aside className="lg:sticky lg:top-24">
          <div className={card + " p-5 space-y-4 shadow-lg shadow-deep/5"}>
            <div className="flex items-end justify-between">
              <div><span className="text-xs text-muted block">الوحدة المختارة</span><span className="font-black text-primary text-2xl">{unit ? egp(unit.monthlyPrice) : "—"}</span><span className="text-muted text-sm"> / شهر</span></div>
              {p.rating && <span className="font-black text-deep flex items-center gap-1"><Star size={16} className="fill-amber-400 text-amber-400" />{p.rating}</span>}
            </div>
            <p className="text-sm font-bold text-deep bg-slate-50 rounded-lg px-3 py-2">{unit?.name || "اختار وحدة من القائمة"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="تاريخ الوصول"><input type="date" className={inp} value={checkIn} min={today()} onChange={e => setCheckIn(e.target.value)} /></Field>
              <Field label="تاريخ المغادرة"><input type="date" className={inp} value={checkOut} min={addDays(checkIn, 14)} onChange={e => setCheckOut(e.target.value)} /></Field>
            </div>
            <Field label={unit?.unitType?.includes("سرير") ? "عدد الأسرّة" : "عدد الأفراد"}>
              <select className={inp} value={guests} onChange={e => setGuests(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}</select>
            </Field>
            <Field label="ملاحظات للمالك (اختياري)"><input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثال: أفضل سرير سفلي…" /></Field>
            {quoteData ? <QuoteBox q={quoteData} settings={ctx.settings} /> : <p className="text-sm text-muted bg-slate-50 rounded-xl p-3">اختار وحدة وتواريخ صحيحة (حد أدنى ١٤ يوم) عشان يظهر السعر المفصل.</p>}
            <button className={btnP + " w-full !py-3.5 !text-base"} disabled={busy || !unit || unit.freeBeds <= 0} onClick={book}>
              {unit && unit.freeBeds <= 0 ? "الوحدة ممتلئة في التواريخ دي" : busy ? "جارٍ إرسال الطلب…" : "اطلب الحجز — بدون دفع الآن"}
            </button>
            <p className="text-[11px] text-muted text-center leading-relaxed">طلبك بيروح للمالك للمراجعة. الدفع الإلكتروني غير مفعّل حاليًا؛ موافقة المالك وحدها لا تؤكد حجزًا مدفوعًا، ولا تُدخل بيانات بطاقة.</p>
            <button className={btnS + " w-full"} onClick={messageOwner}><MessageCircle size={16} /> اسأل المالك قبل الحجز</button>
          </div>
          <div className="bg-mint/70 border border-primary/10 rounded-2xl p-4 mt-3 text-[12px] text-primary-dark space-y-1.5">
            <p className="flex gap-1.5"><ShieldCheck size={15} /> التأمين بيرجع لك كامل بعد تسليم السكن بحالته.</p>
            <p className="flex gap-1.5"><FileText size={15} /> الأسعار النهائية بتتخزن في «عقد» الحجز — أي تعديل سعر لاحق لا يمس حجزك.</p>
            <p className="flex gap-1.5"><Users size={15} /> الدفع الإلكتروني غير مفعّل حاليًا؛ لا تُدخل بيانات بطاقة.</p>
          </div>
        </aside>
      </div>
      {reportOpen && <ReportModal ctx={ctx} propertyId={p.id} onClose={() => setReportOpen(false)} />}
    </div>
  );
}
function ReportModal({ ctx, propertyId, onClose }: any) {
  const [reason, setReason] = useState("معلومات غير دقيقة"); const [details, setDetails] = useState("");
  return <Modal title="الإبلاغ عن هذا السكن" onClose={onClose}>
    <div className="space-y-4">
      <Field label="سبب البلاغ"><select className={inp} value={reason} onChange={e => setReason(e.target.value)}><option>معلومات غير دقيقة</option><option>صور مضللة</option><option>طلب دفع خارج المنصة</option><option>سلوك غير لائق</option><option>السكن غير موجود</option><option>أخرى</option></select></Field>
      <Field label="تفاصيل إضافية للإدارة"><textarea className={inp} rows={4} value={details} onChange={e => setDetails(e.target.value)} placeholder="اشرح المشكلة بالتفصيل…" /></Field>
      <button className={btnP + " w-full"} onClick={async () => { try { await post("/api/social", { action: "report", propertyId, reason, details }); ctx.toast("وصل بلاغك لفريق الإشراف وهيتراجع ✅"); onClose(); } catch (e: any) { ctx.toast(e.message, "err"); } }}>إرسال البلاغ</button>
      <p className="text-[11px] text-muted">البلاغ بيتحول لملف عند الإدارة مع سجل تدقيق — وقد يؤدي لتعليق الإعلان.</p>
    </div>
  </Modal>;
}

function HowView({ ctx, boot }: any) {
  const s = boot?.settings || {};
  return <div className="max-w-5xl mx-auto px-4 py-10">
    <h1 className="text-3xl font-black text-deep text-center">كيف يعمل سكني؟</h1>
    <p className="text-muted text-center mt-2 mb-10">منصة مصرية مصممة لطالب دمياط ورأس البر من أول سنة لحد التخرج</p>
    <div className="grid md:grid-cols-2 gap-5">
      <div className={card + " p-6"}><GraduationCap className="text-primary mb-3" size={30} /><h2 className="font-black text-deep text-lg mb-3">للطالب</h2>
        <ol className="space-y-3 text-sm text-muted leading-relaxed list-none">
          {["ابحث حسب المدينة والجامعة والميزانية والمرافق.", "راجع بيانات كل إعلان والأسعار التي أدخلها المالك.", "أرسل طلب حجز إلى المالك وتابع حالته من حسابك.", "الدفع الإلكتروني غير مفعّل حاليًا؛ لا تُدخل بيانات بطاقة أو محفظة.", "يمكن إضافة تقييم بعد تسجيل إقامة مكتملة على المنصة."].map((x, i) => <li key={i} className="flex gap-2.5"><span className="w-6 h-6 rounded-full bg-mint text-primary font-black text-xs flex items-center justify-center shrink-0">{i + 1}</span>{x}</li>)}
        </ol>
        <button className={btnP + " mt-5"} onClick={() => ctx.nav({ name: "search" })}>ابحث عن سكنك</button>
      </div>
      <div className={card + " p-6"}><Building2 className="text-primary mb-3" size={30} /><h2 className="font-black text-deep text-lg mb-3">للمالك</h2>
        <ol className="space-y-3 text-sm text-muted leading-relaxed list-none">
          {["أدخل بيانات السكن والوحدات والأسعار، ثم أرسل الإعلان للمراجعة.", "ارفع مستندات الهوية والملكية أو حق التأجير؛ لا تظهر شارة التوثيق قبل المراجعة.", "تابع طلبات الحجز وتواصل مع الطلاب من لوحة المالك.", "حدّث الأسعار والتوافر، وتظهر التغييرات بعد نشر الإعلان.", `العمولة الحالية ${s.commissionPct ?? 0}٪؛ راجع الشروط المعروضة قبل نشر أي إعلان.`].map((x, i) => <li key={i} className="flex gap-2.5"><span className="w-6 h-6 rounded-full bg-mint text-primary font-black text-xs flex items-center justify-center shrink-0">{i + 1}</span>{x}</li>)}
        </ol>
        <button className={btnP + " mt-5"} onClick={() => ctx.nav({ name: "owners" })}>اعرض سكنك عندنا</button>
      </div>
    </div>
    <div className={card + " p-6 mt-5"}>
      <h2 className="font-black text-deep text-lg mb-3">الدفع وشروط الإلغاء</h2>
      <p className="text-sm text-muted leading-relaxed">الدفع الإلكتروني والاسترداد عبر المنصة غير مفعّلين حاليًا. لا تُدخل بيانات دفع. اتفق مع المالك على شروط الإقامة قبل إرسال طلب الحجز.</p>
    </div>
    <div className="text-center mt-8"><button className={btnS} onClick={() => ctx.user ? ctx.nav({ name: "support" }) : ctx.openAuth("register")}>لسه عندك سؤال؟ كلمنا في الدعم</button></div>
  </div>;
}

function OwnersInfo({ ctx }: { ctx: Ctx }) {
  const s = ctx.settings || {};
  const start = () => ctx.user?.role === "owner" || ctx.user?.role === "admin" ? ctx.nav({ name: "owner", tab: "new" }) : ctx.user ? ctx.toast("حسابك الحالي طالب — سجّل حساب مالك منفصل لعرض السكن", "err") : ctx.openAuth("register");
  return <div className="max-w-6xl mx-auto px-4 py-10">
    <div className="bg-deep rounded-3xl text-white p-7 sm:p-10 flex flex-wrap gap-6 items-center relative overflow-hidden">
      <Building2 size={170} className="absolute -bottom-8 -start-8 text-white/5" />
      <div className="flex-1 min-w-[260px] relative">
        <h1 className="text-3xl sm:text-4xl font-black leading-snug">عندك شقة أو غرف فاضية في دمياط أو رأس البر؟</h1>
        <p className="text-white/75 mt-3 leading-relaxed">حوّلها لسكن طلابي بدخل شهري منتظم طوال العام الدراسي. طلاب جامعة دمياط وحورس والمعاهد بيدوّروا على سكن زي بتاعك دلوقتي — من غير وسطاء ولا إعلانات عشوائية.</p>
        <div className="flex flex-wrap gap-5 mt-5 text-sm"><span>إدارة الوحدات والأسعار من لوحة المالك</span><span>مراجعة الإعلانات قبل النشر</span><span>متابعة طلبات الحجز من حسابك</span></div>
      </div>
      <button className="bg-accent text-deep font-black px-7 py-3.5 rounded-2xl text-lg relative hover:brightness-105 transition" onClick={start}>أضف سكنك مجانًا</button>
    </div>
    <div className="grid sm:grid-cols-3 gap-4 mt-6">
      {[{ i: ShieldCheck, t: "توثيق يبني الثقة", d: "ارفع مستندات الملكية مرة واحدة، وخد شارة «موثّق» اللي بتضاعف طلبات الحجز." }, { i: CalendarDays, t: "تحكم كامل في الإتاحة", d: "حدد الأسِرّة والأسعار وفترات التوفر — والنظام بيمنع أي حجز مزدوج تلقائيًا." }, { i: Wallet, t: "حسابات واضحة", d: "شوف إيرادك الصافي بعد العمولة لكل سكن، وتابع حجوزاتك ومشاهداتك من لوحة واحدة." }].map(x => (
        <div key={x.t} className={card + " p-5"}><x.i className="text-primary mb-2.5" size={26} /><h3 className="font-black text-deep">{x.t}</h3><p className="text-sm text-muted mt-1 leading-relaxed">{x.d}</p></div>))}
    </div>
    <div className={card + " p-6 mt-5"}>
      <h2 className="font-black text-deep text-lg mb-3">خطوات البدء (١٠ دقائق)</h2>
      <div className="grid sm:grid-cols-4 gap-3 text-center">
        {["أنشئ حساب مالك", "أضف السكن والغرف والأسعار", "قدّم مستندات التوثيق", "استقبل طلبات الطلاب"].map((x, i) => (
          <div key={x} className="bg-mint/60 rounded-2xl p-4"><span className="w-8 h-8 rounded-full bg-primary text-white font-black inline-flex items-center justify-center">{i + 1}</span><p className="font-bold text-deep text-sm mt-2">{x}</p></div>))}
      </div>
      <button className={btnP + " mt-5"} onClick={start}>ابدأ دلوقتي</button>
    </div>
  </div>;
}
