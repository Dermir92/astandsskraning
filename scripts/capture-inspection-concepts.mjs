import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseURL = process.argv[2] || "http://127.0.0.1:3112";
const root = path.resolve("artifacts/phase-1b-concepts");
const browser = await chromium.launch();
const evidence = [];
try {
  for (const [width, height] of [[360, 800], [390, 844], [768, 1000], [1440, 1000]]) {
    for (const concept of ["a", "b"]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 500, hasTouch: width < 500 });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const dir = path.join(root, "screenshots", String(width), concept);
      await mkdir(dir, { recursive: true });
      const work = page.locator(`[data-concept="${concept}"]`);
      async function capture(name, { fullPage = false, axe = true } = {}) {
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage });
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          dialogOverflow: [...document.querySelectorAll("dialog[open]")].some(el => el.scrollWidth > el.clientWidth),
          focus: document.activeElement?.outerHTML.slice(0, 260),
          firstAnswer: (() => { const el = document.querySelector('[data-concept] input[type=radio], [data-concept] button[aria-label^="Í lagi:"]'); return el ? { y: el.closest("label,button").getBoundingClientRect().top, bottom: el.closest("label,button").getBoundingClientRect().bottom } : null; })(),
          smallWorkingText: [...document.querySelectorAll('[data-concept] button, [data-concept] label, [data-concept] legend')].filter(el => el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 14).map(el => el.textContent?.trim().slice(0, 80)),
        }));
        const accessibility = axe ? await new AxeBuilder({ page }).include("[data-concept]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze() : null;
        evidence.push({ concept, width, height, name, fullPage, errors: [...errors], metrics, violations: accessibility?.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) ?? [] });
      }
      async function scenario(name) {
        const summary = work.locator("summary").filter({ hasText: "Prófunarsenur" });
        if (!(await summary.locator("..").getAttribute("open") !== null)) await summary.click();
        await work.getByRole("button", { name, exact: true }).click();
      }
      await page.goto(`${baseURL}/hugmyndir/${concept}`);
      await expect(work).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await capture("01-opening");
      await scenario("Í lagi");
      await page.evaluate(() => scrollTo(0, 0));
      await capture("02-normal");
      await scenario("Virkni og þrif");
      await page.evaluate(() => scrollTo(0, 0));
      await capture("03-incomplete", { fullPage: true });
      await work.locator('[data-question="cleanliness"] input[value="clean"]').focus();
      await work.locator('[data-question="cleanliness"] input[value="clean"]').evaluate(el => el.scrollIntoView({ block: "center" }));
      await capture("03-incomplete-working");
      await work.getByRole("radio", { name: "Hreint", exact: true }).check();
      await expect(work.getByRole("status").filter({ hasText: "Svör skráð" })).toBeVisible();
      await capture("04-assessment", { fullPage: true });
      await scenario("Frávik með mynd");
      await page.evaluate(() => scrollTo(0, 0));
      await capture("05-deviation", { fullPage: true });
      await work.getByRole("link", { name: "Opna mynd: Rispa við dyrakarm", exact: true }).focus();
      await capture("05-deviation-working");
      await work.getByRole("button", { name: "Yfirferð", exact: true }).click();
      await work.getByRole("button", { name: /^Athygli/ }).click();
      await page.evaluate(() => scrollTo(0, 0));
      await capture("06-review-attention");
      await scenario("Ófullskráð atriði");
      await work.getByRole("button", { name: "Yfirferð", exact: true }).click();
      await page.evaluate(() => scrollTo(0, 0));
      await capture("07-review-incomplete");
      await scenario("Endurkoma");
      await page.evaluate(() => scrollTo(0, 0));
      await capture("08-resume");
      await work.getByRole("button", { name: "Halda áfram", exact: true }).click();
      await work.getByRole("button", { name: /RÝMI \d AF/ }).click();
      await capture("09-room-picker", { axe: false });
      const dialogAudit = await new AxeBuilder({ page }).include("dialog[open]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      evidence.at(-1).violations = dialogAudit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
      await page.keyboard.press("Escape");
      await scenario("Opna rými");
      const fontSizes = await page.locator("[data-concept]").evaluate(rootEl => [...rootEl.querySelectorAll("*"), rootEl].map(el => [el, getComputedStyle(el).fontSize]).map(([el, size]) => { el.style.fontSize = `${parseFloat(size) * 2}px`; return true; }));
      if (!fontSizes.length) throw new Error("No enlarged elements");
      await page.evaluate(() => scrollTo(0, 0));
      await capture("10-text-200", { fullPage: true, axe: false });
      await context.close();
    }
  }
  // The approved register uses a disposable context, with no concept state.
  const baselinePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await baselinePage.goto(baseURL);
  await expect(baselinePage.locator(".property-name:visible")).toHaveCount(6);
  await baselinePage.evaluate(() => document.fonts.ready);
  await baselinePage.screenshot({ path: path.join(root, "register-1440.png") });
} finally {
  await browser.close();
  await writeFile(path.join(root, "capture-evidence.json"), JSON.stringify(evidence, null, 2));
}
const failures = evidence.filter(e => e.errors.length || e.metrics.overflow || e.metrics.dialogOverflow || e.violations.length || e.metrics.smallWorkingText.length);
console.log(JSON.stringify({ captures: evidence.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
