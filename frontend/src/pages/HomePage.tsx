import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../contexts/I18nContext'
import { apiClient } from '../api/client'
import TodoCard from '../components/TodoCard'
import TodoFormModal from '../components/TodoFormModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import type { Todo, TodoListResponse, SortOption, TodoStatus } from '../types/api'
import styles from './HomePage.module.css'

type FilterOption = 'all' | 'pending' | 'completed'

export default function HomePage() {
  const { user, logout } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const navigate = useNavigate()

  const [overdue, setOverdue] = useState<Todo[]>([])
  const [normal, setNormal] = useState<Todo[]>([])
  const [completed, setCompleted] = useState<Todo[]>([])
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
      setNormal(data.normal.filter((t) => t.status === 'pending'))
      setCompleted(data.normal.filter((t) => t.status === 'completed'))
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

  async function handleEditOpen(id: string) {
    try {
      const todo = await apiClient.get<Todo>(`/todos/${id}`)
      setEditTodo(todo)
    } catch {
      setApiError(t('fetchTodoFailed'))
    }
  }

  async function handleEdit(values: { title: string; description: string; due_date: string }) {
    if (!editTodo) return
    await apiClient.put(`/todos/${editTodo.todo_id}`, values)
    setEditTodo(null)
    fetchTodos()
  }

  async function handleToggle(id: string) {
    const allTodos = [...overdue, ...normal, ...completed]
    const todo = allTodos.find((t) => t.todo_id === id)
    if (!todo) return

    const newStatus: TodoStatus = todo.status === 'pending' ? 'completed' : 'pending'

    const update = (list: Todo[]) =>
      list.map((t) => (t.todo_id === id ? { ...t, status: newStatus } : t))
    setOverdue((prev) => update(prev))
    setNormal((prev) => update(prev))
    setCompleted((prev) => update(prev))

    try {
      await apiClient.patch(`/todos/${id}/status`, { status: newStatus })
      fetchTodos()
    } catch {
      const rollback = (list: Todo[]) =>
        list.map((t) => (t.todo_id === id ? { ...t, status: todo.status } : t))
      setOverdue((prev) => rollback(prev))
      setNormal((prev) => rollback(prev))
      setCompleted((prev) => rollback(prev))
      setApiError(t('toggleFailed'))
    }
  }

  async function handleDelete() {
    if (!deleteTodo) return
    await apiClient.delete(`/todos/${deleteTodo.todo_id}`)
    setDeleteTodo(null)
    fetchTodos()
  }

  const isEmpty = overdue.length === 0 && normal.length === 0 && completed.length === 0

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h1 className={styles.logo}>{t('appTitle')}</h1>
        <div className={styles.headerRight}>
          <span className={styles.greeting}>{t('greeting', { name: user?.name ?? '' })}</span>
          <button
            type="button"
            className={`${styles.langToggleBtn}${locale === 'ko' ? ` ${styles.langToggleBtnActive}` : ''}`}
            onClick={() => setLocale('ko')}
          >
            KO
          </button>
          <button
            type="button"
            className={`${styles.langToggleBtn}${locale === 'en' ? ` ${styles.langToggleBtnActive}` : ''}`}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
          >
            {t('logout')}
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
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => setSearch('')}
                  aria-label={t('searchClear')}
                >
                  ✕
                </button>
              )}
            </div>

            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              aria-label={t('sortLabel')}
            >
              <option value="due_date_asc">{t('sortDueDateAsc')}</option>
              <option value="due_date_desc">{t('sortDueDateDesc')}</option>
              <option value="created_at_asc">{t('sortCreatedAsc')}</option>
              <option value="created_at_desc">{t('sortCreatedDesc')}</option>
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
                {f === 'all' ? t('filterAll') : f === 'pending' ? t('filterPending') : t('filterCompleted')}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.listArea}>
          {isLoading ? (
            <LoadingSpinner />
          ) : isEmpty ? (
            <div className={styles.emptyState}>
              <p>{t('emptyTitle')}</p>
              <p>{t('emptySubtitle')}</p>
            </div>
          ) : (
            <>
              {overdue.length > 0 && (
                <section className={styles.group}>
                  <h2 className={styles.groupHeaderOverdue}>
                    {t('overdueGroup', { n: overdue.length })}
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
                  <h2 className={styles.groupHeader}>{t('normalGroup', { n: normal.length })}</h2>
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

              {completed.length > 0 && (
                <section className={styles.group}>
                  <h2 className={styles.groupHeaderCompleted}>{t('completedGroup', { n: completed.length })}</h2>
                  <div className={styles.todoList}>
                    {completed.map((todo) => (
                      <TodoCard
                        key={todo.todo_id}
                        todo={todo}
                        onToggle={handleToggle}
                        onEdit={handleEditOpen}
                        onDelete={(id) => setDeleteTodo(completed.find((t) => t.todo_id === id) ?? null)}
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
            {t('addTodo')}
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
