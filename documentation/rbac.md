# RBAC & Auth

## Model

```
Tenant 1---* Role 1---* User
```

- **Tenant** — top-level organization. `id`, `name`, `slug` (unique), `isActive`.
- **Role** — `name` is one of `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SPV`, `USER`. `tenantId` is nullable — **null only for `SUPER_ADMIN`**, which is a single global role not bound to any tenant. Every other role belongs to exactly one tenant (`@@unique([tenantId, name])`, so each tenant has at most one `ADMIN`, one `MANAGER`, etc).
- **User** — has exactly one `Role` (`roleId`). A user's tenant is derived through `user.role.tenantId`, not stored directly on the user.

Creating a tenant (`POST /api/tenants`) automatically provisions its `ADMIN`/`MANAGER`/`SPV`/`USER` roles in the same transaction. `SUPER_ADMIN` is never creatable via the API — it only exists via the seeder.

## Roles & permissions

Permissions are an explicit set per role, not a numeric hierarchy — capabilities don't nest cleanly (SPV can approve but not write; USER can write but not approve), so a "higher" role does not automatically inherit everything a "lower" role can do.

| Role | Scope | Permissions |
|---|---|---|
| `SUPER_ADMIN` | all tenants | CREATE, READ, UPDATE, APPROVE, DELETE, MANAGE_TENANTS, MANAGE_ROLES, MANAGE_USERS |
| `ADMIN` | own tenant | CREATE, READ, UPDATE, APPROVE, DELETE, MANAGE_ROLES, MANAGE_USERS |
| `MANAGER` | own tenant | CREATE, READ, UPDATE, APPROVE |
| `SPV` | own tenant | READ, APPROVE |
| `USER` | own tenant | CREATE |

Defined in [`src/common/constants/role-permissions.ts`](../src/common/constants/role-permissions.ts).

## Enforcement

- `@Permissions(Permission.X)` decorator + `PermissionsGuard` — checks the caller's role grants **all** listed permissions for that route (403 otherwise).
- Tenant scoping is enforced per-service, not by the guard: `SUPER_ADMIN` sees everything; every other role is restricted to rows belonging to its own tenant (via `role.tenantId`), even if it has the right permission.
- `TenantsController` requires `MANAGE_TENANTS` — only `SUPER_ADMIN` has it.
- `RolesController` / `UsersController` require `MANAGE_ROLES` / `MANAGE_USERS` — `SUPER_ADMIN` and `ADMIN`. The `SUPER_ADMIN` role itself can never be assigned, edited, or deleted through the API.

## Auth

- `POST /api/auth/login` — `{ email, password }` → `{ accessToken, user }`. Password checked with bcrypt.
- `GET /api/auth/profile` — any authenticated user; returns the decoded JWT payload.
- JWT payload: `{ sub, email, tenantId, role }`.

### Sliding session (refresh on activity)

`JwtAuthGuard` reissues a fresh token (same claims, renewed expiry) on **every** successful authenticated request and returns it via the `x-refreshed-token` response header (exposed through CORS). As long as the client swaps in the refreshed token before the previous one expires, the session never expires from inactivity — but it does expire if the client goes quiet past `JWT_EXPIRES_IN`.

Client responsibility: after each request, if `x-refreshed-token` is present, store it and use it for the next request.

## Default seeded users

Run with `npm run db:seed` (idempotent — safe to re-run). Creates tenant **Acme Corp** (`slug: acme`) plus:

| Email | Role | Tenant |
|---|---|---|
| `superadmin@example.com` | `SUPER_ADMIN` | none (all tenants) |
| `admin@acme.test` | `ADMIN` | acme |
| `manager@acme.test` | `MANAGER` | acme |
| `spv@acme.test` | `SPV` | acme |
| `user@acme.test` | `USER` | acme |

All seeded users share the password: **`Homelab2026*`**

Change these before using outside of local development.
