import { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/env';
import { sendSuccess, sendError, AppError } from '../utils/response';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.COOKIE_SECURE,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function signToken(userId: string): string {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email });
    // Deliberately vague: don't reveal whether email is registered
    if (existing) {
      // Use same response time to avoid timing attacks
      await argon2.hash('dummy-password-to-prevent-timing-attack');
      sendError(res, 409, 'An account with that email already exists');
      return;
    }

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await User.create({
      displayName: data.displayName,
      email: data.email,
      passwordHash,
    });

    const token = signToken(user._id.toString());
    res.cookie('token', token, COOKIE_OPTIONS);

    sendSuccess(res, { user: user.toJSON() }, 201, 'Account created successfully');
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, err.errors.map(e => e.message).join('; '));
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select('+passwordHash');

    // Always hash to prevent timing attacks that reveal whether email exists
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy';
    const passwordHash = user?.passwordHash ?? dummyHash;

    let valid = false;
    try {
      valid = await argon2.verify(passwordHash, data.password);
    } catch {
      valid = false;
    }

    if (!user || !valid) {
      sendError(res, 401, 'Invalid email or password');
      return;
    }

    const token = signToken(user._id.toString());
    res.cookie('token', token, COOKIE_OPTIONS);

    sendSuccess(res, { user: user.toJSON() }, 200, 'Logged in successfully');
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, err.errors.map(e => e.message).join('; '));
      return;
    }
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie('token', COOKIE_OPTIONS);
  sendSuccess(res, null, 200, 'Logged out successfully');
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!._id).lean();
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
