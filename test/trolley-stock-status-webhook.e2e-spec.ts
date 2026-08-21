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

// Verifies the "Picked"/"Placed" webhook handling added to
// ReceiveTaskStatusWebhookUseCase, and the position lock it feeds
// (CreateTrolleyActivityUseCase rejects a pickup that doesn't match
// Trolley.currentLocationCode). RCS itself is stubbed out (both the task
// order submission and the stock-status calls) — this proves our own
// DB/webhook wiring, not the live network calls.
describe('Trolley stock-status webhook + position lock (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2ESTOCK${Date.now()}`;

  let accessToken: string;
  let testUserId: string;
  const testUsername = `${suffix}user`;
  const testPassword = 'E2eTestPass123!';
  let trolleyId: string;
  let whPickupCode: string;
  let plDropCode: string;
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

    whPickupCode = `${suffix}WHPICK`;
    await prisma.warehouseLocation.create({
      data: { name: `${suffix} WH Pickup`, iRaypleLocationCode: whPickupCode, isActive: true, status: 'FULL' },
    });

    plDropCode = `${suffix}PLDROP`;
    await prisma.productionLocation.create({
      data: { name: `${suffix} PL Drop`, iRaypleLocationCode: plDropCode, isActive: true },
    });

    const trolley = await prisma.trolley.create({
      data: {
        name: `${suffix} Trolley`,
        code: `${suffix}TRL`,
        status: 'EMPTY',
        modelCodeProcessId: mcp.id,
        droppingLocationCode: plDropCode,
      },
    });
    trolleyId = trolley.id;
  });

  afterAll(async () => {
    await prisma.trolleyActivity.deleteMany({ where: { trolleyId } });
    await prisma.trolley.deleteMany({ where: { id: trolleyId } });
    await prisma.warehouseLocation.deleteMany({ where: { iRaypleLocationCode: whPickupCode } });
    await prisma.productionLocation.deleteMany({ where: { iRaypleLocationCode: plDropCode } });
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });

  it('submitting before any Placed event has no position lock (currentLocationCode still null)', async () => {
    const trolley = await prisma.trolley.findUnique({ where: { id: trolleyId } });
    expect(trolley?.currentLocationCode).toBeNull();
  });

  let firstTaskId: string;

  it('submits Warehouse->Production, then Picked/Placed webhooks call RCS stock status and advance currentLocationCode', async () => {
    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    const createRes = await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: whPickupCode,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);

    firstTaskId = createRes.body.data.activity.taskId;

    updateStockStatusMock.mockClear();

    // Picked (21) — robot has lifted the trolley off the Warehouse pickup.
    await request(app.getHttpServer())
      .post('/webhooks-logs')
      .send({ orderId: firstTaskId, deviceCode: 'AMR-E2E-STOCK', status: '21', subTaskSeq: '2' })
      .expect(200);

    expect(updateStockStatusMock).toHaveBeenCalledWith(whPickupCode, '0');

    updateStockStatusMock.mockClear();

    // Placed (23) — robot has set the trolley down at the Production dropping.
    await request(app.getHttpServer())
      .post('/webhooks-logs')
      .send({ orderId: firstTaskId, deviceCode: 'AMR-E2E-STOCK', status: '23', subTaskSeq: '4' })
      .expect(200);

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

  it('accepts the next submission once its pickup matches currentLocationCode', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const lookupTrolley = await request(app.getHttpServer())
      .post('/trolley-activities/lookup-trolley')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: `${suffix}TRL` })
      .expect(201);

    // Correct — pickup is exactly where the trolley currently is.
    await request(app.getHttpServer())
      .post('/trolley-activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trolleyId,
        pickupLocationCode: plDropCode,
        startDate: lookupTrolley.body.data.startDate,
      })
      .expect(201);
  });
});
