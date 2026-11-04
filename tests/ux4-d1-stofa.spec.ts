import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { EMPTY_OBSERVATION, type Report } from "../src/lib/model";
import { checklistReport } from "./inspection-checklist-fixtures";

const route = "/skyrslur/checklist-report/skraning?rymi=checklist-living";
const row = (page: Page, id: string) => page.locator(`.checklist-item[data-item="${id}"]`);
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key)!, STORAGE_KEY);
async function seed(page: Page, mixed = false, customize?: (report: Report) => void) {
  const report = checklistReport();
  const living = report.rooms[1];
  if (mixed) living.observations = {
    floor: { ...EMPTY_OBSERVATION, condition: "good", cleanliness: "clean" },
    walls: { ...EMPTY_OBSERVATION, condition: "damaged", damageType: "Rispa", location: "Við glugga", description: "Tilbúin rispa við glugga" },
    ceiling: { ...EMPTY_OBSERVATION, condition: "good" },
    windows: { ...EMPTY_OBSERVATION, condition: "good", functionality: "works", cleanliness: "clean" },
    doors: { ...EMPTY_OBSERVATION, condition: "na" },
  };
  Object.assign(living, { extension: { keep: [0, false, "  unchanged  "] } });
  if (mixed) Object.assign(living.observations.walls, { extension: { keep: true }, note: "Fyrri athugasemd" });
  customize?.(report);
  const document = JSON.stringify({ version: 1, extension: { keep: true }, reports: [report] });
  await page.addInitScript(({ key, document }) => {
    if (!sessionStorage.getItem("ux4-d1-seeded")) {
      localStorage.setItem(key, document);
      sessionStorage.setItem("ux4-d1-seeded", "1");
    }
  }, { key: STORAGE_KEY, document });
  await page.goto(route);
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra", { timeout: 30_000 });
  return document;
}

test("visual evidence: open Stofa defect", async ({ page }) => {
  await seed(page, true);
  await row(page, "walls").locator(".checklist-toggle").click();
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `docs/qa/ux4-d1/${process.env.UX4_CAPTURE_STAGE || "after"}-${page.viewportSize()!.width}.png`, fullPage: true });
});

test("unanswered stays neutral; a good condition never infers functionality or cleanliness", async ({ page }) => {
  const before = await seed(page);
  await row(page, "windows").locator(".checklist-toggle").click();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(row(page, "windows").getByRole("radio")).toHaveCount(4);
  expect(await raw(page)).toBe(before);
  await row(page, "windows").getByRole("radio", { name: "Í lagi", exact: true }).check();
  const expected = JSON.parse(before);
  const after = JSON.parse(await raw(page));
  expected.reports[0].rooms[1].observations.windows = { ...EMPTY_OBSERVATION, condition: "good" };
  expected.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(expected);
  await expect(row(page, "windows").getByRole("button", { name: "Ljúka atriði", exact: true })).toBeDisabled();
  await row(page, "windows").getByText("Breyta mati", { exact: true }).click();
  await expect(row(page, "windows").getByRole("radio", { name: "Virkar", exact: true })).not.toBeChecked();
  await expect(row(page, "windows").getByRole("radio", { name: "Hreint", exact: true })).not.toBeChecked();
  await row(page, "windows").getByRole("radio", { name: "Virkar", exact: true }).check();
  await row(page, "windows").getByRole("radio", { name: "Hreint", exact: true }).check();
  await row(page, "windows").getByRole("button", { name: "Ljúka atriði", exact: true }).click();
  await expect(row(page, "windows").locator(".checklist-toggle")).toBeFocused();
  await page.reload();
  const saved = JSON.parse(await raw(page)).reports[0].rooms[1].observations.windows;
  expect(saved).toEqual({ ...EMPTY_OBSERVATION, condition: "good", functionality: "works", cleanliness: "clean" });
});

test("BUG-01: concise defect edit preserves legacy fields, focus, navigation and reload", async ({ page }) => {
  const before = JSON.parse(await seed(page, true));
  await row(page, "walls").locator(".checklist-toggle").click();
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  const description = row(page, "walls").getByRole("textbox", { name: /^Lýsing á fráviki/ });
  await description.evaluate(el => el.setAttribute("data-original-editor", "yes"));
  await description.fill("");
  await page.keyboard.type("Stutt ný lýsing");
  await expect(description).toHaveValue("Stutt ný lýsing");
  await expect(description).toBeFocused();
  await expect(description).toHaveAttribute("data-original-editor", "yes");
  await row(page, "walls").getByRole("button", { name: "Loka ritli", exact: true }).click();
  await expect(row(page, "walls").locator(".checklist-toggle")).toBeFocused();
  const after = JSON.parse(await raw(page));
  before.reports[0].rooms[1].observations.walls.description = "Stutt ný lýsing";
  before.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(before);
  await page.getByRole("combobox", { name: "Velja rými", exact: true }).selectOption("checklist-entry");
  await expect(page.getByRole("button", { name: "Ástand í lagi: Gólfefni", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Velja rými", exact: true }).selectOption("checklist-living");
  await row(page, "walls").locator(".checklist-toggle").click();
  await expect(row(page, "walls").getByRole("region", { name: "Skráð frávik", exact: true })).toContainText("Stutt ný lýsing");
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await expect(page).toHaveURL(/yfirferd/);
  await page.goBack();
  await page.reload();
  await expect(row(page, "walls").getByRole("region", { name: "Skráð frávik", exact: true })).toContainText("Stutt ný lýsing");
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  await row(page, "walls").getByText("Athugasemd (valfrjálst) · Skráð", { exact: true }).click();
  await expect(row(page, "walls").getByRole("textbox", { name: /^Athugasemd/ })).toHaveValue("Fyrri athugasemd");
  expect(JSON.parse(await raw(page))).toEqual(after);
});

const testPhoto = "public/concepts/synthetic-wall-damage.png";

test("defect photos are item-specific and temporary; evidence never bypasses required legacy validation", async ({ page }) => {
  await seed(page);
  const overview = page.getByRole("region", { name: "Yfirlitsmyndir rýmis", exact: true });
  await expect(overview).toContainText("hverfa við endurhleðslu");
  await expect(overview.getByLabel("Yfirlitsmyndir rýmis: taka mynd", { exact: true })).toHaveAttribute("capture", "environment");
  await overview.getByLabel("Yfirlitsmyndir rýmis: velja myndir", { exact: true }).setInputFiles(testPhoto);
  await expect(overview.getByRole("button", { name: /^Forskoða/ })).toHaveCount(1);
  await row(page, "walls").locator(".checklist-toggle").click();
  await row(page, "walls").getByRole("radio", { name: "Frávik", exact: true }).check();
  const photos = row(page, "walls").getByRole("region", { name: "Fráviksmyndir", exact: true });
  await photos.getByLabel("Fráviksmyndir: velja myndir", { exact: true }).setInputFiles(testPhoto);
  await expect(photos.getByRole("button", { name: /^Forskoða/ })).toHaveCount(1);
  await expect(row(page, "walls").getByRole("button", { name: "Ljúka atriði", exact: true })).toBeDisabled();
  await row(page, "walls").getByRole("textbox", { name: /^Lýsing á fráviki/ }).fill("Sýnileg rispa");
  await row(page, "walls").getByText("Tegund og staðsetning · Vantar", { exact: true }).click();
  await row(page, "walls").getByLabel(/^Tegund skemmdar/).selectOption("Rispa");
  await expect(row(page, "walls").getByRole("button", { name: "Ljúka atriði", exact: true })).toBeDisabled();
  await row(page, "walls").getByRole("textbox", { name: /^Staðsetning/ }).fill("Við glugga");
  await expect(row(page, "walls").getByRole("textbox", { name: /^Lýsing á fráviki/ })).toBeVisible();
  await expect(row(page, "walls").getByRole("button", { name: "Ljúka atriði", exact: true })).toBeEnabled();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `docs/qa/ux4-d1/after-demo-photos-${page.viewportSize()!.width}.png`, fullPage: true });
  await row(page, "walls").getByRole("button", { name: "Loka ritli", exact: true }).click();
  await row(page, "ceiling").locator(".checklist-toggle").click();
  await expect(row(page, "ceiling").getByRole("button", { name: /^Forskoða/ })).toHaveCount(0);
  await page.reload();
  await expect(overview.getByRole("button", { name: /^Forskoða/ })).toHaveCount(0);
  expect(JSON.parse(await raw(page)).reports[0].rooms[1].observations.walls).toEqual({ ...EMPTY_OBSERVATION, condition: "defect", damageType: "Rispa", location: "Við glugga", description: "Sýnileg rispa" });
});

test("changing a legacy defect requires confirmation and retains all supporting fields", async ({ page }) => {
  const before = JSON.parse(await seed(page, true));
  await row(page, "walls").locator(".checklist-toggle").click();
  await row(page, "walls").locator("details").filter({ has: page.locator('input[name$="simple-condition"]') }).locator("summary").click();
  await row(page, "walls").getByRole("radio", { name: "Í lagi", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Breyta virku fráviki?", exact: true });
  await dialog.getByRole("button", { name: "Halda fyrra mati", exact: true }).click();
  expect(JSON.parse(await raw(page))).toEqual(before);
  await row(page, "walls").getByRole("radio", { name: "Í lagi", exact: true }).click();
  await dialog.getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
  const after = JSON.parse(await raw(page));
  before.reports[0].rooms[1].observations.walls.condition = "good";
  before.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(before);
  await expect(row(page, "walls").getByText("Varðveitt frávikslýsing", { exact: true }).last()).toBeVisible();
  await row(page, "walls").getByRole("button", { name: "Afturkalla breytingu", exact: true }).click();
  expect(JSON.parse(await raw(page)).reports[0].rooms[1].observations.walls.condition).toBe("damaged");
});

test("failed persistence keeps the active editor and draft; retry persists without data loss", async ({ page }) => {
  const before = await seed(page, true);
  await row(page, "walls").locator(".checklist-toggle").click();
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreStorage: () => void }).restoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) throw new DOMException("Synthetic quota", "QuotaExceededError");
      original.call(this, name, value);
    };
  }, STORAGE_KEY);
  const description = row(page, "walls").getByRole("textbox", { name: /^Lýsing á fráviki/ });
  await description.fill("Ný lýsing bíður vistunar");
  await expect(description).toBeFocused();
  await expect(page.locator(".storage-warning")).toContainText("aðeins í minni");
  await expect(row(page, "walls").getByRole("button", { name: "Ljúka atriði", exact: true })).toBeDisabled();
  expect(await raw(page)).toBe(before);
  await page.evaluate(() => (window as unknown as { restoreStorage: () => void }).restoreStorage());
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  const after = JSON.parse(await raw(page));
  const expected = JSON.parse(before);
  expected.reports[0].rooms[1].observations.walls.description = "Ný lýsing bíður vistunar";
  expected.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(expected);
  await page.reload();
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  await expect(description).toHaveValue("Ný lýsing bíður vistunar");
});

test("Web Locks prevent a second tab from editing Stofa", async ({ page, context }) => {
  const before = await seed(page, true);
  const reader = await context.newPage();
  await reader.goto(route);
  await row(reader, "walls").locator(".checklist-toggle").click();
  await row(reader, "walls").locator("details").filter({ has: reader.locator('input[name$="simple-condition"]') }).locator("summary").click();
  await expect(row(reader, "walls").getByRole("radio", { name: "Í lagi", exact: true })).toBeDisabled();
  await expect(reader.getByLabel("Yfirlitsmyndir rýmis: taka mynd", { exact: true })).toBeDisabled();
  expect(await raw(reader)).toBe(before);
  await reader.close();
});

test("room navigation preserves unfinished answers and last-room review does not imply completion", async ({ page }) => {
  await seed(page);
  await row(page, "ceiling").locator(".checklist-toggle").click();
  await row(page, "ceiling").getByRole("radio", { name: "Ekki skoðað", exact: true }).check();
  await row(page, "ceiling").getByRole("button", { name: "Ljúka atriði", exact: true }).click();
  await page.getByRole("navigation", { name: "Fara á milli rýma", exact: true }).getByRole("link", { name: "Næsta rými", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Velja rými", exact: true })).toHaveValue("checklist-bedroom");
  await page.getByRole("navigation", { name: "Fara á milli rýma", exact: true }).getByRole("link", { name: "Yfirferð", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible();
  expect(JSON.parse(await raw(page)).reports[0].rooms[1].observations.ceiling.condition).toBe("uninspected");
  await page.goBack();
  await page.getByRole("combobox", { name: "Velja rými", exact: true }).selectOption("checklist-living");
  await expect(row(page, "floor")).toHaveAttribute("data-state", "unanswered");
  await expect(page.getByText("5 atriði ófullskráð.", { exact: false })).toBeVisible();
});

test("accessible flat layout fits the viewport with an open defect editor", async ({ page }) => {
  await seed(page, true);
  await row(page, "walls").locator(".checklist-toggle").click();
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page }).include(".inspection-page").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(audit.violations).toEqual([]);
  const size = await row(page, "walls").getByRole("button", { name: "Loka ritli", exact: true }).boundingBox();
  expect(size!.height).toBeGreaterThanOrEqual(44);
});

test("legacy wear, broken functionality, dirty cleanliness and hidden evidence survive simple condition changes", async ({ page }) => {
  const before = JSON.parse(await seed(page, true, report => {
    Object.assign(report.rooms[1].observations.windows, {
      condition: "wear", functionality: "broken", cleanliness: "dirty", note: "Varðveita athugasemd",
      damageType: "Óvirkur búnaður", location: "Við karm", description: "Tilbúið: gluggi opnast ekki", extra: { raw: [false, 0] },
    });
    Object.assign(report.rooms[1].items[3], { extra: { keep: true } });
    Object.assign(report, { extra: { keep: true } });
  }));
  const windows = row(page, "windows");
  await windows.locator(".checklist-toggle").click();
  await windows.locator("details").filter({ has: page.locator('input[name$="simple-condition"]') }).locator("summary").click();
  await windows.getByRole("radio", { name: "Í lagi", exact: true }).click();
  const after = JSON.parse(await raw(page));
  before.reports[0].rooms[1].observations.windows.condition = "good";
  before.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(before);
  await expect(windows.locator(".checklist-toggle")).toContainText("Frávik");
  await windows.getByText("Breyta mati", { exact: true }).click();
  await expect(windows.getByRole("radio", { name: "Virkar ekki", exact: true })).toBeChecked();
  await expect(windows.getByRole("radio", { name: "Þarfnast þrifa", exact: true })).toBeChecked();
  await windows.getByText("Breyta mati", { exact: true }).click();
  await windows.getByRole("radio", { name: "Á ekki við", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
  await page.reload();
  const saved = JSON.parse(await raw(page));
  before.reports[0].rooms[1].observations.windows.condition = "na";
  before.reports[0].updatedAt = saved.reports[0].updatedAt;
  expect(saved).toEqual(before);
});

test("review corrections reveal required detailed answers and return to the source item", async ({ page }) => {
  await seed(page, true, report => { delete report.rooms[1].observations.windows.functionality; });
  const before = await raw(page);
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  const review = page.locator(".review-room").filter({ has: page.getByRole("heading", { name: "Stofa", exact: true }) });
  await review.locator(".review-observations").getByRole("link", { name: "Gluggar", exact: true }).click();
  const functionality = row(page, "windows").getByRole("radio", { name: "Virkar", exact: true });
  await expect(functionality).toBeVisible();
  await expect(functionality).not.toBeChecked();
  expect(await raw(page)).toBe(before);
  await functionality.check();
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page).toHaveURL(/yfirferd/);
});

test("an external canonical change locks Stofa without overwriting either record", async ({ page }) => {
  const before = JSON.parse(await seed(page, true));
  await row(page, "walls").locator(".checklist-toggle").click();
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  before.reports[0].title = "Breytt utan þessa flipa";
  const external = JSON.stringify(before);
  await page.evaluate(({ key, external }) => {
    const oldValue = localStorage.getItem(key);
    localStorage.setItem(key, external);
    window.dispatchEvent(new StorageEvent("storage", { key, oldValue, newValue: external, storageArea: localStorage }));
  }, { key: STORAGE_KEY, external });
  await expect(row(page, "walls").getByRole("textbox", { name: /^Lýsing á fráviki/ })).toBeDisabled();
  await expect(row(page, "walls").getByRole("button", { name: "Ljúka atriði", exact: true })).toBeDisabled();
  expect(await raw(page)).toBe(external);
});

test("a fully recorded last-room Stofa leads to review without completing the property", async ({ page }) => {
  const before = await seed(page, false, report => {
    report.rooms = [report.rooms[1]];
    for (const item of report.rooms[0].items) report.rooms[0].observations[item.id] = { ...EMPTY_OBSERVATION, condition: "na" };
  });
  await expect(page.getByText("Rýmisatriði fullskráð.", { exact: false })).toBeVisible();
  await page.getByRole("navigation", { name: "Fara á milli rýma", exact: true }).getByRole("link", { name: "Yfirferð", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible();
  expect(await raw(page)).toBe(before);
  expect(JSON.parse(await raw(page)).reports[0].sampleReviewed).not.toBe(true);
});

