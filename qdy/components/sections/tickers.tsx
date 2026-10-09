import { Marquee } from "@/components/ui/marquee";

const SERVICES = ["Performance", "SMM", "Брендинг", "Контент", "Web & Product", "AI-креативы", "Аналитика", "Influence"];
const CLIENTS = ["NØRD", "Velto", "Pulse/Bank", "MÅNE", "Orbita", "KIKO.lab", "Sferum", "GRAIN", "Fluxx", "Haus 9"];

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-8 w-8 shrink-0 sm:h-12 sm:w-12 ${className}`} aria-hidden>
      <path fill="currentColor" d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
    </svg>
  );
}

export function ServiceTicker() {
  return (
    <section aria-label="Услуги" className="relative z-10 -my-4 py-10">
      <div className="-rotate-2 bg-lime py-4 text-ink shadow-[0_0_80px_rgba(200,255,61,0.35)]">
        <Marquee duration={28}>
          {SERVICES.map((s) => (
            <span key={s} className="flex items-center gap-12 font-display text-4xl font-black uppercase tracking-tight sm:text-6xl">
              {s}
              <Star />
            </span>
          ))}
        </Marquee>
      </div>
      <div className="glass mt-[-14px] rotate-[1.5deg] py-4">
        <Marquee duration={36} reverse>
          {SERVICES.map((s) => (
            <span key={s} className="flex items-center gap-12 font-display text-4xl font-black uppercase tracking-tight sm:text-6xl">
              <span className="text-outline">{s}</span>
              <Star className="text-pink" />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

export function ClientTicker() {
  return (
    <section aria-label="Клиенты" className="relative py-16">
      <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-white/50">
        С нами растут
      </p>
      <Marquee duration={40} gap="4rem">
        {CLIENTS.map((c) => (
          <span key={c} className="font-display text-3xl font-bold text-white/40 transition hover:text-lime sm:text-5xl">
            {c}
          </span>
        ))}
      </Marquee>
      <Marquee duration={55} gap="2rem" reverse className="mt-8">
        {[
          "7 лет на рынке",
          "120+ запущенных брендов",
          "40 человек в команде",
          "Свой продакшн",
          "AI-пайплайн креативов",
          "Ответ в течение 15 минут",
        ].map((t) => (
          <span key={t} className="glass whitespace-nowrap rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white/75">
            ✦ {t}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
