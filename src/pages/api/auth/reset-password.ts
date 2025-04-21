import type { APIRoute } from "astro";
import { z } from "zod";
import { withCsrfProtection } from "../../../middleware/csrf";

const ResetPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export const prerender = false;

const resetPasswordHandler: APIRoute = async ({ request, locals }) => {
    // Ensure locals.supabase exists
    if (!locals.supabase) {
        console.error(
            "[API /reset-password] Supabase client not found in locals.",
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

    const validation = ResetPasswordSchema.safeParse(body);

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

    const { email } = validation.data;
    const { supabase } = locals;

    console.log(
        `[API /reset-password] Sending password reset email for: ${email}`,
    );

    // Determine the application URL from the request
    const requestUrl = new URL(request.url);
    const appBaseUrl = `${requestUrl.protocol}//${requestUrl.hostname}:4321`;
    const redirectUrl = `${appBaseUrl}/reset-password`;

    console.log(
        `[API /reset-password] Setting redirect URL to: ${redirectUrl}`,
    );

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });

        if (error) {
            console.error(
                `[API /reset-password] Supabase auth error for ${email}:`,
                error.message,
            );

            return new Response(
                JSON.stringify({
                    error: error.message ||
                        "Failed to send password reset email",
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
            `[API /reset-password] Successfully sent password reset email to: ${email}`,
        );

        return new Response(
            JSON.stringify({
                message: "Password reset email sent successfully",
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
            "[API /reset-password] Unexpected error:",
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
export const POST = withCsrfProtection(resetPasswordHandler);
