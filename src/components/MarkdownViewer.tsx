'use client'

import dynamic from 'next/dynamic'
import '@uiw/react-markdown-preview/markdown.css'

const MarkdownPreview = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false }
)

interface MarkdownViewerProps {
  source: string
}

export default function MarkdownViewer({ source }: MarkdownViewerProps) {
  return (
    <div data-color-mode="light" data-testid="markdown-viewer">
      <MarkdownPreview
        source={source}
        className="bg-transparent! text-sm! break-words"
      />
    </div>
  )
}
