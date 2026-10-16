import { expect, test, Page } from '@playwright/test'

const STORAGE_KEY = 'memo-app-memos'
const NOW = '2026-01-01T00:00:00.000Z'

const memos = [
  {
    id: 'memo-long',
    title: '긴 메모',
    content:
      '오늘 팀 회의에서 다음 분기 로드맵과 일정, 담당자 배정에 대해 길게 논의했다.',
    category: 'work',
    tags: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'memo-short',
    title: '짧은 메모',
    content: '우유 사기',
    category: 'personal',
    tags: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
]

async function openMemo(page: Page, title: string) {
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(memos)]
  )
  await page.goto('/')
  await page.getByTestId('memo-card').filter({ hasText: title }).click()
  await expect(page.getByTestId('memo-detail-modal')).toBeVisible()
}

test.describe('메모 AI 요약', () => {
  test('요약 버튼을 누르면 요약 결과를 보여 준다', async ({ page }) => {
    let release!: () => void
    const gate = new Promise<void>(resolve => (release = resolve))
    await page.route('**/api/summarize', async route => {
      await gate
      await route.fulfill({
        json: { summary: '팀 회의에서 로드맵과 일정을 논의했다.' },
      })
    })

    await openMemo(page, '긴 메모')
    const button = page.getByTestId('summarize-btn')
    await button.click()

    await expect(button).toBeDisabled()
    await expect(button).toHaveText('요약 중...')

    release()
    await expect(page.getByTestId('summary-result')).toHaveText(
      '팀 회의에서 로드맵과 일정을 논의했다.'
    )
    await expect(button).toBeEnabled()
    await expect(button).toHaveText('AI 요약')
  })

  test('버튼을 누를 때마다 요약을 새로 요청한다', async ({ page }) => {
    let calls = 0
    await page.route('**/api/summarize', route => {
      calls += 1
      return route.fulfill({ json: { summary: `요약 ${calls}` } })
    })

    await openMemo(page, '긴 메모')
    await page.getByTestId('summarize-btn').click()
    await expect(page.getByTestId('summary-result')).toHaveText('요약 1')
    await page.getByTestId('summarize-btn').click()
    await expect(page.getByTestId('summary-result')).toHaveText('요약 2')
  })

  test('요약 요청이 실패하면 오류 문구를 보여 주고 다시 시도할 수 있다', async ({
    page,
  }) => {
    let fail = true
    await page.route('**/api/summarize', route =>
      fail
        ? route.fulfill({
            status: 502,
            json: { error: '요약 생성에 실패했습니다.' },
          })
        : route.fulfill({ json: { summary: '재시도 성공' } })
    )

    await openMemo(page, '긴 메모')
    await page.getByTestId('summarize-btn').click()
    await expect(page.getByTestId('summary-error')).toContainText(
      '요약을 생성하지 못했습니다'
    )
    await expect(page.getByTestId('summarize-btn')).toBeEnabled()

    fail = false
    await page.getByTestId('summarize-btn').click()
    await expect(page.getByTestId('summary-result')).toHaveText('재시도 성공')
    await expect(page.getByTestId('summary-error')).toHaveCount(0)
  })

  test('본문이 너무 짧은 메모는 요약 버튼이 비활성화된다', async ({ page }) => {
    await openMemo(page, '짧은 메모')
    await expect(page.getByTestId('summarize-btn')).toBeDisabled()
  })
})
