import { Request, Response } from 'express';
import { signup, login, refreshToken, AppError } from '../services/authService';
import { validateSignup, validateLogin } from '../utils/validation';

export async function signupController(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body;

  const errors = validateSignup(email, password, name);
  if (errors.length > 0) {
    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: '입력값이 올바르지 않습니다.',
      details: errors,
    });
    return;
  }

  try {
    const user = await signup(email, password, name);
    res.status(201).json(user);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpStatus).json({
        status: 'error',
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const errors = validateLogin(email, password);
  if (errors.length > 0) {
    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: '입력값이 올바르지 않습니다.',
      details: errors,
    });
    return;
  }

  try {
    const { access_token, refresh_token, user } = await login(email, password);

    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({ access_token, user });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpStatus).json({
        status: 'error',
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}

export function logoutController(_req: Request, res: Response): void {
  res.clearCookie('refreshToken', { path: '/' });
  res.status(200).json({ message: 'Logged out' });
}

export async function refreshTokenController(req: Request, res: Response): Promise<void> {
  const token: string | undefined = req.cookies?.refreshToken;

  if (!token) {
    res.status(401).json({
      status: 'error',
      code: 'REFRESH_TOKEN_EXPIRED',
      message: '세션이 만료되었습니다. 다시 로그인해 주세요.',
    });
    return;
  }

  try {
    const result = await refreshToken(token);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpStatus).json({
        status: 'error',
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}
