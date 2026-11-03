const base = import.meta.env.BASE_URL;

export default function SearchComparison({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "search" : undefined} className="deck-slide relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-search-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="search"] > :is(.slide-title, .compare-hero),
        [data-sakani-motion="search"] > .copy-stack > p { animation: sakani-search-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="search"] > .compare-hero { animation-delay: 120ms; }
        [data-sakani-motion="search"] > .copy-stack > p:nth-child(1) { animation-delay: 220ms; }
        [data-sakani-motion="search"] > .copy-stack > p:nth-child(2) { animation-delay: 320ms; }
        [data-sakani-motion="search"] > .copy-stack > p:nth-child(3) { animation-delay: 420ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="search"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title">بحث يناسب احتياجات كل طالب</h1>
      <div className="compare-hero"><p className="compare-number">٣</p><p className="compare-caption">خيارات للمقارنة معًا</p></div>
      <div className="copy-stack search-copy">
        <p>تصفية حسب الجامعة والمدينة ونوع السكن والميزانية</p>
        <p>اختيار المرافق والمسافة والتواريخ المناسبة</p>
        <p>مقارنة حتى ثلاثة خيارات سكن معًا</p>
      </div>
      <footer className="slide-footer"><span>سكني — البحث والمقارنة</span><span>٥ / ١٢</span></footer>
    </div>
  );
}
