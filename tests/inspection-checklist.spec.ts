import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { CONDITIONS, EMPTY_OBSERVATION, isReportList, observationComplete, reportStats, type Report } from "../src/lib/model";
import { is } from "../src/lib/locale/is";
import { checklistReport } from "./inspection-checklist-fixtures";
import { auditRenderedContrast } from "./contrast-helpers";
import { positionKey } from "../src/lib/inspection-navigation";

const route = "/skyrslur/checklist-report/skraning?rymi=checklist-entry";
const row = (page: Page, id: string) => page.locator(`.checklist-item[data-item="${id}"]`);
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
async function saved(page: Page): Promise<Report> { return JSON.parse((await raw(page))!).reports[0]; }
async function seed(page: Page, report = checklistReport()) {
  const document = JSON.stringify({ version: 1, reports: [report] });
  await page.addInitScript(({ key, document }) => {
    if (!sessionStorage.getItem("checklist-seeded")) {
      localStorage.setItem(key, document);
      localStorage.setItem("unrelated-checklist-sentinel", "unchanged");
      sessionStorage.setItem("checklist-seeded", "1");
    }
  }, { key: STORAGE_KEY, document });
  await page.goto(route);
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  return document;
}
async function openItem(page: Page, id: string) {
  const target = row(page, id);
  if (await target.locator(".checklist-toggle").getAttribute("aria-expanded") === "false") await target.locator(".checklist-toggle").click();
  return target.locator(".observation-body");
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("unanswered checklist is compact, neutral and explicit; opening items never writes answers", async ({ page }) => {
  const original = await seed(page);
  await expect(page.locator(".checklist-item")).toHaveCount(7);
  await expect(page.locator('.checklist-item[data-state="unanswered"]')).toHaveCount(7);
  await expect(page.getByRole("button", { name: /^Í lagi:/, pressed: false })).toHaveCount(7);
  await expect(page.getByRole("button", { name: /^Annað ástand:/ })).toHaveCount(7);
  const good = row(page, "floor").getByRole("button", { name: "Í lagi: Gólfefni", exact: true });
  const alternative = row(page, "floor").getByRole("button", { name: "Annað ástand: Gólfefni", exact: true });
  for (const button of [good, alternative]) {
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
  const style = async (selector: typeof good) => selector.evaluate(el => { const s = getComputedStyle(el); return { background: s.backgroundColor, border: s.borderColor, color: s.color }; });
  expect(await style(good)).toEqual(await style(alternative));
  await openItem(page, "floor");
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await row(page, "floor").getByRole("button", { name: "Loka atriði", exact: true }).click();
  expect(await raw(page)).toBe(original);
  await page.reload();
  expect(await raw(page)).toBe(original);
  await noOverflow(page);
});

test("quick-good changes condition only and leaves required functionality and cleanliness explicit", async ({ page }) => {
  const original = checklistReport();
  await seed(page, original);
  await row(page, "floor").getByRole("button", { name: "Í lagi: Gólfefni", exact: true }).click();
  const floor = row(page, "floor");
  await expect(floor).toHaveAttribute("data-state", "incomplete");
  await expect(floor.getByRole("radio", { name: "Hreint", exact: true })).toBeFocused();
  const cleanLabel = floor.getByRole("radio", { name: "Hreint", exact: true }).locator("..");
  await expect(cleanLabel).toBeInViewport({ ratio: 1 });
  expect(await cleanLabel.evaluate(el => {
    const box = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await expect(floor.getByRole("radio", { checked: true })).toHaveCount(0);
  expect((await saved(page)).rooms[0].observations.floor).toEqual({ ...EMPTY_OBSERVATION, condition: "good" });
  expect((await saved(page)).rooms[1]).toEqual(original.rooms[1]);
  await floor.getByRole("radio", { name: "Hreint", exact: true }).check();
  await expect(floor).toHaveAttribute("data-state", "recorded");
  await expect(floor.locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  await row(page, "windows").getByRole("button", { name: "Í lagi: Gluggar", exact: true }).click();
  const windows = row(page, "windows");
  await expect(windows.getByRole("radio", { name: "Virkar", exact: true })).toBeFocused();
  await expect(windows.getByRole("radio", { checked: true })).toHaveCount(0);
  await windows.getByRole("radio", { name: "Virkar", exact: true }).check();
  await expect(windows.getByRole("group", { name: "Þrif", exact: true }).getByRole("radio", { checked: true })).toHaveCount(0);
  expect(observationComplete((await saved(page)).rooms[0].items[3], (await saved(page)).rooms[0].observations.windows)).toBe(false);
  await windows.getByRole("radio", { name: "Hreint", exact: true }).check();
  await expect(windows).toHaveAttribute("data-state", "recorded");
  await expect(page.locator(".inspection-overall > div strong")).toHaveText("2 af 20");
  await page.reload();
  expect((await saved(page)).rooms[0].observations.windows).toEqual({ ...EMPTY_OBSERVATION, condition: "good", functionality: "works", cleanliness: "clean" });
});

test("all six conditions remain available with native controls and the unchanged applicability rules", async ({ page }) => {
  await seed(page);
  await row(page, "windows").getByRole("button", { name: "Annað ástand: Gluggar", exact: true }).click();
  const editor = row(page, "windows").locator(".observation-body");
  const condition = editor.getByRole("group", { name: "Ástand", exact: true });
  await expect(condition.getByRole("radio")).toHaveCount(6);
  await expect(condition.getByRole("radio", { name: "Notkunarmerki", exact: true })).toBeFocused();
  await expect(condition.getByRole("radio", { checked: true })).toHaveCount(0);
  for (const answer of CONDITIONS) {
    await condition.getByRole("radio", { name: is.conditions[answer], exact: true }).check();
    expect((await saved(page)).rooms[0].observations.windows.condition).toBe(answer);
    await expect(condition.getByRole("radio", { name: is.conditions[answer], exact: true })).toBeChecked();
    if (answer === "na") await expect(editor.getByRole("group", { name: "Virkni", exact: true })).toHaveCount(0);
    else await expect(editor.getByRole("group", { name: "Virkni", exact: true })).toBeVisible();
  }
  await expect(row(page, "windows")).toHaveAttribute("data-state", "recorded");
  expect(reportStats(await saved(page)).recorded).toBe(1);
});

test("existing draft values, associations, status distinctions and review statistics survive editing and reload", async ({ page }) => {
  const original = checklistReport(true);
  const document = await seed(page, original);
  for (const [id, state] of [["floor", "incomplete"], ["walls", "deviation"], ["ceiling", "recorded"], ["windows", "attention"], ["doors", "recorded"], ["lights", "deviation"], ["closets", "unanswered"]]) await expect(row(page, id)).toHaveAttribute("data-state", state);
  await expect(row(page, "windows")).toContainText("Ekki skoðað · Skráð · Þarf athygli");
  const walls = await openItem(page, "walls");
  await expect(walls.getByRole("textbox", { name: /^Lýsing/ })).toHaveValue("Tilbúin 8 cm rispa");
  expect(await raw(page)).toBe(document);
  await walls.getByRole("textbox", { name: /^Athugasemd/ }).fill("Ný, afmörkuð athugasemd");
  const updated = await saved(page);
  const expected = structuredClone(original);
  expected.rooms[0].observations.walls.note = "Ný, afmörkuð athugasemd";
  expect({ ...updated, updatedAt: original.updatedAt }).toEqual(expected);
  expect(isReportList([updated])).toBe(true);
  const stats = reportStats(updated);
  await expect(page.locator(".inspection-overall > div strong")).toHaveText(`${stats.recorded} af ${stats.total}`);
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  const numbers = page.locator(".review-summary > div > strong");
  await expect(numbers.nth(1)).toHaveText(`${stats.recorded} / ${stats.total}`);
  await expect(numbers.nth(2)).toHaveText(String(stats.unanswered));
  await expect(numbers.nth(3)).toHaveText(String(stats.deviations));
  await expect(page.getByRole("heading", { name: `${stats.attention} atriði þarfnast athygli`, exact: true })).toBeVisible();
  await page.reload();
  expect(await saved(page)).toEqual(updated);
  expect(await page.evaluate(() => localStorage.getItem("unrelated-checklist-sentinel"))).toBe("unchanged");
});

test("condition changes retain damage text, notes and temporary photos without extending attachment rules", async ({ page }) => {
  await seed(page, checklistReport(true));
  const editor = await openItem(page, "walls");
  const png = Buffer.from(await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 16;
    canvas.getContext("2d")!.fillRect(0, 0, 16, 16);
    return canvas.toDataURL("image/png").split(",")[1];
  }), "base64");
  await editor.getByLabel("Myndir af fráviki: velja myndir", { exact: true }).setInputFiles({ name: "tilbuin.png", mimeType: "image/png", buffer: png });
  await expect(editor.getByRole("img", { name: "Staðbundin forskoðun: tilbuin.png", exact: true })).toBeVisible();
  await expect(editor).toContainText("hverfa við endurhleðslu");
  const previous = (await saved(page)).rooms[0].observations.walls;
  await row(page, "walls").getByRole("button", { name: "Í lagi: Veggir", exact: true }).click();
  expect((await saved(page)).rooms[0].observations.walls).toEqual({ ...previous, condition: "good" });
  await expect(editor.getByLabel("Myndir af fráviki: velja myndir", { exact: true })).toHaveCount(0);
  await row(page, "walls").getByRole("button", { name: "Annað ástand: Veggir", exact: true }).click();
  await editor.getByRole("radio", { name: "Skemmt", exact: true }).check();
  await expect(editor.getByRole("img", { name: "Staðbundin forskoðun: tilbuin.png", exact: true })).toBeVisible();
  expect((await saved(page)).rooms[0].observations.walls).toEqual(previous);
  expect(await raw(page)).not.toContain("blob:");
  await page.reload();
  const reloaded = await openItem(page, "walls");
  await expect(reloaded.getByRole("img")).toHaveCount(0);
  await expect(reloaded).toContainText("Mynd af fráviki vantar.");
  expect((await saved(page)).rooms[0].observations.walls).toEqual(previous);
});

test("keyboard order, alternative focus, native radio keys and close-focus restoration are usable", async ({ page }) => {
  const document = await seed(page);
  const floor = row(page, "floor");
  const toggle = floor.locator(".checklist-toggle");
  await toggle.focus();
  await page.keyboard.press("Tab");
  await expect(floor.getByRole("button", { name: "Í lagi: Gólfefni", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  const alternative = floor.getByRole("button", { name: "Annað ástand: Gólfefni", exact: true });
  await expect(alternative).toBeFocused();
  expect(await alternative.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(floor.getByRole("radio", { name: "Notkunarmerki", exact: true })).toBeFocused();
  expect(await raw(page)).toBe(document);
  await page.keyboard.press("ArrowRight");
  await expect(floor.getByRole("radio", { name: "Slit / galli", exact: true })).toBeChecked();
  await floor.getByRole("button", { name: "Loka atriði", exact: true }).click();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(floor.getByRole("radio", { name: "Slit / galli", exact: true })).toBeChecked();
});

test("room selection, previous/next navigation and existing review return do not supply answers", async ({ page }, testInfo) => {
  const document = await seed(page);
  await page.getByRole("link", { name: "Næsta rými", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Stofa", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Fyrra rými", exact: true }).click();
  await expect(page).toHaveURL(/rymi=checklist-entry$/);
  if (testInfo.project.name === "desktop") await page.getByRole("navigation", { name: "Velja rými", exact: true }).getByRole("link", { name: /Svefnherbergi/ }).click();
  else await page.getByRole("combobox", { name: "Velja rými", exact: true }).selectOption("checklist-bedroom");
  await expect(page.getByRole("heading", { name: "Svefnherbergi", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await page.getByRole("link", { name: "Breyta skráningu: Stofa", exact: true }).click();
  await expect(page).toHaveURL(/rymi=checklist-living&fra=yfirferd&yfirferdRymi=checklist-living$/);
  expect(await raw(page)).toBe(document);
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual([STORAGE_KEY, positionKey("checklist-report"), "unrelated-checklist-sentinel"].sort());
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), positionKey("checklist-report"))).toEqual({ version: 1, roomId: "checklist-living", itemId: null });
});

test("new controls preserve unreadable raw data and valid failed writes still retry", async ({ page }) => {
  await seed(page);
  const unsupported = '{"version":7,"reports":[],"synthetic":"retain exactly"}';
  await page.evaluate(({ key, unsupported }) => localStorage.setItem(key, unsupported), { key: STORAGE_KEY, unsupported });
  await page.goto("/skyrslur/syni-ibud/skraning?rymi=demo-living");
  await expect(page.getByRole("button", { name: "Í lagi: Veggir", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Annað ástand: Veggir", exact: true }).click();
  await page.getByRole("radio", { name: "Í lagi", exact: true }).click();
  expect(await raw(page)).toBe(unsupported);
  await expect(page.getByRole("button", { name: "Reyna vistun aftur", exact: true })).toHaveCount(0);
  const document = JSON.stringify({ version: 1, reports: [checklistReport()] });
  await page.evaluate(({ key, document }) => localStorage.setItem(key, document), { key: STORAGE_KEY, document });
  await page.goto(route);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreChecklistWrites: () => void }).restoreChecklistWrites = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) { if (name === key) throw new Error("Synthetic write failure"); return original.call(this, name, value); };
  }, STORAGE_KEY);
  await row(page, "floor").getByRole("button", { name: "Í lagi: Gólfefni", exact: true }).click();
  await expect(page.locator(".topbar .save-status")).toHaveText("Ekki tókst að vista í vafra");
  expect(await raw(page)).toBe(document);
  await page.evaluate(() => (window as unknown as { restoreChecklistWrites: () => void }).restoreChecklistWrites());
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  await page.reload();
  expect((await saved(page)).rooms[0].observations.floor).toEqual({ ...EMPTY_OBSERVATION, condition: "good" });
  await expect(row(page, "floor")).toHaveAttribute("data-state", "incomplete");
});

test("checklist and expanded deviation preserve axe semantics, contrast and enlarged-text reflow", async ({ page }) => {
  await seed(page, checklistReport(true));
  for (const id of [null, "floor", "walls", "windows"] as const) {
    if (id) await openItem(page, id);
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(audit.violations).toEqual([]);
    const contrast = await auditRenderedContrast(page);
    expect(contrast.failures).toEqual([]);
    expect(contrast.typeFailures).toEqual([]);
    await noOverflow(page);
  }
  await page.evaluate(() => {
    const elements = [...document.querySelectorAll<HTMLElement>(".inspection-page *")].map(el => [el, parseFloat(getComputedStyle(el).fontSize)] as const);
    for (const [el, size] of elements) el.style.fontSize = `${size * 2}px`;
  });
  await noOverflow(page);
});
