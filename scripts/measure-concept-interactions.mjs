import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const baseURL = process.argv[2] || "http://127.0.0.1:3112";
const browser = await chromium.launch();
const results = [];
try {
  for (const concept of ["a", "b"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${baseURL}/hugmyndir/${concept}`);
    const work = page.locator(`[data-concept="${concept}"]`);
    await expect(work).toBeVisible();
    let answers = 0, navigation = 0;
    async function secondary() {
      for (const [question, value] of [["functionality", "works"], ["cleanliness", "clean"]]) {
        const group = work.locator(`[data-question="${question}"]:visible`);
        if (await group.count()) { await group.locator(`input[value="${value}"]`).check(); answers++; }
      }
    }
    if (concept === "a") {
      for (let i = 0; i < 46; i++) {
        await work.getByRole("radio", { name: "Í lagi", exact: true }).check(); answers++;
        await secondary();
        if (i < 45) { await work.getByRole("navigation", { name: "Fara á milli atriða" }).getByRole("button").last().click(); navigation++; }
      }
    } else {
      for (let r = 0; r < 5; r++) {
        const buttons = work.getByRole("button", { name: /^Í lagi:/ });
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).click(); answers++;
          await secondary();
        }
        if (r < 4) { await work.getByRole("button", { name: "Næsta rými", exact: true }).click(); navigation++; }
      }
    }
    await expect(work.getByText("46 af 46 atriðum skráð", { exact: true })).toBeVisible();
    expect(answers).toBe(99);
    expect(navigation).toBe(concept === "a" ? 45 : 4);
    results.push({ concept, answers, navigation, activations: answers + navigation, viewport: "390×844", excludes: "Creation, final review activation, photos, text, scrolling, OS picker and initial route opening. Counts a radio selection/check as one activation." });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile("artifacts/phase-1b-concepts/interaction-costs.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
