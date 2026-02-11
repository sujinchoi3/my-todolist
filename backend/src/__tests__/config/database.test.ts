describe('database config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should call process.exit(1) when DB_URL is not set', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    delete process.env.DB_URL;

    await import('../../config/database');

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should create Pool when DB_URL is set', async () => {
    process.env.DB_URL = 'postgresql://test:test@localhost:5432/test_db';

    const { pool } = await import('../../config/database');
    expect(pool).toBeDefined();
  });

  describe('testConnection', () => {
    it('should resolve when DB connection succeeds', async () => {
      process.env.DB_URL = 'postgresql://test:test@localhost:5432/test_db';

      const mockRelease = jest.fn();
      const mockClient = { query: jest.fn().mockResolvedValue({}), release: mockRelease };
      
      jest.mock('pg', () => ({
        Pool: jest.fn().mockImplementation(() => ({
          connect: jest.fn().mockResolvedValue(mockClient),
        })),
      }));

      const { testConnection } = await import('../../config/database');
      await expect(testConnection()).resolves.toBeUndefined();
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should reject and release client when DB query fails', async () => {
      process.env.DB_URL = 'postgresql://test:test@localhost:5432/test_db';

      const mockRelease = jest.fn();
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Connection refused')),
        release: mockRelease,
      };

      jest.mock('pg', () => ({
        Pool: jest.fn().mockImplementation(() => ({
          connect: jest.fn().mockResolvedValue(mockClient),
        })),
      }));

      const { testConnection } = await import('../../config/database');
      await expect(testConnection()).rejects.toThrow('Connection refused');
      expect(mockRelease).toHaveBeenCalled();
    });
  });
});
