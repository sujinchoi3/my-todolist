import { query, queryOne, execute } from '../../utils/db';
import { pool } from '../../config/database';

jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const mockQuery = pool.query as jest.Mock;

describe('db utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('query', () => {
    it('should execute sql and return QueryResult', async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await query('SELECT * FROM users WHERE id = $1', [1]);

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result).toEqual(mockResult);
    });

    it('should execute sql without params', async () => {
      const mockResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await query('SELECT 1');

      expect(mockQuery).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(result.rows).toEqual([]);
    });

    it('should propagate errors from pool.query', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(query('SELECT 1')).rejects.toThrow('DB error');
    });
  });

  describe('queryOne', () => {
    it('should return first row when result exists', async () => {
      const mockResult = { rows: [{ user_id: '123', email: 'test@test.com' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await queryOne('SELECT * FROM users WHERE user_id = $1', ['123']);

      expect(result).toEqual({ user_id: '123', email: 'test@test.com' });
    });

    it('should return null when no rows found', async () => {
      const mockResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await queryOne('SELECT * FROM users WHERE user_id = $1', ['not-exist']);

      expect(result).toBeNull();
    });

    it('should propagate errors from pool.query', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(queryOne('SELECT 1')).rejects.toThrow('DB error');
    });
  });

  describe('execute', () => {
    it('should return rowCount on success', async () => {
      const mockResult = { rows: [], rowCount: 3, command: 'UPDATE', oid: 0, fields: [] };
      mockQuery.mockResolvedValueOnce(mockResult);

      const count = await execute('UPDATE todos SET status = $1 WHERE user_id = $2', ['completed', '123']);

      expect(count).toBe(3);
    });

    it('should return 0 when rowCount is null', async () => {
      const mockResult = { rows: [], rowCount: null, command: 'UPDATE', oid: 0, fields: [] };
      mockQuery.mockResolvedValueOnce(mockResult);

      const count = await execute('UPDATE todos SET status = $1', ['completed']);

      expect(count).toBe(0);
    });

    it('should propagate errors from pool.query', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(execute('DELETE FROM todos WHERE todo_id = $1', ['123'])).rejects.toThrow('DB error');
    });
  });
});
