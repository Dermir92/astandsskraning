import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { EMPTY_DETAILS, EMPTY_OBSERVATION, type Report } from "../../src/lib/model";
import type { SaveOperation } from "../../src/lib/cloud/contracts";
import { expect, type Page } from "@playwright/test";

export interface Runtime { apiUrl: string; anonKey: string; databaseUrl: string; accounts: { id: string; email: string; password: string }[] }
export async function runtime(): Promise<Runtime> {
  const value = JSON.parse(await readFile("artifacts/c1-local/runtime.json", "utf8"));
  if (value.apiUrl !== "http://127.0.0.1:55421") throw new Error("C1 tests require the isolated local stack");
  return value;
}
export function draft(id = `legacy-íbúð:${randomUUID()}`): Report {
  return { id, assetType: "apartment", title: "C1 sýniíbúð", subtitle: "Tilbúin prófgögn", updatedAt: new Date().toISOString(),
    details: { ...EMPTY_DETAILS, inspectionType: "independent" },
    rooms: [{ id: "stofa", type: "living", name: "Stofa", items: [{ id: "walls", name: "Veggir" }], observations: { walls: { ...EMPTY_OBSERVATION } } }] };
}
export function operation(document: Report, expectedRevision = 0): SaveOperation {
  return { document, expectedRevision, operationId: randomUUID(), issuedAt: new Date().toISOString() };
}
export async function token(index = 0) {
  const config = await runtime(), account = config.accounts[index];
  const client = createClient(config.apiUrl, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword(account);
  if (error || !data.session) throw new Error("Fictional local account could not authenticate");
  return { config, account, token: data.session.access_token };
}
export async function login(page: Page, index = 0) {
  const config = await runtime();
  await page.goto("/");
  await page.getByLabel("Netfang prófreiknings").fill(config.accounts[index].email);
  await page.getByLabel("Lykilorð prófreiknings").fill(config.accounts[index].password);
  await page.getByRole("button", { name: "Skrá inn í C1", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mínar skýrslur", exact: true })).toBeVisible();
  await expect(page.locator(".save-status").first()).toHaveText("Vistað í gagnagrunni");
}
export async function newDraft(page: Page) {
  await page.goto("/skyrslur/ny");
  await page.getByRole("button", { name: "Velja íbúð", exact: true }).click();
  await expect(page.getByLabel("Heimilisfang")).toBeVisible();
  await expect(page.locator(".save-status").first()).toHaveText("Vistað í gagnagrunni");
  return page.url().split("/skyrslur/")[1].split("/")[0];
}
