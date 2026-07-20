import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthRequestUser } from '../types/auth-request-user.type';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthRequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthRequestUser }>();
    return data ? request.user?.[data] : request.user;
  },
);
