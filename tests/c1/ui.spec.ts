import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { draft, login, newDraft, runtime, token } from "./helpers";
import { STORAGE_KEY } from "../../src/components/demo-provider";

test.setTimeout(90_000);
async function saved(page: import("@playwright/test").Page) { await expect(page.locator(".save-status").first()).toHaveText("Vistað í gagnagrunni"); }
async function noOverflow(page: import("@playwright/test").Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
async function accessible(page: import("@playwright/test").Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations).toEqual([]);
}

test("controlled login supports keyboard correction and exposes no public registration", async ({ page }, testInfo) => {
  const config = await runtime(); await page.goto("/");
  await expect(page.getByRole("link", { name: /nýskrá|stofna aðgang/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Skrá inn í C1", exact: true })).toBeEnabled();
  await page.getByLabel("Netfang prófreiknings").fill(config.accounts[0].email);
  await page.getByLabel("Lykilorð prófreiknings").fill("Intentionally-wrong-fictional-password");
  await page.getByLabel("Lykilorð prófreiknings").press("Enter");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Innskráning tókst ekki");
  await noOverflow(page); await accessible(page);
  await page.screenshot({ path: testInfo.outputPath("login-error.png"), fullPage: true });
  await page.getByLabel("Lykilorð prófreiknings").fill(config.accounts[0].password);
  await page.getByLabel("Lykilorð prófreiknings").press("Enter"); await saved(page);
  await expect(page.getByRole("heading", { name: "Mínar skýrslur", exact: true })).toBeVisible();
});

test("fictional independent inspection completes all four screens, reloads and opens Concept C without touching demo data", async ({ page }, testInfo) => {
  const sentinel = JSON.stringify({ version: 1, futureEnvelope: { retained: true }, reports: [{ ...draft("demo-sentinel"), title: "Eingöngu í sýniham" }] }, null, 2);
  await page.addInitScript(({ key, sentinel }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, sentinel); }, { key: STORAGE_KEY, sentinel });
  await login(page); const id = await newDraft(page);
  const address = `Sýnigata ${page.viewportSize()!.width} · C1`;
  await page.getByLabel("Heimilisfang").fill(address);
  await page.getByLabel("Póstnúmer").fill("101");
  await page.getByLabel("Sveitarfélag").fill("Reykjavík");
  await page.getByLabel("Nafn skráningaraðila").fill("Sýni Þór Jónsdóttir");
  await page.getByLabel("Hvað var skoðað?").fill("Aðgengilegir fletir í íbúð. Ófullgerð prófdrög.");
  await saved(page);
  await expect(page.getByRole("radio", { name: "Sjálfstæð skráning", exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Upphafsskráning", exact: true })).toBeDisabled();
  await noOverflow(page); await accessible(page);
  await page.screenshot({ path: testInfo.outputPath("details.png"), fullPage: true });
  await page.getByRole("button", { name: "Velja rými", exact: true }).click();
  await expect(page).toHaveURL(/\/rymi$/);
  await page.getByRole("button", { name: "Hefja ástandsskráningu", exact: true }).click();
  await expect(page).toHaveURL(/\/skraning/);
  await page.getByRole("button", { name: "Í lagi: Gólfefni", exact: true }).first().click();
  await saved(page); await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.getByText("Myndir eru óvirkar í C1.", { exact: true }).first()).toBeVisible();
  await noOverflow(page); await accessible(page);
  await page.screenshot({ path: testInfo.outputPath("capture.png"), fullPage: true });
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await expect(page).toHaveURL(/\/yfirferd/);
  await page.getByRole("link", { name: "Forskoða skýrslu", exact: true }).click();
  await expect(page).toHaveURL(/\/forskodun$/);
  await expect(page.getByRole("heading", { name: `Ástandsskýrsla ${address}`, exact: true })).toBeVisible();
  await noOverflow(page); await accessible(page);
  await page.screenshot({ path: testInfo.outputPath("concept-c.png"), fullPage: true });
  await page.reload(); await saved(page);
  await expect(page.getByRole("heading", { name: `Ástandsskýrsla ${address}`, exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(sentinel);
  await page.goto(`/skyrslur/${id}/upplysingar`); await page.getByLabel("Heimilisfang").fill(`${address} leiðrétt`); await saved(page); await page.reload();
  await expect(page.getByLabel("Heimilisfang")).toHaveValue(`${address} leiðrétt`);
});

test("two real tabs expose a conflict, preserve both versions and offer keyboard-accessible recovery", async ({ page, context }, testInfo) => {
  await login(page); const id = await newDraft(page);
  const second = await context.newPage(); await login(second);
  await second.goto(`/skyrslur/${id}/upplysingar`); await expect(second.getByLabel("Heimilisfang")).toBeVisible(); await saved(second);
  await page.getByLabel("Heimilisfang").fill("Nýrri útgáfa frá glugga A"); await saved(page);
  await second.getByLabel("Takmarkanir skoðunar").fill("Óvistaður texti úr glugga B");
  await expect(second.locator(".storage-warning[role=alert]")).toContainText("Nýrri útgáfa er vistuð");
  await expect(second.getByLabel("Takmarkanir skoðunar")).toHaveValue("Óvistaður texti úr glugga B");
  await expect(second.getByRole("button", { name: "Sækja nýjustu drög", exact: true })).toBeDisabled();
  await noOverflow(second); await accessible(second);
  await second.screenshot({ path: testInfo.outputPath("conflict.png"), fullPage: true });
  const download = second.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true });
  await download.focus(); await expect(download).toBeFocused();
  const file = second.waitForEvent("download"); await download.press("Enter");
  const downloaded = await file; const text = await readFile((await downloaded.path())!, "utf8");
  expect(text).toContain("Óvistaður texti úr glugga B"); expect(text).not.toContain("access_token");
  const confirm = second.getByRole("checkbox", { name: /Ég hef varðveitt breytingarnar/ }); await confirm.focus(); await confirm.press("Space");
  await second.getByRole("button", { name: "Sækja nýjustu drög", exact: true }).click();
  await expect(second.getByLabel("Heimilisfang")).toHaveValue("Nýrri útgáfa frá glugga A");
  await saved(second); await expect(second.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true })).toBeVisible();
  await second.close();
});

test("lost network acknowledgement retries one committed operation, and pending is never saved", async ({ page }, testInfo) => {
  await login(page); const attempts: unknown[] = []; let release!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; }); let committed!: () => void;
  const commit = new Promise<void>(resolve => { committed = resolve; });
  await page.route("**/api/c1/inspections", async route => {
    if (route.request().method() !== "POST") return route.continue();
    attempts.push(route.request().postDataJSON());
    if (attempts.length === 1) { const response = await route.fetch(); expect(response.status()).toBe(200); committed(); await barrier; return route.abort("failed"); }
    return route.continue();
  });
  await page.goto("/skyrslur/ny"); await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  await commit; await expect(page.locator(".save-status").first()).toHaveText("Vistun í bið…");
  await expect(page.getByRole("checkbox", { name: /Ég hef varðveitt breytingarnar/ })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("pending.png"), fullPage: true });
  release(); await expect(page.locator(".storage-warning[role=alert]")).toContainText("Vistun er óstaðfest");
  await noOverflow(page); await accessible(page);
  await page.screenshot({ path: testInfo.outputPath("failed-save.png"), fullPage: true });
  const retry = page.getByRole("button", { name: "Reyna vistun aftur", exact: true }); await retry.focus(); await retry.press("Enter");
  await expect(page.locator(".save-status").first()).toHaveText("Fyrri vistun staðfest · sækja þarf drög");
  await expect(page.locator(".storage-warning[role=alert]")).toContainText("Fyrri vistun er staðfest");
  await page.getByRole("checkbox", { name: /Ég hef varðveitt breytingarnar/ }).check();
  await page.getByRole("button", { name: "Sækja nýjustu drög", exact: true }).click(); await saved(page);
  expect(attempts).toHaveLength(2); expect(attempts[1]).toEqual(attempts[0]);
  const auth = await token(); const read = await page.request.get("/api/c1/inspections", { headers: { Authorization: `Bearer ${auth.token}` } });
  const first = attempts[0] as { document: { id: string } };
  const rows = (await read.json()).records.filter((r: { id: string }) => r.id === first.document.id);
  expect(rows).toHaveLength(1); expect(rows[0].revision).toBe(1);
});

test("failed, malformed and delayed recovery preserve the candidate and expose accurate accessible results", async ({ page }, testInfo) => {
  await login(page); const id = await newDraft(page);
  const auth = await token(), headers = { Authorization: `Bearer ${auth.token}` };
  const read = await page.request.get("/api/c1/inspections", { headers });
  const before = (await read.json()).records.find((r: { id: string }) => r.id === id);
  const { operation } = await import("./helpers");
  const newer = { ...before.document, details: { ...before.document.details, address: "Nýrri vistuð C1-íbúð" } };
  expect((await page.request.post("/api/c1/inspections", { headers, data: operation(newer, before.revision) })).status()).toBe(200);
  await page.getByLabel("Takmarkanir skoðunar").fill("Endurheimt má ekki týna þessum texta");
  await expect(page.locator(".storage-warning[role=alert]")).toContainText("Nýrri útgáfa er vistuð");
  const panel = page.getByRole("region", { name: "Staðbundin C1-prófun" }), result = panel.getByRole("status");
  const confirm = panel.getByRole("checkbox", { name: /Ég hef varðveitt breytingarnar/ });
  const reload = panel.getByRole("button", { name: "Sækja nýjustu drög", exact: true });
  const backup = panel.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true });
  for (const failure of ["network", "malformed"] as const) {
    await page.route("**/api/c1/inspections", route => {
      if (route.request().method() !== "GET") return route.continue();
      return failure === "network" ? route.abort("failed") : route.fulfill({ status: 200, json: { ownerId: auth.account.id, records: [{ id, revision: 0, document: newer }] } });
    });
    await confirm.focus(); if (!(await confirm.isChecked())) await confirm.press("Space");
    await reload.focus(); await reload.press("Enter");
    await expect(result).toContainText("Ekki tókst að sækja og staðfesta");
    await expect(result).not.toContainText("Vistuð drög sótt.");
    await expect(page.getByLabel("Takmarkanir skoðunar")).toHaveValue("Endurheimt má ekki týna þessum texta");
    await expect(reload).toBeEnabled(); await expect(backup).toBeEnabled();
    // Audit and capture the actual failure message before a download replaces
    // the live result with its own acknowledgement.
    await noOverflow(page); await accessible(page);
    await page.screenshot({ path: testInfo.outputPath(`recovery-${failure}.png`), fullPage: true });
    const download = page.waitForEvent("download"); await backup.click();
    expect(await readFile((await (await download).path())!, "utf8")).toContain("Endurheimt má ekki týna þessum texta");
    await page.unroute("**/api/c1/inspections");
  }
  let release!: () => void, fetched!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { fetched = resolve; });
  await page.route("**/api/c1/inspections", async route => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch(); fetched(); await barrier; await route.fulfill({ response });
  });
  await reload.focus(); await reload.press("Enter"); await started;
  await expect(reload).toBeDisabled(); await expect(reload).toHaveAttribute("aria-busy", "true");
  await expect(result).toContainText("Sæki vistuð drög"); await expect(backup).toBeEnabled();
  await expect(page.getByLabel("Takmarkanir skoðunar")).toHaveValue("Endurheimt má ekki týna þessum texta");
  await noOverflow(page); await accessible(page);
  await page.screenshot({ path: testInfo.outputPath("recovery-pending.png"), fullPage: true });
  release(); await expect(result).toContainText("Vistuð drög sótt."); await saved(page);
  await expect(result).toBeFocused(); await expect(page.getByLabel("Heimilisfang")).toHaveValue("Nýrri vistuð C1-íbúð");
  await expect(backup).toBeEnabled(); await noOverflow(page); await accessible(page);
  const finalCopy = page.waitForEvent("download"); await backup.click();
  expect(await readFile((await (await finalCopy).path())!, "utf8")).toContain("Endurheimt má ekki týna þessum texta");
});

test("lost acknowledgement replay after another client saves requires review and preserves the newer database record", async ({ page }) => {
  await login(page); const id = await newDraft(page), auth = await token(), headers = { Authorization: `Bearer ${auth.token}` };
  let first: import("../../src/lib/cloud/contracts").SaveOperation | undefined;
  await page.route("**/api/c1/inspections", async route => {
    if (route.request().method() !== "POST" || first) return route.continue();
    first = route.request().postDataJSON();
    const committed = await route.fetch(); expect(committed.status()).toBe(200);
    const receipt = await committed.json(), { operation } = await import("./helpers");
    const newer = { ...receipt.document, details: { ...receipt.document.details, address: "Annar biðlari er nýrri" } };
    expect((await page.request.post("/api/c1/inspections", { headers, data: operation(newer, receipt.revision) })).status()).toBe(200);
    await route.abort("failed");
  });
  await page.getByLabel("Heimilisfang").fill("Fyrri staðfest vistun");
  await expect(page.locator(".storage-warning[role=alert]")).toContainText("Vistun er óstaðfest");
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  await expect(page.locator(".save-status").first()).toHaveText("Fyrri vistun staðfest · sækja þarf drög");
  await expect(page.getByLabel("Heimilisfang")).toHaveValue("Fyrri staðfest vistun");
  await expect(page.getByRole("button", { name: "Sækja nýjustu drög", exact: true })).toBeDisabled();
  await noOverflow(page); await accessible(page);
  const read = await page.request.get("/api/c1/inspections", { headers });
  const latest = (await read.json()).records.find((r: { id: string }) => r.id === id);
  expect(latest.revision).toBe(first!.expectedRevision + 2); expect(latest.document.details.address).toBe("Annar biðlari er nýrri");
  await page.getByRole("checkbox", { name: /Ég hef varðveitt breytingarnar/ }).check();
  await page.getByRole("button", { name: "Sækja nýjustu drög", exact: true }).click(); await saved(page);
  await expect(page.getByLabel("Heimilisfang")).toHaveValue("Annar biðlari er nýrri");
});

test("switching accounts during a recovery fetch never restores the previous owner or hides that owner's recovery", async ({ page }) => {
  await login(page); await newDraft(page);
  await page.route("**/api/c1/inspections", route => route.request().method() === "POST" ? route.fulfill({ status: 503, json: { error: "simulated_precommit_failure" } }) : route.continue());
  await page.getByLabel("Takmarkanir skoðunar").fill("Endurheimt eingöngu fyrir A");
  await expect(page.locator(".storage-warning[role=alert]")).toContainText("Vistun er óstaðfest");
  await page.unroute("**/api/c1/inspections");
  let release!: () => void, fetched!: () => void, held = false;
  const barrier = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { fetched = resolve; });
  await page.route("**/api/c1/inspections", async route => {
    if (route.request().method() !== "GET" || held) return route.continue();
    held = true; const response = await route.fetch(); fetched(); await barrier;
    try { await route.fulfill({ response }); } catch { /* Account switch aborts the old read. */ }
  });
  await page.getByRole("checkbox", { name: /Ég hef varðveitt breytingarnar/ }).check();
  await page.getByRole("button", { name: "Sækja nýjustu drög", exact: true }).click(); await started;
  await page.getByRole("button", { name: "Skrá út", exact: true }).click();
  await expect(page.getByLabel("Netfang prófreiknings")).toBeVisible();
  const config = await runtime();
  await page.getByLabel("Netfang prófreiknings").fill(config.accounts[1].email);
  await page.getByLabel("Lykilorð prófreiknings").fill(config.accounts[1].password);
  await page.getByRole("button", { name: "Skrá inn í C1", exact: true }).click(); await saved(page); release();
  await expect(page.getByRole("region", { name: "Staðbundin C1-prófun" })).toContainText(config.accounts[1].email);
  await expect(page.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true })).toHaveCount(0);
  await expect(page.getByText("Vistuð drög sótt.", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Skrá út", exact: true }).click();
  await page.getByLabel("Netfang prófreiknings").fill(config.accounts[0].email);
  await page.getByLabel("Lykilorð prófreiknings").fill(config.accounts[0].password);
  await page.getByRole("button", { name: "Skrá inn í C1", exact: true }).click(); await saved(page);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true }).click();
  expect(await readFile((await (await download).path())!, "utf8")).toContain("Endurheimt eingöngu fyrir A");
});

test("account switching hides previous owner data and late responses; recovery returns only to that owner", async ({ page }) => {
  await login(page); const id = await newDraft(page);
  await page.getByLabel("Heimilisfang").fill(`Einkaíbúð ${id}`); await saved(page);
  let release!: () => void; const barrier = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/c1/inspections", async route => {
    if (route.request().method() === "POST") { const response = await route.fetch(); await barrier; try { await route.fulfill({ response }); } catch {} }
    else await route.continue();
  });
  await page.getByLabel("Takmarkanir skoðunar").fill("A endurheimt í minni");
  await expect(page.locator(".save-status").first()).toHaveText("Vistun í bið…");
  await page.getByRole("button", { name: "Skrá út", exact: true }).click();
  await expect(page.getByLabel("Netfang prófreiknings")).toBeVisible();
  const config = await runtime();
  await page.getByLabel("Netfang prófreiknings").fill(config.accounts[1].email); await page.getByLabel("Lykilorð prófreiknings").fill(config.accounts[1].password);
  await page.getByRole("button", { name: "Skrá inn í C1", exact: true }).click();
  await saved(page); release();
  await page.getByRole("link", { name: /^Ástandsskráning/ }).first().click(); await expect(page.getByText(`Einkaíbúð ${id}`, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Skrá út", exact: true }).click();
  await page.getByLabel("Netfang prófreiknings").fill(config.accounts[0].email); await page.getByLabel("Lykilorð prófreiknings").fill(config.accounts[0].password);
  await page.getByRole("button", { name: "Skrá inn í C1", exact: true }).click(); await saved(page);
  const file = page.waitForEvent("download"); await page.getByRole("button", { name: "Sækja endurheimtarafrit", exact: true }).click();
  expect(await readFile((await (await file).path())!, "utf8")).toContain("A endurheimt í minni");
});

test("database read failure protects stored records and never substitutes demo fixtures", async ({ page }, testInfo) => {
  await login(page);
  await page.route("**/api/c1/inspections", route => route.request().method() === "GET" ? route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"simulated_unavailable"}' }) : route.continue());
  await page.reload(); await expect(page.locator(".storage-warning[role=alert]")).toContainText("Engin sýnigögn koma í þeirra stað");
  await expect(page.getByRole("heading", { name: "Mínar skýrslur", exact: true })).toBeVisible();
  await expect(page.getByText("0 skýrslur", { exact: true })).toBeVisible();
  await noOverflow(page); await accessible(page);
  await page.screenshot({ path: testInfo.outputPath("read-failure.png"), fullPage: true });
  await page.unroute("**/api/c1/inspections"); await page.getByRole("button", { name: "Reyna gagnasókn aftur", exact: true }).click(); await saved(page);
});

test("a save rejected before commit retains the candidate and retries without changing the saved baseline", async ({ page }) => {
  await login(page); const id = await newDraft(page), auth = await token();
  const read = async () => {
    const response = await page.request.get("/api/c1/inspections", { headers: { Authorization: `Bearer ${auth.token}` } });
    return (await response.json()).records.find((r: { id: string }) => r.id === id);
  };
  const before = await read(); const attempts: unknown[] = [];
  await page.route("**/api/c1/inspections", route => {
    if (route.request().method() !== "POST") return route.continue();
    attempts.push(route.request().postDataJSON());
    return attempts.length === 1 ? route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"simulated_precommit_failure"}' }) : route.continue();
  });
  await page.getByLabel("Takmarkanir skoðunar").fill("Varðveitt ósent prófsvar");
  await expect(page.locator(".storage-warning[role=alert]")).toContainText("Vistun er óstaðfest");
  await expect(page.getByLabel("Takmarkanir skoðunar")).toHaveValue("Varðveitt ósent prófsvar");
  expect(await read()).toEqual(before);
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click(); await saved(page);
  expect(attempts).toHaveLength(2); expect(attempts[1]).toEqual(attempts[0]);
  const after = await read(); expect(after.revision).toBe(before.revision + 1);
  expect(after.document.details.scopeLimitations).toBe("Varðveitt ósent prófsvar");
});
