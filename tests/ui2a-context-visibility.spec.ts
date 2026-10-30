import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { demoReports } from "../src/lib/fixtures";
import { auditInspectionA11y } from "./inspection-accessibility";

const destination = "/skyrslur/syni-ibud/skraning?rymi=demo-living&atridi=walls";
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const retainedNote = "Varðveitt athugasemd UI2A-F1.\nÖnnur lína.";

async function settle(page: Page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function openEditor(page: Page, enlarged: boolean) {
  const report = demoReports()[0];
  report.rooms.find(room => room.id === "demo-living")!.observations.walls.note = retainedNote;
  const raw = JSON.stringify({ version: 1, reports: [report] });
  await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: STORAGE_KEY, raw });
  await page.goto(destination);
  const editor = page.locator('[data-item="walls"]');
  await expect(editor.locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  await editor.locator("summary").filter({ hasText: "Breyta mati" }).click();
  await page.evaluate(() => document.fonts.ready);
  if (enlarged) await page.evaluate(() => {
    const sizes = [...document.querySelectorAll<HTMLElement>("body *")].map(element => ({ element, size: parseFloat(getComputedStyle(element).fontSize) }));
    for (const { element, size } of sizes) element.style.fontSize = `${size * 2}px`;
  });
  await settle(page);
  return { editor, raw };
}

async function measure(target: Locator, context: Locator) {
  const page = target.page();
  const viewport = await page.evaluate(() => {
    const visual = window.visualViewport;
    const top = visual?.offsetTop ?? 0;
    const bottom = top + (visual?.height ?? innerHeight);
    const bar = document.querySelector<HTMLElement>("[data-inspection-sections]")!;
    const box = bar.getBoundingClientRect();
    const sticky = getComputedStyle(bar).position === "sticky";
    return { width: innerWidth, height: innerHeight, top: Math.max(top, sticky ? box.bottom : top), bottom, bar: box.toJSON(), sticky };
  });
  const control = await target.evaluate(element => (element.closest(".answer-option") ?? element).getBoundingClientRect().toJSON());
  const heading = await context.evaluate(element => element.getBoundingClientRect().toJSON());
  const group = await target.evaluate(element => element.closest(".form-field, fieldset.answer-group")!.getBoundingClientRect().toJSON());
  return { viewport, control, heading, group, scrollY: await page.evaluate(() => scrollY) };
}

function visible(box: { top: number; bottom: number }, viewport: { top: number; bottom: number }) {
  return box.top >= viewport.top + 3 && box.bottom <= viewport.bottom - 3;
}

async function retainEvidence(page: Page, name: string, metrics: unknown) {
  const phase = process.env.F1_CAPTURE_PHASE;
  const folder = phase ? `artifacts/ui2a-f1/${phase}` : test.info().outputDir;
  await mkdir(folder, { recursive: true });
  await writeFile(`${folder}/${name}-measurements.json`, JSON.stringify(metrics, null, 2));
  await test.info().attach("context-measurements", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });
  if (phase) await page.screenshot({ path: `${folder}/${name}.png` });
  // Keep the unfiltered result before any resampling moves the viewport.
  const raw = await new AxeBuilder({ page }).withTags(tags).analyze();
  const rawPath = `${folder}/${name}-axe-raw.json`;
  await writeFile(rawPath, JSON.stringify(raw, null, 2));
  await test.info().attach("axe-raw", { path: rawPath, contentType: "application/json" });
}

for (const enlarged of [false, true]) for (const kind of ["radio", "textarea"] as const) for (const section of ["Brunavarnir", "Mælar"]) {
  test(`UI2A-F1 return ${section}: ${kind}, ${enlarged ? "200% simulated text" : "normal text"}`, async ({ page }, info) => {
    const width = info.project.name === "desktop" ? 320 : info.project.use.viewport!.width;
    await page.setViewportSize({ width, height: 800 });
    const { editor, raw } = await openEditor(page, enlarged);
    const target = kind === "radio" ? editor.getByRole("radio", { name: "Skemmt", exact: true }) : editor.getByRole("textbox", { name: /^Athugasemd/ });
    const heading = kind === "radio" ? editor.locator('[data-question="condition"] > legend') : editor.locator(`label[for="${await target.getAttribute("id")}"]`);
    const original = await target.elementHandle();
    const value = await target.inputValue();
    const url = page.url();
    await target.focus();
    await page.keyboard.press("Shift");
    const bar = page.getByRole("navigation", { name: "Hlutar skráningar" });
    await bar.getByRole("link", { name: new RegExp(`^${section}`) }).focus();
    await page.keyboard.press("Enter");
    await bar.getByRole("link", { name: /^Rými/ }).focus();
    await page.keyboard.press("Enter");
    await settle(page);
    const metrics = await measure(target, heading);
    const name = `${width}-${enlarged ? "200" : "normal"}-${kind}-${section === "Mælar" ? "meters" : "fire"}`;
    await retainEvidence(page, name, metrics);
    await expect(target).toBeFocused();
    expect(await original!.evaluate(element => element.isConnected && element === document.activeElement)).toBe(true);
    await expect(target).toHaveValue(value);
    if (kind === "radio") await expect(target).toBeChecked();
    expect(page.url()).toBe(url);
    expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(raw);
    expect(visible(metrics.control, metrics.viewport), "Focused live control clears the sticky bar and viewport edges").toBe(true);
    expect(visible(metrics.heading, metrics.viewport), "Associated label/legend clears the sticky bar and viewport edges").toBe(true);
    // Moving away and back must retain both the native focus and question context.
    await page.keyboard.press("Tab");
    await settle(page);
    const tab = await page.evaluate(() => {
      const element = document.activeElement!;
      return (element.closest(".answer-option") ?? element).getBoundingClientRect().toJSON();
    });
    expect(visible(tab, (await measure(target, heading)).viewport)).toBe(true);
    await page.keyboard.press("Shift+Tab");
    await settle(page);
    await expect(target).toBeFocused();
    const returned = await measure(target, heading);
    expect(visible(returned.control, returned.viewport)).toBe(true);
    expect(visible(returned.heading, returned.viewport)).toBe(true);
    await expect(target).toHaveValue(value);
    if (kind === "textarea") {
      await target.press("End");
      const beforeTyping = await page.evaluate(() => scrollY);
      await page.keyboard.type(" · UI2A-F1");
      await settle(page);
      await expect(target).toBeFocused();
      expect(await original!.evaluate(element => element === document.activeElement)).toBe(true);
      expect(await page.evaluate(() => scrollY)).toBe(beforeTyping);
      expect(page.url()).toBe(url);
    }
    expect((await auditInspectionA11y(page)).violations).toEqual([]);
  });
}

for (const height of [400, 300]) for (const section of ["Brunavarnir", "Mælar"]) {
  test(`UI2A-F1 short viewport ${height}: ${section}, oversized 200% group`, async ({ page }, info) => {
    const width = info.project.name === "desktop" ? 320 : info.project.use.viewport!.width;
    await page.setViewportSize({ width, height });
    const { editor, raw } = await openEditor(page, true);
    const target = editor.getByRole("radio", { name: "Skemmt", exact: true });
    const heading = editor.locator('[data-question="condition"] > legend');
    const original = await target.elementHandle();
    await target.focus();
    const bar = page.getByRole("navigation", { name: "Hlutar skráningar" });
    await bar.getByRole("link", { name: new RegExp(`^${section}`) }).press("Enter");
    await bar.getByRole("link", { name: /^Rými/ }).press("Enter");
    await settle(page);
    const metrics = await measure(target, heading);
    await retainEvidence(page, `${width}-200-radio-${height}-${section === "Mælar" ? "meters" : "fire"}`, metrics);
    expect(metrics.viewport.sticky).toBe(false);
    expect(metrics.group.height).toBeGreaterThan(metrics.viewport.bottom - metrics.viewport.top - 32);
    await expect(target).toBeFocused();
    await expect(target).toBeChecked();
    expect(await original!.evaluate(element => element === document.activeElement)).toBe(true);
    expect(visible(metrics.control, metrics.viewport)).toBe(true);
    if (height === 400) expect(visible(metrics.heading, metrics.viewport), "Question and selected answer fit even though the entire group does not").toBe(true);
    else {
      expect(metrics.control.bottom - metrics.heading.top).toBeGreaterThan(metrics.viewport.bottom - metrics.viewport.top - 32);
      await expect(target.locator("..")).toContainText("Skemmt");
    }
    expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(raw);
  });
}
