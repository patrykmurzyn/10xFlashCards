import type { APIRoute } from "astro";
import { z } from "zod";
import { withCsrfProtection } from "../../../middleware/csrf";

const ResendVerificationSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    type: z.enum(["signup", "email_change"]),
});

export const prerender = false;

const resendVerificationHandler: APIRoute = async ({ request, locals }) => {
    // Ensure locals.supabase exists
    if (!locals.supabase) {
        console.error(
            "[API /resend-verification] Supabase client not found in locals.",
        );
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

    const validation = ResendVerificationSchema.safeParse(body);

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

    const { email, type } = validation.data;
    const { supabase } = locals;

    console.log(
        `[API /resend-verification] Resending ${type} email for: ${email}`,
    );

    // Determine the application URL from the request
    const requestUrl = new URL(request.url);
    const appBaseUrl = `${requestUrl.protocol}//${requestUrl.hostname}:4321`;
    const redirectUrl = `${appBaseUrl}/login?verification=success`;

    console.log(
        `[API /resend-verification] Setting redirect URL to: ${redirectUrl}`,
    );

    try {
        const { error } = await supabase.auth.resend({
            type,
            email,
            options: {
                emailRedirectTo: redirectUrl,
            },
        });

        if (error) {
            console.error(
                `[API /resend-verification] Supabase auth error for ${email}:`,
                error.message,
            );

            return new Response(
                JSON.stringify({
                    error: error.message ||
                        "Failed to resend verification email",
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

        console.log(
            `[API /resend-verification] Successfully resent verification email to: ${email}`,
        );

        return new Response(
            JSON.stringify({
                message: "Verification email resent successfully",
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
        console.error(
            "[API /resend-verification] Unexpected error:",
            unexpectedError,
        );

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

// Apply CSRF protection to the handler
export const POST = withCsrfProtection(resendVerificationHandler);
