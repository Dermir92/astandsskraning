// Local design artifact only. Reads UI1 DOM captured through the browser.
// Does not write application sources, use credentials, or publish anything.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(root, 'prototype', 'assets');
await mkdir(assets, { recursive: true });
const ui1 = JSON.parse(await readFile(path.join(root, 'ui1-dom.json'), 'utf8'));
const rooms = JSON.parse(await readFile(path.join(root, 'ui1-rooms.json'), 'utf8'));
const defect = await readFile(path.join(root, 'ui1-defect-dom.html'), 'utf8');
const rentalFire = await readFile(path.join(root, 'ui1-rental-fire.html'), 'utf8');
const activeMeters = await readFile(path.join(root, 'ui1-active-meters.html'), 'utf8');
const rail = await readFile(path.join(root, 'ui1-rail.html'), 'utf8');
for (const [index, href] of ui1.styles.entries()) {
  const response = await fetch(new URL(href, 'http://127.0.0.1:3212'));
  if (!response.ok) throw new Error(`UI1 CSS ${response.status}`);
  let css = await response.text();
  for (const match of [...css.matchAll(/url\(["']?([^\s)'"?]+)(?:\?[^)'"\s]*)?["']?\)/g)]) {
    if (match[1].startsWith('data:')) continue;
    const url = new URL(match[1], 'http://127.0.0.1:3212');
    const file = path.basename(url.pathname);
    const font = await fetch(url);
    if (!font.ok) throw new Error(`Asset ${font.status}: ${url.pathname}`);
    await writeFile(path.join(assets, file), Buffer.from(await font.arrayBuffer()));
    css = css.replaceAll(match[0], `url("./${file}")`);
  }
  await writeFile(path.join(assets, `ui1-${index}.css`), css);
}
const data = { ...rooms, defect, rentalFire, activeMeters, rail, fire: ui1.fire, meters: ui1.meters, incomplete: ui1.incomplete };
await writeFile(path.join(root, 'prototype', 'ui1-data.js'), `const UI1 = ${JSON.stringify(data).replaceAll('<', '\\u003c')};\n`);
console.log('Portable UI2A prototype prepared from actual UI1 browser DOM.');
