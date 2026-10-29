import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { demoReports } from "../src/lib/fixtures";
import { EMPTY_OBSERVATION, type Report } from "../src/lib/model";
import { positionKey, navigationTargetId } from "../src/lib/inspection-navigation";
import { recordedMeter } from "./meter-readings-fixtures";

test("UI2A actual application evidence matrix", async ({ page }, info) => {
  test.skip(!process.env.UI2A_CAPTURE_PHASE, "Explicit application evidence capture only");
  test.setTimeout(180_000);
  const phase = process.env.UI2A_CAPTURE_PHASE!;
  const folder = `docs/qa/ui2a-implementation/screenshots/${phase}/${info.project.name}`;
  await mkdir(folder, { recursive: true });
  const base = "/skyrslur/syni-ibud";
  const records: object[] = [];
  async function visit(report: Report, query = "", resume = false) {
    await page.addInitScript(({ key, report, navKey, resume }) => {
      localStorage.setItem(key, JSON.stringify({ version: 1, reports: [report] }));
      localStorage.removeItem(navKey);
      if (resume) localStorage.setItem(navKey, JSON.stringify({ version: 1, roomId: "demo-living", itemId: "walls" }));
    }, { key: STORAGE_KEY, report, navKey: positionKey(report.id), resume });
    await page.goto(`${base}/skraning${query ? `?${query}` : ""}`);
    await expect(page.locator(".room-heading h2")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  async function shot(name: string, fullPage = false) {
    // Keyboard Home may still be processing its default scroll when the
    // screenshot starts. Pin top comparisons explicitly and verify the same
    // scroll before AND after capture; ordinary destination shots stay intact.
    const atTop = name === "reference-top" || name === "reference-full" || name === "rental-top" || name === "meters-active-top";
    if (atTop) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    }
    await page.screenshot({ path: `${folder}/${name}.png`, fullPage });
    if (atTop) await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    records.push({ name, url: page.url(), fullPage, ...await page.evaluate(() => ({
      viewport: { width: innerWidth, height: innerHeight }, scrollY, documentHeight: document.documentElement.scrollHeight,
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
      firstItemY: Math.round(document.querySelector('.checklist-item')!.getBoundingClientRect().top + scrollY),
      focus: { id: document.activeElement?.id, tag: document.activeElement?.tagName },
    })) });
  }
  await visit(demoReports()[0]);
  await shot("first-entry"); await shot("first-entry-full", true);
  await visit(demoReports()[0], "", true);
  await shot("resumed"); await shot("resumed-full", true);
  await visit(demoReports()[0], "rymi=demo-living");
  await page.keyboard.press("Control+Home"); await shot("reference-top"); await shot("reference-full", true);
  await visit(demoReports()[0], "rymi=demo-living&atridi=walls");
  await shot("completed-defect"); await shot("completed-defect-full", true);
  await visit(demoReports()[0], "rymi=demo-bedroom-1&atridi=floor");
  await shot("unanswered");
  const incomplete = demoReports()[0];
  incomplete.rooms[1].observations.floor = { ...EMPTY_OBSERVATION, condition: "good" };
  await visit(incomplete, "rymi=demo-living&atridi=floor"); await shot("incomplete");
  const rental = demoReports()[0]; rental.details.inspectionContext = "residential_rental";
  await visit(rental, "rymi=demo-living"); await page.keyboard.press("Control+Home"); await shot("rental-top");
  await visit(rental, "hluti=brunavarnir&flokkur=reykskynjarar&reitur=examination&fra=yfirferd"); await shot("rental-fire");
  await visit(demoReports()[0], "rymi=demo-living"); await page.locator("#meter-readings > summary").click(); await page.locator("#meter-readings").scrollIntoViewIfNeeded(); await shot("meters-inactive");
  const optional = demoReports()[0]; optional.details.meterReadings = { mode: "optional", factsPurpose: "optional", electricity: recordedMeter({ readingStatus: "not_read" }) };
  await visit(optional, "rymi=demo-living"); await page.locator("#meter-readings > summary").click(); await page.locator("#meter-readings").scrollIntoViewIfNeeded(); await shot("meters-optional");
  const active = demoReports()[0]; active.details.inspectionContext = "residential_rental"; active.details.meterReadings = { mode: "rental_initial" };
  await visit(active, "rymi=demo-living"); await page.keyboard.press("Control+Home"); await shot("meters-active-top");
  await visit(active, "maelar=rafmagn&maelaReitur=applicability&fra=yfirferd"); await shot("meters-active");
  await visit(demoReports()[0], "rymi=demo-living");
  await page.goto(`${base}/yfirferd`);
  await page.locator(".review-room").filter({ has: page.getByRole("heading", { name: "Stofa", exact: true }) }).locator(".review-observations").getByRole("link", { name: "Veggir", exact: true }).click();
  await expect(page.locator('[data-item="walls"] .checklist-toggle')).toHaveAttribute("aria-expanded", "true");
  await shot("review-correction");
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page.locator(`[id="${navigationTargetId("review", "demo-living", "walls")}"]`)).toBeFocused();
  // Review has no inspection rows; capture separately from the inspection metrics.
  await page.screenshot({ path: `${folder}/review-return.png` });
  await page.setViewportSize({ width: 320, height: 800 });
  await visit(demoReports()[0], "rymi=demo-bedroom-1&atridi=windows"); await shot("keyboard-320");
  await page.getByRole("radio", { name: "Í lagi", exact: true }).focus();
  await page.keyboard.press("Tab"); await shot("keyboard-320-tab");
  expect(records.every(r => (r as { noHorizontalOverflow: boolean }).noHorizontalOverflow)).toBe(true);
  await writeFile(`${folder}/measurements.json`, JSON.stringify(records, null, 2));
});
