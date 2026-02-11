# 실행계획 - my_todolist (Team CalTalk)

작성일: 2026-02-11 | 버전: 1.0 | MVP 목표: 2026-02-14 금요일 오후

---

## 1. 개요

### 1.1 개발 일정 및 마일스톤

| 구분 | Day 1 (2026-02-12 수) | Day 2 (2026-02-13 목) | Day 3 (2026-02-14 금) |
|------|-----|-----|-----|
| 주요 목표 | DB 설정, 백엔드 기초, 인증 API | 할일 CRUD API, 프론트엔드 기초 | UI 완성, 통합 테스트, 배포 준비 |
| 핵심 Task | DB-01~03, BE-01~07 | BE-08~13, FE-01~06 | FE-07~13, INT-01~04 |
| 완료율 목표 | 25% | 60% | 100% |

### 1.2 Task 분해 원칙

**독립성**: 각 Task는 명확한 단일 책임을 가지며, 완료 후 다른 Task를 블로킹하지 않도록 설계

**완료 조건**: 모든 Task는 체크리스트 형태의 검증 가능한 완료 조건을 명시

**의존성**: Task 간 선행/후행 관계를 명시하여 병렬 작업 최대화
- 전제 조건(Blocking): 반드시 완료되어야 다음 Task 시작 가능
- 후행 차단(Blocked By): 이 Task가 완료되어야 다음 Task들이 시작 가능

---

## 2. 데이터베이스 Task 목록

### DB-01: PostgreSQL 17 로컬 환경 설정 및 DB 생성

**설명**: PostgreSQL 17 설치, 실행, 새로운 DB 인스턴스 생성 및 환경변수 설정

**예상 소요**: 0.5시간

**담당**: Backend

**완료 조건**:
- [x] PostgreSQL 17 설치 및 실행 확인
- [x] `my_todolist` DB 생성 확인
- [x] `.env` 파일에 `DB_URL` 환경변수 설정 (postgresql://user:password@localhost:5432/my_todolist)
- [x] `pg` CLI에서 연결 테스트 성공

**의존성**:
- 선행 필요: 없음
- 후행 차단: DB-02, BE-02

---

### DB-02: schema.sql 실행 및 테이블 생성 검증

**설명**: users, todos 테이블 DDL 실행, UUID 확장, 인덱스 생성, 제약 조건 검증

**예상 소요**: 0.5시간

**담당**: Backend

**완료 조건**:
- [x] `database/schema.sql` 파일 생성 완료 (users, todos 테이블 + 인덱스 + 제약사항)
- [x] DB 접속 후 `\dt` 명령으로 테이블 확인 가능
- [x] users 테이블: user_id(UUID PK), email(UNIQUE), password_hash, name, created_at, updated_at 컬럼 확인
- [x] todos 테이블: todo_id(UUID PK), user_id(FK CASCADE), title, description, due_date, status, created_at, updated_at 컬럼 확인
- [x] uuid-ossp 확장 활성화 확인 (pgcrypto 사용, gen_random_uuid() 동일 지원)
- [x] 인덱스 생성 확인 (users.email, todos.user_id, todos.status, todos.due_date)

**의존성**:
- 선행 필요: DB-01
- 후행 차단: DB-03, BE-02, BE-03

---

### DB-03: 샘플 데이터 seed 작성 (개발/테스트용)

**설명**: 테스트용 사용자 및 할일 데이터 seed.sql 작성 및 실행

**예상 소요**: 0.5시간

**담당**: Backend

**완료 조건**:
- [x] `database/seed.sql` 파일 생성 (최소 2명 사용자, 각 사용자당 5~10개 할일)
- [x] 할일 상태 다양화 (pending, completed)
- [x] 기한 다양화 (과거, 오늘, 미래)
- [x] seed.sql 실행 후 SELECT 쿼리로 데이터 확인
- [x] 최소 2명의 테스트 사용자 데이터 존재 확인

**의존성**:
- 선행 필요: DB-02
- 후행 차단: 없음

---

## 3. 백엔드 Task 목록

### BE-01: 프로젝트 초기 세팅 (package.json, tsconfig, 폴더 구조)

**설명**: Node.js 프로젝트 생성, TypeScript 설정, 필요한 패키지 설치, 폴더 구조 생성

**예상 소요**: 1시간

**담당**: Backend

**완료 조건**:
- [x] `backend/` 폴더 생성
- [x] `package.json` 작성 (express, pg, bcrypt, jsonwebtoken, dotenv, cors, uuid, typescript 등)
- [x] `tsconfig.json` 작성 (strict: true, target: ES2020, module: commonjs)
- [x] `.env.example` 파일 작성 (DB_URL, JWT_SECRET, NODE_ENV, PORT 포함)
- [x] 폴더 구조 생성: src/{config, types, middlewares, routes, controllers, services, repositories, utils}
- [x] `npm install` 실행 완료
- [x] `npm run build` 성공 (빌드 스크립트 설정)

**의존성**:
- 선행 필요: 없음
- 후행 차단: BE-02, BE-03, BE-04, BE-05

---

### BE-02: DB 연결 설정 (pg Pool 설정, 환경변수)

**설명**: PostgreSQL 연결 풀 초기화, 환경변수 로드, DB 연결 테스트

**예상 소요**: 1시간

**담당**: Backend

**완료 조건**:
- [x] `src/config/database.ts` 작성 (pg.Pool 인스턴스, 환경변수 로드)
- [x] Connection pool 설정 (max 20, idleTimeoutMillis 30000)
- [x] `src/utils/db.ts` 작성 (query, queryOne, execute 헬퍼 함수)
- [x] 환경변수 검증 (DB_URL 필수 확인)
- [x] 프로젝트 시작 시 DB 연결 테스트 (SELECT 1 쿼리)
- [x] 연결 실패 시 프로세스 종료 에러 처리

**의존성**:
- 선행 필요: BE-01, DB-01
- 후행 차단: BE-03, BE-04, BE-05, BE-08, BE-09, BE-10, BE-11, BE-12, BE-13

---

### BE-03: 회원가입 API (POST /api/auth/signup)

**설명**: 사용자 이메일 중복 검사, 비밀번호 bcrypt 해싱, users 테이블 삽입

**예상 소요**: 1.5시간

**담당**: Backend

**완료 조건**:
- [x] POST /api/auth/signup 엔드포인트 작성
- [x] 요청 body: { email, password, name }
- [x] 이메일 중복 검사 (UNIQUE 제약 존중, DB 쿼리)
- [x] 비밀번호 bcrypt 해싱 (cost factor 12)
- [x] UUID 자동 생성 (user_id)
- [x] 성공 응답: 201, { user_id, email, name }
- [x] 중복 이메일: 400, { error: "Email already exists" }
- [x] 입력 검증: email(이메일 형식), password(최소 8자), name(필수) - AC-02 만족

**의존성**:
- 선행 필요: BE-01, BE-02
- 후행 차단: 없음

---

### BE-04: 로그인 API (POST /api/auth/login) + JWT 발급

**설명**: 사용자 인증 (이메일 + 비밀번호), JWT Access/Refresh Token 발급

**예상 소요**: 1.5시간

**담당**: Backend

**완료 조건**:
- [x] POST /api/auth/login 엔드포인트 작성
- [x] 요청 body: { email, password }
- [x] users 테이블에서 이메일로 조회
- [x] bcrypt 비밀번호 검증
- [x] JWT Access Token 생성 (15분 만료, 메모리 저장용)
- [x] JWT Refresh Token 생성 (7일 만료, HttpOnly Cookie 저장)
- [x] 성공 응답: 200, { access_token, user: { user_id, email, name } }
- [x] Refresh Token HttpOnly Cookie 설정 (Secure, SameSite=Strict)
- [x] 실패 응답: 401, { error: "Invalid email or password" } - AC-04 만족

**의존성**:
- 선행 필요: BE-01, BE-02, BE-03
- 후행 차단: BE-05, FE-02

---

### BE-05: JWT 인증 미들웨어

**설명**: Authorization 헤더에서 Access Token 추출, 검증, 사용자 정보 요청 객체에 첨부

**예상 소요**: 1시간

**담당**: Backend

**완료 조건**:
- [x] `src/middlewares/auth.ts` 작성 (authMiddleware 함수)
- [x] Authorization: Bearer {token} 헤더 파싱
- [x] JWT 서명 검증 및 만료 확인
- [x] 토큰 유효: req.user = { user_id, email } 설정
- [x] 토큰 없음: 401, { error: "Unauthorized" }
- [x] 토큰 만료/무효: 401, { error: "Token expired or invalid" }
- [x] 보호된 라우트 장식 설정 가능

**의존성**:
- 선행 필요: BE-01, BE-02, BE-04
- 후행 차단: BE-06, BE-08, BE-09, BE-10, BE-11, BE-12, BE-13

---

### BE-06: Refresh Token API (POST /api/auth/refresh)

**설명**: HttpOnly Cookie에서 Refresh Token 추출, 검증, 새로운 Access Token 발급

**예상 소요**: 1시간

**담당**: Backend

**완료 조건**:
- [x] POST /api/auth/refresh 엔드포인트 작성
- [x] HttpOnly Cookie에서 refreshToken 추출
- [x] JWT Refresh Token 검증 (만료 확인)
- [x] 새로운 Access Token 생성 (15분 만료)
- [x] 성공 응답: 200, { access_token }
- [x] Refresh Token 만료: 401, { error: "Refresh token expired" }
- [x] 요청 실패 시 새 Refresh Token 발급 불가

**의존성**:
- 선행 필요: BE-01, BE-02, BE-04, BE-05
- 후행 차단: FE-02

---

### BE-07: 로그아웃 API (POST /api/auth/logout)

**설명**: HttpOnly Cookie의 Refresh Token 제거 (클라이언트 Access Token 메모리 삭제는 FE 책임)

**예상 소요**: 0.5시간

**담당**: Backend

**완료 조건**:
- [x] POST /api/auth/logout 엔드포인트 작성
- [x] refreshToken HttpOnly Cookie 삭제 (maxAge: 0)
- [x] 성공 응답: 200, { message: "Logged out" }
- [x] 미인증 요청도 200 응답 (멱등성)

**의존성**:
- 선행 필요: BE-01, BE-02
- 후행 차단: 없음

---

### BE-08: 할일 생성 API (POST /api/todos)

**설명**: 인증된 사용자의 새로운 할일 생성, todos 테이블 삽입

**예상 소요**: 1시간

**담당**: Backend

**완료 조건**:
- [x] POST /api/todos 엔드포인트 작성 (authMiddleware 장식)
- [x] 요청 body: { title, description, due_date }
- [x] 입력 검증: title(필수, 1~100자), due_date(ISO 8601 형식)
- [x] UUID 자동 생성 (todo_id)
- [x] user_id는 req.user에서 자동 획득
- [x] status 기본값: "pending"
- [x] 성공 응답: 201, { todo_id, user_id, title, description, due_date, status, created_at, updated_at }
- [x] AC-06, AC-07 만족 - AC-06 할일 생성 성공 (201), AC-07 미인증 시도 401

**의존성**:
- 선행 필요: BE-01, BE-02, BE-05
- 후행 차단: BE-09

---

### BE-09: 할일 목록 조회 API (GET /api/todos) — is_overdue 계산, 정렬, 필터, 검색

**설명**: 인증된 사용자의 할일 목록 조회, 기한 초과 계산, 정렬/필터/검색 지원

**예상 소요**: 2.5시간

**담당**: Backend

**완료 조건**:
- [x] GET /api/todos 엔드포인트 작성 (authMiddleware 장식)
- [x] Query 파라미터:
  - [x] status: pending|completed (필터, 기본값: 전체)
  - [x] sort: due_date_asc|due_date_desc|created_at_asc|created_at_desc (기본값: due_date_asc)
  - [x] q: 키워드 (title, description LIKE 부분 일치)
- [x] is_overdue 런타임 계산 (KST 기준 오늘 날짜 > due_date AND status = 'pending')
- [x] 응답 데이터:
  - [x] overdue 그룹: is_overdue = true인 항목들 (먼저)
  - [x] normal 그룹: is_overdue = false인 항목들 (나중)
  - [x] 각 그룹 내에서 정렬 규칙 적용
- [x] SQL WHERE 절: user_id = $1 AND (status = $2 OR $2 IS NULL)
- [x] 키워드 검색: WHERE title ILIKE '%{q}%' OR description ILIKE '%{q}%'
- [x] 성공 응답: 200, { overdue: [...], normal: [...] }
- [x] AC-11 만족 (기한 초과 항목 최상단 그룹 표시)

**의존성**:
- 선행 필요: BE-01, BE-02, BE-05, BE-08
- 후행 차단: FE-07

---

### BE-10: 할일 단건 조회 API (GET /api/todos/:id)

**설명**: 특정 할일 단건 조회, 소유권 검증

**예상 소요**: 0.5시간

**담당**: Backend

**완료 조건**:
- [x] GET /api/todos/:id 엔드포인트 작성 (authMiddleware 장식)
- [x] todo_id로 todos 테이블 조회
- [x] 소유권 검증: WHERE todo_id = $1 AND user_id = $2
- [x] 성공 응답: 200, { todo_id, user_id, title, description, due_date, status, is_overdue, created_at, updated_at }
- [x] 할일 없음: 404, { error: "Todo not found" }
- [x] 타인 할일 접근: 403, { error: "Forbidden" } - AC-12 만족

**의존성**:
- 선행 필요: BE-01, BE-02, BE-05, BE-08
- 후행 차단: FE-09

---

### BE-11: 할일 수정 API (PUT /api/todos/:id)

**설명**: 할일 전체 필드 수정, 소유권 검증

**예상 소요**: 1시간

**담당**: Backend

**완료 조건**:
- [x] PUT /api/todos/:id 엔드포인트 작성 (authMiddleware 장식)
- [x] 요청 body: { title, description, due_date, status }
- [x] 입력 검증: title, due_date 필드
- [x] 소유권 검증: WHERE todo_id = $1 AND user_id = $2
- [x] updated_at 자동 갱신
- [x] 성공 응답: 200, { 수정된 할일 객체 }
- [x] AC-08 만족 (할일 수정 즉시 반영)

**의존성**:
- 선행 필요: BE-01, BE-02, BE-05, BE-08
- 후행 차단: FE-09

---

### BE-12: 할일 상태 변경 API (PATCH /api/todos/:id/status)

**설명**: 할일 상태만 변경 (pending ↔ completed), 소유권 검증

**예상 소요**: 0.5시간

**담당**: Backend

**완료 조건**:
- [x] PATCH /api/todos/:id/status 엔드포인트 작성 (authMiddleware 장식)
- [x] 요청 body: { status } (pending|completed)
- [x] 소유권 검증: WHERE todo_id = $1 AND user_id = $2
- [x] updated_at 자동 갱신
- [x] 성공 응답: 200, { 수정된 할일 객체 }
- [x] AC-10 만족 (완료 토글)

**의존성**:
- 선행 필요: BE-01, BE-02, BE-05, BE-08
- 후행 차단: FE-10

---

### BE-13: 할일 삭제 API (DELETE /api/todos/:id)

**설명**: 할일 영구 삭제, 소유권 검증

**예상 소요**: 0.5시간

**담당**: Backend

**완료 조건**:
- [x] DELETE /api/todos/:id 엔드포인트 작성 (authMiddleware 장식)
- [x] 소유권 검증: WHERE todo_id = $1 AND user_id = $2
- [x] CASCADE DELETE 확인 (DB 제약)
- [x] 성공 응답: 204 (No Content)
- [x] 할일 없음: 404, { error: "Todo not found" }
- [x] AC-09 만족 (삭제 확인 후 영구 삭제)

**의존성**:
- 선행 필요: BE-01, BE-02, BE-05, BE-08
- 후행 차단: FE-11

---

### BE-14: 전역 에러 핸들러 미들웨어

**설명**: 모든 에러를 일관된 형식으로 처리 및 응답

**예상 소요**: 0.5시간

**담당**: Backend

**완료 조건**:
- [ ] `src/middlewares/errorHandler.ts` 작성
- [ ] 에러 응답 형식: { error, message, status }
- [ ] 404 핸들러 (존재하지 않는 라우트)
- [ ] 500 핸들러 (예상하지 못한 에러)
- [ ] DB 에러 처리 (쿼리 실패, 제약 위반)
- [ ] 모든 라우트에 적용

**의존성**:
- 선행 필요: BE-01, BE-02
- 후행 차단: 없음

---

### BE-15: CORS 설정

**설명**: 프론트엔드 도메인에서의 요청 허용

**예상 소요**: 0.25시간

**담당**: Backend

**완료 조건**:
- [ ] `src/config/cors.ts` 작성
- [ ] 허용 origin: http://localhost:5173 (Vite 개발 서버)
- [ ] 허용 메서드: GET, POST, PUT, PATCH, DELETE, OPTIONS
- [ ] 허용 헤더: Content-Type, Authorization
- [ ] 인증 정보 포함: credentials: true
- [ ] Express 앱에 적용

**의존성**:
- 선행 필요: BE-01
- 후행 차단: 없음

---

## 4. 프론트엔드 Task 목록

### FE-01: 프로젝트 초기 세팅 (Vite + React 19 + TS, 폴더 구조)

**설명**: Vite + React 19 + TypeScript 프로젝트 생성, 폴더 구조 정리

**예상 소요**: 1시간

**담당**: Frontend

**완료 조건**:
- [ ] `npm create vite@latest my-todolist-web -- --template react-ts` 실행
- [ ] `package.json` 업데이트 (React 19, TypeScript 최신)
- [ ] `vite.config.ts` 작성 (proxy 설정 선택)
- [ ] `tsconfig.json` 작성 (strict: true)
- [ ] 폴더 구조 생성: src/{components, pages, hooks, contexts, api, types, utils, styles}
- [ ] `.env.example` 작성 (VITE_API_BASE_URL=http://localhost:3000/api)
- [ ] `npm install` 실행 완료
- [ ] `npm run dev` 실행 확인

**의존성**:
- 선행 필요: 없음
- 후행 차단: FE-02, FE-03, FE-04

---

### FE-02: API Client 설정 (fetch wrapper, 인터셉터, 토큰 갱신 로직)

**설명**: fetch 기반 API 클라이언트, 요청/응답 인터셉터, Access Token 자동 갱신

**예상 소요**: 1.5시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/api/client.ts` 작성 (fetch 래퍼)
- [ ] 요청 인터셉터: Authorization 헤더에 Access Token 자동 추가
- [ ] 응답 인터셉터:
  - [ ] 401 에러 시 Refresh Token으로 토큰 갱신 시도
  - [ ] 갱신 성공 시 원래 요청 재시도
  - [ ] 갱신 실패 시 로그인 페이지로 리다이렉트
- [ ] 기본 설정: credentials: 'include' (HttpOnly Cookie 전송)
- [ ] 에러 응답 형식 정의 (ApiError 타입)
- [ ] `src/types/api.ts` 작성 (API 응답 타입 정의)
- [ ] AC-05 지원 (미인증 API 접근 시 401 + 로그인 리다이렉트)

**의존성**:
- 선행 필요: FE-01, BE-04, BE-05, BE-06
- 후행 차단: FE-03, FE-05, FE-06, FE-08, FE-09, FE-10, FE-11

---

### FE-03: AuthContext (Access Token 메모리 저장, 로그인 상태 관리)

**설명**: React Context + useContext Hook으로 전역 인증 상태 관리

**예상 소요**: 1.5시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/contexts/AuthContext.tsx` 작성
- [ ] 상태: { user, access_token, isLoading, error }
- [ ] 함수: { login(), signup(), logout(), refreshToken() }
- [ ] Access Token은 메모리 저장 (상태 변수)
- [ ] Refresh Token은 HttpOnly Cookie에 저장 (서버에서 관리)
- [ ] 초기화: 페이지 새로고침 시 Refresh Token으로 토큰 갱신 시도
- [ ] `src/hooks/useAuth.ts` 작성 (AuthContext 접근 편의)
- [ ] localStorage 사용 금지

**의존성**:
- 선행 필요: FE-01, FE-02, BE-03, BE-04
- 후행 차단: FE-04, FE-05, FE-06

---

### FE-04: 라우팅 설정 (React Router, Protected Route)

**설명**: React Router 설정, Protected Route 구현

**예상 소요**: 1시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/App.tsx` 작성 (Router 설정)
- [ ] 라우트 정의: /login, /signup, /
- [ ] ProtectedRoute 컴포넌트 작성 (인증 여부 확인)
- [ ] 미인증 사용자: /login으로 리다이렉트
- [ ] 로그인된 사용자: /login, /signup에서 /로 리다이렉트 (선택)
- [ ] AuthContext 활용

**의존성**:
- 선행 필요: FE-01, FE-02, FE-03
- 후행 차단: FE-05, FE-06, FE-07

---

### FE-05: 로그인 페이지 (/login)

**설명**: 이메일 + 비밀번호 입력, 로그인 요청, 성공 시 /로 리다이렉트

**예상 소요**: 1시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/pages/LoginPage.tsx` 작성
- [ ] 폼 요소: email (텍스트), password (비밀번호), submit (버튼)
- [ ] 유효성 검사: email 형식, password 필수
- [ ] 제출 시 POST /api/auth/login 호출 (useAuth().login())
- [ ] 성공: access_token 메모리 저장, user 상태 업데이트, / 리다이렉트
- [ ] 실패: 에러 메시지 표시 (401 등)
- [ ] 로딩 상태 표시 (버튼 비활성화)
- [ ] AC-03, AC-04 만족 (로그인 성공/실패)

**의존성**:
- 선행 필요: FE-01, FE-02, FE-03, FE-04
- 후행 차단: 없음

---

### FE-06: 회원가입 페이지 (/signup)

**설명**: 이메일 + 비밀번호 + 이름 입력, 회원가입 요청, 성공 시 /login으로 리다이렉트

**예상 소요**: 1시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/pages/SignupPage.tsx` 작성
- [ ] 폼 요소: email (텍스트), password (비밀번호), name (텍스트), submit (버튼)
- [ ] 유효성 검사: email 형식, password (최소 8자), name 필수
- [ ] 제출 시 POST /api/auth/signup 호출 (useAuth().signup())
- [ ] 성공: /login으로 리다이렉트 (또는 자동 로그인)
- [ ] 실패: 에러 메시지 표시 (400: 중복 이메일 등)
- [ ] 로딩 상태 표시
- [ ] AC-01, AC-02 만족 (회원가입 성공/중복 이메일 차단)

**의존성**:
- 선행 필요: FE-01, FE-02, FE-03, FE-04
- 후행 차단: 없음

---

### FE-07: 할일 목록 페이지 (/) — 기한 초과 그룹, 정렬, 필터, 검색바

**설명**: 인증된 사용자의 할일 목록 표시, 기한 초과 항목 최상단, 필터/정렬/검색 UI

**예상 소요**: 2.5시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/pages/HomePage.tsx` 작성
- [ ] 페이지 로드 시 GET /api/todos?... 호출
- [ ] UI 요소:
  - [ ] 검색바 (q 파라미터, 입력 시 실시간 또는 Enter 검색)
  - [ ] 상태 필터 (pending, completed 라디오 또는 탭)
  - [ ] 정렬 드롭다운 (due_date_asc(기본), due_date_desc, created_at_asc, created_at_desc)
  - [ ] 할일 추가 버튼 (FE-08로 이동)
- [ ] 할일 목록 표시:
  - [ ] 기한 초과 그룹 (상단, 빨간 색상/아이콘 - AC-11)
  - [ ] 일반 항목 그룹 (하단)
  - [ ] 각 할일: 체크박스, 제목, 설명 요약, 기한, 완료/수정/삭제 버튼
- [ ] 각 할일 행: 클릭 시 수정 페이지로 이동 (FE-09)
- [ ] 로딩 상태 표시
- [ ] 할일 없음: 빈 상태 메시지
- [ ] AC-11 만족 (기한 초과 항목 최상단 그룹 표시)

**의존성**:
- 선행 필요: FE-01, FE-02, FE-03, FE-04, BE-09
- 후행 차단: FE-08, FE-09, FE-10, FE-11

---

### FE-08: 할일 생성 폼 (모달/페이지)

**설명**: 제목, 설명, 기한 입력, POST /api/todos 호출

**예상 소요**: 1.5시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/components/TodoForm.tsx` 작성 (재사용 가능)
- [ ] 또는 `src/pages/NewTodoPage.tsx` 작성
- [ ] 폼 요소: title (텍스트), description (텍스트 영역), due_date (날짜 입력)
- [ ] 유효성 검사: title 필수, due_date 선택 사항
- [ ] 제출 시 POST /api/todos 호출
- [ ] 성공: 할일 생성됨, / 페이지로 리다이렉트 또는 목록 새로고침
- [ ] 실패: 에러 메시지 표시
- [ ] 취소 버튼 (이전 페이지로 돌아가기)
- [ ] AC-06 만족 (할일 생성 성공, 목록 즉시 반영)

**의존성**:
- 선행 필요: FE-01, FE-02, FE-03, FE-04, FE-07, BE-08
- 후행 차단: 없음

---

### FE-09: 할일 수정 폼 (모달/페이지, 기존값 pre-fill)

**설명**: 할일 단건 조회, 폼에 기존값 pre-fill, PUT /api/todos/:id 호출

**예상 소요**: 1.5시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/pages/EditTodoPage.tsx` 작성
- [ ] 페이지 로드 시 GET /api/todos/:id 호출
- [ ] 폼에 기존값 pre-fill (title, description, due_date, status)
- [ ] 유효성 검사: title 필수
- [ ] 제출 시 PUT /api/todos/:id 호출
- [ ] 성공: / 또는 이전 페이지로 리다이렉트, 목록 새로고침
- [ ] 실패: 에러 메시지 표시
- [ ] 타인 할일 접근 시 에러 처리 (AC-12)
- [ ] AC-08 만족 (할일 수정 즉시 반영)

**의존성**:
- 선행 필요: FE-01, FE-02, FE-03, FE-04, FE-07, BE-10, BE-11
- 후행 차단: 없음

---

### FE-10: 완료 토글 (체크박스 1클릭)

**설명**: 할일 행의 체크박스 클릭 시 상태 변경 (pending ↔ completed)

**예상 소요**: 0.75시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/components/TodoItem.tsx` 작성 (할일 행 컴포넌트)
- [ ] 체크박스 요소: checked = (status === 'completed')
- [ ] 클릭 시 PATCH /api/todos/:id/status 호출
- [ ] 성공: status 즉시 업데이트, UI 반영 (체크박스 상태 변경)
- [ ] 실패: 에러 메시지 표시, 상태 롤백
- [ ] AC-10 만족 (완료 토글)

**의존성**:
- 선행 필요: FE-01, FE-02, FE-03, FE-04, FE-07, BE-12
- 후행 차단: 없음

---

### FE-11: 할일 삭제 (삭제 확인 다이얼로그)

**설명**: 할일 행의 삭제 버튼 클릭 시 확인 다이얼로그 표시, 확인 시 DELETE 호출

**예상 소요**: 0.75시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/components/TodoItem.tsx` 또는 별도 컴포넌트에 삭제 버튼 추가
- [ ] 삭제 버튼 클릭 시 확인 다이얼로그 표시 (window.confirm 또는 커스텀 모달)
- [ ] 확인 시 DELETE /api/todos/:id 호출
- [ ] 성공: 목록에서 할일 제거 (또는 목록 새로고침)
- [ ] 실패: 에러 메시지 표시
- [ ] AC-09 만족 (삭제 확인 후 영구 삭제)

**의존성**:
- 선행 필요: FE-01, FE-02, FE-03, FE-04, FE-07, BE-13
- 후행 차단: 없음

---

### FE-12: 반응형 UI (375px 모바일 ~ 1280px 데스크톱)

**설명**: CSS 미디어 쿼리, 유연한 레이아웃으로 모바일/데스크톱 반응형 지원

**예상 소요**: 1.5시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/styles/globals.css` 또는 Tailwind CSS 설정
- [ ] 모바일 (375px): 단일 열 레이아웃, 터치 친화적 버튼 (최소 44px)
- [ ] 데스크톱 (1280px): 2+ 열 또는 여유 있는 레이아웃
- [ ] 폰트 크기 조정 (모바일 14px ~ 데스크톱 16px)
- [ ] 입력 필드 반응형 (width: 100% ~ max-width 설정)
- [ ] 테이블/목록 스크롤 지원 (모바일에서 가로 스크롤)
- [ ] 테스트: Chrome DevTools 모바일 에뮬레이션으로 확인
- [ ] AC-13 만족 (모바일/데스크톱 반응형 동작)

**의존성**:
- 선행 필요: FE-01, FE-05, FE-06, FE-07, FE-08, FE-09, FE-10, FE-11
- 후행 차단: 없음

---

### FE-13: 로딩 인디케이터 및 에러 메시지 표시

**설명**: API 요청 중 로딩 상태 표시, 에러 발생 시 사용자 친화적 메시지 표시

**예상 소요**: 0.75시간

**담당**: Frontend

**완료 조건**:
- [ ] `src/components/LoadingSpinner.tsx` 작성
- [ ] `src/components/ErrorAlert.tsx` 작성
- [ ] 로딩 인디케이터: 스핀 애니메이션, 진행 상태 표시
- [ ] 에러 메시지: 상단 또는 인라인 경고 표시
- [ ] API 에러 매핑: 에러 코드 → 사용자 친화적 메시지
  - [ ] 401: "로그인이 필요합니다"
  - [ ] 403: "접근 권한이 없습니다"
  - [ ] 404: "찾을 수 없습니다"
  - [ ] 400: "입력이 유효하지 않습니다: {상세}"
  - [ ] 500: "서버 오류가 발생했습니다"
- [ ] 자동 닫기 또는 닫기 버튼 제공

**의존성**:
- 선행 필요: FE-01, FE-02
- 후행 차단: 없음

---

## 5. 통합 테스트 Task 목록

### INT-01: 인증 흐름 E2E 검증 (회원가입 → 로그인 → 토큰 갱신 → 로그아웃)

**설명**: 사용자 인증 전체 흐름 테스트 (UI 기반)

**예상 소요**: 1시간

**담당**: QA / Backend + Frontend

**완료 조건**:
- [ ] 회원가입 페이지: 새 사용자 이메일, 비밀번호, 이름 입력 후 제출
- [ ] 검증: 201 응답, 사용자 생성 확인
- [ ] 로그인 페이지: 방금 생성한 사용자 로그인
- [ ] 검증: Access Token 메모리 저장, Refresh Token HttpOnly Cookie 저장 확인
- [ ] 홈 페이지: 로그인된 상태로 진입, 할일 목록 조회
- [ ] 토큰 갱신: 개발자 도구에서 Access Token 수동 제거 후 API 호출, 자동 갱신 확인
- [ ] 로그아웃: 로그아웃 버튼 클릭, Refresh Token Cookie 삭제 확인
- [ ] 검증: 로그인 페이지로 리다이렉트

**의존성**:
- 선행 필요: BE-03, BE-04, BE-05, BE-06, BE-07, FE-05, FE-06, FE-03
- 후행 차단: 없음

---

### INT-02: 할일 CRUD E2E 검증 (생성 → 조회 → 수정 → 삭제)

**설명**: 할일 전체 생명주기 테스트 (UI 기반)

**예상 소요**: 1.5시간

**담당**: QA / Backend + Frontend

**완료 조건**:
- [ ] 홈 페이지: 로그인된 상태, 할일 생성 버튼 클릭
- [ ] 생성 폼: 제목, 설명, 기한 입력 후 제출
- [ ] 검증: 201 응답, 할일 목록에 즉시 추가 (AC-06)
- [ ] 목록 조회: 새로 생성된 할일 확인, 정렬/필터/검색 기능 테스트
- [ ] 기한 초과 테스트: 과거 날짜 할일 생성, 기한 초과 그룹에 표시 확인 (AC-11)
- [ ] 수정: 할일 클릭, 제목/설명/기한 수정 후 제출
- [ ] 검증: 200 응답, UI 즉시 반영 (AC-08)
- [ ] 상태 변경: 체크박스 클릭, 상태 pending → completed 변경
- [ ] 검증: PATCH 성공 (AC-10)
- [ ] 삭제: 삭제 버튼 클릭, 확인 다이얼로그 확인 후 삭제
- [ ] 검증: 204 응답, 목록에서 제거 (AC-09)

**의존성**:
- 선행 필요: BE-08, BE-09, BE-10, BE-11, BE-12, BE-13, FE-07, FE-08, FE-09, FE-10, FE-11
- 후행 차단: 없음

---

### INT-03: 인수 기준 전체 체크리스트 검증 (AC-01 ~ AC-13)

**설명**: 모든 AC(Acceptance Criteria) 검증

**예상 소요**: 2시간

**담당**: QA / Product Manager

**완료 조건**:
- [ ] AC-01: 회원가입 성공 (201) — 새 사용자 회원가입 시 201 응답 확인
- [ ] AC-02: 중복 이메일 차단 (400) — 동일 이메일로 재 회원가입 시 400 응답
- [ ] AC-03: 로그인 성공, Access+Refresh Token 발급 (200) — 로그인 시 200 응답, 토큰 확인
- [ ] AC-04: 잘못된 자격증명 401 — 잘못된 비밀번호로 로그인 시 401 응답
- [ ] AC-05: 미인증 API 접근 시 401 + 로그인 리다이렉트 — 토큰 없이 할일 API 호출 시 401, 앱에서 로그인 페이지로 리다이렉트
- [ ] AC-06: 할일 생성 성공, 목록 즉시 반영 — 생성 후 새로고침 없이 목록에 나타남
- [ ] AC-07: 미인증 할일 생성 시도 401 — 로그인하지 않은 상태에서 생성 시도 시 401
- [ ] AC-08: 할일 수정 즉시 반영 — 수정 후 새로고침 없이 UI 업데이트
- [ ] AC-09: 삭제 확인 후 영구 삭제 — 삭제 버튼 클릭 시 확인 다이얼로그, 확인 후 영구 삭제
- [ ] AC-10: 완료 토글 (pending ↔ completed) — 체크박스 클릭으로 상태 전환
- [ ] AC-11: 기한 초과 항목 최상단 그룹 표시 (빨간 색상/아이콘) — 과거 날짜 항목이 목록 최상단에 빨간 색으로 표시
- [ ] AC-12: 타인 할일 접근 시 403 — 다른 사용자 할일에 직접 접근 시 403 응답
- [ ] AC-13: 모바일(375px+) / 데스크톱(1280px) 반응형 동작 — 각 해상도에서 레이아웃 정상 작동

**의존성**:
- 선행 필요: INT-01, INT-02
- 후행 차단: 없음

---

### INT-04: 모바일/데스크톱 반응형 UI 검증

**설명**: 다양한 해상도에서 UI 동작 확인

**예상 소요**: 1시간

**담당**: QA / Frontend

**완료 조건**:
- [ ] Chrome DevTools 모바일 에뮬레이션: 375px (iPhone SE) 테스트
  - [ ] 레이아웃 1열 표시, 가로 스크롤 없음
  - [ ] 버튼 크기 >= 44px
  - [ ] 텍스트 가독성 (14px+)
- [ ] iPad 에뮬레이션: 768px 테스트
  - [ ] 적절한 여백, 레이아웃 조정
- [ ] 데스크톱: 1280px+ 테스트
  - [ ] 레이아웃 충분한 공간 활용
  - [ ] 목록 테이블 또는 카드 형태 정상 표시
- [ ] 네트워크 속도: Fast 3G로 로딩 시간 확인 (< 3초 목표)
- [ ] 터치 이벤트: 모바일에서 클릭/스와이프 정상 동작

**의존성**:
- 선행 필요: FE-12, FE-13
- 후행 차단: 없음

---

## 6. Day별 실행 계획표

### Day 1: 2026-02-12 (수요일)

| 시간대 | 작업 | Task ID | 담당 | 예상 소요 | 완료 조건 |
|--------|------|---------|------|----------|----------|
| 09:00~09:30 | 프로젝트 킥오프, 환경 설정 회의 | - | 전체 | 0.5h | 팀 전원 환경 준비 완료 |
| 09:30~10:00 | PostgreSQL 17 설치 및 DB 생성 | DB-01 | BE | 0.5h | DB 연결 확인 |
| 10:00~10:30 | schema.sql 작성 및 실행 | DB-02 | BE | 0.5h | 테이블 생성 확인 |
| 10:30~11:00 | 샘플 데이터 seed 작성 | DB-03 | BE | 0.5h | 샘플 데이터 조회 확인 |
| 11:00~12:00 | Node.js 백엔드 초기 세팅 | BE-01 | BE | 1h | npm 패키지 설치 완료 |
| 12:00~13:00 | 점심시간 | - | - | - | - |
| 13:00~14:00 | DB 연결 설정 (pg Pool) | BE-02 | BE | 1h | DB 쿼리 헬퍼 함수 완성 |
| 14:00~15:30 | 회원가입 API (POST /signup) | BE-03 | BE | 1.5h | 회원가입 endpoint 완성 (AC-01, 02) |
| 15:30~17:00 | 로그인 API (POST /login) + JWT | BE-04 | BE | 1.5h | JWT 토큰 발급 확인 (AC-03, 04) |
| 17:00~18:00 | JWT 인증 미들웨어 | BE-05 | BE | 1h | authMiddleware 적용 가능 |
| 18:00~ | 일일 동기화 (Day 1 완료 리뷰) | - | 전체 | 0.5h | Day 2 준비 확인 |

**Day 1 목표**: DB 준비 완료, 인증 관련 API 3개(회원가입, 로그인, 미들웨어) 완성, 25% 진행

---

### Day 2: 2026-02-13 (목요일)

| 시간대 | 작업 | Task ID | 담당 | 예상 소요 | 완료 조건 |
|--------|------|---------|------|----------|----------|
| 09:00~10:00 | Refresh Token API + Logout | BE-06, BE-07 | BE | 1.5h | 토큰 갱신 및 로그아웃 동작 확인 |
| 10:00~11:00 | 전역 에러 핸들러 + CORS | BE-14, BE-15 | BE | 0.75h | 에러 처리 및 CORS 설정 완료 |
| 11:00~12:00 | React 프로젝트 초기 세팅 | FE-01 | FE | 1h | npm install 완료, Vite 개발 서버 실행 |
| 12:00~13:00 | 점심시간 | - | - | - | - |
| 13:00~14:30 | API Client 설정 + 인터셉터 | FE-02 | FE | 1.5h | fetch 래퍼 + 토큰 갱신 로직 완성 |
| 14:30~16:00 | AuthContext 구현 | FE-03 | FE | 1.5h | 전역 인증 상태 관리 가능 |
| 16:00~17:00 | 라우팅 설정 + Protected Route | FE-04 | FE | 1h | 라우트 기본 구조 완성 |
| 17:00~18:00 | 할일 생성/조회 API (BE-08, BE-09) | BE-08, BE-09 | BE | 2.5h (병렬) | CRUD endpoint 기초 완성 |
| 18:00~ | 일일 동기화 (Day 2 검토) | - | 전체 | 0.5h | BE API 70% 완성, FE 기초 60% 완성 |

**Day 2 목표**: 백엔드 인증 + 할일 조회/생성 API 완성(70%), 프론트엔드 기초 설정 완성(60%), 60% 진행

---

### Day 3: 2026-02-14 (금요일, MVP 목표일)

| 시간대 | 작업 | Task ID | 담당 | 예상 소요 | 완료 조건 |
|--------|------|---------|------|----------|----------|
| 09:00~10:00 | 할일 수정/삭제/상태변경 API | BE-10, BE-11, BE-12, BE-13 | BE | 2h (병렬) | CRUD 전체 완성 |
| 10:00~11:00 | 로그인/회원가입 페이지 | FE-05, FE-06 | FE | 2h (병렬) | 인증 UI 완성 |
| 11:00~12:00 | 할일 목록 페이지 기본 UI | FE-07 | FE | 1h | 목록 표시 + 기본 필터/정렬 |
| 12:00~13:00 | 점심시간 | - | - | - | - |
| 13:00~14:00 | 할일 생성/수정 폼 | FE-08, FE-09 | FE | 1.5h | 폼 UI + 연동 |
| 14:00~15:00 | 완료 토글 + 삭제 기능 | FE-10, FE-11 | FE | 1.5h | 인라인 액션 완성 |
| 15:00~16:00 | 반응형 UI + 로딩/에러 | FE-12, FE-13 | FE | 2h (병렬) | 모바일/데스크톱 동작 확인 |
| 16:00~17:00 | 통합 테스트 (INT-01, INT-02, INT-03) | INT-01, INT-02, INT-03 | QA | 2h | AC 전체 검증 완료 |
| 17:00~17:30 | 버그 수정 및 최종 조정 | - | 전체 | 0.5h | 치명적 버그 없음 |
| 17:30~ | MVP 제출 및 배포 준비 | - | 전체 | - | 프로젝트 완료 |

**Day 3 목표**: 모든 API 완성(100%), 프론트엔드 전체 UI 완성(100%), 통합 테스트 통과, MVP 제출 완료

---

## 7. 의존성 맵 (텍스트 형태)

### 데이터베이스 의존성
```
DB-01 (PostgreSQL 설치)
  ↓
DB-02 (스키마 생성)
  ├─→ DB-03 (샘플 데이터)
  └─→ BE-02 (DB 연결 설정)
```

### 백엔드 의존성
```
BE-01 (프로젝트 초기 세팅)
  ├─→ BE-02 (DB 연결) → BE-03 (회원가입)
  ├─→ BE-04 (로그인) → BE-05 (JWT 미들웨어)
  ├─→ BE-06 (Refresh) + BE-07 (로그아웃)
  ├─→ BE-14 (에러 핸들러)
  └─→ BE-15 (CORS)

BE-05 (JWT 미들웨어) [필수]
  ├─→ BE-08 (할일 생성)
  ├─→ BE-09 (할일 목록)
  ├─→ BE-10 (할일 단건)
  ├─→ BE-11 (할일 수정)
  ├─→ BE-12 (상태 변경)
  └─→ BE-13 (할일 삭제)
```

### 프론트엔드 의존성
```
FE-01 (프로젝트 초기 세팅)
  ├─→ FE-02 (API Client)
  │     └─→ FE-03 (AuthContext) → FE-04 (라우팅)
  │           ├─→ FE-05 (로그인 페이지)
  │           ├─→ FE-06 (회원가입 페이지)
  │           └─→ FE-07 (할일 목록)
  │                 ├─→ FE-08 (할일 생성)
  │                 ├─→ FE-09 (할일 수정)
  │                 ├─→ FE-10 (완료 토글)
  │                 └─→ FE-11 (할일 삭제)
  ├─→ FE-12 (반응형 UI)
  └─→ FE-13 (로딩/에러)
```

### 크로스 계층 의존성
```
API 선행 조건:
  BE-04 + BE-05 + BE-06 → FE-02 (API 클라이언트 구현)
  BE-03 + BE-04 → FE-05, FE-06 (인증 페이지 연동)
  BE-08 + BE-09 → FE-07, FE-08 (할일 목록 및 생성)
  BE-10 + BE-11 + BE-12 + BE-13 → FE-09, FE-10, FE-11 (할일 수정/삭제)

통합 테스트:
  INT-01: BE-03, BE-04, BE-05, BE-06, BE-07 + FE-05, FE-06, FE-03
  INT-02: BE-08~13 + FE-07~11
  INT-03: 모든 API + FE 페이지
  INT-04: FE-12, FE-13
```

---

## 8. 리스크 및 대응

| 리스크 | 영향 범위 | 발생 확률 | 대응 방안 | 모니터링 |
|--------|----------|---------|---------|---------|
| JWT 토큰 만료/갱신 로직 오류 | BE-04~06, FE-02~03 | 중 | BE 초기 테스트 강화, 토큰 갱신 로직 먼저 검증 | Day 2 오후 우선 테스트 |
| PostgreSQL 연결 풀 고갈 | BE-02, DB 쿼리 | 낮 | Connection pool 설정 검증 (max 20), 쿼리 최적화 | 부하 테스트 (선택) |
| 기한 초과(is_overdue) 계산 오류 | BE-09, FE-07 | 중 | KST 타임존 설정 확인, seed 데이터 과거/미래 날짜 포함 | Day 3 오전 테스트 |
| 타인 할일 접근 보안 (AC-12) 미검증 | BE-10~13 | 높 | 모든 할일 API에 user_id 소유권 검증 필수, 테스트 케이스 작성 | Day 3 중반 보안 검수 |
| 모바일 반응형 UI 시간 부족 | FE-07~13 | 중 | Tailwind CSS 또는 기본 미디어 쿼리로 빠르게 구현, 우선순위: 모바일 375px → 데스크톱 | Day 3 오후 최종 점검 |
| 팀 일정 변경/병가 | 전체 | 낮 | 병렬 작업 최대화, 크리티컬 Task는 2명 이상 숙지 | 일일 동기화 회의 |
| CORS/HttpOnly 쿠키 설정 오류 | BE-15, FE-02 | 중 | Day 1 DB 후 즉시 설정 검증, fetch credentials 옵션 확인 | Day 2 오전 테스트 |
| 배포 환경 설정 (선택) | 전체 | 낮 | 환경변수 .env 정리, 로컬 → 배포 환경 전환 테스트 | Day 3 오후 배포 전 |

**위험 감소 전략**:
1. **우선순위**: P0 기능(인증, CRUD)을 Day 1~2에 완성, P1 기능(필터/정렬/검색)은 Day 2 후반~Day 3
2. **병렬 작업**: BE와 FE 독립적 진행, 크로스 계층 검증은 Day 2 오후부터
3. **테스트 우선**: 각 API 완성 후 즉시 Postman/curl로 검증, UI와 함께 통합 테스트
4. **롤백 계획**: 각 Task 완료마다 git 커밋, 문제 시 이전 커밋으로 복구 가능

---

## 9. 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.0 | 2026-02-11 | 최초 작성 |
