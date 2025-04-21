import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

export class HomePage {
    readonly page: Page;
    readonly heading: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading = page.getByRole("heading", { level: 1 });
        this.loginButton = page.getByRole("button", { name: /login/i });
    }

    async goto() {
        await this.page.goto("/");
    }

    async expectLoaded() {
        await expect(this.heading).toBeVisible();
    }

    async clickLogin() {
        await this.loginButton.click();
    }
}
