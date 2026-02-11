import { Request, Response } from 'express';
import {
  createTodoController,
  getTodosController,
  getTodoByIdController,
} from '../../controllers/todoController';
import * as todoService from '../../services/todoService';
import { AppError } from '../../services/authService';

jest.mock('../../services/todoService');

const mockCreateTodo = todoService.createTodo as jest.Mock;
const mockGetTodos = todoService.getTodos as jest.Mock;
const mockGetTodoById = todoService.getTodoById as jest.Mock;

const MOCK_TODO = {
  todo_id: 'todo-uuid-1',
  user_id: 'user-uuid-1',
  title: '테스트',
  description: null,
  due_date: '2026-02-20',
  status: 'pending',
  is_overdue: false,
  created_at: new Date(),
  updated_at: new Date(),
};

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    user: { user_id: 'user-uuid-1', email: 'test@test.com' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

describe('createTodoController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when title is missing', async () => {
    const req = mockReq({ body: { due_date: '2026-02-20' } });
    const res = mockRes();
    await createTodoController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('should return 400 when due_date is missing', async () => {
    const req = mockReq({ body: { title: '테스트' } });
    const res = mockRes();
    await createTodoController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 when due_date is invalid format', async () => {
    const req = mockReq({ body: { title: '테스트', due_date: 'not-a-date' } });
    const res = mockRes();
    await createTodoController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 201 with todo on success', async () => {
    mockCreateTodo.mockResolvedValue(MOCK_TODO);
    const req = mockReq({ body: { title: '테스트', due_date: '2026-02-20' } });
    const res = mockRes();
    await createTodoController(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(MOCK_TODO);
  });

  it('should pass description to service when provided', async () => {
    mockCreateTodo.mockResolvedValue(MOCK_TODO);
    const req = mockReq({ body: { title: '테스트', due_date: '2026-02-20', description: '상세 설명' } });
    const res = mockRes();
    await createTodoController(req, res);
    expect(mockCreateTodo).toHaveBeenCalledWith('user-uuid-1', '테스트', '상세 설명', '2026-02-20');
  });

  it('should pass null description when not provided', async () => {
    mockCreateTodo.mockResolvedValue(MOCK_TODO);
    const req = mockReq({ body: { title: '테스트', due_date: '2026-02-20' } });
    const res = mockRes();
    await createTodoController(req, res);
    expect(mockCreateTodo).toHaveBeenCalledWith('user-uuid-1', '테스트', null, '2026-02-20');
  });
});

describe('getTodosController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 200 with todo list', async () => {
    mockGetTodos.mockResolvedValue({ overdue: [], normal: [MOCK_TODO] });
    const req = mockReq({ query: {} });
    const res = mockRes();
    await getTodosController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ overdue: [], normal: [MOCK_TODO] });
  });

  it('should pass status filter when provided', async () => {
    mockGetTodos.mockResolvedValue({ overdue: [], normal: [] });
    const req = mockReq({ query: { status: 'pending' } });
    const res = mockRes();
    await getTodosController(req, res);
    expect(mockGetTodos).toHaveBeenCalledWith('user-uuid-1', 'pending', 'due_date_asc', undefined);
  });

  it('should use default sort when invalid sort provided', async () => {
    mockGetTodos.mockResolvedValue({ overdue: [], normal: [] });
    const req = mockReq({ query: { sort: 'invalid_sort' } });
    const res = mockRes();
    await getTodosController(req, res);
    expect(mockGetTodos).toHaveBeenCalledWith('user-uuid-1', undefined, 'due_date_asc', undefined);
  });

  it('should pass keyword when q is provided', async () => {
    mockGetTodos.mockResolvedValue({ overdue: [], normal: [] });
    const req = mockReq({ query: { q: '검색어' } });
    const res = mockRes();
    await getTodosController(req, res);
    expect(mockGetTodos).toHaveBeenCalledWith('user-uuid-1', undefined, 'due_date_asc', '검색어');
  });
});

describe('getTodoByIdController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 200 with todo on success', async () => {
    mockGetTodoById.mockResolvedValue(MOCK_TODO);
    const req = mockReq({ params: { id: 'todo-uuid-1' } });
    const res = mockRes();
    await getTodoByIdController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(MOCK_TODO);
  });

  it('should return 404 when todo not found', async () => {
    mockGetTodoById.mockRejectedValue(new AppError('TODO_NOT_FOUND', 404, '해당 할일을 찾을 수 없습니다.'));
    const req = mockReq({ params: { id: 'not-exist' } });
    const res = mockRes();
    await getTodoByIdController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TODO_NOT_FOUND' }));
  });

  it('should return 403 when todo belongs to different user', async () => {
    mockGetTodoById.mockRejectedValue(new AppError('FORBIDDEN', 403, '접근 권한이 없습니다.'));
    const req = mockReq({ params: { id: 'other-user-todo' } });
    const res = mockRes();
    await getTodoByIdController(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN' }));
  });
});
