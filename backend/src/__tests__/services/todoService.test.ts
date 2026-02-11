import { createTodo, getTodos, getTodoById, updateTodo, updateTodoStatus, deleteTodo } from '../../services/todoService';
import * as todoRepo from '../../repositories/todoRepository';
import * as kst from '../../utils/kst';

jest.mock('../../repositories/todoRepository');
jest.mock('../../utils/kst');

const mockInsertTodo = todoRepo.insertTodo as jest.Mock;
const mockFindTodosByUserId = todoRepo.findTodosByUserId as jest.Mock;
const mockFindTodoById = todoRepo.findTodoById as jest.Mock;
const mockCalcIsOverdue = kst.calcIsOverdue as jest.Mock;
const mockUpdateTodo = todoRepo.updateTodo as jest.Mock;
const mockUpdateTodoStatus = todoRepo.updateTodoStatus as jest.Mock;
const mockDeleteTodoById = todoRepo.deleteTodoById as jest.Mock;

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

describe('updateTodo (service)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return updated todo with is_overdue', async () => {
    mockFindTodoById.mockResolvedValue(MOCK_ROW);
    mockUpdateTodo.mockResolvedValue({ ...MOCK_ROW, title: '수정됨' });
    mockCalcIsOverdue.mockReturnValue(false);

    const result = await updateTodo('todo-uuid-1', 'user-uuid-1', '수정됨', null, '2026-02-20');

    expect(result.title).toBe('수정됨');
    expect(result.is_overdue).toBe(false);
  });

  it('should use existing status when status not provided', async () => {
    mockFindTodoById.mockResolvedValue({ ...MOCK_ROW, status: 'completed' });
    mockUpdateTodo.mockResolvedValue({ ...MOCK_ROW, status: 'completed' });
    mockCalcIsOverdue.mockReturnValue(false);

    await updateTodo('todo-uuid-1', 'user-uuid-1', '제목', null, '2026-02-20', undefined);

    expect(mockUpdateTodo).toHaveBeenCalledWith(
      'todo-uuid-1', '제목', null, '2026-02-20', 'completed'
    );
  });

  it('should throw 404 when todo not found', async () => {
    mockFindTodoById.mockResolvedValue(null);
    await expect(updateTodo('not-exist', 'user-uuid-1', '제목', null, '2026-02-20')).rejects.toMatchObject({
      code: 'TODO_NOT_FOUND',
      httpStatus: 404,
    });
  });

  it('should throw 403 when todo belongs to different user', async () => {
    mockFindTodoById.mockResolvedValue({ ...MOCK_ROW, user_id: 'other-user' });
    await expect(updateTodo('todo-uuid-1', 'user-uuid-1', '제목', null, '2026-02-20')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      httpStatus: 403,
    });
  });
});

describe('updateTodoStatus (service)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return updated todo with new status', async () => {
    mockFindTodoById.mockResolvedValue(MOCK_ROW);
    mockUpdateTodoStatus.mockResolvedValue({ ...MOCK_ROW, status: 'completed' });
    mockCalcIsOverdue.mockReturnValue(false);

    const result = await updateTodoStatus('todo-uuid-1', 'user-uuid-1', 'completed');
    expect(result.status).toBe('completed');
  });

  it('should throw 404 when todo not found', async () => {
    mockFindTodoById.mockResolvedValue(null);
    await expect(updateTodoStatus('not-exist', 'user-uuid-1', 'completed')).rejects.toMatchObject({
      code: 'TODO_NOT_FOUND',
      httpStatus: 404,
    });
  });

  it('should throw 403 when not owner', async () => {
    mockFindTodoById.mockResolvedValue({ ...MOCK_ROW, user_id: 'other-user' });
    await expect(updateTodoStatus('todo-uuid-1', 'user-uuid-1', 'completed')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      httpStatus: 403,
    });
  });
});

describe('deleteTodo (service)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should resolve without error when authorized', async () => {
    mockFindTodoById.mockResolvedValue(MOCK_ROW);
    mockDeleteTodoById.mockResolvedValue(1);

    await expect(deleteTodo('todo-uuid-1', 'user-uuid-1')).resolves.toBeUndefined();
    expect(mockDeleteTodoById).toHaveBeenCalledWith('todo-uuid-1');
  });

  it('should throw 404 when todo not found', async () => {
    mockFindTodoById.mockResolvedValue(null);
    await expect(deleteTodo('not-exist', 'user-uuid-1')).rejects.toMatchObject({
      code: 'TODO_NOT_FOUND',
      httpStatus: 404,
    });
  });

  it('should throw 403 when not owner', async () => {
    mockFindTodoById.mockResolvedValue({ ...MOCK_ROW, user_id: 'other-user' });
    await expect(deleteTodo('todo-uuid-1', 'user-uuid-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      httpStatus: 403,
    });
  });
});
