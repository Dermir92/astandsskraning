import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve("artifacts/phase-1b-concepts");
const evidence = JSON.parse(await readFile(path.join(root, "capture-evidence.json"), "utf8"));
const states = [
  ["01-opening", "Opna rými"], ["02-normal", "Eðlilegt ástand"], ["03-incomplete", "Ófullskráð atriði · heil síða"],
  ["03-incomplete-working", "Ófullskráð atriði · vinnustaða"], ["04-assessment", "Virkni og þrif"], ["05-deviation", "Frávik með mynd · heil síða"], ["05-deviation-working", "Frávik · myndir og lýsing"],
  ["06-review-attention", "Yfirferð · athygli"], ["07-review-incomplete", "Yfirferð · ófullskráð"], ["08-resume", "Endurkoma"],
  ["09-room-picker", "Rýmaval"], ["10-text-200", "200% textastærð"],
];
const html = `<!doctype html><html lang="is"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Áfangi 1B · Samanburður skoðunar</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f3f6f5;color:#172f40;font:16px/1.5 'Segoe UI',sans-serif}header{max-width:1250px;margin:auto;padding:28px 24px 18px}h1{font-size:28px;line-height:1.25;margin:6px 0 10px}p{margin:8px 0}a{color:#124f4a;text-underline-offset:3px}nav{display:flex;gap:16px;flex-wrap:wrap;margin:18px 0}label{display:grid;gap:5px;font-size:14px;font-weight:700}select{font:inherit;padding:10px;min-height:44px;background:white;color:#172f40;border:1px solid #71858e;border-radius:4px}main{padding:0 24px 28px;max-width:1250px;margin:auto}.compare{display:grid;grid-template-columns:1fr 1fr;gap:28px}.compare article{min-width:0;border-top:3px solid #17635d;padding-top:10px}.compare h2{font-size:21px;margin:4px 0}.compare p{font-size:14px;color:#405463}.compare img{display:block;width:auto;max-width:100%;height:auto;margin:14px auto 0;border:1px solid #a9bbc1;border-radius:5px}details{margin:28px 0}summary{min-height:44px;cursor:pointer}ul{padding-left:20px;font-size:14px}.tag{font-size:13px;font-weight:800;letter-spacing:1px;color:#17635d}.stats{font-size:14px;color:#405463}button{font:inherit;min-height:44px}a:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #006b7a;outline-offset:3px}@media(max-width:600px){.compare{grid-template-columns:1fr}header,main{padding-inline:16px}}</style>
<header><span class="tag">ÁSTANDSSKRÁNING · ÁFANGI 1B</span><h1>Tvær leiðir í gegnum skoðun</h1><p>Tilbúnar sýnilotur til samanburðar og samþykktar. Samþykkt forritsflæði er óbreytt.</p><p class="stats">A: 144 virkjanir · B: 103 virkjanir · 99 sjálfstæð svör í báðum leiðum.</p>
<nav aria-label="Samanburðarstillingar"><label>Breidd<select id="width">${[360,390,768,1440].map(w=>`<option${w===390?' selected':''}>${w}</option>`).join("")}</select></label><label>Staða<select id="state">${states.map(([value,label])=>`<option value="${value}">${label}</option>`).join("")}</select></label></nav><p><a href="http://127.0.0.1:3112/hugmyndir">Opna gagnvirkan samanburð</a> · <a href="http://127.0.0.1:3112/hugmyndir/a">Prófa A</a> · <a href="http://127.0.0.1:3112/hugmyndir/b">Prófa B</a></p></header>
<main><div class="compare"><article><span class="tag">HUGMYND A</span><h2>Verkefnamiðuð skoðun</h2><p>Eitt atriði í forgrunni · meðvituð færsla áfram</p><a id="link-a"><img id="image-a" alt="Skjámynd af hugmynd A"></a></article><article><span class="tag">HUGMYND B</span><h2>Þéttur gátlisti</h2><p>Yfirsýn yfir rýmið · skýr flýtisvör á hverri röð</p><a id="link-b"><img id="image-b" alt="Skjámynd af hugmynd B"></a></article></div>
<details><summary>Allar ${evidence.length} skjámyndir</summary><ul>${evidence.map(e=>`<li><a href="screenshots/${e.width}/${e.concept}/${e.name}.png">${e.width} px · ${e.concept.toUpperCase()} · ${states.find(s=>s[0]===e.name)?.[1]??e.name}</a></li>`).join("")}</ul></details><p class="stats">Mynd af fráviki er merkt tilbúin AI-sýnimynd. Myndaupphleðsla í sýnilotum er tímabundin forskoðun. Engin samþykkt eða innleiðing er framkvæmd af þessari síðu.</p></main>
<script>const width=document.getElementById('width'),state=document.getElementById('state');function update(){for(const c of ['a','b']){const src='screenshots/'+width.value+'/'+c+'/'+state.value+'.png';document.getElementById('image-'+c).src=src;document.getElementById('link-'+c).href=src;}}width.addEventListener('change',update);state.addEventListener('change',update);update();</script></html>`;
const file = path.join(root, "comparison.html");
await writeFile(file, html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1120, height: 1360 } });
  await page.goto(pathToFileURL(file).href);
  await page.locator("#image-b").evaluate(img => img.decode());
  await page.screenshot({ path: path.join(root, "comparison-390.png"), fullPage: true });
} finally { await browser.close(); }
console.log(`Gallery: ${evidence.length} linked captures`);
