const base = import.meta.env.BASE_URL;

export default function Cover({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "cover" : undefined} className="deck-slide deck-bookend relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-cover-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        .cover-presenter-portrait { position: absolute; left: 50vw; bottom: 5.5vh; width: 13.5vw; height: 26.5vh; object-fit: cover; object-position: 50% 30%; border: .22vw solid white; border-radius: 1.3vw; box-shadow: 0 1vh 3vh #102c421c; }
        .cover-mentor-signature { width: 32vw; }
        .cover-supervisor-portrait { position: absolute; top: 3.4vh; left: 52vw; width: 9vw; height: 20vh; object-fit: contain; background: white; border: .22vw solid white; border-radius: 1.1vw; box-shadow: 0 1vh 3vh #102c421c; }
        [data-sakani-motion="cover"] > :is(.cover-title, .cover-tagline, .cover-photo, .presenter-signature, .mentor-signature, .cover-presenter-portrait, .cover-supervisor-portrait) { animation: sakani-cover-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="cover"] > :is(.mentor-signature, .cover-supervisor-portrait) { animation-delay: 80ms; }
        [data-sakani-motion="cover"] > .cover-photo { animation-delay: 120ms; }
        [data-sakani-motion="cover"] > .cover-tagline { animation-delay: 200ms; }
        [data-sakani-motion="cover"] > .presenter-signature { animation-delay: 300ms; }
        [data-sakani-motion="cover"] > .cover-presenter-portrait { animation-delay: 300ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="cover"] * { animation: none !important; } }
      `}</style>
      <div className="cover-replit replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
      <div className="mentor-signature cover-mentor-signature">
        <img src={`${base}brand/nordpoints-light.png`} crossOrigin="anonymous" alt="Nordpoints" />
        <p className="signature-label">تحت إشراف:</p>
        <p dir="ltr" className="mentor-name">Taha Mahmoud Metwally Nour El-Dein</p>
      </div>
      <img className="cover-supervisor-portrait" src={`${base}visuals/supervisor.jpg`} crossOrigin="anonymous" alt="صورة المشرف على المشروع" />
      <figure className="photo-pane cover-photo">
        <img src={`${base}visuals/hero.jpg`} crossOrigin="anonymous" alt="تصور لسكن طلابي في بيئة ساحلية مصرية" />
        <figcaption dir="ltr" className="photo-note">Abdelrahman Atef Fawzy</figcaption>
      </figure>
      <h1 className="cover-title">سكني <span dir="ltr" className="cover-latin">| Sakani</span></h1>
      <p className="cover-tagline">سكن طلابي أوضح… من البحث إلى طلب الحجز</p>
      <img className="cover-presenter-portrait" src={`${base}visuals/presenter.jpg`} crossOrigin="anonymous" alt="صورة مقدم العرض" />
      <div className="presenter-signature">
        <img src={`${base}brand/sakani.png`} crossOrigin="anonymous" alt="شعار تطبيق سكني" />
        <p className="signature-label">إعداد وتقديم:</p>
        <p dir="ltr" className="presenter-name">Abdelrahman Atef Fawzy</p>
      </div>
    </div>
  );
}
