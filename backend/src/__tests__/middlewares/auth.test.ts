import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middlewares/auth';

jest.mock('jsonwebtoken');

const mockJwtVerify = jwt.verify as jest.Mock;

function mockReqRes(authHeader?: string) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should return 401 when Authorization header is missing', () => {
    const { req, res, next } = mockReqRes();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UNAUTHORIZED' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when header does not start with Bearer', () => {
    const { req, res, next } = mockReqRes('Basic sometoken');
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    mockJwtVerify.mockImplementation(() => {
      throw new jwt.JsonWebTokenError('invalid token');
    });
    const { req, res, next } = mockReqRes('Bearer invalid-token');
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is expired', () => {
    mockJwtVerify.mockImplementation(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });
    const { req, res, next } = mockReqRes('Bearer expired-token');
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next when token is valid', () => {
    const payload = { user_id: 'uuid-1', email: 'test@test.com' };
    mockJwtVerify.mockReturnValue(payload);
    const { req, res, next } = mockReqRes('Bearer valid-token');
    authMiddleware(req, res, next);
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
