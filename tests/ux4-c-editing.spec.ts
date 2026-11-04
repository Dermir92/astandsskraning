import { expect, test, type Page } from "@playwright/test";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { EMPTY_OBSERVATION } from "../src/lib/model";
import { checklistReport } from "./inspection-checklist-fixtures";
import { expandAssessment } from "./inspection-ui-helpers";

const route = "/skyrslur/checklist-report/skraning?rymi=checklist-entry";
const row = (page: Page, id: string) => page.locator(`.checklist-item[data-item="${id}"]`);
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key)!, STORAGE_KEY);
async function seed(page: Page, missing: "description" | "location" | "damageType" = "description") {
  const report = checklistReport(true);
  report.rooms[0].observations.walls[missing] = "";
  Object.assign(report.rooms[0].observations.walls, { extension: { raw: [false, 0, "  keep  "] } });
  const document = JSON.stringify({ version: 1, extension: { keep: true }, reports: [report] });
  await page.addInitScript(({ key, document }) => {
    if (!sessionStorage.getItem("ux4-c-seeded")) {
      localStorage.setItem(key, document);
      sessionStorage.setItem("ux4-c-seeded", "1");
    }
  }, { key: STORAGE_KEY, document });
  await page.goto(`${route}&atridi=walls`);
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  return document;
}

test("BUG-01: typing across invalid/valid defect descriptions keeps the same editor and focus", async ({ page }) => {
  const before = JSON.parse(await seed(page));
  const description = row(page, "walls").getByRole("textbox", { name: /^Lýsing/ });
  await description.evaluate(el => el.setAttribute("data-live-editor", "original"));
  await description.focus();
  await page.keyboard.type("R");
  await expect(description).toBeVisible();
  await expect(description).toBeFocused();
  await page.keyboard.type("ispa við karm");
  await expect(description).toHaveValue("Rispa við karm");
  await expect(description).toHaveAttribute("data-live-editor", "original");
  await description.fill("   ");
  await expect(row(page, "walls")).toHaveAttribute("data-state", "incomplete");
  await page.keyboard.type("Ný lýsing");
  await expect(description).toBeFocused();
  await expect(description).toHaveValue("   Ný lýsing");
  const after = JSON.parse(await raw(page));
  before.reports[0].rooms[0].observations.walls.description = "   Ný lýsing";
  before.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(before);
  await row(page, "walls").getByRole("button", { name: "Loka atriði", exact: true }).click();
  await row(page, "walls").locator(".checklist-toggle").click();
  await expect(row(page, "walls").getByRole("region", { name: "Skráð frávik", exact: true })).toContainText("Ný lýsing");
  await page.reload();
  await expect(row(page, "walls").getByRole("region", { name: "Skráð frávik", exact: true })).toContainText("Ný lýsing");
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  await expect(description).toHaveValue("   Ný lýsing");
  await description.fill("");
  await page.keyboard.type("Endurskoðuð lýsing");
  await expect(description).toHaveValue("Endurskoðuð lýsing");
  await expect(description).toBeFocused();
});

test("BUG-02 focused check: assessment and related edits survive navigation, return and reload", async ({ page }) => {
  const before = JSON.parse(await seed(page));
  await row(page, "windows").locator(".checklist-toggle").click();
  await expandAssessment(row(page, "windows"));
  await row(page, "windows").getByRole("radio", { name: "Virkar", exact: true }).click();
  await row(page, "windows").getByRole("radio", { name: "Hreint", exact: true }).click();
  await row(page, "windows").getByRole("radio", { name: "Í lagi", exact: true }).click();
  await expect(row(page, "windows").getByRole("radio", { name: "Virkar", exact: true })).toBeChecked();
  expect(JSON.parse(await raw(page)).reports[0].rooms[0].observations.windows).toEqual({ ...EMPTY_OBSERVATION, condition: "good", functionality: "works", cleanliness: "clean" });
  await row(page, "windows").getByRole("textbox", { name: /^Athugasemd/ }).fill("Athugað eftir breytingu mats");
  await row(page, "windows").getByRole("radio", { name: "Virkar ekki", exact: true }).click();
  await row(page, "windows").getByLabel(/^Tegund skemmdar/).selectOption("Óvirkur búnaður");
  await row(page, "windows").getByRole("textbox", { name: /^Staðsetning/ }).fill("Við karm");
  await row(page, "windows").getByRole("textbox", { name: /^Lýsing/ }).fill("Tilbúin prófun: opnast ekki");
  await expandAssessment(row(page, "windows"));
  await row(page, "windows").getByRole("radio", { name: "Virkar", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Breyta virku fráviki?", exact: true });
  const beforeCancel = await raw(page);
  await confirmation.getByRole("button", { name: "Halda fyrra mati", exact: true }).click();
  await expect(row(page, "windows").getByRole("radio", { name: "Virkar ekki", exact: true })).toBeChecked();
  expect(await raw(page)).toBe(beforeCancel);
  await row(page, "windows").getByRole("radio", { name: "Virkar", exact: true }).click();
  await confirmation.getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
  await expect(row(page, "windows").getByRole("radio", { name: "Virkar", exact: true })).toBeChecked();
  const after = JSON.parse(await raw(page));
  before.reports[0].rooms[0].observations.windows = { ...EMPTY_OBSERVATION, condition: "good", functionality: "works", cleanliness: "clean", damageType: "Óvirkur búnaður", location: "Við karm", description: "Tilbúin prófun: opnast ekki", note: "Athugað eftir breytingu mats" };
  before.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(before);
  await page.getByRole("combobox", { name: "Velja rými", exact: true }).selectOption("checklist-living");
  await page.getByRole("combobox", { name: "Velja rými", exact: true }).selectOption("checklist-entry");
  await row(page, "windows").locator(".checklist-toggle").click();
  await expandAssessment(row(page, "windows"));
  await expect(row(page, "windows").getByRole("radio", { name: "Í lagi", exact: true })).toBeChecked();
  await expect(row(page, "windows").getByRole("radio", { name: "Virkar", exact: true })).toBeChecked();
  await page.getByRole("link", { name: "Yfirferð", exact: true }).first().click();
  await expect(page).toHaveURL(/\/yfirferd/);
  await expect(page.getByRole("heading", { name: "Yfirferð skráningar", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/skraning\?.*atridi=windows/);
  await expandAssessment(row(page, "windows"));
  await page.reload();
  await expandAssessment(row(page, "windows"));
  await expect(row(page, "windows").getByRole("radio", { name: "Virkar", exact: true })).toBeChecked();
  await expect(row(page, "windows").getByRole("radio", { name: "Í lagi", exact: true })).toBeChecked();
  await expect(row(page, "windows").getByRole("radio", { name: "Hreint", exact: true })).toBeChecked();
  await expect(row(page, "windows").getByRole("textbox", { name: /^Athugasemd/ })).toHaveValue("Athugað eftir breytingu mats");
  expect(JSON.parse(await raw(page))).toEqual(after);
});

for (const missing of ["location", "damageType"] as const) {
  test(`BUG-01: completing ${missing} last keeps all defect fields editable`, async ({ page }) => {
    await seed(page, missing);
    const scope = row(page, "walls");
    const description = scope.getByRole("textbox", { name: /^Lýsing/ });
    await description.evaluate(el => el.setAttribute("data-live-editor", "original"));
    if (missing === "location") {
      const location = scope.getByRole("textbox", { name: /^Staðsetning/ });
      await location.focus();
      await page.keyboard.type("Við karm");
      await expect(location).toHaveValue("Við karm");
      await expect(location).toBeFocused();
    } else {
      const type = scope.getByLabel(/^Tegund skemmdar/);
      await type.focus();
      await type.selectOption("Rispa");
      await expect(type).toHaveValue("Rispa");
      await expect(type).toBeFocused();
    }
    await expect(description).toBeVisible();
    await expect(description).toHaveAttribute("data-live-editor", "original");
    await expect(description).toHaveValue("Tilbúin 8 cm rispa");
    await expect(scope).toHaveAttribute("data-state", "deviation");
  });
}

test("BUG-01: failed autosave retains the editor and draft; retry and reload preserve it", async ({ page }) => {
  const before = await seed(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreUx4Storage: () => void }).restoreUx4Storage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) throw new DOMException("Synthetic quota", "QuotaExceededError");
      original.call(this, name, value);
    };
  }, STORAGE_KEY);
  const description = row(page, "walls").getByRole("textbox", { name: /^Lýsing/ });
  await description.focus();
  await page.keyboard.type("Rispa sem bíður vistunar");
  await expect(description).toBeFocused();
  await expect(description).toHaveValue("Rispa sem bíður vistunar");
  await expect(page.locator(".storage-warning")).toContainText("aðeins í minni");
  expect(await raw(page)).toBe(before);
  await page.evaluate(() => (window as unknown as { restoreUx4Storage: () => void }).restoreUx4Storage());
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  await expect(page.locator(".topbar .save-status")).toHaveText("Vistað í þessum vafra");
  const after = JSON.parse(await raw(page));
  const expected = JSON.parse(before);
  expected.reports[0].rooms[0].observations.walls.description = "Rispa sem bíður vistunar";
  expected.reports[0].updatedAt = after.reports[0].updatedAt;
  expect(after).toEqual(expected);
  await page.reload();
  await row(page, "walls").getByRole("button", { name: "Breyta fráviki", exact: true }).click();
  await expect(description).toHaveValue("Rispa sem bíður vistunar");
  expect(JSON.parse(await raw(page))).toEqual(after);
});
