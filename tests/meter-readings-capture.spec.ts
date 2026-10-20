import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { MeterCapturePurpose, Report } from "../src/lib/model";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { meterCorrectionHref, meterFieldId } from "../src/lib/meter-navigation";
import { positionKey } from "../src/lib/inspection-navigation";
import { meterState } from "../src/lib/meter-readings";
import { is } from "../src/lib/locale/is";
import { extendedMeterReport, meterReport, meterSet, recordedMeter } from "./meter-readings-fixtures";

const t = is.meters;
const base = "/skyrslur/meter-case";
const metersPanel = (page: Page) => page.locator("#meter-readings");
const raw = (page: Page) => page.evaluate(k => localStorage.getItem(k), STORAGE_KEY);
const saved = async (page: Page): Promise<Report> => JSON.parse((await raw(page))!).reports.find((r: Report) => r.id === "meter-case");
async function seed(page: Page, report = meterReport(), destination = meterCorrectionHref(report.id)) {
  const document = JSON.stringify({ version: 1, envelopeExtra: { keep: [0, false] }, reports: [report] }, null, 2);
  const position = '{"version":1,"roomId":"legacy-room","itemId":"walls"}';
  await page.addInitScript(({ document, position, key, nav }) => {
    if (!sessionStorage.getItem("meter-seeded")) { localStorage.setItem(key, document); localStorage.setItem(nav, position); sessionStorage.setItem("meter-seeded", "yes"); }
  }, { document, position, key: STORAGE_KEY, nav: positionKey(report.id) });
  await page.goto(destination); await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  return document;
}
async function open(page: Page, selector: string) {
  const details = page.locator(selector); if (await details.getAttribute("open") === null) await details.locator(":scope > summary").click();
}
const utility = (page: Page, k = "electricity") => page.locator(`[data-meter-utility="${k}"]`);
async function radio(page: Page, field: "applicability" | "readingStatus", copy: string, k = "electricity") { await page.locator(`#${meterFieldId(k as "electricity" | "hotWater", field)}`).getByRole("radio", { name: copy, exact: true }).check(); }
async function capture(page: Page) { await open(page, "#meter-readings"); await metersPanel(page).getByRole("button", { name: t.only.electricity, exact: true }).click(); await open(page, '[data-meter-utility="electricity"]'); }
async function fillReading(page: Page, value = "00123,40", unit = " kWh ", date = " 2026-10-19 ") {
  await page.locator("#meter-electricity-readingValue").fill(value); await page.locator("#meter-electricity-unit").fill(unit); await page.locator("#meter-electricity-readingDate").fill(date);
}
async function purposeControls(page: Page) {
  await open(page, "#meter-readings");
  const summary = metersPanel(page).locator("summary").filter({ hasText: new RegExp(`^${t.changePurpose}$`) });
  const parent = summary.locator(".."); if (await parent.getAttribute("open") === null) await summary.click();
}
async function choosePurpose(page: Page, target: MeterCapturePurpose) {
  await purposeControls(page);
  await metersPanel(page).getByRole("button", { name: target === "optional" ? t.only.electricity : target === "rental_initial" ? t.startInitial : t.startReturn, exact: true }).last().click();
}

test("legacy disclosure, correction, reload and review never backfill or write report/position bytes", async ({ page }) => {
  const before = await seed(page); const position = await page.evaluate(k => localStorage.getItem(k), positionKey("meter-case"));
  await expect(metersPanel(page)).toHaveAttribute("open", "");
  await open(page, '[data-meter-utility="electricity"]'); await open(page, '[data-meter-utility="hotWater"]');
  expect(await raw(page)).toBe(before); await page.reload(); expect(await raw(page)).toBe(before);
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page.locator("#review-meter-readings")).toBeFocused(); expect(await raw(page)).toBe(before);
  expect((await saved(page)).details).not.toHaveProperty("meterReadings");
  expect(await page.evaluate(k => localStorage.getItem(k), positionKey("meter-case"))).toBe(position);
});
test("reselecting the same optional purpose and utility preserves exact storage and metadata", async ({ page }) => {
  const before = await seed(page, extendedMeterReport());
  const position = await page.evaluate(k => localStorage.getItem(k), positionKey("meter-case"));
  await choosePurpose(page, "optional");
  expect(await raw(page)).toBe(before);
  await expect(page.locator("#meter-purpose-preview")).toHaveCount(0);
  expect(await page.evaluate(k => localStorage.getItem(k), positionKey("meter-case"))).toBe(position);
});
for (const scenario of ["applicability", "readingStatus", "retained"] as const) for (const key of ["Enter", "Space"]) test(`clearing ${scenario} with ${key} restores focus to its unanswered radio group`, async ({ page }, info) => {
  const report = extendedMeterReport();
  if (scenario === "retained") report.details.meterReadings!.mode = "inactive";
  const field = scenario === "applicability" ? "applicability" : "readingStatus";
  await seed(page, report, meterCorrectionHref(report.id, "electricity", field));
  const group = page.locator(`#${meterFieldId("electricity", field)}${scenario === "retained" ? "-retained" : ""}`);
  const label = field === "applicability" ? t.applicabilityQuestion : `${t.statusQuestion}${scenario === "retained" ? " · varðveitt svar" : ""}`;
  await expect(group).toHaveAccessibleName(label);
  await expect(group.getByRole("radio", { checked: true })).toBeFocused();
  const url = page.url(); const position = await page.evaluate(k => localStorage.getItem(k), positionKey(report.id));
  const disclosures = await metersPanel(page).locator("details").evaluateAll(nodes => nodes.map(n => ({ question: n.getAttribute("data-meter-utility") ?? n.querySelector(":scope > summary")?.textContent, open: (n as HTMLDetailsElement).open })));
  await page.keyboard.press("Tab");
  await expect(group.getByRole("button", { name: `${t.clear} · ${label}`, exact: true })).toBeFocused();
  await page.keyboard.press(key);
  await expect(group.getByRole("radio").first()).toBeFocused();
  await expect(group.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(group.getByRole("button")).toHaveCount(0);
  const next = await saved(page);
  const { [field]: cleared, ...remaining } = report.details.meterReadings!.electricity!;
  expect(cleared).toBeDefined();
  expect(next.details.meterReadings).toEqual({ ...report.details.meterReadings, electricity: remaining });
  expect(page.url()).toBe(url);
  expect(await page.evaluate(k => localStorage.getItem(k), positionKey(report.id))).toBe(position);
  const afterDisclosures = await metersPanel(page).locator("details").evaluateAll(nodes => nodes.map(n => ({ question: n.getAttribute("data-meter-utility") ?? n.querySelector(":scope > summary")?.textContent, open: (n as HTMLDetailsElement).open })));
  for (const disclosure of disclosures) expect(afterDisclosures).toContainEqual(disclosure);
  const output = process.env.METER_FOCUS_REVIEW_DIR ?? info.outputPath("clear-focus"); await mkdir(output, { recursive: true });
  const screenshot = resolve(output, `${info.project.name}-${scenario}-${key}.png`);
  await page.screenshot({ path: screenshot }); await info.attach("cleared question focus", { path: screenshot, contentType: "image/png" });
  await info.attach("focus semantics", { body: JSON.stringify({ scenario, key, url, active: await group.getByRole("radio").first().evaluate(n => n.outerHTML), semantics: await group.ariaSnapshot(), positionUnchanged: true, retainedDataUnchanged: true }, null, 2), contentType: "application/json" });
  if (scenario === "retained") {
    await page.keyboard.press("Tab"); const input = page.locator("#meter-electricity-readingValue-retained");
    await expect(input).toBeFocused(); await page.keyboard.type("7"); await expect(input).toBeFocused();
    await expect(group.getByRole("radio", { checked: true })).toHaveCount(0);
  }
});
for (const key of ["Enter", "Space"]) test(`clearing the last retained fact with ${key} focuses the persistent utility summary`, async ({ page }, info) => {
  const report = extendedMeterReport();
  Object.assign(report.details.meterReadings!.electricity!, { applicability: "shared", readingStatus: "not_read", readingValue: undefined, unit: undefined, readingDate: undefined });
  await seed(page, report, meterCorrectionHref(report.id, "electricity", "readingStatus"));
  await expect(utility(page).getByRole("button", { name: t.confirmArrangement, exact: true })).toBeFocused();
  // Reach and open both retained disclosures using the keyboard from the correction guard.
  await page.keyboard.press("Tab"); await expect(utility(page).getByText(t.retained, { exact: true })).toBeFocused();
  await page.keyboard.press("Enter"); await page.keyboard.press("Tab");
  await expect(utility(page).getByText("Skoða og breyta varðveittum svörum", { exact: true })).toBeFocused();
  await page.keyboard.press("Enter"); await page.keyboard.press("Tab");
  const group = page.locator("#meter-electricity-readingStatus-retained");
  await expect(group.getByRole("radio", { checked: true })).toBeFocused();
  const url = page.url(); const position = await page.evaluate(k => localStorage.getItem(k), positionKey(report.id));
  await page.keyboard.press("Tab"); await expect(group.getByRole("button")).toBeFocused(); await page.keyboard.press(key);
  const summary = utility(page).locator(":scope > summary");
  await expect(summary).toBeFocused(); await expect(summary).toBeInViewport(); await expect(group).toHaveCount(0);
  await expect(utility(page).getByText(t.sharedDisclosure, { exact: true }).locator("..")).not.toHaveAttribute("open", "");
  const next = await saved(page); const expected = structuredClone(report.details.meterReadings!); delete expected.electricity!.readingStatus;
  expect(next.details.meterReadings).toEqual(expected); expect(meterState(next.details).hasAttention).toBe(false);
  expect(page.url()).toBe(url); expect(await page.evaluate(k => localStorage.getItem(k), positionKey(report.id))).toBe(position);
  await expect(utility(page).locator('input[type="radio"][value="shared"]')).toBeChecked();
  const screenshot = info.outputPath(`${info.project.name}-retained-last-fact-${key}.png`);
  await page.screenshot({ path: screenshot }); await info.attach("last retained fact focus", { path: screenshot, contentType: "image/png" });
  await info.attach("focus semantics", { body: JSON.stringify({ key, url, active: await summary.evaluate(n => n.outerHTML), semantics: await summary.ariaSnapshot(), positionUnchanged: true, retainedDataUnchanged: true }, null, 2), contentType: "application/json" });
});
test("electricity-only capture has explicit blank fields, preserves commas/zeros/units/date and leaves hot water absent", async ({ page }) => {
  await seed(page); await capture(page); await radio(page, "applicability", t.applicability.separate); await radio(page, "readingStatus", t.status.recorded);
  for (const field of ["readingValue", "unit", "readingDate"]) await expect(page.locator(`#meter-electricity-${field}`)).toHaveValue("");
  await fillReading(page); const report = await saved(page);
  expect(report.details.meterReadings).toMatchObject({ mode: "optional", factsPurpose: "optional", electricity: { factsApplicability: "separate", readingValue: "00123,40", unit: " kWh ", readingDate: " 2026-10-19 " } });
  expect(report.details.meterReadings).not.toHaveProperty("hotWater"); expect(meterState(report.details).actionCount).toBe(0);
  const before = await raw(page); await page.reload(); expect(await raw(page)).toBe(before);
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click(); await expect(page.locator("#review-meter-readings")).toContainText("00123,40");
  await expect(page.locator("#review-meter-readings")).toContainText(t.unselected);
});
test("hot-water-only activation and toggling do not create electricity requirements or lose answers", async ({ page }) => {
  await seed(page); await metersPanel(page).getByRole("button", { name: t.only.hotWater, exact: true }).click(); await open(page, '[data-meter-utility="hotWater"]');
  await radio(page, "applicability", t.applicability.unknown, "hotWater");
  await page.locator("#meter-hotWater-optionalCapture").uncheck(); expect(meterState((await saved(page)).details).actionCount).toBe(0);
  await page.locator("#meter-hotWater-optionalCapture").check(); expect((await saved(page)).details.meterReadings!.hotWater!.applicability).toBe("unknown");
  expect((await saved(page)).details.meterReadings).not.toHaveProperty("electricity");
});
for (const status of ["not_read", "unreadable", "inaccessible", "unknown"] as const) test(`current ${status} is a recorded limitation without reading or optional-field tasks`, async ({ page }) => {
  await seed(page, meterReport({ mode: "optional", factsPurpose: "optional", electricity: recordedMeter({ readingStatus: status, readingValue: "", unit: "", readingDate: "", meterIdentifier: undefined, note: undefined }) }));
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click(); const panel = page.locator("#review-meter-readings");
  await expect(panel).toContainText(t.status[status]); await expect(panel.getByRole("heading", { name: t.issues })).toHaveCount(0);
  expect(meterState((await saved(page)).details)).toMatchObject({ actionCount: 0, hasAttention: false });
});
test("shared applicability needs no reading but an optional shared claim needs its fields and scope label", async ({ page }) => {
  await seed(page); await capture(page); await radio(page, "applicability", t.applicability.shared);
  expect(meterState((await saved(page)).details).actionCount).toBe(0);
  await utility(page).getByText(t.sharedDisclosure, { exact: true }).click(); await radio(page, "readingStatus", t.status.recorded);
  expect(meterState((await saved(page)).details).actionCount).toBe(3); await fillReading(page, "000,50", "m³", "2026-10-18");
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click(); await expect(page.locator("#review-meter-readings")).toContainText(t.shared);
});
test("invalid raw values and calendar/future dates remain saved with accessible correction issues", async ({ page }) => {
  await seed(page, meterReport(meterSet()), meterCorrectionHref("meter-case", "electricity", "readingValue"));
  const value = page.locator("#meter-electricity-readingValue"); await expect(value).toBeFocused();
  await value.fill("not a reading"); await expect(value).toHaveAttribute("aria-invalid", "true"); await expect(value).toBeFocused();
  expect((await saved(page)).details.meterReadings!.electricity!.readingValue).toBe("not a reading");
  await value.fill("0"); await expect(value).toHaveAttribute("aria-invalid", "false");
  const date = page.locator("#meter-electricity-readingDate");
  for (const v of ["2026-02-29", "2999-01-01", "2026-1"]) { await date.fill(v); await expect(date).toHaveAttribute("aria-invalid", "true"); expect((await saved(page)).details.meterReadings!.electricity!.readingDate).toBe(v); }
  await date.fill("2026-10-19"); expect(meterState((await saved(page)).details).actionCount).toBe(0);
});
test("arrangement changes remain held over reload, require explicit confirmation and preserve unknown nested fields", async ({ page }) => {
  const report = extendedMeterReport(); await seed(page, report); await open(page, '[data-meter-utility="electricity"]');
  await radio(page, "applicability", t.applicability.shared); await expect(utility(page).getByRole("button", { name: t.confirmArrangement, exact: true })).toBeVisible();
  await expect(page.locator("#meter-electricity-readingStatus")).toHaveCount(0); const held = await saved(page);
  expect(held.details.meterReadings!.electricity).toEqual({ ...report.details.meterReadings!.electricity, applicability: "shared" });
  await page.goto(meterCorrectionHref("meter-case", "electricity", "readingStatus")); await expect(utility(page).getByRole("button", { name: t.confirmArrangement, exact: true })).toBeFocused();
  const rawHeld = await raw(page); await page.reload(); expect(await raw(page)).toBe(rawHeld);
  await utility(page).getByRole("button", { name: t.confirmArrangement, exact: true }).click(); const confirmed = await saved(page);
  expect(confirmed.details.meterReadings!.electricity).toEqual({ ...held.details.meterReadings!.electricity, factsApplicability: "shared" });
  expect(meterState(confirmed.details).actionCount).toBe(0);
  await radio(page, "applicability", t.applicability.separate); expect(meterState((await saved(page)).details).actionCount).toBe(1);
});
for (const from of ["optional", "rental_initial", "rental_return"] as const) for (const to of (["optional", "rental_initial", "rental_return"] as const).filter(p => p !== from)) test(`purpose ${from} → ${to} requires same-event correction without changing raw facts`, async ({ page }) => {
  const report = meterReport(meterSet(from)); Object.assign(report.details, { inspectionContext: "residential_rental", inspectionType: to === "rental_return" ? "final" : "initial" });
  const before = await seed(page, report); await choosePurpose(page, to); await expect(page.locator("#meter-purpose-preview")).toBeFocused(); expect(await raw(page)).toBe(before);
  await metersPanel(page).getByRole("button", { name: t.correctPurpose, exact: true }).last().click(); const next = await saved(page);
  expect(next.details.meterReadings).toMatchObject({ mode: to, factsPurpose: to, electricity: report.details.meterReadings!.electricity });
  expect(next.details.meterReadings!.electricity!.readingDate).toBe(" 2026-10-19 ");
});
test("genuinely new events use the ordinary new-report flow without touching or copying the old set", async ({ page }) => {
  const report = extendedMeterReport(); Object.assign(report.details, { inspectionContext: "residential_rental", inspectionType: "final" });
  const before = await seed(page, report); await choosePurpose(page, "rental_return"); await metersPanel(page).getByRole("link", { name: t.newEvent, exact: true }).click();
  await expect(page).toHaveURL(/skyrslur\/ny$/); expect(await raw(page)).toBe(before);
  await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  const reports = JSON.parse((await raw(page))!).reports as Report[]; expect(reports.find(r => r.id === "meter-case")).toEqual(report); expect(reports.find(r => r.id !== "meter-case")!.details).not.toHaveProperty("meterReadings");
});
test("purpose candidate cancellation/reload are read-only and stale previews cannot confirm changed data", async ({ page }) => {
  const report = meterReport(meterSet()); Object.assign(report.details, { inspectionContext: "residential_rental", inspectionType: "initial" });
  const before = await seed(page, report); await choosePurpose(page, "rental_initial"); await metersPanel(page).getByRole("button", { name: t.cancel, exact: true }).click(); expect(await raw(page)).toBe(before);
  await choosePurpose(page, "rental_initial"); await page.reload(); expect(await raw(page)).toBe(before); await expect(page.locator("#meter-purpose-preview")).toHaveCount(0);
  await choosePurpose(page, "rental_initial"); await open(page, '[data-meter-utility="electricity"]'); await page.locator("#meter-electricity-readingValue").fill("999,99");
  await expect(metersPanel(page).getByRole("button", { name: t.correctPurpose, exact: true }).last()).toBeDisabled(); expect((await saved(page)).details.meterReadings!.mode).toBe("optional");
  await metersPanel(page).getByRole("button", { name: t.refresh, exact: true }).click(); await metersPanel(page).getByRole("button", { name: t.correctPurpose, exact: true }).last().click();
  expect((await saved(page)).details.meterReadings).toMatchObject({ mode: "rental_initial", factsPurpose: "rental_initial", electricity: { readingValue: "999,99" } });
});
test("cleared-facts metadata does not obstruct new empty purpose/applicability choices or initialize tags on read", async ({ page }) => {
  const report = extendedMeterReport(); Object.assign(report.details, { inspectionContext: "residential_rental", inspectionType: "final" });
  for (const k of ["electricity", "hotWater"] as const) Object.assign(report.details.meterReadings![k]!, { readingStatus: undefined, readingValue: "", unit: "", readingDate: "" });
  await seed(page, report); await choosePurpose(page, "rental_return"); await expect(page.locator("#meter-purpose-preview")).toHaveCount(0);
  expect((await saved(page)).details.meterReadings!.factsPurpose).toBe("optional");
  await open(page, '[data-meter-utility="electricity"]'); await radio(page, "applicability", t.applicability.shared); await expect(utility(page).getByRole("button", { name: t.confirmArrangement })).toHaveCount(0);
  expect((await saved(page)).details.meterReadings!.electricity!.factsApplicability).toBe("separate");
  await utility(page).getByText(t.sharedDisclosure, { exact: true }).click(); await radio(page, "readingStatus", t.status.not_read);
  expect((await saved(page)).details.meterReadings).toMatchObject({ factsPurpose: "rental_return", electricity: { factsApplicability: "shared", meterIdentifier: "00042" } });
});
test("clearing all facts during a purpose preview requires a fresh snapshot but preserves unused associations", async ({ page }) => {
  const report = meterReport(meterSet()); Object.assign(report.details, { inspectionContext: "residential_rental", inspectionType: "initial" });
  await seed(page, report); await choosePurpose(page, "rental_initial"); await open(page, '[data-meter-utility="electricity"]');
  for (const field of ["readingValue", "unit", "readingDate"]) await page.locator(`#meter-electricity-${field}`).fill("");
  await page.locator("#meter-electricity-readingStatus").getByRole("button", { name: /^Hreinsa svar/ }).click();
  const confirm = metersPanel(page).getByRole("button", { name: t.correctPurpose, exact: true }).last(); await expect(confirm).toBeDisabled();
  await metersPanel(page).getByRole("button", { name: t.refresh, exact: true }).click(); await confirm.click();
  await expect(page.locator("#meter-purpose-preview")).toHaveCount(0);
  const next = (await saved(page)).details;
  expect(next.meterReadings).toMatchObject({ mode: "rental_initial", factsPurpose: "optional", electricity: { factsApplicability: "separate", readingValue: "", unit: "", readingDate: "", meterIdentifier: report.details.meterReadings!.electricity!.meterIdentifier, note: report.details.meterReadings!.electricity!.note } });
  expect(meterState(next).issues.every(i => i.kind !== "confirmation")).toBe(true);
});
test("active meter issues integrate with global attention and resolving them removes only their contribution", async ({ page }) => {
  const set = meterSet(); set.electricity!.unit = "";
  await seed(page, meterReport(set));
  // Eliminate the existing independent missing-room-photo cause through its real UI.
  const overview = page.getByLabel("Yfirlitsmyndir rýmis: velja myndir", { exact: true });
  const bytes = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 64; return canvas.toDataURL("image/png").split(",")[1]; });
  await overview.setInputFiles({ name: "synthetic-meter-overview.png", mimeType: "image/png", buffer: Buffer.from(bytes, "base64") });
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click(); await expect(page.locator(".review-state")).toHaveClass(/review-state-attention/);
  await page.locator("#review-meter-readings").getByRole("link", { name: /Einingu vantar/ }).click(); await expect(page.locator("#meter-electricity-unit")).toBeFocused();
  await page.locator("#meter-electricity-unit").fill("kWh"); await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page.locator(".review-state")).toHaveClass(/review-state-ready/); await expect(page.locator("#review-meter-readings")).toBeFocused();
});
test("meter corrections preserve history and room position, re-enter after ordinary navigation and work with zero rooms", async ({ page }) => {
  const report = meterReport(meterSet()); report.details.meterReadings!.electricity!.unit = "";
  const before = await seed(page, report, `${base}/yfirferd`); const position = await page.evaluate(k => localStorage.getItem(k), positionKey(report.id));
  await page.locator("#review-meter-readings").getByRole("link", { name: /Einingu vantar/ }).click(); await expect(page.locator("#meter-electricity-unit")).toBeFocused();
  await page.goBack(); await expect(page.locator("#review-meter-readings")).toBeVisible(); await page.goForward(); await expect(page.locator("#meter-electricity-unit")).toBeFocused();
  await page.evaluate(url => history.pushState(null, "", url), `${base}/skraning?rymi=legacy-room&atridi=walls`);
  await page.evaluate(url => history.pushState(null, "", url), meterCorrectionHref(report.id, "electricity", "unit")); await expect(page.locator("#meter-electricity-unit")).toBeFocused();
  expect(await raw(page)).toBe(before); expect(await page.evaluate(k => localStorage.getItem(k), positionKey(report.id))).toBe(position);
});
test("zero-room, inactive, malformed and mixed correction targets do not activate or write data", async ({ page }) => {
  const report = meterReport(meterSet()); report.rooms = []; const before = await seed(page, report, meterCorrectionHref(report.id, "electricity", "unit"));
  await expect(page.locator("#meter-electricity-unit")).toBeFocused(); await page.reload(); expect(await raw(page)).toBe(before);
  for (const extra of ["&rymi=missing", "&maelar=heitt-vatn", "&unexpected=1"]) {
    await page.goto(meterCorrectionHref(report.id) + extra); await expect(metersPanel(page)).toBeFocused(); await expect(metersPanel(page)).toContainText(t.invalidTarget); expect(await raw(page)).toBe(before);
  }
  await page.goto(meterCorrectionHref(report.id) + "&hluti=brunavarnir"); await expect(page.locator("#fire-safety")).toBeFocused(); expect(await raw(page)).toBe(before);
  await page.goto(meterCorrectionHref(report.id, "hotWater", "readingValue")); await expect(metersPanel(page)).toBeFocused(); expect(await raw(page)).toBe(before);
});
test("failed meter writes preserve pending raw input/extensions for retry without correction focus stealing", async ({ page }) => {
  await seed(page, extendedMeterReport(), meterCorrectionHref("meter-case", "electricity", "readingValue")); const before = await raw(page);
  await page.evaluate(() => { const original = Storage.prototype.setItem; (window as unknown as { restoreMeter: () => void }).restoreMeter = () => { Storage.prototype.setItem = original; }; Storage.prototype.setItem = function(k, v) { if (k === "astandsskraning-demo-v1") throw Error("synthetic quota"); return original.call(this, k, v); }; });
  await page.locator("#meter-electricity-readingValue").fill("000,75"); await expect(page.locator("#meter-electricity-readingValue")).toBeFocused(); await expect(page.locator(".storage-warning")).toContainText("Breytingar eru aðeins í minni"); expect(await raw(page)).toBe(before);
  await page.evaluate(() => (window as unknown as { restoreMeter: () => void }).restoreMeter()); await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  const document = JSON.parse((await raw(page))!); expect(document.envelopeExtra).toEqual({ keep: [0, false] }); expect(document.reports[0].details.meterReadings.electricity).toMatchObject({ readingValue: "000,75", future: { keep: [0, false, { text: "óbreytt" }] } });
});

test("inactive corrections focus retained controls without activation, confirmation or metadata writes", async ({ page }) => {
  const report = extendedMeterReport(); report.details.meterReadings!.mode = "inactive";
  const before = await seed(page, report, meterCorrectionHref(report.id, "electricity", "readingValue"));
  await expect(page.locator("#meter-electricity-readingValue-retained")).toBeFocused();
  expect(await raw(page)).toBe(before); expect(meterState((await saved(page)).details).actionCount).toBe(0);
  await page.keyboard.press("Tab"); await expect(page.locator("#meter-electricity-unit-retained")).toBeFocused();
  const position = await page.evaluate(k => localStorage.getItem(k), positionKey(report.id));
  await page.reload(); await expect(page.locator("#meter-electricity-readingValue-retained")).toBeFocused(); expect(await raw(page)).toBe(before);
  expect(await page.evaluate(k => localStorage.getItem(k), positionKey(report.id))).toBe(position);
});

test("purpose and arrangement guards resolve independently through accessible correction actions", async ({ page }) => {
  const set = meterSet(); delete set.factsPurpose; delete set.electricity!.factsApplicability;
  const before = await seed(page, meterReport(set), meterCorrectionHref("meter-case", "electricity", "readingValue"));
  await expect(page.locator("#meter-purpose-guard")).toBeFocused(); expect(await raw(page)).toBe(before);
  await page.locator("#meter-purpose-guard").click(); await expect(page.locator("#meter-purpose-preview")).toBeFocused();
  await metersPanel(page).getByRole("button", { name: t.correctPurpose, exact: true }).last().click();
  expect((await saved(page)).details.meterReadings!.factsPurpose).toBe("optional"); expect((await saved(page)).details.meterReadings!.electricity!.factsApplicability).toBeUndefined();
  await utility(page).getByRole("button", { name: t.confirmArrangement, exact: true }).click();
  await expect(page.locator("#meter-electricity-readingStatus").getByRole("radio", { name: t.status.recorded, exact: true })).toBeFocused();
  expect(meterState((await saved(page)).details).actionCount).toBe(0);
});

test("an unrelated active purpose guard cannot steal focus from unselected retained or malformed targets", async ({ page }) => {
  const report = extendedMeterReport(); delete report.details.meterReadings!.factsPurpose;
  const before = await seed(page, report, meterCorrectionHref(report.id, "hotWater", "readingValue"));
  await expect(page.locator("#meter-hotWater-readingValue-retained")).toBeFocused(); expect(await raw(page)).toBe(before);
  expect(meterState((await saved(page)).details).issues).toEqual([expect.objectContaining({ field: "purpose" })]);
  await page.goto(`${base}/skraning?maelar=rafmagn`); await expect(metersPanel(page)).toBeFocused(); expect(await raw(page)).toBe(before);
});

test("native keyboard radios, disclosures and linked help support capture without pointer actions", async ({ page }) => {
  await seed(page, meterReport({ mode: "optional", electricity: { optionalCapture: true } }));
  const separate = page.locator("#meter-electricity-applicability").getByRole("radio", { name: t.applicability.separate, exact: true });
  await expect(separate).toBeFocused(); await page.keyboard.press("Space"); await page.keyboard.press("ArrowDown");
  expect((await saved(page)).details.meterReadings!.electricity!.applicability).toBe("shared");
  await expect(page.locator("#meter-electricity-applicability")).toHaveAttribute("aria-describedby", "meter-electricity-applicability-hint");
  const sharedSummary = utility(page).locator("summary").filter({ hasText: new RegExp(`^${t.sharedDisclosure}$`) });
  await sharedSummary.focus(); await page.keyboard.press("Enter"); await page.keyboard.press("Tab");
  const recorded = page.locator("#meter-electricity-readingStatus").getByRole("radio", { name: t.status.recorded, exact: true });
  await expect(recorded).toBeFocused(); await page.keyboard.press("Space"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  await expect(page.locator("#meter-electricity-readingValue")).toBeFocused(); await page.keyboard.type("00123,40");
  expect((await saved(page)).details.meterReadings!.electricity!.readingValue).toBe("00123,40");
});

test("five-width mobile, keyboard, axe and 200% text verification with review screenshots", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Five-width/text/axe audit runs once."); test.setTimeout(240_000);
  const output = process.env.METER_REVIEW_DIR ?? info.outputPath("meter-screenshots"); await mkdir(output, { recursive: true });
  const report = extendedMeterReport(); await seed(page, report, meterCorrectionHref(report.id, "electricity", "readingValue"));
  const audit = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  };
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto(meterCorrectionHref(report.id, "electricity", "readingValue")); await expect(page.locator("#meter-electricity-readingValue")).toBeFocused();
    await audit(); await page.keyboard.press("Tab"); await expect(page.locator("#meter-electricity-unit")).toBeFocused();
    for (const control of await metersPanel(page).locator("label:has(input),button,summary").all()) { if (!await control.isVisible()) continue; const box = (await control.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44); }
    await page.screenshot({ path: resolve(output, `after-${width}-capture.png`), fullPage: true });
    await page.goto(`${base}/yfirferd`); await expect(page.locator("#review-meter-readings")).toBeVisible(); await audit(); await page.screenshot({ path: resolve(output, `after-${width}-review.png`), fullPage: true });
    for (const route of [meterCorrectionHref(report.id, "electricity", "readingValue"), `${base}/yfirferd`]) {
      await page.goto(route); await expect(page.locator(route.includes("skraning") ? "#meter-electricity-readingValue" : "#review-meter-readings")).toBeVisible();
      await page.evaluate(() => { const sizes = [...document.querySelectorAll<HTMLElement>("body *")].map(e => ({ e, size: parseFloat(getComputedStyle(e).fontSize) })); sizes.forEach(({ e, size }) => { e.style.fontSize = `${size * 2}px`; }); });
      await audit(); await page.screenshot({ path: resolve(output, `after-${width}-${route.includes("skraning") ? "capture" : "review"}-text-200.png`), fullPage: true });
    }
  }
});
