import { readFile, writeFile, readdir, stat, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(root,'../..');
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
if(git('rev-parse','HEAD')!=='96e5150c2cba36378928caf8219e5aebfbee6d79')throw new Error('Unexpected baseline');
execFileSync('git',['diff','--exit-code','HEAD','--','.'],{cwd:repo,stdio:'pipe'});
for(const file of ['prepare.mjs','serve.mjs','validate.mjs','prototype/prototype.js','prototype/ui1-data.js'])execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});
const broken=[];
for(const name of ['index.html','comparison.html','prototype/index.html']) {
  const source=await readFile(path.join(root,name),'utf8');
  for(const match of source.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    const href=match[1].split(/[?#]/)[0];
    if(href==='evidence.json')continue; // Written after successful validation below.
    if(/^[a-z]+:/i.test(href)||href.startsWith('/'))continue;
    try{await access(path.resolve(root,path.dirname(name),href));}catch{broken.push({name,href});}
  }
  for(const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new Function(match[1]);
}
if(broken.length)throw new Error(JSON.stringify(broken));
const checks=JSON.parse(await readFile(path.join(root,'screenshots/prototype-checks.json'),'utf8'));
if(!checks.every(c=>c.passed))throw new Error('Unresolved browser check');
function jpegSize(bytes){
  let i=2;
  while(i<bytes.length-9){
    if(bytes[i]!==0xff){i++;continue;}
    const marker=bytes[i+1];
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return{width:bytes.readUInt16BE(i+7),height:bytes.readUInt16BE(i+5)};
    if(marker===0xd8||marker===0xd9){i+=2;continue;}
    i+=2+bytes.readUInt16BE(i+2);
  }
  throw new Error('Missing JPEG dimensions');
}
async function walk(folder){
  const list=[];
  for(const entry of await readdir(folder,{withFileTypes:true})){
    if(entry.name==='evidence.json'||entry.name.endsWith('.zip'))continue;
    const file=path.join(folder,entry.name);
    if(entry.isDirectory())list.push(...await walk(file));
    else{const bytes=await readFile(file);list.push({path:path.relative(root,file).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),...(entry.name.endsWith('.jpg')?jpegSize(bytes):{})});}
  }
  return list;
}
const files=await walk(root);
const captures=files.filter(f=>/^screenshots\/(before|after)-(360|390|1440)-(top|full|landing)\.jpg$/.test(f.path));
for(const file of captures){const width=Number(file.path.match(/-(\d+)-/)[1]);if(file.width<width-16||file.width>width)throw new Error('Capture width mismatch: '+file.path);}
const before=JSON.parse(await readFile(path.join(root,'screenshots/before-metrics.json'),'utf8'));
const after=JSON.parse(await readFile(path.join(root,'screenshots/after-metrics.json'),'utf8'));
const comparisons=before.map(b=>{const a=after.find(a=>a.width===b.width);const y=rows=>rows.sections.find(s=>s.selector.includes('%22floor%22')).top;return{viewport:{width:b.width,height:b.height},beforeFirstItemY:y(b),afterFirstItemY:y(a),difference:y(b)-y(a),percent:Math.round((y(b)-y(a))/y(b)*100),noPrototypeHorizontalOverflow:a.scrollWidth<=a.width};});
const evidence={
  title:'UI2A · hönnunarrýni, ekki framleiðsluinnleiðing',date:'2026-10-29',
  baseline:{commit:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),sourceTrackedDiff:git('diff','--name-only','HEAD'),workingTreeStatus:git('status','--short')},
  capture:{browser:'Codex in-app browser, desktop viewport emulation; not real-device testing',dimensions:'Viewport sizes are read from innerWidth/innerHeight. Browser JPEG export omits native frame/scrollbar; raw bitmap dimensions are preserved per file below. Full-page images retain complete document height. No images were resized or edited after capture.',before:'Unmodified approved UI1 Next.js app, loopback 3212, demo only',after:'Isolated static design prototype, loopback 3213, copied UI1 DOM/CSS; assessments and persistence disabled',fixture:'Built-in synthetic Sýnigata 14, Stofa, 24/53 room items, 29 incomplete, no photos',mainComparison:'Identical room/data; both top and full-page. Separate before landing captures disclose existing mobile auto-scroll.',supplemental:'rental/active meter states captured from actual UI1 after UI-only edits to synthetic demo context; no customer data',baselineDefectSupplement:'before-390-defect.jpg reflects the synthetic rental/active-meter context; not the primary default comparison'},
  comparisons,checks:{browserPassed:checks.length,browserTotal:checks.length,syntax:'passed',staticLocalLinks:'passed',sourceCodeDiff:'none'},
  limitations:['No production UI2 implementation','Prototype navigation simulation is not a replacement for the production correction URL validators','No backend/production regression suite run for this docs-only change','Real device, screen reader, actual browser zoom, mobile keyboard, camera, and long custom room names outstanding','No WCAG conformance certification','No measured inspection-time savings'],
  gates:{hostedC:'CLOSED',publicTemporaryE:'UNRESOLVED',crossTabConcurrency:'UNRESOLVED'},files
};
await writeFile(path.join(root,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({files:files.length,captures:captures.length,browserChecksPassed:checks.length,comparisons,sourceDiff:'none',localLinks:'passed',syntax:'passed'},null,2));
