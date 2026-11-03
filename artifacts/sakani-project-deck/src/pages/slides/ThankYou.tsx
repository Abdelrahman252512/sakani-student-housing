const base = import.meta.env.BASE_URL;

export default function ThankYou({ active = false }: { active?: boolean }) {
  return (
    <div dir="rtl" data-sakani-motion={active ? "thanks" : undefined} className="deck-slide deck-bookend relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <style>{`
        @keyframes sakani-thanks-reveal { from { opacity: 0; translate: 0 1.2vh; } to { opacity: 1; translate: 0 0; } }
        .closing-title { position: absolute; top: 13vh; left: 6vw; right: 6vw; margin: 0; font-family: var(--font-display-family); font-size: 5vw; line-height: 1.25; font-weight: 800; text-align: center; }
        .closing-subtitle { position: absolute; top: 28vh; left: 6vw; right: 6vw; margin: 0; font-size: 2.2vw; line-height: 1.4; text-align: center; }
        .closing-columns { position: absolute; top: 37vh; left: 6vw; right: 6vw; height: 55vh; display: grid; grid-template-columns: 1fr 1fr; gap: 6vw; }
        .closing-presenter, .closing-supervisor { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .closing-portrait { width: 15.5vw; height: 27vh; object-fit: cover; object-position: 50% 30%; border: .22vw solid white; border-radius: 1.3vw; box-shadow: 0 1vh 3vh #102c421c; }
        .closing-presenter-credit { margin-top: 0; }
        .closing-label { margin: 0 0 .6vh; color: var(--slide-muted); font-size: 1.5vw; line-height: 1.3; }
        .closing-presenter-name { margin: 0; color: var(--slide-primary); font-size: 2.05vw; line-height: 1.3; font-weight: 700; }
        .closing-app-logo { height: 12vh; width: 12vh; margin: 1.5vh 0 1vh; border-radius: 1.4vh; object-fit: contain; }
        .closing-supervisor { justify-content: flex-start; }
        .closing-supervisor-portrait { object-fit: contain; object-position: center; background: white; }
        .closing-nordpoints-logo { height: 12vh; width: 12vh; object-fit: contain; margin: 1.5vh 0 1vh; }
        .closing-supervisor-name { margin: 0; max-width: 40vw; color: #986111; font-size: 1.85vw; line-height: 1.4; font-weight: 700; text-wrap: balance; }
        .closing-website { position: absolute; bottom: 2.5vh; left: 6vw; right: 6vw; display: flex; justify-content: center; align-items: baseline; gap: .8vw; margin: 0; color: var(--slide-muted); font-size: 1.5vw; line-height: 1.3; }
        .closing-website a { color: var(--slide-primary); text-decoration: underline; text-underline-offset: .2em; }
        .closing-website a:hover { color: white; }
        .closing-website a:focus-visible { outline: .12vw solid var(--slide-primary); outline-offset: .25vw; border-radius: .2vw; }
        [data-sakani-motion="thanks"] :is(.closing-title, .closing-subtitle, .closing-presenter-portrait, .closing-presenter-credit, .closing-app-logo, .closing-supervisor, .closing-website) { animation: sakani-thanks-reveal 650ms cubic-bezier(.22,1,.36,1) both; }
        [data-sakani-motion="thanks"] > .closing-subtitle { animation-delay: 120ms; }
        [data-sakani-motion="thanks"] .closing-presenter-portrait,
        [data-sakani-motion="thanks"] .closing-supervisor { animation-delay: 200ms; }
        [data-sakani-motion="thanks"] .closing-presenter-credit { animation-delay: 400ms; }
        [data-sakani-motion="thanks"] .closing-app-logo { animation-delay: 300ms; }
        [data-sakani-motion="thanks"] > .closing-website { animation-delay: 400ms; }
        @media (prefers-reduced-motion: reduce), print { [data-sakani-motion="thanks"] * { animation: none !important; } }
      `}</style>
      <div className="cover-replit replit-brand"><img src={`${base}brand/replit.png`} crossOrigin="anonymous" alt="Replit" /><span>Replit</span></div>
      <h1 className="closing-title">شكرًا لحسن الاستماع</h1>
      <p className="closing-subtitle">يسعدني استقبال أسئلتكم وملاحظاتكم</p>
      <div className="closing-columns">
        <article className="closing-presenter">
          <img className="closing-portrait closing-presenter-portrait" src={`${base}visuals/presenter.jpg`} crossOrigin="anonymous" alt="صورة مقدم العرض" />
          <img className="closing-app-logo" src={`${base}brand/sakani.png`} crossOrigin="anonymous" alt="شعار تطبيق سكني" />
          <div className="closing-presenter-credit">
            <p className="closing-label">إعداد وتقديم:</p>
            <p dir="ltr" className="closing-presenter-name">Abdelrahman Atef Fawzy</p>
          </div>
        </article>
        <article className="closing-supervisor">
          <img className="closing-portrait closing-supervisor-portrait" src={`${base}visuals/supervisor.jpg`} crossOrigin="anonymous" alt="صورة المشرف على المشروع" />
          <img className="closing-nordpoints-logo" src={`${base}brand/nordpoints-light.png`} crossOrigin="anonymous" alt="Nordpoints" />
          <p className="closing-label">تحت إشراف:</p>
          <p dir="ltr" className="closing-supervisor-name">Taha Mahmoud Metwally Nour El-Dein</p>
        </article>
      </div>
      <p className="closing-website">
        <span>رابط الموقع:</span>
        <a dir="ltr" href="https://sakani-student-housing-marketplace.replit.app" target="_blank" rel="noopener noreferrer">https://sakani-student-housing-marketplace.replit.app</a>
      </p>
    </div>
  );
}
