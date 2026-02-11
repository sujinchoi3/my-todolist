// database.ts의 process.exit(1) 호출을 막기 위해 DB_URL을 미리 설정
process.env.DB_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
