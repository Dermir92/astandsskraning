import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { fireCorrectionHref, fireFieldId, FIRE_ROW_FIELDS } from "../src/lib/fire-navigation";
import type { FireField, FireGroupId } from "../src/lib/fire-observations";
import { fireState } from "../src/lib/fire-observations";
import { type Report } from "../src/lib/model";
import { detector, extendedFireDocument, fireReport, mixedFire } from "./fire-observations-fixtures";

const base = "/skyrslur/fire-case";
const raw = (page: Page) => page.evaluate(k => localStorage.getItem(k), STORAGE_KEY);
const saved = async (page: Page): Promise<Report> => JSON.parse((await raw(page))!).reports[0];
async function seed(page: Page, report = fireReport(), destination = `${base}/skraning`) {
  const document = JSON.stringify({ version: 1, envelopeExtra: { keep: [false, 0] }, reports: [report] }, null, 2);
  await page.addInitScript(({ document, key }) => {
    if (!sessionStorage.getItem("fire-seeded")) { localStorage.setItem(key, document); sessionStorage.setItem("fire-seeded", "yes"); }
  }, { document, key: STORAGE_KEY });
  await page.goto(destination); await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  return document;
}
async function open(page: Page, selector: string) {
  const disclosure = page.locator(selector);
  if (await disclosure.getAttribute("open") === null) await disclosure.locator(":scope > summary").click();
}
const group = (page: Page, key = "smokeDetectors") => page.locator(`[data-fire-group="${key}"]`);
async function choice(page: Page, fieldId: string, name: string) { await page.locator(`[id="${fieldId}"]`).getByRole("radio", { name, exact: true }).check(); }

test("radio corrections focus an existing non-first answer without changing it, or the first enabled unanswered option", async ({ page }) => {
  const report = fireReport(mixedFire());
  report.details.fireSafety!.escapeRoutes = {};
  const original = await seed(page, report, fireCorrectionHref(report.id, "smokeDetectors", "testResult", "failed"));
  const result = page.locator(`[id="${fireFieldId("smokeDetectors", "testResult", "failed")}"]`);
  const selected = result.getByRole("radio", { name: "Ekkert viðbragð sást eða heyrðist", exact: true });
  await expect(selected).toBeChecked();
  await expect(selected).toBeFocused();
  await expect(result.getByRole("radio").first()).not.toBeChecked();
  expect(await raw(page)).toBe(original);

  await page.evaluate(() => {
    // Exercise the enabled fallback before the correction's animation frame.
    const first = document.querySelector<HTMLInputElement>('[data-fire-group="escapeRoutes"] fieldset input[type="radio"]');
    if (first) first.disabled = true;
  });
  await page.evaluate(url => window.history.pushState(null, "", url), fireCorrectionHref(report.id, "escapeRoutes"));
  const examination = page.locator(`[id="${fireFieldId("escapeRoutes", "examination")}"]`);
  await expect(examination.locator('input[type="radio"]:not(:disabled)').first()).toBeFocused();
  await expect(examination.getByRole("radio", { checked: true })).toHaveCount(0);
  expect(await raw(page)).toBe(original);
});

test("correction A reopens and focuses after an ordinary same-document entry, without refocusing on saves or retry", async ({ page }) => {
  const report = fireReport(mixedFire());
  const correctionA = fireCorrectionHref(report.id, "smokeDetectors", "testedScopeDescription", "failed");
  const original = await seed(page, report, correctionA);
  const target = page.getByLabel("Hvaða skynjari eða skynjarar voru prófaðir?", { exact: true });
  await expect(target).toBeFocused();
  await group(page).locator(":scope > summary").click();
  await page.locator("#fire-safety > summary").click();
  // Native history keeps the editor mounted, so its handled-query ref must reset.
  await page.evaluate(url => window.history.pushState(null, "", url), `${base}/skraning`);
  await expect(page).not.toHaveURL(/hluti=/);
  await expect(page.locator(".inspection-page")).not.toContainText("Aftur í yfirferð");
  await page.evaluate(url => window.history.pushState(null, "", url), correctionA);
  await expect(page.locator("#fire-safety")).toHaveAttribute("open", "");
  await expect(group(page)).toHaveAttribute("open", "");
  await expect(target).toBeFocused();
  expect(await raw(page)).toBe(original);

  const scope = page.getByLabel("Hvaða skynjari eða skynjarar voru prófaðir?", { exact: true });
  await scope.pressSequentially(" · sýni");
  await expect(scope).toBeFocused();
  const afterSave = await raw(page);
  expect(afterSave).not.toBe(original);
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    (window as unknown as { restoreFireWrites: () => void }).restoreFireWrites = () => { Storage.prototype.setItem = setItem; };
    Storage.prototype.setItem = function(key, value) { if (key === "astandsskraning-demo-v1") throw new Error("synthetic quota"); return setItem.call(this, key, value); };
  });
  await scope.pressSequentially(" · í minni");
  await expect(scope).toBeFocused();
  await expect(page.locator(".storage-warning")).toContainText("Breytingar eru aðeins í minni");
  expect(await raw(page)).toBe(afterSave);
  await page.evaluate(() => (window as unknown as { restoreFireWrites: () => void }).restoreFireWrites());
  const retry = page.getByRole("button", { name: "Reyna vistun aftur", exact: true });
  await retry.focus(); await page.keyboard.press("Enter");
  await expect.poll(() => raw(page)).not.toBe(afterSave);
  await expect(target).not.toBeFocused();
  await scope.pressSequentially(" · áfram");
  await expect(scope).toBeFocused();
  expect((await saved(page)).details.fireSafety!.smokeDetectors!.entries![1].basicTest!.result).toBe("no_response_observed");
});

test("opening legacy groups, placeholders and fire corrections preserves report and room-position bytes", async ({ page }) => {
  const report = fireReport();
  const url = fireCorrectionHref(report.id, "smokeDetectors");
  const original = await seed(page, report, url);
  await expect(page.locator("#fire-safety")).toHaveAttribute("open", "");
  const positionBefore = await page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith("astandsskraning-navigation-v1:")));
  await open(page, '[data-fire-group="extinguishers"]'); await open(page, '[data-fire-group="escapeRoutes"]');
  expect(await raw(page)).toBe(original);
  await page.reload(); await expect(page.locator("#fire-safety")).toHaveAttribute("open", "");
  expect(await raw(page)).toBe(original);
  expect(await page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith("astandsskraning-navigation-v1:")))).toEqual(positionBefore);
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page.locator("#review-fire-safety")).toBeFocused(); expect(await raw(page)).toBe(original);
  expect((await saved(page)).details).not.toHaveProperty("fireSafety");
});

test("capture distinguishes untested and failed devices; mixed concern survives collapsing and reload", async ({ page }) => {
  await seed(page); await open(page, "#fire-safety"); await open(page, '[data-fire-group="smokeDetectors"]');
  await choice(page, fireFieldId("smokeDetectors", "examination"), "Skoðað");
  await choice(page, fireFieldId("smokeDetectors", "presence"), "Reykskynjari sást");
  let row = group(page).locator("[data-fire-row]").first();
  await row.getByRole("radio", { name: "Enginn sýnilegur annmarki sást", exact: true }).check();
  await expect(row.getByRole("radio", { name: "Enginn sýnilegur annmarki sást", exact: true })).toBeFocused();
  await row.getByRole("radio", { name: "Nei, ekki prófað", exact: true }).check();
  const first = (await saved(page)).details.fireSafety!.smokeDetectors!.entries![0];
  expect(first).not.toHaveProperty("location"); expect(first).not.toHaveProperty("observedCount"); expect(first.basicTest).toEqual({ performance: "not_performed" });
  await group(page).getByRole("button", { name: "Bæta við staðsetningu", exact: true }).click();
  row = group(page).locator("[data-fire-row]").nth(1);
  await expect(row.getByRole("heading")).toBeFocused();
  await row.getByRole("radio", { name: "Enginn sýnilegur annmarki sást", exact: true }).check();
  await row.getByRole("radio", { name: "Já, prófun var gerð", exact: true }).check();
  await row.getByLabel("Hvaða skynjari eða skynjarar voru prófaðir?", { exact: true }).fill("Prófunarhnappur á sýniskynjara í forstofu");
  await row.getByRole("radio", { name: "Ekkert viðbragð sást eða heyrðist", exact: true }).check();
  await group(page).locator(":scope > summary").click();
  await expect(group(page).locator(":scope > summary")).toContainText("Ekkert viðbragð skráð við prófun");
  await page.locator("#fire-safety > summary").click();
  await expect(page.locator('#fire-safety > summary [data-fire-status="smokeDetectors"]')).toContainText("Ekkert viðbragð skráð við prófun");
  await page.reload(); await expect(page.locator('#fire-safety > summary [data-fire-status="smokeDetectors"]')).toContainText("Ekkert viðbragð skráð við prófun");
  await page.goto(`${base}/yfirferd`);
  const summary = page.locator("#review-fire-safety");
  await expect(summary.locator("[data-fire-overall-status]")).toHaveText("Ekkert viðbragð skráð við prófun");
  await expect(summary.getByText("Nei, ekki prófað", { exact: true })).toBeVisible();
  expect((await saved(page)).details.fireSafety!.smokeDetectors!.entries).toHaveLength(2);
});

test("optional missing counts, locations and equipment scope stay visible without action links or tasks", async ({ page }) => {
  const fire = mixedFire();
  fire.escapeRoutes = { examination: "not_examined" };
  fire.smokeDetectors!.entries = [{ ...detector("s"), location: undefined, observedCount: undefined }];
  fire.extinguishers!.entries![0].location = undefined; fire.extinguishers!.entries![0].observedCount = undefined;
  delete fire.smokeDetectors!.examinedDescription; delete fire.extinguishers!.examinedDescription;
  const report = fireReport(fire); const original = await seed(page, report, `${base}/yfirferd`);
  const panel = page.locator("#review-fire-safety");
  await expect(panel.locator('[data-fire-issues="missing"]')).toHaveCount(0);
  await expect(panel.locator('[data-fire-issues="limitations"]')).toContainText("Fjöldi óskráður");
  await expect(panel.locator('[data-fire-issues="limitations"] a')).toHaveCount(0);
  await expect(page.locator("[data-fire-actions]")).toHaveCount(0);
  expect(fireState((await saved(page)).details).actionCount).toBe(0); expect(await raw(page)).toBe(original);
});

test("inactive failure and service-label text remain editable and separate from current findings", async ({ page }) => {
  const report = fireReport(mixedFire());
  await seed(page, report, fireCorrectionHref(report.id, "smokeDetectors", "testPerformance", "failed"));
  await choice(page, fireFieldId("smokeDetectors", "testPerformance", "failed"), "Nei, ekki prófað");
  expect((await saved(page)).details.fireSafety!.smokeDetectors!.entries![1].basicTest!.result).toBe("no_response_observed");
  await page.goto(`${base}/yfirferd`);
  await expect(page.locator('[data-fire-review-group="smokeDetectors"] [data-fire-status]')).not.toContainText("Ekkert viðbragð");
  await expect(page.locator('[data-fire-issues="concerns"]')).not.toContainText("Ekkert viðbragð skráð við prófun");
  await page.goto(fireCorrectionHref(report.id, "smokeDetectors", "testResult", "failed"));
  await expect(page.locator(`[id="${fireFieldId("smokeDetectors", "testResult", "failed")}"]`).getByRole("radio", { checked: true })).toBeFocused();
  await page.goto(fireCorrectionHref(report.id, "smokeDetectors", "testPerformance", "failed"));
  await choice(page, fireFieldId("smokeDetectors", "testPerformance", "failed"), "Já, prófun var gerð");
  await expect(page.locator('#fire-safety > summary [data-fire-status="smokeDetectors"]')).toContainText("Ekkert viðbragð skráð við prófun");
  await page.goto(fireCorrectionHref(report.id, "extinguishers", "labelStatus", "ext-1"));
  await choice(page, fireFieldId("extinguishers", "labelStatus", "ext-1"), "Miði ekki skoðaður");
  await page.goto(fireCorrectionHref(report.id, "extinguishers", "labelText", "ext-1"));
  await expect(page.getByLabel("Texti eða dagsetning á miða", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Texti eða dagsetning á miða", { exact: true })).toHaveValue("Sýnigögn · 09/2025; næst 09/2026");
});

test("all not examined remains a visible limitation, with zero fire action tasks", async ({ page }) => {
  const report = fireReport({ smokeDetectors: { examination: "not_examined" }, extinguishers: { examination: "not_examined" }, escapeRoutes: { examination: "not_examined" } });
  await seed(page, report, `${base}/yfirferd`);
  await expect(page.locator("[data-fire-overall-status]")).toContainText("ekkert af þessum þremur sviðum skoðað");
  await expect(page.locator("[data-fire-actions]")).toHaveCount(0);
  await expect(page.locator('[data-fire-issues="limitations"] li')).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Brunavarnir · takmarkanir skoðunar", exact: true })).toBeVisible();
  await expect(page.getByText("Brunavarnir í lagi", { exact: true })).toHaveCount(0);
});

test("fire correction works with zero rooms and returns to a visible summary after reload", async ({ page }) => {
  const report = fireReport(); report.rooms = [];
  const original = await seed(page, report, fireCorrectionHref(report.id, "escapeRoutes"));
  await expect(page.getByRole("heading", { name: "Veldu fyrst rými", exact: true })).toBeVisible();
  await expect(page.locator(`[id="${fireFieldId("escapeRoutes", "examination")}"]`).getByRole("radio").first()).toBeFocused();
  await page.reload(); await expect(page.locator("#fire-safety")).toHaveAttribute("open", "");
  expect(await raw(page)).toBe(original);
  await choice(page, fireFieldId("escapeRoutes", "examination"), "Ekki skoðað");
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page.locator("#review-fire-safety")).toBeFocused();
  expect((await saved(page)).rooms).toEqual([]);
});

test("malformed, mixed and stale fire links neither mutate drafts nor remembered room positions", async ({ page }) => {
  const report = fireReport(mixedFire()); const original = await seed(page, report, fireCorrectionHref(report.id));
  for (const suffix of ["&rymi=missing", "&reitur=testResult", "&fra=https://example.com", "&unexpected=yes"]) {
    await page.goto(fireCorrectionHref(report.id) + suffix);
    await expect(page.locator("#fire-safety")).toBeFocused();
    await expect(page.getByText("Ógild leiðréttingartilvísun. Brunavarnir eru opnar.", { exact: true })).toBeVisible();
    expect(await raw(page)).toBe(original);
  }
  await page.goto(fireCorrectionHref(report.id, "smokeDetectors", "testResult", "missing"));
  await expect(page.getByText("Staðsetningin fannst ekki lengur. Viðeigandi flokkur er opinn.", { exact: true })).toBeVisible();
  expect(await raw(page)).toBe(original);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("astandsskraning-navigation-v1:")))).toEqual([]);
});

test("every group and row correction opens its ancestors after reload without writing data", async ({ page }) => {
  test.setTimeout(90_000);
  const report = fireReport(mixedFire()); const original = await seed(page, report, fireCorrectionHref(report.id));
  const cases: [FireGroupId, FireField, string?][] = [
    ...(["examination", "examinedDescription", "unexaminedDescription", "presence", "note"] as const).map(field => ["smokeDetectors", field] as [FireGroupId, FireField]),
    ...FIRE_ROW_FIELDS.filter(field => !field.startsWith("label")).map(field => ["smokeDetectors", field, "failed"] as [FireGroupId, FireField, string]),
    ["smokeDetectors", "note", "failed"], ["extinguishers", "labelStatus", "ext-1"], ["extinguishers", "labelText", "ext-1"],
    ...(["examination", "examinedDescription", "unexaminedDescription", "obstruction", "affectedLocation", "obstructionDescription", "note"] as const).map(field => ["escapeRoutes", field] as [FireGroupId, FireField]),
  ];
  for (const [groupId, field, rowId] of cases) {
    await page.goto(fireCorrectionHref(report.id, groupId, field, rowId));
    const element = page.locator(`[id="${fireFieldId(groupId, field, rowId)}"]`);
    // The local report is hydrated after navigation. Wait for the target before
    // deciding whether this field's focus target is a radio or its container.
    await expect(element).toBeVisible();
    const checked = element.locator('input[type="radio"]:checked:not(:disabled)');
    const input = await checked.count() ? checked : element.locator('input[type="radio"]:not(:disabled)').first();
    if (await input.count()) await expect(input).toBeFocused(); else await expect(element).toBeFocused();
    expect(await raw(page)).toBe(original);
  }
  await page.reload(); expect(await raw(page)).toBe(original);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("astandsskraning-navigation-v1:")))).toEqual([]);
});

test("context switches retain fire facts and extensions without imposing rental tasks outside rental", async ({ page }) => {
  const report = extendedFireDocument().reports[0]; await seed(page, report);
  const original = (await saved(page)).details.fireSafety;
  for (const context of ["standalone", "", "residential_rental"] as const) {
    await page.goto(`${base}/upplysingar`); await page.locator("#inspectionContext").selectOption(context);
    await page.goto(`${base}/yfirferd`); await page.reload();
    expect((await saved(page)).details.fireSafety).toEqual(original);
    await expect(page.locator("[data-fire-overall-status]")).toContainText("Ekkert viðbragð skráð við prófun");
    if (context !== "residential_rental") await expect(page.locator("#review-fire-safety")).toContainText("Valfrjáls skráning í þessu samhengi");
  }
});

test("fire edits preserve existing room photo associations and session-only reload limits", async ({ page }) => {
  const report = fireReport(mixedFire()); await seed(page, report);
  const room = report.rooms[0], item = room.items[0];
  await page.goto(`${base}/skraning?rymi=${encodeURIComponent(room.id)}&atridi=${encodeURIComponent(item.id)}`);
  const bytes = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 100; canvas.height = 100; return canvas.toDataURL("image/png").split(",")[1]; });
  await page.getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({ name: "synthetic-fire-regression.png", mimeType: "image/png", buffer: Buffer.from(bytes, "base64") });
  await expect(page.locator('.photo-preview[aria-label="Myndir við atriði"] .photo-actions > span')).toContainText("1/8");
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await page.locator("#review-fire-safety").getByRole("link", { name: "Reykskynjarar · Ekkert viðbragð skráð við prófun", exact: true }).click();
  await choice(page, fireFieldId("smokeDetectors", "testPerformance", "failed"), "Nei, ekki prófað");
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  const photo = page.locator(`[data-evidence-item="${item.id}"]`);
  await expect(photo.getByRole("button", { name: /synthetic-fire-regression/ })).toHaveCount(1);
  expect((await saved(page)).rooms).toEqual(report.rooms);
  const fire = (await saved(page)).details.fireSafety;
  await page.reload(); expect((await saved(page)).details.fireSafety).toEqual(fire);
  await expect(photo.getByRole("button", { name: /synthetic-fire-regression/ })).toHaveCount(0);
});

test("browser failed writes retain nested pending edits and envelope extensions for retry", async ({ page }) => {
  const document = extendedFireDocument();
  await seed(page, document.reports[0], fireCorrectionHref("fire-case", "smokeDetectors", "testedScopeDescription", "failed"));
  const original = await raw(page);
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    (window as unknown as { restoreFireWrites: () => void }).restoreFireWrites = () => { Storage.prototype.setItem = setItem; };
    Storage.prototype.setItem = function(key, value) { if (key === "astandsskraning-demo-v1") throw new Error("synthetic quota"); return setItem.call(this, key, value); };
  });
  await page.getByLabel("Hvaða skynjari eða skynjarar voru prófaðir?", { exact: true }).fill("Nýtt sýnisumfang");
  expect(await raw(page)).toBe(original);
  await expect(page.locator(".storage-warning")).toContainText("Breytingar eru aðeins í minni");
  await page.evaluate(() => (window as unknown as { restoreFireWrites: () => void }).restoreFireWrites());
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  const after = await saved(page);
  expect(after.details.fireSafety!.smokeDetectors!.entries![0].basicTest!.testedScopeDescription).toBe("Nýtt sýnisumfang");
  expect((after.details.fireSafety!.smokeDetectors!.entries![0].basicTest as unknown as { testExtra: object }).testExtra).toEqual({ keep: true });
  expect(JSON.parse((await raw(page))!).envelopeExtra).toEqual({ keep: [false, 0] });
});

test("closing an existing photo preview preserves a later explicit focus target", async ({ page }) => {
  const report = fireReport(mixedFire()); await seed(page, report);
  const room = report.rooms[0], item = room.items[0];
  await page.goto(`${base}/skraning?rymi=${encodeURIComponent(room.id)}&atridi=${encodeURIComponent(item.id)}`);
  const bytes = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 100; canvas.height = 100; return canvas.toDataURL().split(",")[1]; });
  await page.getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({ name: "synthetic-focus.png", mimeType: "image/png", buffer: Buffer.from(bytes, "base64") });
  const preview = page.getByRole("button", { name: /mynd 1 af 1: synthetic-focus/ });
  await preview.click(); await expect(page.getByRole("button", { name: "Loka myndaforskoðun", exact: true })).toBeFocused();
  // A native close restores focus before its queued React onClose cleanup.
  // Simulate the user's next focus action in that interval, without a timer race.
  await page.evaluate(() => {
    document.querySelector<HTMLDialogElement>("dialog")!.close();
    document.querySelector<HTMLButtonElement>('button[aria-label^="Fjarlægja mynd 1:"]')!.focus({ preventScroll: true });
  });
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Fjarlægja mynd 1:/ })).toBeFocused();
});

test("mobile widths, keyboard, axe, enlarged text and representative review screenshots", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Width audit covers all target widths once."); test.setTimeout(180_000);
  const output = process.env.FIRE_REVIEW_DIR ?? resolve("artifacts/phase-1b3b3/screenshots"); await mkdir(output, { recursive: true });
  const original = await seed(page, fireReport(mixedFire()), fireCorrectionHref("fire-case", "smokeDetectors", "testResult", "failed"));
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(fireCorrectionHref("fire-case", "smokeDetectors", "testResult", "failed"));
    await expect(page.locator("#fire-safety")).toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    for (const control of await page.locator('#fire-safety summary, #fire-safety button, #fire-safety label:has(input[type="radio"])').all()) {
      if (!await control.isVisible()) continue;
      const box = (await control.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: resolve(output, `${width}-editor-failed.png`), fullPage: true });
    await page.goto(`${base}/yfirferd`);
    await expect(page.locator("#review-fire-safety")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: resolve(output, `${width}-review-mixed.png`), fullPage: true });
  }
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/yfirferd`);
    await expect(page.locator("#review-fire-title")).toBeVisible();
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll<HTMLElement>("body *")].map(element => ({ element, size: parseFloat(getComputedStyle(element).fontSize) }));
      rows.forEach(({ element, size }) => { element.style.fontSize = `${size * 2}px`; });
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const heading = page.locator("#review-fire-title");
    const edit = page.locator("#review-fire-safety > .panel-heading a");
    const headingBox = (await heading.boundingBox())!;
    const editBox = (await edit.boundingBox())!;
    expect(editBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height);
    expect(await heading.evaluate(element => { const range = document.createRange(); range.selectNodeContents(element); return range.getClientRects().length; })).toBe(1);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: resolve(output, `${width}-review-text-200.png`), fullPage: true });
  }
  expect(await raw(page)).toBe(original);
  await page.goto(fireCorrectionHref("fire-case", "smokeDetectors", "testPerformance", "failed"));
  await expect(page.locator(`[id="${fireFieldId("smokeDetectors", "testPerformance", "failed")}"]`).getByRole("radio").first()).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(`[id="${fireFieldId("smokeDetectors", "testPerformance", "failed")}"]`).getByRole("radio", { name: "Nei, ekki prófað", exact: true })).toBeChecked();
});

test("representative empty, optional, retained and not-examined review states", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Scenario gallery is captured once.");
  const output = process.env.FIRE_REVIEW_DIR ?? resolve("artifacts/phase-1b3b3/screenshots"); await mkdir(output, { recursive: true });
  const optional = mixedFire();
  optional.smokeDetectors!.entries = [{ id: "unknown-count", visibleCondition: "no_visible_issue_observed", basicTest: { performance: "not_performed" } }];
  delete optional.smokeDetectors!.examinedDescription;
  const inactive = mixedFire(); inactive.smokeDetectors!.entries![1].basicTest!.performance = "not_performed";
  const notExamined = { smokeDetectors: { examination: "not_examined" as const }, extinguishers: { examination: "not_examined" as const }, escapeRoutes: { examination: "not_examined" as const } };
  const cases = [
    { name: "empty-rental", report: fireReport(), route: `${base}/skraning`, open: true },
    { name: "review-optional-omissions", report: fireReport(optional), route: `${base}/yfirferd` },
    { name: "review-not-examined", report: fireReport(notExamined), route: `${base}/yfirferd` },
    { name: "review-retained", report: fireReport(inactive), route: `${base}/yfirferd`, retained: true },
    { name: "zero-rooms", report: { ...fireReport(), rooms: [] }, route: fireCorrectionHref("fire-case", "escapeRoutes") },
  ];
  for (const scenario of cases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await context.newPage();
    const original = await seed(page, scenario.report, scenario.route);
    if (scenario.open) await open(page, "#fire-safety");
    if (scenario.retained) await open(page, '[data-fire-review-group="smokeDetectors"] details');
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: resolve(output, `390-${scenario.name}.png`), fullPage: true });
    expect(await raw(page)).toBe(original); await context.close();
  }
});
