import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

function createContext(
  user: { permissions: string[] } | undefined,
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  it('allows the request when no permissions are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as never;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(createContext({ permissions: [] }))).toBe(true);
  });

  it('denies the request when the user is missing a required permission', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['user.create']),
    } as never;
    const guard = new PermissionsGuard(reflector);

    expect(
      guard.canActivate(createContext({ permissions: ['user.read'] })),
    ).toBe(false);
  });

  it('allows the request when the user has all required permissions', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue(['user.create', 'user.read']),
    } as never;
    const guard = new PermissionsGuard(reflector);

    expect(
      guard.canActivate(
        createContext({ permissions: ['user.create', 'user.read'] }),
      ),
    ).toBe(true);
  });
});
