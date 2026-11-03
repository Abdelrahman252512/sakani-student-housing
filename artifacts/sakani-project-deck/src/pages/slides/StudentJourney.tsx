const base = import.meta.env.BASE_URL;

export default function StudentJourney({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "journey" : undefined} className="deck-slide blob-right relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-journey-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="journey"] > .slide-title,
        [data-sakani-motion="journey"] > .journey-row > article { animation: sakani-journey-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="journey"] > .journey-row > article:nth-child(1) { animation-delay: 140ms; }
        [data-sakani-motion="journey"] > .journey-row > article:nth-child(2) { animation-delay: 240ms; }
        [data-sakani-motion="journey"] > .journey-row > article:nth-child(3) { animation-delay: 340ms; }
        [data-sakani-motion="journey"] > .journey-row > article:nth-child(4) { animation-delay: 440ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="journey"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title">رحلة الطالب في أربع خطوات</h1>
      <div className="journey-row">
        <article><p className="journey-number">١</p><h2>يحدد المدينة والجامعة والميزانية</h2></article>
        <article><p className="journey-number">٢</p><h2>يقارن خيارات السكن المناسبة</h2></article>
        <article><p className="journey-number">٣</p><h2>يراجع التفاصيل والتكلفة والتوافر</h2></article>
        <article><p className="journey-number">٤</p><h2>يرسل طلب الحجز ويتابع حالته</h2></article>
      </div>
      <footer className="slide-footer"><span>سكني — رحلة الاستخدام</span><span>٤ / ١٢</span></footer>
    </div>
  );
}
