import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRLightsPunctual } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, resample, flatten, join } from '@gltf-transform/functions';
import sharp from 'sharp';

const [,, inFile, outFile, maxTexStr, qStr] = process.argv;
const maxTex = parseInt(maxTexStr||'2048'), q = parseInt(qStr||'80');

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inFile);
const root = doc.getRoot();

// strip cameras
for (const cam of root.listCameras()) cam.dispose();
for (const n of root.listNodes()) {
  if (n.getCamera()) n.setCamera(null);
  const ext = n.getExtension('KHR_lights_punctual');
  if (ext) n.setExtension('KHR_lights_punctual', null);
}
for (const e of root.listExtensionsUsed()) {
  if (e.extensionName === 'KHR_lights_punctual') { for (const l of e.listProperties()) l.dispose(); e.dispose(); }
}

const animBefore = root.listAnimations().map(a => [a.getName(), a.listChannels().length]);

await doc.transform(
  resample(),
  dedup(),
  prune({ keepLeaves: false, keepAttributes: false }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [maxTex, maxTex], quality: q, effort: 6 }),
);

const animAfter = root.listAnimations().map(a => [a.getName(), a.listChannels().length]);
console.log('anims before', JSON.stringify(animBefore), '-> after', JSON.stringify(animAfter));
console.log('nodes:', root.listNodes().length, 'meshes:', root.listMeshes().length, 'textures:', root.listTextures().length, 'skins:', root.listSkins().length);
await io.write(outFile, doc);
