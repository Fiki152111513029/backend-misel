# API Examples

Interactive docs (Swagger UI): `GET /api/docs` once the server is running.

All requests below assume the server is at `http://localhost:3000`.

## Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "superadmin",
    "password": "ChangeMe123!"
  }'
```

Response `200`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "b3f1c2e4-...",
    "username": "superadmin",
    "email": "superadmin@example.com",
    "fullName": "Super Administrator",
    "role": "Super Admin",
    "permissions": ["user.create", "user.read", "..."]
  }
}
```

Invalid credentials → `401`:

```json
{ "statusCode": 401, "path": "/auth/login", "timestamp": "...", "message": "Invalid credentials" }
```

## Refresh token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "eyJhbGciOi..." }'
```

Returns a new `{ accessToken, refreshToken, user }` pair; the old refresh
token is revoked.

## Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "eyJhbGciOi..." }'
```

Response `200`, body empty.

## Create user (a.k.a. "Register API", requires `user.create`)

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jdoe",
    "email": "jdoe@example.com",
    "password": "StrongP@ssw0rd",
    "fullName": "John Doe",
    "roleId": "<role-uuid>"
  }'
```

Response `201`:

```json
{
  "id": "e2a9...",
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fullName": "John Doe",
  "roleId": "<role-uuid>",
  "isActive": true,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

Note: `password` is never included in any user response — it's stripped by
`UserResponseDto` (`@Exclude()` + `ClassSerializerInterceptor`).

## List roles

```bash
curl http://localhost:3000/roles -H "Authorization: Bearer <accessToken>"
```

## Assign permissions to a role

```bash
curl -X PATCH http://localhost:3000/roles/<role-uuid>/permissions \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "permissionIds": ["<perm-uuid-1>", "<perm-uuid-2>"] }'
```

This **replaces** the role's full permission set with the given list.

## List permissions

```bash
curl http://localhost:3000/permissions -H "Authorization: Bearer <accessToken>"
```

## Unauthorized access example

Calling any protected endpoint without a token, or with a token missing the
required permission:

```json
{ "statusCode": 401, "path": "/users", "timestamp": "...", "message": "Unauthorized" }
```

```json
{ "statusCode": 403, "path": "/users", "timestamp": "...", "message": "Forbidden resource" }
```
