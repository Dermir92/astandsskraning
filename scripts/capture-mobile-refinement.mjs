import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("artifacts/phase-1a-1-2026-10-14");
const browser = await chromium.launch();
const evidence = [];
try {
  for (const [name, width, height] of [
    ["mobile-360", 360, 800],
    ["mobile-390", 390, 844],
    ["tablet-768", 768, 900],
    ["desktop-1440", 1440, 1000],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const dir = path.join(root, name);
    await mkdir(dir, { recursive: true });
    await page.goto("http://127.0.0.1:3000");
    await page.getByText("Sýnigögn tilbúin", { exact: true }).waitFor();
    async function capture(state, fullPage = false) {
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw new Error(`${name}/${state}: overflow`);
      await page.screenshot({ path: path.join(dir, `${state}.png`), fullPage });
      const rows = await page.locator(".report-entry").evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return {
            top: box.top,
            height: box.height,
            fullyVisible: box.top >= 0 && box.bottom <= innerHeight,
          };
        }),
      );
      evidence.push({
        viewport: name,
        width,
        height,
        state,
        overflow,
        errors: [...errors],
        rows,
      });
    }
    await capture("reports-top");
    await capture("reports-full", true);
    if (width <= 800) {
      await page.evaluate(() =>
        window.scrollTo(
          0,
          document.querySelector(".report-entry").getBoundingClientRect().top +
            scrollY -
            12,
        ),
      );
      await capture("reports-scanning");
      await page.evaluate(() => window.scrollTo(0, 0));
      const toggle = page.getByRole("button", { name: /Sía og raða/ });
      await toggle.click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await capture("filters-expanded");
      await page
        .getByRole("combobox", { name: "Staða", exact: true })
        .selectOption("draft");
      await page
        .getByRole("combobox", { name: "Eignategund", exact: true })
        .selectOption("apartment");
      await page
        .getByRole("combobox", { name: "Röðun skýrslna" })
        .selectOption("name");
      await toggle.click();
      await capture("filters-active");
      await page
        .getByRole("button", { name: "Hreinsa síur", exact: true })
        .click();
      await page.evaluate(() => window.scrollTo(0, 0));
      const title = page.getByRole("button", {
        name: "Yfirlit: Sýnigata 14",
        exact: true,
      });
      await title.focus();
      await page.keyboard.press("Enter");
      const sheet = page.getByRole("dialog", { name: "Skýrsluyfirlit" });
      await sheet.waitFor();
      await capture("bottom-sheet");
      await sheet.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await capture("bottom-sheet-scrolled");
      await page.keyboard.press("Escape");
      await capture("focus-restored");
      await page
        .getByRole("button", { name: "Um sýniham", exact: true })
        .click();
      await capture("demo-help");
      await page.keyboard.press("Escape");
      await page.evaluate(() =>
        localStorage.setItem(
          "astandsskraning-demo-v1",
          '{"version":1,"reports":[{"bad":true}]}',
        ),
      );
      await page.reload();
      await page.locator(".storage-warning").waitFor();
      await capture("storage-warning");
    }
    await context.close();
  }
  const before = await sharp(
    await readFile(path.join(root, "baseline/desktop.png")),
  )
    .raw()
    .toBuffer({ resolveWithObject: true });
  const after = await sharp(
    await readFile(path.join(root, "desktop-1440/reports-top.png")),
  )
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (before.data.length !== after.data.length)
    throw new Error("Desktop dimensions changed");
  let changedPixels = 0;
  for (
    let index = 0;
    index < before.data.length;
    index += before.info.channels
  ) {
    if (
      !before.data
        .subarray(index, index + before.info.channels)
        .equals(after.data.subarray(index, index + after.info.channels))
    )
      changedPixels++;
  }
  const comparison = {
    width: before.info.width,
    height: before.info.height,
    changedPixels,
    identical: changedPixels === 0,
  };
  await writeFile(
    path.join(root, "responsive-evidence.json"),
    JSON.stringify(
      { states: evidence, desktopComparison: comparison },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      capturedStates: evidence.length,
      desktopComparison: comparison,
    }),
  );
} finally {
  await browser.close();
}
