const base = import.meta.env.BASE_URL;

export default function TechnologyMobile({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "technology" : undefined} className="deck-slide blob-right relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-technology-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="technology"] > :is(.slide-title, .phone-diagram),
        [data-sakani-motion="technology"] > .copy-stack > p { animation: sakani-technology-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="technology"] > .phone-diagram { animation-delay: 120ms; }
        [data-sakani-motion="technology"] > .copy-stack > p:nth-child(1) { animation-delay: 200ms; }
        [data-sakani-motion="technology"] > .copy-stack > p:nth-child(2) { animation-delay: 300ms; }
        [data-sakani-motion="technology"] > .copy-stack > p:nth-child(3) { animation-delay: 400ms; }
        [data-sakani-motion="technology"] > .copy-stack > p:nth-child(4) { animation-delay: 500ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="technology"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title">موقع متكامل وتجربة قابلة للتثبيت</h1>
      <div className="phone-diagram">
        <img src={`${base}brand/sakani.png`} crossOrigin="anonymous" alt="شعار سكني" />
        <h2>سكني</h2><p dir="ltr">PWA</p>
      </div>
      <div className="copy-stack technology-copy">
        <p>واجهة عربية متجاوبة مع الهواتف والحواسيب</p>
        <p><span dir="ltr">Next.js</span> و<span dir="ltr">TypeScript</span> لبناء التطبيق</p>
        <p><span dir="ltr">PostgreSQL</span> و<span dir="ltr">Drizzle ORM</span> لإدارة البيانات</p>
        <p>إعداد PWA للتثبيت من الرابط بعد نشر التحديث</p>
      </div>
      <footer className="slide-footer"><span>سكني — البنية التقنية</span><span>١٠ / ١٢</span></footer>
    </div>
  );
}
