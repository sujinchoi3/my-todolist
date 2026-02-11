import { Request, Response, NextFunction } from 'express';
import { notFoundHandler, errorHandler } from '../../middlewares/errorHandler';
import { AppError } from '../../services/authService';

function mockReqRes() {
  const req = {} as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('notFoundHandler', () => {
  it('404 상태와 NOT_FOUND 코드를 반환해야 한다', () => {
    const { req, res } = mockReqRes();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'NOT_FOUND',
      message: '요청한 리소스를 찾을 수 없습니다.',
    });
  });
});

describe('errorHandler', () => {
  it('AppError는 httpStatus와 code로 응답해야 한다', () => {
    const { req, res, next } = mockReqRes();
    const err = new AppError('TODO_NOT_FOUND', 404, '해당 할일을 찾을 수 없습니다.');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'TODO_NOT_FOUND',
      message: '해당 할일을 찾을 수 없습니다.',
    });
  });

  it('AppError 403 FORBIDDEN 을 처리해야 한다', () => {
    const { req, res, next } = mockReqRes();
    const err = new AppError('FORBIDDEN', 403, '접근 권한이 없습니다.');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'FORBIDDEN',
      message: '접근 권한이 없습니다.',
    });
  });

  it('PostgreSQL 23505 에러는 400 EMAIL_ALREADY_EXISTS 로 응답해야 한다', () => {
    const { req, res, next } = mockReqRes();
    const pgError = Object.assign(new Error('duplicate key'), { code: '23505' });

    errorHandler(pgError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'EMAIL_ALREADY_EXISTS',
      message: '이미 사용 중인 이메일입니다.',
    });
  });

  it('예상 못한 에러는 500 INTERNAL_SERVER_ERROR 로 응답해야 한다', () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('something went wrong');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    });

    consoleSpy.mockRestore();
  });

  it('null 에러도 500으로 처리해야 한다', () => {
    const { req, res, next } = mockReqRes();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(null, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });

  it('PostgreSQL 기타 에러 코드는 500으로 처리해야 한다', () => {
    const { req, res, next } = mockReqRes();
    const pgError = Object.assign(new Error('connection error'), { code: '08006' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(pgError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });
});
