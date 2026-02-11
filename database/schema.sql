-- =============================================================================
-- Project  : my_todolist (Team CalTalk)
-- Date     : 2026-02-11
-- Version  : 1.0
-- Database : PostgreSQL 17
-- Based on : docs/1-domain-definition.md (v1.2), docs/6-ERD.md (v1.0)
-- =============================================================================
-- Usage:
--   psql -U <user> -d <database> -f schema.sql
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid() 지원


-- ---------------------------------------------------------------------------
-- Drop existing tables (멱등성 보장, FK 의존성 순서: todos → users)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ---------------------------------------------------------------------------
-- Function: updated_at 자동 갱신
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 실제 데이터 변경이 있을 때만 타임스탬프 갱신
    IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    user_id       UUID         NOT NULL DEFAULT gen_random_uuid(),  -- PK, 자동 생성 UUID
    email         VARCHAR(255) NOT NULL,                            -- 로그인 식별자 (RFC 5322)
    password_hash VARCHAR(255) NOT NULL,                            -- bcrypt 해시 (cost factor >= 12)
    name          VARCHAR(100) NOT NULL,                            -- 사용자 이름 (1~100자)
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 생성 일시
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 수정 일시

    CONSTRAINT users_pkey         PRIMARY KEY (user_id),
    CONSTRAINT users_email_unique UNIQUE      (email),
    CONSTRAINT users_name_length  CHECK       (char_length(name) >= 1)
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- Table: todos
-- ---------------------------------------------------------------------------

CREATE TABLE todos (
    todo_id     UUID         NOT NULL DEFAULT gen_random_uuid(),  -- PK, 자동 생성 UUID
    user_id     UUID         NOT NULL,                            -- FK → users.user_id (CASCADE)
    title       VARCHAR(255) NOT NULL,                            -- 할일 제목 (1~255자)
    description TEXT         DEFAULT NULL,                        -- 상세 설명 (선택, max 1000자)
    due_date    DATE         NOT NULL,                            -- 마감일
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending',          -- 상태: pending | completed
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 생성 일시
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 수정 일시

    CONSTRAINT todos_pkey           PRIMARY KEY (todo_id),
    CONSTRAINT todos_user_id_fkey   FOREIGN KEY (user_id)
                                        REFERENCES users(user_id)
                                        ON DELETE CASCADE,
    CONSTRAINT todos_title_length   CHECK (char_length(title) >= 1),
    CONSTRAINT todos_desc_length    CHECK (description IS NULL OR char_length(description) <= 1000),
    CONSTRAINT todos_status_check   CHECK (status IN ('pending', 'completed'))
);

CREATE TRIGGER trg_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_todos_user_id  ON todos USING BTREE (user_id);   -- 사용자별 할일 조회
CREATE INDEX idx_todos_due_date ON todos USING BTREE (due_date);  -- 마감일 기준 정렬
CREATE INDEX idx_todos_status   ON todos USING BTREE (status);    -- 상태 필터링


-- ---------------------------------------------------------------------------
-- Verification queries (필요 시 주석 해제 후 실행)
-- ---------------------------------------------------------------------------

-- 테이블 목록 확인
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;

-- 인덱스 목록 확인
-- SELECT indexname, tablename, indexdef FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname IN ('idx_todos_user_id', 'idx_todos_due_date', 'idx_todos_status')
-- ORDER BY tablename, indexname;

-- 트리거 목록 확인
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table, trigger_name;
