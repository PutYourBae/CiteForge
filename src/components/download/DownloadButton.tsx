import React, { useState } from 'react'
import { Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Paper } from '../../types/paper.types'
import { useDownloadStore } from '../../store/download.store'

interface DownloadButtonProps {
  paper: Paper
  className?: string
}

export function DownloadButton({ paper, className = '' }: DownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const { addDownload, markDone, markFailed, updateProgress } = useDownloadStore()

  if (paper.accessStatus !== 'open_access' || !paper.pdfUrl) return null

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setStatus('downloading')
    setProgress(0)

    try {
      const result = await (window as any).electronAPI.downloadPaper(paper)
      if (result?.cancelled) {
        setStatus('idle')
        return
      }

      addDownload({
        id: result.downloadId,
        paperId: paper.id,
        paperTitle: paper.title,
        filePath: result.filePath,
        status: 'downloading',
        progress: 0,
      })

      ;(window as any).electronAPI.onDownloadProgress((data: any) => {
        if (data.downloadId !== result.downloadId) return
        if (data.status === 'done') {
          setStatus('done')
          setProgress(1)
          markDone(data.downloadId, data.filePath)
        } else if (data.status === 'failed') {
          setStatus('error')
          markFailed(data.downloadId, data.error)
        } else {
          setProgress(data.progress)
          updateProgress(data.downloadId, data.progress)
        }
      })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <button
        disabled
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg
                    bg-[#10B981]/15 text-[#10B981] text-xs font-medium ${className}`}
      >
        <CheckCircle size={13} /> Downloaded
      </button>
    )
  }

  if (status === 'error') {
    return (
      <button
        onClick={handleDownload}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg
                    bg-[#EF4444]/15 text-[#EF4444] text-xs font-medium
                    hover:bg-[#EF4444]/25 transition-colors ${className}`}
      >
        <XCircle size={13} /> Retry
      </button>
    )
  }

  if (status === 'downloading') {
    return (
      <button
        disabled
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg
                    bg-[#4F8EF7]/15 text-[#4F8EF7] text-xs font-medium ${className}`}
      >
        <Loader2 size={12} className="animate-spin" />
        {Math.round(progress * 100)}%
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg
                  bg-[#10B981]/15 text-[#10B981] text-xs font-medium
                  hover:bg-[#10B981]/25 active:scale-95 transition-all ${className}`}
    >
      <Download size={13} /> Download PDF
    </button>
  )
}
