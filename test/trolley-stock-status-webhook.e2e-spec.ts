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
// nodeStatus '0' for the scanned pickup and nodeStatus '2' for the dropping
// node, all at submit time (see CreateTrolleyActivityUseCase). The earlier
// scan-trolley/scan-area steps (lookup-trolley, lookup-location) are pure
// read-only lookups with no RCS side effect — the node to empty is only
// ever the one actually confirmed by the operator's own area scan, at
// submit, not inferred earlier. Also verifies the position lock
// (CreateTrolleyActivityUseCase rejects a pickup that doesn't match
// Trolley.currentLocationCode, set immediately at submit time, not from a
// later webhook), the Operator-direction (Production->Warehouse)
// TrolleyActivity.droppingLocationCode backfill on a status=8 (Completed)
// webhook, and the standalone Take Trolley action (its own endpoint, empties
// the scanned node but persists nothing). RCS itself is stubbed out (both
// the task order submission and the stock-status calls) — this proves our
// own DB/webhook wiring, not the live network calls.
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

  it('Scan Trolley confirm has no RCS side effect; Submit calls RCS stock status with nodeStatus 0 for the pickup and nodeStatus 2 for the dropping node', async () => {
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
    expect(updateStockStatusMock).toHaveBeenCalledWith(whPickupCode, '0');
    expect(updateStockStatusMock).toHaveBeenCalledWith(plDropCode, '2');

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

    expect(updateStockStatusMock).toHaveBeenCalledWith(plDropCode, '0');

    // Reflects the RCS-auto-picked Warehouse Location's stock status flip,
    // even though we don't yet know it belongs on the activity's own record.
    expect(updateStockStatusMock).toHaveBeenCalledWith(trolley?.currentLocationCode, '2');

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

  it('take-trolley empties the scanned node via RCS and creates an open Trolley Activity row (statusEnd/endDate still null, position lock untouched)', async () => {
    // generateOrderId() is second-resolution — avoid colliding with the
    // previous test's taskId.
    await new Promise((resolve) => setTimeout(resolve, 1100));

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
    expect(typeof res.body.data.activityId).toBe('string');
    expect(typeof res.body.data.statusBeginning).toBe('string');
    expect(typeof res.body.data.startDate).toBe('string');

    // A real open row was created — one more than before, not zero.
    const activityCountAfter = await prisma.trolleyActivity.count({ where: { trolleyId } });
    expect(activityCountAfter).toBe(activityCountBefore + 1);

    const activity = await prisma.trolleyActivity.findUnique({
      where: { id: res.body.data.activityId },
    });
    expect(activity?.pickupLocationCode).toBe(whPickupCode);
    expect(activity?.statusEnd).toBeNull();
    expect(activity?.droppingLocationCode).toBeNull();
    expect(activity?.endDate).toBeNull();
    expect(activity?.taskId).toBeTruthy();

    // No RCS task was ever sent for this row, so it must not surface as an
    // in-flight task — the Current Queue restore endpoint would otherwise
    // show a card for a task that was never actually dispatched.
    const activeMine = await request(app.getHttpServer())
      .get('/trolley-activities/active-mine')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(activeMine.body.data.map((a: { activityId: string }) => a.activityId)).not.toContain(
      res.body.data.activityId,
    );

    // Take Trolley never touches the position lock.
    const trolleyAfter = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    expect(trolleyAfter?.currentLocationCode).toBe(trolleyBefore?.currentLocationCode);
    expect(trolleyAfter?.status).toBe(trolleyBefore?.status);
  });

  it('take-trolley rejects a pickup location code that matches neither an active Warehouse Location nor Production Location', async () => {
    updateStockStatusMock.mockClear();

    const activityCountBefore = await prisma.trolleyActivity.count({ where: { trolleyId } });

    await request(app.getHttpServer())
      .post('/trolley-activities/take-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ trolleyId, pickupLocationCode: `${suffix}NOPE` })
      .expect(400);

    expect(updateStockStatusMock).not.toHaveBeenCalled();
    const activityCountAfter = await prisma.trolleyActivity.count({ where: { trolleyId } });
    expect(activityCountAfter).toBe(activityCountBefore);
  });

  it('Take Trolley then Drop Trolley for the same trolley completes the same open row instead of creating a second one', async () => {
    // generateOrderId() is second-resolution — avoid colliding with the
    // previous test's taskId.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Pick up from wherever the position lock currently points — set by the
    // last Drop Trolley submission earlier in this file.
    const trolleyBefore = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    const pickupCode = trolleyBefore!.currentLocationCode!;

    const takeRes = await request(app.getHttpServer())
      .post('/trolley-activities/take-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ trolleyId, pickupLocationCode: pickupCode })
      .expect(201);

    const openActivityId = takeRes.body.data.activityId;
    const activityCountAfterTake = await prisma.trolleyActivity.count({ where: { trolleyId } });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    const dropRes = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: pickupCode,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);

    // Completed the same row Take Trolley opened — not a second one.
    expect(dropRes.body.data.activity.id).toBe(openActivityId);
    const activityCountAfterDrop = await prisma.trolleyActivity.count({ where: { trolleyId } });
    expect(activityCountAfterDrop).toBe(activityCountAfterTake);

    const completedActivity = await prisma.trolleyActivity.findUnique({
      where: { id: openActivityId },
    });
    expect(completedActivity?.statusEnd).not.toBeNull();
    expect(completedActivity?.endDate).not.toBeNull();
    // The row's own startDate (from Take Trolley) wins — not overwritten by
    // Drop Trolley's own lookup-trolley timestamp.
    expect(completedActivity?.startDate.toISOString()).toBe(takeRes.body.data.startDate);
  });
});
