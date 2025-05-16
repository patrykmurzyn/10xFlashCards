import { expect, type Page } from "@playwright/test";

export class FlashcardsPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigate to the flashcards generation page
     */
    async goto() {
        await this.page.goto("/flashcards/generate");
        // Wait for both DOM content loaded and network idle
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("networkidle", { timeout: 30000 });

        // Check if we were redirected to login (which is now the root '/' path)
        // A more robust check would be to see if login form elements are present.
        // For now, we'll assume if we are at '/' after trying to go to '/flashcards/generate',
        // it's a redirect to login.
        if (new URL(this.page.url()).pathname === "/") {
            console.log(
                "Warning: Potentially redirected to login page (root path) from flashcards/generate",
            );
        }
    }

    /**
     * Verify that the flashcards generation page has loaded
     */
    async expectLoaded() {
        try {
            // First check current URL to see if we're on the correct page
            const currentUrl = this.page.url();
            console.log(`Current URL during expectLoaded: ${currentUrl}`);

            if (currentUrl.includes("/login?redirectTo=")) {
                // This means we were redirected to a /login path that likely 404s,
                // because the actual login is at '/'.
                throw new Error(
                    `Authentication issue: Redirected to "${currentUrl}" when expecting /flashcards/generate. The server should redirect to "/?redirectTo=..."`,
                );
            }

            // If the current URL is the root path, and we expect to be on /flashcards/generate, this is an issue.
            if (
                new URL(currentUrl).pathname === "/" &&
                !currentUrl.includes("/flashcards/generate")
            ) {
                const isLoginPage = await this.page.locator(
                    'form button:has-text("Sign in")',
                ).isVisible({ timeout: 1000 });
                if (isLoginPage) {
                    throw new Error(
                        "Authentication issue: Redirected to root login page when expecting /flashcards/generate. Current URL: " +
                            currentUrl,
                    );
                } else {
                    throw new Error(
                        "Navigation issue: On root page, but it does not appear to be the login page. Expected /flashcards/generate. Current URL: " +
                            currentUrl,
                    );
                }
            }

            // Add alternate heading check for CI environment
            const headingSelectors = [
                'h1:has-text("Generate Flashcards")',
                'text="Generate Flashcards"',
                '[data-test-id="generate-flashcards-heading"]',
                "h1",
            ];

            // Try multiple selectors to find the heading
            let foundHeading = false;
            for (const selector of headingSelectors) {
                try {
                    // Wait with shorter timeout for each selector attempt
                    await this.page.waitForSelector(selector, {
                        state: "attached",
                        timeout: 5000,
                    });
                    console.log(`Found heading with selector: ${selector}`);
                    foundHeading = true;
                    break;
                } catch (error) {
                    console.log(
                        `Selector ${selector} not found, trying next...`,
                    );
                }
            }

            if (!foundHeading) {
                // If we didn't find any heading, use the original selector with full timeout
                await this.page.waitForSelector(
                    'h1:has-text("Generate Flashcards")',
                    {
                        state: "attached",
                        timeout: process.env.CI ? 10000 : 5000,
                    },
                );
            }

            // Look for textarea as alternative verification
            if (await this.page.locator("textarea").first().count() > 0) {
                console.log(
                    "Found textarea element, page appears to be loaded",
                );
            }

            // Now verify visibility with increased timeout
            await expect(
                this.page.locator('h1:has-text("Generate Flashcards")').first(),
            ).toBeVisible({ timeout: process.env.CI ? 10000 : 5000 });

            // Verify textarea exists using the more specific selector
            await expect(
                this.page.locator('textarea[aria-label="Source Text"]').first(),
            )
                .toBeVisible({ timeout: process.env.CI ? 10000 : 5000 });

            // Use a more specific selector for the generate button
            await expect(
                this.page.getByRole("button", { name: "Generate" }).filter({
                    hasNotText: "Suggestions",
                }).first(),
            ).toBeVisible({ timeout: process.env.CI ? 10000 : 5000 });

            console.log("All page elements verified successfully");
        } catch (error) {
            console.error("Error verifying page elements:", error);

            // Take a screenshot for debugging
            await this.page.screenshot({
                path: "screenshots/flashcards-page-error.png",
                fullPage: true,
            });

            // Check URL to ensure we're on the right page
            const url = this.page.url();
            console.log(`Current URL: ${url}`);

            // Dump HTML source for debugging
            const content = await this.page.content();
            console.log(
                `Page content (first 500 chars): ${content.substring(0, 500)}`,
            );

            // Rethrow the error to fail the test
            throw error;
        }
    }

    /**
     * Generate random text with a minimum length
     */
    generateText(minLength: number): string {
        const paragraphs = [
            "The human brain is an incredible organ, capable of storing approximately 2.5 petabytes of information. This vast capacity allows us to retain countless memories, skills, and knowledge throughout our lifetime. Learning through spaced repetition and active recall has been proven to significantly enhance memory retention.",
            "Flashcards are an effective study tool because they promote active recall, which strengthens neural connections in the brain. By forcing yourself to remember information rather than simply reviewing it, you create stronger memory pathways. This method, known as retrieval practice, has been shown to be more effective than passive studying techniques.",
            "The spacing effect, discovered by Hermann Ebbinghaus in the 19th century, demonstrates that learning is more effective when study sessions are spaced out over time. This principle is the foundation of spaced repetition systems, which optimize the timing of reviews to maximize long-term retention while minimizing study time.",
            "Artificial intelligence has revolutionized many aspects of education, including personalized learning. AI systems can analyze learning patterns, identify knowledge gaps, and adjust content difficulty to suit individual needs. These technologies have made educational tools more efficient and accessible to learners worldwide.",
            "Modern flashcard applications use algorithms based on research in cognitive psychology to schedule reviews at optimal intervals. The SuperMemo algorithm, for example, uses a mathematical model to predict memory decay and determine when a flashcard should be reviewed to maximize retention with minimal review sessions.",
            "Deep learning, a subset of machine learning, has enabled significant advances in natural language processing. These technologies can now understand context, generate human-like text, and even create educational content automatically. This has opened new possibilities for creating study materials that adapt to learners' needs.",
        ];

        let result = "";
        while (result.length < minLength) {
            // Add paragraphs randomly until we reach the minimum length
            const randomIndex = Math.floor(Math.random() * paragraphs.length);
            result += paragraphs[randomIndex] + " ";
        }

        return result;
    }

    /**
     * Fill the textarea with the provided text
     */
    async fillTextArea(text: string) {
        await this.page.locator('textarea[aria-label="Source Text"]').first()
            .fill(text);
        // Wait a moment for character counter to update
        await this.page.waitForTimeout(500);
    }

    /**
     * Set the number of flashcards to generate
     */
    async setNumberOfFlashcards(count: number) {
        // Find the number input for flashcard count
        const numberInput = this.page.locator('input[type="number"]').first();
        await numberInput.fill(count.toString());
    }

    /**
     * Click the generate button to start flashcard generation
     */
    async clickGenerate() {
        // Using the same specific selector as in expectLoaded
        await this.page.getByRole("button", { name: "Generate" }).filter({
            hasNotText: "Suggestions",
        }).first()
            .click();
    }

    /**
     * Wait for flashcards to be generated and displayed
     * Uses a simpler strategy - wait for 8 seconds then check for flashcards
     */
    async waitForFlashcards() {
        const waitTime = process.env.CI ? 15000 : 8000;
        console.log(
            `Waiting ${waitTime / 1000} seconds for generation to complete...`,
        );
        await this.page.waitForTimeout(waitTime);

        // Use the correct selector for flashcards based on the actual HTML structure
        const flashcardSelector = 'div[data-slot="card"]';

        try {
            // First wait for at least one card to appear
            await this.page.waitForSelector(flashcardSelector, {
                timeout: process.env.CI ? 10000 : 5000,
            });

            const count = await this.page.locator(flashcardSelector).count();
            if (count > 0) {
                console.log(
                    `Found ${count} flashcards with selector: ${flashcardSelector}`,
                );
                return;
            }
        } catch (error) {
            console.error("Error waiting for flashcards:", error);

            // Take a screenshot if no flashcards found for debugging
            await this.page.screenshot({
                path: "screenshots/no-flashcards-found.png",
                fullPage: true,
            });
            console.log(
                "No flashcards found. Check the screenshot to see the actual page state.",
            );
            throw error;
        }
    }

    /**
     * Count the number of flashcards displayed on the page
     */
    async countFlashcards(): Promise<number> {
        // Use the correct selector for flashcards based on the actual HTML structure
        return await this.page.locator('div[data-slot="card"]').count();
    }
}
