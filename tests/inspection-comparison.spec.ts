import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { STORAGE_KEY } from "../src/components/demo-provider";
import type { Report } from "../src/lib/model";
import { largeLinkedPair, linkedInitialFixture, linkedPair } from "./inspection-comparison-fixtures";
import { auditRenderedContrast } from "./contrast-helpers";

async function seed(page: Page, reports = [linkedInitialFixture()], route = `/skyrslur/${reports[0].id}/yfirferd`) {
  const raw = JSON.stringify({ version: 1, extension: { sentinel: "keep" }, reports }, null, 2);
  await page.addInitScript(({ raw, key }) => { if (!sessionStorage.getItem("linked-seeded")) { localStorage.setItem(key, raw); localStorage.setItem("linked-sentinel", "unchanged"); sessionStorage.setItem("linked-seeded", "1"); } }, { raw, key: STORAGE_KEY });
  await page.goto(route); await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra"); return raw;
}
const stored = (page: Page) => page.evaluate(key => localStorage.getItem(key)!, STORAGE_KEY);
async function reports(page: Page): Promise<Report[]> { return JSON.parse(await stored(page)).reports; }
async function ready(page: Page) { await expect(page.locator("#comparison").getByRole("status")).toContainText("Samanburður núverandi draga"); }
async function create(page: Page) {
  await page.getByRole("button", { name: "Hefja lokaskoðun", exact: true }).click();
  await page.getByRole("button", { name: "Stofna tengda lokaskoðun", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Upplýsingar um íbúð", exact: true })).toBeVisible();
  const final = (await reports(page)).find(r => r.linkedInitial)!;
  await expect(page).toHaveURL(`/skyrslur/${final.id}/upplysingar`);
  await expect(page.getByRole("navigation", { name: "Skref skráningar" }).getByRole("link", { name: /Skráning/ })).toHaveAttribute("href", `/skyrslur/${final.id}/skraning`);
  return final;
}
async function capture(page: Page, name: string) {
  const folder = process.env.LINKED_REVIEW_DIR; if (!folder) return;
  await mkdir(folder, { recursive: true }); await page.screenshot({ path: path.join(folder, `${test.info().project.name}-${name}.png`), fullPage: true });
}
async function openRecords(page: Page) {
  const summary = page.locator("#comparison").getByText(/^Skoða öll samanburðaratriði/), details = summary.locator("..");
  if (!(await details.evaluate(node => (node as HTMLDetailsElement).open))) await summary.click();
  await expect(details).toHaveJSProperty("open", true);
}
async function audit(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  const contrast = await auditRenderedContrast(page); expect(contrast.failures).toEqual([]); expect(contrast.typeFailures).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

test("create, cancel, fresh capture, reference, preview, correct and resume retain source and four steps", async ({ page }) => {
  const original = linkedInitialFixture(); const raw = await seed(page, [original]);
  await page.getByRole("button", { name: "Hefja lokaskoðun", exact: true }).click();
  const cancel = page.getByRole("button", { name: "Hætta við", exact: true }); await expect(cancel).toBeFocused();
  await cancel.click(); await expect(page.getByRole("button", { name: "Hefja lokaskoðun", exact: true })).toBeFocused(); expect(await stored(page)).toBe(raw);
  const final = await create(page); expect(final.rooms[0].observations).toEqual({}); expect(final.details.recorderName).toBe(""); expect(final.details.meterReadings).toBeUndefined();
  expect((await reports(page)).find(r => r.id === original.id)).toEqual(original); expect((await reports(page))).toHaveLength(2);
  await expect(page.locator(".stepper a")).toHaveCount(4);
  await page.getByRole("navigation", { name: "Skref skráningar" }).getByRole("link", { name: /Skráning/ }).click();
  const itemId = final.rooms[0].items[0].id; const editor = page.locator(`.checklist-item[data-item="${itemId}"]`);
  await editor.locator(".checklist-toggle").click(); const beforeReference = await stored(page);
  await editor.getByText("Upphafssvar · aðeins til viðmiðunar", { exact: true }).click();
  await expect(editor.getByText("Löng lýsing á sýnirispu.", { exact: false })).toBeVisible(); expect(await stored(page)).toBe(beforeReference);
  await editor.getByRole("button", { name: "Í lagi: Veggir", exact: true }).click();
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await expect(page).toHaveURL(`/skyrslur/${final.id}/yfirferd`);
  await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible(); await ready(page); await openRecords(page);
  await expect(page.locator("#comparison").getByText("Skráður munur til yfirferðar").first()).toBeVisible();
  await capture(page, "changed-comparison"); const beforeReading = await stored(page);
  await page.getByRole("link", { name: "Forskoða skýrslu", exact: true }).click();
  await expect(page).toHaveURL(`/skyrslur/${final.id}/forskodun`);
  await expect(page.getByRole("heading", { name: /^Ástandsskýrsla/ })).toBeVisible(); await ready(page); await openRecords(page);
  await expect(page.locator("#comparison").getByText("Lokasvör eru sjálfstæð.", { exact: false })).toBeVisible();
  expect(await stored(page)).toBe(beforeReading); await capture(page, "concept-c-comparison");
  await page.locator("#comparison").getByRole("link", { name: /Leiðrétta í yfirferð/ }).first().click();
  await expect(page).toHaveURL(`/skyrslur/${final.id}/yfirferd#comparison`);
  await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible(); await ready(page);
  await openRecords(page); await page.locator("#comparison").getByRole("link", { name: /Breyta lokasvari/ }).first().click();
  await expect(page.locator(`.checklist-item[data-item="${itemId}"] .checklist-toggle`)).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click(); await page.getByRole("link", { name: "Fara í mínar skýrslur", exact: true }).click();
  await page.reload(); expect((await reports(page)).find(r => r.id === original.id)).toEqual(original);
  await page.goto(`/skyrslur/${final.id}/skraning`); await expect(page.locator(`.checklist-item[data-item="${itemId}"] .checklist-toggle`)).toHaveAttribute("aria-expanded", "true");
});

test("changed source pauses preview and deliberate reconfirmation preserves final answers and associations", async ({ page }) => {
  const { initial, final } = await linkedPair(true); await seed(page, [initial, final], `/skyrslur/${final.id}/yfirferd`); await ready(page);
  await page.goto(`/skyrslur/${initial.id}/upplysingar`); await page.locator("#recorderName").fill("Breytt sýninafn");
  await page.goto(`/skyrslur/${final.id}/yfirferd`); await expect(page.locator("#comparison").getByRole("status")).toContainText("Samanburður í bið");
  await expect(page.locator("#comparison").getByText(/^Skoða öll samanburðaratriði/)).toHaveCount(0); await capture(page, "modified-baseline");
  const pending = (await reports(page)).find(r => r.id === final.id)!; const before = await stored(page);
  await page.getByRole("link", { name: "Forskoða skýrslu", exact: true }).click(); await expect(page.locator("#comparison").getByRole("status")).toContainText("Samanburður í bið");
  await expect(page.locator("#comparison").getByRole("button", { name: /Nota núverandi/ })).toHaveCount(0); expect(await stored(page)).toBe(before);
  await page.locator("#comparison").getByRole("link", { name: "Yfirfara breytt viðmið í yfirferð" }).click();
  await page.getByText("Yfirfara breytt samanburðarviðmið", { exact: true }).click();
  await page.getByRole("button", { name: "Nota núverandi upphafsskráningu og samhengi" }).click(); await ready(page);
  await expect(page.locator("#comparison")).toBeFocused(); const after = (await reports(page)).find(r => r.id === final.id)!;
  expect(after.rooms).toEqual(pending.rooms); expect(after.linkedInitial!.rooms).toEqual(pending.linkedInitial!.rooms); await openRecords(page); await capture(page, "reconfirmed-baseline");
});

test("unanswered final prose does not inflate counts; an explicit good answer keeps the condition change", async ({ page }) => {
  const { initial, final } = await linkedPair(); const original = structuredClone(initial);
  const before = await seed(page, [initial, final], `/skyrslur/${final.id}/yfirferd`);
  for (const route of ["yfirferd", "forskodun"]) {
    await page.goto(`/skyrslur/${final.id}/${route}`); await ready(page); await openRecords(page);
    const comparison = page.locator("#comparison");
    await expect(comparison).toContainText("0 atriði með skráðum mun · 0 atriði með sömu skráðu svörum.");
    await expect(comparison.getByText("Skráður munur til yfirferðar", { exact: true })).toHaveCount(0);
    await expect(comparison.getByText("Upplýsingar vantar", { exact: true }).first()).toBeVisible();
    await audit(page); expect(await stored(page)).toBe(before);
  }
  await capture(page, "corrected-unanswered-concept-c");
  await page.goto(`/skyrslur/${final.id}/skraning`);
  const editor = page.locator(`.checklist-item[data-item="${final.rooms[0].items[0].id}"]`);
  if (await editor.locator(".checklist-toggle").getAttribute("aria-expanded") !== "true") await editor.locator(".checklist-toggle").click();
  await editor.getByRole("button", { name: "Í lagi: Veggir", exact: true }).click();
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click(); await ready(page); await openRecords(page);
  const comparison = page.locator("#comparison");
  await expect(comparison).toContainText("1 atriði með skráðum mun · 0 atriði með sömu skráðu svörum.");
  const walls = comparison.locator("section").filter({ has: page.getByRole("heading", { name: "Stofa · Veggir", exact: true }) });
  const description = walls.locator("dl > div").filter({ has: page.locator("dt", { hasText: /^Lýsing$/ }) });
  await expect(description).toContainText("Á ekki við"); await expect(description).toContainText("Ekki samanburðarhæft");
  await expect(description).not.toContainText("Óskráð"); await expect(description).not.toContainText("Upplýsingar vantar");
  await expect(walls.getByText("Skráður munur til yfirferðar", { exact: true }).first()).toBeVisible();
  await audit(page); await capture(page, "corrected-damaged-to-good-review");
  expect((await reports(page)).find(r => r.id === original.id)).toEqual(original);
});

test("failed linked creation stays in memory once and ordinary retry saves the same draft", async ({ page }) => {
  const raw = await seed(page);
  await page.evaluate(key => { const set = Storage.prototype.setItem; Object.assign(window, { linkedFail: true }); Storage.prototype.setItem = function(k, v) { if (k === key && (window as unknown as { linkedFail: boolean }).linkedFail) throw Error("Synthetic quota"); return set.call(this, k, v); }; }, STORAGE_KEY);
  await page.getByRole("button", { name: "Hefja lokaskoðun", exact: true }).click();
  await page.getByRole("button", { name: "Stofna tengda lokaskoðun", exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole("heading", { name: "Upplýsingar um íbúð", exact: true })).toBeVisible();
  await expect(page.locator(".topbar .save-status")).not.toHaveText("Vistað í þessum vafra"); expect(await stored(page)).toBe(raw);
  await capture(page, "memory-only-linked-final"); await page.evaluate(() => Object.assign(window, { linkedFail: false }));
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click(); await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra"); expect(await reports(page)).toHaveLength(2);
});

test("separate session photographs remain attached to their original reports and disappear on reload", async ({ page }) => {
  const { initial, final } = await linkedPair(true); await seed(page, [initial, final], `/skyrslur/${initial.id}/skraning`);
  const file = await page.evaluate(() => { const c = document.createElement("canvas"); c.width = 160; c.height = 100; c.getContext("2d")!.fillRect(0, 0, 160, 100); return c.toDataURL("image/png").split(",")[1]; });
  const before = await stored(page);
  const initialEditor = page.locator('.checklist-item[data-item="walls"]'); await initialEditor.locator(".checklist-toggle").click();
  await initialEditor.getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({ name: "initial-synthetic.png", mimeType: "image/png", buffer: Buffer.from(file, "base64") });
  await expect(initialEditor.locator(".photo-actions > span")).toContainText("1/8");
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  // A client transition keeps the real root photo provider alive.
  await page.getByRole("link", { name: "Fara í mínar skýrslur", exact: true }).click();
  const row = page.locator(".report-entry").filter({ has: page.locator(`a[href*="/${final.id}/"]`) });
  await row.locator(".register-next").click();
  // The final's direct route is reached by the existing stepper if the list entered details.
  await page.getByRole("navigation", { name: "Skref skráningar" }).getByRole("link", { name: /Skráning/ }).click();
  const finalEditor = page.locator(`.checklist-item[data-item="${final.rooms[0].items[0].id}"]`);
  if (await finalEditor.locator(".checklist-toggle").getAttribute("aria-expanded") !== "true") await finalEditor.locator(".checklist-toggle").click();
  await finalEditor.getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({ name: "final-synthetic.png", mimeType: "image/png", buffer: Buffer.from(file, "base64") });
  await expect(finalEditor.locator(".photo-actions > span")).toContainText("1/8");
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click(); await ready(page); await openRecords(page);
  await page.locator("#comparison").getByText("Tímabundnar myndir við þetta atriði", { exact: true }).first().click();
  await expect(page.locator("#comparison").getByRole("button", { name: /Forskoða Upphaf.*initial-synthetic/ })).toBeVisible();
  await expect(page.locator("#comparison").getByRole("button", { name: /Forskoða Lok.*final-synthetic/ })).toBeVisible(); expect(await stored(page)).toBe(before);
  await page.reload(); await ready(page); await openRecords(page); await page.locator("#comparison").getByText("Tímabundnar myndir við þetta atriði", { exact: true }).first().click();
  await expect(page.locator("#comparison").getByRole("button", { name: /Forskoða.*synthetic/ })).toHaveCount(0); expect(await stored(page)).toBe(before);
});

test("five-width comparison, missing data, modules and enlarged text remain accessible", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The complete width matrix is executed once."); test.setTimeout(180_000);
  const pair = await linkedPair(true); pair.final.rooms[0].observations[pair.final.rooms[0].items[0].id].description = "";
  pair.final.rooms[0].name = "Langt heiti stofu með íslenskum stöfum og endurtekinni lýsingu";
  pair.final.rooms[0].observations[pair.final.rooms[0].items[1].id].functionality = "untested";
  pair.final.rooms[0].observations[pair.final.rooms[0].items[1].id].note = "Langur sýnitexti. ".repeat(45);
  for (const width of [320,360,390,768,1440]) {
    const context = await browser.newContext({ viewport: { width, height: 950 } }); const page = await context.newPage();
    await seed(page, [pair.initial, pair.final], `/skyrslur/${pair.final.id}/yfirferd`); await ready(page); await openRecords(page); await audit(page); await capture(page, `${width}-review-incomplete`);
    await page.getByRole("link", { name: "Forskoða skýrslu", exact: true }).click();
    await expect(page).toHaveURL(`/skyrslur/${pair.final.id}/forskodun`);
    await expect(page).toHaveTitle("Forskoðun skýrslu · Ástandsskráning");
    await expect(page.getByRole("heading", { name: /^Ástandsskýrsla/ })).toBeVisible(); await ready(page); await openRecords(page);
    await page.locator("#comparison").getByText("Brunavarnir og mælar · aðskildar skráningar", { exact: true }).click(); await audit(page); await capture(page, `${width}-preview-modules`);
    await page.evaluate(() => { const sizes = [...document.querySelectorAll<HTMLElement>("body *")].map(el => ({ el, size: getComputedStyle(el).fontSize })); sizes.forEach(({el,size}) => { if (parseFloat(size)) el.style.fontSize = `${parseFloat(size)*2}px`; }); });
    await audit(page); await capture(page, `${width}-preview-text-200`);
    await context.close();
  }
});

test("large comparison retains all 100 item associations, full text and read-only storage", async ({ page }) => {
  test.setTimeout(90_000);
  const { initial, final } = await largeLinkedPair(); await seed(page, [initial, final], `/skyrslur/${final.id}/forskodun`);
  await ready(page); const before = await stored(page); await openRecords(page);
  const comparison = page.locator("#comparison");
  await expect(comparison.locator("section").filter({ has: page.locator(":scope > h3") })).toHaveCount(100);
  await expect(comparison.getByRole("heading", { name: "Sýnirými 10 · Sýniatriði 10", exact: true })).toBeVisible();
  await audit(page); expect(await stored(page)).toBe(before);
  await comparison.getByRole("heading", { name: "Sýnirými 10 · Sýniatriði 10", exact: true }).scrollIntoViewIfNeeded();
  const folder = process.env.LINKED_REVIEW_DIR; if (folder) await page.screenshot({ path: path.join(folder, `${test.info().project.name}-100-item-last-record.png`) });
});
