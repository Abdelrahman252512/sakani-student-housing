const base = import.meta.env.BASE_URL;

export default function Problem({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "problem" : undefined} className="deck-slide blob-right relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-problem-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="problem"] > :is(.slide-title, .photo-pane),
        [data-sakani-motion="problem"] > .copy-stack > p { animation: sakani-problem-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="problem"] > .photo-pane { animation-delay: 120ms; }
        [data-sakani-motion="problem"] > .copy-stack > p:nth-child(1) { animation-delay: 220ms; }
        [data-sakani-motion="problem"] > .copy-stack > p:nth-child(2) { animation-delay: 320ms; }
        [data-sakani-motion="problem"] > .copy-stack > p:nth-child(3) { animation-delay: 420ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="problem"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title split-title">المشكلة: العثور على السكن يحتاج وضوحًا أكبر</h1>
      <figure className="photo-pane">
        <img src={`${base}visuals/search.jpg`} crossOrigin="anonymous" alt="طالب يراجع خيارات السكن على الهاتف والحاسوب" />
        <figcaption dir="ltr" className="photo-note">Abdelrahman Atef Fawzy</figcaption>
      </figure>
      <div className="copy-stack">
        <p>معلومات السكن موزعة بين إعلانات ومحادثات متعددة</p>
        <p>المقارنة بين السعر والموقع والتوافر ليست سهلة</p>
        <p>الطالب يحتاج معلومات أوضح قبل التواصل وطلب الحجز</p>
      </div>
      <footer className="slide-footer"><span>سكني — فكرة المشروع</span><span>٢ / ١٢</span></footer>
    </div>
  );
}
