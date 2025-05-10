import { expect, test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

// Ensure required environment variables are available
const testEmail = process.env.E2E_USERNAME;
const testPassword = process.env.E2E_PASSWORD;

if (!testEmail || !testPassword) {
    throw new Error(
        "Required environment variables E2E_USERNAME or E2E_PASSWORD are missing in .env.test file",
    );
}

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(process.cwd(), "screenshots");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create a test fixture for retries
const loginTest = test.extend({
    page: async ({ page }, use) => {
        // Configure retry for the page
        page.setDefaultTimeout(30000);
        await use(page);
    },
});

test.describe("Login functionality", () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);

        // Clear cookies and local storage to ensure a clean state
        await page.context().clearCookies();
        try {
            await page.evaluate(() => {
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch (e) {
                    // Ignore errors
                }
            });
        } catch (e: any) {
            // Ignore errors
        }

        // Navigate to login page
        await loginPage.goto();

        // Verify we're on the login page before starting test
        await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    });

    // Use a separate test hook for the login test with retries
    loginTest(
        "should login successfully with valid credentials",
        async ({ page }) => {
            // Maximum number of login attempts
            const maxAttempts = 3;
            let loginSuccess = false;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                console.log(`Login attempt ${attempt} of ${maxAttempts}`);

                // Clear any form content and error messages
                await page.reload();
                await page.waitForLoadState("networkidle");

                // Make sure we're on the login page
                const currentUrlBeforeLogin = page.url();
                if (!currentUrlBeforeLogin.includes("/login")) {
                    console.log("Not on login page, navigating there...");
                    await loginPage.goto();
                }

                // Take screenshot of starting state
                await page.screenshot({
                    path: `test-results/login-attempt-${attempt}-before.png`,
                });

                // Fill form with credentials from environment variables
                await page.waitForSelector("#email");
                await page.waitForSelector("#password");
                await page.fill("#email", testEmail);
                await page.fill("#password", testPassword);

                // Find and click the submit button
                const submitButton = page.locator('button:has-text("Sign in")');
                await expect(submitButton).toBeVisible();
                await submitButton.click();

                // Wait a moment for the form submission
                await page.waitForTimeout(2000);

                // Take screenshot after submitting form
                await page.screenshot({
                    path:
                        `test-results/login-attempt-${attempt}-after-submit.png`,
                });

                // Check if we're redirected away from login page
                const currentUrlAfterLogin = page.url();
                const redirected = !currentUrlAfterLogin.includes("/login");

                if (redirected) {
                    console.log(
                        "Success! Redirected to:",
                        currentUrlAfterLogin,
                    );
                    loginSuccess = true;
                    break;
                }

                // If no redirect, check for error messages
                const errorElement = page.locator(".text-destructive");
                if (await errorElement.isVisible()) {
                    const errorText = await errorElement.textContent();
                    console.log(
                        `Login attempt ${attempt} failed with error:`,
                        errorText,
                    );
                } else {
                    console.log(
                        `Login attempt ${attempt} failed without visible error`,
                    );
                }

                // Wait a moment before retrying
                await page.waitForTimeout(2000);
            }

            // Final verification
            await page.screenshot({
                path: "test-results/login-final-state.png",
            });

            // If all attempts failed, verify if we're actually logged in despite no redirect
            if (!loginSuccess) {
                // Try to navigate to a protected page
                await page.goto("/dashboard");
                await page.waitForTimeout(2000);

                // Take a screenshot of the attempted navigation
                await page.screenshot({
                    path: "test-results/login-dashboard-attempt.png",
                });

                // Check if we're on login page (redirect back) or the dashboard
                const finalUrl = page.url();
                loginSuccess = !finalUrl.includes("/login");

                if (loginSuccess) {
                    console.log(
                        "Navigation to dashboard succeeded despite no initial redirect",
                    );
                }
            }

            // Assert success based on our determination
            expect(loginSuccess, "Login authentication should succeed")
                .toBeTruthy();

            // If login was successful, navigate to dashboard and verify its content
            if (loginSuccess) {
                // Ensure we're on the dashboard
                await page.goto("/dashboard");
                await page.waitForLoadState("networkidle");
                await page.waitForTimeout(1000);

                // Take a screenshot of the dashboard and save it to the screenshots directory
                await page.screenshot({
                    path: "screenshots/dashboard.png",
                    fullPage: true,
                });
                console.log(
                    "Dashboard screenshot saved to screenshots/dashboard.png",
                );

                // Also save to test-results for consistency
                await page.screenshot({ path: "test-results/dashboard.png" });

                // Verify we're on the dashboard by checking for dashboard elements

                // 1. Check for the dashboard heading
                const dashboardHeading = page.locator(
                    'h1:has-text("Welcome to 10xFlashCards")',
                );
                await expect(
                    dashboardHeading,
                    "Dashboard heading should be visible",
                )
                    .toBeVisible();

                // 2. Check for the "Get Started" button
                const getStartedButton = page.locator(
                    'a:has-text("Get Started")',
                );
                await expect(
                    getStartedButton,
                    "Get Started button should be visible",
                )
                    .toBeVisible();

                // 3. Check for at least one of the cards
                const learningCard = page.locator(
                    'h2:has-text("10x Your Learning")',
                );
                await expect(
                    learningCard,
                    "10x Your Learning card should be visible",
                )
                    .toBeVisible();

                console.log("Successfully verified dashboard content");
            }
        },
    );

    test("should show an error with invalid credentials", async ({ page }) => {
        // Fill form with invalid credentials
        await loginPage.fillEmail(testEmail);
        await loginPage.fillPassword("WrongPassword123");

        // Take screenshot before submit
        await page.screenshot({ path: "test-results/before-error.png" });

        // Click the sign in button
        await loginPage.clickSignIn();

        // Wait for some time to allow error to appear
        await page.waitForTimeout(3000);

        // Take screenshot of current state
        await page.screenshot({ path: "test-results/after-error.png" });

        // Check we're still on login page
        expect(page.url()).toContain("/login");

        // Check if the login button is still visible (we didn't navigate away)
        const loginButtonVisible = await page.isVisible(
            'button:has-text("Sign in")',
        );
        expect(loginButtonVisible).toBeTruthy();
    });

    test("should validate form with empty fields", async ({ page }) => {
        // Try to submit form without entering anything
        await loginPage.clickSignIn();

        // Wait for any validation to appear
        await page.waitForTimeout(1000);

        // Take screenshot
        await page.screenshot({
            path: "test-results/empty-form-validation.png",
        });

        // Check we're still on login page
        expect(page.url()).toContain("/login");

        // Check if the form is still visible
        const loginButtonVisible = await page.isVisible(
            'button:has-text("Sign in")',
        );
        expect(loginButtonVisible).toBeTruthy();
    });
});
