const base = import.meta.env.BASE_URL;

export default function NextSteps({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "next-steps" : undefined} className="deck-slide relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-next-steps-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="next-steps"] > .slide-title,
        [data-sakani-motion="next-steps"] > .status-list > article { animation: sakani-next-steps-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="next-steps"] > .status-list > article:nth-child(1) { animation-delay: 160ms; }
        [data-sakani-motion="next-steps"] > .status-list > article:nth-child(2) { animation-delay: 280ms; }
        [data-sakani-motion="next-steps"] > .status-list > article:nth-child(3) { animation-delay: 400ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="next-steps"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title">المرحلة الحالية وما يأتي بعدها</h1>
      <div className="status-list">
        <article className="status-row"><h2>الآن</h2><p>الوظائف الأساسية موجودة في التطبيق وقابلة للعرض</p></article>
        <article className="status-row"><h2>التوسع</h2><p>توسع في نطاق أكبر في جميع المحافظات</p></article>
        <article className="status-row"><h2>التالي</h2><p>الأولوية التالية: استكمال التكاملات والسياسات واختبارات التشغيل</p></article>
      </div>
      <footer className="slide-footer"><span>سكني — حدود النسخة الحالية</span><span>١١ / ١٢</span></footer>
    </div>
  );
}
