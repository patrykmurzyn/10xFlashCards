import type { APIContext, APIRoute } from "astro";
import crypto from "crypto";

// List of endpoints that should be CSRF protected
const csrfProtectedRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
];

/**
 * Generates a CSRF token
 */
export const generateCsrfToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};

/**
 * Creates a middleware wrapper for CSRF protection
 */
export const withCsrfProtection = (handler: APIRoute): APIRoute => {
    return async (context: APIContext) => {
        const { request, cookies } = context;
        const url = new URL(request.url);

        // Skip CSRF check if not in protected routes list
        if (!csrfProtectedRoutes.includes(url.pathname)) {
            return handler(context);
        }

        // Only apply to non-GET methods (POST, PUT, DELETE, etc.)
        if (request.method === "GET") {
            return handler(context);
        }

        // For GET or HEAD requests, set the CSRF token
        if (request.method === "GET" || request.method === "HEAD") {
            const token = generateCsrfToken();

            // Store token in a HttpOnly, Secure cookie
            cookies.set("csrf_token", token, {
                httpOnly: true,
                secure: import.meta.env.PROD,
                path: "/",
                sameSite: "strict",
                maxAge: 60 * 60, // 1 hour
            });

            return handler(context);
        }

        // Validate CSRF token for other requests
        const csrfCookie = cookies.get("csrf_token")?.value;
        const csrfHeader = request.headers.get("X-CSRF-Token");
        const xRequestedWith = request.headers.get("X-Requested-With");

        // Check if the request has a valid CSRF token or is from a trusted source
        if (
            (csrfCookie && csrfHeader && csrfCookie === csrfHeader) ||
            xRequestedWith === "XMLHttpRequest"
        ) {
            return handler(context);
        }

        // If CSRF validation fails, return 403 Forbidden
        return new Response(
            JSON.stringify({ error: "CSRF token validation failed" }),
            {
                status: 403,
                headers: {
                    "Content-Type": "application/json",
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                },
            },
        );
    };
};
