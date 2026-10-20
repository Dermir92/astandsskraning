import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { positionKey } from "../src/lib/inspection-navigation";
import { reportStats } from "../src/lib/model";
import { is } from "../src/lib/locale/is";
import { previewReport, longPreviewText } from "./report-preview-fixtures";
import { auditRenderedContrast } from "./contrast-helpers";

const base = "/skyrslur/preview-report";
const document = (page: Page) => page.locator("#preview-report");
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
const storage = (page: Page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
async function seed(page: Page, report = previewReport(), route = "yfirferd", position = JSON.stringify({ version: 1, roomId: "preview-room-2", itemId: "windows" })) {
  const original = JSON.stringify({ version: 1, extension: { preserve: "raw envelope" }, reports: [report] }, null, 2);
  await page.addInitScript(({ original, key, navKey, position }) => {
    if (!sessionStorage.getItem("preview-seeded")) {
      localStorage.setItem(key, original); localStorage.setItem(navKey, position); localStorage.setItem("unrelated-preview-sentinel", "unchanged"); sessionStorage.setItem("preview-seeded", "1");
    }
  }, { original, key: STORAGE_KEY, navKey: positionKey(report.id), position });
  await page.goto(`/skyrslur/${report.id}/${route}`);
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  return original;
}
async function enter(page: Page) {
  await page.getByRole("link", { name: is.preview.open, exact: true }).click();
  await expect(document(page)).toBeVisible();
}
async function upload(page: Page, targets: { room: number; item?: string; count: number }[]) {
  const data = await page.evaluate(() => {
    const c = window.document.createElement("canvas"); c.width = 960; c.height = 640;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "#d9e7e2"; ctx.fillRect(0,0,960,640); ctx.fillStyle = "#17635d"; ctx.fillRect(80,90,800,460); ctx.fillStyle = "white"; ctx.font = "30px sans-serif"; ctx.fillText("SYNTHETIC REVIEW IMAGE", 220,330);
    return c.toDataURL("image/png").split(",")[1];
  });
  for (const target of targets) {
    if (!page.url().includes("/skraning")) await page.getByRole("navigation", { name: "Skref skráningar" }).getByRole("link", { name: /Skráning/ }).click();
    // Use existing room controls so the root media provider survives.
    await page.locator(".room-inspection .room-heading h2").waitFor();
    const select = page.locator("#current-room");
    if (await select.isVisible()) await select.selectOption(`preview-room-${target.room}`);
    else await page.locator(`.room-sidebar a[href*="rymi=preview-room-${target.room}"]`).click();
    await expect(page).toHaveURL(new RegExp(`rymi=preview-room-${target.room}`));
    if (target.item) {
      const toggle = page.locator(`.checklist-item[data-item="${target.item}"] .checklist-toggle`);
      if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
    }
    const region = target.item ? page.locator(`.checklist-item[data-item="${target.item}"] .photo-preview`) : page.locator(".room-inspection details").filter({ has: page.locator('.photo-preview[aria-label="Yfirlitsmyndir rýmis"]') });
    if (!target.item) await region.locator(":scope > summary").click();
    const input = region.locator('input[type="file"]');
    await input.setInputFiles(Array.from({ length: target.count }, (_, i) => ({ name: `synthetic-${target.room}-${target.item ?? "overview"}-${i}.png`, mimeType: "image/png", buffer: Buffer.from(data, "base64") })));
    await expect(region.locator(".photo-actions > span")).toContainText(`${target.count}/8`);
  }
  await page.getByRole("link", { name: "Yfirferð", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible();
}
async function audit(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  const result = await auditRenderedContrast(page); expect(result.failures).toEqual([]); expect(result.typeFailures).toEqual([]);
  expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function evidence(page: Page, name: string, locator = document(page)) {
  const folder = process.env.PREVIEW_EVIDENCE_DIR;
  if (!folder) return;
  await mkdir(folder, { recursive: true });
  await locator.screenshot({ path: path.join(folder, `${test.info().project.name}-${name}.png`) });
}
async function viewportEvidence(page: Page, name: string) {
  const folder = process.env.PREVIEW_EVIDENCE_DIR;
  if (!folder) return;
  await mkdir(folder, { recursive: true });
  await page.evaluate(() => scrollTo(0,0));
  await page.screenshot({ path: path.join(folder, `${test.info().project.name}-${name}-viewport.png`) });
}

test("four-step entry renders every complete source record and linked finding without writing", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  const r = previewReport(); const original = await seed(page, r); const before = await storage(page);
  await enter(page);
  await viewportEvidence(page, "complete");
  await evidence(page, "complete-overview", document(page).locator(":scope > section").first());
  await expect(page.getByRole("navigation", { name: "Skref skráningar" }).getByRole("link")).toHaveCount(4);
  await expect(document(page).locator('[data-preview-record^="A"]')).toHaveCount(reportStats(r).total);
  await expect(document(page).getByText(longPreviewText, { exact: true })).toBeAttached();
  await expect(page.getByRole("heading", { name: "2 atriði með skráðu fráviki" })).toBeVisible();
  await expect(document(page).locator('input, textarea, select')).toHaveCount(0);
  const finding = document(page).getByRole("link", { name: /A004.*Forstofa.*Gluggar/ }); await finding.click();
  await expect(document(page).locator('[data-preview-record="A004"]')).toBeFocused();
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page.getByRole("link", { name: is.preview.open, exact: true })).toBeFocused();
  await enter(page); await page.goBack(); await page.goForward(); await expect(document(page)).toBeVisible();
  expect(await storage(page)).toEqual(before); expect(await raw(page)).toBe(original); expect(errors).toEqual([]);
  await evidence(page, "complete-report");
});

test("incomplete, zero-room and zero-item drafts remain honest and openable", async ({ page }) => {
  const original = await seed(page, previewReport("incomplete")); await enter(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Heimilisfang óskráð");
  await expect(document(page).getByText("Heimilisfang", { exact: true })).toBeVisible();
  await expect(document(page).getByText("Ástand", { exact: true }).first()).toBeVisible();
  expect(await document(page).locator('dd').allTextContents()).not.toContain("Á ekki við");
  await expect(page.getByRole("heading", { name: is.preview.incomplete, exact: true })).toBeVisible();
  await expect(document(page).getByText(is.preview.noFindings, { exact: true })).toBeVisible();
  expect(await raw(page)).toBe(original); await evidence(page, "incomplete"); await viewportEvidence(page, "incomplete");
});

test("zero-room property/fire/meter records have no completion percentage or fabricated room", async ({ page }) => {
  const r = previewReport(); r.rooms = []; const original = await seed(page, r, "forskodun");
  await expect(page.getByRole("heading", { name: is.preview.noItems, exact: true })).toBeVisible();
  await expect(document(page).locator('[data-preview-record^="A"]')).toHaveCount(0);
  await expect(document(page).getByText("0%", { exact: true })).toHaveCount(0);
  await expect(page.locator("#preview-fire")).toBeAttached(); await expect(page.locator("#preview-meters")).toBeAttached(); expect(await raw(page)).toBe(original);
});

test("complete answers with explicit limitations never become a successful whole-property inspection", async ({ page }) => {
  const r = previewReport("limited"); const original = await seed(page, r); await enter(page);
  await expect(page.getByRole("heading", { name: is.preview.noFindings, exact: true })).toBeVisible();
  const fields = await document(page).locator('dd').allTextContents(); expect(fields).toContain("Ekki skoðað"); expect(fields).toContain("Ekki prófað");
  await expect(document(page).getByText("0 ófullskráð", { exact: true })).toHaveCount(0);
  expect(reportStats(r).recorded).toBe(reportStats(r).total); expect(await raw(page)).toBe(original); await evidence(page, "limited"); await viewportEvidence(page, "limited");
});

test("retained fire, N/A, heating and stale-meter facts remain separate from current findings", async ({ page }) => {
  const r = previewReport("limited"); const o = r.rooms[0].observations.windows;
  o.condition = "na"; o.functionality = "broken"; o.description = "INACTIVE-DEFECT";
  r.details.fireSafety!.smokeDetectors!.entries![0].basicTest = { performance: "not_performed", result: "no_response_observed", testedScopeDescription: "INACTIVE-TEST" };
  r.rooms[2].observations["space-heating"].description = "INACTIVE-HEAT";
  r.details.meterReadings!.electricity = { applicability: "separate", factsApplicability: "shared", readingStatus: "recorded", readingValue: "0099,10", unit: "kWh", readingDate: "2026-10-18" };
  const original = await seed(page, r); await enter(page);
  await expect(page.getByRole("heading", { name: is.preview.noFindings, exact: true })).toBeVisible();
  for (const value of ["INACTIVE-DEFECT", "INACTIVE-TEST", "INACTIVE-HEAT", "0099,10"]) {
    const field = document(page).getByText(value, { exact: true }); await expect(field).toBeHidden();
    const disclosure = field.locator("xpath=ancestor::details[1]"); await disclosure.locator(":scope > summary").click(); await expect(field).toBeVisible();
  }
  expect(await raw(page)).toBe(original);
});

test("photo associations, image failures, full view and reload preserve text and source records", async ({ page }) => {
  test.setTimeout(120_000); const original = await seed(page);
  await upload(page, [{ room: 0, count: 8 }, { room: 0, item: "windows", count: 8 }, { room: 1, item: "floor", count: 7 }]);
  // Deliberately make one still-associated image unavailable before entering preview.
  const bad = await page.locator('img[alt*="synthetic-0-overview-0.png"]').first().getAttribute("src");
  await page.evaluate(url => URL.revokeObjectURL(url!), bad);
  const before = await storage(page); await enter(page);
  await expect(document(page).locator('[data-preview-photo]')).toHaveCount(23);
  await document(page).locator('[data-preview-photo="M001"]').scrollIntoViewIfNeeded();
  await expect(document(page).locator('[data-preview-photo="M001"]').getByText(is.preview.imageUnavailable, { exact: true })).toBeVisible();
  const button = document(page).getByRole("button", { name: /Skoða mynd M002/ }); await button.click();
  await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("Escape"); await expect(button).toBeFocused();
  expect(await storage(page)).toEqual(before); expect(await raw(page)).toBe(original);
  await evidence(page, "room-long-text-photos", document(page).locator('[data-preview-record="A004"]'));
  await evidence(page, "fire", page.locator("#preview-fire")); await evidence(page, "meters", page.locator("#preview-meters"));
  await page.reload(); await expect(document(page)).toBeVisible(); await expect(document(page).locator('[data-preview-photo]')).toHaveCount(0); await expect(document(page).getByText(is.preview.noPhotos, { exact: true })).toBeAttached(); expect(await raw(page)).toBe(original);
});

test("source links preserve current correction contracts and explicit edits refresh the preview", async ({ page }) => {
  const original = await seed(page); await enter(page);
  for (const [source, anchor, edit, target] of [
    ["#preview-fire", "review-fire-safety", "Breyta brunavörnum", "fire-safety"],
    ["#preview-meters", "review-meter-readings", "Breyta mælaskráningu", "meter-readings"],
    ["#preview-rental", "review-rental-details", "Breyta leiguupplýsingum", "rentalLandlordNames"],
  ]) {
    await page.locator(source).getByRole("link", { name: /Leiðrétta í yfirferð/ }).last().click(); await expect(page).toHaveURL(new RegExp(anchor));
    await page.getByRole("link", { name: edit, exact: true }).click(); await expect(page.locator(`#${target}`)).toBeVisible();
    await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).click(); await enter(page);
  }
  expect(await raw(page)).toBe(original);
  await page.locator("#preview-property").getByRole("link", { name: /Leiðrétta í yfirferð/ }).last().click();
  await page.getByRole("link", { name: "Breyta skoðun og umfangi", exact: true }).click(); await page.getByLabel("Nafn skráningaraðila").fill("Leiðrétt sýninafn");
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).click(); await enter(page); await expect(document(page).getByText("Leiðrétt sýninafn", { exact: true }).first()).toBeVisible();
});

test("read-error protects original bytes and never presents fallback fixtures as the user's preview", async ({ page }) => {
  const original = '{"version":77,"reports":"unsupported","keep":"raw"}';
  await page.addInitScript(({ key, original }) => localStorage.setItem(key, original), { key: STORAGE_KEY, original });
  await page.goto(`${base}/forskodun`); await expect(page.getByRole("heading", { name: is.preview.readError })).toBeVisible(); await expect(document(page)).toHaveCount(0); expect(await raw(page)).toBe(original);
});

test("pending valid edits stay in memory and preview provides no retry writer", async ({ page }) => {
  const original = await seed(page, previewReport(), "upplysingar");
  await page.evaluate(key => {
    const set = Storage.prototype.setItem; Reflect.set(window, "previewOriginalSetItem", set);
    Storage.prototype.setItem = function(k, value) { if (k === key) throw Error("Synthetic quota"); return set.call(this,k,value); };
  }, STORAGE_KEY);
  await page.getByLabel("Nafn skráningaraðila").fill("Pending recorder");
  await page.getByRole("navigation", { name: "Skref skráningar" }).getByRole("link", { name: /Yfirferð/ }).click(); await enter(page);
  await expect(document(page).getByText("Pending recorder", { exact: true }).first()).toBeVisible(); await expect(page.getByRole("button", { name: "Reyna vistun aftur", exact: true })).toHaveCount(0); expect(await raw(page)).toBe(original);
  await page.getByRole("link", { name: /Aftur í yfirferð til að reyna vistun aftur/ }).click();
  await page.evaluate(() => { Storage.prototype.setItem = Reflect.get(window, "previewOriginalSetItem"); });
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click(); expect(JSON.parse((await raw(page))!).reports[0].details.recorderName).toBe("Pending recorder");
});

test("keyboard anchors, guide and malformed remembered position do not write or repair source storage", async ({ page }) => {
  await seed(page, previewReport(), "yfirferd", "MALFORMED-POSITION-BYTES"); const before = await storage(page); await enter(page);
  await page.locator('#preview-report nav summary').focus(); await page.keyboard.press("Enter");
  const roomLink = page.locator('#preview-report nav').getByRole("link", { name: "R01 · Forstofa", exact: true }); await roomLink.focus(); await page.keyboard.press("Enter");
  await expect(document(page).locator('[data-preview-record="R01"]')).toBeFocused();
  expect(await storage(page)).toEqual(before); await page.reload(); await expect(document(page)).toBeVisible(); expect(await storage(page)).toEqual(before);
});

test("expanded 100-item / 40-photo report retains every record and association with responsive text-first loading", async ({ page }) => {
  test.setTimeout(120_000); const r = previewReport("expanded"); const original = await seed(page, r);
  await upload(page, [{ room: 0, count: 8 }, { room: 0, item: "windows", count: 8 }, { room: 1, count: 8 }, { room: 1, item: "floor", count: 8 }, { room: 2, count: 8 }]);
  const before = await storage(page); const start = Date.now(); await enter(page);
  await expect(document(page).locator('[data-preview-record^="A"]')).toHaveCount(100); await expect(document(page).locator('[data-preview-photo]')).toHaveCount(40);
  expect(new Set(await document(page).locator('[id]').evaluateAll(els => els.map(el => el.id))).size).toBe(await document(page).locator('[id]').count());
  expect(await raw(page)).toBe(original); expect(await storage(page)).toEqual(before);
  test.info().annotations.push({ type: "preview-entry-ms", description: `${Date.now()-start}` });
});

test("five widths, enlarged text and principal content states retain semantic order and readable reflow", async ({ context }, info) => {
  test.skip(info.project.name !== "desktop", "The five-width audit runs once; touch projects exercise ordinary interactions separately.");
  test.setTimeout(480_000);
  for (const scenario of ["complete", "incomplete", "limited", "large"] as const) {
    const page = await context.newPage(); await seed(page, previewReport(scenario)); await enter(page);
    const before = await storage(page);
    for (const width of [320,360,390,768,1440]) for (const enlarged of [false,true]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(enlarged => {
        const elements = [...window.document.querySelectorAll<HTMLElement>("body, body *")].filter(el => el instanceof HTMLElement);
        elements.forEach(el => { if (el.dataset.previewBaseFont) el.style.fontSize = el.dataset.previewOriginalFont ?? ""; });
        const sizes = elements.map(el => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
        if (enlarged) for (const { el, size } of sizes) { el.dataset.previewOriginalFont = el.style.fontSize; el.dataset.previewBaseFont = String(size); el.style.fontSize = `${size * 2}px`; }
      }, enlarged);
      await audit(page);
      await expect(document(page).locator('[data-preview-record^="A"]')).toHaveCount(scenario === "large" ? 84 : 15);
      await evidence(page, `${scenario}-${width}-${enlarged ? "text-200" : "normal"}`, document(page).locator("header").first());
      await viewportEvidence(page, `${scenario}-${width}-${enlarged ? "text-200" : "normal"}`);
    }
    expect(await storage(page)).toEqual(before); await page.close();
  }
});
