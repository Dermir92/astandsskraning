import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { DEMO_LOCK_NAME, DEMO_RECOVERY_KEY, STORAGE_KEY } from "../src/lib/demo-storage";
import { legacyCoreReport } from "./inspection-core-fixtures";
import type { Report } from "../src/lib/model";
import { linkedInitialFixture } from "./inspection-comparison-fixtures";
import { meterReport, meterSet } from "./meter-readings-fixtures";
import { is } from "../src/lib/locale/is";
import { expandAssessment } from "./inspection-ui-helpers";

for (const readFailure of [false, true]) {
  test(`F1 ${readFailure ? "unreadable" : "malformed"} canonical data gives no editing controls or canonical writes`, async ({ page, context }) => {
    const initial = readFailure ? JSON.stringify({ version: 1, reports: [legacyCoreReport()] }) : "{synthetic-unreadable-document";
    await context.addInitScript(({ key, initial, readFailure }) => {
      if (!sessionStorage.getItem("ux3-f1-seeded")) {
        localStorage.setItem(key, initial); localStorage.setItem("ux3-f1-unrelated", "preserve"); sessionStorage.setItem("ux3-f1-seeded", "1");
      }
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      const control = window as unknown as { f1Writes: number; f1Raw: () => string | null };
      control.f1Writes = 0; control.f1Raw = () => get.call(localStorage, key);
      Storage.prototype.getItem = function (name) {
        if (this === localStorage && name === key && readFailure) throw new DOMException("Synthetic read denial", "SecurityError");
        return get.call(this, name);
      };
      Storage.prototype.setItem = function (name, value) { if (this === localStorage && name === key) control.f1Writes++; set.call(this, name, value); };
    }, { key: STORAGE_KEY, initial, readFailure });
    await page.goto("/skyrslur/syni-ibud/upplysingar");
    await expect(status(page)).toHaveText("Staðbundin gögn læst til verndar");
    await expect(page.locator("#address")).toHaveValue("Sýnigata 14"); await expect(page.locator("#address")).toBeDisabled();
    await expect(page.locator("#inspectionContext")).toBeDisabled(); await expect(page.getByRole("radio").first()).toBeDisabled();
    expect(await page.evaluate(() => (window as unknown as { f1Writes: number }).f1Writes)).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { f1Raw: () => string | null }).f1Raw())).toBe(initial);
    await page.getByRole("button", { name: "Velja rými", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Heiti rýmis 1", exact: true })).toBeDisabled();
    await expect(page.locator("#custom-room")).toHaveAttribute("readonly", "");
    await expect(page.getByRole("button", { name: "Fjarlægja Stofa", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Bæta við", exact: true })).toBeDisabled();
    expect(await page.evaluate(() => (window as unknown as { f1Writes: number }).f1Writes)).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { f1Raw: () => string | null }).f1Raw())).toBe(initial);
    await page.goto("/skyrslur/syni-ibud/skraning?rymi=demo-living&atridi=walls");
    const item = page.locator('.checklist-item[data-item="walls"]');
    await expect(item.getByRole("textbox", { name: /^Athugasemd/ })).toBeDisabled(); await expandAssessment(item);
    for (const answer of await item.getByRole("radio").all()) await expect(answer).toBeDisabled();
    await expect(item.getByRole("button", { name: "Breyta fráviki", exact: true })).toBeDisabled();
    await expect(item.getByRole("button", { name: "Hreinsa svör", exact: true })).toBeDisabled();
    await expect(item.locator('input[type="file"]')).toBeDisabled(); await expect(item.locator(".checklist-toggle")).toBeEnabled();
    expect(await page.evaluate(() => (window as unknown as { f1Raw: () => string | null }).f1Raw())).toBe(initial);
    expect(await page.evaluate(() => (window as unknown as { f1Writes: number }).f1Writes)).toBe(0);
    await page.goto("/skyrslur/ny"); await expect(page.getByRole("button", { name: "Velja íbúð", exact: true })).toBeDisabled();
    expect(await page.evaluate(() => (window as unknown as { f1Writes: number }).f1Writes)).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { f1Raw: () => string | null }).f1Raw())).toBe(initial);
    await page.reload(); await expect(status(page)).toHaveText("Staðbundin gögn læst til verndar");
    expect(await page.evaluate(() => (window as unknown as { f1Raw: () => string | null }).f1Raw())).toBe(initial);
    expect(await page.evaluate(() => (window as unknown as { f1Writes: number }).f1Writes)).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem("ux3-f1-unrelated"))).toBe("preserve");
  });
}

const report = () => legacyCoreReport();
const details = (id = "core-legacy") => `/skyrslur/${id}/upplysingar`;
const status = (page: Page) => page.locator(".topbar .save-status");
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
const checkpoint = (page: Page) => page.evaluate(key => sessionStorage.getItem(key), DEMO_RECOVERY_KEY);
async function seed(context: BrowserContext, reports = [report()]) {
  await context.addInitScript(({ key, reports }) => {
    if (!localStorage.getItem("ux3-synthetic-seeded")) {
      localStorage.setItem(key, JSON.stringify({ version: 1, extension: { sentinel: [false, 0, null] }, reports }));
      localStorage.setItem("ux3-synthetic-seeded", "1");
    }
  }, { key: STORAGE_KEY, reports });
}
async function openWriter(page: Page) { await page.goto(details()); await expect(page.locator("#address")).toBeEnabled(); }
async function failWrites(page: Page, recoveryToo = false) {
  await page.evaluate(({ key, recoveryKey, recoveryToo }) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if ((this === localStorage && name === key) || (recoveryToo && this === sessionStorage && name === recoveryKey)) throw new DOMException("Synthetic quota", "QuotaExceededError");
      original.call(this, name, value);
    };
  }, { key: STORAGE_KEY, recoveryKey: DEMO_RECOVERY_KEY, recoveryToo });
}
async function confirm(page: Page) { await page.getByRole("checkbox", { name: /Ég hef varðveitt afrit/ }).check(); }
async function cycleOwnership(page: Page) {
  const held = () => page.evaluate(async name => (await navigator.locks.query()).held?.filter(lock => lock.name === name).length ?? 0, DEMO_LOCK_NAME);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await expect.poll(held).toBe(0);
  await page.evaluate(async () => {
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  });
  await expect.poll(held).toBe(1);
  await expect(status(page)).toHaveText("Vistað í þessum vafra");
}

test("T01/T02 actual Web Locks: stale same-report reader cannot write; handoff preserves both fields", async ({ page, context }) => {
  await seed(context); await openWriter(page);
  const other = await context.newPage(); await other.goto(details()); await expect(other.locator("#address")).toBeDisabled();
  await other.goto("/skyrslur/core-legacy/skraning?rymi=legacy-room&atridi=walls");
  const observation = other.locator('.checklist-item[data-item="walls"]');
  await expect(observation.getByRole("textbox", { name: /^Athugasemd/ })).toBeDisabled();
  await expandAssessment(observation);
  await expect(observation.getByRole("radio", { name: "Í lagi", exact: true })).toBeDisabled();
  await expect(observation.getByRole("button", { name: "Hreinsa svör", exact: true })).toBeDisabled();
  await other.goto(details()); await expect(other.locator("#address")).toBeDisabled();
  await page.locator("#address").fill("Sýnigata A 17"); await expect(status(page)).toHaveText("Vistað í þessum vafra");
  await expect(status(other)).toHaveText("Geymd gögn hafa breyst");
  expect(JSON.parse((await raw(other))!).reports[0].details.address).toBe("Sýnigata A 17");
  await page.close(); await other.getByRole("button", { name: "Reyna breytingarétt aftur" }).click();
  await expect(other.locator("#address")).toBeEnabled(); await expect(other.locator("#address")).toHaveValue("Sýnigata A 17");
  await other.locator("#municipality").fill("Sýnisveitarfélag B");
  expect(JSON.parse((await raw(other))!).reports[0].details).toMatchObject({ address: "Sýnigata A 17", municipality: "Sýnisveitarfélag B" });
  await other.reload(); await expect(other.locator("#address")).toHaveValue("Sýnigata A 17"); await expect(other.locator("#municipality")).toHaveValue("Sýnisveitarfélag B");
});

test("T03/T05 actual collection lock also protects different reports and stale creation", async ({ page, context }) => {
  const first = report(), second = { ...report(), id: "other-report" }; await seed(context, [first, second]); await openWriter(page);
  const other = await context.newPage(); await other.goto(details(second.id)); await expect(other.locator("#address")).toBeDisabled();
  await page.locator("#address").fill("Fyrsta skýrsla A");
  await other.goto("/skyrslur/ny"); await expect(other.getByRole("button", { name: "Velja íbúð", exact: true })).toBeDisabled();
  const saved = await raw(other); await page.close(); await other.getByRole("button", { name: "Reyna breytingarétt aftur" }).click();
  await expect(other.getByRole("button", { name: "Velja íbúð", exact: true })).toBeEnabled();
  expect(await raw(other)).toBe(saved); await other.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  await expect(other).toHaveURL(/\/upplysingar$/); const data = JSON.parse((await raw(other))!);
  expect(data.reports).toHaveLength(3); expect(data.reports.find((r: Report) => r.id === first.id).details.address).toBe("Fyrsta skýrsla A");
  expect(data.reports.find((r: Report) => r.id === second.id)).toEqual(second);
});

test("T04 real lock barrier: simultaneous attempts never create two editing tabs", async ({ page, context }) => {
  await seed(context);
  await context.addInitScript(lockName => {
    if (localStorage.getItem("ux3-lock-barrier")) return;
    localStorage.setItem("ux3-lock-barrier", "1");
    const control = window as unknown as { ux3Held: Promise<void>; ux3Done: Promise<unknown>; ux3Release: () => void };
    let held!: () => void;
    control.ux3Held = new Promise(resolve => { held = resolve; });
    control.ux3Done = navigator.locks.request(lockName, () => new Promise<void>(resolve => { control.ux3Release = resolve; held(); }));
  }, DEMO_LOCK_NAME);
  await page.goto(details()); await page.evaluate(() => (window as unknown as { ux3Held: Promise<void> }).ux3Held);
  const other = await context.newPage(); await other.goto(details());
  await expect(page.locator("#address")).toBeDisabled(); await expect(other.locator("#address")).toBeDisabled();
  await page.evaluate(async () => { const control = window as unknown as { ux3Release: () => void; ux3Done: Promise<unknown> }; control.ux3Release(); await control.ux3Done; });
  await Promise.all([page.getByRole("button", { name: "Reyna breytingarétt aftur" }).click(), other.getByRole("button", { name: "Reyna breytingarétt aftur" }).click()]);
  await expect.poll(async () => Number(await page.locator("#address").isEnabled()) + Number(await other.locator("#address").isEnabled())).toBe(1);
  const winner = await page.locator("#address").isEnabled() ? page : other;
  const loser = winner === page ? other : page;
  await winner.locator("#address").fill("Einn skrifari"); await expect(loser.locator("#address")).toBeDisabled();
  expect(JSON.parse((await raw(loser))!).reports[0].details.address).toBe("Einn skrifari");
});

test("T07/T10 reload recovers failed input without replay; deliberate resume saves the same candidate", async ({ page, context }, testInfo) => {
  await seed(context); await openWriter(page); const before = await raw(page);
  await failWrites(page); await page.locator("#address").fill("Óvistað til endurheimtar");
  await expect(status(page)).toHaveText("Ekki tókst að vista í vafra"); expect(await raw(page)).toBe(before); expect(await checkpoint(page)).toContain("Óvistað til endurheimtar");
  const downloadEvent = page.waitForEvent("download"); await page.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true }).click();
  const download = await downloadEvent; const exported = testInfo.outputPath("demo-recovery.json"); await download.saveAs(exported);
  const recovery = JSON.parse(await readFile(exported, "utf8")); expect(JSON.parse(recovery.candidateRaw).reports[0].details.address).toBe("Óvistað til endurheimtar"); expect(recovery).not.toHaveProperty("photos");
  await page.reload(); await expect(status(page)).toHaveText("Óvistað endurheimtardrag"); await expect(page.locator("#address")).toHaveValue("Óvistað til endurheimtar");
  await expect(page.locator("#address")).toBeDisabled(); expect(await raw(page)).toBe(before);
  await confirm(page); await page.getByRole("button", { name: "Halda áfram með endurheimtardrag" }).click();
  await expect(status(page)).toHaveText("Vistað í þessum vafra"); await expect(page.locator("#address")).toBeEnabled();
  expect(JSON.parse((await raw(page))!).reports[0].details.address).toBe("Óvistað til endurheimtar"); expect(await checkpoint(page)).toBeNull();
});

test("F2 stale checkpoint A after successful B remains recoverable without replacing B on reload", async ({ page, context }, testInfo) => {
  await seed(context); await openWriter(page); const s0 = await raw(page);
  await page.evaluate(({ key, recoveryKey }) => {
    const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
    let failNextCanonical = true;
    const control = window as unknown as { f2CanonicalWrites: number }; control.f2CanonicalWrites = 0;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) {
        if (failNextCanonical) { failNextCanonical = false; throw new DOMException("Synthetic first write failure", "QuotaExceededError"); }
        set.call(this, name, value); control.f2CanonicalWrites++; return;
      }
      set.call(this, name, value);
    };
    Storage.prototype.removeItem = function (name) {
      if (this === sessionStorage && name === recoveryKey) throw new DOMException("Synthetic cleanup failure", "SecurityError");
      remove.call(this, name);
    };
  }, { key: STORAGE_KEY, recoveryKey: DEMO_RECOVERY_KEY });
  await page.locator("#address").fill("Candidate A óvistað"); await expect(status(page)).toHaveText("Ekki tókst að vista í vafra");
  expect(await raw(page)).toBe(s0); const checkpointA = await checkpoint(page);
  expect(JSON.parse(checkpointA!).baseRaw).toBe(s0);
  await page.locator("#address").fill("Candidate B vistað"); await expect(status(page)).toHaveText("Vistað í þessum vafra");
  const canonicalB = await raw(page); expect(JSON.parse(canonicalB!).reports[0].details.address).toBe("Candidate B vistað");
  expect(await checkpoint(page)).toBe(checkpointA);
  expect(await page.evaluate(() => (window as unknown as { f2CanonicalWrites: number }).f2CanonicalWrites)).toBe(1);

  await page.reload(); await expect(status(page)).toHaveText("Óvistað endurheimtardrag");
  await expect(page.locator("#address")).toHaveValue("Candidate A óvistað"); await expect(page.locator("#address")).toBeDisabled();
  await expect(page.locator(".storage-warning")).toContainText("Endurheimtarafrit getur verið eldra en nýjasta heppnaða vistun");
  expect(await raw(page)).toBe(canonicalB); expect(await checkpoint(page)).toBe(checkpointA);
  await page.evaluate(key => {
    const set = Storage.prototype.setItem, control = window as unknown as { f2CanonicalWrites: number }; control.f2CanonicalWrites = 0;
    Storage.prototype.setItem = function (name, value) { if (this === localStorage && name === key) control.f2CanonicalWrites++; set.call(this, name, value); };
  }, STORAGE_KEY);
  const downloadEvent = page.waitForEvent("download"); await page.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true }).click();
  const exportedPath = testInfo.outputPath("stale-checkpoint-a.json"); await (await downloadEvent).saveAs(exportedPath);
  const exported = JSON.parse(await readFile(exportedPath, "utf8"));
  expect(exported.candidateRaw).toBe(JSON.parse(checkpointA!).candidateRaw); expect(exported.baseRaw).toBe(s0);
  await confirm(page); await page.getByRole("button", { name: "Halda áfram með endurheimtardrag", exact: true }).click();
  await expect(page.getByText("Ekki var hægt að halda áfram með dragið.", { exact: false })).toBeVisible();
  expect(await raw(page)).toBe(canonicalB); expect(await checkpoint(page)).toBe(checkpointA);
  await confirm(page); await page.getByRole("button", { name: "Sækja nýjustu vistuðu gögn", exact: true }).click();
  await expect(page.locator("#address")).toHaveValue("Candidate B vistað"); await expect(page.locator("#address")).toBeDisabled();
  expect(await checkpoint(page)).toBe(checkpointA);
  await confirm(page); await page.getByRole("button", { name: "Vinna með nýjustu drög", exact: true }).click();
  await expect(page.locator("#address")).toBeEnabled(); await expect(status(page)).toHaveText("Vistað í þessum vafra");
  expect(await checkpoint(page)).toBeNull(); expect(await raw(page)).toBe(canonicalB);
  expect(await page.evaluate(() => (window as unknown as { f2CanonicalWrites: number }).f2CanonicalWrites)).toBe(0);
});

test("T08/T24/T25 legacy change is detected; viewing latest never disposes the unresolved candidate", async ({ page, context }) => {
  await seed(context); await openWriter(page); await failWrites(page);
  await page.locator("#address").fill("Mitt óvistaða drag"); await expect(status(page)).toHaveText("Ekki tókst að vista í vafra");
  const other = await context.newPage(); await other.goto(details()); await expect(other.locator("#address")).toBeDisabled();
  const newer = { ...report(), details: { ...report().details, address: "Nýtt canonical heimilisfang" } };
  await other.evaluate(({ key, newer }) => localStorage.setItem(key, JSON.stringify({ version: 1, reports: [newer] })), { key: STORAGE_KEY, newer });
  await expect(status(page)).toHaveText("Árekstur við vistun"); await expect(page.locator("#address")).toHaveValue("Mitt óvistaða drag");
  const canonical = await raw(other), retained = await checkpoint(page);
  await page.reload(); await expect(status(page)).toHaveText("Óvistað endurheimtardrag");
  await confirm(page); await page.getByRole("button", { name: "Halda áfram með endurheimtardrag" }).click();
  await expect(page.getByText("Ekki var hægt að halda áfram með dragið.", { exact: false })).toBeVisible(); expect(await raw(page)).toBe(canonical);
  await confirm(page); await page.getByRole("button", { name: "Sækja nýjustu vistuðu gögn" }).click();
  await expect(page.locator("#address")).toHaveValue("Nýtt canonical heimilisfang"); await expect(page.locator("#address")).toBeDisabled();
  expect(await checkpoint(page)).toBe(retained); await expect(status(page)).toHaveText("Óvistað endurheimtardrag");
  await confirm(page); await page.getByRole("button", { name: "Vinna með nýjustu drög" }).click();
  await expect(page.locator("#address")).toBeEnabled(); expect(await checkpoint(page)).toBeNull(); expect(await raw(page)).toBe(canonical);
});

test("T12 failed session checkpoint gives an explicit memory-only warning and exports the newest input", async ({ page, context }) => {
  await seed(context); await openWriter(page); const before = await raw(page); await failWrites(page, true);
  await page.locator("#address").fill("Aðeins í minni");
  await expect(page.locator(".storage-warning")).toContainText("Afrit er aðeins í minni"); expect(await checkpoint(page)).toBeNull(); expect(await raw(page)).toBe(before);
  await expect(page.getByRole("button", { name: "Sækja nýjustu vistuðu gögn" })).toBeDisabled();
  await page.locator("#address").fill("Nýrri texti í minni"); await expect(page.locator("#address")).toHaveValue("Nýrri texti í minni");
  await expect(status(page)).not.toHaveText("Vistað í þessum vafra");
});

test("T13 browser without Web Locks stays read-only and performs no fallback save", async ({ page, context }) => {
  await seed(context); await context.addInitScript(() => { Object.defineProperty(navigator, "locks", { configurable: true, get: () => undefined }); });
  await page.goto(details()); await expect(status(page)).toHaveText("Leshamur · örugg vistun óstudd"); await expect(page.locator("#address")).toBeDisabled();
  const before = await raw(page); await page.getByRole("button", { name: "Reyna breytingarétt aftur" }).click();
  await expect(page.locator("#address")).toBeDisabled(); await page.goto("/skyrslur/ny");
  await expect(page.getByRole("button", { name: "Velja íbúð", exact: true })).toBeDisabled(); expect(await raw(page)).toBe(before);
});

test("T21 conflict keeps unsubmitted room text across responsive layouts and blocks replacement", async ({ page, context }, testInfo) => {
  await seed(context); await openWriter(page); await page.goto("/skyrslur/core-legacy/rymi");
  await page.locator("#custom-room").fill("Óstofnað sýnirými");
  const other = await context.newPage(); await other.goto(details()); await expect(other.locator("#address")).toBeDisabled();
  await other.evaluate(key => { const saved = JSON.parse(localStorage.getItem(key)!); saved.reports[0].title = "Nýrri titill"; localStorage.setItem(key, JSON.stringify(saved)); }, STORAGE_KEY);
  await expect(status(page)).toHaveText("Geymd gögn hafa breyst");
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 }); await expect(page.locator("#custom-room")).toHaveValue("Óstofnað sýnirými");
    await expect(page.getByRole("button", { name: "Sækja nýjustu vistuðu gögn" })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`readonly-unsent-${width}.png`), fullPage: true });
  }
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze(); expect(audit.violations).toEqual([]);
  await page.getByRole("button", { name: "Hætta við óstofnað rýmisheiti" }).click(); await expect(page.locator("#custom-room")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Sækja nýjustu vistuðu gögn" })).toBeEnabled();
});

test("T17 pending linked-final confirmation expires across a real lock release and reacquisition", async ({ page, context }) => {
  const source = linkedInitialFixture(); await seed(context, [source]); await page.goto(`/skyrslur/${source.id}/yfirferd`);
  await page.getByRole("button", { name: "Hefja lokaskoðun", exact: true }).click();
  const create = page.getByRole("button", { name: "Stofna tengda lokaskoðun", exact: true }); await expect(create).toBeEnabled();
  const before = await raw(page); await cycleOwnership(page);
  await expect(create).toBeDisabled(); await expect(page.getByText("Breytingaréttur hefur breyst. Hættu við og yfirfarðu stofnunina aftur.", { exact: true })).toBeVisible();
  expect(await raw(page)).toBe(before);
  await page.getByRole("button", { name: "Hætta við", exact: true }).click(); await page.getByRole("button", { name: "Hefja lokaskoðun", exact: true }).click();
  await expect(create).toBeEnabled(); await create.click(); await expect(page).toHaveURL(/\/upplysingar$/);
  expect(JSON.parse((await raw(page))!).reports).toHaveLength(2);
});

test("T06/T20 pending room deletion expires without clearing the confirmation or deleting data", async ({ page, context }) => {
  await seed(context); await openWriter(page); await page.goto("/skyrslur/core-legacy/rymi");
  await page.getByRole("button", { name: "Fjarlægja Stofa", exact: true }).click();
  const remove = page.getByRole("button", { name: "Fjarlægja rými", exact: true }); await expect(remove).toBeEnabled();
  const before = await raw(page); await cycleOwnership(page);
  await expect(remove).toBeDisabled(); await expect(page.getByText("Breytingaréttur hefur breyst. Hættu við og veldu rýmið aftur til að yfirfara eyðinguna.", { exact: true })).toBeVisible();
  expect(await raw(page)).toBe(before);
  await page.getByRole("button", { name: "Hætta við", exact: true }).click(); await page.getByRole("button", { name: "Fjarlægja Stofa", exact: true }).click();
  await expect(remove).toBeEnabled(); await remove.click(); expect(JSON.parse((await raw(page))!).reports[0].rooms).toEqual([]);
});

test("T19/T20 pending meter-purpose confirmation requires renewed review after reacquisition", async ({ page, context }) => {
  const source = meterReport(meterSet()); Object.assign(source.details, { inspectionContext: "residential_rental", inspectionType: "initial" });
  await seed(context, [source]); await page.goto(`/skyrslur/${source.id}/skraning`); await expect(status(page)).toHaveText("Vistað í þessum vafra");
  const panel = page.locator("#meter-readings"); await panel.locator(":scope > summary").click();
  const purpose = panel.locator("summary").filter({ hasText: new RegExp(`^${is.meters.changePurpose}$`) }); await purpose.click();
  await panel.getByRole("button", { name: is.meters.startInitial, exact: true }).last().click();
  const apply = panel.getByRole("button", { name: is.meters.correctPurpose, exact: true }).last(); await expect(apply).toBeEnabled();
  const before = await raw(page); await cycleOwnership(page);
  await expect(apply).toBeDisabled(); await expect(panel.getByText(is.meters.stale, { exact: true })).toBeVisible(); expect(await raw(page)).toBe(before);
  await panel.getByRole("button", { name: is.meters.refresh, exact: true }).click(); await expect(apply).toBeEnabled(); await apply.click();
  expect(JSON.parse((await raw(page))!).reports[0].details.meterReadings).toMatchObject({ mode: "rental_initial", factsPurpose: "rental_initial" });
});
