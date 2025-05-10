import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export class LoginPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto() {
        await this.page.goto("/login");
    }

    async fillEmail(email: string) {
        await this.page.fill("#email", email);
    }

    async fillPassword(password: string) {
        await this.page.fill("#password", password);
    }

    async clickSignIn() {
        await this.page.click('button:has-text("Sign in")');
    }

    async login(email: string, password: string) {
        await this.fillEmail(email);
        await this.fillPassword(password);
        await this.clickSignIn();
    }

    async getGeneralError() {
        const errorElement = this.page.locator('div[role="alert"]:not([id])');
        if (await errorElement.isVisible()) {
            return errorElement.textContent();
        }
        return null;
    }

    async getFieldError(fieldId: string) {
        const errorElement = this.page.locator(`#${fieldId}-error`);
        if (await errorElement.isVisible()) {
            return errorElement.textContent();
        }
        return null;
    }

    async waitForDashboardRedirect() {
        await this.page.waitForURL("**/dashboard");
    }

    async expectGeneralError(expectedMessage: string) {
        const errorElement = this.page.locator('div[role="alert"]:not([id])');
        await expect(errorElement).toBeVisible({ timeout: 10000 });
        await expect(errorElement).toContainText(expectedMessage);
    }

    async expectFieldErrorVisible(fieldId: string) {
        const errorElement = this.page.locator(`#${fieldId}-error`);
        await expect(errorElement).toBeVisible({ timeout: 5000 });
    }

    async expectAnyValidationErrorVisible() {
        const errorElements = this.page.locator(
            '.text-destructive[role="alert"]',
        );
        const count = await errorElements.count();
        expect(count).toBeGreaterThan(0);
    }
}
