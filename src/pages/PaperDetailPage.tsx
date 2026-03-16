import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Download, ArrowLeft, Star, Tag, Loader2 } from 'lucide-react'
import { AccessBadge } from '../components/paper/AccessBadge'
import { CitationPanel } from '../components/paper/CitationPanel'
import { usePapersStore } from '../store/papers.store'
import { useUIStore } from '../store/ui.store'
import { useDownloadStore } from '../store/download.store'
import { CitationGenerator } from '../core/ai/citation/generator'

const citationGen = new CitationGenerator()

export function PaperDetailPage() {
  const { selectedPapers, aiInsight, isLoadingAI, setAIInsight, setLoadingAI } = usePapersStore()
  const { navigate, selectPaper, currentPage } = useUIStore()
  const { addDownload, markDone, markFailed, updateProgress } = useDownloadStore()
  const [expanded, setExpanded] = useState(false)

  const paper = selectedPapers[currentPage]
  if (!paper) return null

  const citations = citationGen.generateAll(paper)

  // Load cached AI insights on mount
  useEffect(() => {
    async function loadInsight() {
      const cached = await (window as any).electronAPI.getAIInsight(paper!.id)
      if (cached) {
        setAIInsight({
          paper: paper!,
          summaries: {
            short: cached.short_summary,
            research: cached.research_summary,
            keyContributions: cached.key_contributions ?? [],
            methodOverview: cached.method_overview,
            isLoading: false,
            generatedBy: cached.ai_mode ?? 'local_rules',
          },
          topics: cached.topics ?? [],
          graph: { nodes: [], edges: [], centerPaperId: paper!.id },
          recommendations: [],
          citations,
        })
      }
    }
    loadInsight()
  }, [paper?.id])

  const handleDownload = async () => {
    const result = await (window as any).electronAPI.downloadPaper(paper)
    if (result?.cancelled) return
    addDownload({ id: result.downloadId, paperId: paper.id, paperTitle: paper.title,
                  filePath: result.filePath, status: 'downloading', progress: 0 })
    ;(window as any).electronAPI.onDownloadProgress((data: any) => {
      if (data.downloadId !== result.downloadId) return
      if (data.status === 'done') markDone(data.downloadId, data.filePath)
      else if (data.status === 'failed') markFailed(data.downloadId, data.error)
      else updateProgress(data.downloadId, data.progress)
    })
  }

  const authorsText = paper.authors
    .map(a => a.name).join(', ')

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Back */}
        <button
          onClick={() => { selectPaper(currentPage, null) }}
          className="flex items-center gap-1.5 text-xs text-[#94A3B8]
                     hover:text-[#4F8EF7] transition-colors mb-1"
        >
          <ArrowLeft size={13} /> {currentPage === 'saved' ? 'Back to saved' : 'Back to results'}
        </button>

        {/* Title & meta */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <AccessBadge status={paper.accessStatus} />
            {paper.year && (
              <span className="text-[11px] text-[#94A3B8] px-2 py-0.5 rounded-full
                               bg-[#21253A] border border-[#2D3149]">{paper.year}</span>
            )}
            {paper.citationCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                <Star size={10} /> {paper.citationCount.toLocaleString()} citations
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-white leading-snug">{paper.title}</h1>

          <p className="text-sm text-[#94A3B8]">{authorsText}</p>

          {(paper.journal || paper.conference) && (
            <p className="text-xs text-[#94A3B8]/70">
              <em className="not-italic">{paper.journal ?? paper.conference}</em>
              {paper.volume && ` · Vol. ${paper.volume}`}
              {paper.pages && ` · pp. ${paper.pages}`}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {paper.pdfUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10B981]
                           text-white text-sm font-semibold hover:bg-[#0ea572]
                           active:scale-95 transition-all"
              >
                <Download size={14} /> Download PDF
              </button>
            )}
            <button
              onClick={() => (window as any).electronAPI.openExternal(paper.publisherUrl)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2D3149]
                         text-[#94A3B8] text-sm font-medium hover:bg-[#21253A]
                         hover:text-white transition-all"
            >
              <ExternalLink size={13} />
              {paper.accessStatus === 'paid' ? 'View on Publisher' : 'Visit Site'}
            </button>
          </div>
        </motion.div>

        {/* Topics */}
        {aiInsight?.topics && aiInsight.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {aiInsight.topics.map(t => (
              <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full
                                        bg-[#7C3AED]/10 border border-[#7C3AED]/20
                                        text-[#A78BFA] text-[11px] font-medium">
                <Tag size={9} />{t}
              </span>
            ))}
          </div>
        )}

        {/* Abstract */}
        {paper.abstract && (
          <div className="bg-[#1A1D27] border border-[#2D3149] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              Abstract
            </h3>
            <p className={`text-sm text-[#F1F5F9]/80 leading-relaxed
                           ${!expanded ? 'line-clamp-4' : ''}`}>
              {paper.abstract}
            </p>
            {paper.abstract.length > 400 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-xs text-[#4F8EF7] mt-1.5 hover:underline"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* AI Summary */}
        {isLoadingAI && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Loader2 size={13} className="animate-spin" />
            Generating AI summary…
          </div>
        )}
        {aiInsight?.summaries?.short && (
          <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider mb-2">
              ✦ AI Summary
            </h3>
            <p className="text-sm text-[#F1F5F9]/80 leading-relaxed">
              {aiInsight.summaries.short}
            </p>
            {(aiInsight.summaries.keyContributions?.length ?? 0) > 0 && (
              <div className="mt-3">
                <p className="text-[11px] text-[#94A3B8] font-semibold mb-1.5">Key Contributions</p>
                <ul className="space-y-1">
                  {aiInsight.summaries.keyContributions?.map((c, i) => (
                    <li key={i} className="flex gap-2 text-xs text-[#F1F5F9]/70">
                      <span className="text-[#7C3AED] shrink-0">•</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Citations */}
        <CitationPanel citations={citations} />
      </div>
    </div>
  )
}
