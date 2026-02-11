import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { findUserByEmail, createUser } from '../repositories/userRepository';
import { JwtPayload } from '../types';

const BCRYPT_ROUNDS = 12;

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export async function signup(
  email: string,
  password: string,
  name: string
): Promise<{ user_id: string; email: string; name: string }> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 400, '이미 사용 중인 이메일입니다.');
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user_id = uuidv4();
  const user = await createUser(user_id, email, password_hash, name);

  return { user_id: user.user_id, email: user.email, name: user.name };
}

export async function login(
  email: string,
  password: string
): Promise<{
  access_token: string;
  refresh_token: string;
  user: { user_id: string; email: string; name: string };
}> {
  const user = await findUserByEmail(email);

  if (!user || !user.password_hash) {
    throw new AppError('INVALID_CREDENTIALS', 401, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError('INVALID_CREDENTIALS', 401, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const payload: JwtPayload = { user_id: user.user_id, email: user.email };

  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets are not configured');
  }

  const access_token = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
  const refresh_token = jwt.sign(payload, jwtRefreshSecret, { expiresIn: '7d' });

  return {
    access_token,
    refresh_token,
    user: { user_id: user.user_id, email: user.email, name: user.name },
  };
}

export async function refreshToken(
  token: string
): Promise<{ access_token: string }> {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtRefreshSecret || !jwtSecret) {
    throw new Error('JWT secrets are not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtRefreshSecret) as JwtPayload;
    const payload: JwtPayload = { user_id: decoded.user_id, email: decoded.email };
    const access_token = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
    return { access_token };
  } catch (_error) {
    throw new AppError(
      'REFRESH_TOKEN_EXPIRED',
      401,
      '세션이 만료되었습니다. 다시 로그인해 주세요.'
    );
  }
}
