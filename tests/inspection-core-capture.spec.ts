import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { coreFields, legacyCoreReport } from "./inspection-core-fixtures";
import type { Report } from "../src/lib/model";

const base = "/skyrslur/core-legacy";
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
async function seed(page: Page, report: Report = legacyCoreReport()) {
  const document = JSON.stringify({ version: 1, reports: [report] }, null, 2);
  await page.addInitScript(({ document, key }) => {
    if (!sessionStorage.getItem("core-seeded")) {
      localStorage.setItem(key, document); localStorage.setItem("core-sentinel", "unchanged"); sessionStorage.setItem("core-seeded", "1");
    }
  }, { document, key: STORAGE_KEY });
  await page.goto(`${base}/upplysingar`);
  await expect(page.getByLabel("Heimilisfang")).toHaveValue(report.details.address);
  return document;
}
async function fillCore(page: Page) {
  await page.getByLabel("Tengsl við íbúðarleigu").selectOption("standalone");
  await page.getByLabel("Dagsetning skoðunar").fill("2026-10-16");
  await page.getByLabel("Nafn skráningaraðila").fill("Sýni Þór Jónsdóttir");
  await page.getByLabel("Hvað var skoðað?").fill("Veggir í stofu.\nGluggar opnaðir þar sem aðgengi var til staðar.");
}

test("new drafts start with unknown core values and remain saveable without completing them", async ({ page }) => {
  await page.goto("/skyrslur/ny"); await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  await expect(page.getByLabel("Tengsl við íbúðarleigu")).toHaveValue("");
  const saved = JSON.parse((await raw(page))!).reports[0];
  for (const field of coreFields) expect(saved.details[field]).toBe("");
  await page.getByRole("button", { name: "Velja rými", exact: true }).click();
  await expect(page).toHaveURL(/\/rymi$/);
  await page.reload(); expect(JSON.parse((await raw(page))!).reports[0].details).toEqual(saved.details);
});

test("legacy v1 opening, review, reload and missing-field navigation do not rewrite or infer values", async ({ page }) => {
  const original = await seed(page);
  await expect(page.getByLabel("Tengsl við íbúðarleigu")).toHaveValue("");
  for (const name of ["Dagsetning skoðunar", "Nafn skráningaraðila", "Hvað var skoðað?", "Takmarkanir skoðunar"]) await expect(page.getByLabel(name)).toHaveValue("");
  expect(await raw(page)).toBe(original);
  await page.goto(`${base}/yfirferd`);
  await expect(page.getByText("Takmarkanir óskráðar", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tengsl við íbúðarleigu", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dagsetning afhendingar", exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole("link", { name: "Nafn skráningaraðila", exact: true }).click();
  await expect(page.getByLabel("Nafn skráningaraðila")).toBeFocused();
  expect(await raw(page)).toBe(original);
  for (const field of coreFields) expect(JSON.parse((await raw(page))!).reports[0].details).not.toHaveProperty(field);
});

test("all core fields round-trip; explicit clearing and whitespace remain unknown", async ({ page }) => {
  const legacy = legacyCoreReport(); await seed(page, legacy); await fillCore(page);
  await page.getByLabel("Takmarkanir skoðunar").fill("Geymsla óaðgengileg; loftræsting ekki prófuð.");
  await page.reload();
  await expect(page.getByLabel("Dagsetning skoðunar")).toHaveValue("2026-10-16");
  await expect(page.getByLabel("Nafn skráningaraðila")).toHaveValue("Sýni Þór Jónsdóttir");
  await page.goto(`${base}/yfirferd`);
  await expect(page.locator(".core-prose").last()).toHaveText("Geymsla óaðgengileg; loftræsting ekki prófuð.");
  const saved = JSON.parse((await raw(page))!);
  expect(saved.version).toBe(1); expect(saved.reports[0].rooms).toEqual(legacy.rooms);
  expect(saved.reports[0].details.deliveryDate).toBe(legacy.details.deliveryDate);
  await page.getByRole("link", { name: "Breyta skoðun og umfangi", exact: true }).click();
  await page.getByLabel("Dagsetning skoðunar").fill(""); await page.getByLabel("Nafn skráningaraðila").fill("  ");
  await page.getByLabel("Hvað var skoðað?").fill(""); await page.getByLabel("Takmarkanir skoðunar").fill("");
  await page.getByRole("button", { name: "Aftur í yfirferð", exact: true }).click();
  await expect(page.locator("#review-core-details")).toBeFocused();
  for (const name of ["Dagsetning skoðunar", "Nafn skráningaraðila", "Umfang skoðunar"]) await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(page.getByText("Takmarkanir óskráðar", { exact: true })).toBeVisible();
});

test("context switches retain rental data with a visible view/edit disclosure and explicit unknown", async ({ page }) => {
  const report = legacyCoreReport(); report.details.inspectionContext = "residential_rental"; await seed(page, report);
  await expect(page.getByLabel("Dagsetning afhendingar")).toBeHidden();
  await page.locator(".rental-disclosure > summary").filter({ hasText: "Afhending og húsgögn" }).click();
  await expect(page.getByLabel("Dagsetning afhendingar")).toBeVisible();
  await page.getByLabel("Tengsl við íbúðarleigu").selectOption("standalone");
  const disclosure = page.locator(".core-extras"); await expect(disclosure.locator(":scope > summary")).toContainText("Varðveittar leiguupplýsingar");
  await disclosure.locator(":scope > summary").click();
  await expect(page.getByLabel("Dagsetning afhendingar")).toHaveValue("2026-10-16");
  await page.locator(".core-notes > summary").click();
  await expect(page.getByLabel("Athugasemdir um íbúð eða afhendingu")).toHaveValue(report.details.notes);
  await page.getByLabel("Dagsetning afhendingar").fill("2026-10-20");
  await page.getByLabel("Tengsl við íbúðarleigu").selectOption(""); await page.reload();
  await expect(page.getByLabel("Tengsl við íbúðarleigu")).toHaveValue("");
  const saved = JSON.parse((await raw(page))!).reports[0].details;
  expect(saved.deliveryDate).toBe("2026-10-20"); expect(saved.furnished).toBe("partly"); expect(saved.notes).toBe(report.details.notes); expect(saved.inspectionType).toBe("initial"); expect(saved.role).toBe("tenant");
});

test("future and malformed dates remain visible and saveable without claiming a performed inspection", async ({ page }) => {
  const report = legacyCoreReport(); report.details.inspectionDate = "2026-02-30"; await seed(page, report);
  await expect(page.getByLabel("Dagsetning skoðunar")).toHaveValue("2026-02-30");
  await expect(page.locator("#inspectionDate-error")).toContainText("ekki gild");
  await page.getByLabel("Dagsetning skoðunar").fill("2099-12-31");
  await expect(page.locator("#inspectionDate-error")).toContainText("staðfestir ekki að skoðun hafi farið fram");
  await page.getByRole("button", { name: "Velja rými", exact: true }).click();
  await expect(page).toHaveURL(`${base}/rymi`);
  await page.goto(`${base}/yfirferd`); await page.reload();
  await expect(page.locator(".core-summary")).toContainText("31. des. 2099");
  await expect(page.getByRole("link", { name: "Dagsetning skoðunar þarfnast yfirferðar", exact: true })).toBeVisible();
  expect(JSON.parse((await raw(page))!).reports[0].details.inspectionDate).toBe("2099-12-31");
});

test("long Icelandic attribution and multiline scope survive reload and narrow review without truncation", async ({ page }) => {
  await seed(page); await fillCore(page);
  const name = "Sýni Þór Jónsdóttir ".repeat(12);
  const scope = "Aðgengilegir veggfletir voru skoðaðir.\n".repeat(80);
  const limitations = "Geymsla var óaðgengileg. ".repeat(40);
  await page.getByLabel("Nafn skráningaraðila").fill(name); await page.getByLabel("Hvað var skoðað?").fill(scope); await page.getByLabel("Takmarkanir skoðunar").fill(limitations);
  await page.reload(); await expect(page.getByLabel("Nafn skráningaraðila")).toHaveValue(name); await expect(page.getByLabel("Hvað var skoðað?")).toHaveValue(scope);
  await page.goto(`${base}/yfirferd`); await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.locator(".core-prose").first().textContent()).toBe(scope); expect(await page.locator(".core-prose").last().textContent()).toBe(limitations);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("standalone and unknown context keep drafts usable without handover, furniture or role", async ({ page }) => {
  const report = legacyCoreReport(); Object.assign(report.details, { role: "", deliveryDate: "", furnished: "" });
  await seed(page, report); await fillCore(page);
  await page.goto(`${base}/yfirferd`);
  await expect(page.getByRole("heading", { name: "Grunnupplýsingar vantar", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Breyta skoðun og umfangi", exact: true }).click();
  await page.getByLabel("Tengsl við íbúðarleigu").selectOption("residential_rental");
  await page.getByRole("radio", { name: "Sjálfstæð skráning", exact: true }).check();
  await expect(page.getByText(/staðfestir ekki samkomulag/)).toBeVisible();
  await page.getByRole("button", { name: "Aftur í yfirferð", exact: true }).click();
  await expect(page.getByRole("link", { name: "Hlutverk stofnanda", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hvort húsgögn fylgi", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dagsetning afhendingar", exact: true })).toHaveCount(0);
  await expect(page.getByText(/ekki fullbúin leiguúttekt/)).toBeVisible();
});

test("correction links focus the exact control after reload, typing keeps focus, and return is fixed", async ({ page }) => {
  await seed(page); await page.goto(`${base}/yfirferd`);
  await page.getByRole("link", { name: "Umfang skoðunar", exact: true }).click();
  await expect(page).toHaveURL(`${base}/upplysingar?fra=yfirferd&reitur=scopeDescription`);
  await page.reload();
  const scope = page.getByLabel("Hvað var skoðað?"); await expect(scope).toBeFocused();
  await scope.pressSequentially("Veggir í stofu."); await expect(scope).toBeFocused();
  await page.getByRole("button", { name: "Aftur í yfirferð", exact: true }).click();
  await expect(page.locator("#review-core-details")).toBeFocused();
  await page.goBack(); await expect(scope).toHaveValue("Veggir í stofu.");
  await page.goto(`${base}/upplysingar?fra=https://example.com&reitur=recorderName`);
  await expect(page.getByRole("button", { name: "Aftur í yfirferð", exact: true })).toHaveCount(0);
});

for (const context of ["standalone", "", undefined] as const) {
  test(`retained handover and furniture are optional context for ${context === undefined ? "legacy absent context" : context || "explicit unknown context"}`, async ({ page }) => {
    const report = legacyCoreReport();
    if (context !== undefined) report.details.inspectionContext = context;
    const original = await seed(page, report);
    await page.goto(`${base}/yfirferd`);
    const property = page.locator(".review-property").first();
    const optional = page.getByRole("region", { name: "Aðrar upplýsingar", exact: true });
    await expect(property.locator(":scope > .property-details")).not.toContainText("Afhending");
    await expect(property.locator(":scope > .property-details")).not.toContainText("Húsgögn");
    await expect(optional.getByRole("heading", { level: 3 })).toHaveText("Aðrar upplýsingar");
    await expect(optional).toContainText("Valfrjálsar samhengisupplýsingar; ekki krafa um útfyllingu.");
    await expect(optional).toContainText(report.details.deliveryDate);
    await expect(optional).toContainText("Fylgja að hluta");
    await expect(page.getByRole("link", { name: "Dagsetning afhendingar", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Hvort húsgögn fylgi", exact: true })).toHaveCount(0);
    await page.reload();
    const edit = optional.getByRole("link", { name: "Breyta afhendingu og húsgögnum" });
    await edit.focus(); await expect(edit).toBeFocused();
    expect(await edit.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
    expect((await edit.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await edit.press("Enter");
    await expect(page.getByLabel("Dagsetning afhendingar")).toBeFocused();
    await expect(page.getByLabel("Dagsetning afhendingar")).toHaveValue(report.details.deliveryDate);
    await expect(page.getByRole("radio", { name: "Að hluta", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Aftur í yfirferð", exact: true }).click();
    await expect(page.locator("#review-core-details")).toBeFocused();
    expect(await raw(page)).toBe(original);
  });
}

test("review presentation follows rental, standalone and unknown switches while all other values survive", async ({ page }) => {
  const report = legacyCoreReport(); report.details.inspectionContext = "residential_rental";
  await seed(page, report);
  for (const context of ["residential_rental", "standalone", "", "residential_rental"] as const) {
    await page.goto(`${base}/upplysingar`);
    await page.getByLabel("Tengsl við íbúðarleigu").selectOption(context);
    await page.goto(`${base}/yfirferd`); await page.reload();
    const property = page.locator(".review-property").first();
    const optional = page.getByRole("region", { name: "Aðrar upplýsingar", exact: true });
    if (context === "residential_rental") {
      await expect(optional).toHaveCount(0);
      await expect(property.locator(":scope > .property-details")).toContainText("Afhending");
      await expect(property.locator(":scope > .property-details")).toContainText("Fylgja að hluta");
    } else {
      await expect(optional).toBeVisible();
      await expect(optional).toContainText("2026-10-16");
      await expect(optional).toContainText("Fylgja að hluta");
    }
    const saved = JSON.parse((await raw(page))!);
    expect(saved.version).toBe(1);
    expect(saved.reports[0].details).toEqual({ ...report.details, inspectionContext: context });
    expect(saved.reports[0].rooms).toEqual(report.rooms);
  }
});

test("empty optional context stays compact; furniture-only data is editable; rental missing prompts remain", async ({ page }) => {
  const report = legacyCoreReport(); Object.assign(report.details, { inspectionContext: "standalone", deliveryDate: "", furnished: "" });
  await seed(page, report); await page.goto(`${base}/yfirferd`);
  await expect(page.getByRole("region", { name: "Aðrar upplýsingar", exact: true })).toHaveCount(0);
  await page.goto(`${base}/upplysingar`);
  await page.locator(".core-extras summary").click();
  await page.getByRole("radio", { name: "Að hluta", exact: true }).check();
  await page.goto(`${base}/yfirferd`);
  const optional = page.getByRole("region", { name: "Aðrar upplýsingar", exact: true });
  await expect(optional).toContainText("Fylgja að hluta");
  await expect(optional.getByText("Afhending", { exact: true })).toHaveCount(0);
  await optional.getByRole("link", { name: "Breyta afhendingu og húsgögnum" }).click();
  await expect(page.getByRole("radio", { name: "Já", exact: true })).toBeFocused();
  await page.getByLabel("Tengsl við íbúðarleigu").selectOption("residential_rental");
  await page.getByRole("button", { name: "Aftur í yfirferð", exact: true }).click();
  await expect(optional).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Dagsetning afhendingar", exact: true })).toBeVisible();
  expect(JSON.parse((await raw(page))!).reports[0].details.furnished).toBe("partly");
});

test("optional review context is accessible and reflows at mobile, desktop and enlarged text sizes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Context/width combinations are audited once.");
  const report = legacyCoreReport();
  Object.assign(report.details, { inspectionContext: "standalone", inspectionDate: "2026-10-16", recorderName: "Sýni Þór Jónsdóttir", scopeDescription: "Aðgengilegir veggfletir í stofu voru skoðaðir.", scopeLimitations: "Geymsla var óaðgengileg." });
  await seed(page, report);
  for (const context of ["standalone", ""] as const) {
    await page.goto(`${base}/upplysingar`);
    await page.getByLabel("Tengsl við íbúðarleigu").selectOption(context);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/yfirferd`);
      await expect(page.getByRole("region", { name: "Aðrar upplýsingar", exact: true })).toBeVisible();
      const before = await raw(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(audit.violations).toEqual([]); expect(audit.incomplete).toEqual([]);
      if (width !== 320) {
        const prefix = `artifacts/phase-1b3b1/final-ux/${context || "unknown"}-${width}`;
        await page.locator(".review-property").first().screenshot({ path: `${prefix}-review-area.png` });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({ path: `${prefix}-review.png`, fullPage: true });
      }
      expect(await raw(page)).toBe(before);
    }
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`${base}/yfirferd`);
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll<HTMLElement>("main, main *")].map(el => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
    for (const { el, size } of sizes) el.style.fontSize = `${size * 2}px`;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const optional = page.getByRole("region", { name: "Aðrar upplýsingar", exact: true });
  await expect(optional.getByRole("link", { name: "Breyta afhendingu og húsgögnum" })).toBeVisible();
  await optional.screenshot({ path: "artifacts/phase-1b3b1/final-ux/unknown-320-text-200-review-area.png" });
});

test("core controls and warnings reflow, support keyboard and pass axe at requested widths", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Five-width audit is run once.");
  const report = legacyCoreReport(); report.details.inspectionDate = "2099-01-01";
  await seed(page, report);
  for (const width of [320,360,390,768,1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["upplysingar", "yfirferd"]) {
      await page.goto(`${base}/${route}`); await expect(page.locator("main h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze()).violations).toEqual([]);
    }
  }
  await page.goto(`${base}/upplysingar`);
  const context = page.getByLabel("Tengsl við íbúðarleigu"); await context.focus(); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await expect(context).toHaveValue("standalone");
  expect(await context.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
  await page.setViewportSize({ width: 320, height: 900 });
  for (const route of ["upplysingar", "yfirferd"]) {
    await page.goto(`${base}/${route}`); await expect(page.locator("main h1")).toBeVisible();
    await page.evaluate(() => {
      const sizes = [...document.querySelectorAll<HTMLElement>("main, main *")].map(el => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
      for (const { el, size } of sizes) el.style.fontSize = `${size * 2}px`;
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.radio-option, .review-footer .button').evaluateAll(elements => elements.every(el => el.scrollWidth <= el.clientWidth + 1))).toBe(true);
    if (route === "upplysingar") {
      expect(await page.locator('#inspectionContext').evaluate((el: HTMLSelectElement) => {
        const canvas = document.createElement('canvas'); const context = canvas.getContext('2d')!;
        context.font = getComputedStyle(el).font;
        return context.measureText(el.selectedOptions[0].text).width <= el.clientWidth - 40;
      })).toBe(true);
    }
    await page.screenshot({ path: `artifacts/phase-1b3b1/after-320-${route}-text-200.png`, fullPage: true });
  }
});
