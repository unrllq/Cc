# ACID BENTO

Y2K × bento × acid colors — design kit for sites, social and video.

- **[DESIGN.md](DESIGN.md)** — правила стиля, палитра, типографика, сетка, motion, видео, промпты для ИИ
- `tokens.css` — подключаешь и верстаешь классами `ab-*`
- `tokens.json` / `tailwind.preset.js` — токены для JS, Remotion, Tailwind
- `templates/site.html` — готовый лендинг
- `video/render.mjs` — рендер анимированной сцены в MP4

```bash
node video/render.mjs --title "BIG NEWS" --sub "drop 12.12" --cta "Get it" --out story.mp4
node video/render.mjs --w 1920 --h 1080 --title "WE SAY HELLO" --out wide.mp4
```
