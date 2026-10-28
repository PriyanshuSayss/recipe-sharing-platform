import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/response';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Don't expose stack traces to the client
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
    });
    return;
  }

  // Mongoose duplicate key error
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    res.status(409).json({ success: false, error: 'A duplicate record already exists' });
    return;
  }

  console.error('[Unhandled Error]', err);

  res.status(500).json({ success: false, error: 'An internal server error occurred' });
}
