import { defineMiddleware } from "astro:middleware";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { Database } from "@/db/database.types";
import type { Session, User } from "@supabase/supabase-js";

// Extend the Astro Locals interface
declare global {
    namespace App {
        interface Locals {
            supabase: ReturnType<typeof createServerClient<Database>>;
            session: Session | null;
            user: User | null;
            authError?: boolean;
        }
    }
}

// Define routes that require authentication
const protectedRoutes = ["/dashboard", "/flashcards", "/session", "/profile"];
// Define routes related to authentication (login/register pages)
const authRoutes = ["/login", "/register"];
// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export const onRequest = defineMiddleware(async (context, next) => {
    const { cookies, redirect, url, locals } = context;

    // Create a Supabase client specific to this server request
    try {
        const supabase = createServerClient<Database>(
            import.meta.env.PUBLIC_SUPABASE_URL!,
            import.meta.env.PUBLIC_SUPABASE_KEY!,
            {
                cookies: {
                    get(key: string) {
                        return cookies.get(key)?.value;
                    },
                    set(key: string, value: string, options: CookieOptions) {
                        cookies.set(key, value, options);
                    },
                    remove(key: string, options: CookieOptions) {
                        cookies.delete(key, options);
                    },
                },
            },
        );

        // Make the Supabase client available in subsequent Astro components/endpoints
        locals.supabase = supabase;

        // Retrieve the current user information by verifying the session with Supabase
        const { data, error: getUserError } = await supabase.auth.getUser();

        // We need the session for expiry tracking, but we'll use the user from getUser() for authentication
        const { data: sessionData } = await supabase.auth.getSession();

        const user = data?.user || null;
        const session = sessionData?.session || null;

        // Add session to locals for components to access
        locals.session = session;
        locals.user = user;

        // Check for session timeout if we have a session
        if (session) {
            // Check if session is about to expire and refresh if needed
            const expiresAt = session.expires_at
                ? session.expires_at * 1000
                : 0;
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            // If session is about to expire in the next 5 minutes, refresh it
            if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
                console.log("[Middleware] Session about to expire, refreshing");
                try {
                    const { data: refreshData, error: refreshError } =
                        await supabase.auth.refreshSession();
                    if (refreshError) {
                        console.error(
                            "[Middleware] Error refreshing session:",
                            refreshError.message,
                        );
                    } else if (refreshData.session) {
                        console.log(
                            "[Middleware] Session refreshed successfully",
                        );
                        locals.session = refreshData.session;
                        locals.user = refreshData.user;
                    }
                } catch (refreshException) {
                    console.error(
                        "[Middleware] Exception refreshing session:",
                        refreshException,
                    );
                }
            }
        }

        if (getUserError) {
            // Log the error but potentially allow guests through depending on the route
            console.error(
                "[Middleware] Error fetching user:",
                getUserError.message,
            );
            // Handle specific error cases
            if (getUserError.message.includes("JWT expired")) {
                console.log("[Middleware] JWT expired, clearing session");
                // Attempt to sign out to clear cookies
                await supabase.auth.signOut();
            }
        }

        const currentPath = url.pathname;

        // --- Route Protection Logic ---

        // 1. Redirect logged-out users (user object is null or getUser failed) trying to access protected routes
        if (
            !user &&
            protectedRoutes.some((path) => currentPath.startsWith(path))
        ) {
            console.log(
                `[Middleware] Unauthorized access attempt to ${currentPath}. Redirecting to /login.`,
            );
            // Preserve the intended destination in the query params for redirection after login
            const redirectTo = url.pathname + url.search;
            return redirect(
                `/login?redirectTo=${encodeURIComponent(redirectTo)}`,
                303,
            ); // Use 303 See Other for POST redirects
        }

        // 2. Redirect logged-in users (user object exists) trying to access auth routes (e.g., /login)
        if (user && authRoutes.some((path) => currentPath.startsWith(path))) {
            console.log(
                `[Middleware] Authenticated user accessing ${currentPath}. Redirecting to /dashboard.`,
            );
            // Redirect to a default page for authenticated users
            return redirect("/dashboard", 303);
        }

        // --- Continue to the requested page ---
        console.log(
            `[Middleware] Allowing access to ${currentPath}. User: ${
                user ? user.id : "Guest"
            }`,
        );

        return next();
    } catch (error) {
        console.error("[Middleware] Unexpected error:", error);

        // If we can't initialize Supabase client or have a critical error
        // Allow public routes but block protected routes
        const currentPath = url.pathname;

        if (protectedRoutes.some((path) => currentPath.startsWith(path))) {
            console.log(
                `[Middleware] Error state - blocking access to protected route ${currentPath}`,
            );
            return redirect("/login?error=session_error", 303);
        }

        // Add error flag to locals
        locals.authError = true;

        return next();
    }
});
