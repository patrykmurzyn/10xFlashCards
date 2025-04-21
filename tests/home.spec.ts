import { expect, test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Home page", () => {
    test("should load successfully", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();
        await homePage.expectLoaded();
    });

    test("should have working login button", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // Take screenshot before clicking
        await page.screenshot({ path: "screenshots/home-before-login.png" });

        // Click login and verify navigation or modal
        await homePage.clickLogin();

        // Example assertion - adjust based on actual application behavior
        await expect(page).toHaveURL(/.*login|.*auth/);
    });
});
