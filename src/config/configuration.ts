export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
  },
  seedSuperAdmin: {
    username: process.env.SEED_SUPER_ADMIN_USERNAME ?? 'superadmin',
    email: process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@example.com',
    fullName: process.env.SEED_SUPER_ADMIN_FULLNAME ?? 'Super Administrator',
    password: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!',
  },
  robotTelemetry: {
    url:
      process.env.ROBOT_TELEMETRY_URL ??
      'http://172.18.101.10:7000/ics/out/device/list/deviceInfo',
    deviceType: process.env.ROBOT_TELEMETRY_DEVICE_TYPE ?? '0',
  },
  taskOrder: {
    url:
      process.env.TASK_ORDER_URL ??
      'http://172.18.101.10:7000/ics/taskOrder/addTask',
    getOrderListUrl:
      process.env.TASK_ORDER_GET_ORDER_LIST_URL ??
      'http://172.18.101.10:7000/ics/out/task/getOrderList',
    areaId: parseInt(process.env.TASK_ORDER_AREA_ID ?? '2', 10),
  },
});
