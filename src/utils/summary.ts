// 요약 가능한 메모 본문의 최소 길이 (공백 제외 앞뒤 trim 기준)
export const MIN_SUMMARY_CONTENT_LENGTH = 20

export const SUMMARY_ERROR_MESSAGE =
  '요약을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.'

export function canSummarize(content: string): boolean {
  return content.trim().length >= MIN_SUMMARY_CONTENT_LENGTH
}

export async function requestSummary(content: string): Promise<string> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    throw new Error(`요약 요청 실패: ${response.status}`)
  }

  const data: { summary?: unknown } = await response.json()
  if (typeof data.summary !== 'string' || data.summary.trim() === '') {
    throw new Error('요약 응답 형식이 올바르지 않습니다.')
  }
  return data.summary.trim()
}
