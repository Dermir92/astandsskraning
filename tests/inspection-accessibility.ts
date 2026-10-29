import AxeBuilder from "@axe-core/playwright";
import { test, type Page } from "@playwright/test";

export async function auditInspectionA11y(page: Page) {
  const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
  const result = await new AxeBuilder({ page }).withTags(tags).analyze();
  const bar = page.locator("[data-inspection-sections]");
  if (!await bar.count() || await bar.evaluate(el => getComputedStyle(el).position !== "sticky")) return result;
  const position = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const samples: object[] = [];
  try {
    for (const violation of result.violations) {
      if (violation.id !== "target-size") continue;
      const unresolved = [];
      for (const node of violation.nodes) {
        const selector = node.target[0];
        if (typeof selector !== "string") { unresolved.push(node); continue; }
        const target = page.locator(selector);
        if (await target.count() !== 1) { unresolved.push(node); continue; }
        await page.evaluate(p => scrollTo(p.x, p.y), position);
        const covered = await target.evaluate(el => {
          const nav = document.querySelector("[data-inspection-sections]")!.getBoundingClientRect();
          const box = el.getBoundingClientRect();
          return box.top < nav.bottom && box.bottom > nav.top && box.left < nav.right && box.right > nav.left;
        });
        if (!covered) { unresolved.push(node); continue; }
        // A sticky toolbar necessarily covers some scrolled-past controls.
        // Re-expose each reported target and run the SAME rules on that target;
        // never disable target-size or forgive a genuinely undersized control.
        await target.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
        const visibleResult = await new AxeBuilder({ page }).withTags(tags).include(selector).analyze();
        samples.push({ selector, original: node.failureSummary, exposedViolations: visibleResult.violations });
        if (visibleResult.violations.length) unresolved.push(node);
      }
      violation.nodes = unresolved;
    }
    result.violations = result.violations.filter(v => v.nodes.length);
  } finally {
    await page.evaluate(p => scrollTo(p.x, p.y), position);
  }
  if (samples.length) await test.info().attach("sticky-target-size-resampling", { body: JSON.stringify(samples, null, 2), contentType: "application/json" });
  return result;
}
