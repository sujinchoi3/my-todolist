import {
  insertTodo,
  findTodosByUserId,
  findTodoById,
} from '../../repositories/todoRepository';
import * as db from '../../utils/db';

jest.mock('../../utils/db');

const mockQuery = db.query as jest.Mock;
const mockQueryOne = db.queryOne as jest.Mock;

const MOCK_TODO = {
  todo_id: 'todo-uuid-1',
  user_id: 'user-uuid-1',
  title: '테스트 할일',
  description: '설명',
  due_date: '2026-02-20',
  status: 'pending' as const,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('insertTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should insert and return todo row', async () => {
    mockQueryOne.mockResolvedValue(MOCK_TODO);

    const result = await insertTodo('todo-uuid-1', 'user-uuid-1', '테스트 할일', '설명', '2026-02-20');

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO todos'),
      expect.arrayContaining(['todo-uuid-1', 'user-uuid-1', '테스트 할일'])
    );
    expect(result).toEqual(MOCK_TODO);
  });

  it('should insert with null description', async () => {
    mockQueryOne.mockResolvedValue({ ...MOCK_TODO, description: null });

    const result = await insertTodo('todo-uuid-1', 'user-uuid-1', '테스트 할일', null, '2026-02-20');

    expect(result.description).toBeNull();
  });
});

describe('findTodosByUserId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should query todos for user', async () => {
    mockQuery.mockResolvedValue({ rows: [MOCK_TODO] });

    const result = await findTodosByUserId('user-uuid-1');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE'),
      expect.arrayContaining(['user-uuid-1'])
    );
    expect(result).toHaveLength(1);
  });

  it('should add status filter when provided', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await findTodosByUserId('user-uuid-1', 'pending');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('status'),
      expect.arrayContaining(['user-uuid-1', 'pending'])
    );
  });

  it('should add keyword filter when provided', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await findTodosByUserId('user-uuid-1', undefined, 'due_date_asc', '검색어');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE'),
      expect.arrayContaining(['%검색어%'])
    );
  });

  it('should use desc sort when specified', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await findTodosByUserId('user-uuid-1', undefined, 'due_date_desc');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DESC'),
      expect.any(Array)
    );
  });

  it('should return empty array when no todos found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await findTodosByUserId('user-uuid-1');
    expect(result).toEqual([]);
  });
});

describe('findTodoById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return todo when found', async () => {
    mockQueryOne.mockResolvedValue(MOCK_TODO);

    const result = await findTodoById('todo-uuid-1');
    expect(result).toEqual(MOCK_TODO);
  });

  it('should return null when not found', async () => {
    mockQueryOne.mockResolvedValue(null);

    const result = await findTodoById('not-exist');
    expect(result).toBeNull();
  });
});
