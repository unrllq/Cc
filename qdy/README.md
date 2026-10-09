# QDY — Digital Marketing Studio

Next.js 15 · Tailwind v4 · motion. Liquid pixel WebGL background, glass bento,
animated gradient windows, progressive bottom blur, marquees, animated hero.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Структура

- `components/ui/pixel-liquid-bg.tsx` — фон (WebGL, domain-warped fbm + пиксельная сетка + dithering, реагирует на курсор).
  Props: `colors`, `pixelSize`, `speed`, `turbulence`, `mouseInfluence`, `dither`.
- `components/ui/bento-card.tsx` — стеклянная карточка; `fade` растворяет низ в фон (mask + 5-слойный progressive blur).
- `components/ui/gradient-window.tsx` — «окно» с анимированным градиентом (пресеты `acid`, `ultra`, `sunset`, `ice`, `toxic`).
- `components/ui/marquee.tsx` — бегущая строка (`reverse`, `duration`, `gap`).
- `components/sections/*` — секции страницы.

## Оригинальный компонент unlumen-ui

`components.json` уже содержит реестр `@unlumen-ui`. Чтобы поставить оригинал поверх локальной версии:

```bash
npx shadcn@latest add @unlumen-ui/pixel-liquid-bg
```

Если пропсы оригинала отличаются — поправить вызов в `app/page.tsx`.
