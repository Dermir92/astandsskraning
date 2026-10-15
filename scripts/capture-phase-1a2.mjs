import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Run once against the approved baseline and again against the candidate build.
const stage = process.argv[2];
if (!["before", "after"].includes(stage))
  throw new Error("Usage: node scripts/capture-phase-1a2.mjs before|after [URL]");
const baseURL = process.argv[3] || "http://127.0.0.1:3000";
const root = path.resolve("artifacts/phase-1a2", stage);
const browser = await chromium.launch();
const evidence = [];
async function enlargeText(page) {
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll("body, body *")].map((el) => [el, getComputedStyle(el).fontSize]);
    for (const [el, size] of sizes) el.style.fontSize = `${parseFloat(size) * 2}px`;
  });
}
try {
  for (const [width, height] of [[360, 800], [390, 844], [768, 1000], [1440, 1000]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const dir = path.join(root, String(width));
    await mkdir(dir, { recursive: true });
    async function capture(name, fullPage = false) {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage });
      evidence.push({ width, name, errors: [...errors], ...(await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        dialogOverflow: [...document.querySelectorAll("dialog[open]")].some((el) => el.scrollWidth > el.clientWidth),
        focus: document.activeElement?.getAttribute("aria-label"),
      }))) });
    }
    await page.goto(baseURL);
    await expect(page.locator(".property-name:visible")).toHaveCount(6);
    await capture("default");
    const toggle = page.getByRole("button", { name: /Sía og raða/ });
    if (width <= 800) await toggle.click();
    await page.getByRole("combobox", { name: "Röðun skýrslna" }).selectOption("name");
    await capture("sort-expanded");
    if (width <= 800) await page.keyboard.press("Escape");
    await capture("sort-collapsed");
    await page.getByRole("textbox", { name: "Leita að eign eða heimilisfangi" }).fill("Sýni");
    await capture("search-results");
    await page.getByRole("button", { name: "Hreinsa leit", exact: true }).click();
    await page.getByRole("button", { name: "Yfirlit: Sýnigata 14", exact: true }).click();
    await capture("overview");
    const overview = width <= 1099 ? page.getByRole("dialog") : page.locator(".selected-report-context");
    await overview.getByRole("heading", { name: "Skráð frávik" }).scrollIntoViewIfNeeded();
    await capture("deviations");
    if (width <= 1099) await page.keyboard.press("Escape");
    await page.goto(baseURL);
    await expect(page.locator(".property-name:visible")).toHaveCount(6);
    if (width <= 800) {
      await toggle.click();
      await page.getByRole("combobox", { name: "Eignategund", exact: true }).selectOption("commercial");
      await enlargeText(page);
      await capture("text-200-filters", true);
      await page.getByRole("button", { name: "Endurstilla leit og síur" }).click();
      await page.keyboard.press("Escape");
      await capture("text-200-list", true);
      // Open first so newly mounted dialog content is included in enlargement.
      await page.goto(baseURL);
      await expect(page.locator(".property-name:visible")).toHaveCount(6);
      await page.getByRole("button", { name: "Yfirlit: Sýnigata 14", exact: true }).click();
      await enlargeText(page);
      await capture("text-200-overview");
    }
    await context.close();
  }
  await writeFile(path.join(root, "evidence.json"), JSON.stringify(evidence, null, 2));
  console.log(`${stage}: ${evidence.length} screenshots saved to ${root}`);
} finally {
  await browser.close();
}
