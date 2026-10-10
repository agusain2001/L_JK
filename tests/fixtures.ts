import { test as base } from "@playwright/test";

// Existing feature tests represent a visitor who has already opened the welcome.
// The fresh entry flow is exercised separately in entry.spec.ts.
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.addInitScript(() => {
      try { sessionStorage.setItem("for-you:tulip-walk:v3", "1"); } catch { /* Some API-only contexts have no storage origin. */ }
    });
    await runTest(page);
  },
});
export { expect } from "@playwright/test";
export type { Page, APIRequestContext } from "@playwright/test";
