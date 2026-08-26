import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies PATCH /trolley-activities/:id/mark-failed (MarkTrolleyActivityFailedUseCase)
// — the admin override for a row stuck PENDING/IN_PROGRESS forever (its RCS
// completion webhook never arrived, or it's an open row Drop Trolley was
// never submitted for). Also verifies its permission gate: only a role with
// trolley-activity.update (Super Admin) can call it — Warehouse/Operator,
// who only ever get trolley-activity.create/read, must be forbidden.
describe('PATCH /trolley-activities/:id/mark-failed (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2EMARKFAILED${Date.now()}`;
  const testPassword = 'E2eTestPass123!';

  let superAdminUserId: string;
  let superAdminToken: string;
  let warehouseUserId: string;
  let warehouseToken: string;

  let trolleyId: string;
  let pendingActivityId: string;
  let completedActivityId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    const hashedPassword = await bcrypt.hash(testPassword, 10);

    async function createUserWithRole(roleName: string, usernameSuffix: string) {
      const role = await prisma.role.findFirst({ where: { name: roleName } });
      if (!role) throw new Error(`No ${roleName} role seeded — cannot run test`);
      const username = `${suffix}${usernameSuffix}`;
      const user = await prisma.user.create({
        data: {
          username,
          email: `${username}@example.com`,
          fullName: `E2E Mark Failed ${roleName}`,
          password: hashedPassword,
          roleId: role.id,
          isActive: true,
        },
      });
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: username, password: testPassword })
        .expect(200);
      return { userId: user.id, token: login.body.accessToken as string };
    }

    const superAdmin = await createUserWithRole('Super Admin', 'sa');
    superAdminUserId = superAdmin.userId;
    superAdminToken = superAdmin.token;

    const warehouse = await createUserWithRole('Warehouse', 'wh');
    warehouseUserId = warehouse.userId;
    warehouseToken = warehouse.token;

    const mcp = await prisma.modelCodeProcess.findFirst({ where: { deletedAt: null } });
    if (!mcp) throw new Error('No active ModelCodeProcess seeded — cannot run test');

    const trolley = await prisma.trolley.create({
      data: {
        name: `${suffix} Trolley`,
        code: `${suffix}TRL`,
        status: 'EMPTY',
        modelCodeProcessId: mcp.id,
      },
    });
    trolleyId = trolley.id;

    const pendingActivity = await prisma.trolleyActivity.create({
      data: {
        userId: superAdminUserId,
        trolleyId,
        statusBeginning: 'EMPTY',
        statusEnd: 'FULL',
        pickupLocationCode: `${suffix}PICKUP`,
        droppingLocationCode: `${suffix}DROP`,
        startDate: new Date(),
        endDate: new Date(),
        taskId: `${suffix}PENDING`,
        status: 'PENDING',
      },
    });
    pendingActivityId = pendingActivity.id;

    const completedActivity = await prisma.trolleyActivity.create({
      data: {
        userId: superAdminUserId,
        trolleyId,
        statusBeginning: 'FULL',
        statusEnd: 'EMPTY',
        pickupLocationCode: `${suffix}PICKUP2`,
        droppingLocationCode: `${suffix}DROP2`,
        startDate: new Date(),
        endDate: new Date(),
        taskId: `${suffix}COMPLETED`,
        status: 'COMPLETED',
      },
    });
    completedActivityId = completedActivity.id;
  });

  afterAll(async () => {
    await prisma.trolleyActivity.deleteMany({ where: { trolleyId } });
    await prisma.trolley.deleteMany({ where: { id: trolleyId } });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [superAdminUserId, warehouseUserId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [superAdminUserId, warehouseUserId] } } });
    await app.close();
  });

  it('Warehouse (no trolley-activity.update permission) is forbidden', async () => {
    await request(app.getHttpServer())
      .patch(`/trolley-activities/${pendingActivityId}/mark-failed`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .expect(403);

    const activity = await prisma.trolleyActivity.findUnique({ where: { id: pendingActivityId } });
    expect(activity?.status).toBe('PENDING');
  });

  it('rejects marking an already-terminal (COMPLETED) activity as failed', async () => {
    await request(app.getHttpServer())
      .patch(`/trolley-activities/${completedActivityId}/mark-failed`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(400);

    const activity = await prisma.trolleyActivity.findUnique({ where: { id: completedActivityId } });
    expect(activity?.status).toBe('COMPLETED');
  });

  it('Super Admin marks a stuck PENDING activity as Failed', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/trolley-activities/${pendingActivityId}/mark-failed`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('FAILED');

    const activity = await prisma.trolleyActivity.findUnique({ where: { id: pendingActivityId } });
    expect(activity?.status).toBe('FAILED');
  });

  it('marking it Failed again is rejected — already terminal now', async () => {
    await request(app.getHttpServer())
      .patch(`/trolley-activities/${pendingActivityId}/mark-failed`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(400);
  });
});
