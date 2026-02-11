import { query, queryOne, execute } from '../utils/db';
import { Todo, SortOption } from '../types';

type TodoRow = Omit<Todo, 'is_overdue'>;

const SORT_MAP: Record<SortOption, string> = {
  due_date_asc: 'due_date ASC, created_at ASC',
  due_date_desc: 'due_date DESC, created_at ASC',
  created_at_asc: 'created_at ASC',
  created_at_desc: 'created_at DESC',
};

export async function insertTodo(
  todo_id: string,
  user_id: string,
  title: string,
  description: string | null,
  due_date: string
): Promise<TodoRow> {
  const result = await queryOne<TodoRow>(
    `INSERT INTO todos (todo_id, user_id, title, description, due_date, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING todo_id, user_id, title, description, due_date::text AS due_date, status, created_at, updated_at`,
    [todo_id, user_id, title, description, due_date]
  );
  return result!;
}

export async function findTodosByUserId(
  user_id: string,
  status?: 'pending' | 'completed',
  sort: SortOption = 'due_date_asc',
  q?: string
): Promise<TodoRow[]> {
  const params: unknown[] = [user_id];
  const conditions: string[] = ['user_id = $1'];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
  }

  const whereClause = conditions.join(' AND ');
  const orderClause = SORT_MAP[sort] ?? SORT_MAP.due_date_asc;

  const result = await query<TodoRow>(
    `SELECT todo_id, user_id, title, description, due_date::text AS due_date, status, created_at, updated_at
     FROM todos
     WHERE ${whereClause}
     ORDER BY ${orderClause}`,
    params
  );
  return result.rows;
}

export async function findTodoById(todo_id: string): Promise<TodoRow | null> {
  return queryOne<TodoRow>(
    `SELECT todo_id, user_id, title, description, due_date::text AS due_date, status, created_at, updated_at
     FROM todos
     WHERE todo_id = $1`,
    [todo_id]
  );
}

export async function updateTodo(
  todo_id: string,
  title: string,
  description: string | null,
  due_date: string,
  status: 'pending' | 'completed'
): Promise<TodoRow | null> {
  return queryOne<TodoRow>(
    `UPDATE todos
     SET title = $2, description = $3, due_date = $4, status = $5, updated_at = NOW()
     WHERE todo_id = $1
     RETURNING todo_id, user_id, title, description, due_date::text AS due_date, status, created_at, updated_at`,
    [todo_id, title, description, due_date, status]
  );
}

export async function updateTodoStatus(
  todo_id: string,
  status: 'pending' | 'completed'
): Promise<TodoRow | null> {
  return queryOne<TodoRow>(
    `UPDATE todos
     SET status = $2, updated_at = NOW()
     WHERE todo_id = $1
     RETURNING todo_id, user_id, title, description, due_date::text AS due_date, status, created_at, updated_at`,
    [todo_id, status]
  );
}

export async function deleteTodoById(todo_id: string): Promise<number> {
  return execute(
    `DELETE FROM todos WHERE todo_id = $1`,
    [todo_id]
  );
}
