const base = import.meta.env.BASE_URL;

export default function ListingDetails({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "listing" : undefined} className="deck-slide blob-right relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-listing-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="listing"] > :is(.slide-title, .photo-pane),
        [data-sakani-motion="listing"] > .copy-stack > p { animation: sakani-listing-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="listing"] > .photo-pane { animation-delay: 120ms; }
        [data-sakani-motion="listing"] > .copy-stack > p:nth-child(1) { animation-delay: 220ms; }
        [data-sakani-motion="listing"] > .copy-stack > p:nth-child(2) { animation-delay: 320ms; }
        [data-sakani-motion="listing"] > .copy-stack > p:nth-child(3) { animation-delay: 420ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="listing"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title split-title">تفاصيل تساعد على اتخاذ القرار</h1>
      <figure className="photo-pane">
        <img src={`${base}visuals/room.jpg`} crossOrigin="anonymous" alt="تصور لغرفة مشتركة مجهزة بمكاتب للمذاكرة" />
        <figcaption dir="ltr" className="photo-note">Abdelrahman Atef Fawzy</figcaption>
      </figure>
      <div className="copy-stack listing-copy">
        <p>مراجعة بيانات السكن والمرافق والأسعار</p>
        <p>عرض الوحدات والأسِرّة المتاحة حسب التواريخ المختارة</p>
        <p>حفظ الإعلان في المفضلة ومشاركته برابط مباشر</p>
      </div>
      <footer className="slide-footer"><span>سكني — تفاصيل الإعلان</span><span>٦ / ١٢</span></footer>
    </div>
  );
}
