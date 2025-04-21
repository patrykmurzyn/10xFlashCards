import type { APIRoute } from "astro";
import { withCsrfProtection } from "../../../middleware/csrf";

export const prerender = false; // Ensure this API route is server-rendered

const logoutHandler: APIRoute = async ({ locals, redirect }) => {
    // Ensure locals.supabase exists (should be set by middleware)
    if (!locals.supabase) {
        console.error("[API /logout] Supabase client not found in locals.");
        return new Response(
            JSON.stringify({
                error: "Internal server error: Supabase client missing",
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                    "Content-Security-Policy": "default-src 'self'",
                    "Cache-Control": "no-store, max-age=0",
                },
            },
        );
    }

    const { supabase } = locals;

    try {
        console.log("[API /logout] Attempting server-side sign out.");

        const { error } = await supabase.auth.signOut();

        if (error) {
            // Log the error but still redirect to login
            console.error(
                "[API /logout] Supabase sign out error:",
                error.message,
            );

            return new Response(
                JSON.stringify({ error: "Logout failed. Please try again." }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Content-Type-Options": "nosniff",
                        "X-Frame-Options": "DENY",
                        "Cache-Control": "no-store, max-age=0",
                    },
                },
            );
        } else {
            console.log("[API /logout] Supabase sign out successful.");
        }

        // Rely on supabase.auth.signOut() with the SSR client to handle cookie removal
        console.log("[API /logout] Redirecting to /login.");

        // Redirect to login page after sign out attempt
        return redirect("/login", 303); // Use 303 See Other for redirects after POST
    } catch (unexpectedError) {
        console.error("[API /logout] Unexpected error:", unexpectedError);

        return new Response(
            JSON.stringify({
                error: "An unexpected error occurred during logout",
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                },
            },
        );
    }
};

// Apply CSRF protection to logout handler
export const POST = withCsrfProtection(logoutHandler);
