# Bot Smasher — Drop Kick Arena

A tiny click-to-fight 3D minigame built with Three.js.

- Click / tap anywhere on the screen to make the player drop-kick the bot.
- The bot stands its ground in a looping "Center Block" stance.
- Each connecting hit chips its health bar, adds score and a combo counter,
  triggers a camera shake, a spark burst, and a synthesized hit sound.
- At 0 HP the bot topples over, shows a "K.O." banner, then gets back up
  with full health so the fight continues.

## Assets

`assets/drop-kick.fbx` and `assets/center-block.fbx` are Mixamo "X Bot"
exports (skinned mesh + skeleton + one animation clip each), used directly
as the player and the bot models.

## Running locally

Just serve the `game/` folder over HTTP (ES module imports don't work from
`file://`), e.g.:

```
npx http-server game -p 8080
```

then open `http://localhost:8080`.

Three.js is vendored under `vendor/three/` (MIT licensed, see
`vendor/three/LICENSE`) so the page has no external CDN dependency.
