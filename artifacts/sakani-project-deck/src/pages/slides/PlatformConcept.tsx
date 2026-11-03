const base = import.meta.env.BASE_URL;

export default function PlatformConcept({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "concept" : undefined} className="deck-slide relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-concept-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="concept"] > .slide-title,
        [data-sakani-motion="concept"] > .concept-band > :is(img, article) { animation: sakani-concept-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="concept"] > .concept-band > img { animation-delay: 120ms; }
        [data-sakani-motion="concept"] > .concept-band > article:nth-of-type(1) { animation-delay: 220ms; }
        [data-sakani-motion="concept"] > .concept-band > article:nth-of-type(2) { animation-delay: 320ms; }
        [data-sakani-motion="concept"] > .concept-band > article:nth-of-type(3) { animation-delay: 420ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="concept"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title">الفكرة: منصة واحدة تجمع رحلة السكن</h1>
      <div className="concept-band">
        <img src={`${base}visuals/room.jpg`} crossOrigin="anonymous" alt="مشهد تصوري مولّد بالذكاء الاصطناعي لسكن طلابي ومكان للمذاكرة، وليس إعلانًا حقيقيًا" />
        <div className="concept-shade" aria-hidden="true" />
        <article><p>سكن طلابي في دمياط ودمياط الجديدة ورأس البر</p></article>
        <article><p>معلومات منظمة للبحث والمقارنة وطلب الحجز</p></article>
        <article><p>تجربة عربية تجمع الطلاب ومُلّاك السكن وإدارة المنصة</p></article>
        <p dir="ltr" className="photo-note">Abdelrahman Atef Fawzy</p>
      </div>
      <footer className="slide-footer"><span>سكني — الحل المقترح</span><span>٣ / ١٢</span></footer>
    </div>
  );
}
