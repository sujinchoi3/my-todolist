import { v4 as uuidv4 } from 'uuid';
import {
  insertTodo,
  findTodosByUserId,
  findTodoById,
  updateTodo as repoUpdateTodo,
  updateTodoStatus as repoUpdateTodoStatus,
  deleteTodoById,
} from '../repositories/todoRepository';
import { calcIsOverdue } from '../utils/kst';
import { Todo, SortOption, TodoListResponse } from '../types';
import { AppError } from './authService';

export async function createTodo(
  user_id: string,
  title: string,
  description: string | null,
  due_date: string
): Promise<Todo> {
  const todo_id = uuidv4();
  const row = await insertTodo(todo_id, user_id, title, description, due_date);
  return {
    ...row,
    is_overdue: calcIsOverdue(row.due_date, row.status),
  };
}

export async function getTodos(
  user_id: string,
  status?: 'pending' | 'completed',
  sort?: SortOption,
  q?: string
): Promise<TodoListResponse> {
  const rows = await findTodosByUserId(user_id, status, sort, q);

  const withOverdue = rows.map((row) => ({
    ...row,
    is_overdue: calcIsOverdue(row.due_date, row.status),
  }));

  return {
    overdue: withOverdue.filter((t) => t.is_overdue),
    normal: withOverdue.filter((t) => !t.is_overdue),
  };
}

export async function getTodoById(todo_id: string, user_id: string): Promise<Todo> {
  const row = await findTodoById(todo_id);

  if (!row) {
    throw new AppError('TODO_NOT_FOUND', 404, '해당 할일을 찾을 수 없습니다.');
  }

  if (row.user_id !== user_id) {
    throw new AppError('FORBIDDEN', 403, '접근 권한이 없습니다.');
  }

  return {
    ...row,
    is_overdue: calcIsOverdue(row.due_date, row.status),
  };
}

export async function updateTodo(
  todo_id: string,
  user_id: string,
  title: string,
  description: string | null,
  due_date: string,
  status?: 'pending' | 'completed'
): Promise<Todo> {
  const existing = await findTodoById(todo_id);

  if (!existing) {
    throw new AppError('TODO_NOT_FOUND', 404, '해당 할일을 찾을 수 없습니다.');
  }
  if (existing.user_id !== user_id) {
    throw new AppError('FORBIDDEN', 403, '접근 권한이 없습니다.');
  }

  const resolvedStatus = status ?? existing.status;
  const updated = await repoUpdateTodo(todo_id, title, description, due_date, resolvedStatus);

  return {
    ...updated!,
    is_overdue: calcIsOverdue(updated!.due_date, updated!.status),
  };
}

export async function updateTodoStatus(
  todo_id: string,
  user_id: string,
  status: 'pending' | 'completed'
): Promise<Todo> {
  const existing = await findTodoById(todo_id);

  if (!existing) {
    throw new AppError('TODO_NOT_FOUND', 404, '해당 할일을 찾을 수 없습니다.');
  }
  if (existing.user_id !== user_id) {
    throw new AppError('FORBIDDEN', 403, '접근 권한이 없습니다.');
  }

  const updated = await repoUpdateTodoStatus(todo_id, status);

  return {
    ...updated!,
    is_overdue: calcIsOverdue(updated!.due_date, updated!.status),
  };
}

export async function deleteTodo(todo_id: string, user_id: string): Promise<void> {
  const existing = await findTodoById(todo_id);

  if (!existing) {
    throw new AppError('TODO_NOT_FOUND', 404, '해당 할일을 찾을 수 없습니다.');
  }
  if (existing.user_id !== user_id) {
    throw new AppError('FORBIDDEN', 403, '접근 권한이 없습니다.');
  }

  await deleteTodoById(todo_id);
}
