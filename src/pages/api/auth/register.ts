import type { APIRoute } from "astro";
import { z } from "zod";
import { withCsrfProtection } from "../../../middleware/csrf";

const RegisterSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const prerender = false;

const registerHandler: APIRoute = async ({ request, locals }) => {
    // Ensure locals.supabase exists
    if (!locals.supabase) {
        console.error("[API /register] Supabase client not found in locals.");
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

    const validation = RegisterSchema.safeParse(body);

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

    console.log(`[API /register] Attempting registration for: ${email}`);

    // Determine the application URL from the request
    const requestUrl = new URL(request.url);
    const appBaseUrl = `${requestUrl.protocol}//${requestUrl.hostname}:4321`;
    const redirectUrl = `${appBaseUrl}/login?verification=success`;

    console.log(`[API /register] Setting redirect URL to: ${redirectUrl}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: redirectUrl,
        },
    });

    if (error) {
        console.error(
            `[API /register] Supabase auth error for ${email}:`,
            error.message,
        );

        return new Response(
            JSON.stringify({
                error: error.message || "Registration failed",
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

    console.log(`[API /register] Registration successful for: ${email}`);

    return new Response(
        JSON.stringify({
            message: "Registration successful",
            user: data.user,
            needsEmailConfirmation: data.user?.identities?.length === 0 ||
                data.user?.email_confirmed_at === null,
            redirectUrl: redirectUrl, // Include the redirect URL in the response
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
};

// Apply CSRF protection to register handler
export const POST = withCsrfProtection(registerHandler);
