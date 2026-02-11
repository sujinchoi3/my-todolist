export interface User {
  user_id: string;
  email: string;
  name: string;
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  user_id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface Todo {
  todo_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string; // YYYY-MM-DD
  status: 'pending' | 'completed';
  is_overdue?: boolean;
  created_at: Date;
  updated_at: Date;
}

export type SortOption =
  | 'due_date_asc'
  | 'due_date_desc'
  | 'created_at_asc'
  | 'created_at_desc';

export interface TodoListResponse {
  overdue: Todo[];
  normal: Todo[];
}
