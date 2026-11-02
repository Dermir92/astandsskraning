import { expect, test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DEMO_LOCK_NAME, DEMO_RECOVERY_KEY, STORAGE_KEY } from "../src/lib/demo-storage";
import { legacyCoreReport } from "./inspection-core-fixtures";

const widths = [320, 360, 390, 640, 641, 768, 800, 1000, 1001, 1440];
const entries = ["quantity", "list"] as const;
const path = "/skyrslur/core-legacy/rymi";
const add = (page: Page) => page.locator(".custom-room-form button[type=submit]");
const confirmation = (page: Page) => page.locator(".remove-confirmation");
const cancel = (page: Page) => page.getByRole("button", { name: "Hætta við", exact: true });
const destroy = (page: Page) => page.getByRole("button", { name: "Fjarlægja rými", exact: true });
const status = (page: Page) => page.locator(".topbar .save-status");
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
type Entry = typeof entries[number];
const trigger = (page: Page, entry: Entry) => page.getByRole("button", {
  name: entry === "quantity" ? "Fækka: Svefnherbergi" : "Fjarlægja Svefnherbergi 3", exact: true,
});
function roomsReport() {
  const report = legacyCoreReport();
  const types = ["entry", "living", "kitchen", "bedroom", "bathroom", "laundry", "storage", "bedroom", "bedroom", "balcony"] as const;
  const names = ["Forstofa", "Stofa", "Eldhús", "Svefnherbergi 1", "Baðherbergi", "Þvottahús", "Geymsla", "Svefnherbergi 2", "Svefnherbergi 3", "Svalir"];
  report.rooms = types.map((type, i) => ({
    ...structuredClone(report.rooms[0]), id: `room-${i + 1}`, type, name: names[i],
    observations: i === 8 ? structuredClone(report.rooms[0].observations) : {},
  }));
  return report;
}
async function seed(context: BrowserContext, report = roomsReport(), unsupported = false) {
  await context.addInitScript(({ key, report, unsupported }) => {
    if (!localStorage.getItem("ux3-u1-seeded")) {
      localStorage.setItem(key, JSON.stringify({ version: 1, reports: [report] }));
      localStorage.setItem("ux3-u1-seeded", "1");
    }
    if (unsupported) Object.defineProperty(navigator, "locks", { configurable: true, get: () => undefined });
  }, { key: STORAGE_KEY, report, unsupported });
}
async function open(page: Page) {
  await page.goto(path);
  await expect(add(page)).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
}
async function shot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: false });
}
async function visibleContext(page: Page) {
  const bounds = await confirmation(page).evaluate(el => {
    const box = el.getBoundingClientRect();
    const button = el.querySelector<HTMLButtonElement>(".button-secondary")!.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0;
    const bottom = top + (viewport?.height ?? innerHeight);
    // A sticky header must not obscure the confirmation or its focused control.
    const header = document.querySelector(".topbar")!;
    const headerBox = header.getBoundingClientRect();
    const sticky = ["fixed", "sticky"].includes(getComputedStyle(header).position);
    return { top: box.top, bottom: box.bottom, buttonTop: button.top, buttonBottom: button.bottom, viewportTop: Math.max(top, sticky ? headerBox.bottom : top), viewportBottom: bottom };
  });
  expect(bounds.top).toBeGreaterThanOrEqual(bounds.viewportTop);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewportBottom);
  expect(bounds.buttonTop).toBeGreaterThanOrEqual(bounds.viewportTop);
  expect(bounds.buttonBottom).toBeLessThanOrEqual(bounds.viewportBottom);
}
async function buttonAX(page: Page) {
  const client = await page.context().newCDPSession(page);
  try {
    const { result } = await client.send("Runtime.evaluate", { expression: 'document.querySelector(".custom-room-form button[type=submit]")' });
    return await client.send("Accessibility.getPartialAXTree", { objectId: result.objectId });
  } finally { await client.detach(); }
}

for (const width of widths) {
  test(`F01 visible label, native name and keyboard submission at ${width} CSS px`, async ({ page, context }, info) => {
    await page.setViewportSize({ width, height: 950 }); await seed(context); await open(page);
    const tree = await buttonAX(page);
    await info.attach("native-button-ax", { body: JSON.stringify(tree), contentType: "application/json" });
    const audit = await new AxeBuilder({ page }).include(".custom-room-form").withRules(["button-name"]).analyze();
    await info.attach("button-name-audit", { body: JSON.stringify(audit), contentType: "application/json" });
    await page.locator("#custom-room").fill("Vinnuherbergi");
    await page.keyboard.press("Tab"); await expect(add(page)).toBeFocused();
    await shot(page, info, `f01-${width}`);
    expect(tree.nodes.find(node => node.role?.value === "button")?.name?.value).toBe("Bæta við");
    await expect(add(page).locator("span")).toBeVisible();
    await expect(add(page)).toHaveAccessibleName("Bæta við");
    expect(audit.violations).toEqual([]);
    expect(await add(page).evaluate(el => el.matches(":focus-visible") && getComputedStyle(el).outlineStyle !== "none")).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Enter"); await expect(page.locator(".selected-room-list > li")).toHaveCount(11);
    await expect(page.locator("#custom-room")).toHaveValue("");
    await page.keyboard.press("Space"); await expect(page.locator("#custom-room-error")).toBeVisible();
    await expect(page.locator("#custom-room")).toHaveAttribute("aria-invalid", "true");
    expect(JSON.parse((await raw(page))!).reports[0].rooms.at(-1).name).toBe("Vinnuherbergi");
  });
}

for (const entry of entries) {
  for (const width of [320, 360, 390, 768, 1440]) {
    test(`F02 ${entry} reveals context, cancels and deletes with logical focus at ${width}`, async ({ page, context }, info) => {
      await page.setViewportSize({ width, height: 800 }); await seed(context); await open(page);
      // Start the row trigger at the viewport edge; keep the quantity trigger near the top.
      if (entry === "list") await trigger(page, entry).evaluate(el => el.scrollIntoView({ block: "end" }));
      const before = await raw(page);
      await trigger(page, entry).click(); await expect(confirmation(page)).toBeVisible();
      await shot(page, info, `f02-${entry}-${width}-opened`);
      await expect(cancel(page)).toBeFocused(); await visibleContext(page);
      expect(await cancel(page).evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
      await expect(confirmation(page)).toHaveAccessibleName(/Svefnherbergi 3/);
      await expect(cancel(page)).toHaveAccessibleDescription(/Svör og myndaforskoðanir í „Svefnherbergi 3“ verða fjarlægð/);
      expect(await raw(page)).toBe(before);
      const audit = await new AxeBuilder({ page }).include(".rooms-layout").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(audit.violations).toEqual([]);
      await page.keyboard.press("Shift+Tab"); await expect(destroy(page)).toBeFocused();
      await page.keyboard.press("Tab"); await expect(cancel(page)).toBeFocused();
      await page.keyboard.press("Enter"); await expect(confirmation(page)).toHaveCount(0);
      await expect(trigger(page, entry)).toBeFocused(); expect(await raw(page)).toBe(before);
      await page.keyboard.press("Enter"); await expect(cancel(page)).toBeFocused();
      await destroy(page).click(); await expect(page.locator(".selected-room-list > li")).toHaveCount(9);
      if (entry === "quantity") await expect(trigger(page, entry)).toBeFocused();
      else await expect(page.locator("#room-name-room-10")).toBeFocused();
      const after = JSON.parse((await raw(page))!).reports[0];
      expect(after.rooms).toEqual(JSON.parse(before!).reports[0].rooms.filter((room: { id: string }) => room.id !== "room-9"));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await shot(page, info, `f02-${entry}-${width}-deleted`);
    });
  }

  test(`F02 ${entry} preserves stale confirmation through actual writer loss and reacquisition`, async ({ page, context }, info) => {
    await seed(context); await open(page); await trigger(page, entry).click();
    await expect(cancel(page)).toBeFocused(); const before = await raw(page);
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
    await expect.poll(() => page.evaluate(async name => (await navigator.locks.query()).held?.filter(lock => lock.name === name).length ?? 0, DEMO_LOCK_NAME)).toBe(0);
    await expect(destroy(page)).toBeDisabled(); await expect(cancel(page)).toBeEnabled();
    await expect(cancel(page)).toBeFocused();
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    await expect(status(page)).toHaveText("Vistað í þessum vafra");
    await expect(destroy(page)).toBeDisabled();
    await expect(confirmation(page)).toContainText("Breytingaréttur hefur breyst.");
    const focusBefore = await page.evaluate(() => ({ active: document.activeElement?.textContent, scrollY }));
    await destroy(page).evaluate(el => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(await raw(page)).toBe(before); await expect(confirmation(page)).toBeVisible();
    expect(await page.evaluate(() => ({ active: document.activeElement?.textContent, scrollY }))).toEqual(focusBefore);
    await shot(page, info, `stale-${entry}`);
    await cancel(page).click(); await expect(trigger(page, entry)).toBeFocused();
    await trigger(page, entry).click(); await expect(destroy(page)).toBeEnabled();
    await destroy(page).click(); await expect(page.locator(".selected-room-list > li")).toHaveCount(9);
  });

  test(`F02 ${entry} cancellation with a disabled origin and a changed canonical base writes nothing`, async ({ page, context }) => {
    await seed(context); await open(page); await trigger(page, entry).click();
    const other = await context.newPage(); await other.goto(path);
    await other.evaluate(key => { const data = JSON.parse(localStorage.getItem(key)!); data.reports[0].title = "Nýrri skýrsla"; localStorage.setItem(key, JSON.stringify(data)); }, STORAGE_KEY);
    await expect(status(page)).toHaveText("Geymd gögn hafa breyst");
    const changed = await raw(page); await expect(destroy(page)).toBeDisabled();
    await destroy(page).evaluate(el => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(await raw(page)).toBe(changed);
    await cancel(page).click(); await expect(page.getByRole("heading", { name: /^Valin rými/ })).toBeFocused();
    expect(await raw(page)).toBe(changed); await expect(page.locator(".selected-room-list > li")).toHaveCount(10);
  });

  test(`F02 ${entry} failed save retains the candidate and exact base without claiming saved`, async ({ page, context }) => {
    await seed(context); await open(page); await trigger(page, entry).click(); const before = await raw(page);
    await page.evaluate(key => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (name, value) { if (this === localStorage && name === key) throw new DOMException("Synthetic quota", "QuotaExceededError"); set.call(this, name, value); }; }, STORAGE_KEY);
    await destroy(page).click(); await expect(status(page)).toHaveText("Ekki tókst að vista í vafra");
    expect(await raw(page)).toBe(before); await expect(page.locator(".selected-room-list > li")).toHaveCount(9);
    const checkpoint = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)!), DEMO_RECOVERY_KEY);
    expect(checkpoint.baseRaw).toBe(before);
    expect(JSON.parse(checkpoint.candidateRaw).reports[0].rooms).toEqual(JSON.parse(before!).reports[0].rooms.filter((room: { id: string }) => room.id !== "room-9"));
    if (entry === "quantity") await expect(trigger(page, entry)).toBeFocused();
    else await expect(page.locator("#room-name-room-10")).toBeFocused();
  });

  test(`F02 ${entry} photo-only rooms confirm, while empty rooms keep immediate removal`, async ({ page, context }) => {
    const report = roomsReport(); report.rooms[8].observations = {};
    await seed(context, report); await open(page);
    await page.locator('.stepper a[href$="/skraning"]').click();
    await page.locator("#current-room").selectOption("room-9");
    const item = page.locator('.checklist-item[data-item="walls"]');
    await item.locator(".checklist-toggle").click();
    await item.getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({ name: "synimynd.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64") });
    await expect(item.getByRole("img")).toHaveCount(1);
    // Browser history returns through the app router and preserves temporary previews.
    await page.goBack(); await expect(add(page)).toBeEnabled();
    const before = await raw(page); await trigger(page, entry).click(); await expect(cancel(page)).toBeFocused();
    expect(await raw(page)).toBe(before); await cancel(page).click();
    await page.reload(); await expect(add(page)).toBeEnabled();
    await trigger(page, entry).click(); await expect(confirmation(page)).toHaveCount(0);
    await expect(page.locator(".selected-room-list > li")).toHaveCount(9);
    if (entry === "quantity") await expect(trigger(page, entry)).toBeFocused();
    else await expect(page.locator("#room-name-room-10")).toBeFocused();
  });

  test(`F02 ${entry} deleting the final room leaves an available focus target`, async ({ page, context }) => {
    const report = roomsReport(); report.rooms = [report.rooms[8]];
    await seed(context, report); await open(page); await trigger(page, entry).click();
    await expect(cancel(page)).toBeFocused(); await destroy(page).click();
    await expect(page.locator(".selected-room-list > li")).toHaveCount(0);
    if (entry === "quantity") await expect(page.getByRole("button", { name: "Fjölga: Svefnherbergi", exact: true })).toBeFocused();
    else await expect(page.getByRole("heading", { name: /^Valin rými/ })).toBeFocused();
    expect(JSON.parse((await raw(page))!).reports[0].rooms).toEqual([]);
  });
}

test("F02 deleting the last row focuses the previous surviving room", async ({ page, context }) => {
  const report = roomsReport(); report.rooms.pop();
  await seed(context, report); await open(page); await trigger(page, "list").click(); await destroy(page).click();
  await expect(page.locator("#room-name-room-8")).toBeFocused();
});

test("F01 disabled states retain the label/name throughout the tablet interval", async ({ page, context }) => {
  await seed(context); await open(page);
  const reader = await context.newPage(); await reader.goto(path);
  await expect(add(reader)).toBeDisabled();
  for (const width of widths) {
    await reader.setViewportSize({ width, height: 950 });
    await expect(add(reader).locator("span")).toBeVisible(); await expect(add(reader)).toHaveAccessibleName("Bæta við");
    await expect(reader.locator("#custom-room")).toHaveAttribute("readonly", "");
    await expect(trigger(reader, "quantity")).toBeDisabled(); await expect(trigger(reader, "list")).toBeDisabled();
    const audit = await new AxeBuilder({ page: reader }).include(".custom-room-form").withRules(["button-name"]).analyze(); expect(audit.violations).toEqual([]);
    expect(await reader.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("F01 custom add failed save preserves accepted draft semantics and the 50-room limit", async ({ page, context }) => {
  const report = roomsReport();
  report.rooms = Array.from({ length: 49 }, (_, i) => ({ ...structuredClone(report.rooms[i % 10]), id: `limit-${i}` }));
  await seed(context, report); await open(page); const before = await raw(page);
  await page.evaluate(key => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (name, value) { if (this === localStorage && name === key) throw new DOMException("Synthetic quota", "QuotaExceededError"); set.call(this, name, value); }; }, STORAGE_KEY);
  await page.locator("#custom-room").fill("Síðasta rými"); await page.locator("#custom-room").press("Enter");
  await expect(page.locator(".selected-room-list > li")).toHaveCount(50); await expect(add(page)).toBeDisabled();
  await expect(page.locator("#custom-room")).toHaveValue(""); await expect(status(page)).toHaveText("Ekki tókst að vista í vafra");
  expect(await raw(page)).toBe(before);
  const recovery = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)!), DEMO_RECOVERY_KEY);
  expect(recovery.baseRaw).toBe(before); expect(JSON.parse(recovery.candidateRaw).reports[0].rooms).toHaveLength(50);
});

test("F02 reflow and sticky header keep context visible without rerender focus stealing", async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 700 }); await seed(context); await open(page);
  await page.locator(".topbar").evaluate(el => { const header = el as HTMLElement; header.style.position = "sticky"; header.style.top = "0"; header.style.zIndex = "100"; });
  await trigger(page, "quantity").click(); await expect(cancel(page)).toBeFocused(); await visibleContext(page);
  await cancel(page).click();
  await page.addStyleTag({ content: ".remove-confirmation, .remove-confirmation .button { font-size: 24px; }" });
  await trigger(page, "quantity").click(); await expect(cancel(page)).toBeFocused(); await visibleContext(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#custom-room").fill("Óstofnað rými"); await expect(page.locator("#custom-room")).toBeFocused();
  const before = await page.evaluate(() => scrollY);
  await page.locator("#custom-room").press("End"); await page.keyboard.type(" áfram");
  await expect(page.locator("#custom-room")).toBeFocused(); expect(await page.evaluate(() => scrollY)).toBe(before);
});

test("F02 a long room name remains readable at enlarged text without hiding the focused action", async ({ page, context }, info) => {
  const report = roomsReport(); report.rooms[8].name = `Svefnherbergi 3 · ${"Langtrýmisheiti".repeat(12)}`;
  await page.setViewportSize({ width: 320, height: 600 }); await seed(context, report); await open(page);
  await page.addStyleTag({ content: ".remove-confirmation, .remove-confirmation .button { font-size: 24px; }" });
  await trigger(page, "quantity").click(); await expect(cancel(page)).toBeFocused();
  await expect(cancel(page)).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(cancel(page)).toHaveAccessibleDescription(/Svör og myndaforskoðanir/);
  await shot(page, info, "long-room-200-percent");
});
