import { NextResponse } from 'next/server'
import { canSummarize } from '@/utils/summary'

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'

const SYSTEM_INSTRUCTION =
  '너는 메모 요약 도우미다. 사용자가 보낸 메모 본문(마크다운일 수 있음)을 ' +
  '한국어 2~3문장의 일반 텍스트로 요약해라. 마크다운 문법, 불릿, 제목, 따옴표 없이 ' +
  '요약문만 출력하고, 메모에 없는 내용은 추가하지 마라.'

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
    return NextResponse.json(
      { error: '서버에 API Key가 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  let content: unknown
  try {
    const body: { content?: unknown } = await request.json()
    content = body.content
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (typeof content !== 'string' || !canSummarize(content)) {
    return NextResponse.json(
      { error: '요약하기에는 메모 내용이 너무 짧습니다.' },
      { status: 400 }
    )
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL

  try {
    const geminiResponse = await fetch(
      `${GEMINI_ENDPOINT}/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: 'user', parts: [{ text: content }] }],
        }),
      }
    )

    if (!geminiResponse.ok) {
      console.error(
        'Gemini API 오류:',
        geminiResponse.status,
        await geminiResponse.text()
      )
      return NextResponse.json(
        { error: '요약 생성에 실패했습니다.' },
        { status: 502 }
      )
    }

    const data: GeminiResponse = await geminiResponse.json()
    const summary = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text ?? '')
      .join('')
      .trim()

    if (!summary) {
      console.error('Gemini API 응답에 요약 텍스트가 없습니다.')
      return NextResponse.json(
        { error: '요약 생성에 실패했습니다.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Gemini API 호출 중 예외 발생:', error)
    return NextResponse.json(
      { error: '요약 생성에 실패했습니다.' },
      { status: 502 }
    )
  }
}
