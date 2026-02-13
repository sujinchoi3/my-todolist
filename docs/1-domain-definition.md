# my_todolist (Team CalTalk) - 도메인 정의서

**작성일**: 2026-02-10 | **버전**: 1.3 | **상태**: Draft

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **앱명** | my_todolist (Team CalTalk) |
| **목적** | 인증 기반 개인 일정 관리 및 할일 추적 |
| **대상 사용자** | 학생 (대학생 / 대학원생) |
| **제공 형태** | 브라우저 기반 웹 애플리케이션 (반응형 UI 필수) |
| **아키텍처** | Frontend / Backend / Database 분리 구조 |

**핵심 특징**
- 회원가입 및 로그인 기반 인증 서비스
- 할일 CRUD (생성, 조회, 수정, 삭제)
- 마감일(Due Date) 기반 일정 목록 조회
- 마감 기한 경과 항목 시각적 구분 (목록 최상단 별도 그룹)
- 완료 항목 별도 섹션 표시 (pending / completed 시각적 분리)
- 키워드 기반 할일 검색
- 다국어(KO/EN) 지원 (localStorage 유지)

---

## 2. 도메인 모델

### 2.1 핵심 엔티티

#### User (사용자)

| 속성 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `user_id` | UUID | PK | 사용자 고유 식별자 |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | 로그인 식별자 |
| `password_hash` | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| `name` | VARCHAR(100) | NOT NULL | 사용자 이름 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 가입 일시 |
| `updated_at` | TIMESTAMP | DEFAULT NOW | 수정 일시 |

#### Todo (할일)

| 속성 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `todo_id` | UUID | PK | 할일 고유 식별자 |
| `user_id` | UUID | FK → User, NOT NULL | 소유자 |
| `title` | VARCHAR(255) | NOT NULL | 할일 제목 |
| `description` | TEXT | NULL 허용 | 상세 설명 |
| `due_date` | DATE | NOT NULL | 계획 완료일 |
| `status` | ENUM | DEFAULT 'pending' | 상태: `pending` / `completed` |
| `created_at` | TIMESTAMP | DEFAULT NOW | 생성 일시 |
| `updated_at` | TIMESTAMP | DEFAULT NOW | 수정 일시 |

### 2.2 엔티티 관계

```
User (1) ────────── (N) Todo
  └─ 한 사용자는 여러 할일을 소유
  └─ 할일은 반드시 하나의 사용자에 속함
  └─ 사용자 삭제 시 소유한 할일 모두 삭제 (CASCADE)
```

---

## 3. 비즈니스 규칙

### 3.1 인증 및 인가 정책

| 구분 | 규칙 |
|------|------|
| **회원가입** | 누구나 이메일 + 비밀번호로 계정 생성 가능 |
| **로그인** | 등록된 사용자만 이메일/비밀번호로 인증 가능 |
| **기능 접근** | 인증된 사용자만 애플리케이션 모든 기능 사용 가능 |
| **데이터 격리** | 사용자는 자신의 할일만 조회/수정/삭제 가능 |

**JWT 토큰 정책**

| 항목 | 기준 |
|------|------|
| Access Token 만료 | 15분 |
| Refresh Token 만료 | 7일 |
| 로그아웃 처리 | 클라이언트 토큰 삭제 (서버 블랙리스트 미적용) |
| 토큰 갱신 | Refresh Token으로 Access Token 재발급 |

**입력 유효성 기준**

| 필드 | 규칙 |
|------|------|
| `email` | RFC 5322 형식, 최대 255자 |
| `password` | 최소 8자, 영문+숫자 혼용 필수 |
| `name` | 최소 1자, 최대 100자 |
| `title` | 최소 1자, 최대 255자 |
| `description` | 최대 1000자 (선택 입력) |

### 3.2 할일 소유권

- 할일은 생성한 사용자에게만 귀속
- 타인의 할일에 대한 접근 및 조작 불가
- 할일 삭제 시 해당 레코드 영구 삭제

### 3.3 할일 상태 정의

| 상태 | 설명 | 전환 |
|------|------|------|
| `pending` | 미완료 (진행 중) | → `completed` |
| `completed` | 완료 | → `pending` (되돌리기 가능) |

### 3.4 마감일 규칙

- 할일 생성 시 `due_date` 필수 입력
- `서버 기준 오늘 날짜(UTC+9, KST) > due_date` 이고 상태가 `pending`인 경우 "마감 기한 경과" 처리
- 마감 기한 경과 항목은 UI에서 **목록 최상단에 별도 그룹으로 표시** (색상/아이콘 구분 포함)
- `is_overdue`는 저장 컬럼이 아닌 조회 시 계산 처리

### 3.4-1 완료 항목 표시 규칙

- `status = completed` 항목은 `pending` 목록과 **별도 섹션으로 분리** 표시
- 분리는 클라이언트 사이드에서 처리 (API 응답의 `normal` 배열을 `status` 기준으로 구분)
- 완료 섹션은 할일 목록 하단에 위치하며 별도 헤더로 구분

### 3.5 일정 목록 조회 규칙

- 인증된 사용자는 자신의 할일 전체 목록을 조회할 수 있음
- 기본 정렬: `due_date` 오름차순 (마감일 빠른 순), 동일 `due_date`는 `created_at` 오름차순
- `sort` 파라미터 허용값: `due_date_asc`(기본) / `due_date_desc` / `created_at_asc` / `created_at_desc`
- 상태 필터링: `status` 파라미터로 `pending` / `completed` 구분 조회 가능
- 마감 기한 경과 항목은 목록 최상단에 별도 그룹으로 표시

### 3.6 키워드 검색 규칙

- 인증된 사용자는 자신의 할일에 한해 검색 가능
- 검색 대상 필드: `title`, `description`
- 검색 방식: 부분 일치 (LIKE 검색)
- 검색어가 공백인 경우 전체 목록 반환
- 검색 결과가 없을 경우 빈 배열 반환 (오류 아님)

---

## 4. 핵심 유스케이스

| ID | 유스케이스 | 액터 | 설명 | 관련 API |
|----|----------|------|------|---------|
| UC1 | 회원가입 | 비인증 사용자 | 이메일, 이름, 비밀번호 입력 후 계정 생성 | `POST /api/auth/signup` |
| UC2 | 로그인 | 비인증 사용자 | 이메일/비밀번호 인증으로 애플리케이션 접근 | `POST /api/auth/login` |
| UC3 | 로그아웃 | 인증된 사용자 | 세션 종료 | `POST /api/auth/logout` |
| UC4 | 할일 생성 | 인증된 사용자 | 제목, 설명(선택), 마감일 입력하여 할일 등록 | `POST /api/todos` |
| UC5 | 할일 목록 조회 | 인증된 사용자 | 자신의 모든 할일 목록 조회 (마감 기한 경과 구분, 상태 필터 포함) | `GET /api/todos` |
| UC6 | 키워드 검색 | 인증된 사용자 | 제목/설명 기준 키워드로 할일 검색 | `GET /api/todos?q={keyword}` |
| UC7 | 할일 수정 | 인증된 사용자 | 제목, 설명, 마감일 변경 | `PUT /api/todos/{todo_id}` |
| UC8 | 완료 처리 | 인증된 사용자 | 할일 상태를 `completed`로 변경 (되돌리기 가능) | `PATCH /api/todos/{todo_id}/status` |
| UC9 | 할일 삭제 | 인증된 사용자 | 특정 할일 영구 삭제 | `DELETE /api/todos/{todo_id}` |

---

## 5. API 엔드포인트 요약

### 인증 API

| Method | Endpoint | 인증 필요 | 설명 |
|--------|----------|----------|------|
| POST | `/api/auth/signup` | 불필요 | 회원가입 |
| POST | `/api/auth/login` | 불필요 | 로그인 (Access Token + Refresh Token 발급) |
| POST | `/api/auth/logout` | 필요 | 로그아웃 (토큰 무효화) |
| POST | `/api/auth/refresh` | 불필요 (쿠키) | Refresh Token으로 Access Token 재발급 |

### 할일 API

| Method | Endpoint | 인증 필요 | 설명 |
|--------|----------|----------|------|
| GET | `/api/todos` | 필요 | 내 할일 목록 조회 (query: `status`, `sort`, `q`) |
| POST | `/api/todos` | 필요 | 할일 생성 |
| GET | `/api/todos/{todo_id}` | 필요 | 특정 할일 조회 |
| PUT | `/api/todos/{todo_id}` | 필요 | 할일 수정 |
| PATCH | `/api/todos/{todo_id}/status` | 필요 | 상태 변경 (완료/미완료) |
| DELETE | `/api/todos/{todo_id}` | 필요 | 할일 삭제 |

**`GET /api/todos` 응답 구조**

```json
{
  "overdue": [ ...Todo[] ],
  "normal":  [ ...Todo[] ]
}
```

- `overdue`: `is_overdue = true`인 항목 (마감 기한 경과, pending 상태)
- `normal`: 나머지 항목 (`pending` + `completed` 혼합, 클라이언트에서 status로 분리 표시)
- 쿼리 파라미터: `status` (pending/completed), `sort` (due_date_asc 등), `q` (키워드 검색)

---

## 6. 데이터베이스 스키마 요약

```sql
-- 사용자 테이블
CREATE TABLE users (
  user_id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 할일 테이블
CREATE TABLE todos (
  todo_id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  due_date    DATE         NOT NULL,
  status      VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_status   ON todos(status);
```

**주요 제약사항**

| 제약 | 대상 | 설명 |
|------|------|------|
| UNIQUE | `users.email` | 이메일 중복 가입 방지 |
| FK + CASCADE | `todos.user_id` | 사용자 삭제 시 할일 자동 삭제 |
| CHECK | `todos.status` | `pending` / `completed` 값만 허용 |

---

## 7. 비기능 요구사항

### 7.1 보안

| 항목 | 요구사항 |
|------|---------|
| **비밀번호 저장** | bcrypt (cost factor 12 이상) 해시 알고리즘 적용 |
| **인증 방식** | JWT 기반 토큰 인증 (Access 15분 / Refresh 7일) |
| **통신 보안** | HTTPS 적용 (평문 전송 금지) |
| **CORS** | 허가된 프론트엔드 도메인만 접근 허용 |
| **데이터 접근 통제** | 백엔드에서 소유자 여부 검증 필수 |

### 7.2 UI/UX

| 항목 | 요구사항 |
|------|---------|
| **반응형 UI** | 데스크톱 / 모바일 브라우저 모두 정상 동작 필수 |
| **지원 디바이스** | 데스크톱, 모바일 (태블릿 포함) |

### 7.3 에러 처리

**HTTP 상태 코드 기준**

| 코드 | 의미 |
|------|------|
| 200 / 201 | 성공 / 생성 성공 |
| 400 | 잘못된 요청 (유효성 검증 실패) |
| 401 | 인증 실패 (로그인 필요) |
| 403 | 인가 실패 (권한 없음) |
| 404 | 리소스 없음 |
| 500 | 서버 내부 오류 |

**표준 에러 응답 형식**

```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "로그인이 필요합니다."
}
```

---

## 8. 변경 이력 (Changelog)

| 버전 | 날짜 | 변경 내용 | 변경 사유 |
|------|------|---------|---------|
| 1.0 | 2026-02-10 | 도메인 정의서 최초 작성 | 프로젝트 초안 수립 |
| 1.0 | 2026-02-10 | 일정 목록 조회(3.5), 키워드 검색(3.6) 기능 추가 | 요구사항 추가 반영 |
| 1.1 | 2026-02-10 | architect-reviewer 평가(76.6/100) 기반 개선 | 문서 품질 향상 |
| 1.2 | 2026-02-10 | 프로젝트 범위/일정/사용자/성공지표 반영 | 요구사항 추가 확정 |
| | | - 대상 사용자: 학생 (데스크톱/모바일 모두) | 타겟 유지 |
| | | - 제공 형태: 반응형 UI 필수 명시 | 모바일 지원 요구 반영 |
| | | - 비기능 요구사항 7.2 UI/UX 섹션 신설 | 완전성 향상 |
| | | - JWT 토큰 정책(만료 시간, 갱신 방식) 명세 추가 | 검증 가능성 향상 |
| | | - 입력 유효성 기준(필드별 길이, 비밀번호 정책) 추가 | 완전성·검증 가능성 향상 |
| | | - 마감일 타임존 기준 명확화 (KST 서버 기준) | 명확성 향상 |
| | | - 마감 기한 경과 표시 방식 확정 (목록 최상단 그룹) | 명확성 향상 |
| | | - `sort` 파라미터 허용값 및 2차 정렬 기준 추가 | 명확성·검증 가능성 향상 |
| | | - 유스케이스 테이블에 "관련 API" 컬럼 추가 | 추적성 향상 |
| | | - bcrypt cost factor 수치 명시 (12 이상) | 검증 가능성 향상 |
| | | - 변경 이력 섹션 신설 | 유지보수성 향상 |
| 1.3 | 2026-02-12 | 구현 완료 기능 반영 | 코드베이스 기준 문서 동기화 |
| | | - 핵심 특징에 완료항목 별도 섹션 표시, 다국어(KO/EN) 지원 추가 | 신규 기능 반영 |
| | | - §3.4-1 완료 항목 표시 규칙 신설 | 완료목록 분리 규칙 명문화 |
| | | - `POST /api/auth/refresh` 엔드포인트 표에 추가 | 누락 항목 보완 |
| | | - `GET /api/todos` 응답 구조 (`overdue`/`normal`) 명시 | 명확성 향상 |
| | | - 할일 API 쿼리 파라미터 `q` 통합 정리 | 중복 행 제거 |
