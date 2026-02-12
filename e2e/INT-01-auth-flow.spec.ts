/**
 * INT-01: 인증 흐름 E2E 검증
 * 회원가입 → 로그인 → 홈 진입 → 토큰 갱신 → 로그아웃
 */
import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:3000/api'

// 테스트마다 고유 이메일 사용
const timestamp = Date.now()
const TEST_USER = {
  name: 'E2E테스터',
  email: `e2e_${timestamp}@test.com`,
  password: 'Test1234',
}

// 로그인 헬퍼: UI를 통해 로그인하고 홈으로 이동 확인
async function loginViaUI(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.getByRole('textbox', { name: '이메일' }).fill(TEST_USER.email)
  await page.getByRole('textbox', { name: '비밀번호' }).fill(TEST_USER.password)

  const [loginRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/auth/login')),
    page.getByRole('button', { name: '로그인' }).click(),
  ])
  expect(loginRes.status()).toBe(200)
  await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 10_000 })
}

test.describe.serial('INT-01: 인증 흐름 E2E', () => {

  // 테스트 시작 전 TEST_USER 계정 생성
  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/signup`, {
      data: TEST_USER,
    })
    // 201 또는 400(이미 존재)이면 OK
    expect([201, 400]).toContain(res.status())
  })

  // ────────────────────────────────────────────────────
  // 1. 회원가입
  // ────────────────────────────────────────────────────
  test('1. 회원가입 - 새 사용자 생성 및 201 응답 확인', async ({ page, request }) => {
    const newEmail = `e2e_new_${timestamp}@test.com`

    // API 직접 호출로 201 응답 확인
    const res = await request.post(`${API_URL}/auth/signup`, {
      data: {
        name: TEST_USER.name,
        email: newEmail,
        password: TEST_USER.password,
      },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('user_id')
    expect(body.email).toBe(newEmail)
    expect(body.name).toBe(TEST_USER.name)

    // UI에서도 회원가입 동작 확인 (별도 이메일)
    const uiEmail = `e2e_ui_${timestamp}@test.com`
    await page.goto(`${BASE_URL}/signup`)
    await page.getByRole('textbox', { name: '이름' }).fill(TEST_USER.name)
    await page.getByRole('textbox', { name: '이메일' }).fill(uiEmail)
    await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(TEST_USER.password)
    await page.getByRole('textbox', { name: '비밀번호 확인' }).fill(TEST_USER.password)

    const [signupResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/signup')),
      page.getByRole('button', { name: '가입하기' }).click(),
    ])
    expect(signupResponse.status()).toBe(201)

    // 가입 성공 → 자동 로그인 후 홈으로 이동
    await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 10_000 })
  })

  // ────────────────────────────────────────────────────
  // 2. 로그인
  // ────────────────────────────────────────────────────
  test('2. 로그인 - Access Token 메모리 저장, Refresh Token Cookie 확인', async ({ page, request }) => {
    // 직접 API 호출로 Set-Cookie 헤더 확인 (Vite 프록시 우회)
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    })
    expect(loginRes.status()).toBe(200)

    const setCookieHeader = loginRes.headers()['set-cookie']
    expect(setCookieHeader).toBeTruthy()
    expect(setCookieHeader).toContain('refreshToken')
    expect(setCookieHeader).toContain('HttpOnly')

    // UI에서 로그인 후 홈 이동 확인
    await loginViaUI(page)

    // Access Token이 쿠키에 없음 확인 (메모리 저장)
    const cookies = await page.evaluate(() => document.cookie)
    expect(cookies).not.toContain('access_token')

    // 홈 페이지에 사용자 이름 표시 확인
    await expect(page.getByText(`안녕하세요, ${TEST_USER.name}님`)).toBeVisible()
  })

  // ────────────────────────────────────────────────────
  // 3. 홈 페이지 - 로그인 상태로 진입 및 목록 조회
  // ────────────────────────────────────────────────────
  test('3. 홈 페이지 - 인증 상태 유지, 할일 목록 조회', async ({ page }) => {
    // 로그인과 todos 응답을 함께 기다림 (loginViaUI 완료 시 이미 응답이 끝날 수 있음)
    await page.goto(`${BASE_URL}/login`)
    await page.getByRole('textbox', { name: '이메일' }).fill(TEST_USER.email)
    await page.getByRole('textbox', { name: '비밀번호' }).fill(TEST_USER.password)

    const [loginRes, todosResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/login')),
      page.waitForResponse(
        (res) => res.url().includes('/todos') && res.status() === 200,
        { timeout: 15_000 }
      ),
      page.getByRole('button', { name: '로그인' }).click(),
    ])
    expect(loginRes.status()).toBe(200)
    expect(todosResponse.status()).toBe(200)

    await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 10_000 })

    // 사용자 이름 표시 확인
    await expect(page.getByText(`안녕하세요, ${TEST_USER.name}님`)).toBeVisible()

    // 검색바, 정렬, 필터 탭 UI 요소 확인
    await expect(page.getByPlaceholder('검색어 입력')).toBeVisible()
    await expect(page.getByRole('button', { name: '전체' })).toBeVisible()
    await expect(page.getByRole('button', { name: '미완료' })).toBeVisible()
    await expect(page.getByRole('button', { name: '완료', exact: true })).toBeVisible()
  })

  // ────────────────────────────────────────────────────
  // 4. 토큰 갱신 - Access Token 제거 후 자동 갱신
  // ────────────────────────────────────────────────────
  test('4. 토큰 갱신 - Access Token 만료 시 Refresh Token으로 자동 갱신', async ({ page }) => {
    await loginViaUI(page)

    // 쿠키가 실제로 저장되었는지 확인
    const cookiesBefore = await page.context().cookies()
    const hasRefreshToken = cookiesBefore.some((c) => c.name === 'refreshToken')
    expect(hasRefreshToken).toBe(true)

    // refresh 응답 listener를 reload 전에 등록
    const refreshResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/auth/refresh') &&
        res.request().method() === 'POST' &&
        res.status() === 200,
      { timeout: 15_000 }
    )

    // 페이지 새로고침
    await page.reload()

    const refreshResponse = await refreshResponsePromise
    expect(refreshResponse.status()).toBe(200)
    const refreshBody = await refreshResponse.json()
    expect(refreshBody).toHaveProperty('access_token')

    // 갱신 후에도 홈 페이지 유지
    await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 10_000 })
    await expect(page.getByText(`안녕하세요, ${TEST_USER.name}님`)).toBeVisible()
  })

  // ────────────────────────────────────────────────────
  // 5. 로그아웃
  // ────────────────────────────────────────────────────
  test('5. 로그아웃 - Refresh Token Cookie 삭제 및 /login 리다이렉트', async ({ page }) => {
    await loginViaUI(page)

    // 로그아웃 버튼 클릭
    const [logoutResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/logout')),
      page.getByRole('button', { name: '로그아웃' }).click(),
    ])
    expect(logoutResponse.status()).toBe(200)

    // /login으로 리다이렉트 확인
    await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 10_000 })

    // 로그아웃 후 / 접근 시 /login으로 리다이렉트 확인
    await page.goto(`${BASE_URL}/`)
    await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 10_000 })
  })

  // ────────────────────────────────────────────────────
  // 6. 중복 이메일 차단 (AC-02)
  // ────────────────────────────────────────────────────
  test('6. 중복 이메일 회원가입 차단 - 400 에러', async ({ page }) => {
    // beforeAll에서 이미 TEST_USER.email로 가입됨
    await page.goto(`${BASE_URL}/signup`)
    await page.getByRole('textbox', { name: '이름' }).fill(TEST_USER.name)
    await page.getByRole('textbox', { name: '이메일' }).fill(TEST_USER.email)
    await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(TEST_USER.password)
    await page.getByRole('textbox', { name: '비밀번호 확인' }).fill(TEST_USER.password)

    const [res] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/signup')),
      page.getByRole('button', { name: '가입하기' }).click(),
    ])
    expect(res.status()).toBe(400)

    // 에러 메시지 표시 확인
    await expect(page.getByText(/이미 사용 중인 이메일/)).toBeVisible()
  })

  // ────────────────────────────────────────────────────
  // 7. 잘못된 자격증명 로그인 차단 (AC-04)
  // ────────────────────────────────────────────────────
  test('7. 잘못된 자격증명 - 401 에러 및 에러 메시지', async ({ page, request }) => {
    // 직접 API 호출로 401 확인
    const apiRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: TEST_USER.email, password: 'wrongpassword' },
    })
    expect(apiRes.status()).toBe(401)
    const body = await apiRes.json()
    expect(body.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.')

    // UI에서 에러 메시지 표시 확인
    await page.goto(`${BASE_URL}/login`)
    await page.getByRole('textbox', { name: '이메일' }).fill(TEST_USER.email)
    await page.getByRole('textbox', { name: '비밀번호' }).fill('wrongpassword')

    const [res] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/login')),
      page.getByRole('button', { name: '로그인' }).click(),
    ])
    expect(res.status()).toBe(401)

    // 에러 메시지 표시 확인 (/login 유지)
    await expect(page).toHaveURL(`${BASE_URL}/login`)
    // client.ts가 401 응답에 대해 refresh를 시도하므로 에러 메시지가 표시될 때까지 기다림
    await expect(page.getByText(/올바르지 않습니다|로그인에 실패|로그인이 필요/)).toBeVisible({ timeout: 10_000 })
  })
})
