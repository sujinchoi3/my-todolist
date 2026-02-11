import {
  insertTodo,
  findTodosByUserId,
  findTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodoById,
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

describe('updateTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update and return the todo', async () => {
    const updated = { ...MOCK_TODO, title: '수정된 제목', status: 'completed' as const };
    mockQueryOne.mockResolvedValue(updated);

    const result = await updateTodo('todo-uuid-1', '수정된 제목', null, '2026-02-20', 'completed');

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE todos'),
      expect.arrayContaining(['todo-uuid-1', '수정된 제목'])
    );
    expect(result).toEqual(updated);
  });

  it('should return null when todo not found', async () => {
    mockQueryOne.mockResolvedValue(null);
    const result = await updateTodo('not-exist', '제목', null, '2026-02-20', 'pending');
    expect(result).toBeNull();
  });
});

describe('updateTodoStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update status and return the todo', async () => {
    const updated = { ...MOCK_TODO, status: 'completed' as const };
    mockQueryOne.mockResolvedValue(updated);

    const result = await updateTodoStatus('todo-uuid-1', 'completed');

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining('SET status'),
      ['todo-uuid-1', 'completed']
    );
    expect(result?.status).toBe('completed');
  });
});

describe('deleteTodoById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should execute DELETE and return rowCount', async () => {
    const mockExecute = db.execute as jest.Mock;
    mockExecute.mockResolvedValue(1);

    const result = await deleteTodoById('todo-uuid-1');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM todos'),
      ['todo-uuid-1']
    );
    expect(result).toBe(1);
  });

  it('should return 0 when nothing deleted', async () => {
    const mockExecute = db.execute as jest.Mock;
    mockExecute.mockResolvedValue(0);
    const result = await deleteTodoById('not-exist');
    expect(result).toBe(0);
  });
});
