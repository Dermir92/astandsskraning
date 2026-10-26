import { expect, type Page } from "@playwright/test";

// Mobile names open the quick sheet; the labelled row action keeps the original destination.
export function reportIdentity(page: Page, title: string) {
  return page.viewportSize()!.width <= 800
    ? page.getByRole("button", { name: `Yfirlit: ${title}`, exact: true })
    : page.getByRole("link", { name: title, exact: true });
}

export function reportDestination(page: Page, title: string) {
  return page
    .locator(".report-entry")
    .filter({ has: reportIdentity(page, title) })
    .locator(".register-next");
}

export async function showFilters(page: Page) {
  // SSR controls can be visible before their client handlers are attached.
  await expect(page.locator(".topbar .save-status")).not.toHaveText("Hleð drögum…");
  const toggle = page.getByRole("button", { name: /Sía og raða/ });
  if (
    (await toggle.isVisible()) &&
    (await toggle.getAttribute("aria-expanded")) === "false"
  )
    await toggle.click();
}
