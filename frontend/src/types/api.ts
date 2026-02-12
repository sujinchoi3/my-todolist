export interface ApiError {
  status: 'error'
  code: string
  message: string
}

export interface User {
  user_id: string
  email: string
  name: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

export interface SignupResponse {
  user_id: string
  email: string
  name: string
}

export interface RefreshResponse {
  access_token: string
  user: User
}

export type TodoStatus = 'pending' | 'completed'

export interface Todo {
  todo_id: string
  user_id: string
  title: string
  description: string | null
  due_date: string
  status: TodoStatus
  is_overdue: boolean
  created_at: string
  updated_at: string
}

export interface TodoListResponse {
  overdue: Todo[]
  normal: Todo[]
}

export type SortOption =
  | 'due_date_asc'
  | 'due_date_desc'
  | 'created_at_asc'
  | 'created_at_desc'

export interface TodoListParams {
  status?: TodoStatus
  sort?: SortOption
  q?: string
}
