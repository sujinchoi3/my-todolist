# 앱 스타일 가이드 - my_todolist (Team CalTalk)

작성일: 2026-02-12 | 버전: 1.0 | 상태: Draft

> 참조: Google Calendar UI (2026) — Material Design 기반 화이트/오렌지 테마
> Light / Dark 두 가지 테마를 CSS Custom Properties로 지원한다.

---

## 1. 색상 팔레트

### Light 모드

#### 기본 (Base)

| 역할 | 토큰명 | HEX | 설명 |
|------|--------|-----|------|
| 배경 | `--color-bg` | `#FFFFFF` | 페이지 전체 배경 |
| 서피스 | `--color-surface` | `#F8F9FA` | 카드, 모달, 입력 필드 배경 |
| 구분선 | `--color-border` | `#DADCE0` | 카드 테두리, 섹션 구분선 |

#### 텍스트 (Text)

| 역할 | 토큰명 | HEX | 설명 |
|------|--------|-----|------|
| 기본 텍스트 | `--color-text-primary` | `#3C4043` | 제목, 본문 |
| 보조 텍스트 | `--color-text-secondary` | `#70757A` | 날짜, 힌트, 플레이스홀더 |
| 비활성 텍스트 | `--color-text-disabled` | `#BDBDBD` | 비활성화된 요소 |

#### 브랜드 / 액션 (Brand / Action)

| 역할 | 토큰명 | HEX | 설명 |
|------|--------|-----|------|
| 주 액션 | `--color-primary` | `#F4511E` | CTA 버튼, 링크, 포커스 링 |
| 주 액션 Hover | `--color-primary-hover` | `#E64A19` | 버튼 hover 상태 |
| 주 액션 연한 배경 | `--color-primary-light` | `#FBE9E7` | 강조 배경 |

#### 상태 (State)

| 역할 | 토큰명 | HEX | 설명 |
|------|--------|-----|------|
| 성공 / 완료 | `--color-success` | `#0F9D58` | 완료 체크박스, 성공 인디케이터 |
| 성공 연한 배경 | `--color-success-light` | `#E6F4EA` | 완료 상태 카드 배경 |
| 에러 / 경고 | `--color-error` | `#D93025` | 에러 메시지, 기한 초과 아이콘 |
| 에러 연한 배경 | `--color-error-light` | `#FCE8E6` | 에러 필드 배경 |
| 선택 / 포커스 | `--color-focus` | `#4285F4` | 오늘 날짜 배지, 포커스 링 |
| 선택 연한 배경 | `--color-focus-light` | `#E8F0FE` | 선택된 필터 탭 배경 |

---

### Dark 모드

#### 기본 (Base)

| 역할 | 토큰명 | HEX | 설명 |
|------|--------|-----|------|
| 배경 | `--color-bg` | `#1C1C1E` | 페이지 전체 배경 |
| 서피스 | `--color-surface` | `#2C2C2E` | 카드, 모달, 입력 필드 배경 |
| 구분선 | `--color-border` | `#3A3A3C` | 카드 테두리, 섹션 구분선 |

#### 텍스트 (Text)

| 역할 | 토큰명 | HEX | 설명 |
|------|--------|-----|------|
| 기본 텍스트 | `--color-text-primary` | `#E8EAED` | 제목, 본문 |
| 보조 텍스트 | `--color-text-secondary` | `#9AA0A6` | 날짜, 힌트, 플레이스홀더 |
| 비활성 텍스트 | `--color-text-disabled` | `#5F6368` | 비활성화된 요소 |

#### 브랜드 / 액션 (Brand / Action)

| 역할 | 토큰명 | HEX | 설명 |
|------|--------|-----|------|
| 주 액션 | `--color-primary` | `#FF6D47` | CTA 버튼, 링크, 포커스 링 (Dark에서 밝게 조정) |
| 주 액션 Hover | `--color-primary-hover` | `#FF8A65` | 버튼 hover 상태 |
| 주 액션 연한 배경 | `--color-primary-light` | `#3E2723` | 강조 배경 |

#### 상태 (State)

| 역할 | 토큰명 | HEX | 설명 |
|------|--------|-----|------|
| 성공 / 완료 | `--color-success` | `#34A853` | 완료 체크박스, 성공 인디케이터 |
| 성공 연한 배경 | `--color-success-light` | `#1B3A27` | 완료 상태 카드 배경 |
| 에러 / 경고 | `--color-error` | `#F28B82` | 에러 메시지, 기한 초과 아이콘 (Dark에서 밝게 조정) |
| 에러 연한 배경 | `--color-error-light` | `#3C1F1D` | 에러 필드 배경 |
| 선택 / 포커스 | `--color-focus` | `#8AB4F8` | 오늘 날짜 배지, 포커스 링 (Dark에서 밝게 조정) |
| 선택 연한 배경 | `--color-focus-light` | `#1A2740` | 선택된 필터 탭 배경 |

---

## 2. CSS Custom Properties 정의

```css
/* ── Light 모드 (기본) ── */
:root {
  /* Base */
  --color-bg: #FFFFFF;
  --color-surface: #F8F9FA;
  --color-border: #DADCE0;

  /* Text */
  --color-text-primary: #3C4043;
  --color-text-secondary: #70757A;
  --color-text-disabled: #BDBDBD;

  /* Brand / Action */
  --color-primary: #F4511E;
  --color-primary-hover: #E64A19;
  --color-primary-light: #FBE9E7;

  /* State */
  --color-success: #0F9D58;
  --color-success-light: #E6F4EA;
  --color-error: #D93025;
  --color-error-light: #FCE8E6;
  --color-focus: #4285F4;
  --color-focus-light: #E8F0FE;

  /* Shadow */
  --shadow-card: 0 1px 3px rgba(60, 64, 67, 0.15);
  --shadow-card-hover: 0 4px 8px rgba(60, 64, 67, 0.20);
  --shadow-modal: 0 8px 24px rgba(60, 64, 67, 0.25);
}

/* ── Dark 모드 ── */
[data-theme='dark'] {
  /* Base */
  --color-bg: #1C1C1E;
  --color-surface: #2C2C2E;
  --color-border: #3A3A3C;

  /* Text */
  --color-text-primary: #E8EAED;
  --color-text-secondary: #9AA0A6;
  --color-text-disabled: #5F6368;

  /* Brand / Action */
  --color-primary: #FF6D47;
  --color-primary-hover: #FF8A65;
  --color-primary-light: #3E2723;

  /* State */
  --color-success: #34A853;
  --color-success-light: #1B3A27;
  --color-error: #F28B82;
  --color-error-light: #3C1F1D;
  --color-focus: #8AB4F8;
  --color-focus-light: #1A2740;

  /* Shadow */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.40);
  --shadow-card-hover: 0 4px 8px rgba(0, 0, 0, 0.50);
  --shadow-modal: 0 8px 24px rgba(0, 0, 0, 0.60);
}

/* ── 시스템 설정 자동 감지 (data-theme 미설정 시 폴백) ── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-bg: #1C1C1E;
    --color-surface: #2C2C2E;
    --color-border: #3A3A3C;
    --color-text-primary: #E8EAED;
    --color-text-secondary: #9AA0A6;
    --color-text-disabled: #5F6368;
    --color-primary: #FF6D47;
    --color-primary-hover: #FF8A65;
    --color-primary-light: #3E2723;
    --color-success: #34A853;
    --color-success-light: #1B3A27;
    --color-error: #F28B82;
    --color-error-light: #3C1F1D;
    --color-focus: #8AB4F8;
    --color-focus-light: #1A2740;
    --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.40);
    --shadow-card-hover: 0 4px 8px rgba(0, 0, 0, 0.50);
    --shadow-modal: 0 8px 24px rgba(0, 0, 0, 0.60);
  }
}
```

### 테마 전환 적용 방법 (React)

```tsx
// 토글 예시: <html> 또는 <body>의 data-theme 속성 변경
document.documentElement.setAttribute('data-theme', 'dark');  // Dark
document.documentElement.setAttribute('data-theme', 'light'); // Light
document.documentElement.removeAttribute('data-theme');        // 시스템 설정 따름
```

---

## 3. 타이포그래피

| 역할 | 폰트 | 크기 | 굵기 | 행간 |
|------|------|------|------|------|
| 페이지 제목 | `'Google Sans', sans-serif` | `22px` | `400` | `28px` |
| 섹션 헤더 | `'Google Sans', sans-serif` | `16px` | `500` | `24px` |
| 카드 제목 | `system-ui, sans-serif` | `14px` | `500` | `20px` |
| 본문 / 설명 | `system-ui, sans-serif` | `13px` | `400` | `18px` |
| 라벨 / 힌트 | `system-ui, sans-serif` | `12px` | `400` | `16px` |
| 에러 메시지 | `system-ui, sans-serif` | `12px` | `400` | `16px` |

---

## 4. 간격 (Spacing)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--space-1` | `4px` | 아이콘-텍스트 간격 |
| `--space-2` | `8px` | 인라인 에러 마진, 소 패딩 |
| `--space-3` | `12px` | 카드 내부 패딩 |
| `--space-4` | `16px` | 섹션 간격, 기본 패딩 |
| `--space-6` | `24px` | 모달 패딩, 폼 필드 간격 |
| `--space-8` | `32px` | 페이지 상하 패딩 |

---

## 5. 테두리 반지름 (Border Radius)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--radius-sm` | `4px` | 입력 필드, 배지 |
| `--radius-md` | `8px` | 카드, 버튼 |
| `--radius-lg` | `12px` | 모달, 다이얼로그 |
| `--radius-full` | `9999px` | 필터 탭 (pill 형태) |

---

## 6. 그림자 (Shadow)

Light / Dark 각각 다른 값을 CSS 변수로 정의 (섹션 2 참고).

| 토큰 | Light | Dark |
|------|-------|------|
| `--shadow-card` | `0 1px 3px rgba(60,64,67,.15)` | `0 1px 3px rgba(0,0,0,.40)` |
| `--shadow-card-hover` | `0 4px 8px rgba(60,64,67,.20)` | `0 4px 8px rgba(0,0,0,.50)` |
| `--shadow-modal` | `0 8px 24px rgba(60,64,67,.25)` | `0 8px 24px rgba(0,0,0,.60)` |

---

## 7. 컴포넌트별 스타일 규칙

### 버튼

| 종류 | 배경 | 텍스트 | 테두리 | Hover |
|------|------|--------|--------|-------|
| Primary (저장, 가입하기, 로그인) | `--color-primary` | `#FFFFFF` | 없음 | `--color-primary-hover` |
| Secondary (취소) | `--color-surface` | `--color-text-primary` | `--color-border` 1px | `--color-border` |
| Danger (삭제) | `--color-error` | `#FFFFFF` | 없음 | Dark: `#FF897A` |
| 비활성 (로딩 중) | `--color-border` | `--color-text-disabled` | 없음 | 변화 없음 |

### 입력 필드

| 상태 | 테두리 | 배경 |
|------|--------|------|
| 기본 | `--color-border` 1px | `--color-surface` |
| 포커스 | `--color-primary` 2px | `--color-bg` |
| 에러 | `--color-error` 2px | `--color-error-light` |
| 비활성 | `--color-border` 1px | `--color-surface` |

### 할일 카드 (TodoCard)

| 상태 | 좌측 테두리 | 배경 | 제목 텍스트 |
|------|------------|------|------------|
| 일반 (pending) | `--color-border` 1px | `--color-bg` | `--color-text-primary` |
| 기한 초과 (overdue) | `--color-error` 3px | `--color-primary-light` | `--color-error` |
| 완료 (completed) | `--color-success` 3px | `--color-success-light` | `--color-text-secondary` + 취소선 |

### 필터 탭

| 상태 | 배경 | 텍스트 | 테두리 |
|------|------|--------|--------|
| 비선택 | 투명 | `--color-text-secondary` | `--color-border` 1px |
| 선택 | `--color-focus-light` | `--color-focus` | `--color-focus` 1px |

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.0 | 2026-02-12 | `docs/8-wireframe.md` 섹션 11에서 분리, Dark 모드 추가 |
