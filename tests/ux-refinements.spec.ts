import { expect, test } from "@playwright/test";
import { demoReports } from "../src/lib/fixtures";
import { EMPTY_OBSERVATION } from "../src/lib/model";
import { showFilters } from "./report-list-helpers";

const searchName = "Leita að eign eða heimilisfangi";
async function enlargeText(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll<HTMLElement>("body, body *")].map((el) => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
    for (const { el, size } of sizes) el.style.fontSize = `${size * 2}px`;
  });
}

for (const [action, query] of [
  ["Hreinsa leit", "Sýnigata"],
  ["Hreinsa síur", "Dæmishlíð"],
  ["Hreinsa leit og síur", "ekkert finnst 84739"],
] as const) {
  test(`${action} restores search focus when its button disappears`, async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("textbox", { name: searchName });
    await showFilters(page);
    await page.getByRole("combobox", { name: "Röðun skýrslna" }).selectOption("name");
    if (action !== "Hreinsa leit") {
      await page.getByRole("combobox", { name: "Eignategund", exact: true }).selectOption("apartment");
    }
    for (const key of ["Enter", "Space"]) {
      await search.fill(query);
      const button = page.getByRole("button", { name: action, exact: true });
      await button.focus();
      await page.keyboard.press(key);
      await expect(button).toHaveCount(0);
      await expect(search).toBeFocused();
      await expect(search).toHaveValue("");
      await expect(page.locator(".property-name:visible")).toHaveCount(6);
      await expect(page.getByRole("combobox", { name: "Röðun skýrslna" })).toHaveValue("name");
      // The next tab continues from search, including when the clear button was removed.
      await page.keyboard.press("Tab");
      await expect(page.viewportSize()!.width <= 800
        ? page.getByRole("button", { name: /Sía og raða/ })
        : page.getByRole("combobox", { name: "Eignategund", exact: true })).toBeFocused();
    }
  });
}

test("visible results count is conditional while the live announcement survives resets and sort-only changes", async ({ page }) => {
  await page.goto("/");
  const total = page.locator(".reports-heading p");
  const announcement = page.locator('.register-heading [role="status"]');
  await expect(total).toHaveText("6 skýrslur");
  await expect(announcement).toHaveText("6 af 6 skýrslum");
  await expect(announcement).toHaveClass("sr-only");
  await expect(announcement).toHaveAttribute("aria-atomic", "true");
  const original = await announcement.elementHandle();
  await showFilters(page);
  await page.getByRole("combobox", { name: "Röðun skýrslna" }).selectOption("name");
  await expect(announcement).toHaveClass("sr-only");
  await page.getByRole("textbox", { name: searchName }).fill("Dæmishlíð");
  await expect(announcement).not.toHaveClass("sr-only");
  await expect(announcement).toHaveText("1 af 6 skýrslum");
  await page.getByRole("button", { name: "Hreinsa síur", exact: true }).click();
  await expect(announcement).toHaveClass("sr-only");
  await page.getByRole("combobox", { name: "Eignategund", exact: true }).selectOption("vehicle");
  await expect(announcement).not.toHaveClass("sr-only");
  await expect(announcement).toHaveText("1 af 6 skýrslum");
  await expect(total).toHaveText("6 skýrslur");
  expect(await original!.evaluate((el) => el === document.querySelector('.register-heading [role="status"]'))).toBe(true);
});

test("mobile sort explains groups and the existing preview target visibly says Yfirlit", async ({ page }) => {
  if (page.viewportSize()!.width > 800) await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto("/");
  await showFilters(page);
  const sort = page.getByRole("combobox", { name: "Röðun skýrslna" });
  await sort.selectOption("name");
  await expect(sort).toHaveAccessibleDescription("Raðað innan hópa · ólokið fyrst.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Sía og raða/ })).toContainText("Eftir heiti innan hópa");
  await expect(page.locator(".property-name:visible")).toHaveText([
    "Dæmishlíð 8", "Sýnigata 14", "Dæmisgata 22", "Sýnibíll · SB-000", "Sýnigeymsla 03", "Sýniskrifstofa",
  ]);
  const trigger = page.getByRole("button", { name: "Yfirlit: Sýnigata 14", exact: true });
  await expect(trigger.locator(".mobile-preview-cue")).toHaveText("Yfirlit");
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Skýrsluyfirlit" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("link", { name: "Halda áfram: Sýnigata 14", exact: true })).toHaveAttribute("href", "/skyrslur/syni-ibud/skraning");
});

test("deviation preview counts derive from data for zero, one, two, three and five deviations", async ({ page }) => {
  const reports = [0, 1, 2, 3, 5].map((count) => {
    const report = structuredClone(demoReports()[0]);
    report.id = `deviations-${count}`;
    report.details.address = `Frávik ${count}`;
    let remaining = count;
    for (const room of report.rooms) {
      room.observations = {};
      for (const item of room.items) {
        if (remaining-- > 0) room.observations[item.id] = {
          ...EMPTY_OBSERVATION, condition: "damaged", description: `Lýsing ${count}-${remaining}`,
        };
      }
    }
    return report;
  });
  await page.addInitScript((reports) => localStorage.setItem(
    "astandsskraning-demo-v1", JSON.stringify({ version: 1, reports }),
  ), reports);
  await page.goto("/");
  for (const count of [0, 1, 2, 3, 5]) {
    await page.getByRole("button", { name: `Yfirlit: Frávik ${count}`, exact: true }).click();
    const overview = page.viewportSize()!.width <= 1099
      ? page.getByRole("dialog", { name: "Skýrsluyfirlit" })
      : page.locator(".selected-report-context");
    const section = overview.locator(".context-section").filter({ has: page.getByRole("heading", { name: "Skráð frávik", exact: true }) });
    if (count === 0) await expect(section).toHaveCount(0);
    else {
      await expect(section.locator(".context-section-heading > span")).toHaveText(`Sýnir ${Math.min(2, count)} af ${count}`);
      await expect(section.locator(".context-deviations li")).toHaveCount(Math.min(2, count));
      await expect(overview.getByRole("link", { name: "Yfirferð skráningar", exact: true })).toHaveAttribute("href", `/skyrslur/deviations-${count}/yfirferd`);
    }
    if (page.viewportSize()!.width <= 1099) await page.keyboard.press("Escape");
  }
});

test("200 percent working text reflows with complete expanded select values at 360, 390 and 768 px", async ({ page }) => {
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await showFilters(page);
    const fields = page.locator(".mobile-filter-fields");
    expect(await fields.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(2);
    await page.getByRole("combobox", { name: "Eignategund", exact: true }).selectOption("commercial");
    await enlargeText(page);
    const clipped = await page.locator(".mobile-filter-fields select").evaluateAll((selects) => selects.flatMap((el) => {
      const select = el as HTMLSelectElement;
      const style = getComputedStyle(select);
      const canvas = document.createElement("canvas").getContext("2d")!;
      canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const text = select.selectedOptions[0].text;
      // Reserve the native arrow as well as both paddings and borders.
      const available = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 24;
      return canvas.measureText(text).width > available ? [text] : [];
    }));
    expect(clipped, `${width}px selected values`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Endurstilla leit og síur" }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".property-name:visible")).toHaveCount(6);
    await page.goto("/");
    await page.getByRole("button", { name: "Yfirlit: Sýnigata 14", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Skýrsluyfirlit" });
    await enlargeText(page);
    await expect(sheet.locator(".context-progress")).toHaveCSS("font-size", "28px");
    expect(await sheet.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await sheet.getByRole("heading", { name: "Skráð frávik" }).scrollIntoViewIfNeeded();
    await expect(sheet.getByText("Sýnir 2 af 3", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
