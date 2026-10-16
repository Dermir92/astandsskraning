import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { EMPTY_DETAILS, MAX_REPORTS, isReportList, makeRoom, type Report } from "../src/lib/model";

function reportsOf(count: number): Report[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `safety-${index}`,
    assetType: "apartment",
    title: `Prófunaríbúð ${index + 1}`,
    subtitle: "Tilbúin prófunargögn",
    updatedAt: "2026-10-15T09:00:00Z",
    details: { ...EMPTY_DETAILS, address: `Prófunargata ${index + 1}` },
    rooms: index === 0 ? [makeRoom("entry", "Forstofa", "safety-entry")] : [],
  }));
}
const documentOf = (reports: Report[]) => JSON.stringify({ version: 1, reports });

async function seedOnce(page: Page, raw: string) {
  await page.addInitScript(({ key, raw }) => {
    // Each test has a new browser context; the marker prevents reseeding on reload.
    if (!sessionStorage.getItem("safety-seeded")) {
      localStorage.setItem(key, raw);
      localStorage.setItem("unrelated-safety-sentinel", "leave-me-unchanged");
      sessionStorage.setItem("safety-seeded", "1");
    }
  }, { key: STORAGE_KEY, raw });
}
const rawDocument = (page: Page) => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);

for (const [name, raw] of [
  ["invalid JSON", "{synthetic-invalid-json"],
  ["invalid report shape", '{"version":1,"reports":[{"bad":true}]}'],
  ["unsupported version", JSON.stringify({ version: 2, reports: reportsOf(1), futureField: "preserve this too" })],
  ["empty stored document", ""],
] as const) {
  test(`${name}: fallback edits, retry and reload cannot replace the raw document`, async ({ page }) => {
    await seedOnce(page, raw);
    await page.goto("/");
    await expect(page.locator(".storage-warning")).toContainText("Upprunalegum gögnum er ekki breytt.");
    await expect(page.locator(".topbar .save-status")).toHaveText("Staðbundin gögn læst til verndar");
    await expect(page.getByRole("button", { name: "Reyna vistun aftur" })).toHaveCount(0);
    expect(await rawDocument(page)).toBe(raw);

    await page.goto("/skyrslur/syni-ibud/upplysingar");
    const address = page.getByRole("textbox", { name: /^Heimilisfang/ });
    await expect(address).toHaveValue("Sýnigata 14");
    await address.fill("Má ekki vista yfir frumgögn");
    await expect(address).toHaveValue("Sýnigata 14");
    await page.goto("/skyrslur/syni-ibud/rymi");
    const roomName = page.getByRole("textbox", { name: "Heiti rýmis 1", exact: true });
    await roomName.fill("Má ekki breyta");
    await expect(roomName).toHaveValue("Forstofa");
    await page.getByRole("button", { name: "Fjarlægja Stofa", exact: true }).click();
    await page.getByRole("button", { name: "Fjarlægja rými", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Heiti rýmis 2", exact: true })).toHaveValue("Stofa");
    await page.goto("/skyrslur/ny");
    await expect(page.getByRole("button", { name: "Velja íbúð", exact: true })).toBeDisabled();
    expect(await rawDocument(page)).toBe(raw);
    await page.reload();
    await expect(page.locator(".storage-warning")).toContainText("Endurheimt eða útskipti gagnanna þarf að ákveða sérstaklega.");
    expect(await rawDocument(page)).toBe(raw);
    expect(await page.evaluate(() => localStorage.getItem("unrelated-safety-sentinel"))).toBe("leave-me-unchanged");
  });
}

test("valid in-memory edits recover after a storage write failure", async ({ page }) => {
  const raw = documentOf(reportsOf(1));
  await seedOnce(page, raw);
  await page.goto("/skyrslur/safety-0/upplysingar");
  await expect(page.getByRole("textbox", { name: /^Heimilisfang/ })).toHaveValue("Prófunargata 1");
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreSafetyWrites: () => void }).restoreSafetyWrites = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("Synthetic quota failure", "QuotaExceededError");
      return original.call(this, name, value);
    };
  }, STORAGE_KEY);
  await page.getByRole("textbox", { name: /^Heimilisfang/ }).fill("Endurheimt prófunargata 7");
  await page.getByRole("textbox", { name: /^Íbúðarnúmer \/ hæð/ }).fill("0201");
  await expect(page.locator(".storage-warning")).toContainText("Breytingar eru aðeins í minni.");
  expect(await rawDocument(page)).toBe(raw);
  await page.evaluate(() => (window as unknown as { restoreSafetyWrites: () => void }).restoreSafetyWrites());
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  await expect(page.locator(".storage-warning")).toHaveCount(0);
  const saved = JSON.parse((await rawDocument(page))!);
  expect(saved.reports[0].details.address).toBe("Endurheimt prófunargata 7");
  expect(saved.reports[0].details.unit).toBe("0201");
  expect(isReportList(saved.reports)).toBe(true);
  await page.reload();
  await expect(page.getByRole("textbox", { name: /^Heimilisfang/ })).toHaveValue("Endurheimt prófunargata 7");
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
});

test("500 reports: no ghost draft, raw data preserved, existing reports remain editable and reloadable", async ({ page }) => {
  const reports = reportsOf(MAX_REPORTS);
  const raw = documentOf(reports);
  await seedOnce(page, raw);
  await page.goto("/skyrslur/ny");
  await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  await expect(page).toHaveURL(/\/skyrslur\/ny$/);
  await expect(page.locator(".storage-warning")).toContainText("Hámarki 500 skýrslna í þessum vafra er náð.");
  await expect(page.locator(".storage-warning")).toContainText("Engin ný skýrsla var stofnuð");
  await expect(page.getByRole("button", { name: "Reyna vistun aftur" })).toHaveCount(0);
  await expect(page.locator(".topbar .save-status")).toHaveText("Breytingu hafnað · gögn óbreytt");
  expect(await rawDocument(page)).toBe(raw);
  await page.reload();
  await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  expect(await rawDocument(page)).toBe(raw);
  await page.goto("/skyrslur/safety-0/upplysingar");
  await page.getByRole("textbox", { name: /^Heimilisfang/ }).fill("Breyting við 500 skýrslur");
  const saved = JSON.parse((await rawDocument(page))!);
  expect(saved.reports).toHaveLength(MAX_REPORTS);
  expect(saved.reports.slice(1)).toEqual(reports.slice(1));
  expect(saved.reports[0].rooms).toEqual(reports[0].rooms);
  expect(isReportList(saved.reports)).toBe(true);
  await page.reload();
  await expect(page.getByRole("textbox", { name: /^Heimilisfang/ })).toHaveValue("Breyting við 500 skýrslur");
  await expect(page.locator(".storage-warning")).toHaveCount(0);
});

test("499 to 500: normal creation and editing succeed, the next creation is rejected without navigation", async ({ page }) => {
  const reports = reportsOf(MAX_REPORTS - 1);
  await seedOnce(page, documentOf(reports));
  await page.goto("/skyrslur/ny");
  await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  await expect(page).toHaveURL(/\/skyrslur\/[^/]+\/upplysingar$/);
  await page.getByRole("textbox", { name: /^Heimilisfang/ }).fill("Ný prófunaríbúð við mörk");
  await page.getByRole("button", { name: "Velja rými", exact: true }).click();
  await page.getByRole("textbox", { name: "Heiti rýmis 1", exact: true }).fill("Prófunargangur");
  await page.getByRole("button", { name: "Hefja ástandsskráningu", exact: true }).click();
  await page.locator(".checklist-toggle").first().click();
  await page.getByRole("radio", { name: "Í lagi", exact: true }).check();
  await page.getByRole("radio", { name: "Hreint", exact: true }).check();
  const afterCreation = JSON.parse((await rawDocument(page))!);
  expect(afterCreation.reports).toHaveLength(MAX_REPORTS);
  expect(afterCreation.reports.slice(1)).toEqual(reports);
  const id = afterCreation.reports[0].id;
  await page.reload();
  await expect(page.getByRole("heading", { name: "Prófunargangur", exact: true })).toBeVisible();
  await page.goto(`/skyrslur/${id}/upplysingar`);
  await expect(page.getByRole("textbox", { name: /^Heimilisfang/ })).toHaveValue("Ný prófunaríbúð við mörk");
  const beforeRejection = await rawDocument(page);
  await page.goto("/skyrslur/ny");
  await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  await expect(page).toHaveURL(/\/skyrslur\/ny$/);
  expect(await rawDocument(page)).toBe(beforeRejection);
});

test("read protection and boundary warnings preserve accessibility and layout", async ({ page }, testInfo) => {
  await seedOnce(page, documentOf(reportsOf(MAX_REPORTS)));
  await page.goto("/skyrslur/ny");
  await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(audit.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("limit-warning.png"), fullPage: true });
  await page.evaluate(key => localStorage.setItem(key, '{"version":9,"reports":[]}'), STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole("button", { name: "Velja íbúð", exact: true })).toBeDisabled();
  const protectedAudit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(protectedAudit.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("read-protection.png"), fullPage: true });
});

// Direct store contracts exercise defensive retry and malformed mutations that
// ordinary controls cannot produce. Storage is entirely synthetic in the worker.
test.describe("store safety contracts", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let values: Map<string, string>;
  let writes: string[];
  let failRead: boolean;
  let failWrite: boolean;
  test.beforeEach(() => {
    values = new Map(); writes = []; failRead = false; failWrite = false;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
      getItem: (key: string) => { if (failRead) throw new Error("Synthetic read failure"); return values.get(key) ?? null; },
      setItem: (key: string, value: string) => { writes.push(value); if (failWrite) throw new Error("Synthetic write failure"); values.set(key, value); },
    } });
  });
  test.afterEach(() => {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });

  test("generic retry cannot authorize replacing malformed or unsupported source data", () => {
    for (const raw of ["", "{invalid", '{"version":2,"reports":[]}', documentOf(reportsOf(MAX_REPORTS + 1))]) {
      values.set(STORAGE_KEY, raw);
      const store = new DemoStore(); store.hydrate();
      const before = store.getSnapshot().reports;
      store.retrySave();
      store.updateReport("syni-ibud", r => ({ ...r, title: "Blocked fallback edit" }));
      store.removeRoom("syni-ibud", "demo-living");
      expect(store.createReport()).toBeNull();
      store.retrySave();
      expect(values.get(STORAGE_KEY)).toBe(raw);
      expect(writes).toEqual([]);
      expect(store.getSnapshot().reports).toBe(before);
      expect(store.getSnapshot().status).toBe("read-error");
    }
  });

  test("read failure remains protected even if reading later becomes available", () => {
    const raw = documentOf(reportsOf(1)); values.set(STORAGE_KEY, raw);
    failRead = true;
    const store = new DemoStore(); store.hydrate();
    failRead = false;
    store.retrySave();
    expect(store.createReport()).toBeNull();
    store.updateReport("syni-ibud", r => ({ ...r, title: "Blocked" }));
    expect(writes).toEqual([]);
    expect(values.get(STORAGE_KEY)).toBe(raw);
    // A new validated load is safe; no replacement/recovery action is inferred.
    const reloaded = new DemoStore(); reloaded.hydrate();
    expect(reloaded.getSnapshot().reports[0].id).toBe("safety-0");
    expect(reloaded.getSnapshot().status).toBe("saved");
  });

  test("all candidate mutations must satisfy the unchanged loader contract", () => {
    const raw = documentOf(reportsOf(2)); values.set(STORAGE_KEY, raw);
    const store = new DemoStore(); store.hydrate();
    const before = store.getSnapshot().reports;
    const invalidChanges: Array<(r: Report) => Report> = [
      r => ({ ...r, id: "safety-1" }),
      r => ({ ...r, rooms: Array.from({ length: 101 }, () => r.rooms[0]) }),
      r => ({ ...r, rooms: [{ ...r.rooms[0], items: Array.from({ length: 101 }, () => r.rooms[0].items[0]) }] }),
      r => ({ ...r, details: { ...r.details, role: "unsupported" as Report["details"]["role"] } }),
    ];
    for (const change of invalidChanges) {
      expect(store.updateReport("safety-0", change)).toBe(false);
      store.retrySave();
      expect(store.getSnapshot().reports).toBe(before);
      expect(values.get(STORAGE_KEY)).toBe(raw);
      expect(writes).toEqual([]);
    }
    // Incomplete drafts remain valid under the existing loader's rules.
    expect(store.updateReport("safety-0", r => ({ ...r, details: { ...r.details, postalCode: "ab" } }))).toBe(true);
    expect(isReportList(JSON.parse(values.get(STORAGE_KEY)!).reports)).toBe(true);
  });

  test("rejecting report 501 keeps an earlier valid failed write available for retry", () => {
    const raw = documentOf(reportsOf(MAX_REPORTS)); values.set(STORAGE_KEY, raw);
    const store = new DemoStore(); store.hydrate(); failWrite = true;
    store.updateReport("safety-0", r => ({ ...r, title: "Valid pending edit" }));
    expect(store.getSnapshot().status).toBe("error");
    expect(store.createReport()).toBeNull();
    expect(store.getSnapshot().reports).toHaveLength(MAX_REPORTS);
    expect(store.getSnapshot().warning).toContain("Hámarki 500");
    expect(store.getSnapshot().status).toBe("error");
    expect(values.get(STORAGE_KEY)).toBe(raw);
    failWrite = false; store.retrySave();
    const saved = JSON.parse(values.get(STORAGE_KEY)!);
    expect(saved.reports).toHaveLength(MAX_REPORTS);
    expect(saved.reports[0].title).toBe("Valid pending edit");
    expect(isReportList(saved.reports)).toBe(true);
    expect(store.getSnapshot().status).toBe("saved");
  });
});
