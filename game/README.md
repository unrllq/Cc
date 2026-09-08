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
  doesn't damage the player), mirroring the player's РЫВОК.
- Each connecting hit chips the bot's health bar, adds score and a combo
  counter, and triggers camera shake + a forward dolly punch-in (bigger for
  kicks and the charge attack, with a brief hit-stop freeze-frame on the
  biggest ones), a spark burst, and a synthesized hit sound.
- The camera also sways gently on its own the whole time, so the shot never
  feels static.
- At 0 HP the bot topples over, shows a "K.O." banner, then gets back up
  with full health so the fight continues.
- The fight happens in the center of a circular concrete-fence barrier (a
  user-supplied glTF model, instanced many times around the ring, with a
  wide gap left open on the camera-facing side), in front of a real scanned
  stone outcrop pushed back into the distance, with a spectator standing
  behind the fence watching the fight.

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

`assets/location.glb` is the scanned stone outcrop used as the arena's
backdrop, pushed well back and rescaled so the fighters clash in the center
of the fence ring instead of standing right in front of it. Its surface is
too jagged for the fighters to stand on believably, so it sits behind them
as the location's centerpiece while a plain circular floor remains the
actual walkable ground. The original upload was 11MB (a 4096×4096 PNG
texture plus ~167k untouched vertices); it's checked in here resized to a
1024×1024 texture and with quantized geometry (~4.2MB) via
`@gltf-transform/cli`:

```
gltf-transform resize   in.glb tmp1.glb --width 1024 --height 1024
gltf-transform jpeg     tmp1.glb tmp2.glb --quality 85
gltf-transform quantize tmp2.glb assets/location.glb
```
(Draco got it down to ~430KB, but pulling in a WASM decoder wasn't worth it
at this size — quantization alone was enough.)

`assets/fence.glb` is the concrete-barrier segment instanced into a full
ring around the fight (`RING_RADIUS`/`RING_GAP_DEG` in `game.js` control the
radius and how wide a gap is left open facing the camera). The original
upload was 19.9MB; it's checked in here at 925KB via the same
resize+jpeg pipeline as above, **but deliberately not quantized**:

```
gltf-transform resize in.glb tmp1.glb --width 1024 --height 1024
gltf-transform jpeg   tmp1.glb assets/fence.glb --quality 85 --formats png
```
The fence mesh's own node carries a leftover ~135× scale + 90° rotation
transform from its original export, which needs to be baked into the raw
geometry (`geometry.applyMatrix4(mesh.matrixWorld)`) before it can be used
as an `InstancedMesh` template with independent per-instance transforms.
`BufferGeometry.applyMatrix4()` silently re-clamps a *quantized* (normalized
integer) position attribute back into its ±1 representable range after
transforming it, which would destroy that baked-in scale — so quantization
is skipped for this asset specifically.

`assets/spectator.glb` is the girl model placed behind the fence, facing
back toward the fight. The original upload was 18.7MB; it's checked in here
at 1.04MB via resize + jpeg + quantize + an aggressive simplify pass:

```
gltf-transform resize    in.glb tmp1.glb --width 512 --height 512
gltf-transform jpeg      tmp1.glb tmp2.glb --quality 85 --formats png
gltf-transform weld      tmp2.glb tmp3.glb
gltf-transform simplify  tmp3.glb tmp4.glb --ratio 0.1 --error 0.1 --lock-border false
gltf-transform quantize  tmp4.glb assets/spectator.glb
```
`--lock-border false` matters here: the default locks every UV-seam vertex
as a "border" and scan/DAZ-style meshes are heavily seamed, so without it
`simplify` barely reduces the triangle count at all (the hair mesh alone
went from 149,512 to 21,476 vertices with the flag set).

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
