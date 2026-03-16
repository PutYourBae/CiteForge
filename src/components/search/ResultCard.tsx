import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Download, Bookmark, BookmarkCheck,
         Quote, FileText, Star } from 'lucide-react'
import { Paper } from '../../types/paper.types'
import { AccessBadge } from '../paper/AccessBadge'
import { usePapersStore } from '../../store/papers.store'
import { useUIStore } from '../../store/ui.store'
import { useDownloadStore } from '../../store/download.store'

interface ResultCardProps {
  paper: Paper
  index: number
}

export function ResultCard({ paper, index }: ResultCardProps) {
  const { savedPapers, addSaved, removeSaved, setSelectedPaper } = usePapersStore()
  const { navigate, selectPaper } = useUIStore()
  const { addDownload, updateProgress, markDone, markFailed } = useDownloadStore()
  const isSaved = savedPapers.some(p => p.id === paper.id)

  const handleSelect = () => {
    setSelectedPaper(paper)
    selectPaper(paper.id)
    navigate('results')
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSaved) {
      removeSaved(paper.id)
      await (window as any).electronAPI.deleteSavedPaper(paper.id)
    } else {
      addSaved(paper)
      await (window as any).electronAPI.savePaper(paper)
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await (window as any).electronAPI.downloadPaper(paper)
    if (result?.cancelled) return
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
      if (data.status === 'done') markDone(data.downloadId, data.filePath)
      else if (data.status === 'failed') markFailed(data.downloadId, data.error)
      else updateProgress(data.downloadId, data.progress)
    })
  }

  const handleOpenPublisher = (e: React.MouseEvent) => {
    e.stopPropagation()
    ;(window as any).electronAPI.openExternal(paper.publisherUrl)
  }

  const authorsText = paper.authors.slice(0, 3).map(a => a.name).join(', ')
    + (paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={handleSelect}
      className="group bg-[#1A1D27] border border-[#2D3149] rounded-xl p-4
                 hover:border-[#4F8EF7]/40 hover:bg-[#21253A] cursor-pointer
                 transition-all duration-150"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <AccessBadge status={paper.accessStatus} />
          {paper.citationCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
              <Star size={10} className="fill-[#94A3B8]" />
              {paper.citationCount.toLocaleString()}
            </span>
          )}
          {paper.year && (
            <span className="text-[11px] text-[#94A3B8]">{paper.year}</span>
          )}
        </div>
        {/* Save button */}
        <button
          onClick={handleSave}
          className="shrink-0 text-[#94A3B8] hover:text-[#4F8EF7] transition-colors
                     opacity-0 group-hover:opacity-100 duration-150"
          title={isSaved ? 'Remove from saved' : 'Save paper'}
        >
          {isSaved
            ? <BookmarkCheck size={16} className="text-[#4F8EF7]" />
            : <Bookmark size={16} />
          }
        </button>
      </div>

      {/* Title */}
      <h3 className="text-[#F1F5F9] font-semibold text-sm leading-snug mb-1.5
                     group-hover:text-[#4F8EF7] transition-colors duration-150
                     line-clamp-2">
        {paper.title}
      </h3>

      {/* Authors + Journal */}
      <p className="text-[#94A3B8] text-xs mb-2 truncate">
        {authorsText}
        {paper.journal && <> · <em className="not-italic text-[#94A3B8]/70">{paper.journal}</em></>}
      </p>

      {/* Abstract snippet */}
      {paper.abstract && (
        <p className="text-[#94A3B8]/70 text-[11px] leading-relaxed line-clamp-2 mb-3">
          {paper.abstract}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap opacity-0 group-hover:opacity-100
                      transition-opacity duration-150" onClick={e => e.stopPropagation()}>
        {paper.accessStatus === 'open_access' && paper.pdfUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                       bg-[#10B981]/15 text-[#10B981] text-[11px] font-medium
                       hover:bg-[#10B981]/25 transition-colors duration-150"
          >
            <Download size={12} /> Download PDF
          </button>
        )}
        <button
          onClick={handleOpenPublisher}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                     bg-[#21253A] text-[#94A3B8] text-[11px] font-medium
                     hover:bg-[#2D3149] hover:text-white transition-colors duration-150"
        >
          <ExternalLink size={11} />
          {paper.accessStatus === 'paid' ? 'View Publisher' : 'Visit Site'}
        </button>
        <button
          onClick={handleSelect}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                     bg-[#21253A] text-[#94A3B8] text-[11px] font-medium
                     hover:bg-[#2D3149] hover:text-white transition-colors duration-150"
        >
          <Quote size={11} /> Cite
        </button>
      </div>
    </motion.div>
  )
}
