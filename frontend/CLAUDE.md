# Frontend CLAUDE.md

# 반드시 준수할 것

- 오버엔지니어링 금지. 지침에 명시된 기능만 그대로 정확하게 구현함
- SOLID 원칙 반드시 준수
- Clean Architecture 반드시 준수

## 기술 스택

| 항목 | 버전 |
|------|------|
| React | 19.2 |
| TypeScript | 5.9 (strict: true, erasableSyntaxOnly: true) |
| Vite | 7.3 |
| react-router-dom | 7.6 |
| Vitest + @testing-library/react | 테스트 |

## 명령어

```bash
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # 프로덕션 빌드 (tsc -b && vite build)
npm test           # 테스트 1회 실행
npm run test:watch # 테스트 watch 모드
```

## 핵심 패턴

### Access Token 관리
- **메모리 저장** (`src/api/client.ts`의 모듈 변수) — localStorage/sessionStorage 절대 사용 금지
- `setAccessToken(token)` / `getAccessToken()` 으로 읽고 씀
- Refresh Token은 HttpOnly Cookie (서버가 관리, 프론트에서 직접 접근 불가)

### API 호출
```ts
import { apiClient } from '../api/client'

const data = await apiClient.get<TodoListResponse>('/todos')
await apiClient.post('/todos', { title, due_date })
await apiClient.patch(`/todos/${id}/status`, { status })
await apiClient.delete(`/todos/${id}`)
```
- 401 응답 → 자동으로 `/auth/refresh` 호출 후 재시도
- 갱신 실패 → `accessToken = null` + `window.location.href = '/login'`
- 에러는 `ApiRequestError` (statusCode, code, message 포함)

### 인증 상태
```ts
import { useAuth } from '../hooks/useAuth'

const { user, isLoading, error, login, signup, logout } = useAuth()
```
- `isLoading = true`: 초기 refresh 시도 중 (UI에서 로딩 처리 필수)
- `user = null`: 미인증

### 라우트 보호
```tsx
// 인증 필요
<ProtectedRoute><HomePage /></ProtectedRoute>

// 비인증 전용 (로그인된 사용자는 /로 리다이렉트)
<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
```

## 테스트 작성 규칙

- 테스트 파일: 구현 파일과 같은 디렉토리, `.test.tsx` / `.test.ts`
- API 모킹: `vi.mock('../api/client', ...)` 패턴 사용
- `useAuth` 모킹: `vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(...)`
- 라우터가 필요한 테스트: `MemoryRouter` + `initialEntries` 사용
- `erasableSyntaxOnly: true` → class 생성자에서 `public readonly` parameter property 사용 불가, 일반 필드로 선언할 것

## 미구현 페이지 (App.tsx 플레이스홀더)

`src/App.tsx`에 임시 `LoginPage`, `SignupPage`, `HomePage` 함수가 있음.
FE-05~FE-07 구현 시 `src/pages/` 에 실제 컴포넌트를 만들고 App.tsx에서 import로 교체한다.
