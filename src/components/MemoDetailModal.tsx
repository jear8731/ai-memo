'use client'

import { useCallback, useEffect, useState } from 'react'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import {
  canSummarize,
  requestSummary,
  SUMMARY_ERROR_MESSAGE,
} from '@/utils/summary'
import { getCategoryColor } from './MemoItem'
import MarkdownViewer from './MarkdownViewer'

interface MemoDetailModalProps {
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
}

export default function MemoDetailModal({
  memo,
  onClose,
  onEdit,
  onDelete,
}: MemoDetailModalProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const memoId = memo?.id
  const memoContent = memo?.content ?? ''

  // 다른 메모를 열거나 모달을 닫으면 요약 상태 초기화
  useEffect(() => {
    setSummary(null)
    setSummaryError(null)
    setSummaryLoading(false)
  }, [memoId])

  const handleSummarize = useCallback(async () => {
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      setSummary(await requestSummary(memoContent))
    } catch (error) {
      console.error('요약 생성 실패:', error)
      setSummaryError(SUMMARY_ERROR_MESSAGE)
    } finally {
      setSummaryLoading(false)
    }
  }, [memoContent])

  // ESC 키로 닫기
  useEffect(() => {
    if (!memo) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [memo, onClose])

  if (!memo) return null

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="memo-detail-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="메모 상세 보기"
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="memo-detail-modal"
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 break-words">
                {memo.title}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(memo.category)}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(memo.updatedAt)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* AI 요약 */}
          <div className="mb-4">
            <button
              onClick={handleSummarize}
              disabled={summaryLoading || !canSummarize(memo.content)}
              data-testid="summarize-btn"
              className="px-3 py-1.5 text-sm border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              {summaryLoading ? '요약 중...' : 'AI 요약'}
            </button>
            {summary && (
              <p
                data-testid="summary-result"
                className="mt-3 p-3 bg-blue-50 text-gray-700 text-sm rounded-lg whitespace-pre-wrap break-words"
              >
                {summary}
              </p>
            )}
            {summaryError && (
              <p
                role="alert"
                data-testid="summary-error"
                className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg"
              >
                {summaryError}
              </p>
            )}
          </div>

          {/* 내용 */}
          <div className="mb-4">
            <MarkdownViewer source={memo.content} />
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDelete}
              data-testid="detail-delete-btn"
              className="flex-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              삭제
            </button>
            <button
              onClick={() => onEdit(memo)}
              data-testid="detail-edit-btn"
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              편집
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
