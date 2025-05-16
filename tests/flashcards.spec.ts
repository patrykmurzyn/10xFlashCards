import { expect, test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
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

// Create a test fixture with extended timeout
const flashcardsTest = test.extend({
    page: async ({ page }, use) => {
        // Configure longer timeout for API interactions
        page.setDefaultTimeout(60000);
        await use(page);
    },
});

test.describe("Flashcards generation", () => {
    // Set a longer timeout for the entire test
    test.setTimeout(120000);

    flashcardsTest(
        "should generate flashcards after login",
        async ({ page }) => {
            // Step 1: Log in first
            const loginPage = new LoginPage(page);
            await loginPage.goto();

            // Take screenshot before login
            await page.screenshot({
                path: "screenshots/flashcards-test-login.png",
            });

            // Login with credentials from environment variables
            await page.waitForSelector("#email", { timeout: 7000 });
            await loginPage.fillEmail(testEmail);
            await page.waitForSelector("#password", { timeout: 7000 });
            await loginPage.fillPassword(testPassword);
            await page.waitForSelector('button:has-text("Sign in")', {
                timeout: 7000,
            });
            await loginPage.clickSignIn();
            await page.waitForTimeout(1500); // Allow time for submission/redirect to begin

            // Wait for successful login redirect - increase timeout in CI
            try {
                await page.waitForURL("**/dashboard", {
                    timeout: process.env.CI ? 20000 : 10000,
                });
                console.log("Successfully redirected to dashboard");
                // More robust dashboard check
                await expect(page.locator('h1:has-text("Welcome")')) // Replace with a more unique dashboard element if needed
                    .toBeVisible({ timeout: process.env.CI ? 15000 : 10000 });
                console.log("Dashboard verified after login.");

                // Important: Wait a moment to ensure the session is established
                await page.waitForTimeout(3000); // Increased wait time
            } catch (error) {
                console.error(
                    "Failed to verify dashboard after initial login. URL: " +
                        page.url(),
                    error,
                );
                // Take screenshot to see what happened
                await page.screenshot({
                    path: "screenshots/initial-login-dashboard-failure.png",
                });
                throw error; // Fail fast if dashboard isn't confirmed
            }

            // Extra check to validate dashboard content to confirm we're logged in
            try {
                // Capture dashboard state for debugging
                await page.screenshot({
                    path: "screenshots/dashboard-after-login.png",
                });
            } catch (error) {
                console.log("Error capturing dashboard screenshot", error);
            }

            // Step 2: Navigate to the flashcards generation page
            console.log("Navigating to flashcards generation page");
            const flashcardsPage = new FlashcardsPage(page);

            // Retry navigation to flashcards page up to 2 times if it fails
            let attempts = 0;
            const maxAttempts = 3;
            let success = false;

            while (attempts < maxAttempts && !success) {
                try {
                    attempts++;
                    await flashcardsPage.goto();

                    // Take screenshot of the generation page
                    await page.screenshot({
                        path:
                            `screenshots/flashcards-generate-page-attempt-${attempts}.png`,
                    });

                    // Check if we got redirected to login page or a problematic URL
                    const currentUrl = page.url();
                    if (
                        currentUrl.includes("/login?redirectTo=") ||
                        (new URL(currentUrl).pathname === "/" &&
                            !currentUrl.includes("/dashboard") &&
                            !(await page.locator(
                                'h1:has-text("Generate Flashcards")',
                            ).isVisible({ timeout: 500 })))
                    ) {
                        console.log(
                            `Redirected to login path (${currentUrl}) or root. Re-authenticating...`,
                        );

                        // Explicitly go to the root login page
                        await loginPage.goto();
                        await page.waitForLoadState("networkidle");

                        // Re-login
                        await loginPage.fillEmail(testEmail);
                        await loginPage.fillPassword(testPassword);
                        await loginPage.clickSignIn();

                        // Wait for dashboard
                        await page.waitForURL("**/dashboard", {
                            timeout: process.env.CI ? 20000 : 10000,
                        });
                        console.log("Re-authenticated successfully");

                        // Try going to flashcards page again after re-login
                        await page.waitForTimeout(2000);
                        await flashcardsPage.goto();

                        await page.screenshot({
                            path:
                                `screenshots/flashcards-page-after-relogin-${attempts}.png`,
                        });
                    }

                    // Verify the page loaded correctly with proper timeout
                    await flashcardsPage.expectLoaded();
                    console.log(
                        "Flashcards generation page loaded successfully",
                    );
                    success = true;
                } catch (error) {
                    console.log(
                        `Failed to load flashcards page on attempt ${attempts}/${maxAttempts}`,
                    );
                    if (attempts >= maxAttempts) {
                        console.error(
                            "All attempts to load flashcards page failed",
                        );
                        throw error;
                    }

                    // Wait a bit before trying again
                    await page.waitForTimeout(2000);

                    // Going back to dashboard and trying again - make sure we're still authenticated
                    console.log(
                        "Navigating back to dashboard and trying again",
                    );
                    await page.goto("/dashboard");
                    await page.waitForLoadState("networkidle");

                    // Capture dashboard state
                    await page.screenshot({
                        path:
                            `screenshots/dashboard-before-retry-${attempts}.png`,
                    });

                    // Make sure we're still on dashboard (still logged in)
                    const currentUrlDashboardCheck = page.url();
                    if (
                        currentUrlDashboardCheck.includes(
                            "/login?redirectTo=",
                        ) ||
                        (new URL(currentUrlDashboardCheck).pathname === "/" &&
                            !currentUrlDashboardCheck.includes("/dashboard"))
                    ) {
                        console.log(
                            `Redirected to login (${currentUrlDashboardCheck}) again before retry. Re-authenticating...`,
                        );
                        await loginPage.goto(); // Go to root for login
                        await page.waitForLoadState("networkidle");
                        await loginPage.fillEmail(testEmail);
                        await loginPage.fillPassword(testPassword);
                    }
                }
            }

            // Step 4: Generate text and fill the textarea
            const testText = flashcardsPage.generateText(1200); // Generate a bit more than required
            await flashcardsPage.fillTextArea(testText);
            console.log("Text area filled with test content");

            // Step 5: Set number of flashcards to 10 (default)
            await flashcardsPage.setNumberOfFlashcards(10);
            console.log("Set number of flashcards to 10");

            // Take screenshot before generating
            await page.screenshot({
                path: "screenshots/flashcards-before-generate.png",
            });

            // Step 6: Click Generate
            console.log("Clicking Generate button");
            await flashcardsPage.clickGenerate();

            // Step 7: Wait for flashcards to be generated
            console.log("Waiting for flashcards to be generated...");
            await flashcardsPage.waitForFlashcards();

            // Take screenshot after generation
            await page.screenshot({
                path: "screenshots/flashcards-generated.png",
                fullPage: true,
            });

            // Step 8: Count the flashcards and verify there are 10
            const count = await flashcardsPage.countFlashcards();
            console.log(`Generated ${count} flashcards`);

            // Assert that we have 10 flashcards
            expect(count, "Should generate 10 flashcards").toBe(10);
        },
    );
});
