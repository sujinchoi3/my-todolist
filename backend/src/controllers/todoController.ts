import { Request, Response } from 'express';
import { createTodo, getTodos, getTodoById, updateTodo, updateTodoStatus, deleteTodo } from '../services/todoService';
import { validateCreateTodo, validateUpdateTodo } from '../utils/validation';
import { AppError } from '../services/authService';
import { SortOption } from '../types';

const VALID_SORTS: SortOption[] = [
  'due_date_asc',
  'due_date_desc',
  'created_at_asc',
  'created_at_desc',
];

export async function createTodoController(req: Request, res: Response): Promise<void> {
  const user_id = req.user!.user_id;
  const { title, description, due_date } = req.body;

  const errors = validateCreateTodo(title, due_date, description);
  if (errors.length > 0) {
    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: '입력값이 올바르지 않습니다.',
      details: errors,
    });
    return;
  }

  try {
    const todo = await createTodo(
      user_id,
      title as string,
      description ?? null,
      due_date as string
    );
    res.status(201).json(todo);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpStatus).json({
        status: 'error',
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}

export async function getTodosController(req: Request, res: Response): Promise<void> {
  const user_id = req.user!.user_id;
  const { status, sort, q } = req.query;

  const statusFilter =
    status === 'pending' || status === 'completed' ? status : undefined;

  const sortStr = typeof sort === 'string' ? sort : '';
  const sortOption = VALID_SORTS.includes(sortStr as SortOption)
    ? (sortStr as SortOption)
    : 'due_date_asc';

  const keyword = typeof q === 'string' && q.trim().length > 0 ? q.trim() : undefined;

  try {
    const result = await getTodos(user_id, statusFilter, sortOption, keyword);
    res.status(200).json(result);
  } catch (err) {
    throw err;
  }
}

export async function getTodoByIdController(req: Request, res: Response): Promise<void> {
  const user_id = req.user!.user_id;
  const id = req.params.id as string;

  try {
    const todo = await getTodoById(id, user_id);
    res.status(200).json(todo);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpStatus).json({
        status: 'error',
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}

export async function updateTodoController(req: Request, res: Response): Promise<void> {
  const user_id = req.user!.user_id;
  const todo_id = req.params.id as string;
  const { title, description, due_date, status } = req.body;

  const errors = validateUpdateTodo(title, due_date, description, status);
  if (errors.length > 0) {
    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: '입력값이 올바르지 않습니다.',
      details: errors,
    });
    return;
  }

  try {
    const todo = await updateTodo(
      todo_id,
      user_id,
      title as string,
      description !== undefined ? (description as string | null) : null,
      due_date as string,
      status as 'pending' | 'completed' | undefined
    );
    res.status(200).json(todo);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpStatus).json({
        status: 'error',
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}

export async function updateTodoStatusController(req: Request, res: Response): Promise<void> {
  const user_id = req.user!.user_id;
  const todo_id = req.params.id as string;
  const { status } = req.body;

  if (status !== 'pending' && status !== 'completed') {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_STATUS',
      message: "status는 'pending' 또는 'completed'이어야 합니다.",
    });
    return;
  }

  try {
    const todo = await updateTodoStatus(todo_id, user_id, status);
    res.status(200).json(todo);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpStatus).json({
        status: 'error',
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}

export async function deleteTodoController(req: Request, res: Response): Promise<void> {
  const user_id = req.user!.user_id;
  const todo_id = req.params.id as string;

  try {
    await deleteTodo(todo_id, user_id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.httpStatus).json({
        status: 'error',
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}
