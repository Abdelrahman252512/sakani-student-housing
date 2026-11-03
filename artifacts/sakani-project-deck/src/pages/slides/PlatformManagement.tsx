const base = import.meta.env.BASE_URL;

export default function PlatformManagement({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "management" : undefined} className="deck-slide relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-management-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="management"] > .slide-title,
        [data-sakani-motion="management"] > .roles-row > article { animation: sakani-management-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="management"] > .roles-row > article:nth-child(1) { animation-delay: 160ms; }
        [data-sakani-motion="management"] > .roles-row > article:nth-child(2) { animation-delay: 280ms; }
        [data-sakani-motion="management"] > .roles-row > article:nth-child(3) { animation-delay: 400ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="management"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title">أدوات إدارة لكل دور</h1>
      <div className="roles-row">
        <article><h2>المالك</h2><p>يدير الإعلانات والوحدات والأسعار وطلبات الحجز</p></article>
        <article><h2>الطالب</h2><p>يتابع المفضلة والطلبات والرسائل</p></article>
        <article><h2>المشرف</h2><p>يدير المستخدمين والمراجعات والإعدادات والدعم</p></article>
      </div>
      <footer className="slide-footer"><span>سكني — إدارة المنصة</span><span>٩ / ١٢</span></footer>
    </div>
  );
}
