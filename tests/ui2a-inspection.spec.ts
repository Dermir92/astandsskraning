import { expect, test, type Page } from "@playwright/test";
import { auditInspectionA11y } from "./inspection-accessibility";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { demoReports } from "../src/lib/fixtures";
import { positionKey, navigationTargetId } from "../src/lib/inspection-navigation";
import { inspectionSectionStatus } from "../src/components/inspection-section-status";
import { meterSet, recordedMeter } from "./meter-readings-fixtures";
import { expandAssessment } from "./inspection-ui-helpers";

const base = "/skyrslur/syni-ibud";
const wall = (page: Page) => page.locator('[data-item="walls"]');
async function seed(page: Page, position?: { roomId: string; itemId: string | null }, report = demoReports()[0]) {
  await page.addInitScript(({ key, report, position, navKey }) => {
    if (!sessionStorage.getItem("ui2a-seeded")) {
      localStorage.setItem(key, JSON.stringify({ version: 1, reports: [report] }));
      if (position) localStorage.setItem(navKey, JSON.stringify({ version: 1, ...position }));
      sessionStorage.setItem("ui2a-seeded", "yes");
    }
  }, { key: STORAGE_KEY, report, position, navKey: positionKey(report.id) });
}
test("UI2A statuses preserve context uncertainty, missing answers, limitations, optional and retained facts", () => {
  const d = demoReports()[0].details;
  expect(inspectionSectionStatus(d).fire.short).toContain("Samhengi óstaðfest");
  expect(inspectionSectionStatus(d).meters.short).toBe("Ekki hafið");
  expect(inspectionSectionStatus({ ...d, inspectionContext: "residential_rental" }).fire.short).toBe("3 flokkar ósvaraðir");
  expect(inspectionSectionStatus({ ...d, inspectionContext: "standalone" }).fire.short).toBe("Valfrjálst · ósvarað");
  const limited = { smokeDetectors: { examination: "not_examined" as const }, extinguishers: { examination: "not_examined" as const }, escapeRoutes: { examination: "not_examined" as const } };
  expect(inspectionSectionStatus({ ...d, fireSafety: limited }).fire.short).toContain("takmörkun");
  expect(inspectionSectionStatus({ ...d, meterReadings: { mode: "optional" } }).meters.short).toBe("Valfrjálst · ekkert valið");
  expect(inspectionSectionStatus({ ...d, meterReadings: { mode: "inactive", electricity: recordedMeter() } }).meters.short).toBe("Varðveitt skráning");
  const active = { ...d, inspectionContext: "residential_rental" as const, meterReadings: { mode: "rental_initial" as const } };
  expect(inspectionSectionStatus(active).meters.short).toBe("2 svör vantar");
  expect(inspectionSectionStatus({ ...active, meterReadings: { ...meterSet("rental_initial"), factsPurpose: "optional" } }).meters.short).toBe("Þarf staðfestingu");
  expect(inspectionSectionStatus({ ...d, meterReadings: { mode: "optional", factsPurpose: "optional", electricity: recordedMeter({ readingStatus: "not_read" }) } }).meters.short).toContain("takmörkun");
  expect(inspectionSectionStatus({ ...d, meterReadings: { mode: "optional", factsPurpose: "optional", electricity: recordedMeter({ readingValue: "óvíst" }) } }).meters.short).toContain("yfirferð");
});

test("fresh starts at compact top; saved and explicit destinations retain focus without input stealing", async ({ page, context }) => {
  await seed(page);
  await page.goto(`${base}/skraning`);
  await expect(page.locator("[data-inspection-sections]")).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goto(`${base}/skraning?rymi=demo-living&atridi=walls`);
  await expect(wall(page).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  const note = wall(page).getByRole("textbox", { name: /^Athugasemd/ });
  await note.fill("Sýnigögn við frávik");
  await expect(note).toBeFocused();
  await page.keyboard.type(" · önnur setning");
  await expect(note).toBeFocused();
  const other = await context.newPage();
  await other.goto(`${base}/skraning`);
  await expect(wall(other).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(wall(other).getByRole("textbox", { name: /^Athugasemd/ })).toHaveValue("Sýnigögn við frávik · önnur setning");
  await other.close();
});

test("section trips preserve the exact live defect editor, photo input, undo state, report bytes and room origin", async ({ page }) => {
  await seed(page);
  await page.goto(`${base}/skraning?rymi=demo-living&atridi=walls`);
  await expect(wall(page).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  const picker = wall(page).getByLabel("Myndir við atriði: velja myndir", { exact: true });
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  await picker.setInputFiles({ name: "synimynd.png", mimeType: "image/png", buffer: image });
  await expect(wall(page).getByRole("img")).toBeVisible();
  await picker.evaluate(el => el.setAttribute("data-live-ui2a", "same"));
  const url = page.url();
  const raw = await page.evaluate(k => localStorage.getItem(k), STORAGE_KEY);
  const blob = await wall(page).getByRole("img").getAttribute("src");
  const note = wall(page).getByRole("textbox", { name: /^Athugasemd/ });
  await note.focus();
  for (const section of ["Brunavarnir", "Mælar"]) {
    await page.getByRole("navigation", { name: "Hlutar skráningar" }).getByRole("link", { name: new RegExp(`^${section}`) }).click();
    const id = section === "Mælar" ? "meter-readings" : "fire-safety";
    await expect(page.locator(`#${id}`)).toHaveJSProperty("open", true);
    await page.getByRole("navigation", { name: "Hlutar skráningar" }).getByRole("link", { name: /^Rými/ }).click();
    await expect(note).toBeFocused();
    await expect(picker).toHaveAttribute("data-live-ui2a", "same");
    await expect(wall(page).getByRole("img")).toHaveAttribute("src", blob!);
    expect(page.url()).toBe(url);
    expect(await page.evaluate(k => localStorage.getItem(k), STORAGE_KEY)).toBe(raw);
  }
  await expandAssessment(wall(page));
  await wall(page).getByRole("radio", { name: "Í lagi", exact: true }).click();
  await page.getByRole("dialog", { name: "Breyta virku fráviki?" }).getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
  await expect(wall(page).getByRole("button", { name: "Afturkalla breytingu", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Hlutar skráningar" }).getByRole("link", { name: /^Mælar/ }).click();
  await page.getByRole("navigation", { name: "Hlutar skráningar" }).getByRole("link", { name: /^Rými/ }).click();
  await expect(wall(page).getByRole("button", { name: "Afturkalla breytingu", exact: true })).toBeVisible();
});

test("room, fire and meter corrections keep their own URL contracts and return targets after section trips", async ({ page }) => {
  await seed(page);
  const cases = [
    { query: "rymi=demo-living&atridi=walls&fra=yfirferd&yfirferdRymi=demo-living&yfirferdAtridi=walls", target: navigationTargetId("review", "demo-living", "walls") },
    { query: "hluti=brunavarnir&flokkur=reykskynjarar&reitur=examination&fra=yfirferd", target: "review-fire-safety" },
    { query: "maelar=rafmagn&maelaReitur=applicability&fra=yfirferd", target: "review-meter-readings" },
  ];
  for (const c of cases) {
    await page.goto(`${base}/skraning?${c.query}`);
    await expect(page.locator("[data-inspection-sections]")).toBeVisible();
    const url = page.url();
    await page.getByRole("navigation", { name: "Hlutar skráningar" }).getByRole("link", { name: /^Brunavarnir/ }).click();
    await page.getByRole("navigation", { name: "Hlutar skráningar" }).getByRole("link", { name: /^Mælar/ }).click();
    expect(page.url()).toBe(url);
    await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
    await expect(page.locator(`[id="${c.target}"]`)).toBeInViewport();
  }
});

test("an unconfirmed meter-purpose preview survives section trips without remounting or committing facts", async ({ page }) => {
  const report = demoReports()[0];
  report.details.inspectionContext = "residential_rental";
  report.details.meterReadings = meterSet();
  await seed(page, undefined, report);
  await page.goto(`${base}/skraning?rymi=demo-living&atridi=walls`);
  const bar = page.getByRole("navigation", { name: "Hlutar skráningar" });
  await bar.getByRole("link", { name: /^Mælar/ }).click();
  await page.locator("#meter-readings summary").filter({ hasText: /^Tilgangur mælaskráningar$/ }).click();
  const raw = await page.evaluate(k => localStorage.getItem(k), STORAGE_KEY);
  await page.getByRole("button", { name: "Skrá mælastöður við afhendingu", exact: true }).click();
  const preview = page.locator("#meter-purpose-preview");
  await expect(preview).toBeVisible();
  await preview.evaluate(el => el.setAttribute("data-ui2a-live-preview", "same"));
  const url = page.url();
  await bar.getByRole("link", { name: /^Brunavarnir/ }).click();
  await bar.getByRole("link", { name: /^Rými/ }).click();
  await expect(wall(page).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  await bar.getByRole("link", { name: /^Mælar/ }).click();
  await expect(preview).toHaveAttribute("data-ui2a-live-preview", "same");
  expect(await page.evaluate(k => localStorage.getItem(k), STORAGE_KEY)).toBe(raw);
  expect(page.url()).toBe(url);
});

test("320px reflow, long room name, keyboard focus and one-action section access remain usable", async ({ page }) => {
  const report = demoReports()[0];
  const longName = "Svefnherbergi við suðurhlið með fataherbergi og aðgengi að svölum";
  report.rooms.find(room => room.id === "demo-bedroom-1")!.name = longName;
  await seed(page, undefined, report);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${base}/skraning?rymi=demo-bedroom-1&atridi=windows`);
  const bar = page.getByRole("navigation", { name: "Hlutar skráningar" });
  await expect(wall(page).locator(".checklist-toggle")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator(".room-heading h2")).toHaveText(longName);
  const select = page.getByRole("combobox", { name: "Velja rými", exact: true });
  await select.focus();
  await page.keyboard.press("Tab");
  // Header arrows precede the native select in DOM; the next focus target is
  // the first checklist control. Its complete bounding box clears the bar.
  await expect.poll(async () => page.evaluate(() => {
    const rect = document.activeElement!.getBoundingClientRect();
    const bottom = document.querySelector("[data-inspection-sections]")!.getBoundingClientRect().bottom;
    return rect.top >= bottom && rect.bottom <= innerHeight;
  })).toBe(true);
  const fire = bar.getByRole("link", { name: /^Brunavarnir/ });
  await fire.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#fire-safety")).toHaveJSProperty("open", true);
  await expect(page.locator("#fire-safety > summary")).toBeFocused();
  for (const key of ["Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    await expect.poll(() => page.evaluate(() => {
      const rect = document.activeElement!.getBoundingClientRect();
      const nav = document.querySelector("[data-inspection-sections]")!;
      const bottom = getComputedStyle(nav).position === "sticky" ? nav.getBoundingClientRect().bottom : 0;
      return rect.top >= bottom && rect.bottom <= innerHeight;
    })).toBe(true);
  }
  const axe = await auditInspectionA11y(page);
  expect(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
});
