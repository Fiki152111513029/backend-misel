import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies GET /trolley-activities scoping (GetTrolleyActivitiesUseCase):
// Warehouse/Operator roles only ever see their own activities, while every
// other role (Super Admin here) sees everyone's. The scope is derived from
// the requesting user's own role server-side — never trusted from the
// client — so this hits the real endpoint as three differently-roled users
// rather than calling the use-case directly.
describe('GET /trolley-activities — own-activities scope for Warehouse/Operator (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2EOWNSCOPE${Date.now()}`;
  const testPassword = 'E2eTestPass123!';

  let superAdminUserId: string;
  let superAdminToken: string;
  let warehouseUserId: string;
  let warehouseToken: string;
  let operatorUserId: string;
  let operatorToken: string;

  let trolleyId: string;
  let superAdminActivityId: string;
  let warehouseActivityId: string;
  let operatorActivityId: string;

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
          fullName: `E2E Own Scope ${roleName}`,
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

    const operator = await createUserWithRole('Operator', 'op');
    operatorUserId = operator.userId;
    operatorToken = operator.token;

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

    // Raw rows inserted directly — this test is about the list endpoint's
    // scoping, not the submit flow (already covered elsewhere).
    async function createActivityFor(userId: string, taskIdSuffix: string) {
      const activity = await prisma.trolleyActivity.create({
        data: {
          userId,
          trolleyId,
          statusBeginning: 'EMPTY',
          statusEnd: 'FULL',
          pickupLocationCode: `${suffix}PICKUP`,
          startDate: new Date(),
          endDate: new Date(),
          taskId: `${suffix}${taskIdSuffix}`,
        },
      });
      return activity.id;
    }

    superAdminActivityId = await createActivityFor(superAdminUserId, 'SA');
    warehouseActivityId = await createActivityFor(warehouseUserId, 'WH');
    operatorActivityId = await createActivityFor(operatorUserId, 'OP');
  });

  afterAll(async () => {
    await prisma.trolleyActivity.deleteMany({ where: { trolleyId } });
    await prisma.trolley.deleteMany({ where: { id: trolleyId } });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [superAdminUserId, warehouseUserId, operatorUserId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [superAdminUserId, warehouseUserId, operatorUserId] } },
    });
    await app.close();
  });

  function activityIds(body: { data: { items: { id: string }[] } }) {
    return body.data.items.map((item) => item.id);
  }

  it('Warehouse only sees its own activities', async () => {
    const res = await request(app.getHttpServer())
      .get('/trolley-activities')
      .query({ limit: 100 })
      .set('Authorization', `Bearer ${warehouseToken}`)
      .expect(200);

    const ids = activityIds(res.body);
    expect(ids).toContain(warehouseActivityId);
    expect(ids).not.toContain(operatorActivityId);
    expect(ids).not.toContain(superAdminActivityId);
  });

  it('Operator only sees its own activities', async () => {
    const res = await request(app.getHttpServer())
      .get('/trolley-activities')
      .query({ limit: 100 })
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);

    const ids = activityIds(res.body);
    expect(ids).toContain(operatorActivityId);
    expect(ids).not.toContain(warehouseActivityId);
    expect(ids).not.toContain(superAdminActivityId);
  });

  it('Super Admin sees everyone\'s activities, unscoped', async () => {
    const res = await request(app.getHttpServer())
      .get('/trolley-activities')
      .query({ limit: 100 })
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const ids = activityIds(res.body);
    expect(ids).toContain(superAdminActivityId);
    expect(ids).toContain(warehouseActivityId);
    expect(ids).toContain(operatorActivityId);
  });
});
