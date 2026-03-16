import { useCallback } from 'react'
import { usePapersStore } from '../store/papers.store'
import { useUIStore } from '../store/ui.store'
import { Paper } from '../types/paper.types'

export function usePaperDetail() {
  const { setSelectedPaper, setAIInsight, setLoadingAI } = usePapersStore()
  const { selectPaper, navigate, currentPage } = useUIStore()

  const openPaper = useCallback(async (paper: Paper) => {
    setSelectedPaper(currentPage, paper)
    selectPaper(currentPage, paper.id)
    navigate('results')

    // Load AI insight async
    setLoadingAI(true)
    try {
      const insight = await (window as any).electronAPI.aiEnrich(paper)
      if (insight) setAIInsight(insight)
    } catch {
      // Non-fatal — show paper without AI
    } finally {
      setLoadingAI(false)
    }
  }, [currentPage])

  const closePaper = useCallback(() => {
    setSelectedPaper(currentPage, null)
    selectPaper(currentPage, null)
  }, [currentPage])

  return { openPaper, closePaper }
}
