import { expect, test } from "@playwright/test";
test("experimental C1 APIs are absent from the default demonstration server", async ({ request }) => {
  expect((await request.get("/api/c1/config")).status()).toBe(404);
  expect((await request.get("/api/c1/inspections")).status()).toBe(404);
  expect((await request.post("/api/c1/inspections", { data: {} })).status()).toBe(404);
});
