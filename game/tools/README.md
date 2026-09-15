# Инструменты

Скрипты сборки и проверки. Ничего из этого не нужно для игры — только для разработки.

| файл | зачем |
| --- | --- |
| `serve.mjs` | статический сервер для локального запуска |
| `shot.mjs` | скриншот страницы в headless Chromium |
| `play.mjs` | сценарный прогон игры: клики, клавиши, `eval`, кадры |
| `cine.js` | прогоняет физику без рендера и снимает «боевой» кадр |
| `file-test.mjs` | проверяет, что однофайловая сборка работает с `file://` |

## Конвейер ассетов

Исходники: `улица.fbx` + папка текстур, `akira_guy_on_motorcycle.glb`.

```bash
# 1. FBX -> GLB (текстуры лежат рядом, FBX2glTF подхватывает их сам)
npx fbx2gltf -i street.fbx -o street_raw --binary --pbr-metallic-roughness

# 2. чистка и сжатие: убрать камеры и источники света из Sketchfab-сцены,
#    dedup + prune, текстуры в WebP
node optimize.mjs street_raw.glb street.glb 1024 80
node optimize.mjs rider_raw.glb  rider.glb  2048 82
```

`optimize.mjs` (@gltf-transform) удаляет камеры и `KHR_lights_punctual`,
схлопывает дубликаты мешей, режет неиспользуемые ноды и пережимает текстуры,
сохраняя анимацию (204 канала) и скин.
