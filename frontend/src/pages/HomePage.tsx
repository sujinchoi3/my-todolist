import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../api/client'
import TodoCard from '../components/TodoCard'
import TodoFormModal from '../components/TodoFormModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import type { Todo, TodoListResponse, SortOption } from '../types/api'
import styles from './HomePage.module.css'

type FilterOption = 'all' | 'pending' | 'completed'

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [overdue, setOverdue] = useState<Todo[]>([])
  const [normal, setNormal] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [sort, setSort] = useState<SortOption>('due_date_asc')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)
  const [deleteTodo, setDeleteTodo] = useState<Todo | null>(null)

  const fetchTodos = useCallback(async () => {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    if (sort) params.set('sort', sort)
    if (search.trim()) params.set('q', search.trim())

    const url = `/todos${params.toString() ? `?${params.toString()}` : ''}`
    try {
      const data = await apiClient.get<TodoListResponse>(url)
      setOverdue(data.overdue)
      setNormal(data.normal)
    } catch {
      // 목록 조회 실패 시 빈 목록 유지
    }
  }, [filter, sort, search])

  useEffect(() => {
    setIsLoading(true)
    fetchTodos().finally(() => setIsLoading(false))
  }, [fetchTodos])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  async function handleCreate(values: { title: string; description: string; due_date: string }) {
    await apiClient.post('/todos', values)
    setCreateModalOpen(false)
    fetchTodos()
  }

  // FE-09: 수정 버튼 클릭 시 GET /todos/:id로 최신 데이터 fetch
  async function handleEditOpen(id: string) {
    try {
      const todo = await apiClient.get<Todo>(`/todos/${id}`)
      setEditTodo(todo)
    } catch {
      setApiError('할일 정보를 불러오지 못했습니다.')
    }
  }

  async function handleEdit(values: { title: string; description: string; due_date: string }) {
    if (!editTodo) return
    await apiClient.put(`/todos/${editTodo.todo_id}`, values)
    setEditTodo(null)
    fetchTodos()
  }

  // FE-10: 옵티미스틱 업데이트 + 실패 시 롤백
  async function handleToggle(id: string) {
    const allTodos = [...overdue, ...normal]
    const todo = allTodos.find((t) => t.todo_id === id)
    if (!todo) return

    const newStatus = todo.status === 'pending' ? 'completed' : 'pending'

    // 즉시 UI 업데이트 (옵티미스틱)
    const update = (list: Todo[]) =>
      list.map((t) => (t.todo_id === id ? { ...t, status: newStatus } : t))
    setOverdue((prev) => update(prev))
    setNormal((prev) => update(prev))

    try {
      await apiClient.patch(`/todos/${id}/status`, { status: newStatus })
      fetchTodos()
    } catch {
      // 롤백
      const rollback = (list: Todo[]) =>
        list.map((t) => (t.todo_id === id ? { ...t, status: todo.status } : t))
      setOverdue((prev) => rollback(prev))
      setNormal((prev) => rollback(prev))
      setApiError('상태 변경에 실패했습니다.')
    }
  }

  // FE-11: 삭제 확인 후 DELETE
  async function handleDelete() {
    if (!deleteTodo) return
    await apiClient.delete(`/todos/${deleteTodo.todo_id}`)
    setDeleteTodo(null)
    fetchTodos()
  }

  const isEmpty = overdue.length === 0 && normal.length === 0

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h1 className={styles.logo}>my_todolist</h1>
        <div className={styles.headerRight}>
          <span className={styles.greeting}>안녕하세요, {user?.name}님</span>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <ErrorAlert
          message={apiError || undefined}
          onClose={() => setApiError('')}
          autoClose
        />

        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="검색어 입력"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => setSearch('')}
                  aria-label="검색 초기화"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              aria-label="정렬 기준"
            >
              <option value="due_date_asc">마감일 오름차순</option>
              <option value="due_date_desc">마감일 내림차순</option>
              <option value="created_at_asc">등록일 오름차순</option>
              <option value="created_at_desc">등록일 내림차순</option>
            </select>
          </div>

          <div className={styles.filterRow}>
            {(['all', 'pending', 'completed'] as FilterOption[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.filterTab}${filter === f ? ` ${styles.filterTabActive}` : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '전체' : f === 'pending' ? '미완료' : '완료'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.listArea}>
          {isLoading ? (
            <LoadingSpinner />
          ) : isEmpty ? (
            <div className={styles.emptyState}>
              <p>할일이 없습니다.</p>
              <p>아래 버튼으로 첫 할일을 추가해보세요!</p>
            </div>
          ) : (
            <>
              {overdue.length > 0 && (
                <section className={styles.group}>
                  <h2 className={styles.groupHeaderOverdue}>
                    ⚠ 기한 초과 ({overdue.length}건)
                  </h2>
                  <div className={styles.todoList}>
                    {overdue.map((todo) => (
                      <TodoCard
                        key={todo.todo_id}
                        todo={todo}
                        onToggle={handleToggle}
                        onEdit={handleEditOpen}
                        onDelete={(id) => setDeleteTodo(overdue.find((t) => t.todo_id === id) ?? null)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {normal.length > 0 && (
                <section className={styles.group}>
                  <h2 className={styles.groupHeader}>할일 목록 ({normal.length}건)</h2>
                  <div className={styles.todoList}>
                    {normal.map((todo) => (
                      <TodoCard
                        key={todo.todo_id}
                        todo={todo}
                        onToggle={handleToggle}
                        onEdit={handleEditOpen}
                        onDelete={(id) => setDeleteTodo(normal.find((t) => t.todo_id === id) ?? null)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className={styles.addBtnWrapper}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setCreateModalOpen(true)}
          >
            + 할일 추가
          </button>
        </div>
      </main>

      <TodoFormModal
        isOpen={createModalOpen}
        mode="create"
        onSubmit={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
      />

      <TodoFormModal
        isOpen={!!editTodo}
        mode="edit"
        initialValues={
          editTodo
            ? {
                title: editTodo.title,
                description: editTodo.description ?? '',
                due_date: editTodo.due_date,
              }
            : null
        }
        onSubmit={handleEdit}
        onCancel={() => setEditTodo(null)}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteTodo}
        todoTitle={deleteTodo?.title ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTodo(null)}
      />
    </div>
  )
}
