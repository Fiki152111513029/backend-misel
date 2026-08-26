import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TaskOrderService } from './../src/modules/tasks/services/task-order.service';
import { RcsStockStatusService } from './../src/modules/rcs-stock-status/rcs-stock-status.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies the Production<->Warehouse direction auto-detection added to
// Trolley Activities: pickup scanned against a Production Location should
// auto-pick an EMPTY Warehouse Location for dropping (and flip it FULL),
// while pickup scanned against a Warehouse Location should keep using the
// trolley's own fixed droppingLocationCode (and flip that Warehouse
// Location back to EMPTY). RCS is stubbed out — this only proves the DB
// direction-detection/status-toggle logic, not the live network call.
//
// The two submission tests below run in a deliberate order — Warehouse-
// >Production first, then Production->Warehouse — because
// Trolley.currentLocationCode is now set immediately at submit time (not
// waiting for a webhook), so the trolley must actually be picked up from
// wherever the previous test left it (the position lock — see
// CreateTrolleyActivityUseCase).
describe('Trolley Activities — direction auto-detection (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2EDIR${Date.now()}`;

  let accessToken: string;
  let testUserId: string;
  const testUsername = `${suffix}user`;
  const testPassword = 'E2eTestPass123!';
  let mcpId: string;
  let trolleyCategoryId: string;
  let trolleyId: string;
  let whPickupId: string; // WarehouseLocation used as pickup in the Warehouse->Production test
  let whDropId: string; // WarehouseLocation left EMPTY, auto-picked as dropping in the Production->Warehouse test
  let plDropCode: string; // trolley's fixed dropping code (Warehouse->Production); reused as the pickup for the chained Production->Warehouse test
  let plDropId: string;
  let plPickupCode: string; // Separate Production Location, used only by the standalone lookup-location test (not the submission chain)
  let updateStockStatusMock: jest.Mock;

  beforeAll(async () => {
    updateStockStatusMock = jest.fn().mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TaskOrderService)
      .useValue({
        addTask: jest.fn().mockResolvedValue({ code: 1000, desc: 'ok' }),
        getOrderList: jest.fn().mockResolvedValue([]),
      })
      .overrideProvider(RcsStockStatusService)
      .useValue({
        updateStockStatus: updateStockStatusMock,
        getStockStatus: jest.fn().mockResolvedValue([]),
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
      data: { name: `${suffix} PL Drop`, iRaypleLocationCode: plDropCode, isActive: true, status: 'EMPTY' },
    });
    plDropId = productionLocationDrop.id;

    plPickupCode = `${suffix}PLPICK`;
    await prisma.productionLocation.create({
      data: { name: `${suffix} PL Pickup`, iRaypleLocationCode: plPickupCode, isActive: true, status: 'FULL' },
    });

    const warehouseLocationPickup = await prisma.warehouseLocation.create({
      data: {
        name: `${suffix} WH Pickup`,
        iRaypleLocationCode: `${suffix}WHPICK`,
        isActive: true,
        status: 'FULL', // starts FULL so the toggle-to-EMPTY is observable
      },
    });
    whPickupId = warehouseLocationPickup.id;

    const warehouseLocationDrop = await prisma.warehouseLocation.create({
      data: {
        name: `${suffix} WH Drop`,
        iRaypleLocationCode: `${suffix}WHDROP`,
        isActive: true,
        status: 'EMPTY', // the only EMPTY one — must be auto-picked
      },
    });
    whDropId = warehouseLocationDrop.id;

    // Production->Warehouse resolves modelProcessCode from the trolley's
    // Category, not the trolley itself.
    const trolleyCategory = await prisma.trolleyCategory.create({
      data: { name: `${suffix} Category`, modelCodeProcessId: mcpId },
    });
    trolleyCategoryId = trolleyCategory.id;

    const trolley = await prisma.trolley.create({
      data: {
        name: `${suffix} Trolley`,
        code: `${suffix}TRL`,
        status: 'EMPTY',
        modelCodeProcessId: mcpId,
        trolleyCategoryId,
        droppingLocationCode: plDropCode,
      },
    });
    trolleyId = trolley.id;
  });

  afterAll(async () => {
    await prisma.trolleyActivity.deleteMany({ where: { trolleyId } });
    await prisma.trolley.deleteMany({ where: { id: trolleyId } });
    await prisma.trolleyCategory.deleteMany({ where: { id: trolleyCategoryId } });
    await prisma.warehouseLocation.deleteMany({ where: { id: { in: [whPickupId, whDropId] } } });
    await prisma.productionLocation.deleteMany({
      where: { iRaypleLocationCode: { in: [plDropCode, plPickupCode] } },
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
    expect(res.body.data.incomingWarning).toBeNull();
  });

  it('lookup-location resolves a Production Location code as pickupLocationSource PRODUCTION', async () => {
    const res = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-location')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: plPickupCode })
      .expect(201);
    expect(res.body.data.pickupLocationSource).toBe('PRODUCTION');
    expect(res.body.data.pickupLocationCode).toBe(plPickupCode);
  });

  it('lookup-location rejects an unknown code', async () => {
    await request(app.getHttpServer())
      .post('/trolley-activities/lookup-location')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}NOPE` })
      .expect(400);
  });

  it('Warehouse->Production: uses the trolley fixed dropping code, flips the pickup Warehouse Location EMPTY, and tells RCS the pickup node is now full', async () => {
    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    updateStockStatusMock.mockClear();

    const res = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: `${suffix}WHPICK`,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);

    // Known for certain up front (the trolley's own fixed code) — recorded
    // on the activity immediately.
    expect(res.body.data.activity.droppingLocationCode).toBe(plDropCode);

    // Regression: create() previously returned the bare TrolleyActivity row
    // with no relations included, so activity.trolley was undefined and any
    // caller reading .trolley.code/.name (e.g. the Current Queue card) would
    // throw at runtime.
    expect(res.body.data.activity.trolley).toEqual({
      id: trolleyId,
      code: `${suffix}TRL`,
      name: `${suffix} Trolley`,
    });

    // Both calls target the scanned pickup node — RCS owns the dropping
    // node's status itself once its robot completes delivery there.
    expect(updateStockStatusMock).toHaveBeenCalledWith(`${suffix}WHPICK`, '0');
    expect(updateStockStatusMock).toHaveBeenCalledWith(`${suffix}WHPICK`, '2');

    const whPickup = await prisma.warehouseLocation.findUnique({ where: { id: whPickupId } });
    expect(whPickup?.status).toBe('EMPTY');

    // The Production Location the trolley was fixed to drop at is now
    // occupied — this is what the Factory Map's node icon reflects for it.
    const plDrop = await prisma.productionLocation.findUnique({ where: { id: plDropId } });
    expect(plDrop?.status).toBe('FULL');

    // currentLocationCode is set immediately at submit, not on a later
    // webhook — this is what locks the *next* submission to pick up from here.
    const trolley = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    expect(trolley?.currentLocationCode).toBe(plDropCode);

    const activeMine = await request(app.getHttpServer())
      .get('/trolley-activities/active-mine')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(activeMine.body.data).toContainEqual({
      activityId: res.body.data.activity.id,
      taskId: res.body.data.activity.taskId,
      trolleyCode: `${suffix}TRL`,
      trolleyName: `${suffix} Trolley`,
      pickupSource: 'WAREHOUSE',
    });
  });

  it('Production->Warehouse: picked up from where the trolley now is, auto-picks the EMPTY Warehouse Location for dropping, and leaves the activity droppingLocationCode unset until Completed', async () => {
    // generateOrderId() is second-resolution — avoid colliding with the
    // previous test's taskId if both land in the same wall-clock second.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    // The previous test left the trolley's currentLocationCode at
    // plDropCode — the position lock requires picking up from there, not
    // the separate plPickupCode fixture.
    updateStockStatusMock.mockClear();

    const res = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: plDropCode,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);

    // RCS picks its own destination and never confirms it back to us, so
    // this is deliberately left unset until the task is confirmed complete
    // (status 8) — see ReceiveTaskStatusWebhookUseCase.
    expect(res.body.data.activity.droppingLocationCode).toBeNull();

    // Both calls target the scanned pickup node — RCS owns the dropping
    // node's status itself once its robot completes delivery there.
    expect(updateStockStatusMock).toHaveBeenCalledWith(plDropCode, '0');
    expect(updateStockStatusMock).toHaveBeenCalledWith(plDropCode, '2');

    const whDrop = await prisma.warehouseLocation.findUnique({ where: { id: whDropId } });
    expect(whDrop?.status).toBe('FULL');

    // The Production Location just picked up from is vacated — this is what
    // the Factory Map's node icon reflects for it.
    const plDrop = await prisma.productionLocation.findUnique({ where: { id: plDropId } });
    expect(plDrop?.status).toBe('EMPTY');

    const trolley = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    expect(trolley?.currentLocationCode).toBe(`${suffix}WHDROP`);

    const activeMine = await request(app.getHttpServer())
      .get('/trolley-activities/active-mine')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(activeMine.body.data).toContainEqual({
      activityId: res.body.data.activity.id,
      taskId: res.body.data.activity.taskId,
      trolleyCode: `${suffix}TRL`,
      trolleyName: `${suffix} Trolley`,
      pickupSource: 'PRODUCTION',
    });
  });

  // "No Warehouse Location is EMPTY at all" isn't tested end-to-end here —
  // this dev DB has other real, unrelated EMPTY Warehouse Locations, so
  // forcing that state would mean mutating live data outside this test's
  // own fixtures. findFirstActiveEmpty()'s null case is exercised directly
  // by CreateTrolleyActivityUseCase's own guard (see the source) instead.
});
