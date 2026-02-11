import { Request, Response, NextFunction } from 'express';
import { AppError } from '../services/authService';

interface PgError {
  code?: string;
  message: string;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: '요청한 리소스를 찾을 수 없습니다.',
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({
      status: 'error',
      code: err.code,
      message: err.message,
    });
    return;
  }

  // PostgreSQL DB 에러 처리
  if (err && typeof err === 'object' && 'code' in err) {
    const pgErr = err as PgError;
    if (pgErr.code === '23505') {
      res.status(400).json({
        status: 'error',
        code: 'EMAIL_ALREADY_EXISTS',
        message: '이미 사용 중인 이메일입니다.',
      });
      return;
    }
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  });
}
