import { Prisma } from '@prisma/client';

/** True for a Prisma "unique constraint failed" error (P2002). */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
