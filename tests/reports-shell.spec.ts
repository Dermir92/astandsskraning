import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { demoReports } from "../src/lib/fixtures";
import { EMPTY_DETAILS, type Report } from "../src/lib/model";
import { auditFocusContrast, auditRenderedContrast } from "./contrast-helpers";
import {
  reportIdentity,
  reportDestination,
  showFilters,
} from "./report-list-helpers";

const key = "astandsskraning-demo-v1";
async function seed(page: Page, reports: Report[]) {
  await page.addInitScript(
    ({ key, reports }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify({ version: 1, reports }));
    },
    { key, reports },
  );
}
async function openOverview(page: Page, title: string, keyboard = false) {
  const trigger = page.getByRole("button", {
    name: `Yfirlit: ${title}`,
    exact: true,
  });
  if (keyboard) {
    await trigger.focus();
    await page.keyboard.press("Enter");
  } else await trigger.click();
  const narrow = page.viewportSize()!.width <= 1099;
  const overview = narrow
    ? page.getByRole("dialog", { name: "Skýrsluyfirlit" })
    : page.getByRole("complementary", { name: "Yfirlit valinnar skýrslu" });
  await expect(
    overview.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  return { overview, trigger, narrow };
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function closeOverview(page: Page) {
  if (page.viewportSize()!.width <= 1099) await page.keyboard.press("Escape");
}

test("selection follows filters without losing focus or writing draft data", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Sýnigögn tilbúin", { exact: true }),
  ).toBeVisible();
  const before = await page.evaluate((key) => localStorage.getItem(key), key);
  const { overview, trigger, narrow } = await openOverview(
    page,
    "Dæmishlíð 8",
    true,
  );
  await expect(overview).toContainText("0 af 32 atriðum skráð");
  await expect(overview).toContainText("3 grunnupplýsingar vantar");
  if (!narrow) {
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
  }
  await closeOverview(page);
  if (narrow) await expect(trigger).toBeFocused();
  await showFilters(page);
  const asset = page.getByRole("combobox", {
    name: "Eignategund",
    exact: true,
  });
  await asset.focus();
  await asset.selectOption("vehicle");
  await expect(asset).toBeFocused();
  await expect(
    page.getByText("1 af 6 skýrslum", { exact: true }),
  ).toBeVisible();
  const sample = await openOverview(page, "Sýnibíll · SB-000");
  await expect(sample.overview).toContainText("þetta er ekki endanleg skýrsla");
  await expect(sample.overview.getByRole("progressbar")).toHaveCount(0);
  await closeOverview(page);
  await page
    .getByRole("textbox", { name: "Leita að eign eða heimilisfangi" })
    .fill("ekkert finnst");
  await expect(
    page.getByRole("heading", { name: "Engar skýrslur fundust" }),
  ).toBeVisible();
  if (!narrow)
    await expect(page.locator(".selected-report-context")).toHaveText(
      "Engin skýrsla valin.",
    );
  await page.getByRole("button", { name: "Hreinsa leit og síur" }).click();
  await expect(page.locator(".property-name:visible")).toHaveCount(6);
  if (!narrow)
    await expect(
      page.locator('.register-select[aria-pressed="true"]'),
    ).toHaveAttribute("aria-label", "Yfirlit: Sýnigata 14");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    before,
  );
});

test("all fixture destinations, combined filters and Icelandic group sorting remain correct", async ({
  page,
}) => {
  await page.goto("/");
  for (const [title, href] of [
    ["Sýnigata 14", "/skyrslur/syni-ibud/skraning"],
    ["Dæmishlíð 8", "/skyrslur/syni-hlid/upplysingar"],
    ["Sýnibíll · SB-000", "/skyrslur/syni-bill/yfirferd"],
    ["Sýnigeymsla 03", "/skyrslur/syni-geymsla/yfirferd"],
    ["Sýniskrifstofa", "/skyrslur/syni-atvinna/yfirferd"],
    ["Dæmisgata 22", "/skyrslur/syni-lokid/yfirferd"],
  ])
    await expect(reportDestination(page, title)).toHaveAttribute("href", href);
  await showFilters(page);
  await page
    .getByRole("combobox", { name: "Röðun skýrslna" })
    .selectOption("name");
  for (const list of await page.locator(".register-list").all()) {
    const names = await list
      .locator(".property-name:visible")
      .allTextContents();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "is")));
  }
  await page
    .getByRole("combobox", { name: "Eignategund", exact: true })
    .selectOption("apartment");
  await page
    .getByRole("textbox", { name: "Leita að eign eða heimilisfangi" })
    .fill("  kópavogur  ");
  await expect(page.locator(".property-name:visible")).toHaveText([
    "Dæmishlíð 8",
  ]);
  await expect(
    page.getByText("1 af 6 skýrslum", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hreinsa síur", exact: true }).click();
  await expect(page.locator(".property-name:visible")).toHaveCount(6);
  await noOverflow(page);
});

test("context reflects room edits, answers and temporary photos after returning to the list", async ({
  page,
}) => {
  await page.goto("/skyrslur/syni-ibud/rymi");
  await page
    .getByRole("textbox", { name: "Heiti rýmis 1", exact: true })
    .fill("Nýr gangur");
  await page.getByRole("button", { name: "Hefja ástandsskráningu" }).click();
  await page.goto("/skyrslur/syni-ibud/skraning?rymi=demo-bedroom-1");
  await page
    .getByRole("radio", { name: "Á ekki við", exact: true })
    .first()
    .check();
  const png = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 16;
      canvas.getContext("2d")!.fillRect(0, 0, 16, 16);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await page
    .getByLabel("Yfirlitsmyndir rýmis: velja myndir", { exact: true })
    .setInputFiles({ name: "rými.png", mimeType: "image/png", buffer: png });
  await expect(
    page.getByRole("img", { name: "Staðbundin forskoðun: rými.png" }),
  ).toBeVisible();
  await page
    .locator("main")
    .getByRole("link", { name: "Mínar skýrslur", exact: true })
    .click();
  const { overview } = await openOverview(page, "Sýnigata 14");
  await expect(overview).toContainText("25 af 53 atriðum skráð");
  await expect(overview).toContainText("5 rými án yfirlitsmyndar");
  await expect(
    overview.getByRole("link", { name: /Nýr gangur/ }),
  ).toBeVisible();
  await expect(overview).toContainText("28 ósvarað · 3 frávik");
  await closeOverview(page);
  await page.reload();
  const reloaded = await openOverview(page, "Sýnigata 14");
  await expect(reloaded.overview).toContainText("25 af 53 atriðum skráð");
  await expect(reloaded.overview).toContainText("6 rými án yfirlitsmyndar");
  await expect(
    reloaded.overview.getByRole("link", { name: /Nýr gangur/ }),
  ).toBeVisible();
  await reloaded.overview
    .getByRole("link", { name: "Halda áfram", exact: true })
    .click();
  await expect(page).toHaveURL(/\/skyrslur\/syni-ibud\/skraning/);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
});

test("empty storage, zero-room and zero-item drafts have honest context and recovery", async ({
  page,
}) => {
  const reports = demoReports().slice(0, 1);
  reports[0] = {
    ...reports[0],
    id: "no-rooms",
    title: "Tóm drög",
    details: { ...EMPTY_DETAILS },
    rooms: [],
  };
  reports.push({
    ...reports[0],
    id: "no-items",
    title: "Án atriða",
    rooms: [
      { id: "empty", name: "", type: "custom", items: [], observations: {} },
    ],
  });
  await seed(page, reports);
  await page.goto("/");
  let context = await openOverview(page, "Tóm drög");
  await expect(context.overview).toContainText("Engin rými valin.");
  await expect(context.overview.getByRole("progressbar")).toHaveCount(0);
  await expect(context.overview).not.toContainText(/NaN|Infinity|100%/);
  await expect(
    context.overview.getByRole("link", { name: "Opna drög", exact: true }),
  ).toHaveAttribute("href", "/skyrslur/no-rooms/upplysingar");
  await closeOverview(page);
  context = await openOverview(page, "Án atriða");
  await expect(context.overview).toContainText(
    "Atriðalisti vantar í valin rými.",
  );
  await expect(context.overview).toContainText("Heiti rýma vantar");
  await expect(context.overview).toContainText("Ónefnt rými");
  await expect(context.overview.getByRole("progressbar")).toHaveCount(0);
  await closeOverview(page);
  await page.evaluate(
    (key) =>
      localStorage.setItem(key, JSON.stringify({ version: 1, reports: [] })),
    key,
  );
  await page.reload();
  await expect(
    page.getByText("0 af 0 skýrslum", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Stofna skýrslu", exact: true }),
  ).toHaveAttribute("href", "/skyrslur/ny");
  await expect(page.getByRole("button", { name: /^Yfirlit:/ })).toHaveCount(0);
});

test("context modal contains focus, closes with Escape, restores focus and scrolls safely", async ({
  page,
}) => {
  // Exercise the sheet in all projects, including desktop-to-tablet resizing.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const { overview, trigger } = await openOverview(page, "Sýnigata 14", true);
  const close = overview.getByRole("button", { name: "Loka yfirliti" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  const last = overview.locator("a[href]").last();
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  for (let index = 0; index < 16; index++) {
    await page.keyboard.press("Tab");
    expect(
      await overview.evaluate((dialog) =>
        dialog.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await overview.evaluate((dialog) => {
    dialog.scrollTop = dialog.scrollHeight;
  });
  const closeBox = await close.boundingBox();
  expect(closeBox!.y).toBeGreaterThanOrEqual(0);
  expect(closeBox!.y + closeBox!.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await page.keyboard.press("Escape");
  await expect(overview).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await trigger.click();
  await overview.getByRole("button", { name: "Loka yfirliti" }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).toBeFocused();
});

test("selected, sample, modal, hover and focus states pass axe and rendered contrast", async ({
  page,
}, testInfo) => {
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
  for (const title of ["Sýnigata 14", "Dæmishlíð 8", "Sýnibíll · SB-000"]) {
    const { overview } = await openOverview(page, title, true);
    await audit(title);
    await overview.locator(".button-primary").hover();
    await audit(`${title}:hover`);
    const focus = await auditFocusContrast(
      page,
      page.viewportSize()!.width <= 1099
        ? ".context-dialog .button-primary"
        : ".selected-report-context .button-primary",
    );
    expect(focus.style).toBe("solid");
    expect(focus.width).toBeGreaterThanOrEqual(3);
    expect(focus.ratio).toBeGreaterThanOrEqual(3);
    await closeOverview(page);
  }
  await page
    .getByRole("button", { name: "Um sýniham", exact: true })
    .last()
    .click();
  await audit("sample-help");
  await page.keyboard.press("Escape");
  await page
    .getByRole("textbox", { name: "Leita að eign eða heimilisfangi" })
    .fill("ekkert");
  await audit("empty");
  await page.evaluate(
    (key) =>
      localStorage.setItem(key, '{"version":1,"reports":[{"bad":true}]}'),
    key,
  );
  await page.reload();
  await expect(page.locator(".storage-warning")).toBeVisible();
  await audit("storage-warning");
  const output = testInfo.outputPath("shell-contrast.json");
  await writeFile(output, JSON.stringify(audits, null, 2));
  await testInfo.attach("shell-contrast", {
    path: output,
    contentType: "application/json",
  });
});

test("long report content reflows at tablet widths and 200–400 percent equivalent viewport zoom", async ({
  page,
}, testInfo) => {
  const title =
    "Langt íslenskt heimilisfang með viðbótarupplýsingum um hús og íbúð · " +
    "X".repeat(130);
  const reports = demoReports();
  reports[0].details.address = title;
  reports[0].details.unit = "Íbúð með löngu heiti á fjórðu hæð";
  reports[0].rooms[0].name = "Langt rýmisheiti ".repeat(8);
  reports[0].rooms[1].observations.walls.description =
    "Löng lýsing á skemmd við dyrakarm. ".repeat(30);
  await seed(page, reports);
  await page.goto("/");
  for (const width of [1024, 768, 720, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    const { overview } = await openOverview(page, title, true);
    await noOverflow(page);
    expect(
      await overview.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`long-context-${width}.png`),
      fullPage: true,
    });
    await closeOverview(page);
  }
});

test("storage retry on reports preserves in-memory work and exposes the truthful save state", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreStorage: () => void }).restoreStorage =
      () => {
        Storage.prototype.setItem = original;
      };
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage disabled", "QuotaExceededError");
    };
  });
  await page.goto("/skyrslur/ny");
  await page.getByRole("button", { name: "Velja íbúð" }).click();
  await page
    .getByRole("textbox", { name: "Heimilisfang" })
    .fill("Minni varðveitt");
  await page
    .locator("main")
    .getByRole("link", { name: "Mínar skýrslur", exact: true })
    .click();
  await expect(page.locator(".storage-warning")).toContainText(
    "Breytingar eru aðeins í minni.",
  );
  await expect(page.locator(".topbar .save-status")).toHaveText(
    "Ekki tókst að vista í vafra",
  );
  await expect(reportIdentity(page, "Minni varðveitt")).toBeVisible();
  await noOverflow(page);
  await page.evaluate(() =>
    (window as unknown as { restoreStorage: () => void }).restoreStorage(),
  );
  await page.getByRole("button", { name: "Reyna vistun aftur" }).click();
  await expect(page.locator(".storage-warning")).toHaveCount(0);
  await expect(page.locator(".topbar .save-status")).toHaveText(
    "Vistað í þessum vafra",
  );
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(stored.version).toBe(1);
  expect(stored.reports[0].details.address).toBe("Minni varðveitt");
});
