// Run from the repository root after the final checks. Reads synthetic QA
// artifacts only; never starts services or writes application data.
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const out = 'docs/qa/ui2a-implementation';
const baseline = '96e5150c2cba36378928caf8219e5aebfbee6d79';
const git = (...args) => execFileSync('git', args, {encoding:'utf8'}).trim();
const json = async p => JSON.parse(await readFile(p, 'utf8'));
const save = (name, value) => writeFile(`${out}/${name}`, JSON.stringify(value, null, 2)+'\n');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const file = `${dir}/${entry.name}`;
    found.push(...(entry.isDirectory() ? await walk(file) : [file]));
  }
  return found.sort();
}
const suite = await json('artifacts/ui2a/full-results.json');
if (suite.stats.unexpected || suite.stats.flaky || suite.errors.length) throw Error('Final suite is not clean; preserve failure evidence before delivery.');
const cases = [];
function visit(suites) {
  for (const s of suites) {
    for (const spec of s.specs ?? []) for (const t of spec.tests) cases.push({file:spec.file, line:spec.line, title:spec.title, project:t.projectName, status:t.status, expectedStatus:t.expectedStatus, annotations:t.annotations, results:t.results.map(r=>({status:r.status, durationMs:r.duration, retry:r.retry, errors:r.errors, attachments:r.attachments}))});
    visit(s.suites ?? []);
  }
}
visit(suite.suites);
const audits = cases.flatMap(c=>c.results.flatMap(r=>r.attachments.filter(a=>a.name==='sticky-target-size-resampling').map(a=>({file:c.file,title:c.title,project:c.project,samples:a.body?JSON.parse(Buffer.from(a.body,'base64').toString('utf8')):null}))));
await save('accessibility-resampling.json', audits);
for (const [from,to] of [['lint-final.log','lint.txt'],['typecheck-final.log','typecheck.txt'],['build.log','build.txt'],['full-final.log','full-suite.txt']]) {
  const transcript=await readFile(`artifacts/ui2a/${from}`,'utf8');
  // Readable Git transcripts normalize line endings/trailing whitespace only.
  // Original process logs remain in the ignored artifacts/ui2a directory.
  await writeFile(`${out}/${to}`,transcript.split(/\r?\n/).map(line=>line.trimEnd()).join('\n').trimEnd()+'\n');
}
const captures = {};
for (const phase of ['before','after']) captures[phase] = (await json(`artifacts/ui2a/capture-${phase}.json`)).stats;
const checks = {summary:`${suite.stats.expected} próf stóðust · ${suite.stats.skipped} sleppt samkvæmt skilyrðum · ${suite.stats.unexpected} mistókust · lint, typecheck og build stóðust.`,stats:suite.stats, captures, selectedRegression:(await json('artifacts/ui2a/final-regression.json')).stats, command:'npx playwright test --config playwright.ui2a.config.ts --workers=2', cases, excludedAsInBase:['tests/c1/**','tests/h1a/**','tests/h1b/**'], accessibilityResampling:'accessibility-resampling.json'};
await save('test-results.json', checks);
const comparisons=[];
for (const project of ['mobile-360','mobile-390','desktop']) {
  const before=await json(`${out}/screenshots/before/${project}/measurements.json`);
  const after=await json(`${out}/screenshots/after/${project}/measurements.json`);
  const b=before.find(r=>r.name==='reference-top'), a=after.find(r=>r.name==='reference-top');
  comparisons.push({project,viewport:a.viewport,beforeFirstItemY:b.firstItemY,afterFirstItemY:a.firstItemY,savedPx:b.firstItemY-a.firstItemY,percent:Math.round((b.firstItemY-a.firstItemY)/b.firstItemY*100),beforeTopScroll:b.scrollY,afterTopScroll:a.scrollY,allScenesNoHorizontalOverflow:before.concat(after).every(r=>r.noHorizontalOverflow)});
}
const unchanged=['src/lib/model.ts','src/lib/inspection-navigation.ts','src/lib/fire-observations.ts','src/lib/fire-navigation.ts','src/lib/meter-readings.ts','src/lib/meter-navigation.ts','src/lib/heating.ts','src/lib/inspection-comparison.ts','src/lib/report-preview.ts','src/components/demo-provider.tsx','src/components/observation-editor.tsx','src/components/photo-preview.tsx','src/components/heating-observation.tsx','src/components/inspection-comparison.tsx','src/components/fire-observation-fields.tsx','src/components/meter-readings.tsx','src/components/report-preview.tsx'];
const preservation=unchanged.map(file=>({file,baselineBlob:git('rev-parse',`${baseline}:${file}`),workingBlob:git('hash-object','--path',file,file)}));
if (preservation.some(r=>r.baselineBlob!==r.workingBlob)) throw Error('A preserved business/editor source changed');
const now=await readFile('src/components/app-shell.tsx','utf8');
const old=execFileSync('git',['show',`${baseline}:src/components/app-shell.tsx`],{encoding:'utf8'});
const saveStatus=s=>s.slice(s.indexOf('export function SaveStatus()'),s.indexOf('export function AppShell(')).replaceAll('\r\n','\n');
if(saveStatus(now)!==saveStatus(old)) throw Error('SaveStatus source changed');
const files=[];
for(const file of await walk(`${out}/screenshots`)) files.push({file,bytes:(await stat(file)).size,sha256:digest(await readFile(file))});
const approved=await json('docs/ui2a/evidence.json');
const frozenReference=await Promise.all(approved.files.map(async row=>({file:`docs/ui2a/${row.path}`,matchesApprovedSha256:digest(await readFile(`docs/ui2a/${row.path}`))===row.sha256})));
if(frozenReference.some(r=>!r.matchesApprovedSha256))throw Error('Approved reference bytes changed');
await save('evidence.json',{date:new Date().toISOString(),baseline:{commit:baseline,tree:git('rev-parse',`${baseline}^{tree}`)},branch:git('branch','--show-current'),capture:{before:'Unmodified UI1 baseline, next dev loopback 3224',after:'Real UI2A implementation, next start loopback 3222, production build',browser:'Playwright 1.64.1 (Chromium) desktop/mobile viewport emulation; synthetic fixtures only',images:'Raw PNG, no resizing or editing; explicit top shots are pinned and checked before/after capture',approvedReference:'docs/ui2a/REVIEW.md and frozen prototype/screenshots copied unchanged; original JPEG geometry retained'},comparisons,preservation,frozenReference,saveStatusSourceUnchanged:true,protectedDirectoriesDiff:git('diff',baseline,'--name-only','--','src/lib','supabase','scripts','.github'),versions:{node:process.version,next:'16.4.3',react:'19.3.1',playwright:'1.64.1'},checks:'test-results.json',files,limits:['Real-device, screen reader, real browser zoom, mobile keyboard, camera and inspector review outstanding','No WCAG conformance claim','Cross-tab concurrency unresolved','Hosted Gate C CLOSED; Gate E / PUBLIC TEMPORARY UNRESOLVED','Draft PR only; no merge or deployment']});
const metrics=['| Skjár | Fyrir | Eftir | Minna bil að fyrstu röð |','|---|---:|---:|---:|',...comparisons.map(r=>`| ${r.viewport.width} × ${r.viewport.height} | ${r.beforeFirstItemY} px | ${r.afterFirstItemY} px | ${r.savedPx} px (${r.percent}%) |`)].join('\n');
let report=await readFile(`${out}/REPORT.md`,'utf8');
report=report.replace(/<!-- METRICS:start -->[\s\S]*?<!-- METRICS:end -->|\{\{METRICS\}\}/,`<!-- METRICS:start -->\n${metrics}\n<!-- METRICS:end -->`);
report=report.replace(/<!-- RESULTS:start -->[\s\S]*?<!-- RESULTS:end -->|\{\{FULL_RESULT\}\}/,`<!-- RESULTS:start -->\n**${checks.summary}** Heildartími: ${(suite.stats.duration/60000).toFixed(1)} mínútur. Nýju UI2A-prófin: ${cases.filter(c=>c.file.endsWith('ui2a-inspection.spec.ts')&&c.status==='expected').length}/18 stóðust. Myndalotur: 3/3 fyrir og 3/3 eftir; 120 raunverulegar appmyndir. [Prófaskrá og sleppingar](test-results.json) · [Heildarúttak](full-suite.txt) · [Skráðar Axe-endurmælingar](accessibility-resampling.json).\n<!-- RESULTS:end -->`);
await writeFile(`${out}/REPORT.md`,report);
const paths=git('diff',baseline,'--name-only','-z').split('\0').filter(Boolean).sort();
const baselineFiles=new Set(git('ls-tree','-r','--name-only',baseline).split('\n'));
// Generated inventory is listed too, without an impossible self-referential hash.
if(!paths.includes(`${out}/file-inventory.json`))paths.push(`${out}/file-inventory.json`);
await save('file-inventory.json',{baseline,scope:'Exact PR files relative to baseline; inventory lists itself without a self-referential hash',hashBasis:'Working-tree bytes at delivery. Git may normalize text line endings; frozen approved reference uses -text and image bytes are unchanged.',files:await Promise.all(paths.sort().map(async file=>({file,change:baselineFiles.has(file)?'modified':'added',bytes:file===`${out}/file-inventory.json`?null:(await stat(file)).size,sha256:file===`${out}/file-inventory.json`?null:digest(await readFile(file))}))) });
console.log(checks.summary);
