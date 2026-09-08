# Bot Smasher — Drop Kick Arena

A tiny 3D fighting minigame built with Three.js.

- **УДАР** button throws punches — cycling through Punching → Boxing →
  Punching Bag in turn.
- **КИК** button throws kicks — cycling through Martelo → Drop Kick (the
  big finisher) in turn.
- **РЫВОК** button dashes the player in to melee range for a Fist Fight
  charge attack, then dashes back out to guard distance.
- The bot stands its ground in a looping "Center Block" stance, randomly
  throws one of the punch/kick moves back between blocks, and every so
  often dashes in with its own charge attack too (cosmetic only — it
  doesn't damage the player), mirroring the player's РЫВОК. УДАР/КИК stay
  live the whole time this is happening — only the player's *own* РЫВОК is
  exclusive with the bot's, since it's the only move that shares the bot's
  charge-attack state machine. (An earlier version blocked all three
  buttons on any charge attack, player's or bot's, which made the game feel
  like it randomly stopped responding to input every 6-9 seconds.)
- Each connecting hit chips the bot's health bar, adds score and a combo
  counter, and triggers camera shake + a forward dolly punch-in (bigger for
  kicks and the charge attack, with a brief hit-stop freeze-frame on the
  biggest ones), a spark burst, and a synthesized hit sound.
- The camera also sways gently on its own the whole time, so the shot never
  feels static.
- At 0 HP the bot topples over, shows a "K.O." banner, then gets back up
  with full health so the fight continues.
- The fight happens on a plain asphalt lot in front of a McDonald's,
  pushed back into the distance as pure backdrop scenery.

## Assets

`assets/drop-kick.fbx` and `assets/center-block.fbx` are Mixamo "X Bot"
exports (skinned mesh + skeleton + one animation clip each) — they supply
the player's and the bot's visible models.

The other moves (Punching, Boxing, Punching Bag, Martelo, Fist Fight,
Standard Run) share the exact same Mixamo rig but don't need their own
mesh, so instead of shipping 6 more ~2MB FBX files, their animation curves
were extracted once with `THREE.AnimationClip.toJSON()` into
`assets/moves.json` and are loaded with `THREE.AnimationClip.parse()` at
runtime, then bound to both characters' mixers.

Standard Run carries a lot of baked-in forward root motion (it's meant to
travel across a level, not loop in place), so at bind time its Hips
position track has its X/Z components zeroed out (`makeInPlaceClip` in
`game.js`) while the Y component (the vertical bounce) is kept — that turns
it into a pure leg-cycling loop, while the actual world-space translation
for the РЫВОК dash is driven separately by a small tween
(`startRunSequence`/`updateActiveRun`) shared by both the player's button
and the bot's own charge attack.

`assets/mcdonalds.glb` is the backdrop building, pushed back so its base
overlaps the far edge of the floor with no gap, rotated 90° so its front
facade (the arches sign + drive-thru menu boards) faces the camera, and
scaled down slightly (0.8×) to fit the frame. The original upload was
12MB — almost entirely two 4096×2048 PNG textures — so it's checked in here
at 463KB via the standard `@gltf-transform/cli` pipeline:

```
gltf-transform resize    in.glb tmp1.glb --width 1024 --height 1024
gltf-transform jpeg      tmp1.glb tmp2.glb --quality 82 --formats png
gltf-transform weld      tmp2.glb tmp3.glb
gltf-transform quantize  tmp3.glb assets/mcdonalds.glb
```
Earlier rounds used a scanned stone outcrop, a concrete-fence ring, and a
spectator model here; all three were removed per a later request to clean
up the background and fight in front of the McDonald's instead.

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
