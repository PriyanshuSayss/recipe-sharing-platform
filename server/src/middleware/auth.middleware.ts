import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User';
import { sendError } from '../utils/response';

export interface AuthPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: { _id: string; displayName: string; email: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    sendError(res, 401, 'Authentication required');
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    // Attach user ID — full user fetched only when needed
    req.user = { _id: payload.userId, displayName: '', email: '' };
    next();
  } catch {
    sendError(res, 401, 'Invalid or expired session. Please log in again.');
  }
}

/**
 * Optional auth — does NOT reject unauthenticated requests.
 * Populates req.user if a valid token is present.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    const user = await User.findById(payload.userId).lean();
    if (user) {
      req.user = {
        _id: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
      };
    }
  } catch {
    // Invalid token — treat as unauthenticated
  }

  next();
}
