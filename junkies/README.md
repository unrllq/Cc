# Junkies — Entwickleragentur aus Hamburg

Next.js 15 · Tailwind v4 · TypeScript · React Three Fiber · framer-motion. Сайт на немецком, shadcn-структура (`components/ui`, `lib/utils.ts`, `components.json`).

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # статический экспорт в out/ (для хостинга с корня домена)
npm run single    # один файл junkies.html со всем CSS/JS внутри
```

Готовый однофайловый билд лежит в `../dist/JUNKIES.html` — его можно открыть с диска
или выложить как `index.html` на GitHub Pages / Netlify / Vercel.

## Компоненты (`components/ui`)

- `r3-f-macro-keypad.tsx` — 3D-клавиатура из промпта (Hero). Клавиши IDEE / DESIGN / CODE / LAUNCH
  переключают текст на «LCD»-экране под ней. Доработки: `cn()` для className, проп `activeId`,
  zoom камеры подстраивается под размер контейнера.
- `neomorphism-metric-card.tsx` — неоморфная карточка из промпта (блок с цифрами).
  Токены `bg-neo-bg`, `shadow-neo`, `shadow-neo-inner-sm`, `text-neo-text` заданы в `app/globals.css`.
- `three-d-button.tsx` — 21st.dev через коннектор 211 (bidyut10/three-d-button), все CTA.

Стиль клавиатуры протянут по всему сайту: CSS-класс `.keycap` + `cap-rose|blue|green|amber`
(те же цвета колпачков и LED, что в Hero) — иконки услуг, фазы «Ablauf», бегущая строка стека,
выбор бюджета в форме, вордмарк в футере.

## Порядок страницы

Nav → Hero (keypad) → Kennzahlen (metric cards) → Leistungen (F1) → Ablauf (F2, кликабельные клавиши)
→ Arbeiten (F3) → Stack (бегущие клавиши) → Studio (F4) → Kontakt (форма → mailto) → Footer.

## Что заменить перед запуском

- Контакты `hallo@junkies.dev`, `+49 40 000 000 00`, `Musterstraße 1` — плейсхолдеры (`lib/site.ts`).
- Цифры в `components/sections/metrics.tsx` и факты в `studio.tsx` (24 человека, с 2016) — выдуманы.
- Кейсы в `work.tsx` (Hafenkante Mobility, Kontor Sieben, Nordlicht Health) — вымышленные примеры.
- Impressum и Datenschutzerklärung обязательны в Германии — ссылки в футере пока ведут на `#`.
- Шрифты (Space Grotesk, JetBrains Mono) грузятся с Google Fonts; для строгого DSGVO лучше хостить локально.
