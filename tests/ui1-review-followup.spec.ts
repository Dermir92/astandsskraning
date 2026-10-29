import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { checklistReport } from "./inspection-checklist-fixtures";
import { expandAssessment } from "./inspection-ui-helpers";

const row = (page: Page) => page.locator('.checklist-item[data-item="walls"]');
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key)!, STORAGE_KEY);
async function seed(page: Page, incomplete = false) {
  const report = checklistReport(true);
  if (incomplete) report.rooms[0].observations.walls.description = "";
  const document = JSON.stringify({ version: 1, extension: { keep: [false, 0] }, reports: [report] }, null, 2);
  await page.addInitScript(({ key, document }) => localStorage.setItem(key, document), { key: STORAGE_KEY, document });
  await page.goto("/skyrslur/checklist-report/skraning?rymi=checklist-entry&atridi=walls");
  await expect(row(page).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  return document;
}
async function addPhoto(page: Page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 600; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#e4e9e5"; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = "#bdc7c0"; ctx.fillRect(380, 0, 40, 400);
    ctx.strokeStyle = "#435951"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(220, 250); ctx.lineTo(370, 190); ctx.stroke();
    return canvas.toDataURL().split(",")[1];
  });
  await row(page).getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({ name: "tilbuin-rispa.png", mimeType: "image/png", buffer: Buffer.from(data, "base64") });
  await expect(row(page).getByRole("img", { name: "Staðbundin forskoðun: tilbuin-rispa.png", exact: true })).toBeVisible();
}

test("native accessibility tree preserves the selected item and its assessment grouping", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "Native Chromium AX audit includes desktop and mobile in one run");
  const before = await seed(page, true);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Accessibility.enable");
  type AXNode = { nodeId: string; parentId?: string; backendDOMNodeId?: number; ignored: boolean; role?: { value: string }; name?: { value: string }; childIds?: string[] };
  async function snapshot() {
    const document = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: document.root.nodeId, selector: '.checklist-item[data-item="walls"]' });
    const { node } = await cdp.send("DOM.describeNode", { nodeId });
    const { nodes } = await cdp.send("Accessibility.getFullAXTree") as { nodes: AXNode[] };
    const item = nodes.find(n => n.backendDOMNodeId === node.backendNodeId)!;
    const descendants = new Set<string>();
    const visit = (id: string) => { descendants.add(id); nodes.find(n => n.nodeId === id)?.childIds?.forEach(visit); };
    visit(item.nodeId);
    const content = nodes.filter(n => descendants.has(n.nodeId) && !n.ignored).map(n => ({ role: n.role?.value, name: n.name?.value }));
    const box = await row(page).evaluate(el => { const r = el.getBoundingClientRect(); return { display: getComputedStyle(el).display, width: r.width, height: r.height }; });
    const focusable = await row(page).evaluate(el => { (el as HTMLElement).focus(); return globalThis.document.activeElement === el; });
    const itemNames = checklistReport().rooms[0].items.map(item => item.name);
    const itemRegions = nodes.filter(n => !n.ignored && n.role?.value === "region" && itemNames.some(name => n.name?.value.startsWith(name))).map(n => n.name!.value);
    return { item: { role: item.role?.value, name: item.name?.value, ignored: item.ignored }, itemRegions, content, box, focusable };
  }
  const desktop = await snapshot();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await snapshot();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addStyleTag({ content: '.checklist-item[data-item="walls"] { display: block !important; }' });
  const boxedControl = await snapshot();
  const output = info.outputPath("native-ax.json");
  await writeFile(output, JSON.stringify({ browser: context.browser()?.version(), desktop, mobile, boxedControl }, null, 2));
  await info.attach("native-ax", { path: output, contentType: "application/json" });
  for (const result of [desktop, mobile, boxedControl]) {
    expect(result.item.ignored).toBe(false);
    expect(result.item.role).toBe("region");
    expect(result.content.some(n => n.role === "heading" && n.name === "Veggir")).toBe(true);
    expect(result.content.some(n => n.role === "textbox" && n.name?.startsWith("Athugasemd"))).toBe(true);
    expect(result.content.some(n => n.role === "group" && n.name === "Ástand")).toBe(true);
    expect(result.content.some(n => n.role === "radio" && n.name === "Skemmt")).toBe(true);
    expect(result.itemRegions).toHaveLength(7);
  }
  expect(await raw(page)).toBe(before);
});

test("completing an existing defect keeps the same photo controls as reopening the item", async ({ page }, info) => {
  await seed(page, true); await addPhoto(page);
  const picker = row(page).getByLabel("Myndir við atriði: velja myndir", { exact: true });
  await picker.evaluate(el => { el.setAttribute("data-review-live-input", "same"); });
  const id = await row(page).locator("button[data-photo-id]").getAttribute("data-photo-id");
  const imageUrl = await row(page).getByRole("img").getAttribute("src");
  await row(page).getByRole("textbox", { name: /^Lýsing/ }).fill("Tilbúin 8 cm rispa");
  await expect(row(page)).toHaveAttribute("data-state", "deviation");
  await expect(row(page).getByRole("button", { name: "Breyta fráviki", exact: true })).toBeVisible();
  await expect(picker).toHaveAttribute("data-review-live-input", "same");
  const summary = row(page).locator("summary").filter({ hasText: /^Myndaaðgerðir$/ });
  const completedOpen = await summary.locator("..").evaluate(el => (el as HTMLDetailsElement).open);
  const completedBytes = await raw(page);
  await row(page).getByRole("button", { name: "Loka atriði", exact: true }).click();
  await row(page).locator(".checklist-toggle").click();
  await expect(row(page).getByRole("button", { name: "Breyta fráviki", exact: true })).toBeVisible();
  const reopenedOpen = await summary.locator("..").evaluate(el => (el as HTMLDetailsElement).open);
  await expect(row(page).locator("button[data-photo-id]")).toHaveAttribute("data-photo-id", id!);
  await expect(row(page).getByRole("img")).toHaveAttribute("src", imageUrl!);
  expect(await raw(page)).toBe(completedBytes);
  const output = info.outputPath("photo-disclosure.json");
  await writeFile(output, JSON.stringify({ completedOpen, reopenedOpen, samePhotoId: true, sameBlobUrl: true, unchangedOnReopen: true }, null, 2));
  await info.attach("photo-disclosure", { path: output, contentType: "application/json" });
  expect(completedOpen).toBe(reopenedOpen);
  expect(completedOpen).toBe(false);
  await row(page).getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  await expect(picker).toBeVisible();
  await expect(summary.locator("..")).toHaveJSProperty("open", true);
  expect(await raw(page)).toBe(completedBytes);
});

test("completion defers its photo disclosure default until decoding finishes without stealing note focus", async ({ page }) => {
  await seed(page, true); await addPhoto(page);
  const picker = row(page).getByLabel("Myndir við atriði: velja myndir", { exact: true });
  await picker.evaluate(el => { el.setAttribute("data-review-live-input", "same"); });
  const originalId = await row(page).locator("button[data-photo-id]").getAttribute("data-photo-id");
  await page.evaluate(() => {
    const original = window.createImageBitmap;
    const releases: Array<() => void> = [];
    (window as unknown as { releaseReviewImages: () => void }).releaseReviewImages = () => {
      window.createImageBitmap = original; releases.splice(0).forEach(release => release());
    };
    window.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) => new Promise(resolve => releases.push(() => { void original(...args).then(resolve); }))) as typeof createImageBitmap;
  });
  const more = addPhoto(page);
  // addPhoto waits for the first named image, so the existing first image lets
  // this return while the second decode remains deliberately pending.
  await more; await expect(picker).toBeDisabled();
  await row(page).getByRole("textbox", { name: /^Lýsing/ }).fill("Tilbúin 8 cm rispa");
  const summary = row(page).locator("summary").filter({ hasText: /^Myndaaðgerðir$/ });
  await expect(summary.locator("..")).toHaveJSProperty("open", true);
  const note = row(page).getByRole("textbox", { name: /^Athugasemd/ });
  await note.fill("Nýr texti við myndalesningu");
  const beforeRelease = await raw(page);
  await page.evaluate(() => (window as unknown as { releaseReviewImages: () => void }).releaseReviewImages());
  await expect(row(page).locator("button[data-photo-id]")).toHaveCount(2);
  await expect(summary.locator("..")).toHaveJSProperty("open", false);
  await expect(note).toBeFocused();
  await expect(picker).toHaveAttribute("data-review-live-input", "same");
  await expect(row(page).locator("button[data-photo-id]").first()).toHaveAttribute("data-photo-id", originalId!);
  expect(await raw(page)).toBe(beforeRelease);
});

test("UI1 guard observes its own store, not another tab's storage writes", async ({ page, context }) => {
  await seed(page); await expandAssessment(row(page));
  await page.evaluate(() => {
    (window as unknown as { reviewStorageEvents: number }).reviewStorageEvents = 0;
    addEventListener("storage", () => { (window as unknown as { reviewStorageEvents: number }).reviewStorageEvents++; });
  });
  await row(page).getByRole("radio", { name: "Í lagi", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Breyta virku fráviki?" });
  await expect(dialog).toBeVisible();
  const other = await context.newPage();
  await other.goto("/skyrslur/checklist-report/skraning?rymi=checklist-entry&atridi=walls");
  await row(other).getByRole("textbox", { name: /^Athugasemd/ }).fill("Breytt í öðrum flipa");
  await expect.poll(() => page.evaluate(() => (window as unknown as { reviewStorageEvents: number }).reviewStorageEvents)).toBeGreaterThan(0);
  const externalBytes = await raw(page);
  expect(JSON.parse(externalBytes).reports[0].rooms[0].observations.walls.note).toBe("Breytt í öðrum flipa");
  await expect(row(page).locator('textarea[id$="-note"]')).toHaveValue("");
  await dialog.getByRole("button", { name: "Halda fyrra mati", exact: true }).click();
  expect(await raw(page)).toBe(externalBytes);
  await other.close();
});

test("review screenshots retain A2.2 hierarchy on desktop and mobile", async ({ page }, info) => {
  test.skip(!process.env.UI1_REVIEW_CAPTURE, "Explicit review evidence only");
  await seed(page); await addPhoto(page);
  const summary = row(page).locator("summary").filter({ hasText: /^Myndaaðgerðir$/ });
  if (await summary.locator("..").evaluate(el => (el as HTMLDetailsElement).open)) await summary.click();
  const folder = "docs/qa/ui1-a22/follow-up/screenshots";
  await mkdir(folder, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".room-heading").evaluate(el => el.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: `${folder}/${info.project.name}-defect.png`, fullPage: true });
  await page.screenshot({ path: `${folder}/${info.project.name}-defect-viewport.png` });
});
