import React from 'react'
import { ArrowRight, ExternalLink, Star, Unlock } from 'lucide-react'
import { Paper } from '../../types/paper.types'
import { usePapersStore } from '../../store/papers.store'
import { useUIStore } from '../../store/ui.store'

interface RelatedPapersProps {
  papers: Paper[]
}

export function RelatedPapers({ papers }: RelatedPapersProps) {
  const { setSelectedPaper } = usePapersStore()
  const { selectPaper, navigate } = useUIStore()

  if (!papers.length) return null

  return (
    <div className="bg-[#1A1D27] border border-[#2D3149] rounded-xl p-4">
      <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
        Related Research
      </h3>
      <div className="space-y-2">
        {papers.slice(0, 6).map(paper => (
          <button
            key={paper.id}
            onClick={() => {
              setSelectedPaper(paper)
              selectPaper(paper.id)
              navigate('results')
            }}
            className="w-full text-left p-3 rounded-lg bg-[#21253A] border border-[#2D3149]
                       hover:border-[#4F8EF7]/40 hover:bg-[#21253A]/80 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#F1F5F9]/90 line-clamp-2
                               group-hover:text-[#4F8EF7] transition-colors leading-snug">
                  {paper.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {paper.year && (
                    <span className="text-[10px] text-[#94A3B8]">{paper.year}</span>
                  )}
                  {paper.citationCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#94A3B8]">
                      <Star size={8} /> {paper.citationCount.toLocaleString()}
                    </span>
                  )}
                  {paper.accessStatus === 'open_access' && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#10B981]">
                      <Unlock size={8} /> OA
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight size={12} className="text-[#2D3149] group-hover:text-[#4F8EF7]
                                               transition-colors shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
