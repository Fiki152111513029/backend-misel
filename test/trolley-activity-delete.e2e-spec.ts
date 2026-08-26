import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies DELETE /trolley-activities/:id (DeleteTrolleyActivityUseCase) —
// a soft delete (deletedAt set, row kept), matching every other entity in
// this app. Also verifies its permission gate: only a role with
// trolley-activity.delete (Super Admin) can call it — Warehouse/Operator,
// who only ever get trolley-activity.create/read, must be forbidden.
describe('DELETE /trolley-activities/:id (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2EDELACT${Date.now()}`;
  const testPassword = 'E2eTestPass123!';

  let superAdminUserId: string;
  let superAdminToken: string;
  let warehouseUserId: string;
  let warehouseToken: string;

  let trolleyId: string;
  let activityId: string;

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
          fullName: `E2E Delete Activity ${roleName}`,
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

    const activity = await prisma.trolleyActivity.create({
      data: {
        userId: superAdminUserId,
        trolleyId,
        statusBeginning: 'EMPTY',
        statusEnd: 'FULL',
        pickupLocationCode: `${suffix}PICKUP`,
        droppingLocationCode: `${suffix}DROP`,
        startDate: new Date(),
        endDate: new Date(),
        taskId: `${suffix}TASK`,
        status: 'COMPLETED',
      },
    });
    activityId = activity.id;
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

  it('Warehouse (no trolley-activity.delete permission) is forbidden', async () => {
    await request(app.getHttpServer())
      .delete(`/trolley-activities/${activityId}`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .expect(403);

    const activity = await prisma.trolleyActivity.findUnique({ where: { id: activityId } });
    expect(activity?.deletedAt).toBeNull();
  });

  it('rejects deleting an unknown id', async () => {
    await request(app.getHttpServer())
      .delete(`/trolley-activities/${trolleyId}`) // a real UUID, just not a TrolleyActivity id
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(404);
  });

  it('Super Admin soft-deletes the activity — row kept, deletedAt set, no longer returned by GET', async () => {
    await request(app.getHttpServer())
      .delete(`/trolley-activities/${activityId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const activity = await prisma.trolleyActivity.findUnique({ where: { id: activityId } });
    expect(activity).not.toBeNull();
    expect(activity?.deletedAt).not.toBeNull();

    const list = await request(app.getHttpServer())
      .get('/trolley-activities')
      .query({ limit: 100 })
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
    expect(list.body.data.items.map((i: { id: string }) => i.id)).not.toContain(activityId);
  });
});
