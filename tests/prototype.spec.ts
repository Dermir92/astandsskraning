import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { reportIdentity, showFilters } from "./report-list-helpers";

async function createReport(page: Page) {
  await page.goto("/skyrslur/ny");
  await page.getByRole("button", { name: "Velja íbúð" }).click();
  await expect(
    page.getByRole("heading", { name: "Upplýsingar um íbúð", exact: true }),
  ).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
async function checkA11y(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      help: v.help,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
}

test("report search, status and asset filters", async ({ page }) => {
  await page.goto("/");
  await expect(reportIdentity(page, "Sýnigata 14")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Leita að eign eða heimilisfangi" })
    .fill("Dæmishlíð");
  await expect(reportIdentity(page, "Dæmishlíð 8")).toBeVisible();
  await expect(reportIdentity(page, "Sýnigata 14")).toHaveCount(0);
  await page.getByRole("button", { name: "Hreinsa leit", exact: true }).click();
  await showFilters(page);
  await page
    .getByRole("combobox", { name: "Eignategund", exact: true })
    .selectOption("vehicle");
  await expect(reportIdentity(page, "Sýnibíll · SB-000")).toBeVisible();
  if (
    await page.getByRole("combobox", { name: "Staða", exact: true }).isVisible()
  )
    await page
      .getByRole("combobox", { name: "Staða", exact: true })
      .selectOption("draft");
  else await page.getByRole("button", { name: "Drög", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Engar skýrslur fundust" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hreinsa leit og síur" }).click();
  await page
    .getByRole("combobox", { name: "Röðun skýrslna" })
    .selectOption("name");
  await noOverflow(page);
});

test("new report includes four types, and incomplete drafts survive reload", async ({
  page,
}) => {
  await page.goto("/skyrslur/ny");
  for (const name of [
    "Íbúðarhúsnæði",
    "Ökutæki",
    "Geymsla / bílskúr",
    "Atvinnuhúsnæði",
  ])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await expect(page.getByText("Í undirbúningi", { exact: true })).toHaveCount(
    3,
  );
  await page.getByRole("button", { name: "Velja íbúð" }).click();
  await page
    .getByRole("textbox", { name: "Heimilisfang" })
    .fill("Prófunargata 7");
  await page.getByRole("textbox", { name: "Póstnúmer" }).fill("ab");
  await expect(
    page.getByText("Póstnúmer þarf að vera þrír tölustafir, t.d. 101."),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Heimilisfang" })).toHaveValue(
    "Prófunargata 7",
  );
  await expect(page.getByRole("textbox", { name: "Póstnúmer" })).toHaveValue(
    "ab",
  );
  await page.getByRole("button", { name: "Velja rými" }).click();
  await expect(
    page.getByRole("heading", { name: "Veldu rýmin sem verða skoðuð" }),
  ).toBeVisible();
});

test("full creation to review, room edits, damage and session-only photos", async ({
  page,
}) => {
  await createReport(page);
  await page
    .getByRole("radio", { name: "Upphafsskráning", exact: true })
    .check();
  await page
    .getByRole("textbox", { name: "Heimilisfang" })
    .fill("Prófunargata 9");
  await page.getByRole("textbox", { name: "Póstnúmer" }).fill("101");
  await page.getByRole("textbox", { name: "Sveitarfélag" }).fill("Reykjavík");
  await page.getByRole("textbox", { name: "Íbúðarnúmer / hæð" }).fill("0101");
  await page
    .getByRole("combobox", { name: "Hlutverk stofnanda" })
    .selectOption("tenant");
  await page.getByLabel("Dagsetning afhendingar").fill("2026-10-20");
  await page.getByRole("radio", { name: "Nei", exact: true }).check();
  await page.getByRole("button", { name: "Velja rými" }).click();
  await page
    .getByRole("button", { name: "Fjölga: Svefnherbergi", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Heiti rýmis 1", exact: true })
    .fill("Gangur");
  await page
    .getByRole("textbox", { name: "Bæta við sérsniðnu rými" })
    .fill("Vinnuherbergi");
  await page.getByRole("button", { name: "Bæta við", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Heiti rýmis 7", exact: true }),
  ).toHaveValue("Vinnuherbergi");
  await page.getByRole("button", { name: "Hefja ástandsskráningu" }).click();
  await expect(
    page.getByRole("heading", { name: "Gangur", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await page.locator(".checklist-toggle").first().click();
  await page.getByRole("radio", { name: "Í lagi", exact: true }).check();
  await page.getByRole("radio", { name: "Hreint", exact: true }).check();
  await expect(page.getByText("1 af 59", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Skemmt", exact: true }).check();
  await page
    .getByRole("combobox", { name: "Tegund skemmdar / galla" })
    .selectOption("Rispa");
  await page.getByRole("textbox", { name: "Staðsetning" }).fill("Við útidyr");
  await page
    .getByRole("textbox", { name: /^Lýsing/ })
    .fill("Sýnileg 5 cm rispa á gólfi.");
  await page
    .getByRole("textbox", { name: /^Athugasemd/ })
    .fill("Skoða aftur við afhendingu.");
  const png = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 16;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#25685f";
      ctx.fillRect(0, 0, 16, 16);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await page
    .getByLabel("Myndir af fráviki: velja myndir", { exact: true })
    .setInputFiles({
      name: "synimynd.png",
      mimeType: "image/png",
      buffer: png,
    });
  await expect(
    page.getByRole("img", { name: "Staðbundin forskoðun: synimynd.png" }),
  ).toBeVisible();
  await noOverflow(page);
  await checkA11y(page);
  await page.getByRole("link", { name: "Næsta rými", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Stofa", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Fyrra rými", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Gangur", exact: true }),
  ).toBeVisible();
  await page.locator(".checklist-toggle").filter({ hasText: "Gólfefni" }).click();
  await expect(
    page.getByRole("radio", { name: "Skemmt", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("link", { name: "Yfirferð", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Yfirferð skráningar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Sýnileg 5 cm rispa á gólfi.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Skoða aftur við afhendingu.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Grunnupplýsingar vantar", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText("Sýnileg 5 cm rispa á gólfi.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Mynd af fráviki vantar", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Breyta skráningu: Gangur", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Gangur", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
});

test("unknown and not applicable answers stay distinct, and clearing works", async ({
  page,
}) => {
  await createReport(page);
  await page.getByRole("button", { name: "Velja rými" }).click();
  await page.getByRole("button", { name: "Hefja ástandsskráningu" }).click();
  await page.locator(".checklist-toggle").first().click();
  await page
    .getByRole("radio", { name: "Ekki skoðað", exact: true })
    .first()
    .check();
  await page
    .getByRole("radio", { name: "Ekki skoðað", exact: true })
    .last()
    .check();
  await page
    .getByRole("radio", { name: "Í lagi", exact: true })
    .isChecked()
    .then((value) => expect(value).toBe(false));
  await page
    .getByRole("radio", { name: "Á ekki við", exact: true })
    .first()
    .check();
  await expect(
    page.getByRole("group", { name: "Þrif", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Yfirferð", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: "45 atriði þarfnast athygli",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Aftur í skráningu", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Forstofa", exact: true }),
  ).toBeVisible();
  const resumedFloor = page.locator(".checklist-toggle").filter({ hasText: "Gólfefni" });
  await expect(resumedFloor).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Hreinsa svör", exact: true }).click();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(page.getByText("0 af 46", { exact: true })).toBeVisible();
});

test("unreadable image gives a clear error without a false preview", async ({
  page,
}) => {
  await page.goto("/skyrslur/syni-ibud/skraning?rymi=demo-living");
  await page.locator("summary").filter({ hasText: "Yfirlitsmyndir rýmis" }).click();
  await page
    .getByLabel("Yfirlitsmyndir rýmis: velja myndir", { exact: true })
    .setInputFiles({
      name: "skemmd-skrá.png",
      mimeType: "image/png",
      buffer: Buffer.from("invalid image"),
    });
  await expect(
    page.getByRole("alert").filter({ hasText: "ekki tókst að lesa myndina" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Staðbundin forskoðun/ }),
  ).toHaveCount(0);
});

test("removing a room with answers needs explicit confirmation and preserves other rooms", async ({
  page,
}) => {
  await page.goto("/skyrslur/syni-ibud/rymi");
  await page
    .getByRole("button", { name: "Fjarlægja Stofa", exact: true })
    .click();
  await expect(
    page.getByText("Svör og myndaforskoðanir í „Stofa“ verða fjarlægð."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hætta við", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Heiti rýmis 2", exact: true }),
  ).toHaveValue("Stofa");
  await page
    .getByRole("button", { name: "Fjarlægja Stofa", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Fjarlægja rými", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Heiti rýmis 2", exact: true }),
  ).toHaveValue("Eldhús");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Heiti rýmis 2", exact: true }),
  ).toHaveValue("Eldhús");
  await page.goto("/skyrslur/syni-ibud/yfirferd");
  await expect(
    page.getByText("Yfirborð borðplötu er slitið meðfram brún vasks."),
  ).toBeVisible();
});

test("local storage write failure never claims a successful save", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage disabled", "QuotaExceededError");
    };
  });
  await createReport(page);
  await page
    .getByRole("textbox", { name: "Heimilisfang" })
    .fill("Minni eingöngu");
  await expect(page.locator(".storage-warning")).toContainText(
    "Breytingar eru aðeins í minni.",
  );
  await expect(
    page
      .locator("main")
      .getByText("Ekki tókst að vista í vafra", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Velja rými" }).click();
  await page.getByRole("link", { name: "Upplýsingar", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Heimilisfang" })).toHaveValue(
    "Minni eingöngu",
  );
});

test("invalid stored data is handled without overwriting it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "astandsskraning-demo-v1",
      '{"version":1,"reports":[{"bad":true}]}',
    );
  });
  await page.goto("/");
  await expect(page.locator(".storage-warning")).toContainText(
    "Ekki tókst að lesa staðbundin drög.",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("astandsskraning-demo-v1")),
  ).toBe('{"version":1,"reports":[{"bad":true}]}');
  await expect(reportIdentity(page, "Sýnigata 14")).toBeVisible();
});

test("unknown report shows recovery action", async ({ page }) => {
  await page.goto("/skyrslur/unknown/upplysingar");
  await expect(
    page.getByRole("heading", { name: "Skýrslan fannst ekki" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Fara í mínar skýrslur", exact: true }),
  ).toBeVisible();
});

test("six main screens pass automated accessibility and fit the viewport", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const screens = [
    ["reports", "/"],
    ["new", "/skyrslur/ny"],
    ["details", "/skyrslur/syni-ibud/upplysingar"],
    ["rooms", "/skyrslur/syni-ibud/rymi"],
    ["inspection", "/skyrslur/syni-ibud/skraning?rymi=demo-living"],
    ["review", "/skyrslur/syni-ibud/yfirferd"],
  ];
  for (const [name, path] of screens) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await noOverflow(page);
    await checkA11y(page);
    await page.screenshot({
      path: testInfo.outputPath(`${name}.png`),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test("keyboard navigation has visible focus and can change an answer", async ({
  page,
}) => {
  await page.goto("/skyrslur/syni-ibud/skraning?rymi=demo-bedroom-1");
  await page.locator(".checklist-toggle").first().click();
  const radio = page.getByRole("radio", { name: "Í lagi", exact: true });
  await radio.focus();
  await expect(radio).toBeFocused();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: "Notkunarmerki", exact: true }),
  ).toBeChecked();
  expect(
    await page
      .locator(".answer-option:has(input:focus-visible)")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
});

test("finishing the last item keeps the selected room open", async ({
  page,
}) => {
  await createReport(page);
  await page.getByRole("button", { name: "Velja rými" }).click();
  await page.getByRole("button", { name: "Hefja ástandsskráningu" }).click();
  for (const name of [
    "Gólfefni",
    "Veggir",
    "Loft",
    "Gluggar",
    "Hurðir og læsingar",
    "Ljós og rofar",
    "Skápar",
  ]) {
    await page.locator(".checklist-toggle").filter({ hasText: name }).click();
    await page
      .getByRole("radio", { name: "Á ekki við", exact: true })
      .first()
      .check();
  }
  await expect(
    page.getByRole("heading", { name: "Forstofa", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("7 af 46", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Næsta rými", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Stofa", exact: true }),
  ).toBeVisible();
});

test("intermediate screen widths do not overflow", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "Intermediate widths are covered once.",
  );
  for (const width of [641, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/skyrslur/syni-ibud/rymi",
      "/skyrslur/syni-ibud/skraning?rymi=demo-living",
    ]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      await noOverflow(page);
    }
  }
});
