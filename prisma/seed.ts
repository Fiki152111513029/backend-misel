import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);

interface PermissionSeed {
  code: string;
  name: string;
  description: string;
}

const PERMISSIONS: PermissionSeed[] = [
  // User Management
  { code: 'user.create', name: 'Create User', description: 'Create new users' },
  { code: 'user.read', name: 'Read User', description: 'View users' },
  { code: 'user.update', name: 'Update User', description: 'Update users' },
  { code: 'user.delete', name: 'Delete User', description: 'Delete users' },
  // Role Management
  { code: 'role.create', name: 'Create Role', description: 'Create new roles' },
  { code: 'role.read', name: 'Read Role', description: 'View roles' },
  { code: 'role.update', name: 'Update Role', description: 'Update roles' },
  { code: 'role.delete', name: 'Delete Role', description: 'Delete roles' },
  // Permission Management
  {
    code: 'permission.create',
    name: 'Create Permission',
    description: 'Create new permissions',
  },
  { code: 'permission.read', name: 'Read Permission', description: 'View permissions' },
  {
    code: 'permission.update',
    name: 'Update Permission',
    description: 'Update permissions',
  },
  {
    code: 'permission.delete',
    name: 'Delete Permission',
    description: 'Delete permissions',
  },
  // Warehouse
  { code: 'warehouse.read', name: 'Read Warehouse', description: 'View warehouses' },
  {
    code: 'warehouse.create',
    name: 'Create Warehouse',
    description: 'Create new warehouses',
  },
  {
    code: 'warehouse.update',
    name: 'Update Warehouse',
    description: 'Update warehouses',
  },
  {
    code: 'warehouse.delete',
    name: 'Delete Warehouse',
    description: 'Delete warehouses',
  },
  // Robot
  { code: 'robot.read', name: 'Read Robot', description: 'View robots' },
  { code: 'robot.create', name: 'Create Robot', description: 'Create new robots' },
  { code: 'robot.update', name: 'Update Robot', description: 'Update robots' },
  { code: 'robot.delete', name: 'Delete Robot', description: 'Delete robots' },
  // Logs
  { code: 'logs.read', name: 'Read Logs', description: 'View logs' },
  { code: 'logs.export', name: 'Export Logs', description: 'Export logs' },
  // Quarantine Line
  {
    code: 'quarantine-line.create',
    name: 'Create Quarantine Line',
    description: 'Create new quarantine lines',
  },
  {
    code: 'quarantine-line.read',
    name: 'Read Quarantine Line',
    description: 'View quarantine lines',
  },
  {
    code: 'quarantine-line.update',
    name: 'Update Quarantine Line',
    description: 'Update quarantine lines',
  },
  {
    code: 'quarantine-line.delete',
    name: 'Delete Quarantine Line',
    description: 'Delete quarantine lines',
  },
  // Quarantine Area
  {
    code: 'quarantine-area.create',
    name: 'Create Quarantine Area',
    description: 'Create new quarantine areas',
  },
  {
    code: 'quarantine-area.read',
    name: 'Read Quarantine Area',
    description: 'View quarantine areas',
  },
  {
    code: 'quarantine-area.update',
    name: 'Update Quarantine Area',
    description: 'Update quarantine areas',
  },
  {
    code: 'quarantine-area.delete',
    name: 'Delete Quarantine Area',
    description: 'Delete quarantine areas',
  },
  // EXIM Location
  {
    code: 'exim-location.create',
    name: 'Create EXIM Location',
    description: 'Create new EXIM locations',
  },
  {
    code: 'exim-location.read',
    name: 'Read EXIM Location',
    description: 'View EXIM locations',
  },
  {
    code: 'exim-location.update',
    name: 'Update EXIM Location',
    description: 'Update EXIM locations',
  },
  {
    code: 'exim-location.delete',
    name: 'Delete EXIM Location',
    description: 'Delete EXIM locations',
  },
  // Empty Pallet Location
  {
    code: 'empty-pallet-location.create',
    name: 'Create Empty Pallet Location',
    description: 'Create new empty pallet locations',
  },
  {
    code: 'empty-pallet-location.read',
    name: 'Read Empty Pallet Location',
    description: 'View empty pallet locations',
  },
  {
    code: 'empty-pallet-location.update',
    name: 'Update Empty Pallet Location',
    description: 'Update empty pallet locations',
  },
  {
    code: 'empty-pallet-location.delete',
    name: 'Delete Empty Pallet Location',
    description: 'Delete empty pallet locations',
  },
  // Warehouse Line Location
  {
    code: 'warehouse-line-location.create',
    name: 'Create Warehouse Line Location',
    description: 'Create new warehouse line locations',
  },
  {
    code: 'warehouse-line-location.read',
    name: 'Read Warehouse Line Location',
    description: 'View warehouse line locations',
  },
  {
    code: 'warehouse-line-location.update',
    name: 'Update Warehouse Line Location',
    description: 'Update warehouse line locations',
  },
  {
    code: 'warehouse-line-location.delete',
    name: 'Delete Warehouse Line Location',
    description: 'Delete warehouse line locations',
  },
  // Warehouse Operator Location
  {
    code: 'warehouse-operator-location.create',
    name: 'Create Warehouse Operator Location',
    description: 'Create new warehouse operator locations',
  },
  {
    code: 'warehouse-operator-location.read',
    name: 'Read Warehouse Operator Location',
    description: 'View warehouse operator locations',
  },
  {
    code: 'warehouse-operator-location.update',
    name: 'Update Warehouse Operator Location',
    description: 'Update warehouse operator locations',
  },
  {
    code: 'warehouse-operator-location.delete',
    name: 'Delete Warehouse Operator Location',
    description: 'Delete warehouse operator locations',
  },
  // Model Code Process
  {
    code: 'model-code-process.create',
    name: 'Create Model Code Process',
    description: 'Create new model code processes',
  },
  {
    code: 'model-code-process.read',
    name: 'Read Model Code Process',
    description: 'View model code processes',
  },
  {
    code: 'model-code-process.update',
    name: 'Update Model Code Process',
    description: 'Update model code processes',
  },
  {
    code: 'model-code-process.delete',
    name: 'Delete Model Code Process',
    description: 'Delete model code processes',
  },
  // Production Line
  {
    code: 'production-line.create',
    name: 'Create Production Line',
    description: 'Create new production lines',
  },
  {
    code: 'production-line.read',
    name: 'Read Production Line',
    description: 'View production lines',
  },
  {
    code: 'production-line.update',
    name: 'Update Production Line',
    description: 'Update production lines',
  },
  {
    code: 'production-line.delete',
    name: 'Delete Production Line',
    description: 'Delete production lines',
  },
  // Production Line Area
  {
    code: 'production-line-area.create',
    name: 'Create Production Line Area',
    description: 'Create new production line areas',
  },
  {
    code: 'production-line-area.read',
    name: 'Read Production Line Area',
    description: 'View production line areas',
  },
  {
    code: 'production-line-area.update',
    name: 'Update Production Line Area',
    description: 'Update production line areas',
  },
  {
    code: 'production-line-area.delete',
    name: 'Delete Production Line Area',
    description: 'Delete production line areas',
  },
  // Request Box
  {
    code: 'request-box.create',
    name: 'Create Request Box',
    description: 'Create new request boxes',
  },
  {
    code: 'request-box.read',
    name: 'Read Request Box',
    description: 'View request boxes',
  },
  {
    code: 'request-box.delete',
    name: 'Delete Request Box',
    description: 'Delete request boxes',
  },
  // Task
  {
    code: 'task.create',
    name: 'Create Task',
    description: 'Release new tasks to the AMR fleet',
  },
  {
    code: 'task.read',
    name: 'Read Task',
    description: 'View tasks',
  },
  {
    code: 'task.delete',
    name: 'Delete Task',
    description: 'Delete tasks',
  },
  // Warehouse Cart Task
  {
    code: 'warehouse-cart-task.create',
    name: 'Create Warehouse Cart Task',
    description: 'Release new warehouse cart tasks to the AMR fleet',
  },
  {
    code: 'warehouse-cart-task.read',
    name: 'Read Warehouse Cart Task',
    description: 'View warehouse cart tasks',
  },
  // Factory Map
  {
    code: 'factory-map.create',
    name: 'Create Factory Map',
    description: 'Upload new factory maps',
  },
  {
    code: 'factory-map.read',
    name: 'Read Factory Map',
    description: 'View factory maps',
  },
  {
    code: 'factory-map.update',
    name: 'Update Factory Map',
    description: 'Update factory maps',
  },
  {
    code: 'factory-map.delete',
    name: 'Delete Factory Map',
    description: 'Delete factory maps',
  },
  // Charger Area
  {
    code: 'charger-area.create',
    name: 'Create Charger Area',
    description: 'Create new charger areas',
  },
  {
    code: 'charger-area.read',
    name: 'Read Charger Area',
    description: 'View charger areas',
  },
  {
    code: 'charger-area.update',
    name: 'Update Charger Area',
    description: 'Update charger areas',
  },
  {
    code: 'charger-area.delete',
    name: 'Delete Charger Area',
    description: 'Delete charger areas',
  },
  // Trolley
  {
    code: 'trolley.create',
    name: 'Create Trolley',
    description: 'Create new trolleys',
  },
  {
    code: 'trolley.read',
    name: 'Read Trolley',
    description: 'View trolleys',
  },
  {
    code: 'trolley.update',
    name: 'Update Trolley',
    description: 'Update trolleys',
  },
  {
    code: 'trolley.delete',
    name: 'Delete Trolley',
    description: 'Delete trolleys',
  },
  // Trolley Category
  {
    code: 'trolley-category.create',
    name: 'Create Trolley Category',
    description: 'Create new trolley categories',
  },
  {
    code: 'trolley-category.read',
    name: 'Read Trolley Category',
    description: 'View trolley categories',
  },
  {
    code: 'trolley-category.update',
    name: 'Update Trolley Category',
    description: 'Update trolley categories',
  },
  {
    code: 'trolley-category.delete',
    name: 'Delete Trolley Category',
    description: 'Delete trolley categories',
  },
  // Warehouse Location
  {
    code: 'warehouse-location.create',
    name: 'Create Warehouse Location',
    description: 'Create new warehouse locations',
  },
  {
    code: 'warehouse-location.read',
    name: 'Read Warehouse Location',
    description: 'View warehouse locations',
  },
  {
    code: 'warehouse-location.update',
    name: 'Update Warehouse Location',
    description: 'Update warehouse locations',
  },
  {
    code: 'warehouse-location.delete',
    name: 'Delete Warehouse Location',
    description: 'Delete warehouse locations',
  },
  // Production Location
  {
    code: 'production-location.create',
    name: 'Create Production Location',
    description: 'Create new production locations',
  },
  {
    code: 'production-location.read',
    name: 'Read Production Location',
    description: 'View production locations',
  },
  {
    code: 'production-location.update',
    name: 'Update Production Location',
    description: 'Update production locations',
  },
  {
    code: 'production-location.delete',
    name: 'Delete Production Location',
    description: 'Delete production locations',
  },
];

interface BoxTypeSeed {
  name: string;
  ordering: number;
  colorCode: string;
}

const BOX_TYPE_SEEDS: BoxTypeSeed[] = [
  { name: 'Small', ordering: 1, colorCode: '#22C55E' },
  { name: 'Medium', ordering: 2, colorCode: '#3B82F6' },
  { name: 'Large', ordering: 3, colorCode: '#F97316' },
  { name: 'Fragile', ordering: 4, colorCode: '#EF4444' },
];

const ROLE_NAMES = ['Super Admin', 'Operator', 'Exim', 'Warehouse'] as const;

const ALL_PERMISSION_CODES = PERMISSIONS.map((p) => p.code);

// Shared by Operator/Exim/Warehouse: line staff can view reference data and
// create their own request boxes, but only Super Admin gets full CRUD access.
const LINE_STAFF_CODES = [
  'warehouse.read',
  'robot.read',
  'model-code-process.read',
  'quarantine-line.read',
  'quarantine-area.read',
  'exim-location.read',
  'empty-pallet-location.read',
  'warehouse-line-location.read',
  'warehouse-operator-location.read',
  'production-line.read',
  'production-line-area.read',
  'request-box.read',
  'request-box.create',
  'task.read',
  'task.create',
  'warehouse-cart-task.read',
  'warehouse-cart-task.create',
];

const ROLE_PERMISSION_MAP: Record<(typeof ROLE_NAMES)[number], string[]> = {
  'Super Admin': ALL_PERMISSION_CODES,
  Operator: LINE_STAFF_CODES,
  Exim: LINE_STAFF_CODES,
  Warehouse: LINE_STAFF_CODES,
};

async function main() {
  console.log('Seeding permissions...');
  const permissionsByCode = new Map<string, { id: string }>();
  for (const permission of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name, description: permission.description },
      create: permission,
    });
    permissionsByCode.set(created.code, { id: created.id });
  }

  console.log('Seeding roles...');
  const rolesByName = new Map<string, { id: string }>();
  for (const name of ROLE_NAMES) {
    const created = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
    rolesByName.set(created.name, { id: created.id });
  }

  console.log('Seeding role-permission mappings...');
  for (const roleName of ROLE_NAMES) {
    const role = rolesByName.get(roleName)!;
    const codes = ROLE_PERMISSION_MAP[roleName];
    for (const code of codes) {
      const permission = permissionsByCode.get(code)!;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seeding Super Admin bootstrap user...');
  const superAdminRole = rolesByName.get('Super Admin')!;
  const username = process.env.SEED_SUPER_ADMIN_USERNAME ?? 'superadmin';
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@example.com';
  const fullName = process.env.SEED_SUPER_ADMIN_FULLNAME ?? 'Super Administrator';
  const rawPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email,
      fullName,
      password: hashedPassword,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  console.log('Seeding box types...');
  for (const boxType of BOX_TYPE_SEEDS) {
    // `name` is no longer a DB-level unique key (only unique among
    // non-soft-deleted rows via a partial index) so it can't be used as a
    // Prisma `where` for upsert anymore — look it up manually instead.
    const existing = await prisma.boxType.findFirst({
      where: { name: boxType.name, deletedAt: null },
    });
    if (existing) {
      await prisma.boxType.update({
        where: { id: existing.id },
        data: { ordering: boxType.ordering, colorCode: boxType.colorCode },
      });
    } else {
      await prisma.boxType.create({ data: boxType });
    }
  }

  console.log('Seed complete.');
  console.warn(
    `\n⚠️  Bootstrap Super Admin credentials — CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN:\n` +
      `    username: ${username}\n` +
      `    email:    ${email}\n` +
      `    password: ${rawPassword} (from SEED_SUPER_ADMIN_PASSWORD env, a placeholder default)\n`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
