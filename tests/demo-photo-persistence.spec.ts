import { expect, test, chromium, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DEMO_PHOTO_DB, photoTargets, validPhotoTarget } from "../src/lib/demo-photos";
import { STORAGE_KEY, DEMO_RECOVERY_KEY } from "../src/lib/demo-storage";
import { EMPTY_OBSERVATION } from "../src/lib/model";
import { checklistReport } from "./inspection-checklist-fixtures";

const route = "/skyrslur/checklist-report/skraning?rymi=checklist-living";
const file = "public/concepts/synthetic-wall-damage.png";
const overview = (page: Page) => page.getByRole("region", { name: "Yfirlitsmyndir rýmis", exact: true });
const thumbnails = (area: Locator) => area.locator("button[data-photo-id]");
const canonical = (page: Page) => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
async function seed(page: Page) {
  const report = checklistReport();
  report.rooms[1].observations.walls = { ...EMPTY_OBSERVATION, condition: "defect", damageType: "Rispa", location: "Við glugga", description: "Tilbúin rispa" };
  const raw = JSON.stringify({ version: 1, extension: { untouched: [false, 0, "  keep  "] }, reports: [report] });
  await page.addInitScript(({ key, raw }) => {
    if (localStorage.getItem(key) === null) { localStorage.setItem(key, raw); localStorage.setItem("d2-sentinel", "keep"); }
  }, { key: STORAGE_KEY, raw });
  await page.goto(route);
  await expect(overview(page).getByLabel("Yfirlitsmyndir rýmis: velja myndir", { exact: true })).toBeEnabled();
  return raw;
}
async function defect(page: Page) {
  const row = page.locator('.checklist-item[data-item="walls"]');
  if (await row.locator(".checklist-toggle").getAttribute("aria-expanded") !== "true") await row.locator(".checklist-toggle").click();
  const edit = row.getByRole("button", { name: "Breyta fráviki", exact: true });
  if (await edit.isVisible()) await edit.click();
  return row.getByRole("region", { name: "Fráviksmyndir", exact: true });
}
async function add(area: Locator, name = file, count = 1) {
  await area.locator('input[type="file"][multiple]').setInputFiles(name);
  await expect(thumbnails(area)).toHaveCount(count);
  await expect(area).toHaveAttribute("aria-busy", "false");
}
async function remove(area: Locator) {
  await area.getByRole("button", { name: /^Fjarlægja mynd 1:/ }).click();
  await area.getByRole("button", { name: "Fjarlægja mynd", exact: true }).click();
}
async function stored(page: Page) {
  return page.evaluate(async dbName => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open(dbName, 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    try {
      const rows = await new Promise<{ id: string; target: unknown; name: string; blob: Blob; order: number }[]>((resolve, reject) => {
        const tx = db.transaction("photos"); const r = tx.objectStore("photos").getAll(); tx.oncomplete = () => resolve(r.result); tx.onabort = () => reject(tx.error);
      });
      return await Promise.all(rows.map(async row => ({ id: row.id, target: row.target, name: row.name, order: row.order, size: row.blob.size,
        hash: Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await row.blob.arrayBuffer()))).map(v => v.toString(16).padStart(2, "0")).join("") })));
    } finally { db.close(); }
  }, DEMO_PHOTO_DB);
}
async function fault(page: Page, method: "add" | "delete" | "getAll", name = "QuotaExceededError") {
  await page.evaluate(({ method, name }) => {
    const original = IDBObjectStore.prototype[method];
    Object.assign(window, { restorePhotoFault: () => { Object.assign(IDBObjectStore.prototype, { [method]: original }); } });
    Object.assign(IDBObjectStore.prototype, { [method]: () => { throw new DOMException("Synthetic photo failure", name); } });
  }, { method, name });
}
async function retry(page: Page) {
  await page.evaluate(() => (window as unknown as { restorePhotoFault: () => void }).restorePhotoFault());
  await page.getByRole("button", { name: "Sækja myndir aftur", exact: true }).click();
  await expect(page.locator(".photo-storage-warning")).toHaveCount(0);
}

test("overview and defect bytes/IDs/associations survive reload and an actual browser restart", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "A single persistent Chromium profile verifies process restart.");
  const options = { headless: true, baseURL: String(info.project.use.baseURL), viewport: { width: 1440, height: 1000 } };
  const profile = info.outputPath("browser-profile");
  let context = await chromium.launchPersistentContext(profile, options);
  try {
    let tab = context.pages()[0];
    const raw = await seed(tab);
    await add(overview(tab)); await add(await defect(tab));
    const rows = await stored(tab);
    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.target)).toEqual(expect.arrayContaining([
      { reportId: "checklist-report", roomId: "checklist-living", itemId: null },
      { reportId: "checklist-report", roomId: "checklist-living", itemId: "walls" },
    ]));
    expect(rows[0].hash).toBe(rows[1].hash);
    expect(await canonical(tab)).toBe(raw);
    await tab.reload(); await expect(thumbnails(overview(tab))).toHaveCount(1); await expect(thumbnails(await defect(tab))).toHaveCount(1);
    expect(await stored(tab)).toEqual(rows);
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    tab = context.pages()[0]; await tab.goto(route);
    await expect(thumbnails(overview(tab))).toHaveCount(1); await expect(thumbnails(await defect(tab))).toHaveCount(1);
    expect(await stored(tab)).toEqual(rows); expect(await canonical(tab)).toBe(raw);
    expect(await tab.evaluate(() => localStorage.getItem("d2-sentinel"))).toBe("keep");
    await tab.goto("/skyrslur/checklist-report/yfirferd");
    await expect(tab.getByRole("group", { name: "Myndir: Stofa · Yfirlitsmyndir rýmis", exact: true })).toBeVisible();
  } finally { await context.close(); }
  expect(page.url()).toBe("about:blank");
});

test("confirmed deletion persists without affecting the other association or report JSON", async ({ page }) => {
  const raw = await seed(page); await add(overview(page)); const area = await defect(page); await add(area);
  const before = await stored(page);
  await area.getByRole("button", { name: /^Fjarlægja mynd 1:/ }).click();
  await area.getByRole("button", { name: "Hætta við", exact: true }).click(); expect(await stored(page)).toEqual(before);
  await remove(area); await expect(thumbnails(area)).toHaveCount(0);
  expect(await stored(page)).toEqual(before.filter(row => (row.target as { itemId: string | null }).itemId === null));
  await page.reload(); await expect(thumbnails(overview(page))).toHaveCount(1); await expect(thumbnails(await defect(page))).toHaveCount(0);
  expect(await canonical(page)).toBe(raw);
});

test("quota and deletion failures preserve existing bytes and require explicit retry", async ({ page }) => {
  const raw = await seed(page); await add(overview(page)); const before = await stored(page);
  await fault(page, "add");
  await overview(page).locator('input[type="file"][multiple]').setInputFiles(file);
  await expect(page.locator(".photo-storage-warning")).toContainText("full"); await expect(thumbnails(overview(page))).toHaveCount(1);
  expect(await stored(page)).toEqual(before); expect(await canonical(page)).toBe(raw);
  await retry(page); await add(overview(page), file, 2);
  const two = await stored(page); await fault(page, "delete"); await remove(overview(page));
  await expect(page.locator(".photo-storage-warning")).toContainText("Myndinni var ekki eytt");
  await expect(page.getByRole("button", { name: "Sækja myndir aftur", exact: true })).toBeFocused();
  expect(await stored(page)).toEqual(two); await expect(thumbnails(overview(page))).toHaveCount(2);
  await retry(page); await remove(overview(page)); await expect(thumbnails(overview(page))).toHaveCount(1);
  await page.reload(); await expect(thumbnails(overview(page))).toHaveCount(1); expect(await canonical(page)).toBe(raw);
});

test("read denial preserves thumbnails, locks photo and room deletion, and recovers without report writes", async ({ page }) => {
  const raw = await seed(page); await add(overview(page)); const before = await stored(page);
  await fault(page, "getAll", "SecurityError");
  // Cycle ownership to trigger the same read path used by a restored page.
  await page.evaluate(() => { dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })); dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })); });
  await expect(page.locator(".photo-storage-warning")).toContainText("Ekki tókst að lesa");
  await expect(thumbnails(overview(page))).toHaveCount(1); await expect(overview(page).locator('input[type="file"][multiple]')).toBeDisabled();
  await page.locator("summary").filter({ hasText: /^Skoðun eignar ·/ }).click();
  await page.locator('a[href="/skyrslur/checklist-report/rymi"]').first().click();
  await page.getByRole("button", { name: "Fjarlægja Stofa", exact: true }).click();
  await page.getByRole("button", { name: "Fjarlægja rými", exact: true }).click();
  await expect(page.locator(".storage-warning").first()).toContainText("fjarlægðu tengdar myndir sérstaklega");
  expect(await canonical(page)).toBe(raw);
  await retry(page); expect(await stored(page)).toEqual(before);
});

test("initial photo read failure never presents an empty writable collection or replaces saved evidence", async ({ page }) => {
  const raw = await seed(page); await add(overview(page)); const before = await stored(page);
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.getAll;
    Object.assign(window, { restorePhotoFault: () => { IDBObjectStore.prototype.getAll = original; } });
    IDBObjectStore.prototype.getAll = () => { throw new DOMException("Synthetic startup denial", "SecurityError"); };
  });
  await page.reload(); await expect(page.locator(".photo-storage-warning")).toContainText("engin tóm myndageymsla");
  await expect(overview(page).locator('input[type="file"][multiple]')).toBeDisabled();
  expect(await canonical(page)).toBe(raw); await retry(page);
  await expect(thumbnails(overview(page))).toHaveCount(1); expect(await stored(page)).toEqual(before);
});

test("orphaned evidence is retained with its original tuple and disclosed, never rebound to another room", async ({ page }) => {
  await seed(page); await add(overview(page)); const before = await stored(page);
  const replacement = checklistReport(); replacement.rooms[1].id = "replacement-room";
  await page.evaluate(({ key, report }) => localStorage.setItem(key, JSON.stringify({ version: 1, reports: [report] })), { key: STORAGE_KEY, report: replacement });
  await page.reload(); await expect(page.locator(".photo-storage-warning")).toContainText("upprunalegum auðkennum");
  expect(await stored(page)).toEqual(before); await expect(page.locator("button[data-photo-id]")).toHaveCount(0);
});

test("a colliding photo ID aborts instead of overwriting evidence", async ({ page }) => {
  const raw = await seed(page); await add(overview(page)); const before = await stored(page);
  await page.evaluate(id => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (value, key) { return add.call(this, { ...value, id }, key); };
  }, before[0].id);
  await overview(page).locator('input[type="file"][multiple]').setInputFiles(file);
  await expect(page.locator(".photo-storage-warning")).toContainText("Nýja myndin var ekki vistuð");
  expect(await stored(page)).toEqual(before); expect(await canonical(page)).toBe(raw);
});

test("unavailable IndexedDB on startup preserves the saved database and supports explicit recovery", async ({ page }) => {
  const raw = await seed(page); await add(overview(page)); const before = await stored(page);
  await page.addInitScript(() => {
    const open = indexedDB.open.bind(indexedDB);
    Object.assign(window, { restorePhotoFault: () => { indexedDB.open = open; } });
    indexedDB.open = () => { throw new DOMException("Synthetic unavailable storage", "SecurityError"); };
  });
  await page.reload(); await expect(page.locator(".photo-storage-warning")).toContainText("Ekki tókst að lesa");
  await expect(overview(page).locator('input[type="file"][multiple]')).toBeDisabled();
  expect(await canonical(page)).toBe(raw); await retry(page);
  expect(await stored(page)).toEqual(before); await expect(thumbnails(overview(page))).toHaveCount(1);
});

test("unsupported photo records fail closed without rewriting their blobs or metadata", async ({ page }) => {
  const raw = await seed(page); await add(overview(page)); const before = await stored(page);
  await page.evaluate(dbName => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open(dbName, 1);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction("photos", "readwrite"), store = tx.objectStore("photos"), read = store.getAll();
      read.onsuccess = () => store.put({ ...read.result[0], version: 99 });
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
    }; open.onerror = () => reject(open.error);
  }), DEMO_PHOTO_DB);
  await page.reload(); await expect(page.locator(".photo-storage-warning")).toContainText("Ekki tókst að lesa");
  await expect(overview(page).locator('input[type="file"][multiple]')).toBeDisabled();
  expect(await stored(page)).toEqual(before); expect(await canonical(page)).toBe(raw);
});

test("ambiguous legacy concatenated keys never resolve to an arbitrary report/room", () => {
  const first = checklistReport(), second = checklistReport();
  first.id = "a:b"; first.rooms = [{ ...first.rooms[1], id: "c" }];
  second.id = "a"; second.rooms = [{ ...second.rooms[1], id: "b:c" }];
  expect(photoTargets([first, second], "a:b:c:overview")).toHaveLength(2);
  expect(validPhotoTarget([first, second], { reportId: "a:b", roomId: "c", itemId: null })).toBe(false);
});

test("a committed photo remains saved if thumbnail URL creation fails and explicit reload recovers it", async ({ page }) => {
  const raw = await seed(page);
  await page.evaluate(() => {
    const create = URL.createObjectURL; let calls = 0;
    Object.assign(window, { restorePhotoFault: () => { URL.createObjectURL = create; } });
    URL.createObjectURL = blob => { if (++calls > 1) throw Error("Synthetic thumbnail failure"); return create(blob); };
  });
  await overview(page).locator('input[type="file"][multiple]').setInputFiles(file);
  await expect(page.locator(".photo-storage-warning")).toContainText("var vistuð en ekki tókst að birta");
  const before = await stored(page); expect(before).toHaveLength(1); expect(await canonical(page)).toBe(raw);
  await retry(page); await expect(thumbnails(overview(page))).toHaveCount(1); expect(await stored(page)).toEqual(before);
});

test("writer/reader notification and takeover use latest photos and preserve deletion", async ({ page, context }) => {
  await seed(page); const reader = await context.newPage(); await reader.goto(route);
  const picker = overview(reader).locator('input[type="file"][multiple]'); await expect(picker).toBeDisabled();
  await add(overview(page)); const rows = await stored(page);
  await expect(reader.locator(".photo-storage-warning")).toContainText("öðrum flipa");
  await reader.getByRole("button", { name: "Sækja myndir aftur", exact: true }).click();
  await expect(thumbnails(overview(reader))).toHaveCount(1); await expect(picker).toBeDisabled();
  await page.close(); await reader.getByRole("button", { name: "Reyna breytingarétt aftur", exact: true }).click();
  await expect(picker).toBeEnabled(); expect(await stored(reader)).toEqual(rows);
  await remove(overview(reader)); await expect(thumbnails(overview(reader))).toHaveCount(0);
  await reader.reload(); await expect(thumbnails(overview(reader))).toHaveCount(0); expect(await stored(reader)).toEqual([]);
});

test("pending decode cannot write after pagehide and another tab takes ownership", async ({ page, context }) => {
  const raw = await seed(page);
  await page.evaluate(() => {
    const original = createImageBitmap;
    window.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) => new Promise(resolve => {
      Object.assign(window, { releaseDecode: () => { void original(...args).then(resolve); } });
    })) as typeof createImageBitmap;
  });
  await overview(page).locator('input[type="file"][multiple]').setInputFiles(file);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  const next = await context.newPage(); await next.goto(route);
  await expect(overview(next).locator('input[type="file"][multiple]')).toBeEnabled();
  await page.evaluate(() => (window as unknown as { releaseDecode: () => void }).releaseDecode());
  await expect(overview(page).getByRole("alert")).toContainText("var ekki vistuð");
  expect(await stored(next)).toEqual([]); expect(await canonical(next)).toBe(raw);
});

test("loss of lease between request success and commit aborts the blob write", async ({ page }) => {
  const raw = await seed(page);
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      const request = add.apply(this, args);
      request.addEventListener("success", () => dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
      return request;
    };
  });
  await overview(page).locator('input[type="file"][multiple]').setInputFiles(file);
  await expect(page.locator(".photo-storage-warning")).toContainText("Ekki tókst að staðfesta");
  expect(await stored(page)).toEqual([]); expect(await canonical(page)).toBe(raw);
});

test("external canonical conflict aborts a photo transaction without overwriting reports", async ({ page }) => {
  await seed(page);
  const newer = JSON.stringify({ version: 1, reports: [checklistReport()], extension: "external" });
  await page.evaluate(({ key, newer }) => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      const request = add.apply(this, args); request.addEventListener("success", () => localStorage.setItem(key, newer)); return request;
    };
  }, { key: STORAGE_KEY, newer });
  await overview(page).locator('input[type="file"][multiple]').setInputFiles(file);
  await expect(page.locator(".topbar .save-status")).toHaveText("Geymd gögn hafa breyst");
  expect(await stored(page)).toEqual([]); expect(await canonical(page)).toBe(newer);
});

test("failed text-save recovery retains independently saved photos and blocks photo mutations", async ({ page }) => {
  const raw = await seed(page); await add(overview(page)); const before = await stored(page);
  await page.evaluate(key => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) { if (this === localStorage && name === key) throw new DOMException("Synthetic text quota", "QuotaExceededError"); set.call(this, name, value); };
  }, STORAGE_KEY);
  const area = await defect(page); const row = page.locator('.checklist-item[data-item="walls"]');
  await row.getByRole("textbox", { name: /^Lýsing á fráviki/ }).fill("Óvistað endurheimtardrag");
  await expect(area.locator('input[type="file"][multiple]')).toBeDisabled();
  expect(await canonical(page)).toBe(raw); expect(await page.evaluate(key => sessionStorage.getItem(key), DEMO_RECOVERY_KEY)).toContain("Óvistað endurheimtardrag");
  await page.reload(); await expect(thumbnails(overview(page))).toHaveCount(1);
  await expect(overview(page).locator('input[type="file"][multiple]')).toBeDisabled(); expect(await stored(page)).toEqual(before);
});

test("browser-only disclosure and keyboard photo controls remain accessible at narrow widths", async ({ page }) => {
  await seed(page); await add(overview(page));
  await expect(overview(page)).toContainText("ekki afritaðar, samstilltar");
  await thumbnails(overview(page)).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText("Varðveittu frumritin");
  expect((await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape"); await expect(thumbnails(overview(page))).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
