# SLUTSTORYS — маркетинговая студия

Next.js 15 · Tailwind v4 · motion. Лендинг собран из компонентов 21st.dev (коннектор 211),
адаптированных под бренд (палитра pink / indigo / butter / ink, шрифты Dela Gothic One + Cormorant Garamond italic + Inter Tight).

```bash
npm install
npm run dev     # http://localhost:3000
```

## Компоненты 21st.dev → где используются

| Компонент (21st.dev) | Файл | Секция |
|---|---|---|
| `themostevildwarf/grain-gradient` (Paper Shaders, Apache-2.0) | `components/ui/grain-gradient.tsx` | фон Hero и блока контактов |
| `cnippet-dev/text-scramble` | `components/ui/text-scramble.tsx` | слоган в Hero |
| `dillionverma/scroll-based-velocity` (magicui) | `components/ui/scroll-based-velocity.tsx` | бегущие ленты «Дерзко ✶ Честно ✶ Вирусно» |
| `educalvolpz/hover-expand` | `components/ui/hover-expand.tsx` | услуги (раскрывающиеся панели) |
| `danielpetho/stacking-cards` | `components/ui/stacking-cards.tsx` | кейсы (стопка карточек на скролле) |
| `efferd/testimonials-columns-1` | `components/ui/testimonials-columns.tsx` | отзывы |

Изменения относительно оригиналов указаны в шапке каждого файла.
Клиенты, цифры и отзывы в кейсах — плейсхолдеры, замените на реальные.
