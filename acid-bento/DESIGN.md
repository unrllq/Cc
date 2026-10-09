# ACID BENTO — Design System

Универсальный визуальный стиль для сайтов, лендингов, соцсетей, презентаций и видео.
Без привязки к бренду: подставляешь своё имя, тексты и фото — стиль остаётся.

**Формула стиля:** Y2K-стикеры × бенто-сетка × кислотная палитра × жирная типографика с экструзией × коллаж из фото и 3D-объектов на чёрном.

Референсы: Social Groove identity, Dirtybarn × Graziaesthetica «Bento Grid», постер SayGames «We say games».

---

## Что в комплекте

```
acid-bento/
├── DESIGN.md               ← этот файл: правила стиля + промпты
├── tokens.css              ← CSS-переменные + готовые компоненты (подключил — и пиши разметку)
├── tokens.json             ← те же токены для JS / Remotion / Figma Tokens
├── tailwind.preset.js      ← пресет для Tailwind
├── assets/                 ← SVG-стикеры: курсор, вспышка, смайл, пиксельный цветок, глобус, самолётик
├── templates/site.html     ← готовый лендинг-шаблон на всех компонентах
└── video/
    ├── scene.html          ← анимированная сцена (сторис / рилс / 16:9), тексты через URL
    └── render.mjs          ← рендер сцены в MP4 (Playwright + ffmpeg)
```

**Быстрый старт — сайт:** скопируй `templates/site.html` + `tokens.css` + `assets/`, замени тексты.
**Быстрый старт — видео:**
```bash
node acid-bento/video/render.mjs --title "BIG NEWS" --out promo.mp4
```

---

## TL;DR — промпт для ИИ

Скопируй это в Claude / v0 / Cursor, чтобы получить вёрстку в стиле:

> Сделай в стиле **ACID BENTO**: фон почти чёрный `#0a0a0a`. Контент разложен по **бенто-сетке** — скруглённые модули (радиус 24px, зазор 16px), каждый модуль залит сплошным кислотным цветом: лайм `#c6ff1a`, розовый `#ff08b6`, электрик-синий `#1e02ff`, фиолетовый `#7b2cf5`, оранжевый `#ff4d00`, кремовый `#fdf6e7`; тёмные модули — с обводкой 2px лаймом. Не больше трёх акцентов на экран, два одинаковых цвета рядом не ставить. Заголовки — **Anton** (узкий, капс, line-height 0.9) или **Unbounded 900** (широкий). Логотипы и слоганы — «стикер»: **Rubik Mono One**, чёрная обводка 3px + жёсткая чёрная тень-экструзия 4/6/8px без блюра, наклон −6°, каждое слово своим цветом. Текст — **Space Grotesk**, мета-подписи — **Space Mono** 12px капсом с разрядкой. Мелкие теги-пилюли в углах модулей (номер, дата, @ник). Поверх сетки — стикеры и 3D-объекты, которые **вылезают за края модулей**. Кнопки — с жёсткой тенью `6px 6px 0 #000`, на hover тень растёт. Бегущие строки на лаймовой полосе. Шахматная ч/б полоска как разделитель. Тон — дерзкий, короткий, с юмором. Если есть `tokens.css` — используй его классы.

---

## 1. Цвет

### 1.1 Палитра

| Токен | HEX | Роль |
|---|---|---|
| `--ab-black` | `#0a0a0a` | Холст. Фон по умолчанию. |
| `--ab-ink` | `#000000` | Обводки, тени, экструзия, текст на светлом. |
| `--ab-lime` | `#c6ff1a` | **Главный акцент.** Плашки, тикеры, обводки тёмных модулей, CTA. |
| `--ab-pink` | `#ff08b6` | Модули, акцентные слова, курсор-стикер. |
| `--ab-blue` | `#1e02ff` | Крупные модули, паттерны, «экранный» синий. |
| `--ab-violet` | `#7b2cf5` | Вертикальные модули-манифесты, пиксель-графика. |
| `--ab-orange` | `#ff4d00` | Фоны под фото, вспышки. Дозировано. |
| `--ab-green` | `#2bff88` | Мятно-неоновый — иконки, градиент-заголовки (как SayGames). |
| `--ab-yellow` | `#ffe31a` | Пилюли-факты, рейтинги, звёзды. Редко. |
| `--ab-cream` | `#fdf6e7` | Светлые «бумажные» модули: иконки, цитаты. |
| `--ab-white` | `#ffffff` | Текст на тёмном и синем. |
| `--ab-grey` | `#8a8a8a` | Вторичный текст. |
| `--ab-periwinkle` | `#4d5bff` | Третий цвет в паттернах из монограмм. |

### 1.2 Пропорции и правила

```
Чёрный фон       ███████████████████████████  ~55%
Цветные модули   ███████████████              ~30%   макс. 3 акцента на экран/кадр
Крем / белый     █████                        ~10%
Лайм-акценты     ██                           ~5%    CTA, обводки, тикер
```

- **Правило трёх:** в одной композиции максимум 3 акцентных цвета + чёрный + крем.
- Два модуля одного цвета не стоят рядом.
- Альтернативный режим «Flood»: весь фон одним акцентом (синий или розовый), модули — чёрные/лаймовые (как Social Groove).
- Градиентов почти нет. Исключение: вертикальный градиент в заголовке «зелёный → белый» (`--ab-grad-neon`) и мягкий градиент на 1 модуле на экран.

### 1.3 Контраст (WCAG 2.1)

| Текст на фоне | Ratio | |
|---|---|---|
| чёрный на лайме | 16.9 | AAA ✅ |
| чёрный на креме | 18.6 | AAA ✅ |
| чёрный на розовом | 5.7 | AA ✅ |
| чёрный на оранжевом | 6.0 | AA ✅ |
| белый на синем | 8.4 | AAA ✅ |
| белый на фиолетовом | 6.0 | AA ✅ |
| лайм на синем | 7.1 | AAA ✅ |
| белый на лайме | 1.2 | ❌ |
| чёрный на синем | 2.4 | ❌ |
| розовый на синем | 2.4 | ❌ (можно только стикер-шрифтом с чёрной экструзией) |

Шпаргалка: **светлые фоны (лайм, крем, розовый, оранжевый, жёлтый, зелёный) → чёрный текст. Тёмные (синий, фиолетовый, чёрный) → белый или лаймовый.**

---

## 2. Типографика

### 2.1 Шрифты (все — Google Fonts)

| Токен | Шрифт | Характер | Для чего |
|---|---|---|---|
| `--ab-font-condensed` | **Anton** | Узкий, высокий, плакатный | Заголовки-манифесты, огромные цифры, тикеры |
| `--ab-font-wide` | **Unbounded** 700–900 | Широкий, геометричный | Hero-заголовки, «We say ___»-постеры |
| `--ab-font-sticker` | **Rubik Mono One** | Жирный, округлый, мультяшный | Логотипы-стикеры, слоганы, монограммы |
| `--ab-font-body` | **Space Grotesk** 400–700 | Гротеск с характером | Весь читаемый текст, кнопки |
| `--ab-font-mono` | **Space Mono** | Терминал, этикетка | Мета, теги, даты, номера, HEX |
| `--ab-font-pixel` | **Silkscreen** | 8-bit | Одна фраза на экран, не больше |

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Rubik+Mono+One&family=Silkscreen&family=Space+Grotesk:wght@400;500;700&family=Space+Mono&family=Unbounded:wght@700;900&display=swap" rel="stylesheet">
```

**Максимум 2 дисплейных шрифта на экран** + body + mono.

### 2.2 Шкала

| Уровень | Шрифт | Размер | Line-height | Трекинг |
|---|---|---|---|---|
| Mega | Anton / Unbounded | `clamp(72px, 14vw, 220px)` | 0.85 | -0.02em |
| H1 | Anton | `clamp(56px, 8vw, 120px)` | 0.9 | 0 |
| Sticker | Rubik Mono One | `clamp(40px, 7vw, 96px)` | 0.95 | -0.02em |
| H2 | Anton | `clamp(40px, 5vw, 72px)` | 0.95 | 0.01em |
| H3 | Space Grotesk 700 | 22–28px | 1.15 | -0.02em |
| Body | Space Grotesk 400 | 16–18px | 1.5 | 0 |
| Meta | Space Mono, CAPS | 11–12px | 1.4 | 0.12em |

### 2.3 Типографические приёмы

| Приём | Класс | Как выглядит |
|---|---|---|
| **Экструзия** | `.ab-sticker` | Обводка 3px чёрным + ступенчатая тень 4/6/8px, наклон −6°. Главный приём. |
| **Мульти-цвет** | `.ab-sticker` + `<span class="c-pink">` | Каждое слово/буква своим цветом: SOCIAL (лайм) GROOVE (розовый/синий/лайм). |
| **Контур + заливка** | `.ab-outline` | Слово повторяется: сначала только контур, потом сплошное. `OWERS FLOWERS`. |
| **Градиент-неон** | `.ab-grad-text` | Заливка зелёный → белый сверху вниз (SayGames). |
| **Inline-иконка** | `<img class="ab-inline">` | Иконка вместо буквы: `N🌍 plastic`, `how ✿ plastic [are] → we?` |
| **Скобки и стрелки** | — | `(TO GROW) (TO LOVE) →`, `[are] → we?` |
| **Пиксельная плашка** | `.ab-ticker` + `--ab-font-pixel` | `MORE ✶ OR ☺ LESS` |

---

## 3. Бенто-сетка

Основа композиции. Всё раскладывается по модулям на чёрном фоне.

### 3.1 Параметры

| Токен | Значение |
|---|---|
| Колонки | 12 → 6 (≤ 1024px) → 2 (≤ 640px) |
| `--ab-gap` | 16px (12px на мобиле) |
| `--ab-radius-lg` | 28px — крупные модули |
| `--ab-radius` | 20px — средние |
| `--ab-radius-sm` | 14px — мелкие иконки |
| `--ab-radius-pill` | 999px — теги, кнопки, плашки |
| `--ab-pad` | `clamp(18px, 2.4vw, 36px)` |
| Обводка тёмного модуля | `2px solid var(--ab-lime)` |
| Поля страницы | 16px мобайл / 48–80px десктоп |

### 3.2 Типы модулей

| Модуль | Цвет | Содержимое | Пример из рефов |
|---|---|---|---|
| **Manifest** | violet / pink, вертикальный | Anton во весь модуль + стрелка | THAT YOU NEED (TO GROW) |
| **Statement** | blue / lime, широкий | Огромный слоган + 3D-объект за край | plastic matters 🦆 |
| **Photo** | full-bleed фото | Портрет/деталь + 1–2 стикера поверх | лицо с цветами |
| **Icon** | cream / pink, квадрат | Одна иконка или 3D-смайл | ☺ на розовом |
| **Ticker** | lime, полоса | Пиксель/моно бегущая строка | MORE ✶ OR ☺ LESS |
| **Definition** | black + лаймовая обводка | Пилюля `noun` + mono-текст | noun: a synthetic material… |
| **Credits** | black + обводка | Глобус → стрелка → имена пиксельным | DIRTYBARN ↖↖↖ GRAZIA |
| **Data / Chip** | любой яркий, пилюля | Цифра + подпись в 2 строки | +1B downloads per year |
| **Swatch** | цвет палитры | HEX mono по центру | #ff08b6 |
| **Pattern** | blue | Монограмма-паттерн под наклоном | SG SG SG |

### 3.3 Правила сборки

1. **Сетка жёсткая — объекты свободные.** Минимум один стикер/3D-объект на композицию перекрывает границу модуля (`.ab-float`).
2. Каждый кластер: 1 фото + 1 крупный текст + 1–2 мелких модуля (иконка/мета).
3. Mono-мета в углах (`006`, `7'22`, `@handle`) — обязательно хотя бы на трети модулей, без неё сетка «пустая».
4. Размеры модулей разные: минимум 3 разных формата в кластере (квадрат, горизонталь, вертикаль).
5. Кластеры разделены большим вертикальным отступом (96–160px) — «бенто-коробки» на чёрном столе.

---

## 4. Компоненты

Все есть в `tokens.css`. Префикс `ab-`.

| Компонент | Класс | Спека |
|---|---|---|
| Сетка | `.ab-bento` | `grid-template-columns: repeat(12, 1fr)`, gap `--ab-gap` |
| Модуль | `.ab-tile` + `.ab-tile--lime/pink/blue/violet/orange/cream/black/green` | радиус, паддинг, `overflow: visible` |
| Размеры | `.c-2 … .c-12`, `.r-2`, `.r-3`, мобайл: `.m-1`, `.m-2` | span колонок/рядов (12 → 6 → 2 колонки) |
| Кнопка | `.ab-btn`, `.ab-btn--pink`, `.ab-btn--ghost` | пилюля, обводка 2px, тень `6px 6px 0 #000`, hover: сдвиг −2px и тень 10px |
| Тег | `.ab-pill` | mono 11px, обводка 1px, радиус 999 |
| Мета | `.ab-meta` | mono 11px капс, `opacity: .8` |
| Стикер-текст | `.ab-sticker` | см. 2.3 |
| Тикер | `.ab-ticker` > `.ab-ticker__track` | бегущая строка 30s linear |
| Шахматка | `.ab-checker` | полоса 2 ряда клеток 16px |
| Чип-строка | `.ab-chip` (+ `.ab-chip--num`) | пилюля-факт, цифра + 2-строчная подпись |
| Плавающий объект | `.ab-float` | `position:absolute`, z-index 5, анимация парения |
| Фото | `.ab-tile--photo` + `<img>` | `object-fit: cover`, зерно поверх |
| Зерно | `.ab-grain` | SVG-noise оверлей 6% |

---

## 5. Графика и стикеры

| Элемент | Файл | Описание |
|---|---|---|
| Курсор-клик | `assets/cursor.svg` | Розовая стрелка с лаймовой обводкой и лучами. Знак «нажми» — ставится у CTA. |
| Вспышка | `assets/sparkle.svg` | 4-лучевая звезда. Между словами, в углах модулей. |
| Смайл | `assets/smiley.svg` | Жёлтый смайл с чёрной обводкой. |
| Пиксельный цветок | `assets/flower-pixel.svg` | 8-bit цветок, белый контур. На фиолетовых модулях. |
| Глобус | `assets/globe.svg` | Линейный глобус-сетка. В кредитах и «world»-модулях. |
| Самолётик | `assets/plane.svg` | Синий с обводкой — «отправить/подписаться». |

Плюс стилистика, которую добавляешь сам (фото / 3D / генерация):
- **3D-пластик:** резиновая уточка, глянцевый смайл, хромовые/молочные капли-блобы, цветочки, кольца-леденцы, раскладушка Y2K, кукла.
- **Y2K-трайбл** фиолетовый с лаймом поверх лиц.
- **Пиксельные зигзаги/молнии** белым на цветных модулях.
- **Изогнутая лента** с повторяющимся `LET'S CONNECT · LET'S CONNECT`.
- **Контурные волнистые линии** на оранжевом.

---

## 6. Фото

- **Сюжеты:** крупные планы лица, губ, рук, глаз с декором (стразы, грилзы, цветы, кольца-леденцы, блёстки). Fashion-портреты. Детали-объекты.
- **Свет:** прямая вспышка, насыщенно, журнальный Y2K; либо мягкий холодный дневной.
- **Фон фото:** однотонный, в идеале из палитры (жёлтый, голубой, серый, оранжевый).
- **Обработка:** насыщенность +15%, зерно, без бьюти-ретуши.
- **Поверх:** ≤ 2 стикера + 1 тег; лицо перекрыто не больше чем на 15%.
- ❌ Стоковые улыбки, пастель, ч/б, «офис с ноутбуком».

---

## 7. Голос

- **Дерзко, коротко, с юмором.** Заголовок — 2–5 слов.
- Скобки, стрелки, повторы: `(TO GROW) (TO LOVE) →`, `MORE ✶ OR ☺ LESS`, `how plastic [are] → we?`
- Конструкция-постер **«We say ___»**: огромное слово сверху, огромное снизу, между ними стек пилюль с фактами.
- CTA — короткий глагол: **Let's connect**, **Join**, **Get it**, **Try now**, **Make it great**.
- Микрокопи с подмигиванием: `No spam. Just good stuff.`

---

## 8. Motion (сайты и видео)

| Анимация | Класс / keyframes | Параметры |
|---|---|---|
| Появление модуля | `ab-rise` | translateY 32px → 0 + fade, 600ms, `--ab-ease-out`, stagger 70ms |
| «Шлёп» стикера | `ab-pop` | scale 0 → 1.15 → 0.95 → 1, rotate −12° → −6°, 500ms |
| Парение 3D | `ab-float` | translateY ±10px, rotate ±3°, 5s infinite |
| Тикер | `ab-marquee` | translateX 0 → −50%, 30s linear infinite |
| Тряска | `ab-wiggle` | rotate ±4°, 300ms, на hover стикеров |
| Hover кнопки/модуля | — | translate(−2px,−2px), тень 6 → 10px, 200ms |

Easing: `--ab-ease-out: cubic-bezier(0.16, 1, 0.3, 1)`, `--ab-ease-snap: cubic-bezier(0.34, 1.56, 0.64, 1)`.
Всегда уважай `prefers-reduced-motion` (в `tokens.css` уже есть).

---

## 9. Видео

### 9.1 Правила монтажа

- **Темп:** смена кадра каждые 0.4–0.8 с, под бит. Текст держится ≥ 1.2 с.
- **Переходы:** жёсткие катсы, «шлёп» стикеров, заливка экрана цветом (wipe по диагонали), никаких кроссфейдов.
- **Текст на экране:** стикер-шрифт с экструзией или Anton капсом; максимум 4 слова в кадре.
- **Композиция:** бенто-кадр — экран делится на 2–4 модуля, в них параллельно идут разные клипы/тексты.
- **Цвет:** фон кадра — чёрный или один акцент; клипы с подкрученной насыщенностью и зерном.
- **Звук:** электроника/фонк/гипер-поп, саунд-эффекты на каждый «шлёп» (pop, click, swoosh).
- **Форматы:** 1080×1920 (Reels/TikTok/Stories), 1080×1350 (пост), 1920×1080 (YouTube), 1080×1080.
- **Safe zone 9:16:** верх 220px и низ 380px не занимать важным (интерфейс соцсетей).

### 9.2 Готовый рендер из `video/`

```bash
# Сторис 9:16, 6 секунд
node acid-bento/video/render.mjs --title "BIG NEWS" --sub "drop 12.12" --cta "Get it" --out story.mp4

# 16:9 для YouTube
node acid-bento/video/render.mjs --w 1920 --h 1080 --title "WE SAY HELLO" --out wide.mp4

# Свои пилюли-факты (через |)
node acid-bento/video/render.mjs --chips "+1M users|★ 5.0|24/7 support" --out facts.mp4
```

Параметры: `--title --sub --cta --chips --handle --w --h --fps --duration --out`. Нужен Node 18+, Playwright (`npm i -D playwright && npx playwright install chromium`) и ffmpeg.
Сцена — обычный HTML (`video/scene.html`): открываешь в браузере, правишь, рендеришь. Анимации детерминированно перематываются покадрово, поэтому видео получается ровным при любом FPS.

### 9.3 Remotion / After Effects

- **Remotion:** импортируй `tokens.json`, используй `spring()` с `damping: 10, stiffness: 180` для «шлёпа», `interpolate()` для rise. Экструзию делай тем же `textShadow`, что в `tokens.css`.
- **After Effects:** экструзия = Drop Shadow (Softness 0, Distance 6, чёрный) ×3 со сдвигом 2px либо эффект «Long Shadow»; обводка — Stroke 3px. Easing — Overshoot (экспрешн) для стикеров.

### 9.4 Промпты для генерации картинок и видео

Базовый суффикс стиля (добавляй к любому промпту):

```
Y2K maximalist aesthetic, acid bento grid layout, hot pink #ff08b6, electric blue #1e02ff, acid lime #c6ff1a, violet, solid black background, glossy 3D plastic objects, sticker graphics with thick black outlines, direct flash editorial photography, saturated colors, film grain, playful and bold
```

**Фото / 3D-объекты (Midjourney / Flux / Gemini / GPT-image):**
```
close-up of lips with rhinestone grillz and colorful gem stickers on skin, direct flash, saturated, editorial beauty, [base suffix], no text
glossy 3D rubber duck, studio lighting, isolated on transparent background, toy-like plastic render, [base suffix], no text
chrome liquid blob shapes, milky pearl 3D render, isolated, soft studio light, no text
hand with candy ring pops and long blue glitter nails on denim, yellow background, direct flash, no text
seamless pattern of chunky 3D sticker letters "SG" in lime pink and periwinkle with black extrusion shadow, electric blue background, diagonal
```

**Видео (Veo / Kling / Sora / Runway):**
```
Fast-paced Y2K fashion promo. Hard cuts on the beat every 0.5s. Close-ups of faces with flower stickers and rhinestones under direct camera flash. Glossy 3D smiley and rubber duck pop onto the frame with a bounce. Electric blue and hot pink color washes wipe across the screen diagonally. Saturated colors, film grain, handheld energy. 9:16 vertical. No on-screen text.
```
```
Macro slow-motion of a chrome liquid blob morphing into a flower shape on a solid electric blue background, glossy reflections, playful, loopable, no text.
```

Текст в генерацию **не просим** — накладываем потом в `scene.html` / монтажке нашими шрифтами.

---

## 10. Чек-лист

- [ ] Фон чёрный (или один акцент в режиме Flood)
- [ ] ≤ 3 акцентных цвета, одинаковые не рядом
- [ ] Контраст текста ≥ 4.5 : 1 (кроме стикер-текста с экструзией)
- [ ] ≤ 2 дисплейных шрифта + body + mono
- [ ] Хотя бы один объект вылезает за модуль
- [ ] Есть mono-мета (номер / дата / @handle)
- [ ] Один главный CTA с жёсткой тенью
- [ ] Модули разных форматов
- [ ] Анимации уважают `prefers-reduced-motion`
- [ ] Видео: катсы под бит, ≤ 4 слов в кадре, safe zone соблюдена
