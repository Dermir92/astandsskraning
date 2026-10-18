import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { RENTAL_FIELD_IDS } from "../src/lib/rental-information";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { extendedRentalDocument, rentalInformation, rentalReport } from "./rental-information-fixtures";

const base = "/skyrslur/rental-case";
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
const savedDetails = async (page: Page) => JSON.parse((await raw(page))!).reports[0].details;
async function seed(page: Page, report = rentalReport()) {
  const document = JSON.stringify({ version: 1, envelopeExtension: { keep: [0, false, "synthetic"] }, reports: [report] }, null, 2);
  await page.addInitScript(({ document, key }) => {
    if (!sessionStorage.getItem("rental-seeded")) { localStorage.setItem(key, document); sessionStorage.setItem("rental-seeded", "yes"); }
  }, { document, key: STORAGE_KEY });
  await page.goto(`${base}/upplysingar`);
  await expect(page.getByLabel("Heimilisfang")).toHaveValue(report.details.address);
  return document;
}
async function disclose(page: Page, title: string) {
  const summary = page.locator(".rental-disclosure > summary").filter({ hasText: title });
  if (!(await summary.locator("..").getAttribute("open") !== null)) await summary.click();
}
async function openRetained(page: Page) {
  const summary = page.locator(".rental-retained > summary");
  if (!(await summary.locator("..").getAttribute("open") !== null)) await summary.click();
}

test("rental starts with only three visible new inputs; reads and disclosures never populate fields", async ({ page }) => {
  const report = rentalReport(); report.details.furnished = "";
  const original = await seed(page, report);
  const panel = page.getByRole("region", { name: "Íbúðarleiga", exact: true });
  await expect(panel.locator("input:visible,select:visible,textarea:visible")).toHaveCount(3);
  await expect(panel.locator(".rental-disclosure > summary").filter({ hasText: "Afhending og húsgögn" })).toContainText("1 upplýsing vantar");
  for (const title of ["Leigusamningur", "Fasteignanúmer og afmörkun", "Fyrirsvar", "Afhending og húsgögn"]) await disclose(page, title);
  expect(await raw(page)).toBe(original); await page.reload(); expect(await raw(page)).toBe(original);
  await page.getByLabel("Hlutverk stofnanda").selectOption("landlord");
  expect(await savedDetails(page)).not.toHaveProperty("rentalInformation");
  await page.getByRole("button", { name: "Velja rými", exact: true }).click(); await expect(page).toHaveURL(`${base}/rymi`);
  await page.goto(`${base}/yfirferd`);
  await expect(page.getByRole("heading", { name: "Leiguupplýsingar vantar", exact: true })).toBeVisible();
  for (const label of ["Nafn leigusala", "Nafn leigjanda", "Lýsing á hinu leigða", "Dagsetning eða tilvísun í leigusamning"]) await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
});

test("names, separate rented extent and reference alone round-trip without establishing a lease date", async ({ page }) => {
  await seed(page);
  await page.locator("#rentalLandlordNames").fill(rentalInformation.landlordNames!);
  await page.locator("#rentalTenantNames").fill(rentalInformation.tenantNames!);
  await page.locator("#rentalPremisesDescription").fill(rentalInformation.premisesDescription!);
  await disclose(page, "Leigusamningur"); await page.locator("#rentalLeaseReference").fill("REF 0007");
  expect((await savedDetails(page)).rentalInformation).toEqual({ landlordNames: rentalInformation.landlordNames, tenantNames: rentalInformation.tenantNames, premisesDescription: rentalInformation.premisesDescription, leaseReference: "REF 0007" });
  await page.goto(`${base}/yfirferd`); await page.reload();
  const summary = page.locator("#review-rental-details");
  await expect(summary).toContainText("Leiguupplýsingar skráðar");
  await expect(summary.locator(".rental-entry").filter({ has: page.getByRole("link", { name: "Breyta: Dagsetning leigusamnings", exact: true }) }).locator("dd")).toHaveText("Óskráð");
  await expect(page.getByRole("heading", { name: "Leiguupplýsingar vantar", exact: true })).toHaveCount(0);
  expect((await savedDetails(page)).scopeDescription).toBe(rentalReport().details.scopeDescription);
  await expect(page.getByText(/ekki fullbúin leiguúttekt/)).toBeVisible();
});

test("representative requires explicit source and retains its alternative name through role/source changes", async ({ page }) => {
  await seed(page, rentalReport(rentalInformation));
  await page.getByLabel("Hlutverk stofnanda").selectOption("representative");
  await expect(page.locator("#rentalRepresentativeNameSource")).toBeVisible();
  expect((await savedDetails(page)).rentalInformation).not.toHaveProperty("representation");
  await page.locator("#rentalRepresentativeNameSource").selectOption("other");
  await page.locator("#rentalRepresentativeName").fill("Annar Sýnifulltrúi");
  await page.locator("#rentalRepresentedParty").selectOption("landlord");
  await page.locator("#rentalRepresentationBasis").fill("Uppgefin heimild.\nEkki staðfest.");
  await page.locator("#rentalRepresentativeNameSource").selectOption("recorder");
  await expect(page.locator("#rentalRepresentativeName")).toHaveCount(0);
  await page.getByLabel("Nafn skráningaraðila").fill("Nýr Sýniskrásetjari");
  const rep = (await savedDetails(page)).rentalInformation.representation;
  expect(rep.name).toBe("Annar Sýnifulltrúi"); expect(rep.nameSource).toBe("recorder");
  await page.goto(`${base}/yfirferd`); await disclose(page, "Fyrirsvar");
  await expect(page.locator("#review-rental-details")).toContainText("Nýr Sýniskrásetjari");
  await expect(page.locator("#review-rental-details")).not.toContainText("Annar Sýnifulltrúi");
  await page.goto(`${base}/upplysingar`); await page.locator("#rentalRepresentativeNameSource").selectOption("other");
  await expect(page.locator("#rentalRepresentativeName")).toHaveValue("Annar Sýnifulltrúi");
  await page.locator("#rentalRepresentativeNameSource").selectOption("recorder");
  await page.getByLabel("Hlutverk stofnanda").selectOption("tenant"); await page.goto(`${base}/yfirferd`);
  await expect(page.getByRole("link", { name: "Hlutverk og fyrirsvar þarfnast yfirferðar", exact: true })).toBeVisible();
});

for (const role of ["landlord", "tenant"] as const) {
  test(`partial representation stays visible through completion, clearing and context switches for ${role}`, async ({ page }) => {
    const retained = { name: "Annar Sýnifulltrúi", basisDescription: "Sjálfskráð heimild", future: { keep: true } };
    const party = role === "landlord" ? "tenant" : "landlord";
    const report = rentalReport({ ...rentalInformation, representation: retained });
    report.details.role = role;
    await seed(page, report);
    await disclose(page, "Fyrirsvar");
    await page.locator("#rentalRepresentedParty").selectOption(party);
    await expect(page.locator("#rentalRepresentativeNameSource")).toHaveValue("");
    await expect(page.locator("#rentalRepresentativeName")).toHaveCount(0);
    await expect(page.getByLabel("Hlutverk stofnanda")).toHaveValue(role);
    const partial = await raw(page);
    expect((await savedDetails(page)).rentalInformation.representation).toEqual({ ...retained, representedParty: party });
    await page.goto(`${base}/yfirferd`);
    await expect(page.locator(".rental-readiness")).toHaveCount(0);
    await page.getByRole("link", { name: "Hver kemur fram sem fulltrúi", exact: true }).click();
    await expect(page.locator("#rentalRepresentativeNameSource")).toBeFocused();
    expect(await raw(page)).toBe(partial);
    await page.locator("#rentalRepresentativeNameSource").selectOption("other");
    await expect(page.locator("#rentalRepresentativeName")).toHaveValue(retained.name);
    await page.goto(`${base}/yfirferd`);
    await expect(page.locator(".rental-readiness")).toHaveText("Leiguupplýsingar skráðar");
    await page.goto(`${base}/upplysingar`); await disclose(page, "Fyrirsvar");
    await page.locator("#rentalRepresentedParty").selectOption("");
    await page.goto(`${base}/yfirferd`);
    await page.getByRole("link", { name: "Aðili sem fulltrúi kemur fram fyrir", exact: true }).click();
    await expect(page.locator("#rentalRepresentedParty")).toBeFocused();
    await page.locator("#rentalRepresentedParty").selectOption(party);
    await page.locator("#rentalRepresentativeNameSource").selectOption("");
    for (const context of ["standalone", ""] as const) {
      await page.getByLabel("Tengsl við íbúðarleigu").selectOption(context); await page.reload();
      await page.goto(`${base}/yfirferd`);
      await expect(page.getByRole("heading", { name: "Leiguupplýsingar vantar", exact: true })).toHaveCount(0);
      await page.goto(`${base}/upplysingar`);
      await page.getByLabel("Tengsl við íbúðarleigu").selectOption("residential_rental");
      await page.goto(`${base}/yfirferd`);
      await expect(page.locator(".rental-readiness")).toHaveCount(0);
      await page.getByRole("link", { name: "Hver kemur fram sem fulltrúi", exact: true }).click();
    }
    await page.locator("#rentalRepresentedParty").selectOption("");
    await page.reload();
    const details = await savedDetails(page);
    expect(details.role).toBe(role);
    expect(details.rentalInformation).toEqual({ ...rentalInformation, representation: { ...retained, representedParty: "", nameSource: "" } });
    await page.goto(`${base}/yfirferd`);
    await expect(page.locator(".rental-readiness")).toHaveText("Leiguupplýsingar skráðar");
    await expect(page.getByRole("heading", { name: "Leiguupplýsingar vantar", exact: true })).toHaveCount(0);
  });
}

test("collapsed lease disclosure exposes an invalid date even with a valid reference", async ({ page }) => {
  const original = await seed(page, rentalReport({ ...rentalInformation, leaseDate: "2026-02-30", leaseReference: "REF 0007" }));
  const lease = page.locator(".rental-disclosure > summary").filter({ hasText: "Leigusamningur" });
  await expect(lease).toBeVisible();
  await expect(page.locator("#rentalLeaseDate")).toBeHidden();
  await expect(lease).toContainText("Dagsetning leigusamnings þarfnast yfirferðar");
  await page.goto(`${base}/yfirferd`);
  await expect(page.getByRole("heading", { name: "Leiguupplýsingar vantar", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Dagsetning leigusamnings þarfnast yfirferðar", exact: true }).click();
  await expect(page.locator("#rentalLeaseDate")).toBeFocused();
  await expect(page.locator("#rentalLeaseDate")).toHaveValue("2026-02-30");
  expect(await raw(page)).toBe(original);
  await page.locator("#rentalLeaseDate").fill("2026-02-28");
  await lease.click();
  await expect(page.locator("#rentalLeaseDate")).toBeHidden();
  await expect(lease).toContainText("Tilvísun skráð");
  expect((await savedDetails(page)).rentalInformation.leaseReference).toBe("REF 0007");
  await page.goto(`${base}/yfirferd`);
  await expect(page.getByRole("heading", { name: "Leiguupplýsingar til að yfirfara", exact: true })).toHaveCount(0);
  await expect(page.locator(".rental-readiness")).toHaveText("Leiguupplýsingar skráðar");
});

test("context switches preserve all rental, handover, furniture, notes and extension data", async ({ page }) => {
  const document = extendedRentalDocument(); const report = document.reports[0];
  await seed(page, report);
  for (const context of ["standalone", "", "residential_rental"] as const) {
    await page.getByLabel("Tengsl við íbúðarleigu").selectOption(context); await page.reload();
    const details = await savedDetails(page);
    expect(details).toEqual({ ...report.details, inspectionContext: context });
    if (context !== "residential_rental") {
      await expect(page.locator("#rentalLandlordNames")).toBeHidden(); await openRetained(page);
      await expect(page.locator("#rentalLandlordNames")).toHaveValue(rentalInformation.landlordNames!);
      await expect(page.locator(".rental-panel .required-mark")).toHaveCount(0);
    }
    await page.goto(`${base}/yfirferd`);
    if (context !== "residential_rental") {
      await expect(page.getByRole("heading", { name: "Leiguupplýsingar vantar", exact: true })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Leiguupplýsingar til að yfirfara", exact: true })).toHaveCount(0);
      await page.locator("#review-rental-details > details > summary").click();
      await expect(page.locator("#review-rental-details")).toContainText(rentalInformation.landlordNames!);
      await page.getByRole("link", { name: "Breyta: Leigusali", exact: true }).click();
      await expect(page.locator("#rentalLandlordNames")).toBeFocused();
      await page.locator("#rentalLandlordNames").fill(rentalInformation.landlordNames!);
    }
    await page.goto(`${base}/upplysingar`);
  }
  expect((await savedDetails(page)).rentalInformation).toEqual(report.details.rentalInformation);
  expect(JSON.parse((await raw(page))!).envelopeExtension).toEqual({ keep: [0, false, "synthetic"] });
});

test("every correction target opens all retained ancestors after reload, keeps focus and returns safely", async ({ page }) => {
  const report = rentalReport({ ...rentalInformation, representation: { nameSource: "other", name: "Sýnifulltrúi", representedParty: "tenant", basisDescription: "Sjálfskráð" } });
  report.details.inspectionContext = "standalone";
  const original = await seed(page, report);
  for (const target of RENTAL_FIELD_IDS) {
    await page.goto(`${base}/upplysingar?fra=yfirferd&reitur=${target}&hluti=leiga`); await page.reload();
    await expect(page.locator(`#${target}`)).toBeFocused(); await expect(page.locator(`#${target}`)).toBeVisible();
  }
  expect(await raw(page)).toBe(original);
  await page.locator("#rentalRepresentationBasis").press("Control+End");
  await page.locator("#rentalRepresentationBasis").pressSequentially(" Viðbót."); await expect(page.locator("#rentalRepresentationBasis")).toBeFocused();
  await page.getByRole("button", { name: "Aftur í yfirferð", exact: true }).click();
  await expect(page.locator("#review-rental-details")).toBeFocused();
  await page.goBack(); await expect(page.locator("#rentalRepresentationBasis")).toHaveValue("Sjálfskráð Viðbót.");
  for (const query of ["fra=https://example.com&reitur=rentalLandlordNames", "fra=yfirferd&reitur=rentalLandlordNames&reitur=rentalTenantNames", "fra=yfirferd&fra=external&reitur=rentalLandlordNames", "fra=yfirferd&reitur=unknown"]) {
    await page.goto(`${base}/upplysingar?${query}`); await expect(page.locator("#rentalLandlordNames")).not.toBeFocused();
  }
});

test("rental correction returns to visible core information when context or last retained value removes its summary", async ({ page }) => {
  await seed(page, rentalReport({ landlordNames: "Sýnileiga" }));
  await page.goto(`${base}/yfirferd`); await page.getByRole("link", { name: "Breyta: Leigusali", exact: true }).click();
  await page.getByLabel("Tengsl við íbúðarleigu").selectOption("standalone");
  await openRetained(page);
  await page.locator("#rentalLandlordNames").fill("");
  await page.getByRole("button", { name: "Aftur í yfirferð", exact: true }).click();
  await expect(page.locator("#review-core-details")).toBeFocused();
  await expect(page.locator("#review-rental-details")).toHaveCount(0);
  expect((await savedDetails(page)).rentalInformation).toEqual({ landlordNames: "" });
});

test("malformed lease dates remain editable and correctable; future dates and raw identifiers survive", async ({ page }) => {
  await seed(page, rentalReport({ ...rentalInformation, leaseDate: "2026-02-30", propertyNumber: "000-F 001/Ó", leaseReference: "free text 0007" }));
  await page.goto(`${base}/yfirferd`);
  await page.getByRole("link", { name: "Dagsetning leigusamnings þarfnast yfirferðar", exact: true }).click();
  await expect(page.locator("#rentalLeaseDate")).toHaveAttribute("type", "text");
  await expect(page.locator("#rentalLeaseDate")).toHaveValue("2026-02-30");
  await page.locator("#rentalLeaseDate").fill("2099-01-01"); await page.reload();
  await expect(page.locator("#rentalLeaseDate")).toHaveValue("2099-01-01");
  await page.goto(`${base}/yfirferd`); await expect(page.getByRole("heading", { name: "Leiguupplýsingar til að yfirfara", exact: true })).toHaveCount(0);
  expect((await savedDetails(page)).rentalInformation.propertyNumber).toBe("000-F 001/Ó");
});

test("long multiline content remains exact on reload and in review", async ({ page }) => {
  const long = "Ólöf Þórðardóttir og Sýnidís Guðmundsdóttir — ".repeat(35) + "\nÖnnur lína.";
  const report = rentalReport({ ...rentalInformation, landlordNames: long, premisesDescription: long, includedAreasDescription: long });
  const original = await seed(page, report); await page.reload(); await expect(page.locator("#rentalLandlordNames")).toHaveValue(long);
  await page.goto(`${base}/yfirferd`); await expect(page.locator("#review-rental-details .rental-entry").first().locator("dd")).toHaveText(long);
  expect(await raw(page)).toBe(original);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("rental flow keeps existing room navigation and temporary photo associations", async ({ page }) => {
  await seed(page, rentalReport(rentalInformation));
  await page.getByRole("button", { name: "Velja rými", exact: true }).click(); await expect(page).toHaveURL(`${base}/rymi`);
  await page.goto(`${base}/skraning`); await expect(page.locator("main h1")).toBeVisible();
  const toggle = page.locator('.checklist-item[data-item="walls"] .checklist-toggle');
  if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
  const syntheticImage = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext("2d")!; context.fillStyle = "#17635d"; context.fillRect(0, 0, 64, 64);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Myndir við atriði: velja myndir", { exact: true }).setInputFiles({
    name: "synthetic-rental.png", mimeType: "image/png",
    buffer: Buffer.from(syntheticImage, "base64"),
  });
  await expect(page.locator('.photo-preview[aria-label="Myndir við atriði"] .photo-actions > span')).toContainText("1/8");
  await page.locator('.stepper a[href$="/yfirferd"]').click();
  await expect(page.locator(".review-summary")).toContainText("1myndaforskoðanir");
  const before = await savedDetails(page);
  await page.getByRole("link", { name: "Breyta: Leigusali", exact: true }).click();
  await page.locator("#rentalLandlordNames").fill("Breytt sýninafn");
  await page.getByRole("button", { name: "Aftur í yfirferð", exact: true }).click();
  expect((await savedDetails(page)).scopeDescription).toBe(before.scopeDescription);
  expect(JSON.parse((await raw(page))!).reports[0].rooms).toEqual(rentalReport().rooms);
  await expect(page.locator(".review-summary")).toContainText("1myndaforskoðanir");
  await expect(page.getByText(/Myndir eru aðeins forskoðaðar í þessari setu/)).toBeVisible();
});

test("empty standalone keeps legacy optional handover editing stable without requesting rental fields", async ({ page }) => {
  const report = rentalReport(); Object.assign(report.details, { inspectionContext: "standalone", deliveryDate: "", furnished: "" });
  await seed(page, report); await expect(page.locator("#rentalLandlordNames")).toHaveCount(0);
  await page.locator(".rental-legacy-extras > summary").click();
  await page.getByLabel("Dagsetning afhendingar").fill("2026-10-20");
  await expect(page.getByLabel("Dagsetning afhendingar")).toBeFocused();
  await page.getByRole("radio", { name: "Að hluta", exact: true }).check();
  await expect(page.getByRole("radio", { name: "Að hluta", exact: true })).toBeFocused();
  expect(await savedDetails(page)).not.toHaveProperty("rentalInformation");
});

test("browser write failure retains pending rental edits and envelope extensions for retry", async ({ page }) => {
  const original = await seed(page, rentalReport(rentalInformation));
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreRentalWrites: () => void }).restoreRentalWrites = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("Synthetic quota failure", "QuotaExceededError");
      return original.call(this, name, value);
    };
  }, STORAGE_KEY);
  await page.locator("#rentalLandlordNames").fill("Óvistað sýninafn");
  await disclose(page, "Leigusamningur"); await page.locator("#rentalLeaseReference").fill("PENDING-0007");
  expect(await raw(page)).toBe(original); await expect(page.locator(".storage-warning")).toContainText("Breytingar eru aðeins í minni");
  await page.evaluate(() => (window as unknown as { restoreRentalWrites: () => void }).restoreRentalWrites());
  await page.getByRole("button", { name: "Reyna vistun aftur", exact: true }).click();
  await expect(page.locator(".storage-warning")).toHaveCount(0); await page.reload();
  await expect(page.locator("#rentalLandlordNames")).toHaveValue("Óvistað sýninafn");
  expect((await savedDetails(page)).rentalInformation.leaseReference).toBe("PENDING-0007");
  expect(JSON.parse((await raw(page))!).envelopeExtension).toEqual({ keep: [0, false, "synthetic"] });
});

test("responsive disclosures, keyboard, axe and enlarged long content", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The full width/state audit is run once.");
  test.setTimeout(180_000);
  const report = rentalReport({ ...rentalInformation, landlordNames: "Sýnileiga og langt íslenskt heiti ".repeat(12), representation: { nameSource: "other", name: "Sýnifulltrúi", representedParty: "landlord" } });
  await seed(page, report);
  for (const context of ["residential_rental", "standalone", ""] as const) {
    await page.goto(`${base}/upplysingar`); await page.getByLabel("Tengsl við íbúðarleigu").selectOption(context);
    for (const width of [320, 360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ["upplysingar", "yfirferd"]) {
        await page.goto(`${base}/${route}`);
        if (context !== "residential_rental") {
          if (route === "upplysingar") await openRetained(page);
          else await page.locator("#review-rental-details > details > summary").click();
        }
        for (const summary of await page.locator(".rental-disclosure > summary").all()) {
          await summary.focus(); await expect(summary).toBeFocused();
          if (!(await summary.locator("..").getAttribute("open") !== null)) await summary.press("Enter");
          expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
      }
    }
  }
});

test("expanded secondary fields and long content reflow at 200 percent text", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The 320px text audit is run once.");
  const report = rentalReport({ ...rentalInformation, landlordNames: "Sýnileiga og langt íslenskt heiti ".repeat(12), representation: { nameSource: "other", name: "Sýnifulltrúi", representedParty: "landlord" } });
  report.details.inspectionContext = "standalone";
  await seed(page, report);
  await page.setViewportSize({ width: 320, height: 1000 });
  for (const route of ["upplysingar", "yfirferd"]) {
    await page.goto(`${base}/${route}`);
    if (route === "upplysingar") await openRetained(page); else await page.locator("#review-rental-details > details > summary").click();
    for (const summary of await page.locator(".rental-disclosure > summary").all()) {
      if (!(await summary.locator("..").getAttribute("open") !== null)) await summary.click();
    }
    await page.evaluate(() => {
      const sizes = [...document.querySelectorAll<HTMLElement>("main, main *")].map(el => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
      for (const { el, size } of sizes) el.style.fontSize = `${size * 2}px`;
    });
    const layout = await page.evaluate(() => ({ width: innerWidth, actual: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll<HTMLElement>("main *")].filter(el => { const box = el.getBoundingClientRect(); return box.width && box.right > innerWidth + 1; }).map(el => ({ tag: el.tagName, id: el.id, className: el.className, text: el.textContent?.slice(0, 50), width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right })) }));
    expect(layout.actual, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);
    await page.screenshot({ path: `artifacts/phase-1b3b2/after/long-320-text-200-${route}.png`, fullPage: true });
  }
});
