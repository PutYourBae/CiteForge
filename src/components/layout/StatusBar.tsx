import React from 'react'
import { useSearchStore } from '../../store/search.store'
import { useDownloadStore } from '../../store/download.store'
import { useUIStore } from '../../store/ui.store'
import { Download, Clock, CheckCircle } from 'lucide-react'

export function StatusBar() {
  const { totalFound, searchDurationMs, fromCache, query } = useSearchStore()
  const { downloads } = useDownloadStore()
  const { isSearching } = useUIStore()

  const active = downloads.filter(d => d.status === 'downloading').length
  const done = downloads.filter(d => d.status === 'done').length

  return (
    <div className="h-7 flex items-center justify-between px-4 border-t border-[#2D3149]
                    bg-[#1A1D27] text-[11px] text-[#94A3B8] shrink-0">
      {/* Left: search stats */}
      <div className="flex items-center gap-3">
        {isSearching && (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7] animate-pulse" />
            Searching…
          </span>
        )}
        {!isSearching && totalFound > 0 && (
          <>
            <span className="text-[#F1F5F9]/70">
              {totalFound.toLocaleString()} results
              {query && <> for <em className="not-italic text-[#4F8EF7]">"{query}"</em></>}
            </span>
            <span className="flex items-center gap-1 text-[#2D3149]">
              <Clock size={10} />
              {searchDurationMs}ms {fromCache && '(cached)'}
            </span>
          </>
        )}
      </div>

      {/* Right: downloads */}
      <div className="flex items-center gap-3">
        {active > 0 && (
          <span className="flex items-center gap-1.5 text-[#4F8EF7]">
            <Download size={11} className="animate-bounce" />
            {active} downloading
          </span>
        )}
        {done > 0 && active === 0 && (
          <span className="flex items-center gap-1.5 text-[#10B981]">
            <CheckCircle size={11} />
            {done} download{done > 1 ? 's' : ''} complete
          </span>
        )}
        <span className="text-[#2D3149]">CiteForge v1.0.0</span>
      </div>
    </div>
  )
}
