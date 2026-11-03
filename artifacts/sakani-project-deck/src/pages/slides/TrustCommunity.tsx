const base = import.meta.env.BASE_URL;

export default function TrustCommunity({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "trust" : undefined} className="deck-slide blob-right relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-trust-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="trust"] > :is(.slide-title, .photo-pane),
        [data-sakani-motion="trust"] > .copy-stack > p { animation: sakani-trust-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="trust"] > .photo-pane { animation-delay: 120ms; }
        [data-sakani-motion="trust"] > .copy-stack > p:nth-child(1) { animation-delay: 220ms; }
        [data-sakani-motion="trust"] > .copy-stack > p:nth-child(2) { animation-delay: 320ms; }
        [data-sakani-motion="trust"] > .copy-stack > p:nth-child(3) { animation-delay: 420ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="trust"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title split-title">الثقة والتواصل داخل التجربة</h1>
      <figure className="photo-pane">
        <img src={`${base}visuals/community.jpg`} crossOrigin="anonymous" alt="طالبان يتعاونان على المذاكرة في مساحة مشتركة" />
        <figcaption dir="ltr" className="photo-note">Abdelrahman Atef Fawzy</figcaption>
      </figure>
      <div className="copy-stack trust-copy">
        <p>شارة التوثيق مرتبطة بموافقة الإدارة بعد المراجعة</p>
        <p>رسائل وإشعارات ودعم وإبلاغ عن المشكلات</p>
        <p>مطابقة شركاء السكن مع إخفاء بيانات التواصل قبل القبول</p>
      </div>
      <footer className="slide-footer"><span>سكني — الثقة والخصوصية</span><span>٨ / ١٢</span></footer>
    </div>
  );
}
