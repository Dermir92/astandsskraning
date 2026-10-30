// Run from the repository root after all checks. Only delivery files are written.
import { readFile, writeFile, readdir, mkdir, copyFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
const out='docs/qa/ui2a-f1', input='artifacts/ui2a-f1';
const baseline='f2d85affca579ebc0791984ffdc73ab922695ea7';
const main='96e5150c2cba36378928caf8219e5aebfbee6d79';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async file=>JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
const save=(file,data)=>writeFile(out+'/'+file,JSON.stringify(data,null,2)+'\n');
const before=await json(input+'/before-final-results.json');
const after=await json(input+'/after-final-results.json');
const full=await json(input+'/full-results.json');
const isolated=await json(input+'/evidence-isolated-results.json');
const race=await json(input+'/mobile-race-repeat-results.json');
const provenance=await json(input+'/before-provenance.json');
if(before.stats.unexpected!==30||before.stats.expected!==6||after.stats.unexpected||after.stats.expected!==36)throw Error('Required F1 fail-before/pass-after verification is not clean.');
if(isolated.stats.expected!==1||isolated.stats.unexpected||isolated.errors.length)throw Error('The unchanged evidence test did not pass its diagnostic run.');
const testHash=digest(await readFile('tests/ui2a-context-visibility.spec.ts'));
if(testHash!==provenance.TestSha256||provenance.Head!==baseline||provenance.SourceDiff)throw Error('Before/after provenance or test bytes changed.');
function cases(suites,result=[]){
 for(const s of suites){
  for(const spec of s.specs??[])for(const t of spec.tests)result.push({file:spec.file,title:spec.title,project:t.projectName,status:t.status,annotations:t.annotations,results:t.results.map(r=>({status:r.status,duration:r.duration,errors:r.errors}))});
  cases(s.suites??[],result);
 }
 return result;
}
const beforeCases=cases(before.suites), fullCases=cases(full.suites);
if(fullCases.length!==1071||full.errors.length||fullCases.some(c=>c.results.some(r=>r.status==='interrupted')))throw Error('The complete suite must finish before evidence is collected.');
if(fullCases.filter(c=>c.file.endsWith('ui2a-context-visibility.spec.ts')&&c.status==='expected').length!==36)throw Error('The full suite did not preserve all 36 passing F1 cases.');
for(const c of beforeCases.filter(c=>c.status==='unexpected'))if(!c.results.some(r=>r.errors.some(e=>/Associated label\/legend|Question and selected answer fit/.test(e.message??''))))throw Error('A baseline failure is unrelated to context visibility.');
const measurements=[], rawAxe=[], archives=[];
for(const [phase,source] of [['before','before-final'],['after','after-final']]){
 await mkdir(out+'/screenshots/'+phase,{recursive:true});
 const files=await readdir(input+'/'+source);
 for(const name of files.filter(n=>n.endsWith('.png')))await copyFile(input+'/'+source+'/'+name,out+'/screenshots/'+phase+'/'+name);
 for(const name of files.filter(n=>n.endsWith('-measurements.json')))measurements.push({phase,name:name.replace('-measurements.json',''),...await json(input+'/'+source+'/'+name)});
 for(const name of files.filter(n=>n.endsWith('-axe-raw.json'))){
  const bytes=await readFile(input+'/'+source+'/'+name);
  rawAxe.push({phase,name:name.replace('-axe-raw.json',''),sha256:digest(bytes),rawJsonText:bytes.toString('utf8')});
 }
}
if(rawAxe.length!==72||measurements.length!==72)throw Error('Missing raw Axe or geometry evidence.');
const rawBundle=Buffer.from(JSON.stringify({ruleTags:['wcag2a','wcag2aa','wcag21aa','wcag22aa'],method:'Full original unfiltered JSON text per case, before resampling.',cases:rawAxe}));
await writeFile(out+'/axe-raw.json.gz',gzipSync(rawBundle,{level:9}));
const axeSummary=['before','after'].map(phase=>{
 const scans=rawAxe.filter(c=>c.phase===phase).map(c=>JSON.parse(c.rawJsonText));
 const nodes=scans.flatMap(scan=>scan.violations.flatMap(v=>v.nodes.map(node=>({rule:v.id,target:node.target}))));
 return {phase,cases:scans.length,violationNodes:nodes,incompleteRules:scans.reduce((sum,scan)=>sum+scan.incomplete.length,0)};
});
const resampling=[];
function samples(suites){for(const s of suites){for(const spec of s.specs??[])for(const t of spec.tests)for(const r of t.results)for(const attachment of r.attachments??[])if(attachment.name==='sticky-target-size-resampling'&&attachment.body)resampling.push({file:spec.file,title:spec.title,project:t.projectName,samples:JSON.parse(Buffer.from(attachment.body,'base64').toString('utf8'))});samples(s.suites??[]);}}
samples(after.suites);
await save('axe-resampling.json',{rawSummary:axeSummary,resampling,helperUnchanged:true,rulesUnchanged:true,focusGeometryAssertedBeforeResampling:true});
for(const [source,target] of [['before-final-results.json','before-results.json.gz'],['after-final-results.json','after-results.json.gz'],['full-results.json','full-results.json.gz'],['evidence-isolated-results.json','evidence-isolated-results.json.gz'],['mobile-race-repeat-results.json','mobile-race-repeat-results.json.gz']]){
 const bytes=await readFile(input+'/'+source);
 const compressed=gzipSync(bytes,{level:9});
 await writeFile(out+'/'+target,compressed);
 archives.push({file:target,originalSha256:digest(bytes),gzipSha256:digest(compressed),originalBytes:bytes.length});
}
for(const [source,target] of [['before-final-run.txt','fail-before.txt'],['after-final-run.txt','pass-after.txt'],['full-run.txt','full-suite.txt'],['full-concurrent-attempt.txt','concurrent-attempt.txt'],['concurrent-timeout-context.md','concurrent-timeout.md'],['full-serial-attempt.txt','serial-attempt.txt'],['serial-timeout-context.md','serial-timeout.md'],['evidence-isolated-run.txt','evidence-isolated.txt'],['fast-attempt.txt','fast-attempt.txt'],['fast-race-context.md','report-list-race.md'],['mobile-race-repeat-run.txt','report-list-repeat.txt'],['build.txt','build.txt'],['lint.txt','lint.txt'],['typecheck.txt','typecheck.txt']]){
 const text=await readFile(input+'/'+source,'utf8');
 await writeFile(out+'/'+target,text.split(/\r?\n/).map(line=>line.trimEnd()).join('\n').trimEnd()+'\n');
}
await save('measurements.json',measurements);
const skipped=fullCases.filter(c=>c.status==='skipped');
const byProject=Object.fromEntries([...new Set(fullCases.map(c=>c.project))].map(p=>[p,{passed:fullCases.filter(c=>c.project===p&&c.status==='expected').length,skipped:fullCases.filter(c=>c.project===p&&c.status==='skipped').length}]));
const concurrentIssue={file:'tests/inspection-evidence.spec.ts',title:'five-width visual, accessibility and 200 percent text verification',initialOutcome:'180000 ms timeout in interrupted --workers=2 and --workers=1 attempts with trace recording',testOrTimeoutChanged:false,diagnosticIsolated:isolated.stats,finalOutcome:fullCases.find(c=>c.file.endsWith('inspection-evidence.spec.ts')&&c.title.startsWith('five-width visual')&&c.project==='desktop')?.status,evidence:['concurrent-timeout.md','serial-timeout.md','evidence-isolated.txt']};
const recommendation=full.stats.unexpected||full.stats.flaky?'NEEDS FURTHER FIX':'READY FOR INDEPENDENT RE-REVIEW';
await save('results.json',{recommendation,before:before.stats,after:after.stats,full:full.stats,fullWorkers:2,fullTrace:'off (CLI instrumentation only; no test/rule/timeout edits)',focusedTrace:'retain-on-failure (unchanged)',byProject,skipped,newRegression:fullCases.filter(c=>c.file.endsWith('ui2a-context-visibility.spec.ts')),failures:fullCases.filter(c=>c.status==='unexpected'),beforeFailures:beforeCases.filter(c=>c.status==='unexpected'),earlierVerificationIssue:concurrentIssue,reportListRepeat:race.stats,rawPlaywrightReports:archives,rawAxeBundle:'axe-raw.json.gz',rawAxeCases:rawAxe.length,excludedAsInBase:['tests/c1/**','tests/h1a/**','tests/h1b/**']});
const preserved=['src/components/screens/inspection-screen.tsx','src/components/inspection-screen.module.css','src/components/inspection-checklist.module.css','src/components/observation-editor.tsx','src/components/photo-preview.tsx','src/components/heating-observation.tsx','src/components/inspection-comparison.tsx','src/components/fire-observation-fields.tsx','src/components/meter-readings.tsx','src/components/app-shell.tsx','src/components/demo-provider.tsx','src/components/use-inspection-navigation.ts','src/components/use-fire-correction.ts','src/components/use-meter-correction.ts','src/components/inspection-focus.ts','src/lib/model.ts','src/lib/inspection-navigation.ts','src/lib/fire-observations.ts','src/lib/fire-navigation.ts','src/lib/meter-readings.ts','src/lib/meter-navigation.ts','src/lib/report-preview.ts','tests/inspection-accessibility.ts','tests/inspection-evidence.spec.ts','src/components/context-dialog.tsx','src/components/screens/reports-screen.tsx','tests/mobile-refinement.spec.ts'];
const preservation=preserved.map(file=>({file,baselineBlob:git('rev-parse',baseline+':'+file),workingBlob:git('hash-object','--path',file,file)}));
if(preservation.some(r=>r.baselineBlob!==r.workingBlob))throw Error('A preserved editor, rule, URL, persistence or Axe helper changed.');
const imageFiles=[];
for(const phase of ['before','after'])for(const name of await readdir(out+'/screenshots/'+phase)){
 const file='screenshots/'+phase+'/'+name;
 imageFiles.push({file,sha256:digest(await readFile(out+'/'+file)),bytes:(await stat(out+'/'+file)).size});
}
for(const file of ['comparison-320.jpg','comparison-320-200.jpg','report-list-race.png'])imageFiles.push({file,sha256:digest(await readFile(out+'/'+file)),bytes:(await stat(out+'/'+file)).size,kind:file.endsWith('.jpg')?'Browser capture of the local comparison gallery; source PNGs remain unchanged.':'Original test failure screenshot, report-list race.'});
await save('evidence.json',{date:new Date().toISOString(),reviewedBaseline:baseline,approvedMain:{commit:main,tree:git('rev-parse',main+'^{tree}')},branch:git('branch','--show-current'),beforeProvenance:provenance,sameTestBeforeAfter:true,testSha256:testHash,implementationSha256:digest(await readFile('src/components/use-inspection-sections.ts')),buildId:(await readFile('.next/BUILD_ID','utf8')).trim(),preservation,images:imageFiles,rawAxe:{cases:rawAxe.length,file:'axe-raw.json.gz',sha256:digest(await readFile(out+'/axe-raw.json.gz')),ruleTags:['wcag2a','wcag2aa','wcag21aa','wcag22aa']},archives,limitations:['No WCAG 2.2 AA conformance claim','200% here is computed-font simulation, not browser zoom','Real browser zoom 200-400%, VoiceOver/TalkBack/NVDA, iOS Safari/Android, virtual keyboard and camera/gallery are unverified','Cross-tab concurrency unresolved','Demo only, no real customer data'],gates:{C:'CLOSED',E:'UNRESOLVED',crossTab:'UNRESOLVED'}});
function table(scale){
 const rows=[];
 for(const width of [320,360,390])for(const kind of ['radio','textarea']){
  const name=width+'-'+(scale===2?'200':'normal')+'-'+kind+'-fire';
  const b=measurements.find(m=>m.phase==='before'&&m.name===name),a=measurements.find(m=>m.phase==='after'&&m.name===name);
  rows.push('| '+width+' | '+kind+' | '+b.heading.top.toFixed(2)+' | '+a.heading.top.toFixed(2)+'–'+a.heading.bottom.toFixed(2)+' | '+a.viewport.top.toFixed(2)+' | '+a.control.top.toFixed(2)+'–'+a.control.bottom.toFixed(2)+' |');
 }
 return ['| Breidd | Fókus | Merki fyrir: y | Merki eftir: y | Sýnileg efri brún | Reitur eftir: y |','|---|---|---:|---:|---:|---:|',...rows].join('\n');
}
let report=await readFile(out+'/REVIEW.md','utf8');
function insert(key,value){const pattern=new RegExp('<!-- '+key+':start -->[\\s\\S]*?<!-- '+key+':end -->|\\{\\{'+key+'\\}\\}');report=report.replace(pattern,'<!-- '+key+':start -->\n'+value+'\n<!-- '+key+':end -->');}
insert('RECOMMENDATION',recommendation);
insert('DELIVERY',full.stats.unexpected||full.stats.flaky?'F1-leiðréttingin stenst markvissu prófin, en full sannprófun er ekki græn. Skilyrðið fyrir commit/push er því ekki uppfyllt. Engin commit, push eða PR-uppfærsla hefur farið fram.':'F1-leiðréttingin stenst markvissu prófin og öll áskilin sannprófun stóðst í lokasvítunni. Fyrri tímamörk og staðfest flökt í sérendurtekningu óbreytts forsíðuprófs eru áfram skráð hér að neðan. Aðeins F1-kóði, ný regressjón og þessi gögn eru innan commit-/push-heimildarinnar. PR #21 helst Draft til óháðrar endurrýni.');
insert('PUBLICATION',full.stats.unexpected||full.stats.flaky?'Afhending heldur aftur af commit/push í samræmi við skilyrði verkefnisins.':'Lokasvítan þarf enga breytingu á þessu prófi til að standast. Sérendurtekningin sýnir engu að síður þekktan óstöðugleika, sem skal meta sérstaklega í óháðri rýni; engin fullyrðing er gerð um að hann sé lagaður.');
insert('RESULTS','**Fyrir: 30 fallin / 6 staðist. Eftir: 36/36 staðist. Heildarsvíta: '+full.stats.expected+' staðist, '+full.stats.skipped+' skilyrt sleppt, '+full.stats.unexpected+' mistókust, '+full.stats.flaky+' flokkuð flaky af Playwright (retries=0).** Heildartími '+(full.stats.duration/60000).toFixed(1)+' mínútur. Allar 36 F1-regressjónir stóðust í heildarlotunni. Aðskilin endurtekning fyrirliggjandi forsíðuprófs: '+race.stats.expected+' staðist / '+race.stats.unexpected+' mistókust; þessi þekkti óstöðugleiki er ekki felldur inn í núllið fyrir sjálfvirk retries. Lint, typecheck og framleiðslubygging standast.');
insert('NORMAL',table(1));insert('ENLARGED',table(2));
await writeFile(out+'/REVIEW.md',report);
const paths=git('diff',baseline,'--name-only','-z').split('\0').filter(Boolean);
const self=out+'/file-inventory.json';
if(!paths.includes(self))paths.push(self);
const baselineFiles=new Set(git('ls-tree','-r','--name-only',baseline).split(/\r?\n/));
await save('file-inventory.json',{baseline,scope:'F1 changes only, relative to the reviewed head. Stage new delivery files and rerun to complete this list.',hashBasis:'Working-tree bytes. Git may normalize text line endings. Inventory excludes its own hash/length.',files:await Promise.all(paths.sort().map(async file=>({file,change:baselineFiles.has(file)?'modified':'added',bytes:file===self?null:(await stat(file)).size,sha256:file===self?null:digest(await readFile(file))})))});
console.log(recommendation+'; F1 before 30 fail / 6 pass; after 36 pass; full '+full.stats.expected+' pass / '+full.stats.skipped+' skipped / '+full.stats.unexpected+' failed.');
