import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { demoReports } from "../src/lib/fixtures";
import { fireState } from "../src/lib/fire-observations";
import { isReportList, reportStats, type Report } from "../src/lib/model";

const key = "astandsskraning-demo-v1";
const base = "/skyrslur/syni-ibud";
const progress = "[data-room-progress-context]";

function rentalReport() {
  const report = demoReports()[0];
  report.rooms = [report.rooms[0]];
  report.details.inspectionContext = "residential_rental";
  return report;
}
async function seed(page: Page, report = demoReports()[0]) {
  expect(isReportList([report])).toBe(true);
  const raw = JSON.stringify({ version: 1, extension: [false, 0, "keep"], reports: [report] });
  await page.addInitScript(({ key, raw }) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, raw);
  }, { key, raw });
  return raw;
}
async function unchanged(page: Page, raw: string) {
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
}
async function overview(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Yfirlit: Sýnigata 14", exact: true }).click();
  return page.locator(".report-overview:visible");
}
async function exactWall(page: Page) {
  const item = page.locator('.checklist-item[data-item="walls"]');
  await expect(item.locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(item.locator("[data-navigation-heading]")).toBeFocused();
  await expect(item.locator("[data-navigation-heading]")).toBeInViewport({ ratio: 1 });
  return item;
}

test("complete room counts still expose outstanding rental fire answers on every summary", async ({ page }) => {
  const report = rentalReport(), stats = reportStats(report);
  expect(stats.recorded).toBe(stats.total);
  expect(fireState(report.details).missing).toHaveLength(3);
  const raw = await seed(page, report);
  await page.goto(`${base}/skraning?rymi=demo-entry`);
  await expect(page.locator(".inspection-overall > details > summary")).toContainText(`${stats.recorded} af ${stats.total}`);
  await expect(page.locator(`.inspection-overall ${progress}`)).toBeVisible();
  await expect(page.locator(`.inspection-overall ${progress}`)).toContainText("Brunavarnir: 3 svör vantar.");
  await expect(page.locator(".inspection-overall > details")).not.toHaveAttribute("open");
  const summary = await overview(page);
  await expect(summary.locator(progress)).toContainText("Brunavarnir: 3 svör vantar.");
  await summary.getByRole("link", { name: "Yfirfara alla skráninguna", exact: true }).click();
  await expect(page.locator(".review-summary")).toContainText("rýmisatriði skráð");
  await expect(page.locator(progress)).toContainText("Brunavarnir: 3 svör vantar.");
  await expect(page.locator(".review-state")).toContainText("Nokkur atriði þarfnast yfirferðar");
  await unchanged(page, raw);
});

test("one missing fire answer is singular and optional fire checks are not made mandatory", async ({ page }) => {
  const report = rentalReport();
  report.details.fireSafety = { smokeDetectors: { examination: "not_examined" }, extinguishers: { examination: "not_examined" } };
  expect(fireState(report.details).missing).toHaveLength(1);
  const raw = await seed(page, report);
  await page.goto(`${base}/yfirferd`);
  await expect(page.locator(progress)).toContainText("Brunavarnir: 1 svar vantar.");
  await unchanged(page, raw);
  await page.goto(`${base}/upplysingar`);
  await page.getByRole("combobox", { name: /Tengsl við íbúðarleigu/ }).selectOption("standalone");
  await page.getByRole("link", { name: "Yfirferð", exact: true }).click();
  await expect(page.locator(progress)).toBeVisible();
  await expect(page.locator(progress)).not.toContainText("svar vantar");
  const stored = JSON.parse((await page.evaluate(key => localStorage.getItem(key), key))!).reports[0] as Report;
  expect(reportStats(stored)).toEqual(reportStats(report));
  expect(fireState(stored.details).missing).toHaveLength(1);
});

test("summary defect links open and keyboard-focus the exact item for writers and readers", async ({ page, context }) => {
  const raw = await seed(page);
  for (const current of [page, await context.newPage()]) {
    const summary = await overview(current);
    const link = summary.getByRole("link", { name: "Stofa · Veggir", exact: true });
    await expect(link).toHaveAttribute("href", `${base}/skraning?rymi=demo-living&atridi=walls`);
    await link.focus();
    await current.keyboard.press("Enter");
    await exactWall(current);
    if (current !== page) {
      await expect(current.getByRole("button", { name: "Breyta fráviki", exact: true })).toBeDisabled();
    }
    await unchanged(current, raw);
  }
});

const png = readFileSync("public/concepts/synthetic-wall-damage.png");
for (const count of [1, 2]) test(`${count} temporary photos use correct item, announcement and review labels`, async ({ page }) => {
  const raw = await seed(page);
  await page.goto(`${base}/skraning?rymi=demo-living&atridi=walls&mynd=atridi`);
  const picker = page.getByLabel("Myndir við atriði: velja myndir", { exact: true });
  await expect(picker).toBeEnabled();
  await picker.setInputFiles(Array.from({ length: count }, (_, index) => ({ name: `synthetic-${index}.png`, mimeType: "image/png", buffer: png })));
  const item = page.locator('.checklist-item[data-item="walls"]');
  await expect(item.locator(".checklist-toggle")).toContainText(`${count} ${count === 1 ? "mynd" : "myndir"}`);
  await expect(item.getByRole("status").first()).toHaveText(`${count} ${count === 1 ? "mynd" : "myndum"} bætt við tímabundna forskoðun.`);
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await expect(page.locator(".review-summary > div").last()).toHaveText(`${count}${count === 1 ? "myndaforskoðun" : "myndaforskoðanir"}`);
  if (count === 1) {
    await page.getByRole("link", { name: "Stofa · Yfirlitsmynd rýmis vantar", exact: true }).click();
    await page.getByLabel("Yfirlitsmyndir rýmis: velja myndir", { exact: true }).setInputFiles({ name: "overview.png", mimeType: "image/png", buffer: png });
    await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
    await expect(page.locator(".review-photo-count")).toContainText("1 yfirlitsmynd í tímabundinni forskoðun");
  }
  await unchanged(page, raw);
});

test("progress summaries retain accessible names and reflow", async ({ page }) => {
  const raw = await seed(page, rentalReport());
  await page.goto(`${base}/skraning?rymi=demo-entry`);
  await expect(page.locator(progress)).toBeVisible();
  for (const view of ["inspection", "overview", "review"]) {
    if (view === "overview") await overview(page);
    if (view === "review") await page.locator(".report-overview:visible").getByRole("link", { name: "Yfirfara alla skráninguna", exact: true }).click();
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(audit.violations, view).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  }
  await unchanged(page, raw);
});
