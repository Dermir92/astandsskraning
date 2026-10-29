import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const base = "08a9b39420a86e8c5a4b584bddb4f002df1a742a";
const folder = "docs/qa/ui1-a22";
mkdirSync(folder, { recursive: true });
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const allowed = new Set([
  "src/components/assessment-change.ts", "src/components/observation-editor.tsx",
  "src/components/inspection-checklist.module.css", "src/components/screens/inspection-screen.tsx",
  "src/components/photo-preview.tsx", "src/components/evidence-gallery.tsx", "src/components/evidence.module.css",
]);
const files = execFileSync("git", ["ls-tree", "-r", "--name-only", base], { encoding: "utf8" }).trim().split("\n");
const protectedFiles = files.filter(path => !allowed.has(path) && (
  path.startsWith("src/") || path.startsWith("supabase/") || path.startsWith(".github/") ||
  /docker|compose|vercel|next\.config|package(-lock)?\.json|tsconfig/i.test(path)
));
const preservation = protectedFiles.map(path => {
  const before = execFileSync("git", ["rev-parse", `${base}:${path}`], { encoding: "utf8" }).trim();
  const expected = hash(execFileSync("git", ["cat-file", "--filters", `${base}:${path}`]));
  const after = existsSync(path) ? hash(readFileSync(path)) : null;
  return { path, workingFileSha256: after, verifiedMainCheckoutSha256: expected, verifiedMainGitBlob: before, matchesVerifiedMain: expected === after };
});
if (preservation.some(file => !file.matchesVerifiedMain)) throw Error(`Protected source differs from verified main: ${preservation.filter(file => !file.matchesVerifiedMain).map(file => file.path).join(", ")}`);
writeFileSync(`${folder}/preservation.json`, JSON.stringify({ base, comparison: "Raw file SHA-256 against git cat-file --filters at verified main, respecting Windows checkout line endings", gateC: "CLOSED", gateE: "UNRESOLVED", protectedFiles: preservation }, null, 2) + "\n");
if (process.env.UI1_DESIGN_ROOT) {
  const references = ["report.md", "implementation-readiness.md", "index.html", "prototype/app.js", "prototype/app.css", "prototype/polish.css", "evidence/summary.json", "evidence/interactions.json", "evidence/data-equivalence.json"];
  writeFileSync(`${folder}/design-reference.json`, JSON.stringify({ source: "design/mobile-inspection-2026-10-28/a22-final/", sourceBranch: "codex/ux-mobile-inspection-concepts", usage: "Visual reference only; prototype state and persistence were not imported", files: references.map(path => ({ path, sha256: hash(readFileSync(join(process.env.UI1_DESIGN_ROOT, path))) })) }, null, 2) + "\n");
}
const results = "artifacts/ui1-regression.json";
if (existsSync(results)) {
  const run = JSON.parse(readFileSync(results, "utf8"));
  const followUpPath = "artifacts/ui1-rerun.json";
  const followUp = existsSync(followUpPath) ? JSON.parse(readFileSync(followUpPath, "utf8")) : null;
  function cases(suites, parents = []) {
    return suites.flatMap(suite => {
      const titles = [...parents, suite.title];
      return [...(suite.specs ?? []).flatMap(spec => spec.tests.map(test => ({ file: spec.file, title: [...titles, spec.title].join(" > "), project: test.projectName, repeat: test.repeatEachIndex, status: test.status }))), ...cases(suite.suites ?? [], titles)];
    });
  }
  const key = test => JSON.stringify([test.file, test.title, test.project, test.repeat]);
  const originalCases = cases(run.suites);
  const followUpPassed = new Set(followUp ? cases(followUp.suites).filter(test => test.status === "expected").map(key) : []);
  const resolvedFailures = originalCases.filter(test => test.status === "unexpected" && followUpPassed.has(key(test)));
  const verifiedCases = originalCases.map(test => test.status === "unexpected" && followUpPassed.has(key(test)) ? { ...test, status: "expected" } : test);
  const verifiedFinalCounts = { expected: 0, unexpected: 0, skipped: 0, flaky: 0 };
  verifiedCases.forEach(test => { verifiedFinalCounts[test.status]++; });
  if (Object.values(verifiedFinalCounts).reduce((sum, count) => sum + count, 0) !== originalCases.length) throw Error("Incomplete regression case accounting");
  if (!run.stats.expected || run.stats.flaky || run.errors.length || verifiedFinalCounts.unexpected ||
    (followUp && (followUp.stats.unexpected || followUp.stats.flaky || followUp.errors.length))) throw Error("Regression run has unresolved failures; review evidence is not ready");
  const byFile = new Map();
  for (const test of verifiedCases) {
      const file = test.file;
      const counts = byFile.get(file) ?? { file, expected: 0, unexpected: 0, skipped: 0, flaky: 0 };
      counts[test.status] = (counts[test.status] ?? 0) + 1;
      byFile.set(file, counts);
  }
  writeFileSync(`${folder}/test-results.json`, JSON.stringify({ command: "npx playwright test --workers=2 --output=artifacts/ui1-regression-results --reporter=line,json --max-failures=12", server: "next start on 127.0.0.1:3000 after npm run build; isolated demo only", fullRunStats: run.stats, followUp: followUp ? { command: "npx playwright test tests/readability.spec.ts --workers=1 --output=artifacts/ui1-rerun-results --reporter=line,json", stats: followUp.stats, cases: cases(followUp.suites) } : null, resolvedFailures, verifiedFinalCounts, files: [...byFile.values()], errors: run.errors }, null, 2) + "\n");
}
const screenshots = [];
for (const viewport of ["desktop", "mobile-360", "mobile-390"]) for (const phase of ["before", "after"]) for (const scene of ["checklist", "defect", "defect-viewport"]) {
  const path = `${phase}-${viewport}-${scene}.png`;
  const bytes = readFileSync(`${folder}/screenshots/${path}`);
  screenshots.push({ path: `screenshots/${path}`, phase, viewport, scene, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), sha256: hash(bytes) });
}
writeFileSync(`${folder}/screenshots.json`, JSON.stringify({ base, fixture: "tests/inspection-checklist-fixtures.ts: checklistReport(true); same canvas-generated synthetic photo in both phases", capture: "UI1_CAPTURE_PHASE=before|after npx playwright test tests/ui1-visual.spec.ts", screenshots }, null, 2) + "\n");
writeFileSync(`${folder}/gallery.html`, `<!doctype html><html lang="is"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UI1 · fyrir og eftir</title><style>body{font:16px/1.6 system-ui;margin:0;background:#f4f7f6;color:#16303d}header,main{padding:24px;max-width:1500px;margin:auto}h1{margin:0;font-size:26px}label{display:inline-block;margin:12px 20px 0 0}select{font:inherit;padding:8px;background:white;color:inherit}#comparison{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;min-width:0}img{max-width:100%;height:auto;border:1px solid #a8bab5}h2{font-size:18px}@media(max-width:700px){#comparison{grid-template-columns:1fr}}</style><header><h1>UI1 · samþætt A2.2</h1><p>Sama tilbúna skýrslan og myndin fyrir og eftir. Fyrir: main 08a9b39. Eftir: UI1. Gate C CLOSED · Gate E UNRESOLVED.</p><label>Skjástærð <select id="viewport"><option value="desktop">Desktop · 1440 × 1000</option><option value="mobile-360">Sími · 360 × 800</option><option value="mobile-390">Sími · 390 × 844</option></select></label><label>Birting <select id="scene"><option value="checklist">Gátlisti · heilsíða</option><option value="defect-viewport">Frávik · skjásýn</option><option value="defect">Frávik · heilsíða</option></select></label></header><main id="comparison"></main><script>const v=document.querySelector('#viewport'),s=document.querySelector('#scene'),c=document.querySelector('#comparison');function render(){c.innerHTML=['before','after'].map((phase,n)=>'<figure><h2>'+(n?'Eftir · UI1':'Fyrir · main')+'</h2><a href="screenshots/'+phase+'-'+v.value+'-'+s.value+'.png"><img alt="'+(n?'Eftir':'Fyrir')+' · '+v.value+' · '+s.value+'" src="screenshots/'+phase+'-'+v.value+'-'+s.value+'.png"></a></figure>').join('')}v.onchange=s.onchange=render;render()</script></html>\n`);
console.log(`Verified ${preservation.length} protected source files; indexed ${screenshots.length} screenshots.`);
