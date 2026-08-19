import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies GET /trolley-activities/active-by-robot end-to-end (real DI
// wiring, real DB) — confirms the new GetActiveTrolleyActivitiesByRobotUseCase
// and its module registration actually work through HTTP, not just at the
// repository/query level.
describe('GET /trolley-activities/active-by-robot (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2EABR${Date.now()}`;

  let accessToken: string;
  let testUserId: string;
  const testUsername = `${suffix}user`;
  const testPassword = 'E2eTestPass123!';
  let robotId: string;
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

    const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
    if (!superAdminRole) throw new Error('No Super Admin role seeded — cannot run test');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const testUser = await prisma.user.create({
      data: {
        username: testUsername,
        email: `${testUsername}@example.com`,
        fullName: 'E2E Active-By-Robot Test User',
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

    const robot = await prisma.robot.create({
      data: {
        name: `${suffix} Robot`,
        amrDeviceSerialNo: `${suffix}SN`,
        amrDeviceNo: `${suffix}NO`,
        areaId: 999,
      },
    });
    robotId = robot.id;

    const trolley = await prisma.trolley.create({
      data: { name: `${suffix} Trolley`, code: `${suffix}TRL`, status: 'EMPTY', modelCodeProcessId: mcp.id },
    });
    trolleyId = trolley.id;

    const activity = await prisma.trolleyActivity.create({
      data: {
        userId: testUserId,
        trolleyId,
        statusBeginning: 'FULL',
        statusEnd: 'EMPTY',
        pickupLocationCode: `${suffix}PICK`,
        droppingLocationCode: `${suffix}DROP`,
        startDate: new Date(),
        endDate: new Date(),
        taskId: `${suffix}TASK`,
        status: 'IN_PROGRESS',
        robotId,
      },
    });
    activityId = activity.id;
  });

  afterAll(async () => {
    await prisma.trolleyActivity.deleteMany({ where: { id: activityId } });
    await prisma.trolley.deleteMany({ where: { id: trolleyId } });
    await prisma.robot.deleteMany({ where: { id: robotId } });
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });

  it('returns the robot carrying what its IN_PROGRESS activity started with (statusBeginning)', async () => {
    const res = await request(app.getHttpServer())
      .get('/trolley-activities/active-by-robot')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const row = (res.body.data as { robotId: string; carrying: string }[]).find(
      (r) => r.robotId === robotId,
    );
    expect(row).toBeDefined();
    expect(row?.carrying).toBe('FULL');
  });

  it('stops appearing once the activity is COMPLETED', async () => {
    await prisma.trolleyActivity.update({ where: { id: activityId }, data: { status: 'COMPLETED' } });

    const res = await request(app.getHttpServer())
      .get('/trolley-activities/active-by-robot')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const row = (res.body.data as { robotId: string }[]).find((r) => r.robotId === robotId);
    expect(row).toBeUndefined();
  });
});
