import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TaskOrderService } from './../src/modules/tasks/services/task-order.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies the Production<->Warehouse direction auto-detection added to
// Trolley Activities: pickup scanned against a Production Location should
// auto-pick an EMPTY Warehouse Location for dropping (and flip it FULL),
// while pickup scanned against a Warehouse Location should keep using the
// trolley's own fixed droppingLocationCode (and flip that Warehouse
// Location back to EMPTY). RCS is stubbed out — this only proves the DB
// direction-detection/status-toggle logic, not the live network call.
describe('Trolley Activities — direction auto-detection (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2EDIR${Date.now()}`;

  let accessToken: string;
  let testUserId: string;
  const testUsername = `${suffix}user`;
  const testPassword = 'E2eTestPass123!';
  let mcpId: string;
  let trolleyId: string;
  let whPickupId: string; // WarehouseLocation used as pickup in direction A
  let whDropId: string; // WarehouseLocation left EMPTY, auto-picked as dropping in direction B
  let plDropCode: string; // trolley's fixed dropping code (direction A), points to a ProductionLocation

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TaskOrderService)
      .useValue({
        addTask: jest.fn().mockResolvedValue({ code: 1000, desc: 'ok' }),
        getOrderList: jest.fn().mockResolvedValue([]),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Dedicated throwaway user instead of the real superadmin account — its
    // seeded password may have been changed by real usage of this dev DB,
    // and `prisma.user.upsert` in seed.ts never resets it on re-seed.
    const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
    if (!superAdminRole) throw new Error('No Super Admin role seeded — cannot run test');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const testUser = await prisma.user.create({
      data: {
        username: testUsername,
        email: `${testUsername}@example.com`,
        fullName: 'E2E Direction Test User',
        password: hashedPassword,
        roleId: superAdminRole.id,
        isActive: true,
      },
    });
    testUserId = testUser.id;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: testUsername, password: testPassword })
      .expect(200);
    accessToken = login.body.accessToken;

    const mcp = await prisma.modelCodeProcess.findFirst({ where: { deletedAt: null } });
    if (!mcp) throw new Error('No active ModelCodeProcess seeded — cannot run test');
    mcpId = mcp.id;

    plDropCode = `${suffix}PLDROP`;
    const productionLocationDrop = await prisma.productionLocation.create({
      data: { name: `${suffix} PL Drop`, iRaypleLocationCode: plDropCode, isActive: true },
    });

    await prisma.productionLocation.create({
      data: { name: `${suffix} PL Pickup`, iRaypleLocationCode: `${suffix}PLPICK`, isActive: true },
    });

    const warehouseLocationPickup = await prisma.warehouseLocation.create({
      data: {
        name: `${suffix} WH Pickup`,
        iRaypleLocationCode: `${suffix}WHPICK`,
        isActive: true,
        status: 'FULL', // starts FULL so direction A's toggle-to-EMPTY is observable
      },
    });
    whPickupId = warehouseLocationPickup.id;

    const warehouseLocationDrop = await prisma.warehouseLocation.create({
      data: {
        name: `${suffix} WH Drop`,
        iRaypleLocationCode: `${suffix}WHDROP`,
        isActive: true,
        status: 'EMPTY', // the only EMPTY one — must be auto-picked in direction B
      },
    });
    whDropId = warehouseLocationDrop.id;

    const trolley = await prisma.trolley.create({
      data: {
        name: `${suffix} Trolley`,
        code: `${suffix}TRL`,
        status: 'EMPTY',
        modelCodeProcessId: mcpId,
        droppingLocationCode: plDropCode,
      },
    });
    trolleyId = trolley.id;

    void productionLocationDrop;
  });

  afterAll(async () => {
    await prisma.trolleyActivity.deleteMany({ where: { trolleyId } });
    await prisma.trolley.deleteMany({ where: { id: trolleyId } });
    await prisma.warehouseLocation.deleteMany({ where: { id: { in: [whPickupId, whDropId] } } });
    await prisma.productionLocation.deleteMany({
      where: { iRaypleLocationCode: { in: [plDropCode, `${suffix}PLPICK`] } },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });

  it('lookup-location resolves a Warehouse Location code as pickupLocationSource WAREHOUSE', async () => {
    const res = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-location')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}WHPICK` })
      .expect(201);
    expect(res.body.data.pickupLocationSource).toBe('WAREHOUSE');
    expect(res.body.data.pickupLocationCode).toBe(`${suffix}WHPICK`);
  });

  it('lookup-location resolves a Production Location code as pickupLocationSource PRODUCTION', async () => {
    const res = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-location')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}PLPICK` })
      .expect(201);
    expect(res.body.data.pickupLocationSource).toBe('PRODUCTION');
    expect(res.body.data.pickupLocationCode).toBe(`${suffix}PLPICK`);
  });

  it('lookup-location rejects an unknown code', async () => {
    await request(app.getHttpServer())
      .post('/trolley-activities/lookup-location')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}NOPE` })
      .expect(400);
  });

  it('Production->Warehouse: auto-picks the EMPTY Warehouse Location for dropping and flips it FULL', async () => {
    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: `${suffix}PLPICK`,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);

    expect(res.body.data.activity.droppingLocationCode).toBe(`${suffix}WHDROP`);

    const whDrop = await prisma.warehouseLocation.findUnique({ where: { id: whDropId } });
    expect(whDrop?.status).toBe('FULL');
  });

  it('Warehouse->Production: uses the trolley fixed dropping code and flips the pickup Warehouse Location EMPTY', async () => {
    // generateOrderId() is second-resolution — avoid colliding with the
    // previous test's taskId if both land in the same wall-clock second.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: `${suffix}WHPICK`,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);

    expect(res.body.data.activity.droppingLocationCode).toBe(plDropCode);

    const whPickup = await prisma.warehouseLocation.findUnique({ where: { id: whPickupId } });
    expect(whPickup?.status).toBe('EMPTY');
  });

  // "No Warehouse Location is EMPTY at all" isn't tested end-to-end here —
  // this dev DB has other real, unrelated EMPTY Warehouse Locations, so
  // forcing that state would mean mutating live data outside this test's
  // own fixtures. findFirstActiveEmpty()'s null case is exercised directly
  // by CreateTrolleyActivityUseCase's own guard (see the source) instead.
});
