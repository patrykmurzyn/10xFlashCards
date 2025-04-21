import { afterEach, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "@testing-library/jest-dom/vitest";

// Extend Vitest's expect method with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
    cleanup();
});

// Mock Supabase client
vi.mock("../db/supabase.client.ts", () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                    limit: vi.fn(() => ({
                        order: vi.fn(() => ({
                            data: [],
                            error: null,
                        })),
                    })),
                })),
            })),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        })),
    })),
}));
