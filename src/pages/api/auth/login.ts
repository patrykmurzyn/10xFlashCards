import type { APIRoute } from "astro";
import { z } from "zod";
import { withCsrfProtection } from "../../../middleware/csrf";

const LoginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

export const prerender = false; // Ensure this API route is server-rendered

const loginHandler: APIRoute = async ({ request, locals }) => {
    // Ensure locals.supabase exists (should be set by middleware)
    if (!locals.supabase) {
        console.error("[API /login] Supabase client not found in locals.");
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

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
            },
        });
    }

    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
        return new Response(
            JSON.stringify({
                error: "Invalid input",
                details: validation.error.flatten(),
            }),
            {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                },
            },
        );
    }

    const { email, password } = validation.data;
    const { supabase } = locals;

    console.log(`[API /login] Attempting login for: ${email}`);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error(
                `[API /login] Supabase auth error for ${email}:`,
                error.message,
            );

            // Determine error type and provide appropriate message
            let statusCode = 401;
            let errorMessage = "Invalid login credentials";

            if (error.message.includes("Email not confirmed")) {
                errorMessage = "Please confirm your email before logging in";
                statusCode = 403;
            } else if (error.message.includes("rate limit")) {
                errorMessage = "Too many attempts. Please try again later";
                statusCode = 429;
            }

            return new Response(
                JSON.stringify({ error: errorMessage }),
                {
                    status: statusCode,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Content-Type-Options": "nosniff",
                        "X-Frame-Options": "DENY",
                    },
                },
            );
        }

        console.log(`[API /login] Login successful for: ${email}`);

        return new Response(
            JSON.stringify({
                message: "Login successful",
                user: data.user,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                    "Cache-Control": "no-store, max-age=0",
                },
            },
        );
    } catch (unexpectedError) {
        console.error("[API /login] Unexpected error:", unexpectedError);

        return new Response(
            JSON.stringify({ error: "An unexpected error occurred" }),
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

// Apply CSRF protection to login handler
export const POST = withCsrfProtection(loginHandler);
