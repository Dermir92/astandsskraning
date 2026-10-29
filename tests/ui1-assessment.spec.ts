import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DemoStore, STORAGE_KEY, type SaveStatus } from "../src/components/demo-provider";
import { prepareAssessmentChange } from "../src/components/assessment-change";
import { EMPTY_OBSERVATION, reportStats } from "../src/lib/model";
import { checklistReport } from "./inspection-checklist-fixtures";
import { expandAssessment } from "./inspection-ui-helpers";

const target = { reportId: "checklist-report", roomId: "checklist-entry", itemId: "walls" };
const row = (page: Page, id = "walls") => page.locator(`.checklist-item[data-item="${id}"]`);
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key)!, STORAGE_KEY);
const png = async (page: Page) => Buffer.from(await page.evaluate(() => {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 16;
  canvas.getContext("2d")!.fillRect(0, 0, 16, 16);
  return canvas.toDataURL().split(",")[1];
}), "base64");
async function seed(page: Page, report = checklistReport(true)) {
  Object.assign(report, { unknownReport: { a: [0, false] } });
  Object.assign(report.rooms[0], { unknownRoom: "keep" });
  Object.assign(report.rooms[0].items[1], { unknownItem: { keep: true } });
  Object.assign(report.rooms[0].observations.walls, { unknownAnswer: { raw: "  keep  " } });
  const document = JSON.stringify({ version: 1, unknownEnvelope: [false, 0], reports: [report] }, null, 2);
  await page.addInitScript(({ key, document }) => {
    if (!sessionStorage.getItem("ui1-seeded")) { localStorage.setItem(key, document); sessionStorage.setItem("ui1-seeded", "1"); }
  }, { key: STORAGE_KEY, document });
  await page.goto("/skyrslur/checklist-report/skraning?rymi=checklist-entry&atridi=walls");
  await expect(row(page).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true");
  return document;
}

test("defect confirmation cancel, Escape and same-answer actions preserve exact bytes and focus", async ({ page }) => {
  const before = await seed(page);
  await expandAssessment(row(page));
  const current = row(page).getByRole("radio", { name: "Skemmt", exact: true });
  await current.click(); expect(await raw(page)).toBe(before);
  const good = row(page).getByRole("radio", { name: "Í lagi", exact: true });
  await good.click();
  const modal = page.getByRole("dialog", { name: "Breyta virku fráviki?" });
  await expect(modal).toContainText("Skemmt → Í lagi");
  expect(await raw(page)).toBe(before);
  await modal.getByRole("button", { name: "Halda fyrra mati", exact: true }).click();
  await expect(good).toBeFocused(); expect(await raw(page)).toBe(before);
  await good.click(); await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0); await expect(good).toBeFocused(); expect(await raw(page)).toBe(before);
});

test("confirmation and undo change only the requested field, preserving extensions, newer note and photo", async ({ page }) => {
  const before = JSON.parse(await seed(page));
  await expandAssessment(row(page));
  await row(page).getByRole("radio", { name: "Í lagi", exact: true }).click();
  await page.getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
  const after = JSON.parse(await raw(page));
  const expected = structuredClone(before); expected.reports[0].rooms[0].observations.walls.condition = "good";
  expected.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(expected);
  await row(page).getByRole("textbox", { name: /^Athugasemd/ }).fill("Nýr texti eftir staðfestingu");
  await row(page).getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({ name: "ui1.png", mimeType: "image/png", buffer: await png(page) });
  await expect(row(page).getByRole("img", { name: "Staðbundin forskoðun: ui1.png", exact: true })).toBeVisible();
  const id = await row(page).locator("button[data-photo-id]").getAttribute("data-photo-id");
  await row(page).getByRole("button", { name: "Afturkalla breytingu", exact: true }).click();
  const restored = JSON.parse(await raw(page));
  expect(restored.reports[0].rooms[0].observations.walls).toEqual({ ...before.reports[0].rooms[0].observations.walls, note: "Nýr texti eftir staðfestingu" });
  await expect(row(page).locator("button[data-photo-id]")).toHaveAttribute("data-photo-id", id!);
  expect(reportStats(restored.reports[0]).deviations).toBe(reportStats(before.reports[0]).deviations);
  await page.reload();
  expect(JSON.parse(await raw(page))).toEqual(restored);
  await expect(row(page).getByRole("img")).toHaveCount(0);
});

test("undo rejects a later change to the same field", async ({ page }) => {
  await seed(page); await expandAssessment(row(page));
  await row(page).getByRole("radio", { name: "Í lagi", exact: true }).click();
  await page.getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
  await row(page).getByRole("radio", { name: "Notkunarmerki", exact: true }).click();
  const beforeUndo = await raw(page);
  await row(page).getByRole("button", { name: "Afturkalla breytingu", exact: true }).click();
  expect(await raw(page)).toBe(beforeUndo);
  await expect(row(page).getByRole("status").filter({ hasText: "Ekki var hægt að afturkalla" })).toBeVisible();
});

test("featured upload keeps keyboard focus and removing its last photo reveals the same picker", async ({ page }) => {
  const before = await seed(page);
  const picker = row(page).getByLabel("Myndir við atriði: velja myndir", { exact: true });
  await picker.focus();
  await picker.setInputFiles({ name: "focus.png", mimeType: "image/png", buffer: await png(page) });
  await expect(row(page).getByRole("img", { name: "Staðbundin forskoðun: focus.png", exact: true })).toBeVisible();
  await expect(picker).toBeFocused();
  const summary = row(page).locator("summary").filter({ hasText: /^Myndaaðgerðir$/ });
  await expect(summary.locator("..")).toHaveJSProperty("open", true);
  await summary.click();
  await row(page).getByRole("button", { name: /^Fjarlægja mynd 1:/ }).click();
  await row(page).getByRole("button", { name: "Fjarlægja mynd", exact: true }).click();
  await expect(summary.locator("..")).toHaveJSProperty("open", true);
  await expect(picker).toBeFocused();
  expect(await raw(page)).toBe(before);
});

test("featured decoding respects a later explicit move to the note field", async ({ page }) => {
  await seed(page);
  const bytes = await png(page);
  await page.evaluate(() => {
    const original = window.createImageBitmap;
    const releases: Array<() => void> = [];
    (window as unknown as { releaseUi1Images: () => void }).releaseUi1Images = () => {
      window.createImageBitmap = original; releases.splice(0).forEach(release => release());
    };
    window.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) => new Promise(resolve => releases.push(() => { void original(...args).then(resolve); }))) as typeof createImageBitmap;
  });
  const picker = row(page).getByLabel("Myndir við atriði: velja myndir", { exact: true });
  await picker.focus();
  await picker.setInputFiles({ name: "delayed.png", mimeType: "image/png", buffer: bytes });
  await expect(picker).toBeDisabled();
  const note = row(page).getByRole("textbox", { name: /^Athugasemd/ });
  await note.fill("Nýr texti meðan mynd er lesin");
  const beforeRelease = await raw(page);
  await page.evaluate(() => (window as unknown as { releaseUi1Images: () => void }).releaseUi1Images());
  await expect(row(page).getByRole("img", { name: "Staðbundin forskoðun: delayed.png", exact: true })).toBeVisible();
  await expect(note).toBeFocused(); expect(await raw(page)).toBe(beforeRelease);
});

test("one live editor and picker survive breakpoint changes, all eight photos stay associated and return focus", async ({ page }) => {
  const before = await seed(page);
  const picker = row(page).getByLabel("Myndir við atriði: velja myndir", { exact: true });
  await picker.evaluate(el => { el.setAttribute("data-ui1-live-node", "same-input"); });
  const bytes = await png(page);
  await picker.setInputFiles(Array.from({ length: 8 }, (_, n) => ({ name: `ui1-${n}.png`, mimeType: "image/png", buffer: bytes })));
  await expect(row(page).locator("button[data-photo-id]")).toHaveCount(8);
  const ids = await row(page).locator("button[data-photo-id]").evaluateAll(nodes => nodes.map(n => n.getAttribute("data-photo-id")));
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".observation-body:not([hidden])")).toHaveCount(1);
    await expect(picker).toHaveCount(1);
    await expect(picker).toHaveAttribute("data-ui1-live-node", "same-input");
    expect(await row(page).locator("button[data-photo-id]").evaluateAll(nodes => nodes.map(n => n.getAttribute("data-photo-id")))).toEqual(ids);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await row(page).getByText("Sjá allar myndir (8)", { exact: true }).click();
  const last = row(page).getByRole("button", { name: /mynd 8 af 8:/ });
  await last.click(); await expect(page.getByRole("dialog")).toContainText("ui1-7.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Escape"); await expect(last).toBeFocused();
  expect(await raw(page)).toBe(before);
});

test("broken functionality and dirty cleanliness require confirmation and preserve all other answers", async ({ page }) => {
  const report = checklistReport(true);
  report.rooms[0].observations.floor.cleanliness = "dirty";
  await seed(page, report);
  for (const [id, name, key, value] of [["lights", "Virkar", "functionality", "works"], ["floor", "Hreint", "cleanliness", "clean"]] as const) {
    await row(page, id).locator(".checklist-toggle").click();
    await expandAssessment(row(page, id));
    const before = JSON.parse(await raw(page));
    await row(page, id).getByRole("radio", { name, exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Breyta virku fráviki?" })).toBeVisible();
    expect(JSON.parse(await raw(page))).toEqual(before);
    await page.getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
    const after = JSON.parse(await raw(page));
    before.reports[0].rooms[0].observations[id][key] = value;
    before.reports[0].updatedAt = after.reports[0].updatedAt;
    expect(after).toEqual(before);
    await row(page, id).getByRole("button", { name: "Afturkalla breytingu", exact: true }).click();
    await expect(row(page, id)).toHaveAttribute("data-state", "deviation");
  }
});

test("note entry and blur to next action work once at a shortened mobile viewport", async ({ page }) => {
  await seed(page); await page.setViewportSize({ width: 390, height: 450 });
  const note = row(page).getByRole("textbox", { name: /^Athugasemd/ });
  await note.fill("Athugasemd með styttu skjásvæði");
  await note.focus();
  await page.keyboard.press("Tab");
  const next = row(page).getByRole("button", { name: "Næsta ófullskráða atriði", exact: true });
  await expect(next).toBeFocused();
  await expect(next).toBeInViewport({ ratio: 1 });
  const before = await raw(page);
  await next.click();
  await expect(page.locator(".checklist-item-open")).toHaveCount(1);
  await expect(page).toHaveURL(/atridi=closets/);
  expect(await raw(page)).toBe(before);
});

test("confirmation reflows with large text and a shortened mobile viewport; keyboard actions stay reachable", async ({ page }) => {
  await seed(page); await expandAssessment(row(page));
  await page.setViewportSize({ width: 360, height: 450 });
  await row(page).getByRole("radio", { name: "Í lagi", exact: true }).click();
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll<HTMLElement>("dialog *")].map(el => [el, parseFloat(getComputedStyle(el).fontSize)] as const);
    sizes.forEach(([el, size]) => { el.style.fontSize = `${size * 2}px`; });
  });
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  const cancel = page.getByRole("button", { name: "Halda fyrra mati", exact: true });
  await page.keyboard.press("Tab"); await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Staðfesta breytingu", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
});

test.describe("UI transactions against the real DemoStore", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let document: string; let writes: number; let fail: boolean;
  class ControlledStore extends DemoStore {
    status(value: SaveStatus) { this.emit({ ...this.getSnapshot(), status: value }); }
  }
  test.beforeEach(() => {
    document = JSON.stringify({ version: 1, unknown: { keep: false }, reports: [checklistReport(true)] }); writes = 0; fail = false;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => document, setItem: (_key: string, value: string) => { writes++; if (fail) throw Error("Synthetic storage failure"); document = value; } } });
  });
  test.afterEach(() => { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else Reflect.deleteProperty(globalThis, "localStorage"); });
  const observation = (store: DemoStore) => store.getSnapshot().reports[0].rooms[0].observations.walls;
  test("stale confirmation rejects assessment ABA and replaced/deleted target without another write", () => {
    for (const mutation of ["ABA", "assessment", "item", "room", "report", "metadata", "lock"] as const) {
      document = JSON.stringify({ version: 1, reports: [checklistReport(true)] });
      const store = new ControlledStore(); store.hydrate();
      const change = prepareAssessmentChange(store, target, { condition: "good" })!;
      if (mutation === "ABA") {
        store.updateObservation(target.reportId, target.roomId, target.itemId, { ...observation(store), condition: "wear" });
        store.updateObservation(target.reportId, target.roomId, target.itemId, { ...observation(store), condition: "damaged" });
      } else if (mutation === "assessment") store.updateObservation(target.reportId, target.roomId, target.itemId, { ...observation(store), cleanliness: "dirty" });
      else if (mutation === "item") store.updateRoom(target.reportId, target.roomId, room => ({ ...room, items: room.items.map(i => ({ ...i })) }));
      else if (mutation === "room") store.removeRoom(target.reportId, target.roomId);
      else if (mutation === "report") store.updateReport(target.reportId, report => structuredClone(report));
      else if (mutation === "metadata") store.updateReport(target.reportId, report => ({ ...report, title: "Replaced title" }));
      else { store.status("conflict"); store.status("saved"); }
      const before = document, count = writes;
      expect(change.apply()).toBeNull(); expect(document).toBe(before); expect(writes).toBe(count);
    }
  });
  test("undo rejects a deleted target and clear preserves unknown fields", () => {
    const store = new ControlledStore(); store.hydrate();
    const undo = prepareAssessmentChange(store, target, { condition: "good" })!.apply()!;
    store.updateRoom(target.reportId, target.roomId, room => ({ ...room, items: room.items.filter(item => item.id !== target.itemId) }));
    const before = document, count = writes;
    expect(undo.apply()).toBeNull(); expect(document).toBe(before); expect(writes).toBe(count);
    document = JSON.stringify({ version: 1, reports: [checklistReport(true)] });
    const clearing = new ControlledStore(); clearing.hydrate();
    clearing.updateObservation(target.reportId, target.roomId, target.itemId, { ...observation(clearing), ...{ unknown: { raw: [false, ""] } } });
    prepareAssessmentChange(clearing, target, { condition: undefined, damageType: "", location: "", description: "", note: "" })!.apply()?.dispose();
    expect(observation(clearing)).toEqual({ ...EMPTY_OBSERVATION, unknown: { raw: [false, ""] } });
  });
  test("confirmation and undo preserve newer prose and extensions; undo rejects same-field ABA", () => {
    const store = new ControlledStore(); store.hydrate();
    const change = prepareAssessmentChange(store, target, { condition: "good" })!;
    store.updateObservation(target.reportId, target.roomId, target.itemId, { ...observation(store), note: "New note", ...{ extension: { raw: [false, 0] } } });
    const undo = change.apply()!; expect(observation(store).note).toBe("New note");
    store.updateObservation(target.reportId, target.roomId, target.itemId, { ...observation(store), condition: "wear" });
    store.updateObservation(target.reportId, target.roomId, target.itemId, { ...observation(store), condition: "good" });
    const before = document, count = writes;
    expect(undo.apply()).toBeNull(); expect(document).toBe(before); expect(writes).toBe(count);
  });
  test("failed persistence stays in memory with error and retries the same draft", () => {
    const store = new ControlledStore(); store.hydrate(); const before = document;
    fail = true; const undo = prepareAssessmentChange(store, target, { condition: "good" })!.apply();
    expect(undo).not.toBeNull(); expect(document).toBe(before); expect(store.getSnapshot().status).toBe("error"); expect(observation(store).condition).toBe("good");
    fail = false; store.retrySave(); expect(store.getSnapshot().status).toBe("saved"); expect(JSON.parse(document).reports[0].rooms[0].observations.walls.condition).toBe("good"); undo?.dispose();
  });
  test("no-op, unreadable data and each locked save state never write", () => {
    const store = new ControlledStore(); store.hydrate();
    expect(prepareAssessmentChange(store, target, { condition: "damaged" })).toBeNull(); expect(writes).toBe(0);
    for (const status of ["loading", "read-error", "conflict", "refresh-required"] as const) { store.status(status); expect(prepareAssessmentChange(store, target, { condition: "good" })).toBeNull(); }
    document = '{"version":999,"unknown":"keep exactly"}'; const unreadable = new DemoStore(); unreadable.hydrate(); const before = document;
    expect(prepareAssessmentChange(unreadable, target, { condition: "good" })).toBeNull(); expect(document).toBe(before); expect(writes).toBe(0);
    expect(EMPTY_OBSERVATION.condition).toBeUndefined();
  });
});
