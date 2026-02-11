import { signup, login, AppError } from '../../services/authService';
import * as userRepository from '../../repositories/userRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockFindUserByEmail = userRepository.findUserByEmail as jest.Mock;
const mockCreateUser = userRepository.createUser as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockJwtSign = jwt.sign as jest.Mock;

describe('signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  it('should create user and return user info on success', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('hashed_password');
    mockCreateUser.mockResolvedValue({
      user_id: 'uuid-1',
      email: 'test@example.com',
      name: '김지수',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const result = await signup('test@example.com', 'pass1234', '김지수');

    expect(result).toEqual({
      user_id: 'uuid-1',
      email: 'test@example.com',
      name: '김지수',
    });
    expect(mockBcryptHash).toHaveBeenCalledWith('pass1234', 12);
    expect(mockCreateUser).toHaveBeenCalled();
  });

  it('should throw AppError EMAIL_ALREADY_EXISTS when email is duplicate', async () => {
    mockFindUserByEmail.mockResolvedValue({
      user_id: 'existing-uuid',
      email: 'test@example.com',
    });

    await expect(signup('test@example.com', 'pass1234', '김지수')).rejects.toMatchObject({
      code: 'EMAIL_ALREADY_EXISTS',
      httpStatus: 400,
    });
  });
});

describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  it('should return tokens and user info on valid credentials', async () => {
    mockFindUserByEmail.mockResolvedValue({
      user_id: 'uuid-1',
      email: 'test@example.com',
      name: '김지수',
      password_hash: 'hashed_password',
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign
      .mockReturnValueOnce('access-token-123')
      .mockReturnValueOnce('refresh-token-456');

    const result = await login('test@example.com', 'pass1234');

    expect(result.access_token).toBe('access-token-123');
    expect(result.refresh_token).toBe('refresh-token-456');
    expect(result.user).toEqual({
      user_id: 'uuid-1',
      email: 'test@example.com',
      name: '김지수',
    });
  });

  it('should throw AppError INVALID_CREDENTIALS when user not found', async () => {
    mockFindUserByEmail.mockResolvedValue(null);

    await expect(login('notexist@example.com', 'pass1234')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      httpStatus: 401,
    });
  });

  it('should throw AppError INVALID_CREDENTIALS when password is wrong', async () => {
    mockFindUserByEmail.mockResolvedValue({
      user_id: 'uuid-1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
    });
    mockBcryptCompare.mockResolvedValue(false);

    await expect(login('test@example.com', 'wrong-pass')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      httpStatus: 401,
    });
  });
});

describe('refreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  it('should return new access_token when refresh token is valid', async () => {
    const { refreshToken: refreshTokenService } = await import('../../services/authService');
    mockJwtSign.mockReturnValueOnce('new-access-token');
    // mock jwt.verify to return payload
    const mockJwtVerify = jwt.verify as jest.Mock;
    mockJwtVerify.mockReturnValueOnce({ user_id: 'uuid-1', email: 'test@test.com' });

    const result = await refreshTokenService('valid-refresh-token');

    expect(result).toEqual({ access_token: 'new-access-token' });
  });

  it('should throw AppError REFRESH_TOKEN_EXPIRED when token is invalid', async () => {
    const { refreshToken: refreshTokenService } = await import('../../services/authService');
    const mockJwtVerify = jwt.verify as jest.Mock;
    mockJwtVerify.mockImplementation(() => { throw new Error('invalid token'); });

    await expect(refreshTokenService('invalid-token')).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_EXPIRED',
      httpStatus: 401,
    });
  });

  it('should throw AppError REFRESH_TOKEN_EXPIRED when token is expired', async () => {
    const { refreshToken: refreshTokenService } = await import('../../services/authService');
    const mockJwtVerify = jwt.verify as jest.Mock;
    mockJwtVerify.mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    await expect(refreshTokenService('expired-token')).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_EXPIRED',
      httpStatus: 401,
    });
  });
});
