import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("artifacts/approved-shell-2026-10-14");
const browser = await chromium.launch();
const evidence = [];
const base = "http://127.0.0.1:3000";
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile-390", 390, 844],
    ["mobile-360", 360, 800],
    ["width-641", 641, 900],
    ["width-768", 768, 900],
    ["width-1024", 1024, 900],
    ["width-1280", 1280, 900],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const dir = path.join(root, name);
    await mkdir(dir, { recursive: true });
    async function capture(state) {
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw new Error(`${name}/${state}: horizontal overflow`);
      await page.screenshot({
        path: path.join(dir, `${state}.png`),
        fullPage: true,
      });
      evidence.push({
        viewport: name,
        width,
        height,
        state,
        overflow,
        errors: [...errors],
      });
    }
    await page.goto(base);
    await page.getByText("Sýnigögn tilbúin", { exact: true }).waitFor();
    await capture("reports");
    await page.screenshot({ path: path.join(dir, "reports-viewport.png") });
    const openContext = async (title) => {
      await page
        .getByRole("button", { name: `Yfirlit: ${title}`, exact: true })
        .click();
      if (width <= 1099)
        await page.getByRole("dialog", { name: "Skýrsluyfirlit" }).waitFor();
    };
    await openContext("Sýnigata 14");
    await capture("active-context");
    if (width <= 1099) {
      await page.screenshot({ path: path.join(dir, "drawer-viewport.png") });
      await page.getByRole("dialog").evaluate((dialog) => {
        dialog.scrollTop = dialog.scrollHeight;
      });
      await page.screenshot({ path: path.join(dir, "drawer-scrolled.png") });
      await page.keyboard.press("Escape");
    }
    await openContext("Dæmishlíð 8");
    await capture("draft-context");
    if (width <= 1099) await page.keyboard.press("Escape");
    await openContext("Sýnibíll · SB-000");
    await capture("sample-context");
    if (width <= 1099) await page.keyboard.press("Escape");
    await page
      .getByRole("combobox", { name: "Eignategund", exact: true })
      .selectOption("apartment");
    await capture("filtered");
    await page
      .getByRole("textbox", { name: "Leita að eign eða heimilisfangi" })
      .fill("ekkert finnst");
    await capture("empty");
    await page.getByRole("button", { name: "Hreinsa leit og síur" }).click();
    if ([1440, 390, 360].includes(width)) {
      for (const [screen, url] of [
        ["new", "/skyrslur/ny"],
        ["details", "/skyrslur/syni-ibud/upplysingar"],
        ["rooms", "/skyrslur/syni-ibud/rymi"],
        ["inspection", "/skyrslur/syni-ibud/skraning?rymi=demo-living"],
        ["review", "/skyrslur/syni-ibud/yfirferd"],
      ]) {
        await page.goto(base + url);
        await page.locator("main h1").waitFor();
        await capture(screen);
      }
      await page.goto(base);
      await page
        .getByRole("button", { name: "Um sýniham", exact: true })
        .last()
        .click();
      await capture("help");
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
  await writeFile(
    path.join(root, "responsive-evidence.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(`Captured ${evidence.length} states in ${root}`);
} finally {
  await browser.close();
}
