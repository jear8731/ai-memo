'use client'

import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

// SSR 환경에서 window 접근 오류를 막기 위해 클라이언트에서만 로드
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-lg border border-gray-300 bg-gray-50 animate-pulse" />
  ),
})

interface MarkdownEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export default function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  height = 320,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" data-testid="markdown-editor">
      <MDEditor
        value={value}
        onChange={val => onChange(val ?? '')}
        height={height}
        preview="live"
        textareaProps={{ id, placeholder }}
      />
    </div>
  )
}
