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
            await loginPage.fillEmail(testEmail);
            await loginPage.fillPassword(testPassword);
            await loginPage.clickSignIn();

            // Wait for successful login redirect
            try {
                await page.waitForURL("**/dashboard", { timeout: 10000 });
                console.log("Successfully redirected to dashboard");
            } catch (error) {
                console.log(
                    "Timeout waiting for dashboard redirect, continuing anyway",
                );
                // Take screenshot to see what happened
                await page.screenshot({
                    path: "screenshots/login-redirect-timeout.png",
                });
            }

            // Verify we're logged in
            try {
                await expect(page.locator('h1:has-text("Welcome")'))
                    .toBeVisible({ timeout: 5000 });
                console.log("Successfully verified login");
            } catch (error) {
                console.log(
                    "Could not verify login with welcome message, continuing with test",
                );
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

                    // Going back to dashboard and trying again
                    console.log(
                        "Navigating back to dashboard and trying again",
                    );
                    await page.goto("/dashboard");
                    await page.waitForLoadState("networkidle");
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
