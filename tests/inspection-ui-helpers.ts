import { expect, type Locator, type Page } from "@playwright/test";

export async function expandAssessment(scope: Locator) {
  await expect(scope.locator(".observation-body")).toBeVisible();
  const summary = scope.locator("summary").filter({ hasText: "Breyta mati" });
  if (await summary.isVisible() && !await summary.locator("..").evaluate(el => (el as HTMLDetailsElement).open)) await summary.click();
}

export async function chooseAssessment(page: Page, scope: Locator, name: string) {
  await expandAssessment(scope);
  const answer = scope.getByRole("group", { name: "Ástand", exact: true }).getByRole("radio", { name, exact: true });
  await answer.click();
  const confirm = page.getByRole("dialog", { name: "Breyta virku fráviki?", exact: true });
  await expect.poll(async () => await answer.isChecked() || await confirm.isVisible()).toBe(true);
  if (await confirm.isVisible()) await confirm.getByRole("button", { name: "Staðfesta breytingu", exact: true }).click();
  await expect(answer).toBeChecked();
}

export async function editDefect(scope: Locator) {
  const body = scope.locator(".observation-body");
  await expect(await body.count() ? body : scope).toBeVisible();
  const button = scope.getByRole("button", { name: "Breyta fráviki", exact: true });
  if (await button.isVisible()) await button.click();
}
