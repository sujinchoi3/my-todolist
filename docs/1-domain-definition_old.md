# my_todolist (Team CalTalk) - 도메인 정의서

## 1. 프로젝트 개요

| 항목 | 설명 |
|------|------|
| **애플리케이션명** | my_todolist (Team CalTalk) |
| **목적** | 개인 일정 관리 및 할일 추적을 위한 웹 기반 캘린더 애플리케이션 |
| **대상 사용자** | 개인 일정 관리가 필요한 모든 개별 사용자 |
| **제공 형태** | 브라우저 기반 웹 애플리케이션 (SaaS) |
| **아키텍처** | Frontend / Backend / Database 분리 구조 |

### 핵심 특징
- 캘린더 기반 직관적인 일정 관리
- 회원가입 및 인증(로그인) 기반 서비스
- 할일 생성, 조회, 수정, 삭제 기능
- 마감일(Due Date) 기반 일정 추적
- 할일 완료 상태 관리
- 마감 기한 경과 일정 시각적 구분

---

## 2. 도메인 모델

### 핵심 엔티티

#### 2.1 User (사용자)
사용자 정보를 관리하는 핵심 엔티티

| 속성 | 타입 | 설명 |
|------|------|------|
| `user_id` | UUID | 사용자 고유 식별자 (Primary Key) |
| `email` | String | 로그인 식별자 (Unique) |
| `password_hash` | String | 암호화된 비밀번호 |
| `name` | String | 사용자 이름 |
| `created_at` | DateTime | 가입 일시 |
| `updated_at` | DateTime | 마지막 수정 일시 |

#### 2.2 Todo (할일)
사용자의 할일을 관리하는 핵심 엔티티

| 속성 | 타입 | 설명 |
|------|------|------|
| `todo_id` | UUID | 할일 고유 식별자 (Primary Key) |
| `user_id` | UUID | 할일 소유자 (Foreign Key → User) |
| `title` | String | 할일 제목 |
| `description` | String (Optional) | 할일 상세 설명 |
| `due_date` | Date | 계획 완료일 |
| `status` | Enum | 상태: `pending`, `completed` |
| `is_overdue` | Boolean | 마감 기한 경과 여부 (due_date < 오늘) |
| `created_at` | DateTime | 생성 일시 |
| `updated_at` | DateTime | 마지막 수정 일시 |

### 엔티티 관계

```
User (1) ─── (N) Todo
  |
  └─ 하나의 사용자는 여러 개의 할일을 소유
  └─ 할일은 정확히 하나의 사용자에 속함
```

---

## 3. 비즈니스 규칙

### 3.1 인증 및 인가 정책
- **회원가입**: 누구나 이메일과 비밀번호로 회원가입 가능
- **로그인**: 등록된 사용자만 이메일/비밀번호로 로그인 가능
- **권한**: 인증된 사용자만 애플리케이션의 모든 기능 사용 가능
- **데이터 격리**: 사용자는 자신의 할일만 조회/수정/삭제 가능 (다른 사용자 데이터 접근 불가)

### 3.2 할일(Todo) 소유권
- 할일은 생성한 사용자에게만 속함
- 사용자는 자신의 할일만 관리 가능
- 할일 삭제 시 관련된 모든 데이터도 함께 삭제

### 3.3 할일 상태 정의

| 상태 | 설명 | 전환 가능 상태 |
|------|------|--------------|
| `pending` | 진행 중 (미완료) | → completed |
| `completed` | 완료됨 | → pending |

### 3.4 마감일 규칙
- **설정**: 할일 생성 시 마감일(due_date) 필수 입력
- **표시**: 현재 날짜(오늘) > due_date인 경우 "마감 기한 경과"로 표시
- **시각화**: 마감 기한 경과 할일은 UI에서 시각적으로 구분 (색상, 아이콘 등)

---

## 4. 핵심 유스케이스

| 유스케이스 | 사용자 | 시나리오 |
|----------|------|---------|
| **UC1: 회원가입** | 비인증 사용자 | 이메일, 이름, 비밀번호를 입력하여 새로운 계정 생성 |
| **UC2: 로그인** | 비인증 사용자 | 이메일과 비밀번호로 인증하여 애플리케이션 접근 |
| **UC3: 로그아웃** | 인증된 사용자 | 세션 종료 및 애플리케이션 사용 중단 |
| **UC4: 할일 생성** | 인증된 사용자 | 제목, 설명(선택), 마감일을 입력하여 새로운 할일 생성 |
| **UC5: 할일 조회** | 인증된 사용자 | 자신의 모든 할일을 캘린더 형태로 조회 |
| **UC6: 할일 수정** | 인증된 사용자 | 기존 할일의 제목, 설명, 마감일 수정 |
| **UC7: 할일 완료 처리** | 인증된 사용자 | 할일의 상태를 'pending'에서 'completed'로 변경 |
| **UC8: 할일 삭제** | 인증된 사용자 | 할일 목록에서 특정 할일 삭제 |
| **UC9: 마감 기한 경과 확인** | 인증된 사용자 | 마감일이 지난 할일을 시각적으로 구분하여 확인 |

---

## 5. API 엔드포인트 요약

### 5.1 사용자 관련 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |

### 5.2 할일 관련 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/todos` | 인증된 사용자의 모든 할일 조회 |
| POST | `/api/todos` | 새로운 할일 생성 |
| GET | `/api/todos/{todo_id}` | 특정 할일 조회 |
| PUT | `/api/todos/{todo_id}` | 할일 수정 (제목, 설명, 마감일) |
| PATCH | `/api/todos/{todo_id}/status` | 할일 상태 업데이트 (완료/미완료) |
| DELETE | `/api/todos/{todo_id}` | 할일 삭제 |

---

## 6. 데이터베이스 스키마 요약

### 6.1 users 테이블

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 todos 테이블

```sql
CREATE TABLE todos (
  todo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_status ON todos(status);
```

### 6.3 주요 제약사항
- **Foreign Key**: todos.user_id → users.user_id (ON DELETE CASCADE)
- **Unique Constraint**: users.email (로그인 중복 방지)
- **Check Constraint**: todos.status는 'pending' 또는 'completed'만 허용
- **Index**: user_id, due_date, status 컬럼에 인덱스 생성 (조회 성능 최적화)

---

## 7. 비기능 요구사항

### 7.1 보안
- **비밀번호**: bcrypt 또는 argon2 해시 알고리즘으로 암호화 저장
- **세션**: JWT (JSON Web Token) 또는 세션 기반 인증 사용
- **HTTPS**: 모든 통신은 HTTPS를 통해 암호화
- **CORS**: 프론트엔드 도메인만 접근 허용하도록 설정
- **데이터 격리**: 사용자는 자신의 데이터만 접근 가능 (백엔드 검증 필수)

### 7.2 에러 처리
- **HTTP 상태 코드 준수**:
  - 200: 성공
  - 400: 잘못된 요청 (유효성 검증 실패)
  - 401: 인증 실패 (로그인 필요)
  - 403: 인가 실패 (권한 없음)
  - 404: 리소스 없음
  - 500: 서버 오류

- **에러 응답 형식**:
  ```json
  {
    "status": "error",
    "code": "RESOURCE_NOT_FOUND",
    "message": "요청한 할일을 찾을 수 없습니다.",
    "timestamp": "2026-02-10T10:30:00Z"
  }
  ```

### 7.3 성능
- 페이지 로딩 시간: 2초 이내
- API 응답 시간: 500ms 이내
- 데이터베이스 쿼리: 100ms 이내

### 7.4 가용성
- 99.5% 이상의 서비스 가용성 목표
- 자동 재시작 및 장애 복구 체계

### 7.5 데이터 관리
- **백업**: 일일 자동 백업 (최소 7일 보관)
- **로깅**: 모든 인증, 데이터 변경 이벤트 로깅
- **GDPR 준수**: 사용자 요청 시 개인정보 삭제 기능 지원 (우선순위 고려)

---

## 8. 용어 정의 (Glossary)

| 용어 | 정의 |
|------|------|
| **할일 (Todo)** | 사용자가 완료해야 할 작업이나 계획 |
| **마감일 (Due Date)** | 할일을 완료해야 하는 계획된 날짜 |
| **마감 기한 경과** | 현재 날짜가 마감일을 지난 상태 |
| **인증** | 사용자가 자신의 신원을 확인하는 과정 (로그인) |
| **인가** | 인증된 사용자가 특정 리소스에 접근할 권한이 있는지 확인 |

---

**작성일**: 2026-02-10
**버전**: 1.0
**상태**: Draft
