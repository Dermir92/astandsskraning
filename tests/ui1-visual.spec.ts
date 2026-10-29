import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { checklistReport } from "./inspection-checklist-fixtures";

test("UI1 review screenshots with identical synthetic report and photo", async ({ page }, info) => {
  test.skip(!process.env.UI1_CAPTURE_PHASE, "Explicit before/after evidence capture only");
  const phase = process.env.UI1_CAPTURE_PHASE;
  const folder = "docs/qa/ui1-a22/screenshots";
  await mkdir(folder, { recursive: true });
  await page.addInitScript(({ key, report }) => localStorage.setItem(key, JSON.stringify({ version: 1, reports: [report] })), { key: STORAGE_KEY, report: checklistReport(true) });
  await page.goto("/skyrslur/checklist-report/skraning?rymi=checklist-entry");
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  const room = page.locator(".room-heading");
  await room.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${folder}/${phase}-${info.project.name}-checklist.png`, fullPage: true });
  const row = page.locator('.checklist-item[data-item="walls"]');
  await row.locator(".checklist-toggle").click();
  const bytes = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 600; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#e4e9e5"; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = "#bdc7c0"; ctx.fillRect(380, 0, 40, 400);
    ctx.strokeStyle = "#435951"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(220, 250); ctx.lineTo(370, 190); ctx.stroke();
    return canvas.toDataURL().split(",")[1];
  });
  await row.getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({ name: "tilbuin-rispa.png", mimeType: "image/png", buffer: Buffer.from(bytes, "base64") });
  await expect(row.getByRole("img", { name: "Staðbundin forskoðun: tilbuin-rispa.png", exact: true })).toBeVisible();
  const photoActions = row.locator("summary").filter({ hasText: /^Myndaaðgerðir$/ });
  if (await photoActions.isVisible() && await photoActions.locator("..").evaluate(el => (el as HTMLDetailsElement).open)) await photoActions.click();
  await row.locator(".checklist-toggle").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${folder}/${phase}-${info.project.name}-defect.png`, fullPage: true });
  await page.screenshot({ path: `${folder}/${phase}-${info.project.name}-defect-viewport.png` });
});
