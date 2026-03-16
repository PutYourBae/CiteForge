import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookMarked, Trash2, ExternalLink, Tag, Download } from 'lucide-react'
import { usePapersStore } from '../store/papers.store'
import { useUIStore } from '../store/ui.store'
import { useDownloadStore } from '../store/download.store'
import { AccessBadge } from '../components/paper/AccessBadge'

export function SavedPapersPage() {
  const { savedPapers, setSavedPapers, removeSaved, setSelectedPaper } = usePapersStore()
  const { navigate, selectPaper, currentPage } = useUIStore()
  const { addDownload, updateProgress, markDone, markFailed } = useDownloadStore()

  useEffect(() => {
    ;(async () => {
      const papers = await (window as any).electronAPI.getSavedPapers()
      setSavedPapers(papers)
    })()
  }, [])

  if (savedPapers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
        <BookMarked size={40} className="text-[#2D3149]" />
        <h2 className="text-white font-semibold text-lg">No Saved Papers</h2>
        <p className="text-[#94A3B8] text-sm max-w-xs">
          Save papers from search results to build your personal research library.
        </p>
        <button
          onClick={() => navigate('home')}
          className="mt-2 px-4 py-2 rounded-lg bg-[#4F8EF7] text-white text-sm
                     font-semibold hover:bg-[#3b7df6] transition-colors"
        >
          Start Searching
        </button>
      </div>
    )
  }

  const handleOpen = (paper: any) => {
    setSelectedPaper(currentPage, paper)
    selectPaper(currentPage, paper.id)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeSaved(id)
    await (window as any).electronAPI.deleteSavedPaper(id)
  }

  const handleDownload = async (paper: any, e: React.MouseEvent) => {
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2D3149] shrink-0">
        <h2 className="text-white font-bold text-lg">Saved Papers</h2>
        <p className="text-[#94A3B8] text-xs mt-0.5">
          {savedPapers.length} paper{savedPapers.length !== 1 ? 's' : ''} in your library
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {savedPapers.map((paper, i) => (
          <motion.div
            key={paper.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => handleOpen(paper)}
            className="group flex items-start gap-3 bg-[#1A1D27] border border-[#2D3149]
                       rounded-xl p-4 cursor-pointer hover:border-[#4F8EF7]/40
                       hover:bg-[#21253A] transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <AccessBadge status={paper.accessStatus} />
                {paper.year && (
                  <span className="text-[11px] text-[#94A3B8]">{paper.year}</span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-[#F1F5F9] line-clamp-2
                             group-hover:text-[#4F8EF7] transition-colors">
                {paper.title}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1 truncate">
                {paper.authors?.slice(0, 3).map((a: any) => a.name).join(', ')}
                {paper.journal ? ` · ${paper.journal}` : ''}
              </p>
            </div>

            <div className="flex flex-row items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100
                            transition-opacity">
              {paper.pdfUrl && (
                <button
                  onClick={e => handleDownload(paper, e)}
                  className="p-1.5 rounded-lg text-[#10B981] hover:text-white
                             hover:bg-[#10B981] transition-colors"
                  title="Download PDF"
                >
                  <Download size={14} />
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); (window as any).electronAPI.openExternal(paper.publisherUrl) }}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white
                           hover:bg-[#2D3149] transition-colors"
                title="Visit site"
              >
                <ExternalLink size={14} />
              </button>
              <button
                onClick={e => handleDelete(paper.id, e)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444]
                           hover:bg-[#EF4444]/10 transition-colors"
                title="Remove from saved"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
