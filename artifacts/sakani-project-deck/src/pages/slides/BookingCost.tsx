const base = import.meta.env.BASE_URL;

export default function BookingCost({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "cost" : undefined} className="deck-slide relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-cost-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        [data-sakani-motion="cost"] > :is(.slide-title, .cost-diagram),
        [data-sakani-motion="cost"] > .copy-stack > p { animation: sakani-cost-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="cost"] > .cost-diagram { animation-delay: 120ms; }
        [data-sakani-motion="cost"] > .copy-stack > p:nth-child(1) { animation-delay: 220ms; }
        [data-sakani-motion="cost"] > .copy-stack > p:nth-child(2) { animation-delay: 320ms; }
        [data-sakani-motion="cost"] > .copy-stack > p:nth-child(3) { animation-delay: 420ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="cost"] * { animation: none !important; } }
      `}</style>
      <header className="deck-header">
        <div className="replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
        <div className="nord-brand"><span>nordpoints</span><img src={`${base}brand/nordpoints.png`} crossOrigin="anonymous" alt="Nordpoints" /></div>
      </header>
      <h1 className="slide-title">تكلفة أوضح قبل إرسال طلب الحجز</h1>
      <div className="cost-diagram"><p>الإقامة</p><p>+ الرسوم</p><p>+ التأمين</p></div>
      <div className="copy-stack booking-copy">
        <p>عرض تفاصيل الإقامة والرسوم والتأمين</p>
        <p>احتساب السعر حسب المدة والإعدادات المطبّقة</p>
        <p>إرسال طلب حجز ومتابعة حالته دون دفع إلكتروني حاليًا</p>
      </div>
      <footer className="slide-footer"><span>سكني — وضوح التكلفة</span><span>٧ / ١٢</span></footer>
    </div>
  );
}
