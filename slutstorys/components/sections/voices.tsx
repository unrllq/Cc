import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns";

const t: Testimonial[] = [
  { text: "Мы пришли за охватами, а ушли с культом. Клиенты цитируют наши reels на кассе.", name: "Алина Кравец", role: "CMO, Velvet Lab", tint: "bg-pink" },
  { text: "Впервые агентство спорило с нами — и было право. ROMI вырос в пять раз.", name: "Тимур Абасов", role: "основатель, Ночной Бургер", tint: "bg-butter" },
  { text: "Они нашли историю там, где мы видели только банковский продукт. Магия с Excel-отчётами.", name: "Ольга Мирная", role: "Head of Brand, Orbita", tint: "bg-indigo" },
  { text: "Дроп ушёл за 11 минут. Я до сих пор не понимаю, как они это сделали без рекламы.", name: "Марк Шевцов", role: "CEO, Saint Sin", tint: "bg-blood" },
  { text: "Быстро, нагло, по делу. Первый ролик вышел через неделю после брифа.", name: "Вера Лис", role: "маркетинг, Lumen Studio", tint: "bg-bone" },
  { text: "Наш скучный SaaS теперь мемят в профильных чатах. Лиды дешевле на 40%.", name: "Дмитрий Орлов", role: "CPO, Stackbox", tint: "bg-pink" },
  { text: "Еженедельные отчёты, которые реально читаешь. Это отдельный вид искусства.", name: "Нино Гелашвили", role: "директор, Tbilisi Wine Co", tint: "bg-butter" },
  { text: "Название пугало совет директоров ровно до первой презентации результатов.", name: "Игорь Ветров", role: "COO, Северный Ритейл", tint: "bg-indigo" },
  { text: "С ними не бывает «нормально». Бывает либо огонь, либо честное «переделаем».", name: "Саша Кей", role: "бренд-менеджер, Pulse", tint: "bg-blood" },
];

export function Voices() {
  return (
    <section id="voices" className="relative mx-auto max-w-[1600px] scroll-mt-24 px-4 py-24 md:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-pink">/ 05 — сплетни о нас</p>
          <h2 className="font-display text-[12vw] uppercase leading-[0.9] md:text-[5vw]">
            Что о нас <span className="serif-i normal-case text-butter">шепчут</span>
          </h2>
          <p className="mt-6 max-w-sm text-bone/60">
            Честные отзывы клиентов. Мы просили написать гадость — никто не смог.
          </p>
        </div>
        <div className="flex max-h-[760px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
          <TestimonialsColumn testimonials={t.slice(0, 3)} duration={17} />
          <TestimonialsColumn testimonials={t.slice(3, 6)} className="hidden md:block" duration={22} />
          <TestimonialsColumn testimonials={t.slice(6, 9)} className="hidden xl:block" duration={19} />
        </div>
      </div>
    </section>
  );
}
