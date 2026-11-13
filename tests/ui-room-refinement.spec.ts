import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { demoReports } from "../src/lib/fixtures";
import { makeRoom, type RoomType } from "../src/lib/model";

const base = "/skyrslur/syni-ibud";
const photo = "public/concepts/synthetic-wall-damage.png";
const evidence = "docs/qa/ui-room-refinement";

async function seed(page: Page) {
  const report = demoReports()[0];
  // Exercise every supported room type without changing the application's demo data.
  for (const type of ["laundry", "storage", "balcony", "custom"] as RoomType[]) {
    report.rooms.push(makeRoom(type, `Sýnirými · ${type}`, `visual-${type}`));
  }
  await page.addInitScript(({ key, report }) => {
    if (!sessionStorage.getItem("room-ui-seeded")) {
      localStorage.setItem(key, JSON.stringify({ version: 1, reports: [report] }));
      sessionStorage.setItem("room-ui-seeded", "yes");
    }
  }, { key: STORAGE_KEY, report });
  await visit(page, `${base}/skraning?rymi=demo-living`);
}

async function visit(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  await page.evaluate(() => document.fonts.ready);
}

async function upload(region: Locator, count = 1) {
  await region.locator('input[type="file"][multiple]').setInputFiles(Array.from({ length: count }, () => photo));
  await expect(region.getByRole("button", { name: /^Forskoða/ })).toHaveCount(Math.min(count, 2));
  await expect(region).toHaveAttribute("aria-busy", "false");
  await expect(region.getByRole("status")).toHaveText(`${count} ${count === 1 ? "mynd vistuð" : "myndir vistaðar"} í þessum vafra.`);
  for (const img of await region.locator("img").all()) await img.evaluate((node: HTMLImageElement) => node.decode());
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("room presentation stays consistent while each room keeps its controls", async ({ page }) => {
  await seed(page);
  const original = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
  const selector = page.getByRole("combobox", { name: "Velja rými", exact: true });
  const rooms = await selector.locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value));
  for (const room of rooms) {
    await selector.selectOption(room);
    await expect(page.locator(".room-heading h2")).toHaveText(await selector.locator(`option[value="${room}"]`).innerText());
    const appearance = await page.locator(".room-heading").evaluate(node => ({
      background: getComputedStyle(node).backgroundColor,
      text: getComputedStyle(node).color,
      titleSize: getComputedStyle(node.querySelector("h2")!).fontSize,
    }));
    expect(appearance).toEqual({ background: "rgb(255, 255, 255)", text: "rgb(20, 46, 61)", titleSize: "26px" });
    await expect(page.getByRole("button", { name: "Fyrra rými", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Næsta rými", exact: true })).toBeVisible();
    await noOverflow(page);
  }
  await selector.selectOption("demo-kitchen");
  await expect(page.getByRole("button", { name: "Ástand í lagi: Vaskur og krani", exact: true })).toBeVisible();
  await expect(page.locator('.checklist-item[data-item="counter"] .checklist-toggle')).toContainText("Frávik");
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
});

test("photos remain usable in the defect editor, gallery and review", async ({ page }) => {
  await seed(page);
  const original = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
  const overview = page.getByRole("region", { name: "Yfirlitsmyndir rýmis", exact: true });
  await upload(overview, 3);
  await overview.getByText("Sjá allar myndir (3)", { exact: true }).click();
  await expect(overview.getByRole("button", { name: /^Forskoða/ })).toHaveCount(3);
  const wall = page.locator('.checklist-item[data-item="walls"]');
  await wall.locator(".checklist-toggle").click();
  const defect = wall.getByRole("region", { name: "Fráviksmyndir", exact: true });
  await upload(defect);
  const image = defect.locator("img").first();
  const bounds = await image.boundingBox();
  expect(bounds!.width).toBeGreaterThanOrEqual(140);
  expect(bounds!.height).toBeGreaterThanOrEqual(100);
  if (page.viewportSize()!.width <= 640) {
    const container = await defect.boundingBox();
    expect(container!.width).toBeGreaterThanOrEqual(280);
  }
  const preview = defect.getByRole("button", { name: /^Forskoða/ }).first();
  await preview.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(preview).toBeFocused();
  await noOverflow(page);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.reload();
  await expect(defect.locator("img")).toBeVisible();
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  const living = page.locator(".review-room").filter({ has: page.getByRole("heading", { name: "Stofa", exact: true }) });
  await expect(living.getByText("Um 8 cm löng rispa á vegg, neðarlega við dyrakarm.", { exact: true })).toBeVisible();
  await expect(living.getByRole("button", { name: /^Forskoða/ })).toHaveCount(3);
  await expect(page.locator(".review-attention")).toContainText("Myndir vantar");
  await noOverflow(page);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
});

test("capture comparable room and review evidence", async ({ page }) => {
  const stage = process.env.ROOM_UI_CAPTURE;
  test.skip(!stage, "Explicit before/after evidence capture only");
  test.setTimeout(120_000);
  await seed(page);
  const folder = `${evidence}/${stage}`;
  await mkdir(folder, { recursive: true });
  const width = page.viewportSize()!.width;
  const records: object[] = [];
  async function shot(name: string) {
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
    await noOverflow(page);
    await page.screenshot({ path: `${folder}/${name}-${width}.png`, fullPage: true });
    const text = (await page.locator("main").textContent())!;
    const controls = await page.locator("main").evaluate(node => [...node.querySelectorAll("a,button,input,select,textarea,summary")].map(el => ({
        tag: el.tagName, text: el.textContent, label: el.getAttribute("aria-label"),
        href: el.getAttribute("href"), disabled: el.hasAttribute("disabled"),
      })));
    const record = {
      name,
      textSha256: createHash("sha256").update(text).digest("hex"),
      controlsSha256: createHash("sha256").update(JSON.stringify(controls)).digest("hex"),
      textLength: text.length,
      controlCount: controls.length,
      height: await page.evaluate(() => document.documentElement.scrollHeight),
    };
    records.push(record);
    await writeFile(`${folder}/manifest-${width}.json`, JSON.stringify(records, null, 2) + "\n");
    if (stage === "after") {
      const before = JSON.parse(await readFile(`${evidence}/before/manifest-${width}.json`, "utf8"));
      const baseline = before.find((entry: { name: string }) => entry.name === name);
      expect(record.textSha256).toBe(baseline.textSha256);
      expect(record.controlsSha256).toBe(baseline.controlsSha256);
    }
  }
  const overview = page.getByRole("region", { name: "Yfirlitsmyndir rýmis", exact: true });
  await upload(overview);
  await page.locator('.checklist-item[data-item="walls"] .checklist-toggle').click();
  await upload(page.getByRole("region", { name: "Fráviksmyndir", exact: true }));
  await shot("stofa-defect");
  await page.getByRole("combobox", { name: "Velja rými", exact: true }).selectOption("demo-kitchen");
  const overviewDetails = page.locator(".room-inspection details").filter({ has: page.locator('.photo-preview[aria-label="Yfirlitsmyndir rýmis"]') });
  await overviewDetails.locator(":scope > summary").click();
  await upload(page.getByRole("region", { name: "Yfirlitsmyndir rýmis", exact: true }));
  const counter = page.locator('.checklist-item[data-item="counter"]');
  await counter.locator(".checklist-toggle").click();
  await upload(counter.getByRole("region", { name: "Myndir við atriði", exact: true }));
  await shot("kitchen-defect");
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible();
  await shot("review");
  await writeFile(`${folder}/manifest-${width}.json`, JSON.stringify(records, null, 2) + "\n");
});
