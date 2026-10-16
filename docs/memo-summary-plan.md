# 메모 AI 요약 기능 계획

## 1. 목표

메모 상세 모달(`MemoDetailModal`)에서 "AI 요약" 버튼을 누르면 Gemini(`gemini-3.5-flash-lite`)가 메모를 한국어 2~3문장으로 요약해 보여 준다.

## 2. 범위

### 포함

- 모달에 "AI 요약" 버튼과 결과 표시 영역 추가
- 버튼을 누를 때마다 요약을 새로 생성 (저장하지 않음)
- 서버 Route Handler(`src/app/api/summarize/route.ts`)에서 Gemini REST API 호출
- 결과는 일반 텍스트로 표시
- 요청 중: 버튼 비활성화 + "요약 중..." 표시
- 실패: 모달 안에 한국어 오류 문구 표시, 재시도 가능
- 본문이 비어 있거나 너무 짧으면 버튼 비활성화

### 제외

- 요약 저장 (`Memo` 타입, LocalStorage 변경 없음)
- 마크다운 렌더링, 불릿 요약
- 타임아웃, 본문 길이 상한, 연속 클릭 제한
- 외부 SDK 추가 (REST `fetch` 직접 호출)

## 3. 제약

- API Key는 `.env.local`의 서버 전용 환경변수(`GEMINI_API_KEY`)로만 관리한다. `NEXT_PUBLIC_`을 쓰지 않으며 브라우저에 노출하지 않는다.
- `.gitignore`의 `.env*` 규칙으로 키 파일이 커밋되지 않는다.
- `AGENTS.md` 규칙 준수: `'use client'` 명시, 한국어 UI, Tailwind, TypeScript strict, `any` 금지, 외부 상태 관리 라이브러리 금지, `console.log` 금지(에러 로깅만 허용).

## 4. 설계

### 구성 요소

| 파일 | 역할 |
|------|------|
| `src/app/api/summarize/route.ts` | `POST /api/summarize`. 입력 검증 후 Gemini `generateContent` 호출, `{ summary }` 반환 |
| `src/utils/summary.ts` | 최소 길이 상수, `canSummarize`, 클라이언트용 `requestSummary`, 오류 문구 상수 |
| `src/components/MemoDetailModal.tsx` | 요약 버튼, 로딩/결과/오류 상태, 메모 변경 시 상태 초기화 |
| `tests/e2e/memo-summary.spec.ts` | `/api/summarize`를 mock으로 대체한 E2E 테스트 |

### API 계약

- 요청: `POST /api/summarize`, body `{ "content": string }`
- 성공(200): `{ "summary": string }`
- 실패
  - 400: 본문이 문자열이 아니거나 너무 짧음, 또는 잘못된 JSON
  - 500: `GEMINI_API_KEY` 미설정
  - 502: Gemini 호출 실패 또는 응답에 요약 텍스트가 없음

### Gemini 호출

- 엔드포인트: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- 인증: `x-goog-api-key` 헤더
- 모델: 기본 `gemini-3.5-flash-lite`, `GEMINI_MODEL` 환경변수로 변경 가능
- 시스템 지시: 한국어 2~3문장, 마크다운·불릿·제목 없이 요약문만, 메모에 없는 내용 추가 금지

### 환경변수

```
GEMINI_API_KEY=발급받은_키
# GEMINI_MODEL=gemini-3.5-flash-lite   (선택)
```

## 5. 완료 기준

- [x] Playwright E2E(mock): 성공(대기 상태 포함), 매번 재요청, 실패 후 재시도, 짧은 본문 비활성화
- [x] 실제 Gemini 호출을 Playwright MCP로 직접 확인하고 결과 보고
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과

## 6. 진행 상태

| 항목 | 상태 |
|------|------|
| Route Handler, 유틸, 모달 UI 구현 | 완료 |
| mock E2E 4개 (chromium) | 통과 |
| lint, tsc, build | 통과 |
| 실제 Gemini 호출 확인 (MCP) | 완료: 요약 중 상태, 한국어 2~3문장 결과, 재요청 시 새 결과, 짧은 본문 비활성화, 실패 시 오류 문구 |
| 클라이언트 번들 키 노출 점검 | 통과 (`.next/static`에서 키 미발견) |
| 전체 브라우저 E2E (chromium, firefox, webkit) | 통과 (12개) |

## 7. 열린 질문

- "너무 짧은 본문" 기준은 임시로 공백 제외 20자로 정했다. 조정이 필요한가?
- 모델명 결정 이력: 처음 요청한 `gemini-3-flash-lite`는 API에 없어 404였다. `gemini-3.1-flash-lite`는 503(수요 과다)이 지속되어, 호출이 확인된 `gemini-3.5-flash-lite`를 기본값으로 정했다. 다른 모델은 `GEMINI_MODEL`로 바꿀 수 있다.
- (해결) `AGENTS.md`와 실제 코드의 괴리 정리: Next.js 버전 표기(16.2.9), API Route·`summary.ts`·AI 요약 버튼, API Key 서버 전용 규칙을 루트, `src/app`, `src/utils`, `src/components`의 AGENTS.md에 반영했다.
