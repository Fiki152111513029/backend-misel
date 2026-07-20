import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function createContext(user: { role: string } | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows the request when no roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as never;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext({ role: 'Operator' }))).toBe(true);
  });

  it('denies the request when the user role is not in the required list', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['Super Admin', 'Admin']),
    } as never;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext({ role: 'Operator' }))).toBe(false);
  });

  it('allows the request when the user role is in the required list', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['Super Admin', 'Admin']),
    } as never;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext({ role: 'Admin' }))).toBe(true);
  });
});
