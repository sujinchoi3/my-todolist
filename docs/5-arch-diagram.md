# 기술 아키텍처 다이어그램 - my_todolist (Team CalTalk)

**작성일**: 2026-02-11 | **버전**: 1.1 | **상태**: Draft

---

## 1. 시스템 개요

3-tier 아키텍처의 각 계층 내부 구성요소와 통신 방식을 포함한 전체 구조도.

```mermaid
graph TD
    subgraph Browser["🖥️ Browser — React 19 + TypeScript (SPA)"]
        UI["Pages / Components"]
        Hooks["Custom Hooks\n(useAuth, useTodos)"]
        ApiClient["API Client\n(fetch + interceptor)"]
        AuthCtx["AuthContext\n(Access Token in Memory)"]
        Cookie["HttpOnly Cookie\n(Refresh Token)"]
    end

    subgraph Server["📡 API Server — Node.js + Express"]
        Router["Router\n/api/auth, /api/todos"]
        AuthMW["Auth Middleware\n(JWT verify)"]
        Controller["Controllers\n(AuthController, TodoController)"]
        Service["Services\n(AuthService, TodoService)"]
        Repository["Repositories\n(UserRepository, TodoRepository)"]
    end

    subgraph DB["🗄️ PostgreSQL 17"]
        UsersTable["users\n(user_id, email, password_hash, name)"]
        TodosTable["todos\n(todo_id, user_id FK, title, due_date, status)"]
    end

    UI --> Hooks
    Hooks --> ApiClient
    ApiClient -->|"Authorization: Bearer <token>\nHTTP/REST JSON"| Router
    AuthCtx -.->|"Access Token"| ApiClient
    Cookie -.->|"자동 첨부"| ApiClient

    Router --> AuthMW
    AuthMW --> Controller
    Controller --> Service
    Service --> Repository
    Repository -->|"SQL (pg)"| DB

    DB -->|"Result Set"| Repository
    Repository --> Service
    Service --> Controller
    Controller -->|"JSON Response"| ApiClient
```

---

## 2. 레이어 의존성 구조

Frontend와 Backend 각각의 레이어 간 단방향 의존성 규칙.

```mermaid
graph LR
    subgraph Frontend["Frontend 레이어"]
        direction TB
        FP["Pages"] --> FC["Components"]
        FC --> FH["Hooks"]
        FH --> FA["API Client"]
        FA --> FT["Types / Utils"]
    end

    subgraph Backend["Backend 레이어"]
        direction TB
        BR["Routes"] --> BC["Controllers"]
        BC --> BS["Services"]
        BS --> BRP["Repositories"]
        BRP --> BDB[("PostgreSQL")]
    end

    FA -->|"HTTP/REST"| BR
```

---

## 3. 인증 흐름

### 3-1. 로그인 및 토큰 발급

```mermaid
sequenceDiagram
    participant B as Browser
    participant MW as Auth Middleware
    participant C as AuthController
    participant S as AuthService
    participant DB as PostgreSQL

    B->>C: POST /api/auth/login {email, password}
    C->>S: login(email, password)
    S->>DB: SELECT * FROM users WHERE email = ?
    DB-->>S: User row (or null)

    alt 사용자 없음
        S-->>C: throw 401
        C-->>B: 401 { code: "UNAUTHORIZED" }
    else 사용자 존재
        S->>S: bcrypt.compare(password, hash)
        alt 비밀번호 불일치
            S-->>C: throw 401
            C-->>B: 401 { code: "UNAUTHORIZED" }
        else 인증 성공
            S->>S: jwt.sign() → Access Token (15min)
            S->>S: jwt.sign() → Refresh Token (7d)
            C-->>B: 200 { accessToken } + Set-Cookie: refreshToken (HttpOnly)
            B->>B: AccessToken → Memory (AuthContext)
        end
    end
```

### 3-2. Access Token 만료 시 갱신

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as API Server
    participant DB as PostgreSQL

    B->>S: GET /api/todos (만료된 Access Token)
    S-->>B: 401 { code: "TOKEN_EXPIRED" }

    B->>S: POST /api/auth/refresh (Cookie: refreshToken)
    S->>S: jwt.verify(refreshToken)
    S->>DB: SELECT user_id FROM users WHERE user_id = ?
    DB-->>S: User 확인
    S->>S: jwt.sign() → 새 Access Token (15min)
    S-->>B: 200 { accessToken }
    B->>B: 새 Access Token → Memory 갱신
    B->>S: GET /api/todos (새 Access Token) 재시도
```

### 3-3. 보호된 API 요청 흐름 (인증 미들웨어)

```mermaid
sequenceDiagram
    participant B as Browser
    participant MW as AuthMiddleware
    participant C as TodoController
    participant DB as PostgreSQL

    B->>MW: GET /api/todos\nAuthorization: Bearer <token>
    MW->>MW: jwt.verify(token, JWT_SECRET)

    alt 토큰 유효
        MW->>C: req.user = { user_id }
        C->>DB: SELECT * FROM todos WHERE user_id = ?
        DB-->>C: Todo rows
        C-->>B: 200 { todos: [...] }
    else 토큰 없음 / 만료
        MW-->>B: 401 { code: "UNAUTHORIZED" }
    end
```

---

## 4. 할일 CRUD 흐름

핵심 할일 생성 및 상태 변경 흐름.

```mermaid
sequenceDiagram
    participant B as Browser
    participant MW as AuthMiddleware
    participant C as TodoController
    participant S as TodoService
    participant DB as PostgreSQL

    Note over B,DB: 할일 생성
    B->>MW: POST /api/todos { title, due_date, description }
    MW->>C: req.user.user_id 주입
    C->>S: createTodo(user_id, { title, due_date, description })
    S->>S: 입력값 유효성 검증\n(title 필수, due_date 필수)
    S->>DB: INSERT INTO todos ...
    DB-->>S: 생성된 todo row
    S-->>C: Todo 객체
    C-->>B: 201 { todo }

    Note over B,DB: 완료 상태 토글
    B->>MW: PATCH /api/todos/:id/status { status: "completed" }
    MW->>C: req.user.user_id 주입
    C->>S: updateStatus(user_id, todo_id, status)
    S->>DB: SELECT user_id FROM todos WHERE todo_id = ?
    DB-->>S: 소유자 확인
    alt 소유자 불일치
        S-->>C: throw 403
        C-->>B: 403 { code: "FORBIDDEN" }
    else 소유자 일치
        S->>DB: UPDATE todos SET status = ? WHERE todo_id = ?
        DB-->>S: Updated row
        S-->>C: 수정된 Todo
        C-->>B: 200 { todo }
    end
```

---

## 5. 데이터 모델 (ER Diagram)

```mermaid
erDiagram
    USERS ||--o{ TODOS : "1:N (소유)"

    USERS {
        uuid    user_id     PK  "gen_random_uuid()"
        varchar email       UK  "RFC 5322, max 255"
        varchar password_hash   "bcrypt cost≥12"
        varchar name            "max 100"
        timestamp created_at    "DEFAULT NOW"
        timestamp updated_at    "DEFAULT NOW"
    }

    TODOS {
        uuid    todo_id     PK  "gen_random_uuid()"
        uuid    user_id     FK  "→ users.user_id CASCADE"
        varchar title           "NOT NULL, max 255"
        text    description     "NULL 허용, max 1000"
        date    due_date        "NOT NULL"
        varchar status          "'pending' | 'completed'"
        timestamp created_at    "DEFAULT NOW"
        timestamp updated_at    "DEFAULT NOW"
    }
```

**인덱스**:
- `idx_todos_user_id` — todos(user_id)
- `idx_todos_due_date` — todos(due_date)
- `idx_todos_status` — todos(status)

---

## 6. 마감 기한 경과 판정 로직

`is_overdue`는 DB 컬럼이 아닌 API 응답 시 서버에서 런타임 계산.

```mermaid
flowchart TD
    A["GET /api/todos 요청"] --> B["todos WHERE user_id = ? 조회"]
    B --> C{"각 todo에 대해"}
    C --> D{"status = 'pending'\nAND\n서버 KST 오늘 날짜 > due_date"}
    D -->|Yes| E["is_overdue = true"]
    D -->|No| F["is_overdue = false"]
    E --> G["응답 목록 구성"]
    F --> G
    G --> H{"is_overdue = true 항목 존재?"}
    H -->|Yes| I["기한 초과 그룹 (목록 최상단)"]
    H -->|No| J["일반 그룹\ndue_date 오름차순 정렬"]
    I --> K["JSON 응답 반환"]
    J --> K
```

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.0 | 2026-02-11 | 최초 작성 |
| 1.1 | 2026-02-11 | 구체화 — 레이어 내부 컴포넌트, 토큰 갱신 흐름, CRUD 시퀀스, is_overdue 판정 로직 추가 |
