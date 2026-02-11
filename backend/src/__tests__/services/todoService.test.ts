import { createTodo, getTodos, getTodoById } from '../../services/todoService';
import * as todoRepo from '../../repositories/todoRepository';
import * as kst from '../../utils/kst';

jest.mock('../../repositories/todoRepository');
jest.mock('../../utils/kst');

const mockInsertTodo = todoRepo.insertTodo as jest.Mock;
const mockFindTodosByUserId = todoRepo.findTodosByUserId as jest.Mock;
const mockFindTodoById = todoRepo.findTodoById as jest.Mock;
const mockCalcIsOverdue = kst.calcIsOverdue as jest.Mock;

const MOCK_ROW = {
  todo_id: 'todo-uuid-1',
  user_id: 'user-uuid-1',
  title: '테스트',
  description: null,
  due_date: '2026-02-20',
  status: 'pending' as const,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('createTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create todo and return with is_overdue', async () => {
    mockInsertTodo.mockResolvedValue(MOCK_ROW);
    mockCalcIsOverdue.mockReturnValue(false);

    const result = await createTodo('user-uuid-1', '테스트', null, '2026-02-20');

    expect(result).toMatchObject({ ...MOCK_ROW, is_overdue: false });
    expect(mockInsertTodo).toHaveBeenCalledWith(
      expect.any(String), // uuid
      'user-uuid-1',
      '테스트',
      null,
      '2026-02-20'
    );
  });
});

describe('getTodos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should split todos into overdue and normal groups', async () => {
    const overdueTodo = { ...MOCK_ROW, todo_id: 'todo-1', due_date: '2020-01-01' };
    const normalTodo = { ...MOCK_ROW, todo_id: 'todo-2', due_date: '2099-12-31' };
    mockFindTodosByUserId.mockResolvedValue([overdueTodo, normalTodo]);
    mockCalcIsOverdue.mockImplementation((dueDate: string) => dueDate < '2026-02-11');

    const result = await getTodos('user-uuid-1');

    expect(result.overdue).toHaveLength(1);
    expect(result.normal).toHaveLength(1);
    expect(result.overdue[0].todo_id).toBe('todo-1');
    expect(result.normal[0].todo_id).toBe('todo-2');
  });

  it('should return empty groups when no todos', async () => {
    mockFindTodosByUserId.mockResolvedValue([]);

    const result = await getTodos('user-uuid-1');
    expect(result.overdue).toHaveLength(0);
    expect(result.normal).toHaveLength(0);
  });

  it('should pass filters to repository', async () => {
    mockFindTodosByUserId.mockResolvedValue([]);

    await getTodos('user-uuid-1', 'pending', 'created_at_desc', '검색');

    expect(mockFindTodosByUserId).toHaveBeenCalledWith('user-uuid-1', 'pending', 'created_at_desc', '검색');
  });
});

describe('getTodoById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return todo with is_overdue for authorized user', async () => {
    mockFindTodoById.mockResolvedValue(MOCK_ROW);
    mockCalcIsOverdue.mockReturnValue(false);

    const result = await getTodoById('todo-uuid-1', 'user-uuid-1');
    expect(result).toMatchObject({ ...MOCK_ROW, is_overdue: false });
  });

  it('should throw 404 when todo not found', async () => {
    mockFindTodoById.mockResolvedValue(null);

    await expect(getTodoById('not-exist', 'user-uuid-1')).rejects.toMatchObject({
      code: 'TODO_NOT_FOUND',
      httpStatus: 404,
    });
  });

  it('should throw 403 when todo belongs to different user', async () => {
    mockFindTodoById.mockResolvedValue({ ...MOCK_ROW, user_id: 'other-user' });

    await expect(getTodoById('todo-uuid-1', 'user-uuid-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      httpStatus: 403,
    });
  });
});
