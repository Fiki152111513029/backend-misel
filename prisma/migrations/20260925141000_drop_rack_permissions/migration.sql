-- The Racks CRUD was removed, but prisma/seed.ts only upserts permissions and
-- never prunes them, so its four permission rows would linger as a dead
-- "rack" group in Role Management. Remove them and any role grants.
DELETE FROM "role_permissions"
WHERE "permissionId" IN (SELECT "id" FROM "permissions" WHERE "code" LIKE 'rack.%');

DELETE FROM "permissions" WHERE "code" LIKE 'rack.%';
