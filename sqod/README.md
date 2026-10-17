# SQOD — Studio für Systemintegration

Next.js 15 · Tailwind v4 · TypeScript · GSAP. Сайт на немецком, shadcn-структура (`components/ui`, `lib/utils.ts`, `components.json`).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # статический экспорт в out/
```

## Порядок страницы

1. **Hero** — `components/ui/tilted-grid-hero.tsx` (изогнутая лента картинок).
2. **Галерея → Таймлайн** — `components/sections/gallery-timeline.tsx`.
   Коллаж проектов закреплён на экране; при скролле плитки разлетаются, а центральная
   картинка влетает точно в место картинки таймлайна. Таймлайн (`components/ui/timeline.tsx`)
   подтянут на 100vh под галерею (`.tl-handoff` в `app/globals.css`) и подхватывает кадр —
   дальше трек едет вбок, потом страница идёт вниз.
3. **Leistungen** — `components/ui/ink-orbit-features.tsx` (21st.dev через коннектор 211, kedhareswer/ink-orbit-features).
4. **Stack** — бегущие строки с софтом + факты.
5. **Kontakt**.
6. **Footer** — `components/ui/halftone-wordmark-footer.tsx` (полутоновое «sqod»).

Изменения относительно оригинальных компонентов описаны в шапке каждого файла.

## Что заменить перед запуском

- Картинки — сейчас процедурные SVG (`lib/art.ts`); замените `HERO_IMAGES` / `TIMELINE_IMAGE` на реальные фото проектов.
- Контакты `hallo@sqod.de`, `+49 30 000 000 00` — плейсхолдеры.
- Fallstudie «14 Standorte» и факты (Hosting Frankfurt/Nürnberg, 24/7, Festpreis) — плейсхолдеры, проверьте.
- Impressum и Datenschutzerklärung обязательны в Германии — ссылки в футере пока ведут на `#`.
