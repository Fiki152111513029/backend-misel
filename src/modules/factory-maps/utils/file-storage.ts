import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const UPLOAD_SUBDIR = 'factory-maps';
export const UPLOAD_ROOT = join(process.cwd(), 'uploads', UPLOAD_SUBDIR);

if (!existsSync(UPLOAD_ROOT)) {
  mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const factoryMapMulterOptions = {
  storage: diskStorage({
    destination: UPLOAD_ROOT,
    filename: (_req, file: Express.Multer.File, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, accept: boolean) => void,
  ) => {
    if (file.fieldname === 'image' && !ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      callback(
        new BadRequestException('Image must be JPEG, PNG, or WebP'),
        false,
      );
      return;
    }
    if (file.fieldname === 'topology' && file.mimetype !== 'application/json') {
      callback(new BadRequestException('Topology file must be JSON'), false);
      return;
    }
    callback(null, true);
  },
};

/** Relative, servable path (e.g. /uploads/factory-maps/xxx.jpg) for a just-saved multer file. */
export function toRelativePath(file: Express.Multer.File): string {
  return `/uploads/${UPLOAD_SUBDIR}/${file.filename}`;
}

export function toPublicUrl(publicBaseUrl: string, relativePath: string): string;
export function toPublicUrl(
  publicBaseUrl: string,
  relativePath: string | null | undefined,
): string | null;
export function toPublicUrl(
  publicBaseUrl: string,
  relativePath: string | null | undefined,
): string | null {
  return relativePath ? `${publicBaseUrl}${relativePath}` : null;
}

/** Best-effort delete — a missing file (already cleaned up, moved, etc.) is not an error here. */
export function deleteUploadedFile(relativePath: string | null | undefined): void {
  const filename = relativePath?.split('/').pop();
  if (!filename) return;
  const fullPath = join(UPLOAD_ROOT, filename);
  try {
    unlinkSync(fullPath);
  } catch {
    // Non-fatal
  }
}
