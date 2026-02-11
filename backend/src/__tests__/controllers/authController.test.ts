import { Request, Response } from 'express';
import { signupController, loginController, logoutController, refreshTokenController } from '../../controllers/authController';
import * as authService from '../../services/authService';

jest.mock('../../services/authService', () => {
  const actual = jest.requireActual('../../services/authService');
  return {
    ...actual,
    signup: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };
});

const mockSignup = authService.signup as jest.Mock;
const mockLogin = authService.login as jest.Mock;

function mockReqRes(body: object = {}) {
  const req = { body } as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

describe('signupController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 VALIDATION_ERROR for invalid email', async () => {
    const { req, res } = mockReqRes({ email: 'bad', password: 'pass1234', name: '김지수' });
    await signupController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
  });

  it('should return 400 VALIDATION_ERROR for weak password', async () => {
    const { req, res } = mockReqRes({ email: 'test@test.com', password: 'short', name: '김지수' });
    await signupController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 201 with user data on success', async () => {
    mockSignup.mockResolvedValue({ user_id: 'uuid-1', email: 'test@test.com', name: '김지수' });
    const { req, res } = mockReqRes({ email: 'test@test.com', password: 'pass1234', name: '김지수' });
    await signupController(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user_id: 'uuid-1', email: 'test@test.com', name: '김지수' });
  });

  it('should return 400 EMAIL_ALREADY_EXISTS on duplicate email', async () => {
    mockSignup.mockRejectedValue(
      new authService.AppError('EMAIL_ALREADY_EXISTS', 400, '이미 사용 중인 이메일입니다.')
    );
    const { req, res } = mockReqRes({ email: 'dup@test.com', password: 'pass1234', name: '김지수' });
    await signupController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'EMAIL_ALREADY_EXISTS' })
    );
  });

  it('should re-throw unexpected errors', async () => {
    mockSignup.mockRejectedValue(new Error('DB connection failed'));
    const { req, res } = mockReqRes({ email: 'test@test.com', password: 'pass1234', name: '김지수' });
    await expect(signupController(req, res)).rejects.toThrow('DB connection failed');
  });
});

describe('loginController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 VALIDATION_ERROR for missing email', async () => {
    const { req, res } = mockReqRes({ password: 'pass1234' });
    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 200 with access_token and set cookie on success', async () => {
    mockLogin.mockResolvedValue({
      access_token: 'acc-token',
      refresh_token: 'ref-token',
      user: { user_id: 'uuid-1', email: 'test@test.com', name: '김지수' },
    });
    const { req, res } = mockReqRes({ email: 'test@test.com', password: 'pass1234' });
    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: 'acc-token' })
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'ref-token',
      expect.objectContaining({ httpOnly: true })
    );
  });

  it('should return 401 INVALID_CREDENTIALS on wrong password', async () => {
    mockLogin.mockRejectedValue(
      new authService.AppError('INVALID_CREDENTIALS', 401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    );
    const { req, res } = mockReqRes({ email: 'test@test.com', password: 'wrong' });
    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INVALID_CREDENTIALS' })
    );
  });
});

describe('logoutController', () => {
  it('should clear refreshToken cookie and return 200', () => {
    const { req, res } = mockReqRes();
    logoutController(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
  });
});

describe('refreshTokenController', () => {
  let mockRefreshToken: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshToken = authService.refreshToken as jest.Mock;
  });

  it('should return 401 when no refreshToken cookie', async () => {
    const req = { cookies: {} } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    await refreshTokenController(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'REFRESH_TOKEN_EXPIRED' })
    );
  });

  it('should return 401 when refreshToken cookie is undefined', async () => {
    const req = { cookies: undefined } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    await refreshTokenController(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 200 with new access_token on success', async () => {
    mockRefreshToken.mockResolvedValue({ access_token: 'new-access-token' });
    const req = { cookies: { refreshToken: 'valid-refresh-token' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    await refreshTokenController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ access_token: 'new-access-token' });
  });

  it('should return 401 when refresh token is expired/invalid', async () => {
    mockRefreshToken.mockRejectedValue(
      new authService.AppError('REFRESH_TOKEN_EXPIRED', 401, '세션이 만료되었습니다. 다시 로그인해 주세요.')
    );
    const req = { cookies: { refreshToken: 'expired-token' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    await refreshTokenController(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'REFRESH_TOKEN_EXPIRED' })
    );
  });
});

describe('logoutController (BE-07)', () => {
  it('should clear refreshToken cookie and return 200 with Logged out message', () => {
    const { req, res } = mockReqRes();
    logoutController(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ path: '/' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
  });

  it('should return 200 even without authentication (idempotent)', () => {
    const req = { headers: {} } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    } as unknown as Response;
    logoutController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
