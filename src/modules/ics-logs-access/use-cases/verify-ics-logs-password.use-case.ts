import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { VerifyIcsLogsPasswordDto } from '../dto/verify-ics-logs-password.dto';

// Constant-time comparison so a wrong-length or wrong-content guess can't be
// distinguished by response timing.
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a timingSafeEqual against itself so the elapsed time is
    // comparable to the equal-length branch below.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

@Injectable()
export class VerifyIcsLogsPasswordUseCase {
  constructor(private readonly configService: ConfigService) {}

  execute(dto: VerifyIcsLogsPasswordDto) {
    const expected = this.configService.get<string>('icsLogsAccess.password');
    if (!expected) {
      throw new ServiceUnavailableException(
        'ICS Logs developer password is not configured',
      );
    }

    if (!safeCompare(dto.password, expected)) {
      // 403, not 401 — the caller is already authenticated (a valid JWT is
      // required to reach this route at all); this only signals that the
      // extra ICS Logs password was wrong. A 401 here would trip the HTTP
      // client's global interceptor and log the user out entirely.
      throw new ForbiddenException('Incorrect password');
    }

    return { verified: true };
  }
}
