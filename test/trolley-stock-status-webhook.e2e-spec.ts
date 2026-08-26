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

// Verifies the RCS stock-status calls Drop Trolley's Submit fires — both
// nodeStatus '0' and nodeStatus '2', both for the scanned pickup node, all
// at submit time (see CreateTrolleyActivityUseCase; RCS owns the dropping
// node's own status itself once its robot completes delivery there, so
// that one is never reported by us). The earlier scan-trolley/scan-area
// steps (lookup-trolley, lookup-location) are pure read-only lookups with
// no RCS side effect — the node to empty/fill is only ever the one
// actually confirmed by the operator's own area scan, at submit, not
// inferred earlier. Also verifies the position lock
// (CreateTrolleyActivityUseCase rejects a pickup that doesn't match
// Trolley.currentLocationCode, set immediately at submit time, not from a
// later webhook), the Operator-direction (Production->Warehouse)
// TrolleyActivity.droppingLocationCode backfill on a status=8 (Completed)
// webhook, and the standalone Take Trolley action (its own endpoint —
// empties the scanned node in RCS but persists nothing at all; the only
// place a TrolleyActivity row is ever written is Drop Trolley's own
// submit, in one step). RCS itself is stubbed out (both the task order
// submission and the stock-status calls) — this proves our own DB/webhook
// wiring, not the live network calls.
describe('Trolley stock-status + position lock (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2ESTOCK${Date.now()}`;

  let accessToken: string;
  let testUserId: string;
  const testUsername = `${suffix}user`;
  const testPassword = 'E2eTestPass123!';
  let trolleyCategoryId: string;
  let trolleyId: string;
  let whPickupCode: string;
  let plDropCode: string;
  let updateStockStatusMock: jest.Mock;
  let addTaskMock: jest.Mock;
  let mcpName: string;

  beforeAll(async () => {
    updateStockStatusMock = jest.fn().mockResolvedValue(undefined);
    addTaskMock = jest.fn().mockResolvedValue({ code: 1000, desc: 'ok' });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TaskOrderService)
      .useValue({
        addTask: addTaskMock,
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

    const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
    if (!superAdminRole) throw new Error('No Super Admin role seeded — cannot run test');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const testUser = await prisma.user.create({
      data: {
        username: testUsername,
        email: `${testUsername}@example.com`,
        fullName: 'E2E Stock Status Test User',
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
    mcpName = mcp.name;

    whPickupCode = `${suffix}WHPICK`;
    await prisma.warehouseLocation.create({
      data: { name: `${suffix} WH Pickup`, iRaypleLocationCode: whPickupCode, isActive: true, status: 'FULL' },
    });

    plDropCode = `${suffix}PLDROP`;
    await prisma.productionLocation.create({
      data: { name: `${suffix} PL Drop`, iRaypleLocationCode: plDropCode, isActive: true },
    });

    // Production->Warehouse (Operator Trolley Task) resolves
    // modelProcessCode from the trolley's Category, not the trolley itself.
    const trolleyCategory = await prisma.trolleyCategory.create({
      data: { name: `${suffix} Category`, modelCodeProcessId: mcp.id },
    });
    trolleyCategoryId = trolleyCategory.id;

    const trolley = await prisma.trolley.create({
      data: {
        name: `${suffix} Trolley`,
        code: `${suffix}TRL`,
        status: 'EMPTY',
        modelCodeProcessId: mcp.id,
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
    await prisma.warehouseLocation.deleteMany({ where: { iRaypleLocationCode: whPickupCode } });
    await prisma.productionLocation.deleteMany({ where: { iRaypleLocationCode: plDropCode } });
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });

  it('before any Trolley Task has ever been submitted, there is no position lock (currentLocationCode still null)', async () => {
    const trolley = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    expect(trolley?.currentLocationCode).toBeNull();
  });

  it('Scan Trolley confirm has no RCS side effect; Submit calls RCS stock status with nodeStatus 0 then nodeStatus 2, both for the pickup node', async () => {
    updateStockStatusMock.mockClear();

    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    expect(updateStockStatusMock).not.toHaveBeenCalled();

    const createRes = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: whPickupCode,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);

    // Warehouse->Production: known for certain up front, so this is the
    // trolley's own fixed dropping code.
    expect(createRes.body.data.activity.droppingLocationCode).toBe(plDropCode);
    // Both calls target the scanned pickup node — RCS owns the dropping
    // node's status itself once its robot completes delivery there.
    expect(updateStockStatusMock).toHaveBeenCalledWith(whPickupCode, '0');
    expect(updateStockStatusMock).toHaveBeenCalledWith(whPickupCode, '2');

    const trolley = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    expect(trolley?.currentLocationCode).toBe(plDropCode);
  });

  it('rejects the next submission if its pickup does not match currentLocationCode', async () => {
    // generateOrderId() is second-resolution — avoid colliding with the
    // previous test's taskId.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      // Wrong — trolley is now at plDropCode (Production), not the
      // Warehouse pickup it started from.
      .send({
        trolleyId,
        pickupLocationCode: whPickupCode,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(400);

    expect(res.body.message).toContain(plDropCode);
  });

  let operatorActivityId: string;
  let operatorTaskId: string;
  let operatorDropCode: string;

  it('accepts the next submission once its pickup matches currentLocationCode, with the Operator-direction RCS payload, and leaves droppingLocationCode unset', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    addTaskMock.mockClear();
    updateStockStatusMock.mockClear();

    // Correct — pickup is exactly where the trolley currently is. This is
    // the Operator Trolley Task direction (pickup resolves to a Production
    // Location), so the RCS payload should use the trolley's Category's
    // Model Code Process, a fixed priority of 6, and a taskPath that's just
    // the pickup point — not "pickup,dropping".
    const res = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: plDropCode,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);

    expect(addTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelProcessCode: mcpName,
        priority: 6,
        taskOrderDetail: [{ taskPath: plDropCode }],
      }),
    );

    // RCS picks its own destination for this direction and never confirms
    // it back to us at submit time — left unset until a status=8 webhook
    // confirms the task actually finished (see next test).
    expect(res.body.data.activity.droppingLocationCode).toBeNull();

    const trolley = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    expect(trolley?.currentLocationCode).toBeTruthy();
    expect(trolley?.currentLocationCode).not.toBe(plDropCode);

    // Both calls target the scanned pickup node — RCS owns the dropping
    // node's status itself once its robot completes delivery there, so the
    // auto-picked Warehouse Location (trolley.currentLocationCode) is never
    // reported to RCS by us at all.
    expect(updateStockStatusMock).toHaveBeenCalledWith(plDropCode, '0');
    expect(updateStockStatusMock).toHaveBeenCalledWith(plDropCode, '2');

    operatorActivityId = res.body.data.activity.id;
    operatorTaskId = res.body.data.activity.taskId;
    operatorDropCode = trolley!.currentLocationCode!;
  });

  it('backfills droppingLocationCode once RCS reports the Operator-direction task Completed (status 8)', async () => {
    let activity = await prisma.trolleyActivity.findUnique({ where: { id: operatorActivityId } });
    expect(activity?.droppingLocationCode).toBeNull();

    await request(app.getHttpServer())
      .post('/webhooks-logs')
      .send({ orderId: operatorTaskId, deviceCode: 'AMR-E2E-STOCK', status: '8' })
      .expect(200);

    activity = await prisma.trolleyActivity.findUnique({ where: { id: operatorActivityId } });
    expect(activity?.droppingLocationCode).toBe(operatorDropCode);
    expect(activity?.status).toBe('COMPLETED');
  });

  it('take-trolley empties the scanned node via RCS and persists nothing (no activity, no RCS task order, position lock untouched)', async () => {
    updateStockStatusMock.mockClear();
    addTaskMock.mockClear();

    const activityCountBefore = await prisma.trolleyActivity.count({ where: { trolleyId } });
    const trolleyBefore = await prisma.trolley.findUnique({ where: { id: trolleyId } });

    const res = await request(app.getHttpServer())
      .post('/trolley-activities/take-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ trolleyId, pickupLocationCode: whPickupCode })
      .expect(201);

    expect(updateStockStatusMock).toHaveBeenCalledWith(whPickupCode, '0');
    expect(addTaskMock).not.toHaveBeenCalled();
    expect(res.body.data).toMatchObject({
      trolleyId,
      trolleyCode: `${suffix}TRL`,
      trolleyName: `${suffix} Trolley`,
      pickupLocationCode: whPickupCode,
    });
    expect(typeof res.body.data.startDate).toBe('string');

    const activityCountAfter = await prisma.trolleyActivity.count({ where: { trolleyId } });
    expect(activityCountAfter).toBe(activityCountBefore);

    const trolleyAfter = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    expect(trolleyAfter?.currentLocationCode).toBe(trolleyBefore?.currentLocationCode);
    expect(trolleyAfter?.status).toBe(trolleyBefore?.status);
  });

  it('take-trolley rejects a pickup location code that matches neither an active Warehouse Location nor Production Location', async () => {
    updateStockStatusMock.mockClear();

    await request(app.getHttpServer())
      .post('/trolley-activities/take-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ trolleyId, pickupLocationCode: `${suffix}NOPE` })
      .expect(400);

    expect(updateStockStatusMock).not.toHaveBeenCalled();
  });
});
