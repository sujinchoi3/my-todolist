-- =============================================================================
-- Project  : my_todolist (Team CalTalk)
-- Date     : 2026-02-11
-- Version  : 1.0
-- Purpose  : 개발/테스트용 샘플 데이터
-- Password : 모든 테스트 계정 비밀번호 = "Password1!"
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 기존 데이터 초기화 (멱등성 보장)
-- ---------------------------------------------------------------------------

TRUNCATE TABLE todos, users RESTART IDENTITY CASCADE;


-- ---------------------------------------------------------------------------
-- Users (2명)
-- ---------------------------------------------------------------------------

INSERT INTO users (user_id, email, password_hash, name) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'alice@example.com',
    crypt('Password1!', gen_salt('bf', 12)),
    'Alice Kim'
),
(
    '22222222-2222-2222-2222-222222222222',
    'bob@example.com',
    crypt('Password1!', gen_salt('bf', 12)),
    'Bob Lee'
);


-- ---------------------------------------------------------------------------
-- Todos for Alice (8개: 과거 3, 오늘 1, 미래 4 / pending 5, completed 3)
-- ---------------------------------------------------------------------------

INSERT INTO todos (user_id, title, description, due_date, status) VALUES

-- 과거 기한 (기한 초과, pending → is_overdue = true)
(
    '11111111-1111-1111-1111-111111111111',
    '팀 회의 자료 준비',
    '주간 스프린트 회의 자료 PPT 작성',
    CURRENT_DATE - INTERVAL '5 days',
    'pending'
),
(
    '11111111-1111-1111-1111-111111111111',
    '코드 리뷰 요청 처리',
    'PR #42 코드 리뷰 피드백 반영',
    CURRENT_DATE - INTERVAL '2 days',
    'pending'
),
-- 과거 기한이지만 완료 (is_overdue = false)
(
    '11111111-1111-1111-1111-111111111111',
    '데이터베이스 스키마 설계',
    'ERD 작성 및 팀 공유 완료',
    CURRENT_DATE - INTERVAL '3 days',
    'completed'
),

-- 오늘 기한
(
    '11111111-1111-1111-1111-111111111111',
    '일일 스탠드업 준비',
    '오늘 진행할 작업 목록 정리',
    CURRENT_DATE,
    'pending'
),

-- 미래 기한 (pending)
(
    '11111111-1111-1111-1111-111111111111',
    'API 문서 작성',
    'Swagger 기반 REST API 명세서 작성',
    CURRENT_DATE + INTERVAL '2 days',
    'pending'
),
(
    '11111111-1111-1111-1111-111111111111',
    '프론트엔드 로그인 페이지 구현',
    'React + TypeScript로 로그인 UI 개발',
    CURRENT_DATE + INTERVAL '3 days',
    'pending'
),
-- 미래 기한 (completed)
(
    '11111111-1111-1111-1111-111111111111',
    '환경 설정 문서화',
    '.env.example 및 README 업데이트',
    CURRENT_DATE + INTERVAL '4 days',
    'completed'
),
(
    '11111111-1111-1111-1111-111111111111',
    '단위 테스트 작성',
    '인증 API 단위 테스트 커버리지 80% 달성',
    CURRENT_DATE + INTERVAL '7 days',
    'completed'
);


-- ---------------------------------------------------------------------------
-- Todos for Bob (8개: 과거 2, 오늘 1, 미래 5 / pending 5, completed 3)
-- ---------------------------------------------------------------------------

INSERT INTO todos (user_id, title, description, due_date, status) VALUES

-- 과거 기한 (기한 초과, pending → is_overdue = true)
(
    '22222222-2222-2222-2222-222222222222',
    '버그 수정: 로그인 토큰 만료 오류',
    'JWT Refresh Token 만료 시 앱이 멈추는 문제 수정',
    CURRENT_DATE - INTERVAL '4 days',
    'pending'
),
-- 과거 기한이지만 완료 (is_overdue = false)
(
    '22222222-2222-2222-2222-222222222222',
    '기술 스택 조사',
    'React 19 vs Vue 3 비교 분석 완료',
    CURRENT_DATE - INTERVAL '1 day',
    'completed'
),

-- 오늘 기한
(
    '22222222-2222-2222-2222-222222222222',
    'CI/CD 파이프라인 설정',
    'GitHub Actions 기반 자동 배포 워크플로우 작성',
    CURRENT_DATE,
    'pending'
),

-- 미래 기한 (pending)
(
    '22222222-2222-2222-2222-222222222222',
    '할일 목록 UI 구현',
    '기한 초과 그룹 상단 표시 포함한 목록 페이지 개발',
    CURRENT_DATE + INTERVAL '1 day',
    'pending'
),
(
    '22222222-2222-2222-2222-222222222222',
    '반응형 CSS 작업',
    '모바일 375px ~ 데스크톱 1280px 대응',
    CURRENT_DATE + INTERVAL '3 days',
    'pending'
),
(
    '22222222-2222-2222-2222-222222222222',
    '통합 테스트 시나리오 작성',
    'E2E 테스트 케이스 AC-01~AC-13 커버',
    CURRENT_DATE + INTERVAL '5 days',
    'pending'
),
-- 미래 기한 (completed)
(
    '22222222-2222-2222-2222-222222222222',
    '프로젝트 킥오프 미팅',
    '팀 역할 분담 및 일정 확정 완료',
    CURRENT_DATE + INTERVAL '2 days',
    'completed'
),
(
    '22222222-2222-2222-2222-222222222222',
    'DB 스키마 리뷰',
    'users, todos 테이블 설계 검토 및 승인',
    CURRENT_DATE + INTERVAL '6 days',
    'completed'
);
