import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { basename, join } from "node:path";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const input = "artifacts/ui1-followup";
const output = "docs/qa/ui1-a22/follow-up";
const reviewedCommit = "5e2c87aaffa50246b83e327d2f3cd088b7f30c3f";
const read = path => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
const hash = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const save = (name, value) => writeFileSync(join(output, name), JSON.stringify(value, null, 2) + "\n");
const requireTrue = (condition, message) => { if (!condition) throw Error(message); };
const find = (dir, name) => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() && entry.name !== "attachments" ? find(join(dir, entry.name), name) : entry.isFile() && entry.name === name ? [join(dir, entry.name)] : []);
mkdirSync(output, { recursive: true });

const run = read(`${input}/full.json`);
requireTrue(Number(readFileSync(`${input}/full-exit-code.txt`, "utf8").trim()) === 0, "Full run did not exit successfully");
requireTrue(run.stats.expected > 0 && run.stats.unexpected === 0 && run.stats.flaky === 0 && run.errors.length === 0, "Full run has genuine failures");
const cases = [];
function visit(suites, parents = []) {
  for (const suite of suites) {
    const titles = [...parents, suite.title];
    for (const spec of suite.specs ?? []) for (const test of spec.tests) {
      requireTrue(test.results.length <= 1, "Unexpected retry or merged result");
      const annotations = (test.annotations ?? []).map(({ type, description, location }) => ({ type, description, location: location ? { line: location.line, column: location.column } : undefined }));
      cases.push({ file: spec.file, title: [...titles, spec.title].join(" > "), project: test.projectName, status: test.status, annotations, duration: test.results[0]?.duration });
    }
    visit(suite.suites ?? [], titles);
  }
}
visit(run.suites);
requireTrue(cases.length === run.stats.expected + run.stats.skipped, "Incomplete case accounting");
const groups = new Map();
for (const test of cases) {
  const key = `${test.project}:${test.file}`;
  const group = groups.get(key) ?? { project: test.project, file: test.file, passed: 0, skipped: 0, failed: 0 };
  group[test.status === "expected" ? "passed" : test.status === "skipped" ? "skipped" : "failed"]++;
  groups.set(key, group);
}
save("full-results.json", { command: "npx playwright test --workers=2 --retries=0 --max-failures=0 --output=artifacts/ui1-followup/full-results --reporter=line,json", uninterrupted: true, aggregation: false, retries: 0, stats: run.stats, genuineFailures: cases.filter(test => !["expected", "skipped"].includes(test.status)), expectedSkips: cases.filter(test => test.status === "skipped"), files: [...groups.values()], rawJsonSha256: hash(`${input}/full.json`), rawLogSha256: hash(`${input}/full.log`) });

const frozen = read(`${input}/frozen-source.json`);
requireTrue(frozen.buildId === readFileSync(".next/BUILD_ID", "utf8").trim(), "Build changed during verification");
frozen.files.forEach(file => requireTrue(hash(file.path) === file.sha256, `Source changed during verification: ${file.path}`));
const oldLogs = read(`${input}/prior-logs.json`);
const logs = oldLogs.map(file => ({ ...file, path: file.path.replaceAll("\\", "/"), originalUnchanged: hash(file.path) === file.sha256, archiveMatches: hash(join(input, "prior", basename(file.path))) === file.sha256 }));
logs.forEach(file => requireTrue(file.originalUnchanged && file.archiveMatches, `Prior log changed: ${file.path}`));
const protectedFiles = read("docs/qa/ui1-a22/preservation.json").protectedFiles.map(file => ({ path: file.path, sha256: hash(file.path), unchanged: hash(file.path) === file.workingFileSha256 }));
protectedFiles.forEach(file => requireTrue(file.unchanged, `Protected file changed: ${file.path}`));
const changedSource = execFileSync("git", ["diff", "--name-only", reviewedCommit, "--", "src"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
requireTrue(changedSource.length === 1 && changedSource[0] === "src/components/photo-preview.tsx", "Unrelated application source changes");
const oldEvidenceChanges = execFileSync("git", ["diff", "--name-only", reviewedCommit, "--", "docs/qa/ui1-a22", ":(exclude)docs/qa/ui1-a22/follow-up"], { encoding: "utf8" }).trim();
requireTrue(!oldEvidenceChanges, "Original UI1 review evidence changed");
save("preservation.json", { reviewedCommit, gateC: "CLOSED", gateE: "UNRESOLVED", changedSource, previousEvidenceUnchanged: true, priorLogs: logs, frozenSource: frozen, protectedFiles });

copyFileSync(find(`${input}/baseline-results`, "native-ax.json")[0], `${output}/native-ax-baseline.json`);
copyFileSync(find(`${input}/full-results`, "native-ax.json")[0], `${output}/native-ax.json`);
copyFileSync(find(`${input}/disclosure-reproduction`, "photo-disclosure.json")[0], `${output}/photo-disclosure-before.json`);
for (const project of ["desktop", "mobile-360", "mobile-390"]) {
  copyFileSync(find(`${input}/full-results`, "photo-disclosure.json").find(path => path.includes(`-${project}`)), `${output}/photo-disclosure-after-${project}.json`);
}
const images = [];
for (const dir of ["reference", "screenshots"]) for (const name of readdirSync(`${output}/${dir}`)) {
  const path = `${dir}/${name}`;
  images.push({ path, sha256: hash(`${output}/${path}`) });
}
save("screenshots.json", { reference: "A2.2 Final Polish · copied unchanged from the approved design worktree", screenshots: images });
const focused = read(`${input}/focused.json`);
save("quality-gates.json", { buildId: frozen.buildId, typecheck: { command: "npm run typecheck", logSha256: hash(`${input}/typecheck-final.log`) }, lint: { command: "npm run lint", logSha256: hash(`${input}/lint-final.log`) }, build: { command: "npm run build", logSha256: hash(`${input}/build.log`) }, focused: { stats: focused.stats, command: "UI1_REVIEW_CAPTURE=1 npx playwright test tests/ui1-review-followup.spec.ts" } });
console.log(JSON.stringify({ full: run.stats, protectedFiles: protectedFiles.length, unchangedPriorLogs: logs.length, frozenFiles: frozen.files.length, images: images.length }));
