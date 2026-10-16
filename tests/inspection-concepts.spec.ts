import { test, expect, type Locator, type Page } from "@playwright/test";
import { demoReports } from "../src/lib/fixtures";

async function scene(work: Locator, name: string) {
  const details = work.locator("details").filter({ has: work.page().getByText("Prófunarsenur og ný sýnilota", { exact: true }) });
  if ((await details.getAttribute("open")) === null) await details.locator("summary").click();
  await work.getByRole("button", { name, exact: true }).click();
}
async function open(page: Page, concept: string) {
  const original = JSON.stringify({ version: 1, reports: demoReports() });
  await page.addInitScript(raw => {
    if (!localStorage.getItem("astandsskraning-demo-v1")) localStorage.setItem("astandsskraning-demo-v1", raw);
  }, original);
  await page.goto(`/hugmyndir/${concept}`);
  const work = page.locator(`[data-concept="${concept}"]`);
  await expect(work).toBeVisible();
  return { work, original };
}

for (const concept of ["a", "b"]) {
  test.describe(`isolated inspection concept ${concept.toUpperCase()}`, () => {
    test("explicit answers, exact review correction, rooms and interrupted resume", async ({ page }) => {
      const { work, original } = await open(page, concept);
      await expect(work.locator('input[type="radio"]:checked')).toHaveCount(0);
      if (concept === "a") await work.getByRole("radio", { name: "Í lagi", exact: true }).check();
      else await work.getByRole("button", { name: "Í lagi: Gólfefni", exact: true }).click();
      await expect(work.locator('[data-question="cleanliness"]')).toBeVisible();
      await expect(work.locator('[data-question="cleanliness"] input:checked')).toHaveCount(0);
      await work.getByRole("radio", { name: "Hreint", exact: true }).check();
      await expect(work.getByRole("status").filter({ hasText: "Svör skráð" })).toBeVisible();
      await work.getByRole("button", { name: "Næsta atriði", exact: true }).click();
      await expect(work.locator('[data-editor="concept-entry:walls"]')).toBeVisible();
      await work.getByRole("radio", { name: "Í lagi", exact: true }).check();
      await expect(work.getByRole("status").filter({ hasText: "Svör skráð" })).toBeVisible();

      await scene(work, "Ófullskráð atriði");
      await work.getByRole("button", { name: "Yfirferð", exact: true }).click();
      await work.getByRole("button", { name: /Forstofa Gluggar Þrif vantar/ }).click();
      await expect(work.locator('[data-editor="concept-entry:windows"]')).toBeVisible();
      await expect(work.locator('[data-question="cleanliness"] input[value="clean"]')).toBeFocused();
      await work.getByRole("radio", { name: "Hreint", exact: true }).check();
      await work.getByRole("button", { name: /RÝMI \d AF/ }).click();
      await page.getByRole("dialog").getByRole("button", { name: /3\. Eldhús/ }).click();
      if (concept === "b") await work.getByRole("button", { name: /Gluggar Óskráð/ }).click();
      else for (let i = 0; i < 3; i++) await work.getByRole("button", { name: "Næsta atriði", exact: true }).click();
      await work.getByRole("radio", { name: "Í lagi", exact: true }).check();
      await work.getByRole("radio", { name: "Virkar", exact: true }).check();
      await expect(work.locator('[data-question="cleanliness"] input:checked')).toHaveCount(0);
      await work.getByRole("button", { name: "Gera hlé á skoðun", exact: true }).click();
      await page.reload();
      await expect(work.getByRole("heading", { name: "Haltu áfram þar sem frá var horfið" })).toBeVisible();
      await expect(work.getByText("Sýnigata 14 · Eldhús", { exact: true })).toBeVisible();
      await work.getByRole("button", { name: "Halda áfram", exact: true }).click();
      await expect(work.locator('[data-editor="concept-kitchen:windows"]')).toBeVisible();
      await expect(work.getByRole("radio", { name: "Virkar", exact: true })).toBeChecked();
      await expect(work.locator('[data-question="cleanliness"] input[value="clean"]')).toBeFocused();
      expect(await page.evaluate(() => localStorage.getItem("astandsskraning-demo-v1"))).toBe(original);
    });

    test("deviation text and photo preview, retained evidence, and honest reload", async ({ page }) => {
      const { work, original } = await open(page, concept);
      await scene(work, "Frávik með mynd");
      await expect(work.getByRole("textbox", { name: "Lýsing", exact: true })).toHaveValue(/8 cm/);
      await expect(work.getByRole("img", { name: /Tilbúin sýnimynd/ })).toBeVisible();
      await work.getByRole("radio", { name: "Í lagi", exact: true }).check();
      await expect(work.getByText("Fyrri frávikslýsing varðveitt")).toBeVisible();
      await expect(work.getByRole("img", { name: /Tilbúin sýnimynd/ })).toBeVisible();
      await work.getByRole("radio", { name: "Skemmt", exact: true }).check();
      await expect(work.getByRole("textbox", { name: "Lýsing", exact: true })).toHaveValue(/8 cm/);
      await work.getByRole("button", { name: "Yfirferð", exact: true }).click();
      await work.getByRole("button", { name: /^Athygli/ }).click();
      await work.getByRole("button", { name: /Forstofa Veggir Frávik með mynd/ }).click();
      await work.getByLabel("Myndir af fráviki: velja myndir", { exact: true }).setInputFiles("public/concepts/synthetic-wall-damage.png");
      await expect(work.locator('section[aria-label="Myndir af fráviki"] li')).toHaveCount(2);
      await work.getByLabel("Myndir af fráviki: velja myndir", { exact: true }).setInputFiles({ name: "skemmd-mynd.jpg", mimeType: "image/jpeg", buffer: Buffer.from("invalid image bytes") });
      await expect(work.getByRole("alert")).toContainText("ekki tókst að lesa myndina");
      await expect(work.locator('section[aria-label="Myndir af fráviki"] li')).toHaveCount(2);
      await page.reload();
      await expect(work.getByText(/Tímabundnar myndir hurfu við endurhleðslu/)).toBeVisible();
      await expect(work.locator('[data-editor="concept-entry:walls"]')).toBeVisible();
      await expect(work.getByRole("textbox", { name: "Lýsing", exact: true })).toHaveValue(/8 cm/);
      await expect(work.getByText("Mynd af fráviki vantar. Svör geta samt verið fullskráð.")).toBeVisible();
      await expect(work.locator('section[aria-label="Myndir af fráviki"] li')).toHaveCount(0);
      expect(await page.evaluate(() => localStorage.getItem("astandsskraning-demo-v1"))).toBe(original);
    });

    test("unknown answers stay flagged, keyboard dialogs, empty queue, session failures", async ({ page }) => {
      const { work } = await open(page, concept);
      await scene(work, "Í lagi");
      if (concept === "b") await work.locator("summary").filter({ hasText: "Breyta" }).click();
      await work.getByRole("radio", { name: "Ekki skoðað", exact: true }).check();
      await work.getByRole("button", { name: "Yfirferð", exact: true }).click();
      await work.getByRole("button", { name: /^Athygli/ }).click();
      await expect(work.getByRole("button", { name: /Forstofa Veggir Ekki skoðað/ })).toBeVisible();
      await work.getByRole("button", { name: "Aftur í atriði", exact: true }).click();
      const picker = work.getByRole("button", { name: /RÝMI \d AF/ });
      await picker.focus(); await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("button", { name: /5\. Baðherbergi/ })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("button", { name: "Loka yfirliti" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(picker).toBeFocused();
      await page.evaluate(() => {
        const raw = sessionStorage.getItem(`astandsskraning-concept-session-${document.querySelector("[data-concept]")!.getAttribute("data-concept")}`)!;
        const saved = JSON.parse(raw);
        for (const room of saved.state.rooms) for (const item of room.items) room.observations[item.id] = { damageType: "", location: "", description: "", note: "", condition: "na" };
        sessionStorage.setItem(`astandsskraning-concept-session-${document.querySelector("[data-concept]")!.getAttribute("data-concept")}`, JSON.stringify(saved));
      });
      await page.reload();
      await work.getByRole("button", { name: /^Ólokið/ }).click();
      await expect(page.getByRole("dialog").getByText(/Öll atriði eru fullskráð/)).toBeVisible();
      await page.keyboard.press("Escape");
      await page.evaluate(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) { if (key.startsWith("astandsskraning-concept-session-")) throw new Error("test failure"); return original.call(this, key, value); };
      });
      await work.getByRole("button", { name: "Gera hlé á skoðun" }).click();
      await expect(work.getByRole("alert")).toContainText("Sýnilotan er aðeins í minni");
    });
  });
}

test("A and B keep separate answers and the overview review link opens the exact photo control", async ({ page }) => {
  const { work: a, original } = await open(page, "a");
  await a.getByRole("radio", { name: "Í lagi", exact: true }).check();
  await a.getByRole("link", { name: "Samanburður", exact: true }).click();
  await page.getByRole("link", { name: "Prófa hugmynd B", exact: true }).click();
  const b = page.locator('[data-concept="b"]');
  await expect(b.getByText("0 af 46 atriðum skráð", { exact: true })).toBeVisible();
  await b.getByRole("button", { name: "Yfirferð", exact: true }).click();
  await b.locator("summary").filter({ hasText: "Yfirlitsmyndir rýma" }).click();
  await b.getByRole("button", { name: "Eldhús Yfirlitsmynd vantar", exact: true }).click();
  await expect(b.getByLabel("Yfirlitsmyndir rýmis: velja myndir", { exact: true })).toBeFocused();
  await expect(b.locator('[data-overview="concept-kitchen"]')).toHaveAttribute("open", "");
  await page.goto("/hugmyndir/a");
  await expect(a.getByRole("radio", { name: "Í lagi", exact: true })).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("astandsskraning-demo-v1"))).toBe(original);
});
