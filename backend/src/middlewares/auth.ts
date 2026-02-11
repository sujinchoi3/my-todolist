import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: '로그인이 필요합니다.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = { user_id: decoded.user_id, email: decoded.email };
    next();
  } catch (_error) {
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: '로그인이 필요합니다.',
    });
  }
}
