import HoverExpand, { type HoverExpandItem } from "@/components/ui/hover-expand";

const items: HoverExpandItem[] = [
  {
    id: "story",
    title: "Сторителлинг",
    description: "Находим в бренде скандал, страсть или тайну — и превращаем в сюжетную арку на год вперёд.",
    tags: ["brand story", "tone of voice", "контент-стратегия"],
    background: "radial-gradient(120% 90% at 20% 10%, #ff2e88 0%, #3f3cbb 55%, #0b0a0d 100%)",
  },
  {
    id: "reels",
    title: "Reels & TikTok",
    description: "Вертикальные сериалы, которые досматривают до конца. Сценарии, кастинг, продакшн, монтаж за 72 часа.",
    tags: ["shorts", "ugc", "продакшн"],
    background: "radial-gradient(110% 80% at 80% 20%, #ffd66b 0%, #ff3b2f 45%, #0b0a0d 100%)",
  },
  {
    id: "smm",
    title: "SMM без скуки",
    description: "Ведём соцсети как медиа: рубрики, персонажи, комьюнити и ежедневные инфоповоды.",
    tags: ["instagram", "telegram", "vk"],
    background: "conic-gradient(from 210deg at 60% 40%, #3f3cbb, #ff2e88, #ffd66b, #3f3cbb)",
  },
  {
    id: "brand",
    title: "Брендинг",
    description: "Имя, айдентика и визуальный язык, который хочется лизнуть. Ну или хотя бы сохранить в избранное.",
    tags: ["нейминг", "айдентика", "гайдлайны"],
    background: "linear-gradient(160deg, #f6efe7 0%, #ff2e88 60%, #0b0a0d 100%)",
  },
  {
    id: "perf",
    title: "Performance",
    description: "Креативы, которые не выгорают за неделю, и медиабаинг, который считает каждый рубль.",
    tags: ["таргет", "аналитика", "a/b"],
    background: "radial-gradient(100% 100% at 50% 100%, #ff3b2f 0%, #3f3cbb 50%, #0b0a0d 100%)",
  },
  {
    id: "influence",
    title: "Influence",
    description: "Посевы и коллаборации с блогерами, у которых аудитория верит, а не скроллит.",
    tags: ["блогеры", "коллабы", "pr"],
    background: "radial-gradient(90% 90% at 30% 70%, #ffd66b 0%, #ff2e88 50%, #3f3cbb 100%)",
  },
];

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-[1600px] scroll-mt-24 px-4 py-24 md:px-8">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-pink">/ 02 — что мы делаем</p>
          <h2 className="font-display text-[12vw] uppercase leading-[0.9] md:text-[6vw]">
            Шесть способов <br />
            <span className="serif-i normal-case text-butter">влюбить</span> аудиторию
          </h2>
        </div>
        <p className="max-w-xs text-bone/60">Наведи на карточку — она раскроется. Как хороший клиент на втором свидании.</p>
      </div>
      <HoverExpand items={items} />
    </section>
  );
}
