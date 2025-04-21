# Supabase Auth Documentation

This document provides a concise overview of the Supabase Auth API methods.

## Authentication Methods

### `signUp(credentials)`

Creates a new user. Requires email verification by default unless disabled in project settings.

**Parameters:**

- `credentials`: (Required) Object - Contains `email`, `password`, and optional `options` (like `data` for user metadata, `emailRedirectTo`).

**Returns:** `Promise<{ data: { user: User | null, session: Session | null }, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.signUp({
  email: "example@email.com",
  password: "example-password",
  options: {
    emailRedirectTo: "https://example.com/welcome",
    data: { full_name: "Example User" },
  },
});
```

### `signInWithPassword(credentials)`

Logs in an existing user with email/password or phone/password.

**Parameters:**

- `credentials`: (Required) Object - Contains `email` or `phone`, and `password`. Optional `options` (like `captchaToken`).

**Returns:** `Promise<{ data: { user: User, session: Session }, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "example@email.com",
  password: "example-password",
});
```

### `signInAnonymously(credentials?)`

Creates and signs in a new anonymous user. Captcha recommended.

**Parameters:**

- `credentials`: (Optional) Object - Contains `options` (like `captchaToken`, `data` for user metadata).

**Returns:** `Promise<{ data: { user: User, session: Session }, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.signInAnonymously({
  options: {
    data: { is_guest: true },
  },
});
```

### `signInWithIdToken(credentials)`

Signs in a user using an OIDC ID token from an enabled provider.

**Parameters:**

- `credentials`: (Required) Object - Contains `provider` (e.g., 'google'), `token` (the ID token), and optional `options` (like `captchaToken`, `nonce`).

**Returns:** `Promise<{ data: { user: User, session: Session }, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.signInWithIdToken({
  provider: "google",
  token: "your-id-token",
});
```

### `signInWithOtp(credentials)`

Logs in or signs up a user via magic link (email) or OTP (email/phone).

**Parameters:**

- `credentials`: (Required) Object - Contains `email` or `phone`, and optional `options` (like `shouldCreateUser`, `emailRedirectTo`, `data`, `captchaToken`).

**Returns:** `Promise<{ data: { user: null, session: null }, error: AuthError | null }>` (User/session returned after OTP/link verification)

**Example:**

```javascript
const { data, error } = await supabase.auth.signInWithOtp({
  email: "example@email.com",
  options: {
    emailRedirectTo: "https://example.com/welcome",
  },
});
```

### `signInWithOAuth(credentials)`

Logs in a user via a third-party OAuth provider (supports PKCE).

**Parameters:**

- `credentials`: (Required) Object - Contains `provider` (e.g., 'github'), and optional `options` (like `redirectTo`, `scopes`, `queryParams`).

**Returns:** `Promise<{ data: { provider: Provider, url: string | null }, error: AuthError | null }>` (Redirects user or returns URL)

**Example:**

```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "github",
  options: {
    redirectTo: "http://localhost:3000/auth/callback",
  },
});
```

### `signInWithSSO(params)`

Attempts sign-in via an enterprise Identity Provider (redirects user). Requires prior IdP setup.

**Parameters:**

- `params`: (Required) Object - Contains either `providerId` (UUID) or `domain` (associated email domain). Optional `options` (like `redirectTo`, `captchaToken`).

**Returns:** `Promise<{ data: { providerId: string, url: string }, error: AuthError | null }>` (Returns redirect URL)

**Example (using domain):**

```javascript
const { data, error } = await supabase.auth.signInWithSSO({
  domain: "company.com",
});
if (data?.url) {
  window.location.href = data.url;
}
```

### `signOut(options?)`

Logs out the user, removing the session from storage. Invalidates refresh tokens.

**Parameters:**

- `options`: (Optional) Object - Contains `scope` ('global' or 'local'). Defaults to 'global'.

**Returns:** `Promise<{ error: AuthError | null }>`

**Example:**

```javascript
const { error } = await supabase.auth.signOut();
```

### `verifyOtp(params)`

Verifies an OTP or token hash for various auth flows (signup, login, recovery, email/phone change).

**Parameters:**

- `params`: (Required) Object - Contains `type` (e.g., 'email', 'sms', 'recovery', 'invite', 'email_change', 'phone_change'), `token` or `token_hash`, and `email` or `phone`. Optional `options` (like `redirectTo`, `captchaToken`).

**Returns:** `Promise<{ data: { user: User, session: Session }, error: AuthError | null }>` (On successful verification)

**Example (Email OTP):**

```javascript
const { data, error } = await supabase.auth.verifyOtp({
  email: "user@example.com",
  token: "123456",
  type: "email",
});
```

### `resetPasswordForEmail(email, options?)`

Sends a password reset link to the user's email (supports PKCE).

**Parameters:**

- `email`: (Required) String - The user's email address.
- `options`: (Optional) Object - Contains `redirectTo`, `captchaToken`.

**Returns:** `Promise<{ data: {}, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  "user@example.com",
  {
    redirectTo: "https://example.com/update-password",
  }
);
```

(User needs to click link, then call `updateUser` with new password)

### `updateUser(attributes, options?)`

Updates data for the currently logged-in user (e.g., email, password, metadata).

**Parameters:**

- `attributes`: (Required) Object - User attributes to update (e.g., `email`, `password`, `phone`, `data`).
- `options`: (Optional) Object - Contains `emailRedirectTo`, `nonce` (for secure password update).

**Returns:** `Promise<{ data: { user: User }, error: AuthError | null }>`

**Example (Update password):**

```javascript
const { data, error } = await supabase.auth.updateUser({
  password: "new-secure-password",
});
```

### `resend(credentials)`

Resends confirmation/OTP emails or SMS for signup, email change, or phone change.

**Parameters:**

- `credentials`: (Required) Object - Contains `type` ('signup', 'email_change', 'phone_change'), `email` or `phone`, and optional `options` (`emailRedirectTo`, `captchaToken`).

**Returns:** `Promise<{ data: { user: null, session: null }, error: AuthError | null }>`

**Example (Resend signup email):**

```javascript
const { error } = await supabase.auth.resend({
  type: "signup",
  email: "email@example.com",
  options: {
    emailRedirectTo: "https://example.com/welcome",
  },
});
```

### `reauthenticate()`

Sends a reauthentication OTP (nonce) via email/phone. Used for secure actions like password change if enabled.

**Returns:** `Promise<{ data: {}, error: AuthError | null }>`

**Example:**

```javascript
// Call this before updating password if secure password change is enabled
const { error } = await supabase.auth.reauthenticate();
// User receives nonce, then call updateUser with password and the nonce
```

## Session Management

### `getSession()`

Retrieves the current session from local storage. Refreshes if the access token is expired using the refresh token.

**Returns:** `Promise<{ data: { session: Session | null }, error: AuthError | null }>`

**Example:**

```javascript
const {
  data: { session },
  error,
} = await supabase.auth.getSession();
```

### `refreshSession(currentSession?)`

Forces a refresh of the session using the refresh token, returning a new session regardless of expiry.

**Parameters:**

- `currentSession`: (Optional) Object - A session object containing at least a `refresh_token`. If omitted, uses the session from `getSession()`.

**Returns:** `Promise<{ data: { user: User | null, session: Session | null }, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.refreshSession();
```

### `setSession(currentSession)`

Sets the active session using provided tokens. Emits `SIGNED_IN`. Refreshes if needed.

**Parameters:**

- `currentSession`: (Required) Object - Must contain `access_token` and `refresh_token`.

**Returns:** `Promise<{ data: { user: User | null, session: Session | null }, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.setSession({
  access_token: "valid-access-token",
  refresh_token: "valid-refresh-token",
});
```

### `exchangeCodeForSession(authCode)`

Exchanges an authorization code (from PKCE flow) for a session. Used with `flowType: 'pkce'`.

**Parameters:**

- `authCode`: (Required) String - The authorization code from the redirect.

**Returns:** `Promise<{ data: { session: Session, user: User, provider?: Provider }, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.exchangeCodeForSession(
  "auth-code-from-url"
);
```

## User Management

### `getUser(jwt?)`

Fetches the current user's details from the server, validating the JWT. Use this for server-side authorization checks.

**Parameters:**

- `jwt`: (Optional) String - An access token JWT. If omitted, uses the current session's token.

**Returns:** `Promise<{ data: { user: User | null }, error: AuthError | null }>`

**Example:**

```javascript
// On server or client
const {
  data: { user },
  error,
} = await supabase.auth.getUser(); // Uses session JWT
// Or on server with provided JWT
// const { data: { user }, error } = await supabase.auth.getUser(accessToken)
```

### `getUserIdentities()`

Gets all identities (OAuth, email, phone) linked to the currently signed-in user.

**Returns:** `Promise<{ data: { identities: UserIdentity[] | null }, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.getUserIdentities();
if (data?.identities) {
  console.log(data.identities);
}
```

### `linkIdentity(credentials)`

Links an additional OAuth identity to the currently signed-in user (PKCE supported). Requires manual linking enabled.

**Parameters:**

- `credentials`: (Required) Object - Same as `signInWithOAuth` credentials (provider, options).

**Returns:** `Promise<{ data: { provider: Provider, url: string | null }, error: AuthError | null }>` (Redirects user or returns URL)

**Example:**

```javascript
const { data, error } = await supabase.auth.linkIdentity({
  provider: "google",
});
```

### `unlinkIdentity(identity)`

Unlinks an identity from the user. Requires manual linking enabled and at least 2 identities.

**Parameters:**

- `identity`: (Required) Object - An `UserIdentity` object (e.g., obtained from `getUserIdentities`).

**Returns:** `Promise<{ error: AuthError | null }>`

**Example:**

```javascript
// Assuming 'googleIdentity' is a UserIdentity object for Google
const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
```

## Event Handling

### `onAuthStateChange(callback)`

Subscribes to authentication state changes (e.g., `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`, `PASSWORD_RECOVERY`).

**Parameters:**

- `callback`: (Required) Function - `(event: AuthChangeEvent, session: Session | null) => void`. Called on auth events.

**Returns:** `{ data: { subscription: Subscription } }` - Object containing the subscription to unsubscribe later.

**Example:**

```javascript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session);
  // Handle different events like SIGNED_IN, SIGNED_OUT
});

// To stop listening:
subscription.unsubscribe();
```

## Multi-Factor Authentication (MFA - `supabase.auth.mfa`)

### `enroll(params)`

Starts the enrollment process for a new MFA factor (TOTP or phone). Creates an unverified factor.

**Parameters:**

- `params`: (Required) Object - Contains `factorType` ('totp' or 'phone'), optional `friendlyName`, `issuer`, `phone`.

**Returns:** `Promise<{ data: Enroll facteurResult, error: AuthError | null }>` (Contains factor `id`, `type`, and TOTP details like `qr_code`, `secret`)

**Example (TOTP):**

```javascript
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: "totp",
  friendlyName: "My Authenticator App",
});
// Use data.id for challenge/verify steps
// Display data.totp.qr_code or data.totp.secret to user
```

### `challenge(params)`

Creates a challenge for an enrolled MFA factor, preparing for verification. Sends OTP for phone factors.

**Parameters:**

- `params`: (Required) Object - Contains `factorId`. Optional `channel` for phone ('sms' or 'whatsapp').

**Returns:** `Promise<{ data: Challenge, error: AuthError | null }>` (Contains `id` (challenge ID) and `factorId`)

**Example:**

```javascript
const { data: challengeData, error } = await supabase.auth.mfa.challenge({
  factorId: enrolledFactorId, // from enroll()
});
// Use challengeData.id for verify()
```

### `verify(params)`

Verifies a challenge using a code provided by the user (from authenticator app or SMS/WhatsApp).

**Parameters:**

- `params`: (Required) Object - Contains `factorId`, `challengeId` (from `challenge()`), `code` (user-provided).

**Returns:** `Promise<{ data: VerifyFactorResult, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.mfa.verify({
  factorId: enrolledFactorId,
  challengeId: challengeId, // from challenge()
  code: "123456", // User input
});
```

### `challengeAndVerify(params)`

Helper that combines `challenge` and `verify` for TOTP factors in one step.

**Parameters:**

- `params`: (Required) Object - Contains `factorId`, `code` (user-provided).

**Returns:** `Promise<{ data: VerifyFactorResult, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.mfa.challengeAndVerify({
  factorId: enrolledFactorId,
  code: "123456", // User input
});
```

### `unenroll(params)`

Removes an MFA factor. Requires AAL2 level if the factor is verified.

**Parameters:**

- `params`: (Required) Object - Contains `factorId`.

**Returns:** `Promise<{ data: UnenrollFactorResult, error: AuthError | null }>`

**Example:**

```javascript
const { data, error } = await supabase.auth.mfa.unenroll({
  factorId: factorIdToRemove,
});
```

### `getAuthenticatorAssuranceLevel()`

Gets the current Authenticator Assurance Level (AAL) for the session (aal1 or aal2).

**Returns:** `Promise<{ data: AuthenticatorAssuranceLevelState, error: AuthError | null }>` (Contains `currentLevel`, `nextLevel`)

**Example:**

```javascript
const { data, error } =
  await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
console.log("Current AAL:", data?.currentLevel); // e.g., 'aal1' or 'aal2'
```

## Admin Actions (`supabase.auth.admin`)

**Note:** These methods require the `service_role` key and should **only** be called from a trusted server environment.

### `createUser(attributes)`

Creates a new user directly without sending confirmation emails.

**Parameters:**

- `attributes`: (Required) Object - Admin user attributes (e.g., `email`, `password`, `phone`, `email_confirm`, `phone_confirm`, `user_metadata`, `app_metadata`).

**Returns:** `Promise<{ data: { user: User }, error: AuthError | null }>`

**Example:**

```javascript
// On server with service_role client
const { data, error } = await supabase.auth.admin.createUser({
  email: "user@example.com",
  password: "initial-password",
  email_confirm: true, // Optionally confirm email immediately
  user_metadata: { plan: "free" },
});
```

### `deleteUser(id, shouldSoftDelete?)`

Deletes a user by their ID.

**Parameters:**

- `id`: (Required) String - The user's UUID.
- `shouldSoftDelete`: (Optional) Boolean - If true, soft-deletes the user (default: false).

**Returns:** `Promise<{ data: { user: User | null }, error: AuthError | null }>`

**Example:**

```javascript
// On server with service_role client
const { data, error } = await supabase.auth.admin.deleteUser(
  "user-uuid-to-delete",
  true // Optional: soft delete
);
```

### `getUserById(uid)`

Retrieves a user's details by their ID.

**Parameters:**

- `uid`: (Required) String - The user's UUID.

**Returns:** `Promise<{ data: { user: User }, error: AuthError | null }>`

**Example:**

```javascript
// On server with service_role client
const { data, error } = await supabase.auth.admin.getUserById("user-uuid");
```

### `listUsers(params?)`

Lists users with pagination.

**Parameters:**

- `params`: (Optional) Object - Contains `page` (number), `perPage` (number). Defaults to page 1, 50 per page.

**Returns:** `Promise<{ data: { users: User[], aud: string, total?: number, nextPage?: number, lastPage?: number }, error: AuthError | null }>`

**Example:**

```javascript
// On server with service_role client
const {
  data: { users },
  error,
} = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
```

### `updateUserById(uid, attributes)`

Updates a specific user's attributes by their ID.

**Parameters:**

- `uid`: (Required) String - The user's UUID.
- `attributes`: (Required) Object - Admin user attributes to update (e.g., `email`, `password`, `phone`, `email_confirm`, `phone_confirm`, `user_metadata`, `app_metadata`, `ban_duration`, `role`).

**Returns:** `Promise<{ data: { user: User }, error: AuthError | null }>`

**Example:**

```javascript
// On server with service_role client
const { data: user, error } = await supabase.auth.admin.updateUserById(
  "user-uuid",
  { app_metadata: { roles: ["admin"] }, email_confirm: true }
);
```

### `inviteUserByEmail(email, options?)`

Sends an email invite link to a user. Does not support PKCE.

**Parameters:**

- `email`: (Required) String - Email address to invite.
- `options`: (Optional) Object - Contains `redirectTo`, `data` (user metadata).

**Returns:** `Promise<{ data: { user: User }, error: AuthError | null }>`

**Example:**

```javascript
// On server with service_role client
const { data, error } = await supabase.auth.admin.inviteUserByEmail(
  "new.user@example.com",
  {
    redirectTo: "https://myapp.com/welcome",
    data: { invited_by: "admin@example.com" },
  }
);
```

### `generateLink(params)`

Generates various auth-related links or OTP data (signup, invite, recovery, magiclink, email/phone change) for use with custom delivery methods.

**Parameters:**

- `params`: (Required) Object - Contains `type` (link type), `email` or `phone`, and other type-specific options (e.g., `password`, `redirectTo`, `data`, `newEmail`, `newPhone`).

**Returns:** `Promise<{ data: GenerateLinkResponse, error: AuthError | null }>`

**Example (Generate Magic Link):**

```javascript
// On server with service_role client
const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email: "user@example.com",
  options: {
    redirectTo: "https://myapp.com/magic-login",
  },
});
// Send the link/token from data.properties via your custom email service
```

### `mfa.deleteFactor(params)`

Deletes an MFA factor for a specific user.

**Parameters:**

- `params`: (Required) Object - Contains `id` (factor ID), `userId` (user UUID).

**Returns:** `Promise<{ data: DeleteFactorResult, error: AuthError | null }>`

**Example:**

```javascript
// On server with service_role client
const { data, error } = await supabase.auth.admin.mfa.deleteFactor({
  id: "factor-id-to-delete",
  userId: "user-uuid",
});
```

## Non-Browser Auto-Refresh

### `startAutoRefresh()`

Starts background session auto-refresh. Use in non-browser environments (e.g., React Native, Electron) when the app is focused.

**Returns:** `Promise<void>`

### `stopAutoRefresh()`

Stops background session auto-refresh. Use in non-browser environments when the app is backgrounded or loses focus.

**Returns:** `Promise<void>`

**Example (React Native):**

```javascript
import { AppState } from "react-native";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```
