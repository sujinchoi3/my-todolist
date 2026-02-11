describe('corsOptions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('기본 origin은 http://localhost:5173 이어야 한다', async () => {
    delete process.env.CORS_ORIGIN;
    const { corsOptions } = await import('../../config/cors');
    expect(corsOptions.origin).toBe('http://localhost:5173');
  });

  it('CORS_ORIGIN 환경변수가 있으면 그 값을 사용해야 한다', async () => {
    process.env.CORS_ORIGIN = 'https://example.com';
    const { corsOptions } = await import('../../config/cors');
    expect(corsOptions.origin).toBe('https://example.com');
  });

  it('credentials가 true여야 한다', async () => {
    const { corsOptions } = await import('../../config/cors');
    expect(corsOptions.credentials).toBe(true);
  });

  it('허용 메서드에 GET, POST, PUT, PATCH, DELETE, OPTIONS가 포함되어야 한다', async () => {
    const { corsOptions } = await import('../../config/cors');
    expect(corsOptions.methods).toEqual(
      expect.arrayContaining(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
    );
  });

  it('허용 헤더에 Content-Type과 Authorization이 포함되어야 한다', async () => {
    const { corsOptions } = await import('../../config/cors');
    expect(corsOptions.allowedHeaders).toEqual(
      expect.arrayContaining(['Content-Type', 'Authorization'])
    );
  });
});
