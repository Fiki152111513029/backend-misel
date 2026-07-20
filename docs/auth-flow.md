# Authentication & Authorization Flow

## Overview

The backend uses stateless JWT access tokens plus DB-persisted, rotating refresh
tokens. Authorization is Role-Based Access Control (RBAC): every user has one
`Role`, and every `Role` has many `Permission`s through the `RolePermission`
join table.

## Login

`POST /auth/login` — public route (`@Public()`).

1. Client sends `{ identifier, password }`. `identifier` can be either the
   user's `username` or `email` — both are checked via a single Prisma
   `OR` query (`UsersRepository.findByIdentifier`).
2. If no matching user is found, the user is inactive, or the password
   doesn't match (`bcrypt.compare`), the API returns a generic
   `401 Unauthorized: Invalid credentials` — it never reveals which field
   was wrong.
3. On success, an access token (short-lived, `JWT_ACCESS_EXPIRES_IN`, default
   15m) and a refresh token (longer-lived, `JWT_REFRESH_EXPIRES_IN`, default
   7d) are issued. The access token payload carries `sub` (user id),
   `username`, `role`, and `permissions` (the flattened list of permission
   codes from the user's role) — this is what lets guards authorize requests
   without a DB round trip on every call.
4. The refresh token is itself a signed JWT, but only its SHA-256 hash is
   persisted in the `refresh_tokens` table (never the raw token) — this is
   what makes revocation and rotation possible server-side.

## Route protection

`JwtAuthGuard`, `RolesGuard`, and `PermissionsGuard` are registered globally
(`APP_GUARD` in `AuthModule`), so **every route requires a valid access token
by default**. Routes opt out with `@Public()` (login, refresh, and the root
health route) instead of opting in with guards everywhere.

This also satisfies feature.md's requirement for "JWT validation middleware":
`JwtAuthGuard` plays that role, implemented as a Nest Guard rather than a raw
Express/Nest middleware, because a Guard has access to `ExecutionContext` and
`Reflector` — needed to read the `@Public()` metadata and skip validation for
public routes. A separate middleware layer would be redundant.

`@Roles(...)` / `@Permissions(...)` decorators attach metadata that
`RolesGuard` / `PermissionsGuard` read via `Reflector`. If a route has no
`@Roles`/`@Permissions` decorator, those guards allow the request through
(they only restrict when metadata is present). `PermissionsGuard` uses AND
semantics: every permission listed must be present in the user's token.

There is no special-cased "Super Admin bypasses guards" logic — Super Admin
is simply seeded with every permission code, so the same guard code path
authorizes every role uniformly.

## Refresh

`POST /auth/refresh` — public route, body `{ refreshToken }`.

1. Verifies the JWT signature/expiry of the refresh token.
2. Looks up its SHA-256 hash in `refresh_tokens`; rejects if missing, already
   `revoked`, or past `expiresAt`.
3. **Rotates**: marks the old row `revoked = true` with
   `replacedByTokenHash` pointing at the new token's hash, then issues and
   persists a brand new access/refresh token pair.

Reuse of an already-rotated/revoked refresh token is not automatically
treated as a theft signal in this version (no auto-revoke-all-for-user on
reuse) — flagged here as a recommended future hardening step, not built to
keep the initial scope tight.

## Logout

`POST /auth/logout` — protected route (requires a valid access token), body
`{ refreshToken }`.

Looks up the given refresh token by hash, confirms it belongs to the
requesting user (`storedToken.userId === request.user.userId`), and marks it
`revoked`. Requiring an access token (rather than an anonymous endpoint) adds
an ownership check so one user can't blindly revoke another user's session by
guessing/sniffing a refresh token string.

## Default roles & bootstrap Super Admin

Seeded roles: `Super Admin` (all permissions), `Admin` (user/warehouse/robot/
logs management, but not role/permission management), `Supervisor`
(read-only: warehouse, robot, logs), `Operator` (read-only: warehouse,
robot). See `prisma/seed.ts` for the exact mapping.

The seed also creates a bootstrap Super Admin user from
`SEED_SUPER_ADMIN_USERNAME` / `SEED_SUPER_ADMIN_EMAIL` /
`SEED_SUPER_ADMIN_PASSWORD` env vars (defaults are placeholders — see
`.env.example`).

**⚠️ Change the bootstrap Super Admin password immediately after the first
login in any real environment.** It ships as a well-known placeholder.

## Register API

There is intentionally **no public `/auth/register` endpoint**. Per project
decision, new users are created via the authenticated, permission-gated
`POST /users` endpoint (`user.create` permission required) under Users
Management — this is what satisfies feature.md's "Register API" deliverable.
