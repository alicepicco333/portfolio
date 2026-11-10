// Builds the light assets of the browser Junior (public/sim/junior/assets and vendor) from the group repo's originals.
// The originals weigh ~52 MB (4096 px textures, raw geometry); this keeps the shapes, resizes the textures to webp
// and compresses the geometry with meshopt, so the page loads in a few MB.
//
// Run (tools = a folder with node_modules holding @gltf-transform/cli 4.5.1, three 0.186.0 and esbuild):
//   node design/junior-sim/build-assets.mjs <tools> "<group repo>/FINAL - demo Thu 22 Oct" public/sim/junior
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const [tools, src, out] = process.argv.slice(2);
if (!tools || !src || !out) throw new Error('usage: build-assets.mjs <tools> <FINAL folder> <out>');
const req = createRequire(path.join(path.resolve(tools), 'package.json'));
const load = name => import(pathToFileURL(req.resolve(name)).href);

const { NodeIO } = await load('@gltf-transform/core');
const { ALL_EXTENSIONS } = await load('@gltf-transform/extensions');
const { dedup, prune, textureCompress, meshopt, weld, simplify } = await load('@gltf-transform/functions');
const { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } = await load('meshoptimizer');
const sharp = (await load('sharp')).default;
const esbuild = await load('esbuild');

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder,
});

const assets = path.join(src, 'Presentation', 'deck', 'assets');
const vendor = path.join(src, 'Presentation', 'deck', 'vendor');
const outAssets = path.join(out, 'assets');
const outVendor = path.join(out, 'vendor');
fs.mkdirSync(outAssets, { recursive: true });
fs.mkdirSync(outVendor, { recursive: true });

// [file in, file out, share of triangles kept, texture sizes: [slot, name pattern or null, px]]
// Junior is seen up close (the chase camera is about a metre away), Marvin from two to four metres, the fungus is 16 cm tall.
const models = [
  ['marvin-junior.glb', 'junior.glb', 0.6, [['baseColor', null, 1024], ['normal', null, 512], ['metallicRoughness', null, 512]]],
  ['fungus.glb', 'fungus.glb', 0.35, [['baseColor', null, 512], ['normal', null, 256], ['metallicRoughness', null, 256]]],
  ['spacesuit.gltf', 'marvin.glb', 0.35, [['baseColor', /space_suit/, 1024], ['baseColor', /helmet|glove/, 512],
    ['normal', null, 256], ['metallicRoughness', null, 256]]],
];

for (const [from, to, keep, sizes] of models) {
  const doc = await io.read(path.join(assets, from));
  const root = doc.getRoot();
  for (const a of root.listAnimations()) a.dispose();  // the suit's shovel/clap/dance clips: sim.html never played them
  const steps = [dedup()];
  if (keep < 1) steps.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: keep, error: 0.004 }));
  for (const [slot, pattern, px] of sizes) {
    steps.push(textureCompress({ encoder: sharp, targetFormat: 'webp', slots: new RegExp(slot), ...(pattern && { pattern }),
      resize: [px, px], quality: slot === 'normal' ? 82 : 76, effort: 90 }));
  }
  steps.push(prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  await doc.transform(...steps);
  const file = path.join(outAssets, to);
  await io.write(file, doc);
  console.log(to, (fs.statSync(file).size / 1024).toFixed(0), 'KB', root.listMeshes().length, 'meshes', root.listMeshes().reduce((n, m) => n + m.listPrimitives()[0].getAttribute('POSITION').getCount(), 0), 'vertices',
    root.listNodes().filter(n => /tripo_part_(1|2|12|13)$/.test(n.getName())).map(n => n.getName()).join(' '));
}

// The backdrop: only the part above the picture's misty horizon was ever shown (sim.html: repeat .56, offset .44).
const env = sharp(path.join(assets, 'environment.jpg'));
const { width, height } = await env.metadata();
await env.extract({ left: 0, top: 0, width, height: Math.round(height * 0.56) })
  .webp({ quality: 74, effort: 6 }).toFile(path.join(outAssets, 'environment.webp'));
console.log('environment.webp', (fs.statSync(path.join(outAssets, 'environment.webp')).size / 1024).toFixed(0), 'KB');

// three.js r186, the version in the group repo's vendor folder (same files, minified). GLTFLoader with its two helpers in one file.
const three = path.join(path.dirname(req.resolve('three')), '..');  // node_modules/three (build/three.cjs is what resolves)
for (const f of ['three.core.js', 'three.module.js']) {
  await esbuild.build({ entryPoints: [path.join(vendor, f)], outfile: path.join(outVendor, f), minify: true,
    bundle: false, format: 'esm', legalComments: 'inline', logLevel: 'warning' });
}
await esbuild.build({ entryPoints: [path.join(three, 'examples', 'jsm', 'loaders', 'GLTFLoader.js')],
  outfile: path.join(outVendor, 'GLTFLoader.js'), bundle: true, external: ['three'], minify: true, format: 'esm',
  legalComments: 'inline', logLevel: 'warning' });
await esbuild.build({ entryPoints: [path.join(three, 'examples', 'jsm', 'libs', 'meshopt_decoder.module.js')],
  outfile: path.join(outVendor, 'meshopt_decoder.js'), minify: true, format: 'esm', legalComments: 'inline', logLevel: 'warning' });
fs.copyFileSync(path.join(three, 'LICENSE'), path.join(outVendor, 'THREE-LICENSE.txt'));
for (const f of fs.readdirSync(outVendor)) console.log('vendor/' + f, (fs.statSync(path.join(outVendor, f)).size / 1024).toFixed(0), 'KB');
