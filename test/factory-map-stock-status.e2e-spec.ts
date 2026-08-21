import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { RcsStockStatusService } from './../src/modules/rcs-stock-status/rcs-stock-status.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies GET /factory-maps/stock-status — proxies RCS's own getStockStatus
// and maps its 0/2 vocabulary to EMPTY/FULL, dropping anything else instead
// of guessing. RCS itself is mocked (real network unreachable here).
describe('GET /factory-maps/stock-status (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2ESTOCKMAP${Date.now()}`;

  let accessToken: string;
  let testUserId: string;
  const testUsername = `${suffix}user`;
  const testPassword = 'E2eTestPass123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RcsStockStatusService)
      .useValue({
        updateStockStatus: jest.fn().mockResolvedValue(undefined),
        getStockStatus: jest.fn().mockResolvedValue([
          { areaId: '1', inTask: '', qrContent: `${suffix}EMPTY1`, stockStatus: 0 },
          { areaId: '1', inTask: '', qrContent: `${suffix}FULL1`, stockStatus: 2 },
          { areaId: '1', inTask: '', qrContent: `${suffix}WEIRD1`, stockStatus: 9 },
        ]),
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
        fullName: 'E2E Stock Status Map Test User',
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
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });

  it('rejects a missing areaId', async () => {
    await request(app.getHttpServer())
      .get('/factory-maps/stock-status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('maps RCS stockStatus 0/2 to EMPTY/FULL and drops unrecognized values', async () => {
    const res = await request(app.getHttpServer())
      .get('/factory-maps/stock-status')
      .query({ areaId: 1 })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toEqual([
      { code: `${suffix}EMPTY1`, status: 'EMPTY' },
      { code: `${suffix}FULL1`, status: 'FULL' },
    ]);
  });
});
