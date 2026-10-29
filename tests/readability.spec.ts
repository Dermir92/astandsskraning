import { expect, test } from "@playwright/test";
import { editDefect } from "./inspection-ui-helpers";
import { writeFile } from "node:fs/promises";
import { auditFocusContrast, auditRenderedContrast } from "./contrast-helpers";

test("all six screens have readable text, placeholders and control boundaries", async ({
  page,
}, testInfo) => {
  const audits = [];
  for (const [name, url] of [
    ["reports", "/"],
    ["new", "/skyrslur/ny"],
    ["details", "/skyrslur/syni-ibud/upplysingar"],
    ["rooms", "/skyrslur/syni-ibud/rymi"],
    ["inspection", "/skyrslur/syni-ibud/skraning?rymi=demo-living"],
    ["review", "/skyrslur/syni-ibud/yfirferd"],
  ]) {
    await page.goto(url);
    await expect(page.locator("main h1")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const audit = await auditRenderedContrast(page);
    audits.push({ name, ...audit });
    expect(audit.failures, `${name}: computed text/control contrast`).toEqual(
      [],
    );
    expect(audit.typeFailures, `${name}: size and opacity`).toEqual([]);
  }
  const path = testInfo.outputPath("contrast-audit.json");
  await writeFile(path, JSON.stringify(audits, null, 2));
  await testInfo.attach("rendered-contrast", {
    path,
    contentType: "application/json",
  });
});

test("damage, form errors and disabled actions remain readable", async ({
  page,
}, testInfo) => {
  const audits = [];
  await page.goto("/skyrslur/syni-ibud/skraning?rymi=demo-living");
  await page.locator(".checklist-toggle").filter({ hasText: "Veggir" }).click();
  await editDefect(page.locator('.checklist-item[data-item="walls"]'));
  await expect(page.getByRole("textbox", { name: /^Lýsing/ })).toBeVisible();
  audits.push({ name: "damage", ...(await auditRenderedContrast(page)) });
  await page.screenshot({
    path: testInfo.outputPath("damage.png"),
    fullPage: true,
  });
  await page.goto("/skyrslur/syni-ibud/upplysingar");
  await page.getByRole("textbox", { name: "Póstnúmer" }).fill("ab");
  audits.push({ name: "validation", ...(await auditRenderedContrast(page)) });
  await page.screenshot({
    path: testInfo.outputPath("validation.png"),
    fullPage: true,
  });
  await page.goto("/skyrslur/ny");
  await page.getByRole("button", { name: "Velja íbúð" }).click();
  await page.getByRole("button", { name: "Velja rými" }).click();
  await page.getByRole("button", { name: "Bæta við", exact: true }).click();
  await expect(
    page.getByText("Skrifaðu heiti sérsniðins rýmis."),
  ).toBeVisible();
  for (let i = 0; i < 5; i++)
    await page.locator(".remove-room").first().click();
  await expect(
    page.getByRole("button", { name: "Hefja ástandsskráningu" }),
  ).toBeDisabled();
  audits.push({
    name: "disabled-and-error",
    ...(await auditRenderedContrast(page)),
  });
  await page.screenshot({
    path: testInfo.outputPath("disabled.png"),
    fullPage: true,
  });
  for (const audit of audits) {
    expect(audit.failures, audit.name).toEqual([]);
    expect(audit.typeFailures, audit.name).toEqual([]);
  }
  const path = testInfo.outputPath("operational-contrast.json");
  await writeFile(path, JSON.stringify(audits, null, 2));
  await testInfo.attach("operational-contrast", {
    path,
    contentType: "application/json",
  });
});

test("hover and keyboard focus remain visible with the stronger palette", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Fara beint í efni" });
  await expect(skipLink).toBeFocused();
  expect(await skipLink.evaluate((el) => getComputedStyle(el).clipPath)).toBe(
    "none",
  );
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.locator(".button-primary").first().hover();
  expect((await auditRenderedContrast(page)).failures).toEqual([]);
  await page.locator(".register-next").first().hover();
  expect((await auditRenderedContrast(page)).failures).toEqual([]);
  const focus = await auditFocusContrast(page, ".button-primary");
  expect(focus.style).toBe("solid");
  expect(focus.width).toBeGreaterThanOrEqual(3);
  expect(focus.offset).toBeGreaterThanOrEqual(2);
  expect(focus.ratio).toBeGreaterThanOrEqual(3);
  const searchFocus = await auditFocusContrast(page, ".search-field input");
  expect(searchFocus.style).toBe("solid");
  expect(searchFocus.ratio).toBeGreaterThanOrEqual(3);
});
