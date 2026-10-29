import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { CONDITIONS, EMPTY_OBSERVATION, reportStats, type Report } from "../src/lib/model";
import { is } from "../src/lib/locale/is";
import { hasRetainedDefect } from "../src/lib/inspection-evidence";
import { checklistReport } from "./inspection-checklist-fixtures";
import { auditRenderedContrast } from "./contrast-helpers";
import { chooseAssessment, editDefect, expandAssessment } from "./inspection-ui-helpers";

const route = "/skyrslur/checklist-report/skraning?rymi=checklist-entry";
const row = (page: Page, id = "walls") => page.locator(`.checklist-item[data-item="${id}"]`);
const picker = (page: Page) => page.getByLabel("Myndir við atriði: velja myndir", { exact: true });
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key)!, STORAGE_KEY);
const stored = async (page: Page): Promise<Report> => JSON.parse(await raw(page)).reports[0];
const storage = (page: Page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
async function open(page: Page, id = "walls") {
  const toggle = row(page, id).locator(".checklist-toggle");
  if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(row(page, id).locator(".observation-body")).toBeVisible();
  await expandAssessment(row(page, id));
  await editDefect(row(page, id));
}
async function seed(page: Page, report = checklistReport(true)) {
  await page.addInitScript(({ key, report }) => {
    if (!sessionStorage.getItem("evidence-seeded")) {
      localStorage.setItem(key, JSON.stringify({ version: 1, reports: [report] }));
      localStorage.setItem("unrelated-evidence-sentinel", "unchanged");
      sessionStorage.setItem("evidence-seeded", "1");
    }
  }, { key: STORAGE_KEY, report });
  await page.goto(route);
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  await open(page);
}
async function image(page: Page, name = "synthetic.png", mimeType = "image/png") {
  const bytes = await page.evaluate(type => {
    const canvas = document.createElement("canvas"); canvas.width = 960; canvas.height = 640;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#d9e7e2"; ctx.fillRect(0, 0, 960, 640);
    ctx.fillStyle = "#25685f"; ctx.fillRect(100, 100, 760, 440);
    ctx.fillStyle = "white"; ctx.font = "48px sans-serif"; ctx.fillText("Synthetic inspection image", 160, 320);
    return canvas.toDataURL(type).split(",")[1];
  }, mimeType);
  return { name, mimeType, buffer: Buffer.from(bytes, "base64") };
}
async function count(page: Page, n: number) {
  await expect(page.locator('.photo-preview[aria-label="Myndir við atriði"] .photo-actions > span')).toContainText(`${n}/8`);
}
async function unchanged(page: Page, before: Awaited<ReturnType<typeof storage>>, stats: ReturnType<typeof reportStats>) {
  expect(await storage(page)).toEqual(before);
  expect(reportStats(await stored(page))).toEqual(stats);
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
}
async function a11y(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  const contrast = await auditRenderedContrast(page);
  expect(contrast.failures).toEqual([]);
  expect(contrast.typeFailures).toEqual([]);
  const layout = await page.evaluate(() => ({ width: innerWidth, actual: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll<HTMLElement>("body *")].filter(el => {
      const rect = el.getBoundingClientRect(); return rect.width && rect.right > innerWidth + 1;
    }).slice(0, 12).map(el => ({ tag: el.tagName, className: el.className, text: el.textContent?.slice(0, 70) })) }));
  expect(layout.actual, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);
  for (const control of await page.locator('button[data-photo-id], button[aria-label^="Fjarlægja mynd"], dialog[open] .icon-button, .photo-upload').all()) {
    if (!await control.isVisible()) continue;
    const box = (await control.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
  }
}

async function enlarge(page: Page) {
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll<HTMLElement>("body *")].map(element => [element, element.style.fontSize, parseFloat(getComputedStyle(element).fontSize)] as const);
    (window as unknown as { restoreEvidenceText: () => void }).restoreEvidenceText = () => {
      for (const [element, original] of sizes) element.style.fontSize = original;
    };
    for (const [element, , size] of sizes) element.style.fontSize = `${size * 2}px`;
  });
}

test("optional photos in unanswered and all six assessment states leave exact storage, timestamps and statistics unchanged", async ({ page }) => {
  await seed(page, checklistReport());
  const file = await image(page);
  for (const condition of ["", ...CONDITIONS] as const) {
    if (condition) await chooseAssessment(page, row(page), is.conditions[condition]);
    const before = await storage(page), stats = reportStats(await stored(page));
    const state = await row(page).getAttribute("data-state");
    await picker(page).setInputFiles(file); await count(page, 1);
    await unchanged(page, before, stats);
    const thumb = row(page).getByRole("button", { name: /^Forskoða / });
    const url = page.url(), history = await page.evaluate(() => window.history.length);
    await thumb.click(); await expect(page.getByRole("dialog", { name: "Forstofa · Veggir" })).toBeVisible();
    await page.keyboard.press("Escape"); await expect(thumb).toBeFocused();
    expect(page.url()).toBe(url); expect(await page.evaluate(() => window.history.length)).toBe(history);
    await row(page).getByRole("button", { name: /^Fjarlægja mynd 1:/ }).click();
    await page.getByRole("button", { name: "Hætta við", exact: true }).click(); await count(page, 1);
    await unchanged(page, before, stats);
    await row(page).getByRole("button", { name: /^Fjarlægja mynd 1:/ }).click();
    await page.getByRole("button", { name: "Fjarlægja mynd", exact: true }).click(); await count(page, 0);
    await expect(picker(page)).toBeFocused();
    await expect(row(page)).toHaveAttribute("data-state", state!);
    await unchanged(page, before, stats);
  }
});

test("inactive defect text stays separate while neutral notes and photos survive good, N/A and restored defect answers", async ({ page }) => {
  await seed(page);
  await row(page).getByRole("textbox", { name: /^Athugasemd/ }).fill("Tilbúin athugasemd við atriði");
  await picker(page).setInputFiles(await image(page)); await count(page, 1);
  const initial = (await stored(page)).rooms[0].observations.walls;
  for (const condition of ["good", "na", "damaged"] as const) {
    await chooseAssessment(page, row(page), is.conditions[condition]);
    await count(page, 1);
    expect((await stored(page)).rooms[0].observations.walls).toEqual({ ...initial, condition });
    await expect(row(page).getByRole("textbox", { name: /^Athugasemd/ })).toHaveValue(initial.note);
    const retained = row(page).locator("details").filter({ has: page.locator("summary", { hasText: "Varðveitt frávikslýsing" }) });
    if (condition === "damaged") await expect(retained).toHaveCount(0);
    else {
      await expect(row(page).getByRole("textbox", { name: "Lýsing", exact: true })).toHaveCount(0);
      await retained.locator("summary").click(); await expect(retained).toContainText(initial.description);
      await expect(retained).toContainText("ekki sýndur sem núverandi frávik");
    }
  }
  await chooseAssessment(page, row(page), "Í lagi");
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  const item = page.locator('[data-evidence-item="walls"]');
  await expect(item.locator("details")).not.toHaveAttribute("open", "");
  await expect(item.getByText(initial.description, { exact: true })).not.toBeVisible();
  await item.locator("summary").click(); await expect(item.getByText(initial.description, { exact: true })).toBeVisible();
  await expect(item.getByText("Athugasemd við atriði", { exact: true })).toBeVisible();
  await expect(item.getByRole("img")).toHaveCount(1);
  await item.getByRole("link", { name: "Veggir", exact: true }).click();
  await expect(row(page).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(picker(page)).toBeEnabled();
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible();
});

test("review includes good, wear, cleaning-only, unanswered photo-only and retained-only items, compactly in their room", async ({ page }) => {
  const report = checklistReport();
  report.rooms[0].observations = {
    floor: { ...EMPTY_OBSERVATION, condition: "good", cleanliness: "dirty" },
    walls: { ...EMPTY_OBSERVATION, condition: "good" },
    ceiling: { ...EMPTY_OBSERVATION, condition: "wear" },
    lights: { ...EMPTY_OBSERVATION, condition: "good", functionality: "works", description: "Tilbúinn varðveittur texti" },
  };
  await seed(page, report);
  const file = await image(page);
  for (const id of ["floor", "walls", "ceiling", "windows"]) {
    await open(page, id); await picker(page).setInputFiles(id === "walls" ? Array.from({ length: 8 }, (_, i) => ({ ...file, name: `synthetic-${i + 1}.png` })) : file);
    await count(page, id === "walls" ? 8 : 1);
  }
  await page.locator(".room-inspection > details > summary").click();
  await page.getByLabel("Yfirlitsmyndir rýmis: velja myndir", { exact: true }).setInputFiles(file);
  await expect(page.locator(".room-inspection > details").getByRole("img")).toHaveCount(1);
  const before = await raw(page);
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await expect(page.locator("[data-evidence-item]")).toHaveCount(5);
  const walls = page.locator('[data-evidence-item="walls"]');
  await expect(walls.getByRole("button", { name: /^Forskoða / })).toHaveCount(2);
  await walls.getByText("Sjá allar myndir (8)", { exact: true }).click();
  await expect(walls.getByRole("button", { name: /^Forskoða / })).toHaveCount(8);
  await walls.getByRole("button", { name: /mynd 8 af 8:/ }).click();
  await expect(page.getByRole("dialog")).toContainText("synthetic-8.png");
  await page.getByRole("button", { name: "Loka myndaforskoðun" }).click();
  await expect(page.locator('[data-evidence-item="windows"] .item-condition')).toHaveText("Óskráð");
  await expect(page.getByRole("group", { name: "Myndir: Forstofa · Yfirlitsmyndir rýmis", exact: true })).toBeVisible();
  expect(await raw(page)).toBe(before);
  await expect(page.getByRole("button", { name: /^Fjarlægja mynd/ })).toHaveCount(0);
});

test("explicit clearing retains photos and room renaming follows existing ID associations", async ({ page }) => {
  await seed(page);
  await picker(page).setInputFiles(await image(page)); await count(page, 1);
  await row(page).getByRole("button", { name: "Hreinsa svör", exact: true }).click();
  await page.getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
  await count(page, 1);
  await expect(row(page)).toHaveAttribute("data-state", "unanswered");
  expect((await stored(page)).rooms[0].observations.walls).toEqual(EMPTY_OBSERVATION);
  await page.getByRole("link", { name: "Rými", exact: true }).first().click();
  await page.getByRole("textbox", { name: "Heiti rýmis 1", exact: true }).fill("Tilbúið endurnefnt rými");
  await page.getByRole("button", { name: "Hefja ástandsskráningu", exact: true }).click();
  await open(page); await count(page, 1);
  await expect(row(page).getByText("Tilbúið endurnefnt rými · Veggir", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  const item = page.locator('[data-evidence-item="walls"]');
  await expect(item.locator(".item-condition")).toHaveText("Óskráð");
  await expect(item.getByRole("group", { name: "Myndir: Tilbúið endurnefnt rými · Veggir", exact: true })).toBeVisible();
});

test("validation accepts supported formats, rejects corrupt, HEIC and oversized files, and enforces eighth/ninth limit", async ({ page }) => {
  await seed(page);
  const before = await storage(page), stats = reportStats(await stored(page));
  const png = await image(page);
  await picker(page).setInputFiles([]); await unchanged(page, before, stats);
  await picker(page).setInputFiles([
    { ...png, name: "unsupported.heic", mimeType: "image/heic" },
    { ...png, name: "bad.jpg", mimeType: "image/jpeg", buffer: Buffer.from("corrupt") },
    { ...png, name: "big.png", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) },
    { ...png, name: "exact-10mb.png", buffer: Buffer.concat([png.buffer, Buffer.alloc(10 * 1024 * 1024 - png.buffer.length)]) },
    await image(page, "synthetic.jpg", "image/jpeg"), await image(page, "synthetic.webp", "image/webp"),
  ]);
  await count(page, 3);
  await expect(row(page).getByRole("alert")).toContainText("HEIC er ekki stutt");
  await expect(row(page).getByRole("alert")).toContainText("ekki tókst að lesa");
  await expect(row(page).getByRole("alert")).toContainText("hámarksstærð er 10 MB");
  await picker(page).setInputFiles(Array.from({ length: 6 }, () => png)); await count(page, 8);
  await expect(picker(page)).toBeDisabled();
  await expect(row(page).getByRole("alert")).toContainText("Hámark er átta");
  await unchanged(page, before, stats);
  // Duplicate names retain distinct IDs; remove the eighth, never the first.
  await page.getByText("Sjá allar myndir (8)", { exact: true }).click();
  const first = row(page).getByRole("button", { name: /mynd 1 af 8:/ });
  const firstId = await first.getAttribute("data-photo-id");
  await row(page).getByRole("button", { name: /^Fjarlægja mynd 8:/ }).click();
  await page.getByRole("button", { name: "Fjarlægja mynd", exact: true }).click(); await count(page, 7);
  expect(await row(page).getByRole("button", { name: /mynd 1 af 7:/ }).getAttribute("data-photo-id")).toBe(firstId);
  await expect(picker(page)).toBeEnabled();
  await unchanged(page, before, stats);
});

test("rapid decoding across remounted editors keeps original association and live eight-photo limit", async ({ page }) => {
  await seed(page);
  await page.evaluate(() => {
    const original = window.createImageBitmap;
    const releases: Array<() => void> = [];
    (window as unknown as { releaseImages: () => void }).releaseImages = () => {
      window.createImageBitmap = original;
      releases.splice(0).forEach(release => release());
    };
    window.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) => new Promise(resolve => releases.push(() => { void original(...args).then(resolve); }))) as typeof createImageBitmap;
  });
  const file = await image(page);
  await picker(page).setInputFiles(Array.from({ length: 6 }, () => file));
  await open(page, "floor"); await open(page, "walls");
  await picker(page).setInputFiles(Array.from({ length: 6 }, () => file));
  const before = await storage(page), stats = reportStats(await stored(page));
  // Release both first decodes; subsequent files decode without delay.
  await page.evaluate(() => {
    (window as unknown as { releaseImages: () => void }).releaseImages();
  });
  await count(page, 8);
  await unchanged(page, before, stats);
  await open(page, "floor"); await count(page, 0);
  await open(page, "walls"); await count(page, 8);
});

test("decoding result is rejected when its room is removed, without orphan photos or further report writes", async ({ page }) => {
  await seed(page);
  await page.evaluate(() => {
    const original = window.createImageBitmap;
    (window as unknown as { releaseImage: () => void }).releaseImage = () => {};
    window.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) => new Promise(resolve => {
      (window as unknown as { releaseImage: () => void }).releaseImage = () => { void original(...args).then(resolve); };
    })) as typeof createImageBitmap;
  });
  await picker(page).setInputFiles(await image(page));
  await page.getByRole("link", { name: "Rými", exact: true }).first().click();
  await page.getByRole("button", { name: "Fjarlægja Forstofa", exact: true }).click();
  await page.getByRole("button", { name: "Fjarlægja rými", exact: true }).click();
  const before = await raw(page);
  await page.evaluate(() => (window as unknown as { releaseImage: () => void }).releaseImage());
  await page.getByRole("button", { name: "Hefja ástandsskráningu", exact: true }).click();
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await expect(page.getByRole("group", { name: /^Myndir: Forstofa/ })).toHaveCount(0);
  await expect(page.locator(".review-summary > div").last()).toContainText("0");
  expect(await raw(page)).toBe(before);
});

test("reload loses only session previews, retains text and exact navigation, restores missing-photo warnings", async ({ page }) => {
  await seed(page);
  await picker(page).setInputFiles(await image(page)); await count(page, 1);
  const before = await storage(page), stats = reportStats(await stored(page));
  await page.reload();
  await expect(row(page).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  await count(page, 0); await unchanged(page, before, stats);
  await expect(row(page)).toContainText("Mynd af fráviki vantar");
  await editDefect(row(page));
  await expect(row(page).getByRole("textbox", { name: /^Lýsing/ })).toHaveValue("Tilbúin 8 cm rispa");
});

test("protected source locks uploads and photo operations preserve pending-write retry", async ({ page }) => {
  await seed(page);
  await page.evaluate(key => localStorage.setItem(key, '{"version":9,"reports":[]}'), STORAGE_KEY);
  await page.goto("/skyrslur/syni-ibud/skraning?rymi=demo-living");
  await page.locator('.checklist-item[data-item="walls"] .checklist-toggle').click();
  await expect(picker(page)).toBeDisabled();
  expect(await raw(page)).toBe('{"version":9,"reports":[]}');
  await page.evaluate(({ key, report }) => localStorage.setItem(key, JSON.stringify({ version: 1, reports: [report] })), { key: STORAGE_KEY, report: checklistReport(true) });
  await page.goto(route); await open(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreWrites: () => void }).restoreWrites = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) { if (name === key) throw new Error("Synthetic failure"); return original.call(this, name, value); };
  }, STORAGE_KEY);
  await row(page).getByRole("textbox", { name: /^Athugasemd/ }).fill("Tilbúin óvistuð breyting");
  await expect(page.locator(".topbar .save-status")).toHaveText("Ekki tókst að vista í vafra");
  const before = await raw(page);
  await picker(page).setInputFiles(await image(page)); await count(page, 1);
  await expect(page.locator(".topbar .save-status")).toHaveText("Ekki tókst að vista í vafra");
  expect(await raw(page)).toBe(before);
  await page.evaluate(() => (window as unknown as { restoreWrites: () => void }).restoreWrites());
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  expect((await stored(page)).rooms[0].observations.walls.note).toBe("Tilbúin óvistuð breyting");
  await count(page, 1);
});

test("keyboard preview traps and restores focus; cancel and confirmed removal have visible sensible destinations", async ({ page }) => {
  await seed(page);
  await picker(page).setInputFiles([await image(page), await image(page, "second.png")]); await count(page, 2);
  const before = await storage(page), stats = reportStats(await stored(page));
  const thumbnail = row(page).getByRole("button", { name: /mynd 1 af 2:/ });
  await thumbnail.focus(); await page.keyboard.press("Enter");
  const close = page.getByRole("button", { name: "Loka myndaforskoðun", exact: true });
  await expect(close).toBeFocused(); await page.keyboard.press("Tab"); await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab"); await expect(close).toBeFocused();
  await a11y(page);
  await page.keyboard.press("Escape"); await expect(thumbnail).toBeFocused();
  await page.keyboard.press("Tab");
  const remove = row(page).getByRole("button", { name: /^Fjarlægja mynd 1:/ });
  await expect(remove).toBeFocused(); await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Hætta við", exact: true })).toBeFocused();
  await a11y(page);
  await page.keyboard.press("Enter"); await expect(remove).toBeFocused();
  await page.keyboard.press("Enter"); await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); await count(page, 1);
  await expect(row(page).getByRole("button", { name: /mynd 1 af 1:/ })).toBeFocused();
  await unchanged(page, before, stats);
});

test.describe("photo store acceptance contracts", () => {
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let values: Map<string, string>, writes: string[], revoked: string[];
  const revoke = URL.revokeObjectURL;
  test.beforeEach(() => {
    values = new Map([[STORAGE_KEY, JSON.stringify({ version: 1, reports: [checklistReport(true)] })]]); writes = []; revoked = [];
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { writes.push(key); values.set(key, value); } } });
    URL.revokeObjectURL = url => { revoked.push(url); };
  });
  test.afterEach(() => {
    if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor); else Reflect.deleteProperty(globalThis, "localStorage");
    URL.revokeObjectURL = revoke;
  });
  const key = "checklist-report:checklist-entry:walls";
  const photo = (id: string) => ({ id, name: "synthetic.png", url: `blob:synthetic-${id}` });
  test("atomic limit, unknown/deleted items/rooms, rejected URL release and existing removal cleanup", () => {
    const store = new DemoStore(); store.hydrate();
    const original = store.getSnapshot();
    for (let i = 0; i < 8; i++) expect(store.addPhoto(key, photo(`${i}`))).toBe(true);
    expect(store.addPhoto(key, photo("ninth"))).toBe(false);
    expect(revoked).toContain("blob:synthetic-ninth");
    expect(store.addPhoto("missing:room:item", photo("missing"))).toBe(false);
    expect(store.getSnapshot().reports).toBe(original.reports);
    expect(store.getSnapshot().status).toBe(original.status); expect(writes).toEqual([]);
    store.removePhoto(key, "0"); expect(revoked).toContain("blob:synthetic-0");
    store.updateRoom("checklist-report", "checklist-entry", room => ({ ...room, items: room.items.filter(item => item.id !== "walls") }));
    const afterItemRemoval = writes.length;
    expect(store.addPhoto(key, photo("removed-item"))).toBe(false); expect(writes).toHaveLength(afterItemRemoval);
    store.removeRoom("checklist-report", "checklist-entry");
    const afterRoomRemoval = writes.length;
    expect(store.addPhoto(key, photo("removed-room"))).toBe(false); expect(writes).toHaveLength(afterRoomRemoval);
    expect(store.getSnapshot().photos[key]).toEqual([]);
    for (let i = 0; i < 8; i++) expect(revoked).toContain(`blob:synthetic-${i}`);
  });
  test("photo addition cannot bypass loading/read protection or authorize storage retry", () => {
    const loading = new DemoStore(); expect(loading.addPhoto(key, photo("loading"))).toBe(false);
    values.set(STORAGE_KEY, "{invalid synthetic source");
    const store = new DemoStore(); store.hydrate(); const before = store.getSnapshot();
    expect(store.addPhoto("syni-ibud:demo-living:walls", photo("protected"))).toBe(false);
    store.removePhoto(key, "0"); store.retrySave();
    expect(store.getSnapshot()).toBe(before); expect(writes).toEqual([]);
    expect(values.get(STORAGE_KEY)).toBe("{invalid synthetic source");
    expect(revoked).toEqual(["blob:synthetic-loading", "blob:synthetic-protected"]);
  });
  test("retained classification follows requiresDamage without inventing note/photo chronology", () => {
    const o = { ...EMPTY_OBSERVATION, condition: "good" as const, description: "Retained" };
    expect(hasRetainedDefect(o)).toBe(true);
    expect(hasRetainedDefect({ ...o, condition: "na", functionality: "broken" })).toBe(true);
    expect(hasRetainedDefect({ ...o, functionality: "broken" })).toBe(false);
    expect(hasRetainedDefect({ ...o, condition: "damaged" })).toBe(false);
    expect(hasRetainedDefect({ ...EMPTY_OBSERVATION, note: "Neutral" })).toBe(false);
  });
});

test("five-width visual, accessibility and 200 percent text verification", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Captured once across all five widths in isolated contexts");
  test.setTimeout(180000);
  const output = "artifacts/phase-1b2c/screenshots"; await mkdir(output, { recursive: true });
  for (const width of [320, 360, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1000 }, baseURL: testInfo.project.use.baseURL, hasTouch: width < 768 });
    const page = await context.newPage(); const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await seed(page);
    const snap = async (name: string) => { await a11y(page); await page.screenshot({ path: `${output}/${width}-${name}.png`, fullPage: true }); };
    await snap("empty");
    const file = await image(page);
    await picker(page).setInputFiles(Array.from({ length: 8 }, (_, i) => ({ ...file, name: `synthetic-${i + 1}.png` }))); await count(page, 8);
    await snap("editor");
    await page.locator(".photo-heading").first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${width}-editor-viewport.png` });
    await enlarge(page); await snap("editor-text-200");
    expect((await row(page, "floor").locator(".item-title").boundingBox())!.width).toBeGreaterThanOrEqual(100);
    await page.locator(".photo-heading").first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${width}-editor-text-200-viewport.png` });
    await page.evaluate(() => (window as unknown as { restoreEvidenceText: () => void }).restoreEvidenceText());
    await row(page).getByRole("button", { name: /^Fjarlægja mynd 1:/ }).click(); await snap("remove");
    await page.getByRole("button", { name: "Hætta við", exact: true }).click();
    await chooseAssessment(page, row(page), "Í lagi");
    await row(page).locator("details summary").filter({ hasText: "Varðveitt frávikslýsing" }).click(); await snap("retained");
    await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible();
    await snap("review");
    await page.locator('[data-evidence-item="walls"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${width}-review-viewport.png` });
    await page.locator('[data-evidence-item="walls"]').getByRole("button", { name: /mynd 1 af 8:/ }).click(); await snap("preview");
    await enlarge(page);
    await snap("preview-text-200");
    const close = page.getByRole("button", { name: "Loka myndaforskoðun", exact: true });
    await page.keyboard.press("Tab"); await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab"); await expect(close).toBeFocused();
    await page.screenshot({ path: `${output}/${width}-preview-viewport.png` });
    await page.keyboard.press("Escape"); await snap("review-text-200");
    expect(errors).toEqual([]);
    await context.close();
  }
});
