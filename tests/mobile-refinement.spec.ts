import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { auditFocusContrast, auditRenderedContrast } from "./contrast-helpers";
import { reportDestination } from "./report-list-helpers";

test("mobile controls reflow at narrow and zoom-equivalent viewport widths", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  for (const width of [720, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const toggle = page.getByRole("button", { name: /Sía og raða/ });
    await toggle.click();
    await page
      .getByRole("combobox", { name: "Staða", exact: true })
      .selectOption("reviewed");
    await page
      .getByRole("combobox", { name: "Eignategund", exact: true })
      .selectOption("commercial");
    await page
      .getByRole("combobox", { name: "Röðun skýrslna" })
      .selectOption("name");
    await expect(toggle).toContainText("2 virkar síur");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("#mobile-report-filters")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    const contrast = await auditRenderedContrast(page);
    expect(contrast.failures).toEqual([]);
    expect(contrast.typeFailures).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`filters-reflow-${width}.png`),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
  }
});

test("mobile starts with one creation action, direct search and several scannable reports", async ({
  page,
}) => {
  await page.goto("/");
  if (page.viewportSize()!.width > 800) {
    await expect(page.getByRole("button", { name: /Sía og raða/ })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("complementary", { name: "Yfirlit valinnar skýrslu" }),
    ).toBeVisible();
    return;
  }
  await expect(
    page.getByRole("link", { name: "Ný skýrsla", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Um sýniham", exact: true }),
  ).toHaveText("Sýnihamur");
  await expect(page.locator(".topbar .save-status")).toBeVisible();
  const search = page.getByRole("textbox", {
    name: "Leita að eign eða heimilisfangi",
  });
  await expect(search).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Sía og raða/ }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.locator(".property-name:visible")).toHaveCount(6);
  const rows = await page.locator(".report-entry").evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, height: box.height };
    }),
  );
  expect(rows[0].top).toBeLessThan(330);
  expect(
    rows.filter(
      (row) => row.top >= 0 && row.bottom <= page.viewportSize()!.height,
    ).length,
  ).toBeGreaterThanOrEqual(3);
  expect(Math.max(...rows.map((row) => row.height))).toBeLessThan(140);
  await expect(page.locator(".register-progress:visible")).toHaveText([
    "24/53 skráð",
  ]);
  for (const selector of [
    ".reports-heading .button",
    ".demo-pill",
    ".mobile-filter-toggle",
    ".register-mobile-property",
    ".register-next",
  ]) {
    for (const target of await page
      .locator(selector)
      .filter({ visible: true })
      .all())
      expect(
        (await target.boundingBox())!.height,
        selector,
      ).toBeGreaterThanOrEqual(44);
  }
});

test("mobile filter disclosure works by keyboard and announces active filters and sorting", async ({
  page,
}) => {
  if (page.viewportSize()!.width > 800)
    await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".reports-heading .button")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("textbox", { name: "Leita að eign eða heimilisfangi" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  const toggle = page.getByRole("button", { name: /Sía og raða/ });
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  const status = page.getByRole("combobox", { name: "Staða", exact: true });
  await expect(status).toBeFocused();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(status).toHaveValue("draft");
  await page.keyboard.press("Tab");
  const asset = page.getByRole("combobox", {
    name: "Eignategund",
    exact: true,
  });
  await expect(asset).toBeFocused();
  await asset.selectOption("apartment");
  await expect(toggle).toContainText("2 virkar síur");
  await expect(
    page.getByText("1 af 6 skýrslum", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  const sort = page.getByRole("combobox", { name: "Röðun skýrslna" });
  await expect(sort).toBeFocused();
  await sort.selectOption("name");
  await expect(toggle).toContainText("Eftir heiti");
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toContainText("2 virkar síur");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Endurstilla leit og síur" }).click();
  await expect(status).toHaveValue("all");
  await expect(asset).toHaveValue("all");
  await expect(sort).toHaveValue("name");
  await expect(toggle).not.toContainText("virk");
  await expect(page.locator(".property-name:visible")).toHaveCount(6);
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
});

test("mobile report names open quick context and labelled actions directly open existing destinations", async ({
  page,
}) => {
  if (page.viewportSize()!.width > 800)
    await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");
  const title = page.getByRole("button", {
    name: "Yfirlit: Sýnigata 14",
    exact: true,
  });
  await expect(title).toHaveAttribute("aria-haspopup", "dialog");
  await expect(title).toHaveAccessibleDescription(
    /Heiti skýrslu opnar stutt yfirlit/,
  );
  await expect(title).toHaveAccessibleDescription(
    /101 Reykjavík · 0201 · 2. hæð/,
  );
  await title.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: "Skýrsluyfirlit" });
  const close = sheet.getByRole("button", { name: "Loka yfirliti" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(
    await sheet.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(title).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  for (const [name, suffix] of [
    ["Sýnigata 14", "/syni-ibud/skraning"],
    ["Dæmishlíð 8", "/syni-hlid/upplysingar"],
    ["Sýnibíll · SB-000", "/syni-bill/yfirferd"],
  ]) {
    const next = reportDestination(page, name);
    await expect(next).toContainText(
      name.startsWith("Sýnibíll")
        ? "Skoða sýniskýrslu"
        : name.startsWith("Dæmishlíð")
          ? "Opna drög"
          : "Halda áfram",
    );
    await next.click();
    await expect(page).toHaveURL(new RegExp(suffix + "$"));
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .locator("main")
      .getByRole("link", { name: "Mínar skýrslur", exact: true })
      .click();
  }
});

test("mobile filters, active states, demo help and sheet retain contrast and axe semantics", async ({
  page,
}, testInfo) => {
  if (page.viewportSize()!.width > 800)
    await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");
  const audits: ({ name: string } & Awaited<
    ReturnType<typeof auditRenderedContrast>
  >)[] = [];
  async function audit(name: string) {
    const contrast = await auditRenderedContrast(page);
    audits.push({ name, ...contrast });
    expect(contrast.failures, name).toEqual([]);
    expect(contrast.typeFailures, name).toEqual([]);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      axe.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      })),
      name,
    ).toEqual([]);
  }
  await audit("collapsed-controls");
  const toggle = page.getByRole("button", { name: /Sía og raða/ });
  await toggle.focus();
  const focus = await auditFocusContrast(page, ".mobile-filter-toggle");
  expect(focus.width).toBeGreaterThanOrEqual(3);
  expect(focus.ratio).toBeGreaterThanOrEqual(3);
  await toggle.click();
  await audit("expanded-controls-disabled-reset");
  await page
    .getByRole("combobox", { name: "Staða", exact: true })
    .selectOption("draft");
  await page
    .getByRole("combobox", { name: "Eignategund", exact: true })
    .selectOption("apartment");
  await toggle.click();
  await toggle.hover();
  await audit("active-collapsed-controls-hover");
  await page
    .getByRole("button", { name: "Yfirlit: Dæmishlíð 8", exact: true })
    .click();
  await audit("draft-sheet");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Um sýniham", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Notaðu eingöngu tilbúin gögn",
  );
  await audit("demo-help");
  await page.keyboard.press("Escape");
  const output = testInfo.outputPath("mobile-refinement-contrast.json");
  await writeFile(output, JSON.stringify(audits, null, 2));
  await testInfo.attach("mobile-refinement-contrast", {
    path: output,
    contentType: "application/json",
  });
});
