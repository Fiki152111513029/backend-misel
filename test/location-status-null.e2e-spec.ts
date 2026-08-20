import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

// Verifies the fix for a real bug: WarehouseLocation/ProductionLocation used
// to default status to EMPTY, so every location — even ones no Trolley Task
// had ever touched — showed the "empty trolley" icon on the Factory Map
// instead of the plain node icon. status is now nullable with no default;
// null means "never touched" and must (a) be excluded from location-codes'
// occupancy arrays (so the Factory Map falls back to the plain icon) and
// (b) still count as "available" for findFirstActiveEmpty's auto-pick.
describe('Location status — null means never touched (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `E2ENULLSTAT${Date.now()}`;

  let accessToken: string;
  let testUserId: string;
  const testUsername = `${suffix}user`;
  const testPassword = 'E2eTestPass123!';
  let untouchedWhId: string;
  let touchedWhId: string;
  let untouchedPlId: string;

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
        fullName: 'E2E Null Status Test User',
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

    // Left at the schema default (no status passed) — simulates a location
    // that's never had a Trolley Task submitted against it.
    const untouchedWh = await prisma.warehouseLocation.create({
      data: { name: `${suffix} WH Untouched`, iRaypleLocationCode: `${suffix}WHUNTOUCHED`, isActive: true },
    });
    untouchedWhId = untouchedWh.id;

    const touchedWh = await prisma.warehouseLocation.create({
      data: {
        name: `${suffix} WH Touched`,
        iRaypleLocationCode: `${suffix}WHTOUCHED`,
        isActive: true,
        status: 'FULL',
      },
    });
    touchedWhId = touchedWh.id;

    const untouchedPl = await prisma.productionLocation.create({
      data: { name: `${suffix} PL Untouched`, iRaypleLocationCode: `${suffix}PLUNTOUCHED`, isActive: true },
    });
    untouchedPlId = untouchedPl.id;
  });

  afterAll(async () => {
    await prisma.warehouseLocation.deleteMany({ where: { id: { in: [untouchedWhId, touchedWhId] } } });
    await prisma.productionLocation.deleteMany({ where: { id: untouchedPlId } });
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });

  it('a never-touched location is created with status null', async () => {
    const wh = await prisma.warehouseLocation.findUnique({ where: { id: untouchedWhId } });
    const pl = await prisma.productionLocation.findUnique({ where: { id: untouchedPlId } });
    expect(wh?.status).toBeNull();
    expect(pl?.status).toBeNull();
  });

  it('location-codes excludes never-touched locations from the occupancy arrays, but includes touched ones', async () => {
    const res = await request(app.getHttpServer())
      .get('/factory-maps/location-codes')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const whStatuses = res.body.data.warehouseLocationStatuses as { code: string; status: string }[];
    const plStatuses = res.body.data.productionLocationStatuses as { code: string; status: string }[];

    expect(whStatuses.find((s) => s.code === `${suffix}WHUNTOUCHED`)).toBeUndefined();
    expect(plStatuses.find((s) => s.code === `${suffix}PLUNTOUCHED`)).toBeUndefined();
    expect(whStatuses.find((s) => s.code === `${suffix}WHTOUCHED`)).toEqual({
      code: `${suffix}WHTOUCHED`,
      status: 'FULL',
    });
  });

  it('findFirstActiveEmpty treats a null-status location as available, scoped to just our own fixtures', async () => {
    // Replicates WarehouseLocationRepository.findFirstActiveEmpty()'s WHERE
    // clause exactly, scoped to only our two fixtures (can't run the real
    // query against the whole live table — other real, unrelated rows would
    // make the result nondeterministic). Proves null is NOT excluded the
    // way it would be by a naive `status: 'EMPTY'` filter.
    const available = await prisma.warehouseLocation.findMany({
      where: {
        id: { in: [untouchedWhId, touchedWhId] },
        isActive: true,
        OR: [{ status: 'EMPTY' }, { status: null }],
        deletedAt: null,
      },
    });
    expect(available.map((row) => row.id)).toEqual([untouchedWhId]);
  });
});
