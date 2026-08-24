import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies the fix for a real bug: GET /webhooks-logs/latest resolves
// subTaskSeq into a human-readable statusComment by looking up the Model
// Code Process behind the taskId — but findModelProcessCodeNameByOrderId
// only checked Task and WarehouseCartTask, never TrolleyActivity, so the
// Current Queue card for a Trolley Task always showed a bare subTaskSeq
// number with no comment text.
describe('GET /webhooks-logs/latest resolves statusComment for Trolley Activities (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2ESTATUSCMT${Date.now()}`;

  let accessToken: string;
  let testUserId: string;
  const testUsername = `${suffix}user`;
  const testPassword = 'E2eTestPass123!';
  let mcpId: string;
  let originalComment3: string;
  let trolleyId: string;
  const taskId = `${suffix}TASK`;

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
        fullName: 'E2E Status Comment Test User',
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
    originalComment3 = mcp.statusComment3;
    await prisma.modelCodeProcess.update({
      where: { id: mcpId },
      data: { statusComment3: 'Carrying Trolley' },
    });

    const trolley = await prisma.trolley.create({
      data: {
        name: `${suffix} Trolley`,
        code: `${suffix}TRL`,
        status: 'EMPTY',
        modelCodeProcessId: mcpId,
      },
    });
    trolleyId = trolley.id;

    await prisma.trolleyActivity.create({
      data: {
        userId: testUserId,
        trolleyId,
        statusBeginning: 'FULL',
        statusEnd: 'EMPTY',
        pickupLocationCode: `${suffix}PICK`,
        droppingLocationCode: `${suffix}DROP`,
        startDate: new Date(),
        endDate: new Date(),
        taskId,
        status: 'IN_PROGRESS',
      },
    });
  });

  afterAll(async () => {
    await prisma.trolleyActivity.deleteMany({ where: { trolleyId } });
    await prisma.trolley.deleteMany({ where: { id: trolleyId } });
    await prisma.modelCodeProcess.update({
      where: { id: mcpId },
      data: { statusComment3: originalComment3 },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });

  it('resolves statusComment from the Trolley\'s Model Code Process, not just Task/WarehouseCartTask', async () => {
    // status '6' (Running) — deliberately not '21'/'23' (Picked/Placed), so
    // this doesn't also trigger a real (unmocked) RCS stock-status call.
    await request(app.getHttpServer())
      .post('/webhooks-logs')
      .send({ orderId: taskId, deviceCode: 'AMR-E2E-CMT', status: '6', subTaskSeq: '3' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/webhooks-logs/latest')
      .query({ orderId: taskId })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.subTaskSeq).toBe('3');
    expect(res.body.data.statusComment).toBe('Carrying Trolley');
  });
});
