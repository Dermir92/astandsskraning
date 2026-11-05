# UX4-D2: Demo photo persistence

Base: approved main `7e05f04097014d4702a55c38978af656e8e95c7c` (PR #28).
Branch: `codex/ux4-d2-demo-photo-persistence`.

## Storage boundary

Demo photos previously existed only as object URLs in memory. IndexedDB is suitable for the original image blobs; adding base64 images to the existing report JSON would consume localStorage quota and couple photo failures to report/recovery writes.

The new, Demo-only `astandsskraning-demo-photos-v1` database has one `photos` object store. Each record contains a version, unique ID, original filename/blob, insertion order and explicit `{ reportId, roomId, itemId }` association; `itemId: null` identifies a room overview. Existing UI keys and eight-photo/10 MB/JPG/PNG/WebP limits remain. Colon collisions in legacy concatenated keys are rejected instead of choosing an arbitrary owner. No image conversion, compression, cloud storage or new dependency is introduced.

Existing report JSON, unknown fields, timestamps, Web Locks, canonical comparison and session recovery remain in their current stores. Adding the first photo to untouched, in-memory Demo fixtures first saves their report document using the existing guarded persistence path. A failed report save cannot create an unanchored photo. Photos are excluded from the report recovery JSON, which now explicitly says so.

## Safety and deletion

- Only the existing collection writer can mutate photos. Each queued operation captures its ownership epoch and checks the exact current report document and target inside the IndexedDB transaction, both before and after the individual request. Pagehide, ownership loss, canonical conflicts and explicit report refresh abort an active transaction. A decoded file from an old ownership epoch cannot be added after takeover.
- Mutations are serialized in a tab. The database transaction enforces the live limit; `add()` rejects duplicate IDs rather than overwriting. A write/delete is acknowledged only at transaction completion, with strict durability requested. Object URLs are reconstructed from committed blobs on hydration; they are never persisted.
- Confirmed photo deletion changes the database first. Failure retains the photo and its bytes, shows a global warning, and places keyboard focus on the photo recovery action. Reads, unsupported records/schema, blocked/unavailable storage, quota failures and transaction aborts never clear or replace the database. Existing thumbnails remain on read failure. Explicit **Sækja myndir aftur** reloads committed state; failed additions require selecting the original again, and failed deletions require renewed confirmation.
- JSON and IndexedDB cannot commit atomically together. Removing a report/room/item with attached evidence is therefore rejected until its photos have been explicitly removed. Structural removal is also blocked while photos are unreadable/loading or mutations are pending. There is no automatic garbage collection. Missing or ambiguous associations retain the original records/IDs and show a global warning; restoring their report structure can make them available again.
- BroadcastChannel tells other open Demo tabs when photos change. Their current view remains a snapshot with a visible refresh warning. Read-only tabs may fetch the latest photos but cannot edit them; ownership takeover reads photos again. Web Locks and transaction checks remain the authority if BroadcastChannel is unavailable.
- A committed transaction is still reported as saved if thumbnail URL creation fails; the UI requests a photo reload instead of telling the user to create a duplicate.

## Disclosure and limits

Capture, enlargement and Demo help disclose that images are stored only in this browser on this device, without backup, sync or server upload. Browser data clearing, eviction and private browsing can remove local data; originals must be retained. IndexedDB persistence is scoped to the same browser profile and origin, including scheme/host/port. It cannot guarantee recovery after browser/device storage loss. See [browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) and [transaction completion](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event).

Pre-feature object URLs have no durable bytes to migrate after their original tab has closed/reloaded. Their original files must be selected again. This change adds no import, backup or orphan-recovery interface and never automatically reassociates orphan evidence.

C1/Supabase, PDF generation, report validation and unrelated UX are unchanged. Existing worktrees and PR #19 are preserved. No merge or deployment is authorized by this implementation.

## Verification

All fixtures and image uploads are synthetic. Tests use an isolated production server on port 3106.

```powershell
npm ci
npm run build
npm run typecheck
npm run lint
git diff --check
$env:UX4_PRODUCTION_TEST='1'
npx playwright test --config playwright.photos.config.ts tests/demo-photo-persistence.spec.ts --reporter=list
```

Focused coverage includes an actual Chromium process restart with one persistent profile, byte hashes and stable IDs/associations, overview/defect separation, reload and confirmed/cancelled deletion, quota/read/open failures, unsupported records, duplicate IDs, ambiguous keys, orphan retention, post-commit rendering failure, two-tab reader/writer handoff, stale decode, abort between request success and commit, external canonical conflict, failed text-save recovery, keyboard focus, axe and narrow reflow.

Relevant regression covers Demo concurrency contracts/browser scenarios, local report data safety, photo validation and eight/ninth limits, concurrent decoding, room rename/delete, assessment preservation, keyboard galleries, UI1 review focus and Stofa/BUG-01. Four old assertions were updated to open PR #28's collapsed notes and check its two camera/gallery inputs; no protection assertion was removed. Obsolete temporary-photo/reload expectations were updated to require persistence. The existing five-width photo accessibility/text-scaling check passed. The optional screenshot-only test remains skipped.

Final cumulative result: **141 distinct passing cases, three intentional skips**, with no unresolved failures. The 17 new cases across three projects contribute 49 passes and two skips (the one actual process-restart test runs only on desktop). Relevant existing regressions contribute 92 passes and one optional screenshot-only skip. Initial failures were obsolete control selectors; the corrected controls were rechecked at all three widths. The new read-denial test also needed its mobile navigation to open the existing property-navigation disclosure; its final three-width recheck passed. These were test navigation/expectation corrections, with no corresponding product changes.

Production build, typecheck, lint and `git diff --check` passed. Verification commands for the additional regression and final matrix were:

```powershell
npx playwright test --config playwright.photos.config.ts tests/demo-photo-persistence.spec.ts tests/demo-concurrency-contract.spec.ts tests/demo-concurrency.spec.ts tests/inspection-evidence.spec.ts tests/ux4-d1-stofa.spec.ts tests/ui1-review-followup.spec.ts tests/local-data-safety.spec.ts --project desktop --reporter=list
npx playwright test --config playwright.photos.config.ts tests/demo-photo-persistence.spec.ts tests/demo-concurrency.spec.ts tests/inspection-evidence.spec.ts --grep 'demo-photo-persistence|F1 |T01/T02|protected source' --reporter=list
npx playwright test --config playwright.photos.config.ts tests/demo-photo-persistence.spec.ts --grep 'read denial preserves' --reporter=list
```

No full unrelated regression, hosted/C1 integration or PDF suite was run. Chromium mobile viewports do not establish Safari/iPhone camera or private-mode behavior; physical device and power-loss testing remain outside this automated evidence.
