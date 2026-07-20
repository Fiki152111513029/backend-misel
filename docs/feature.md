Act as a Senior NestJS Architect.

Saya ingin membuat sistem Authentication dan Authorization menggunakan:

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Clean Architecture
- Repository Pattern
- Role Based Access Control (RBAC)

Gunakan struktur folder berikut:

src/modules/auth/
├── controllers/
├── dto/
├── use-cases/
├── repositories/
├── services/
├── guards/
├── strategies/
├── decorators/
└── auth.module.ts

src/modules/users/
├── controllers/
├── dto/
├── use-cases/
├── repositories/
├── services/
└── users.module.ts

src/modules/roles/
├── controllers/
├── dto/
├── use-cases/
├── repositories/
└── roles.module.ts

src/modules/permissions/
├── controllers/
├── dto/
├── use-cases/
├── repositories/
└── permissions.module.ts

Database Schema:

User
- id
- username
- email
- password
- fullName
- roleId
- isActive
- createdAt
- updatedAt

Role
- id
- name
- description
- createdAt
- updatedAt

Permission
- id
- code
- name
- description

RolePermission
- roleId
- permissionId

Relationship:

User
→ belongsTo Role

Role
→ hasMany Users

Role
→ belongsToMany Permission

Permission
→ belongsToMany Role

Authentication Requirements:

1. Login menggunakan username dan password.
2. Password harus di-hash menggunakan bcrypt.
3. Login menghasilkan JWT Access Token.
4. JWT berisi:
   - userId
   - username
   - role
   - permissions
5. Implementasikan JwtStrategy.
6. Implementasikan JwtAuthGuard.
7. Implementasikan middleware untuk validasi JWT.
8. Implementasikan logout.
9. Implementasikan refresh token.

Authorization Requirements:

Buat custom decorator:

@Roles()
@Permissions()

Contoh:

@Roles('Super Admin')
@Permissions('user.create')

Implementasikan:

RolesGuard
PermissionsGuard

Role Default:

1. Super Admin
2. Admin
3. Supervisor
4. Operator

Permission Default:

User Management:
- user.create
- user.read
- user.update
- user.delete

Role Management:
- role.create
- role.read
- role.update
- role.delete

Permission Management:
- permission.create
- permission.read
- permission.update
- permission.delete

Warehouse:
- warehouse.read
- warehouse.create
- warehouse.update
- warehouse.delete

Robot:
- robot.read
- robot.create
- robot.update
- robot.delete

Logs:
- logs.read
- logs.export

Default Mapping:

Super Admin:
- Semua Permission

Admin:
- User Management
- Warehouse
- Robot
- Logs

Supervisor:
- Warehouse Read
- Robot Read
- Logs Read

Operator:
- Warehouse Read
- Robot Read

Requirements:

1. Gunakan Prisma Schema lengkap.
2. Buat migration PostgreSQL.
3. Buat seed data untuk:
   - Roles
   - Permissions
   - Role Permissions
   - Super Admin default
4. Buat DTO Validation menggunakan class-validator.
5. Gunakan Clean Architecture:

Controller
→ Use Case
→ Repository
→ Prisma
→ PostgreSQL

6. Jangan akses Prisma langsung dari Controller.
7. Gunakan Repository Pattern.
8. Gunakan Dependency Injection.
9. Gunakan TypeScript strict typing.
10. Ikuti best practice enterprise NestJS.

Generate:

1. Struktur folder lengkap.
2. Prisma Schema.
3. Migration.
4. Seed Data.
5. Auth Module.
6. Users Module.
7. Roles Module.
8. Permissions Module.
9. JWT Strategy.
10. JWT Guard.
11. Roles Guard.
12. Permissions Guard.
13. Custom Decorators.
14. Login API.
15. Register API.
16. Refresh Token API.
17. Logout API.
18. Example Request Response.
19. Swagger Documentation.
20. Penjelasan alur login dan authorization.