# Bot Smasher — Drop Kick Arena

A tiny 3D fighting minigame built with Three.js.

- Tap/click the **left** half of the screen to throw punches — cycling
  through Punching → Boxing → Punching Bag in turn.
- Tap/click the **right** half to throw kicks — cycling through
  Martelo → Drop Kick (the big finisher) in turn.
- The bot stands its ground in a looping "Center Block" stance and randomly
  throws one of the punch/kick moves back between blocks.
- Each connecting hit chips the bot's health bar, adds score and a combo
  counter, and triggers camera shake + a forward dolly punch-in (bigger for
  kicks, with a brief hit-stop freeze-frame on the biggest ones), a spark
  burst, and a synthesized hit sound.
- The camera also sways gently on its own the whole time, so the shot never
  feels static.
- At 0 HP the bot topples over, shows a "K.O." banner, then gets back up
  with full health so the fight continues.

## Assets

`assets/drop-kick.fbx` and `assets/center-block.fbx` are Mixamo "X Bot"
exports (skinned mesh + skeleton + one animation clip each) — they supply
the player's and the bot's visible models.

The other moves (Punching, Boxing, Punching Bag, Martelo) share the exact
same Mixamo rig but don't need their own mesh, so instead of shipping 4 more
~2MB FBX files, their animation curves were extracted once with
`THREE.AnimationClip.toJSON()` into `assets/moves.json` (~650KB total) and
are loaded with `THREE.AnimationClip.parse()` at runtime, then bound to
both characters' mixers.

`ChapaGiratoria.fbx` (a spinning kick) was supplied but its file turned out
to be corrupted — both three.js's FBXLoader and an independent parser
(`assimp`) fail on it at the same byte offset. It isn't wired into the game;
send a fresh export to add it.

## Running locally

Just serve the `game/` folder over HTTP (ES module imports and the
`assets/moves.json` fetch don't work from `file://`), e.g.:

```
npx http-server game -p 8080
```

then open `http://localhost:8080`.

Three.js is vendored under `vendor/three/` (MIT licensed, see
`vendor/three/LICENSE`) so the page has no external CDN dependency.
