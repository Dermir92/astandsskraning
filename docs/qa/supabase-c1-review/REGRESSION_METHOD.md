# Complete regression coverage and execution method

The standard demo suite contains 951 executions across desktop, mobile-360 and
mobile-390. The accepted outcome is 927 passing executions and the existing 24
intentional skips. C1's explicit local-service suite is separate.

The image/visual/accessibility matrix named `five-width visual, accessibility and
200 percent text verification` runs five complete scenarios, multiple image
uploads, screenshots and axe scans inside one test. One concurrent attempt hit
its existing 180-second limit while an axe scan was running. Its assertions,
viewport matrix, screenshot steps and timeout are retained. Running that matrix
separately with one worker avoids overlap with other browser work; it is not
disabled, shortened or replaced by a screenshot-only check.

The complete final verification uses these non-overlapping partitions from the
same source snapshot and the ordinary `playwright.config.ts`:

```text
npx playwright test --grep-invert "five-width visual, accessibility and 200 percent text verification" --reporter=list,json --output=artifacts/c1-review-revisions/regression-standard-output
npx playwright test --grep "five-width visual, accessibility and 200 percent text verification" --workers=1 --reporter=list,json --output=artifacts/c1-review-revisions/regression-visual-output
```

Set `PLAYWRIGHT_JSON_OUTPUT_FILE` to different ignored JSON destinations before
each command. Execute them sequentially. Expected partition coverage is 948
executions (926 pass, 22 skip) and 3 executions (1 pass, 2 skip); the two mobile
matrix skips already belong to the existing intentional skips.

A fresh `npx playwright test --list --reporter=json` inventory provides the full
951 execution identities. The coverage verifier compares complete suite paths,
test titles and project names, rejects overlaps/unexpected/missing cases, and
checks every final result and global error. The generated union is explicitly
identified as a derived aggregate, not a single Playwright invocation. The two
original reports and their SHA-256 hashes remain the primary execution evidence.
Only after the inventory and successful results match can the union establish a
passing complete regression result.

This method does not allow a previously passing case to substitute for a missing
final case, convert a failure to a skip, use automatic retries, relax assertions
or timeouts, or omit the resource-intensive matrix. Earlier incomplete/failed
attempts are recorded separately and never relabeled as passing.

Test readiness changes wait for the actual hydrated state, destination and
control. Native file choosers keep the original synthetic bytes and attachment
counts. Every original data, focus, accessibility and preservation assertion
remains. These changes do not establish real human usability or physical-device
behavior; see the main correction report and current validation record.
