import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import multer from 'multer';
import { config } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';

const MAX_FILE_SIZE = config.MAX_FILE_SIZE_MB * 1024 * 1024; // bytes

// File signature (magic bytes) validation
const IMAGE_SIGNATURES: Array<{ mime: string; header: Buffer }> = [
  { mime: 'image/jpeg', header: Buffer.from([0xff, 0xd8, 0xff]) },
  { mime: 'image/png', header: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  { mime: 'image/webp', header: Buffer.from([0x52, 0x49, 0x46, 0x46]) },
];

function detectMimeType(buffer: Buffer): string | null {
  for (const sig of IMAGE_SIGNATURES) {
    if (buffer.subarray(0, sig.header.length).equals(sig.header)) {
      return sig.mime;
    }
  }
  return null;
}

// Multer: store in memory for validation before saving
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error(`Unsupported file type. Allowed: JPEG, PNG, WebP`));
      return;
    }
    cb(null, true);
  },
}).single('image');

export async function uploadRecipeImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Run multer middleware first
  uploadMiddleware(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        sendError(res, 413, `File too large. Maximum size is ${config.MAX_FILE_SIZE_MB}MB`);
        return;
      }
      sendError(res, 400, `Upload error: ${err.message}`);
      return;
    }

    if (err) {
      sendError(res, 400, err.message);
      return;
    }

    if (!req.file) {
      sendError(res, 400, 'No image file provided');
      return;
    }

    try {
      // 1. Validate actual file signature (not browser-supplied MIME)
      const detectedMime = detectMimeType(req.file.buffer);
      if (!detectedMime) {
        sendError(res, 400, 'File content is not a recognized image format');
        return;
      }

      // 2. Decode and re-encode with sharp (rejects corrupted/malicious files)
      const processedBuffer = await sharp(req.file.buffer)
        .jpeg({ quality: 85 })
        .toBuffer();

      // 3. Generate a safe, random filename (no user-supplied paths)
      const filename = `${crypto.randomUUID()}.jpg`;
      const uploadDir = path.resolve(config.UPLOAD_DIR);

      // Create upload dir if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);

      // 4. Prevent path traversal: ensure file path stays inside UPLOAD_DIR
      if (!filePath.startsWith(uploadDir)) {
        sendError(res, 400, 'Invalid file path');
        return;
      }

      fs.writeFileSync(filePath, processedBuffer);

      const imageUrl = `/uploads/${filename}`;

      sendSuccess(res, { imageUrl, filename }, 201, 'Image uploaded successfully');
    } catch (processError) {
      sendError(res, 400, 'Could not process image. File may be corrupted or unsupported.');
      return;
    }
  });
}
