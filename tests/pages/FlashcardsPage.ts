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
        await this.page.waitForLoadState("networkidle");
    }

    /**
     * Verify that the flashcards generation page has loaded
     */
    async expectLoaded() {
        // Verify the page title or a distinctive element
        await expect(
            this.page.locator('h1:has-text("Generate Flashcards")').first(),
        ).toBeVisible();

        // Verify textarea exists
        await expect(this.page.locator("textarea").first()).toBeVisible();

        // Use a more specific selector for the generate button
        await expect(
            this.page.getByRole("button", { name: "Generate" }).first(),
        ).toBeVisible();
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
        await this.page.locator("textarea").first().fill(text);
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
        await this.page.getByRole("button", { name: "Generate" }).first()
            .click();
    }

    /**
     * Wait for flashcards to be generated and displayed
     * Uses a simpler strategy - wait for 8 seconds then check for flashcards
     */
    async waitForFlashcards() {
        console.log("Waiting fixed 8 seconds for generation to complete...");
        await this.page.waitForTimeout(8000);

        // Use the correct selector for flashcards based on the actual HTML structure
        const flashcardSelector = 'div[data-slot="card"]';

        const count = await this.page.locator(flashcardSelector).count();
        if (count > 0) {
            console.log(
                `Found ${count} flashcards with selector: ${flashcardSelector}`,
            );
            return;
        }

        // Take a screenshot if no flashcards found for debugging
        await this.page.screenshot({
            path: "screenshots/no-flashcards-found.png",
            fullPage: true,
        });
        console.log(
            "No flashcards found. Check the screenshot to see the actual page state.",
        );
    }

    /**
     * Count the number of flashcards displayed on the page
     */
    async countFlashcards(): Promise<number> {
        // Use the correct selector for flashcards based on the actual HTML structure
        return await this.page.locator('div[data-slot="card"]').count();
    }
}
