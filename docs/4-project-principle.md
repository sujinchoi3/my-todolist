# 프로젝트 구조 설계 원칙 - my_todolist (Team CalTalk)

**작성일**: 2026-02-11 | **버전**: 1.0 | **상태**: Draft

---

## 목차

1. [최상위 공통 원칙](#최상위-공통-원칙)
2. [의존성 / 레이어 원칙](#의존성--레이어-원칙)
3. [코드 / 네이밍 원칙](#코드--네이밍-원칙)
4. [테스트 / 품질 원칙](#테스트--품질-원칙)
5. [설정 / 보안 / 운영 원칙](#설정--보안--운영-원칙)
6. [디렉토리 구조](#디렉토리-구조)
7. [변경 이력](#변경-이력)

---

## 최상위 공통 원칙

모든 스택(Frontend/Backend)에 공통으로 적용되는 설계 원칙입니다.

### 1. 단순성 우선 (YAGNI, KISS)

**원칙**: "You Aren't Gonna Need It" - 현재 요구사항에 필요한 것만 구현한다. 미래 확장을 위한 선제적 구조는 지양한다.

**적용 기준**:
- MVP 범위(US-01~US-10) 내에서만 코드 구조 설계
- 추상화 계층은 최소화 (1~2 레벨 권장, 3단계 이상 지양)
- 외부 라이브러리 의존성 최소화 (필수 것만 선택)
- 기능 구현 후 코드 리뷰 시 "이 코드가 지금 필요한가?" 질문

**구체적 사례**:
```typescript
// ❌ 과도한 추상화: Repository Pattern 미리 구현
abstract class Repository<T> {
  abstract findById(id: string): Promise<T>;
  abstract save(entity: T): Promise<T>;
}

class UserRepository extends Repository<User> {
  // ... 상세 구현
}

// ✅ 단순 구현: 필요한 함수만 직접 구현
async function getUserById(userId: string): Promise<User> {
  const result = await db.query(
    'SELECT * FROM users WHERE user_id = $1',
    [userId]
  );
  return result.rows[0];
}
```

### 2. 관심사 분리 (Separation of Concerns - SoC)

**원칙**: 각 모듈/함수는 단 하나의 책임만 가진다. UI, 비즈니스 로직, 데이터 접근 계층은 명확히 분리한다.

**적용 기준**:
- Frontend: UI 렌더링은 컴포넌트, 비즈니스 로직은 Hook/Context/서비스로 분리
- Backend: 라우트 처리(Route) → 비즈니스 로직(Controller/Service) → 데이터 접근(Repository) 순차 분리
- 함수 단위: 한 함수는 한 가지 일만 수행
- 에러 처리, 로깅, 인증은 미들웨어/유틸리티로 추출

**구체적 사례**:
```typescript
// ❌ 관심사 혼합: 컴포넌트에서 데이터 페칭, 에러 처리, 렌더링을 모두 수행
function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  useEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data))
      .catch(err => console.error(err));
  }, []);
  return <div>{todos.map(t => <div key={t.id}>{t.title}</div>)}</div>;
}

// ✅ 관심사 분리: API 호출은 Hook, 렌더링은 컴포넌트
function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    fetchTodos()
      .then(setTodos)
      .catch(setError);
  }, []);
  return { todos, error };
}

function TodoListComponent() {
  const { todos } = useTodos();
  return <div>{todos.map(t => <div key={t.id}>{t.title}</div>)}</div>;
}
```

### 3. 단방향 의존성 (Acyclic Dependency)

**원칙**: 모듈 간 의존성은 항상 한 방향이어야 한다. 순환 의존성을 절대 허용하지 않는다.

**적용 기준**:
- Frontend: 상위 컴포넌트 → 하위 컴포넌트 (역방향 절대 금지)
- Backend: Route → Controller → Service → Repository → Database (하향식 의존성만 허용)
- 모듈 간 순환 참조는 리팩토링으로 해결 (별도 유틸 모듈 도입 등)

**구체적 사례**:
```typescript
// ❌ 순환 의존성: UserService가 AuthService를 의존하고,
//    AuthService가 UserService를 의존
// src/services/UserService.ts
import { AuthService } from './AuthService';
class UserService {
  async signup(email: string, password: string) {
    const token = AuthService.generateToken(email);
  }
}

// src/services/AuthService.ts
import { UserService } from './UserService';
class AuthService {
  async validateUser(email: string) {
    return UserService.findByEmail(email);
  }
}

// ✅ 단방향 의존성: 공통 유틸 모듈 분리
// src/utils/TokenUtils.ts
export function generateToken(email: string) { /* ... */ }

// src/services/UserService.ts
import { generateToken } from '../utils/TokenUtils';
class UserService {
  async signup(email: string, password: string) {
    const token = generateToken(email);
  }
}

// src/services/AuthService.ts
import { generateToken } from '../utils/TokenUtils';
class AuthService {
  async validateUser(email: string) {
    return findByEmail(email);
  }
}
```

### 4. 불변성 선호 (Immutability Preference)

**원칙**: 상태 변경 시 새로운 객체를 생성하는 것을 선호한다. 직접 변경(mutation)은 최소화한다.

**적용 기준**:
- Frontend: 상태 업데이트 시 스프레드 연산자(`...`) 또는 `structuredClone` 활용
- Backend: 데이터 변경 시 새로운 객체 반환, 기존 객체는 변경하지 않음
- 배열/객체 변경: `map`, `filter`, `reduce` 등 순수 함수 활용
- 예외: 성능 최적화가 필요한 경우 명시적으로 주석 기록

**구체적 사례**:
```typescript
// ❌ 직접 변경: 상태 직접 수정
function addTodo(todo: Todo) {
  todos.push(todo);  // 직접 변경
  setTodos(todos);
}

// ✅ 불변성: 새로운 배열 생성
function addTodo(todo: Todo) {
  setTodos([...todos, todo]);
}

// ❌ 객체 직접 수정
function updateTodo(todoId: string, updates: Partial<Todo>) {
  const todo = todos.find(t => t.id === todoId);
  todo.title = updates.title;
  todo.description = updates.description;
  setTodos(todos);
}

// ✅ 새로운 객체 생성
function updateTodo(todoId: string, updates: Partial<Todo>) {
  const updatedTodos = todos.map(t =>
    t.id === todoId ? { ...t, ...updates } : t
  );
  setTodos(updatedTodos);
}
```

### 5. 명시적 오류 처리 (Explicit Error Handling)

**원칙**: 모든 예외 상황을 명시적으로 처리한다. 오류를 무시하거나 암묵적으로 처리하지 않는다.

**적용 기준**:
- 모든 비동기 작업은 `.catch()` 또는 `try-catch` 블록으로 감싼다
- API 응답 오류는 상태 코드(4xx, 5xx)로 명시적으로 반환
- 사용자에게 보여줄 오류는 명확한 메시지 제공
- 로그는 개발 단계에서는 상세히, 운영 단계에서는 민감 정보 제외
- 오류 타입별로 구분 처리 (입력 오류 vs 시스템 오류)

**구체적 사례**:
```typescript
// ❌ 암묵적 오류 처리: 오류 무시
fetch('/api/todos').then(res => res.json()).then(setTodos);

// ✅ 명시적 오류 처리
try {
  const response = await fetch('/api/todos');
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  const data = await response.json();
  setTodos(data);
} catch (error) {
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('Unknown error occurred');
  }
}

// Backend: 오류를 HTTP 상태 코드로 명시
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_INPUT',
        message: 'Email and password are required'
      });
    }
    const user = await createUser(email, password);
    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return res.status(400).json({
        status: 'error',
        code: 'DUPLICATE_EMAIL',
        message: 'Email already in use'
      });
    }
    console.error('Unexpected error:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error'
    });
  }
});
```

---

## 의존성 / 레이어 원칙

### Frontend 레이어 구조 및 의존 방향

**레이어 정의**:
```
┌─────────────────────────────────────┐
│     Pages (라우팅 및 레이아웃)       │ ← 최상위: 페이지 전체 구성
├─────────────────────────────────────┤
│  Components (UI 컴포넌트)            │ ← 중상위: 재사용 가능한 UI
├─────────────────────────────────────┤
│  Hooks (상태 로직, 데이터 페칭)     │ ← 중간: 비즈니스 로직 및 API 통신
├─────────────────────────────────────┤
│  Services/Utils (순수 함수, 도구)   │ ← 중하위: 순수 로직
├─────────────────────────────────────┤
│  Types/Contexts (타입, 전역 상태)   │ ← 하위: 기본 타입과 상태
└─────────────────────────────────────┘
```

**의존성 방향**:
- 상위 계층은 하위 계층을 의존하며, 역방향은 절대 금지
- 같은 계층 간의 의존성은 최소화
- 컴포넌트는 Props 전달로만 통신 (Props Drilling 최소화)

**구체적 규칙**:
```typescript
// ✅ 올바른 의존성
// src/pages/HomePage.tsx → src/components/TodoList.tsx → src/hooks/useTodos.ts
import TodoList from '../components/TodoList';
export default function HomePage() {
  return <TodoList />;
}

// src/components/TodoList.tsx → src/hooks/useTodos.ts
import { useTodos } from '../hooks/useTodos';
function TodoList() {
  const { todos } = useTodos();
  return ...;
}

// ❌ 잘못된 의존성 (상향식):
// 하위 컴포넌트가 상위 페이지를 직접 참조하면 안됨
// src/components/TodoItem.tsx
import HomePage from '../pages/HomePage';  // ❌ 금지: 순환 참조 위험
```

### Backend 레이어 구조 및 의존 방향

**레이어 정의**:
```
┌──────────────────────────────────────┐
│   Routes (라우팅, 엔드포인트 정의)   │ ← 최상위: HTTP 요청 라우팅
├──────────────────────────────────────┤
│  Controllers (요청 검증, 응답 조합)  │ ← 상위: 요청 처리 오케스트레이션
├──────────────────────────────────────┤
│  Services (비즈니스 로직)             │ ← 중간: 도메인 로직, 상태 전이
├──────────────────────────────────────┤
│  Repositories (데이터 접근 추상화)   │ ← 하위: SQL 쿼리 실행
├──────────────────────────────────────┤
│  Database (PostgreSQL)               │ ← 최하위: 데이터 저장소
└──────────────────────────────────────┘
```

**각 계층의 책임**:

| 계층 | 책임 | 예시 |
|------|------|------|
| **Routes** | HTTP 메서드 및 경로 정의, 미들웨어 연결 | `app.post('/api/todos', authMiddleware, createTodoController)` |
| **Controllers** | 요청 데이터 추출, 유효성 검증, 서비스 호출, 응답 구성 | `const todo = await todoService.create(req.body)` |
| **Services** | 비즈니스 로직 구현, 엔티티 상태 전이, 도메인 규칙 적용 | `is_overdue 계산, 상태 전환 검증` |
| **Repositories** | SQL 쿼리 실행, 결과 매핑 | `INSERT/SELECT/UPDATE/DELETE 직접 실행` |
| **Database** | 데이터 영속성 | 실제 PostgreSQL 저장소 |

**의존성 방향 및 규칙**:
```typescript
// ✅ 정방향 의존성만 허용 (Routes → Controllers → Services → Repositories)

// src/routes/todoRoutes.ts
import { createTodoController } from '../controllers/todoController';

app.post('/api/todos', authMiddleware, createTodoController);

// src/controllers/todoController.ts
import { todoService } from '../services/todoService';

export async function createTodoController(req: Request, res: Response) {
  const { title, description, due_date } = req.body;
  const userId = req.user.id;

  if (!title || !due_date) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_INPUT',
      message: 'Title and due_date are required'
    });
  }

  const todo = await todoService.create({
    userId,
    title,
    description,
    due_date
  });

  res.status(201).json({ status: 'success', data: todo });
}

// src/services/todoService.ts
import { todoRepository } from '../repositories/todoRepository';

export const todoService = {
  async create(data: CreateTodoInput): Promise<Todo> {
    const newTodo: Todo = {
      todo_id: crypto.randomUUID(),
      user_id: data.userId,
      title: data.title,
      description: data.description || null,
      due_date: new Date(data.due_date).toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    return todoRepository.insert(newTodo);
  }
};

// src/repositories/todoRepository.ts
import { db } from '../config/database';

export const todoRepository = {
  async insert(todo: Todo): Promise<Todo> {
    const result = await db.query(
      `INSERT INTO todos (todo_id, user_id, title, description, due_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [todo.todo_id, todo.user_id, todo.title, todo.description, todo.due_date, todo.status, todo.created_at, todo.updated_at]
    );
    return result.rows[0];
  }
};
```

**레이어 간 경계 규칙**:

| 위반 사항 | ❌ 잘못된 예 | ✅ 올바른 방식 |
|---------|---------|---------|
| Service에서 직접 HTTP 응답 반환 | `res.json(data)` in Service | HTTP 응답은 Controller에서만 |
| Repository에서 비즈니스 로직 구현 | `if (status === 'pending') { ... }` in Repository | Repository는 SQL만 실행 |
| Controller에서 SQL 쿼리 직접 실행 | `db.query('SELECT ...')` in Controller | 모든 DB 호출은 Repository를 통해 |
| Routes에서 비즈니스 로직 구현 | 서비스 호출 없이 로직 구현 | Routes는 라우팅과 미들웨어만 |

### 외부 의존성(npm 패키지) 관리 원칙

**원칙**:
- 의존성은 최소화하되, 필수 기능은 믿을 수 있는 패키지 선택
- 보안 업데이트는 정기적으로 확인
- 의존성 추가 시 팀 내 논의 후 진행

**Frontend 핵심 의존성**:
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.x.x",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

**Backend 핵심 의존성**:
```json
{
  "dependencies": {
    "express": "^4.18.x",
    "pg": "^8.x.x",
    "bcrypt": "^5.x.x",
    "jsonwebtoken": "^9.x.x"
  },
  "devDependencies": {
    "typescript": "^5.x.x",
    "@types/express": "^4.17.x",
    "@types/node": "^20.x.x"
  }
}
```

**금지 패키지** (ORM, Query Builder 등):
- `prisma`, `sequelize`, `typeorm`: ORM 사용 금지, 직접 SQL 사용
- `graphql`: MVP에서는 REST API만 사용
- 초기화 라이브러리 (e.g., `next.js`, `nuxt.js`): 상향식 구조 선호

---

## 코드 / 네이밍 원칙

### 파일/디렉토리 네이밍

**컴포넌트 파일 (React)**:
- 규칙: PascalCase
- 파일: `.tsx` 또는 `.ts`
- 예시: `TodoList.tsx`, `TodoItem.tsx`, `Button.tsx`
- 각 컴포넌트는 별도 디렉토리 (인덱스 패턴 선택)

```plaintext
src/components/
├── TodoList/
│   ├── TodoList.tsx
│   ├── TodoList.module.css
│   └── index.ts
├── TodoItem/
│   ├── TodoItem.tsx
│   ├── TodoItem.module.css
│   └── index.ts
└── Button/
    ├── Button.tsx
    ├── Button.module.css
    └── index.ts
```

**페이지 파일 (React Router)**:
- 규칙: PascalCase (컴포넌트와 동일)
- 파일: `.tsx`
- 예시: `HomePage.tsx`, `LoginPage.tsx`, `NotFoundPage.tsx`

**훅 파일 (React Hooks)**:
- 규칙: camelCase, `use` 접두사 필수
- 파일: `.ts` 또는 `.tsx`
- 예시: `useTodos.ts`, `useAuth.ts`, `useLocalStorage.ts`

**유틸리티/서비스 파일**:
- 규칙: camelCase
- 파일: `.ts`
- 예시: `apiClient.ts`, `tokenManager.ts`, `dateFormatter.ts`, `validators.ts`

**타입/인터페이스 파일**:
- 규칙: camelCase
- 파일: `.ts` (또는 `.d.ts`)
- 예시: `todo.types.ts`, `user.types.ts`, `api.types.ts`

**Context 파일**:
- 규칙: PascalCase (컴포넌트처럼 취급)
- 파일: `.tsx` 또는 `.ts`
- 예시: `AuthContext.tsx`, `ThemeContext.tsx`

**Backend 파일/디렉토리**:
- 규칙: camelCase (Node.js 표준 준수)
- 디렉토리: kebab-case 또는 camelCase 일관성 유지
- 파일: `.ts`
- 예시: `todoController.ts`, `todoService.ts`, `todoRepository.ts`

### 함수/변수 네이밍

**함수 네이밍**:
- 규칙: camelCase
- 동사로 시작 (동작 명확)
- 예시: `getTodos()`, `createTodo()`, `updateTodoStatus()`, `deleteTodo()`
- 비동기 함수도 동일 규칙 (async 키워드로 이미 구분)

```typescript
// ✅ 명확한 동작
async function fetchUserById(userId: string): Promise<User>
async function createTodo(todoInput: CreateTodoInput): Promise<Todo>
function validateEmail(email: string): boolean
function groupTodosByStatus(todos: Todo[]): Record<string, Todo[]>

// ❌ 모호한 동작
async function getData() // 뭐하는 함수?
function process() // 뭘 처리?
function check() // 뭘 확인?
```

**변수 네이밍**:
- 규칙: camelCase
- 명사 또는 형용사로 시작
- 타입 정보는 이름에 포함하지 않음 (타입 시스템이 담당)
- 부정형: `isXxx`, `hasXxx`, `shouldXxx` 선호

```typescript
// ✅ 명확한 의도
let todos: Todo[] = [];
let isLoading = false;
let hasError = false;
let currentUser: User | null = null;
let todoCountByStatus = new Map<string, number>();

// ❌ 모호하거나 타입 정보 포함
let todoList: Todo[] = [];  // List는 중복 (타입이 이미 배열)
let str = '';  // str은 모호
let t = new Todo();  // 의미 불명확
let userObj = {};  // Obj 없어도 됨
```

**상수 네이밍**:
- 규칙: UPPER_SNAKE_CASE (단, 타입 상수는 예외)
- 프로그램 전체에서 변하지 않는 값만 상수 처리
- 예시:

```typescript
// ✅ 상수 (변하지 않음)
const API_BASE_URL = 'http://localhost:3000/api';
const TOKEN_EXPIRY_MINUTES = 15;
const MAX_TODO_TITLE_LENGTH = 255;
const HTTP_STATUS_UNAUTHORIZED = 401;

// ❌ 상수처럼 보이지만 실제로 변함 (let 사용)
let currentPage = 1;  // 변할 수 있음
let selectedTodoId: string | null = null;  // 변할 수 있음

// ✅ 타입/인터페이스 상수 (PascalCase 유지)
const TodoStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed'
} as const;

enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}
```

### TypeScript 타입/인터페이스 네이밍

**명명 규칙**:
- 규칙: PascalCase
- 타입은 `Type` 접미사 선택 사항 (목적 명확할 시 생략)
- 인터페이스는 `I` 접두사 미사용 (TypeScript 권장)
- DTO는 명시적으로 `Input`, `Output` 또는 `Request`, `Response` 접미사

```typescript
// ✅ 인터페이스 (I 접두사 없음)
interface Todo {
  todo_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: TodoStatus;
  created_at: Date;
  updated_at: Date;
}

interface User {
  user_id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

// ✅ 입출력 타입 명시
interface CreateTodoInput {
  title: string;
  description?: string;
  due_date: string;
}

interface TodoResponse {
  todo_id: string;
  title: string;
  due_date: string;
  status: TodoStatus;
  is_overdue: boolean;
}

// ✅ 유니온 타입 / 제네릭
type TodoStatus = 'pending' | 'completed';
type AsyncResult<T> = { success: true; data: T } | { success: false; error: Error };

// ✅ 유틸리티 타입
type TodoPartial = Partial<Todo>;
type TodoReadonly = Readonly<Todo>;
type TodoKeys = keyof Todo;
```

**API 응답 타입 표준**:
```typescript
// 성공 응답
interface SuccessResponse<T> {
  status: 'success';
  data: T;
}

// 에러 응답
interface ErrorResponse {
  status: 'error';
  code: string;  // 에러 코드 (e.g., 'UNAUTHORIZED', 'DUPLICATE_EMAIL')
  message: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

### API 엔드포인트 네이밍 (RESTful)

**규칙**:
- 경로는 명사 중심 (동사는 HTTP 메서드로 표현)
- kebab-case 사용 (URL 표준)
- 리소스 계층은 깊이 2 이상 지양
- 쿼리 파라미터는 필터/정렬/검색 용도

**패턴**:

| 메서드 | 경로 | 설명 | 예시 |
|--------|------|------|------|
| GET | `/api/todos` | 목록 조회 | `GET /api/todos?status=pending&sort=due_date_asc` |
| GET | `/api/todos/:id` | 특정 아이템 조회 | `GET /api/todos/123e4567-e89b-12d3-a456-426614174000` |
| POST | `/api/todos` | 아이템 생성 | `POST /api/todos` (body: { title, description, due_date }) |
| PUT | `/api/todos/:id` | 아이템 전체 수정 | `PUT /api/todos/123e4567-e89b-12d3-a456-426614174000` |
| PATCH | `/api/todos/:id/status` | 아이템 부분 수정 | `PATCH /api/todos/123e4567-e89b-12d3-a456-426614174000/status` |
| DELETE | `/api/todos/:id` | 아이템 삭제 | `DELETE /api/todos/123e4567-e89b-12d3-a456-426614174000` |

```typescript
// ✅ RESTful 설계
app.get('/api/todos', getTodosController);
app.get('/api/todos/:todoId', getTodoByIdController);
app.post('/api/todos', createTodoController);
app.put('/api/todos/:todoId', updateTodoController);
app.patch('/api/todos/:todoId/status', updateTodoStatusController);
app.delete('/api/todos/:todoId', deleteTodoController);

// ❌ 동사 중심 (RESTful 아님)
app.get('/api/getTodos');
app.post('/api/createTodo');
app.post('/api/updateTodo/:todoId');
app.post('/api/deleteTodo/:todoId');

// ❌ 깊이 3 이상 (리소스 계층 과도함)
app.get('/api/users/:userId/todos/:todoId/items/:itemId');
```

### Database 컬럼/테이블 네이밍

**규칙**:
- 테이블명: snake_case, 단수형
- 컬럼명: snake_case
- 타임스탬프: `created_at`, `updated_at` 일괄 사용
- PK: `{table_name}_id`
- FK: `{referenced_table_name}_id`

```sql
-- ✅ 올바른 네이밍
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE todos (
  todo_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ 인덱스 네이밍
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_users_email ON users(email);

-- ❌ 잘못된 네이밍
CREATE TABLE user_todos (todo_id ...);  -- 테이블명 혼동
CREATE TABLE todos (
  id UUID,  -- PK 명확하지 않음
  user UUID,  -- FK 명확하지 않음
  created TIMESTAMP  -- 전체 시간, 시간대 정보 불명확
);
```

---

## 테스트 / 품질 원칙

### MVP 범위 내 테스트 전략

**원칙**: 테스트는 필수이지만, MVP 단계에서는 과도한 테스트 설정을 지양한다. 인수 기준(AC-01~AC-13)을 기준으로 수동/자동 테스트를 적절히 배분한다.

### 테스트 범위 정의

| 테스트 유형 | 범위 | 우선순위 | 구현 방식 |
|----------|------|--------|---------|
| **인증 흐름** | 회원가입, 로그인, 로그아웃, 토큰 갱신 | P0 (필수) | 수동 + 자동 (선택) |
| **할일 CRUD** | 생성, 조회, 수정, 삭제 | P0 (필수) | 수동 (API) + UI 테스트 |
| **데이터 격리** | 사용자 A가 사용자 B의 할일 접근 불가 | P0 (필수) | 수동 테스트 (403 확인) |
| **마감 기한 경과** | 현재 날짜 > due_date AND status=pending 항목이 최상단 표시 | P0 (필수) | 수동 테스트 (UI 시각 확인) |
| **반응형 UI** | 모바일(375px) / 데스크톱(1280px) 정상 동작 | P0 (필수) | 수동 테스트 (DevTools) |
| **예외 처리** | 잘못된 입력, 미인증 접근 시 오류 반환 | P0 (필수) | 수동 테스트 (curl/Postman) |
| **단위 테스트** | 유틸리티 함수, 유효성 검사 함수 | P1 (선택) | 자동 테스트 (Jest) |
| **성능 테스트** | 페이지 로드 시간, API 응답 시간 | P2 (이후 이터레이션) | 자동 모니터링 |

### 수동 테스트 체크리스트

인수 기준(AC-01~AC-13)을 기반으로 한 최종 검증 체크리스트:

```markdown
## 인증 기능 테스트

- [ ] AC-01: 회원가입 - 유효한 이메일/이름/비밀번호(8자 이상, 영문+숫자 혼용) 입력 시 계정 생성, 201 응답
- [ ] AC-02: 회원가입 - 중복 이메일 입력 시 400 에러, "이미 사용 중인 이메일" 메시지
- [ ] AC-03: 로그인 - 올바른 자격증명 입력 시 Access Token + Refresh Token 발급, 200 응답
- [ ] AC-04: 로그인 - 잘못된 자격증명 입력 시 401 에러, 토큰 미발급 확인
- [ ] AC-05: 미인증 상태에서 할일 API 호출 시 401 반환 및 로그인 페이지 리다이렉트

## 할일 관리 기능 테스트

- [ ] AC-06: 할일 생성 - 제목(필수) + 마감일(필수) + 설명(선택) 입력 시 생성 성공, 목록에 즉시 반영
- [ ] AC-07: 할일 생성 - 미인증 사용자 시도 시 401 반환
- [ ] AC-08: 할일 수정 - 제목/설명/마감일 수정 후 저장 시 즉시 목록에 반영
- [ ] AC-09: 할일 삭제 - 삭제 확인 다이얼로그 승인 후 영구 삭제, 목록에서 즉시 제거
- [ ] AC-10: 완료 처리 - 1회 클릭으로 pending → completed, 재클릭으로 completed → pending 되돌리기 가능

## 비즈니스 로직 테스트

- [ ] AC-11: 마감 기한 경과 - 서버 KST 기준 오늘 > due_date AND status=pending 항목은 목록 최상단에 별도 그룹으로 표시 (색상/아이콘 구분)
- [ ] AC-12: 데이터 격리 - 사용자 A가 사용자 B의 할일 조회/수정/삭제 시 403 반환

## UI/UX 테스트

- [ ] AC-13: 반응형 UI - 모바일(375px 이상) 및 데스크톱(1280px) 브라우저에서 주요 화면(로그인, 목록, 생성폼) 레이아웃 깨짐 없음
```

### 코드 품질 도구

**Frontend**:
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "format": "prettier --write src"
  },
  "devDependencies": {
    "eslint": "^8.x.x",
    "@typescript-eslint/eslint-plugin": "^6.x.x",
    "prettier": "^3.x.x",
    "typescript": "^5.x.x"
  }
}
```

**.eslintrc.json**:
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-types": "warn"
  }
}
```

**Backend**:
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit",
    "format": "prettier --write src"
  },
  "devDependencies": {
    "eslint": "^8.x.x",
    "@typescript-eslint/eslint-plugin": "^6.x.x",
    "prettier": "^3.x.x",
    "typescript": "^5.x.x"
  }
}
```

**TypeScript 설정 (tsconfig.json)**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### API 테스트 방법

**cURL을 이용한 기본 테스트**:
```bash
# 회원가입
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'

# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c cookies.txt

# 할일 목록 조회 (쿠키 포함)
curl http://localhost:3000/api/todos \
  -b cookies.txt

# 할일 생성
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Sample Todo",
    "description": "This is a sample todo",
    "due_date": "2026-02-20"
  }'

# 미인증 접근 테스트 (401 확인)
curl http://localhost:3000/api/todos
```

**Postman 환경 설정**:
- Base URL 변수: `{{BASE_URL}}` = `http://localhost:3000/api`
- 토큰 저장: 로그인 응답에서 `access_token` 추출 후 변수로 저장
- Pre-request Script에서 자동 토큰 갱신 로직 추가

---

## 설정 / 보안 / 운영 원칙

### 환경변수 관리

**파일 구조**:
```
project-root/
├── .env                    # 운영 환경 (GIT 제외)
├── .env.example           # 템플릿 (GIT 포함)
├── .env.development       # 개발 환경 (선택)
└── .env.local            # 로컬 오버라이드 (GIT 제외)
```

**.env.example (공개 템플릿)**:
```plaintext
# Frontend
REACT_APP_API_BASE_URL=http://localhost:3000/api
REACT_APP_ENVIRONMENT=development

# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/todolist
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_in_production
BCRYPT_COST_FACTOR=12
CORS_ORIGIN=http://localhost:3000
```

**.env (실제 운영 파일, GIT 제외)**:
```plaintext
# Frontend
REACT_APP_API_BASE_URL=https://api.my-todolist.com/api
REACT_APP_ENVIRONMENT=production

# Backend
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:secure_password@prod-db.example.com:5432/todolist_prod
JWT_SECRET=<생성된 암호화 키, 외부 노출 금지>
JWT_REFRESH_SECRET=<생성된 암호화 키, 외부 노출 금지>
BCRYPT_COST_FACTOR=12
CORS_ORIGIN=https://my-todolist.com
```

**.gitignore**:
```plaintext
# 환경 변수
.env
.env.local
.env.*.local

# Node.js
node_modules/
dist/
build/
*.log
npm-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*.user

# OS
.DS_Store
Thumbs.db

# 의존성 캐시
.npm
yarn.lock
pnpm-lock.yaml

# 빌드 아티팩트
*.tsbuildinfo
```

### 비밀 정보 관리

**원칙**:
- 모든 비밀 정보는 환경변수로 관리
- 코드에 하드코딩 절대 금지
- 운영 환경의 비밀은 `.env` 파일이 아닌 인프라 시크릿 관리 시스템 사용 (AWS Secrets Manager 등)

**비밀 정보 목록**:

| 항목 | 관리 방식 | 예시 |
|------|---------|------|
| JWT 시크릿 키 | 환경변수 | `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| DB 비밀번호 | 환경변수 (DATABASE_URL에 포함) | `postgresql://user:password@host` |
| API 키 | 환경변수 | 외부 서비스 API 키 |
| CORS Origin | 환경변수 | `CORS_ORIGIN=https://example.com` |

**Frontend 환경변수 주의**:
```typescript
// ❌ 절대 하지 말 것: 비밀을 Frontend 코드에 하드코딩
const API_BASE_URL = 'https://api.example.com';
const SECRET_KEY = 'super-secret-key-exposed-in-frontend';

// ✅ 안전한 방식: 환경변수 사용
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
// REACT_APP_* 변수만 Frontend에 노출됨 (빌드 시간에 주입)
```

### CORS 설정 원칙

**Backend CORS 설정**:
```typescript
import cors from 'cors';

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Frontend API 호출 설정**:
```typescript
// src/api/apiClient.ts
export const apiClient = {
  async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const url = `${process.env.REACT_APP_API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include'  // Refresh Token Cookie 포함
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API Error');
    }

    return response.json();
  },

  get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  },

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>('POST', endpoint, data);
  }
};
```

### 보안 헤더

**Backend 보안 헤더 설정**:
```typescript
import helmet from 'helmet';

app.use(helmet());

// 추가 보안 헤더
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

**인증 헤더 관리**:
```typescript
// JWT 토큰 인증 미들웨어
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Authorization header missing or invalid'
    });
  }

  const token = authHeader.substring(7);  // 'Bearer ' 제거

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      code: 'TOKEN_INVALID',
      message: 'Invalid or expired token'
    });
  }
}
```

### 로깅 원칙

**개발 환경 (NODE_ENV=development)**:
```typescript
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, data || '');
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error?.stack || error);
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`, data || '');
    }
  }
};

// 사용 예
logger.info('Server started', { port: 3000 });
logger.error('Failed to fetch user', new Error('DB connection failed'));
```

**운영 환경 (NODE_ENV=production)**:
```typescript
// 민감 정보 제외
const logger = {
  info: (message: string, data?: any) => {
    // 로그 수집 서비스로 전송 (e.g., CloudWatch, ELK Stack)
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      data: sanitize(data)
    }));
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error?.message  // 스택 트레이스 제외
    }));
  }
};

function sanitize(data: any): any {
  if (!data) return {};
  const result = { ...data };
  // 민감한 필드 제외
  delete result.password;
  delete result.token;
  delete result.secret;
  return result;
}
```

---

## 디렉토리 구조

### Frontend (React 19 + TypeScript) 디렉토리 구조

```plaintext
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── ...
├── src/
│   ├── components/                 # 재사용 가능한 UI 컴포넌트
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── TodoItem/
│   │   │   ├── TodoItem.tsx
│   │   │   ├── TodoItem.module.css
│   │   │   └── index.ts
│   │   ├── TodoList/
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoList.module.css
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.module.css
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.module.css
│   │   │   └── index.ts
│   │   └── ...
│   │
│   ├── pages/                      # 라우팅 페이지
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── HomePage.tsx            # /
│   │   ├── NotFoundPage.tsx
│   │   └── ...
│   │
│   ├── hooks/                      # 커스텀 훅 (상태 로직, 데이터 페칭)
│   │   ├── useTodos.ts
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   ├── useLocalStorage.ts
│   │   └── ...
│   │
│   ├── contexts/                   # Context API (전역 상태)
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx        # (선택) 다크모드 등
│   │   └── ...
│   │
│   ├── api/                        # API 호출 (서비스 계층)
│   │   ├── apiClient.ts            # Fetch/Axios 래퍼
│   │   ├── todoApi.ts              # Todo 관련 API
│   │   ├── authApi.ts              # Auth 관련 API
│   │   └── ...
│   │
│   ├── types/                      # TypeScript 타입 정의
│   │   ├── todo.types.ts
│   │   ├── user.types.ts
│   │   ├── api.types.ts
│   │   └── ...
│   │
│   ├── utils/                      # 유틸리티 함수
│   │   ├── dateFormatter.ts
│   │   ├── validators.ts           # 입력 유효성 검사
│   │   ├── localStorage.ts         # 로컬 스토리지 래퍼
│   │   ├── tokenManager.ts         # JWT 토큰 관리
│   │   └── ...
│   │
│   ├── styles/                     # 전역 스타일
│   │   ├── index.css              # 전역 CSS
│   │   ├── variables.css           # CSS 변수 (색상, 폰트 등)
│   │   └── ...
│   │
│   ├── App.tsx                     # 메인 컴포넌트 (라우팅)
│   └── main.tsx                    # 진입점
│
├── .env                            # 환경 변수 (GIT 제외)
├── .env.example                    # 환경 변수 템플릿
├── .gitignore
├── .eslintrc.json
├── tsconfig.json
├── vite.config.ts                  # 번들러 설정 (Vite 기준)
├── package.json
└── README.md
```

**각 디렉토리의 역할**:

| 디렉토리 | 역할 | 포함 파일 예시 |
|---------|------|----------|
| `components/` | 재사용 가능한 UI 컴포넌트 | Button, Modal, Input, TodoItem, TodoList |
| `pages/` | 라우팅 대상 전체 페이지 | LoginPage, HomePage, NotFoundPage |
| `hooks/` | 상태 로직, API 데이터 페칭 | useTodos, useAuth, useFetch |
| `contexts/` | 전역 상태 관리 | AuthContext (로그인 사용자 정보), ThemeContext |
| `api/` | API 클라이언트 및 엔드포인트 함수 | todoApi, authApi, apiClient |
| `types/` | TypeScript 타입/인터페이스 | Todo, User, ApiResponse |
| `utils/` | 순수 함수, 도구 함수 | dateFormatter, validators, tokenManager |
| `styles/` | 전역 CSS | 색상 변수, 공통 레이아웃 스타일 |

**파일 작성 예시**:

**src/types/todo.types.ts**:
```typescript
export interface Todo {
  todo_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;  // YYYY-MM-DD
  status: TodoStatus;
  is_overdue: boolean;  // 조회 시 계산
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
}

export type TodoStatus = 'pending' | 'completed';

export interface CreateTodoInput {
  title: string;
  description?: string;
  due_date: string;
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {}
```

**src/api/todoApi.ts**:
```typescript
import { apiClient } from './apiClient';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo.types';

export const todoApi = {
  async fetchTodos(
    status?: 'pending' | 'completed',
    sort: string = 'due_date_asc',
    search?: string
  ): Promise<Todo[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('sort', sort);
    if (search) params.append('q', search);

    return apiClient.get(`/todos?${params.toString()}`);
  },

  async createTodo(data: CreateTodoInput): Promise<Todo> {
    return apiClient.post('/todos', data);
  },

  async updateTodo(todoId: string, data: UpdateTodoInput): Promise<Todo> {
    return apiClient.put(`/todos/${todoId}`, data);
  },

  async updateTodoStatus(todoId: string, status: string): Promise<Todo> {
    return apiClient.patch(`/todos/${todoId}/status`, { status });
  },

  async deleteTodo(todoId: string): Promise<void> {
    return apiClient.delete(`/todos/${todoId}`);
  }
};
```

**src/hooks/useTodos.ts**:
```typescript
import { useState, useEffect } from 'react';
import { Todo } from '../types/todo.types';
import { todoApi } from '../api/todoApi';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadTodos() {
      try {
        setLoading(true);
        const data = await todoApi.fetchTodos();
        setTodos(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, []);

  return { todos, loading, error, setTodos };
}
```

### Backend (Node.js + Express + pg) 디렉토리 구조

```plaintext
backend/
├── src/
│   ├── config/                     # 설정 (DB, JWT, CORS 등)
│   │   ├── database.ts             # PostgreSQL 연결
│   │   ├── jwt.ts                  # JWT 설정
│   │   └── ...
│   │
│   ├── types/                      # TypeScript 타입 정의
│   │   ├── todo.types.ts
│   │   ├── user.types.ts
│   │   ├── api.types.ts
│   │   ├── express.types.ts        # Express Request 확장
│   │   └── ...
│   │
│   ├── middlewares/                # 미들웨어
│   │   ├── authMiddleware.ts       # JWT 인증
│   │   ├── errorHandler.ts         # 에러 처리
│   │   ├── corsMiddleware.ts       # CORS 설정
│   │   ├── requestLogger.ts        # 요청 로깅
│   │   └── ...
│   │
│   ├── routes/                     # 라우팅 정의
│   │   ├── authRoutes.ts           # /api/auth
│   │   ├── todoRoutes.ts           # /api/todos
│   │   ├── index.ts                # 라우트 통합
│   │   └── ...
│   │
│   ├── controllers/                # 요청 처리 로직
│   │   ├── authController.ts       # 인증 로직 (signup, login, logout)
│   │   ├── todoController.ts       # 할일 로직 (CRUD, status, search)
│   │   └── ...
│   │
│   ├── services/                   # 비즈니스 로직
│   │   ├── authService.ts          # 인증 서비스
│   │   ├── todoService.ts          # 할일 서비스
│   │   ├── userService.ts          # 사용자 서비스
│   │   └── ...
│   │
│   ├── repositories/               # 데이터 접근 계층
│   │   ├── userRepository.ts       # User CRUD
│   │   ├── todoRepository.ts       # Todo CRUD
│   │   └── ...
│   │
│   ├── utils/                      # 유틸리티 함수
│   │   ├── validators.ts           # 입력 유효성 검사
│   │   ├── passwordUtils.ts        # bcrypt 래퍼
│   │   ├── tokenUtils.ts           # JWT 토큰 관리
│   │   ├── dateUtils.ts            # 날짜/시간 유틸
│   │   └── ...
│   │
│   ├── exceptions/                 # 커스텀 에러 클래스
│   │   ├── ValidationError.ts
│   │   ├── UnauthorizedError.ts
│   │   ├── DuplicateEmailError.ts
│   │   └── ...
│   │
│   ├── app.ts                      # Express 앱 설정
│   └── server.ts                   # 서버 진입점
│
├── migrations/                     # (선택) DB 마이그레이션 스크립트
│   ├── 001_create_users_table.sql
│   ├── 002_create_todos_table.sql
│   └── ...
│
├── .env                            # 환경 변수 (GIT 제외)
├── .env.example                    # 환경 변수 템플릿
├── .gitignore
├── .eslintrc.json
├── tsconfig.json
├── package.json
└── README.md
```

**각 디렉토리의 역할**:

| 디렉토리 | 역할 | 포함 파일 예시 |
|---------|------|----------|
| `config/` | 설정 및 초기화 | database.ts, jwt.ts |
| `types/` | TypeScript 타입/인터페이스 | todo.types.ts, user.types.ts |
| `middlewares/` | Express 미들웨어 | authMiddleware, errorHandler |
| `routes/` | 라우팅 정의 | authRoutes, todoRoutes |
| `controllers/` | 요청 처리 로직 | authController, todoController |
| `services/` | 비즈니스 로직 | authService, todoService |
| `repositories/` | 데이터 접근 계층 | userRepository, todoRepository |
| `utils/` | 순수 함수, 도구 | validators, passwordUtils, tokenUtils |
| `exceptions/` | 커스텀 에러 클래스 | ValidationError, UnauthorizedError |
| `migrations/` | DB 스키마 버전 관리 (선택) | SQL 마이그레이션 스크립트 |

**파일 작성 예시**:

**src/types/express.types.ts**:
```typescript
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    name: string;
  };
}
```

**src/config/database.ts**:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
```

**src/repositories/todoRepository.ts**:
```typescript
import pool from '../config/database';
import { Todo } from '../types/todo.types';

export const todoRepository = {
  async insert(todo: Todo): Promise<Todo> {
    const result = await pool.query(
      `INSERT INTO todos (todo_id, user_id, title, description, due_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [todo.todo_id, todo.user_id, todo.title, todo.description, todo.due_date, todo.status, todo.created_at, todo.updated_at]
    );
    return result.rows[0];
  },

  async findByUserId(userId: string): Promise<Todo[]> {
    const result = await pool.query(
      `SELECT * FROM todos WHERE user_id = $1 ORDER BY due_date ASC, created_at ASC`,
      [userId]
    );
    return result.rows;
  },

  async findById(todoId: string): Promise<Todo | null> {
    const result = await pool.query(
      `SELECT * FROM todos WHERE todo_id = $1`,
      [todoId]
    );
    return result.rows[0] || null;
  },

  async update(todoId: string, updates: Partial<Todo>): Promise<Todo> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let index = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'todo_id' && key !== 'user_id') {
        setClauses.push(`${key} = $${index++}`);
        values.push(value);
      }
    });

    values.push(todoId);

    const result = await pool.query(
      `UPDATE todos SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE todo_id = $${index} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(todoId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM todos WHERE todo_id = $1`,
      [todoId]
    );
    return result.rowCount > 0;
  }
};
```

**src/services/todoService.ts**:
```typescript
import { todoRepository } from '../repositories/todoRepository';
import { Todo, CreateTodoInput } from '../types/todo.types';

export const todoService = {
  async create(data: CreateTodoInput & { userId: string }): Promise<Todo> {
    const todo: Todo = {
      todo_id: crypto.randomUUID(),
      user_id: data.userId,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    return todoRepository.insert(todo);
  },

  async getTodosByUser(userId: string): Promise<Todo[]> {
    return todoRepository.findByUserId(userId);
  },

  async getTodoById(todoId: string): Promise<Todo | null> {
    return todoRepository.findById(todoId);
  },

  async updateTodo(
    todoId: string,
    userId: string,
    updates: Partial<CreateTodoInput>
  ): Promise<Todo> {
    const todo = await this.getTodoById(todoId);
    if (!todo || todo.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    return todoRepository.update(todoId, updates);
  },

  async deleteTodo(todoId: string, userId: string): Promise<boolean> {
    const todo = await this.getTodoById(todoId);
    if (!todo || todo.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    return todoRepository.delete(todoId);
  }
};
```

**src/controllers/todoController.ts**:
```typescript
import { Response } from 'express';
import { AuthRequest } from '../types/express.types';
import { todoService } from '../services/todoService';

export async function createTodoController(req: AuthRequest, res: Response) {
  try {
    const { title, description, due_date } = req.body;
    const userId = req.user!.user_id;

    if (!title || !due_date) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_INPUT',
        message: 'Title and due_date are required'
      });
    }

    const todo = await todoService.create({
      userId,
      title,
      description,
      due_date
    });

    res.status(201).json({ status: 'success', data: todo });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error'
    });
  }
}

export async function getTodosController(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.user_id;
    const todos = await todoService.getTodosByUser(userId);

    res.json({ status: 'success', data: todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error'
    });
  }
}
```

**src/routes/todoRoutes.ts**:
```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { createTodoController, getTodosController } from '../controllers/todoController';

const router = Router();

router.get('/', authMiddleware, getTodosController);
router.post('/', authMiddleware, createTodoController);

export default router;
```

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.0 | 2026-02-11 | 프로젝트 구조 설계 원칙 최초 작성 |
| | | - 최상위 공통 원칙 5가지 정의 (단순성, 관심사 분리, 단방향 의존성, 불변성, 명시적 오류 처리) |
| | | - Frontend/Backend 계층 구조 및 의존성 방향 명시 |
| | | - 네이밍 규칙 통합 (파일, 함수, 변수, API, DB 등) |
| | | - MVP 범위 내 테스트 전략 및 인수 기준 체크리스트 제시 |
| | | - 환경변수, CORS, 보안 헤더, 로깅 설정 기준 |
| | | - Frontend/Backend 완전 디렉토리 구조 및 파일 작성 예시 포함 |
