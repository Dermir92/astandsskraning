import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { InspectionPositions, decodePosition, inspectionHref, itemProgress, missingAnswers, navigationTargetId, nextIncomplete, positionKey, resolveInspection } from "../src/lib/inspection-navigation";
import { EMPTY_OBSERVATION, reportStats } from "../src/lib/model";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { checklistReport } from "./inspection-checklist-fixtures";
import { chooseAssessment } from "./inspection-ui-helpers";

const base = "/skyrslur/checklist-report";
const key = positionKey("checklist-report");
const position = { roomId: "checklist-entry", itemId: "windows" };
const row = (page: Page, item: string) => page.locator(`.checklist-item[data-item="${item}"]`);
const raw = (page: Page) => page.evaluate(k => localStorage.getItem(k), STORAGE_KEY);
async function seed(page: Page, report = checklistReport(), nav?: string, route = `${base}/skraning`) {
  const document = JSON.stringify({ version: 1, reports: [report] });
  await page.addInitScript(({ document, nav, reportKey, navKey }) => {
    if (!sessionStorage.getItem("navigation-seeded")) {
      localStorage.setItem(reportKey, document);
      localStorage.setItem("navigation-sentinel", "untouched");
      if (nav !== undefined) localStorage.setItem(navKey, nav);
      sessionStorage.setItem("navigation-seeded", "1");
    }
  }, { document, nav, reportKey: STORAGE_KEY, navKey: key });
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  return document;
}
async function expanded(page: Page, item: string) { await expect(row(page, item).locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "true"); }
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }

test("position contracts isolate storage, protect unsupported data and resolve intent without mutating reports", () => {
  const report = checklistReport(true);
  const before = JSON.stringify(report);
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  const store = new InspectionPositions(() => storage);
  store.remember(report, position);
  expect(data.size).toBe(1);
  expect(decodePosition(data.get(key)!)).toEqual(position);
  for (const invalid of ["", "{", "[]", '{"version":2,"roomId":"checklist-entry","itemId":"floor"}', '{"version":1,"roomId":3,"itemId":null}', JSON.stringify({ version: 1, ...position, answer: "good" }), " ".repeat(4097)]) {
    data.set(key, invalid);
    const protectedStore = new InspectionPositions(() => storage);
    protectedStore.remember(report, position);
    expect(data.get(key)).toBe(invalid);
    expect(protectedStore.getSnapshot()[report.id]).toEqual({ position, unavailable: true });
  }
  const failing = new InspectionPositions(() => { throw new Error("blocked"); });
  expect(() => failing.remember(report, position)).not.toThrow();
  expect(failing.getSnapshot()[report.id].position).toEqual(position);
  const explicit = (query: string) => resolveInspection(report, new URLSearchParams(query), position);
  expect(explicit("rymi=checklist-living").position).toEqual({ roomId: "checklist-living", itemId: null });
  expect(explicit("rymi=checklist-entry&atridi=floor").item?.id).toBe("floor");
  for (const query of ["atridi=windows", "rymi=missing&atridi=windows", "rymi=checklist-entry&atridi=missing", "rymi=checklist-entry&rymi=checklist-living", "rymi=checklist-entry&atridi="]) {
    expect(explicit(query).invalid).toBe(true);
    expect(explicit(query).item).toBeUndefined();
  }
  expect(resolveInspection(report, new URLSearchParams(), { ...position, itemId: "deleted" }).position).toEqual({ roomId: "checklist-entry", itemId: null });
  const reordered = { ...report, rooms: [...report.rooms].reverse() };
  expect(resolveInspection(reordered, new URLSearchParams(), position).position).toEqual(position);
  const duplicated = { ...report, rooms: [report.rooms[0], report.rooms[0]] };
  expect(resolveInspection(duplicated, new URLSearchParams("rymi=checklist-entry&atridi=floor")).item).toBeUndefined();
  expect(resolveInspection({ ...report, rooms: [] }, new URLSearchParams(), position).position).toBeNull();
  const encoded = { roomId: "Rými & eitt", itemId: "gólf/#?" };
  const params = new URL(inspectionHref(report.id, encoded), "https://example.test").searchParams;
  expect(params.get("rymi")).toBe(encoded.roomId);
  expect(params.get("atridi")).toBe(encoded.itemId);
  expect(JSON.stringify(report)).toBe(before);
});

test("classification and next-item contracts retain unknown, N/A, deviation and evidence distinctions", () => {
  const report = checklistReport(true);
  const room = report.rooms[0];
  const window = room.items.find(item => item.id === "windows")!;
  expect(itemProgress(window, undefined)).toBe("unanswered");
  expect(itemProgress(window, { ...EMPTY_OBSERVATION, note: " " })).toBe("unanswered");
  expect(itemProgress(window, { ...EMPTY_OBSERVATION, note: "Athugasemd" })).toBe("partial");
  expect(itemProgress(window, { ...EMPTY_OBSERVATION, functionality: "works" })).toBe("partial");
  expect(itemProgress(window, room.observations.windows)).toBe("recorded");
  expect(missingAnswers(window, { ...EMPTY_OBSERVATION, condition: "na" })).toEqual([]);
  expect(itemProgress(window, { ...EMPTY_OBSERVATION, condition: "damaged" })).toBe("partial");
  report.rooms = [room];
  room.observations.floor.cleanliness = "clean";
  room.observations.closets = { ...EMPTY_OBSERVATION, condition: "good", functionality: "works", cleanliness: "clean" };
  room.observations.doors = { ...EMPTY_OBSERVATION, condition: "wear" };
  expect(nextIncomplete(report, { roomId: room.id, itemId: "closets" })).toEqual({ roomId: room.id, itemId: "doors" });
  expect(nextIncomplete(report, { roomId: room.id, itemId: "doors" })).toBeNull();
  room.observations.doors.functionality = "works";
  expect(reportStats(report).recorded).toBe(room.items.length);
  expect(nextIncomplete(report, position)).toBeNull();
  expect(reportStats(report).attention).toBe(1);
});

test("resume survives reload and a new browser tab; navigation leaves report bytes and answers unchanged", async ({ page, context }) => {
  const document = await seed(page);
  await row(page, "windows").locator(".checklist-toggle").click();
  await expanded(page, "windows");
  await expect(page).toHaveURL(/rymi=checklist-entry&atridi=windows$/);
  await row(page, "windows").getByRole("button", { name: "Loka atriði", exact: true }).click();
  await expect(row(page, "windows").locator(".checklist-toggle")).toBeFocused();
  await page.reload();
  await expanded(page, "windows");
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  const other = await context.newPage();
  await other.goto(`${base}/skraning`);
  await expanded(other, "windows");
  expect(await raw(page)).toBe(document);
  expect(await raw(other)).toBe(document);
  expect(await page.evaluate(() => localStorage.getItem("navigation-sentinel"))).toBe("untouched");
  await other.close();
});

test("a visited unanswered draft offers Continue while an unvisited draft keeps its details entry", async ({ page }) => {
  const document = await seed(page, checklistReport(), undefined, "/");
  const open = page.getByRole("link", { name: "Opna drög: Prófunargata B", exact: true });
  await expect(open).toHaveAttribute("href", `${base}/upplysingar`);
  await page.goto(`${base}/skraning?rymi=checklist-living&atridi=ceiling`);
  await expanded(page, "ceiling");
  await page.getByRole("link", { name: "Mínar skýrslur", exact: true }).click();
  await page.getByRole("link", { name: "Halda áfram: Prófunargata B", exact: true }).click();
  await expanded(page, "ceiling");
  await expect(page.getByRole("heading", { name: "Stofa", exact: true })).toBeVisible();
  expect(await raw(page)).toBe(document);
});

test("condition-only quick answers stay collapsed and remember the explicitly answered item", async ({ page }) => {
  await seed(page);
  await row(page, "walls").getByRole("button", { name: "Ástand í lagi: Veggir", exact: true }).click();
  await expect(row(page, "walls").locator(".checklist-toggle")).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/rymi=checklist-entry&atridi=walls$/);
  await expect(page.locator(".checklist-item-open")).toHaveCount(0);
  const report = JSON.parse((await raw(page))!).reports[0];
  expect(report.rooms[0].observations.walls).toEqual({ ...EMPTY_OBSERVATION, condition: "good" });
  expect(Object.keys(report.rooms[0].observations)).toEqual(["walls"]);
  await page.reload();
  await expanded(page, "walls");
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), key)).toEqual({ version: 1, roomId: "checklist-entry", itemId: "walls" });
});

test("explicit rooms/items beat resume; stale and malformed destinations fall back without answers", async ({ page }) => {
  const document = await seed(page, checklistReport(), JSON.stringify({ version: 1, ...position }), `${base}/skraning?rymi=checklist-living`);
  await expect(page.getByRole("heading", { name: "Stofa", exact: true })).toBeVisible();
  await expect(page.locator(".checklist-item-open")).toHaveCount(0);
  await page.goto(`${base}/skraning?rymi=checklist-entry&atridi=doors`);
  await expanded(page, "doors");
  for (const query of ["rymi=checklist-living&atridi=removed", "rymi=removed&atridi=windows", "atridi=windows", "rymi=checklist-entry&rymi=checklist-living"]) {
    await page.goto(`${base}/skraning?${query}`);
    await expect(page.locator(".navigation-nonexistent")).toHaveCount(0);
    await expect(page.locator(".checklist-toggle").first()).toBeVisible();
    await expect(page.locator(".checklist-item-open")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Staðsetningin fannst ekki" })).toBeVisible();
  }
  expect(await raw(page)).toBe(document);
});

test("incomplete links distinguish partial answers and exclude completed attention and missing photos", async ({ page }) => {
  const report = checklistReport(true);
  report.rooms[0].observations.closets = { ...EMPTY_OBSERVATION, functionality: "works" };
  report.rooms[0].observations.doors = { ...EMPTY_OBSERVATION, condition: "wear" };
  const document = await seed(page, report);
  const list = page.locator(".inspection-overall details");
  await list.locator("summary").click();
  await expect(list.getByRole("link", { name: /Skápar.*Ófullskráð/ })).toBeVisible();
  await expect(list.getByRole("link", { name: /Hurðir.*Ófullskráð.*Virkni vantar/ })).toBeVisible();
  await expect(list.locator('a[href*="rymi=checklist-entry&atridi=windows"]')).toHaveCount(0);
  await expect(list.locator('a[href*="rymi=checklist-entry&atridi=walls"]')).toHaveCount(0);
  await expect(list.getByRole("link", { name: /Loft.*Ósvarað/ })).toHaveCount(2);
  await list.getByRole("link", { name: /Hurðir.*Ófullskráð/ }).first().click();
  await expanded(page, "doors");
  await expect(row(page, "doors").locator('[data-question="functionality"]')).toBeFocused();
  expect(await raw(page)).toBe(document);
});

test("next incomplete crosses rooms, wraps once and supplies no answers or history entries", async ({ page }) => {
  const document = await seed(page, checklistReport(), undefined, `${base}/skraning?rymi=checklist-entry&atridi=closets`);
  const count = await page.evaluate(() => history.length);
  await row(page, "closets").getByRole("button", { name: "Næsta ófullskráða atriði", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Stofa", exact: true })).toBeVisible();
  await expanded(page, "floor");
  await page.goto(`${base}/skraning?rymi=checklist-bedroom&atridi=closets`);
  const afterGoto = await page.evaluate(() => history.length);
  await row(page, "closets").getByRole("button", { name: "Næsta ófullskráða atriði", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Forstofa", exact: true })).toBeVisible();
  await expanded(page, "floor");
  expect(await page.evaluate(() => history.length)).toBe(afterGoto);
  expect(afterGoto).toBe(count + 1);
  expect(await raw(page)).toBe(document);
});

test("review editing returns to a stable item after its original finding disappears; Back/Forward remain exact", async ({ page }) => {
  await seed(page, checklistReport(true), undefined, `${base}/yfirferd`);
  const reviewRoom = page.locator(".review-room").first();
  await reviewRoom.locator(".review-observations").getByRole("link", { name: "Gluggar", exact: true }).click();
  await expanded(page, "windows");
  const count = await page.evaluate(() => history.length);
  await chooseAssessment(page, row(page, "windows"), "Í lagi");
  await row(page, "windows").getByRole("radio", { name: "Virkar", exact: true }).check();
  await row(page, "windows").getByRole("radio", { name: "Hreint", exact: true }).check();
  expect(await page.evaluate(() => history.length)).toBe(count);
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  const source = page.locator(`[id="${navigationTargetId("review", "checklist-entry", "windows")}"]`);
  await expect(source).toBeFocused();
  await expect(source).toContainText("Skráð");
  await expect(page.locator(".review-room").first().locator(".review-observations").getByRole("link", { name: "Gluggar", exact: true })).toHaveCount(0);
  await page.goForward();
  await expanded(page, "windows");
  await page.goBack();
  await expect(source).toBeFocused();
});

test("review context survives room changes and reload with a safe fixed return URL", async ({ page }) => {
  const document = await seed(page, checklistReport(), undefined, `${base}/yfirferd`);
  const room = page.locator(".review-room").first();
  await room.locator("details summary").click();
  await room.locator("details").getByRole("link", { name: /^Gluggar/ }).click();
  const source = navigationTargetId("review", "checklist-entry", "windows");
  await page.getByRole("link", { name: "Næsta rými", exact: true }).click();
  await expect(page).toHaveURL(/rymi=checklist-living&fra=yfirferd&yfirferdRymi=checklist-entry&yfirferdAtridi=windows$/);
  await page.reload();
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(page.locator(`[id="${source}"]`)).toBeFocused();
  expect(await raw(page)).toBe(document);
});

test("a review edit after document reload focuses its missing group and returns a fully visible source link", async ({ page }) => {
  await seed(page, checklistReport(true), undefined, `${base}/skraning?rymi=checklist-entry&atridi=doors`);
  await page.reload();
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  const reviewRoom = page.locator(".review-room").first();
  const source = page.locator(`[id="${navigationTargetId("review", "checklist-entry", "floor")}"]`);
  await reviewRoom.locator(".review-observations").getByRole("link", { name: "Gólfefni", exact: true }).click();
  await expanded(page, "floor");
  await expect(row(page, "floor").locator('[data-question="cleanliness"]')).toBeFocused();
  await expect(row(page, "floor").getByRole("radio", { name: "Hreint", exact: true })).not.toBeChecked();
  await row(page, "floor").getByRole("radio", { name: "Hreint", exact: true }).check();
  await page.getByRole("link", { name: "Aftur í yfirferð", exact: true }).first().click();
  await expect(source).toBeFocused();
  await expect(source).toBeInViewport({ ratio: 1 });
  await source.press("Tab");
  const nextLink = reviewRoom.locator("details").getByRole("link", { name: /^Veggir/ });
  await expect(nextLink).toBeFocused();
  await expect(nextLink).toBeInViewport({ ratio: 1 });
  await page.goBack();
  await expanded(page, "doors");
  await expect(row(page, "doors").locator(".checklist-toggle")).toBeFocused();
  await expect(row(page, "doors").locator(".checklist-toggle")).toBeInViewport({ ratio: 1 });
});

test("navigation-only storage failure is non-blocking and report save/retry remain independent", async ({ page }) => {
  await page.addInitScript(prefix => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if (key.startsWith(prefix)) throw new DOMException("Blocked", "QuotaExceededError"); return original.call(this, key, value); };
  }, "astandsskraning-navigation-v1:");
  await seed(page);
  await row(page, "windows").locator(".checklist-toggle").click();
  await expanded(page, "windows");
  await expect(page.getByRole("status").filter({ hasText: "Ekki tókst að muna" })).toBeVisible();
  await row(page, "windows").getByRole("button", { name: "Ástand í lagi: Gluggar", exact: true }).click();
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  await page.reload();
  await expanded(page, "windows");
  await expect(row(page, "windows")).toContainText("Í lagi · Ófullskráð");
});

test("invalid navigation metadata is preserved and cannot replace valid drafts", async ({ page }) => {
  const invalid = '{"version":999,"roomId":"checklist-entry","itemId":"floor"}';
  const document = await seed(page, checklistReport(), invalid);
  await row(page, "doors").locator(".checklist-toggle").click();
  await expanded(page, "doors");
  await page.reload();
  await expanded(page, "doors");
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(invalid);
  expect(await raw(page)).toBe(document);
});

test("report-only write failure retains pending edits and retry while navigation remains independent", async ({ page }) => {
  await page.addInitScript(reportKey => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === reportKey && sessionStorage.getItem("fail-report-write")) throw new DOMException("Blocked", "QuotaExceededError");
      return original.call(this, key, value);
    };
  }, STORAGE_KEY);
  const document = await seed(page);
  await page.evaluate(() => sessionStorage.setItem("fail-report-write", "1"));
  await row(page, "walls").getByRole("button", { name: "Ástand í lagi: Veggir", exact: true }).click();
  await expect(page.locator(".topbar .save-status")).toHaveText("Ekki tókst að vista í vafra");
  expect(await raw(page)).toBe(document);
  await page.getByRole("link", { name: "Næsta rými", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Stofa", exact: true })).toBeVisible();
  await expect(page.locator(".topbar .save-status")).toHaveText("Ekki tókst að vista í vafra");
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), key)).toEqual({ version: 1, roomId: "checklist-living", itemId: null });
  await page.evaluate(() => sessionStorage.removeItem("fail-report-write"));
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  expect(JSON.parse((await raw(page))!).reports[0].rooms[0].observations.walls.condition).toBe("good");
});

test("metadata read exceptions do not block explicit destinations or valid answer saving", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
      if (key.startsWith("astandsskraning-navigation-v1:")) throw new DOMException("Blocked", "SecurityError");
      return original.call(this, key);
    };
  });
  await seed(page, checklistReport(), undefined, `${base}/skraning?rymi=checklist-entry&atridi=walls`);
  await expanded(page, "walls");
  await expect(page.getByRole("status").filter({ hasText: "Ekki tókst að muna" })).toBeVisible();
  await row(page, "walls").getByRole("button", { name: "Ástand í lagi: Veggir", exact: true }).click();
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  await page.reload();
  await expanded(page, "walls");
  expect(JSON.parse((await raw(page))!).reports[0].rooms[0].observations.walls.condition).toBe("good");
});

test("report positions are isolated and another tab cannot redirect an active inspection", async ({ page, context }) => {
  const first = checklistReport();
  await seed(page, first);
  const second = { ...structuredClone(first), id: "other-report" };
  const document = JSON.stringify({ version: 1, reports: [first, second] });
  await page.evaluate(({ key, document }) => localStorage.setItem(key, document), { key: STORAGE_KEY, document });
  await page.reload();
  await row(page, "floor").locator(".checklist-toggle").click();
  await expanded(page, "floor");
  const other = await context.newPage();
  await other.goto("/skyrslur/other-report/skraning");
  await expect(other.locator(".checklist-item-open")).toHaveCount(0);
  await row(other, "windows").locator(".checklist-toggle").click();
  await expanded(other, "windows");
  await expanded(page, "floor");
  await expect(page).toHaveURL(/checklist-report\/skraning\?rymi=checklist-entry&atridi=floor$/);
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)!).itemId, key)).toBe("floor");
  expect(await other.evaluate(k => JSON.parse(localStorage.getItem(k)!).itemId, positionKey("other-report"))).toBe("windows");
  expect(await raw(page)).toBe(document);
  await other.close();
});

test("typing preserves the active item, focus, viewport and history; ordinary answers never advance", async ({ page }) => {
  await seed(page, checklistReport(), undefined, `${base}/skraning?rymi=checklist-entry&atridi=windows`);
  await expanded(page, "windows");
  const note = row(page, "windows").getByRole("textbox", { name: /^Athugasemd/ });
  await note.fill("Fyrsta athugasemd");
  const before = await page.evaluate(() => ({ history: history.length, url: location.href, scroll: scrollY }));
  await note.pressSequentially(" og viðbót");
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(note).toBeFocused();
  expect(await page.evaluate(() => ({ history: history.length, url: location.href, scroll: scrollY }))).toEqual(before);
  await expect(row(page, "windows")).toHaveAttribute("data-state", "incomplete");
  await expect(page.locator(".checklist-item-open")).toHaveCount(1);
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

test("read-protected reports neither write navigation metadata nor mutate unreadable source data", async ({ page }) => {
  const invalid = "{unreadable-report";
  await page.addInitScript(({ reportKey, invalid }) => { localStorage.setItem(reportKey, invalid); }, { reportKey: STORAGE_KEY, invalid });
  await page.goto("/");
  await expect(page.locator(".topbar .save-status")).toHaveText("Staðbundin gögn læst til verndar");
  await page.getByRole("link", { name: /^Halda áfram:/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await row(page, "windows").locator(".checklist-toggle").click();
  await expanded(page, "windows");
  expect(await raw(page)).toBe(invalid);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("astandsskraning-navigation-v1:")))).toEqual([]);
});

test("an item selected during read-protected URL canonicalization remains open", async ({ page }) => {
  const invalid = "{unreadable-report";
  await page.addInitScript(({ reportKey, invalid }) => {
    localStorage.setItem(reportKey, invalid);
    const replace = history.replaceState;
    let selected = false;
    history.replaceState = function (...args) {
      const result = replace.apply(this, args);
      const params = new URLSearchParams(location.search);
      if (!selected && location.pathname.endsWith("/skraning") && params.has("rymi") && !params.has("atridi")) {
        const toggle = document.querySelector<HTMLButtonElement>('[data-item="windows"] .checklist-toggle');
        // Select at the native-history boundary, before the router query snapshot
        // catches up. This controls the race without delaying or retrying a click.
        if (toggle) { selected = true; toggle.click(); }
      }
      return result;
    };
  }, { reportKey: STORAGE_KEY, invalid });
  await page.goto("/");
  await expect(page.locator(".topbar .save-status")).toHaveText("Staðbundin gögn læst til verndar");
  await page.getByRole("link", { name: /^Halda áfram:/ }).first().click();
  await expanded(page, "windows");
  await expect(page).toHaveURL(/rymi=demo-kitchen&atridi=windows$/);
  expect(await raw(page)).toBe(invalid);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("astandsskraning-navigation-v1:")))).toEqual([]);
});

test("navigation targets preserve keyboard semantics, axe accessibility and reflow", async ({ page }) => {
  const report = checklistReport(true);
  report.rooms[0].observations.closets = { ...EMPTY_OBSERVATION, condition: "good", functionality: "works" };
  await seed(page, report, undefined, `${base}/skraning?rymi=checklist-entry&atridi=closets`);
  await expanded(page, "closets");
  await expect(row(page, "closets").locator('[data-question="cleanliness"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(row(page, "closets").getByRole("radio", { name: "Hreint", exact: true })).toBeFocused();
  await expect(row(page, "closets").getByRole("radio", { name: "Hreint", exact: true })).not.toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(row(page, "closets").getByRole("radio", { name: "Þarfnast þrifa", exact: true })).toBeChecked();
  for (const state of ["inspection", "review"] as const) {
    if (state === "review") {
      await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
      await page.locator(".review-room").first().locator("details summary").click();
    }
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await noOverflow(page);
  }
  await page.addStyleTag({ content: "body { font-size: 200% !important; }" });
  await noOverflow(page);
});
