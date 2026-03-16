import { create } from 'zustand'
import { Paper } from '../types/paper.types'
import { AIInsight } from '../types/ai.types'

interface PapersStore {
  savedPapers: Paper[]
  selectedPaper: Paper | null
  aiInsight: AIInsight | null
  isLoadingAI: boolean
  setSavedPapers: (papers: Paper[]) => void
  addSaved: (paper: Paper) => void
  removeSaved: (id: string) => void
  setSelectedPaper: (paper: Paper | null) => void
  setAIInsight: (insight: AIInsight | null) => void
  setLoadingAI: (v: boolean) => void
}

export const usePapersStore = create<PapersStore>((set) => ({
  savedPapers: [],
  selectedPaper: null,
  aiInsight: null,
  isLoadingAI: false,
  setSavedPapers: (papers) => set({ savedPapers: papers }),
  addSaved: (paper) => set((s) => ({
    savedPapers: s.savedPapers.some(p => p.id === paper.id)
      ? s.savedPapers
      : [paper, ...s.savedPapers],
  })),
  removeSaved: (id) => set((s) => ({
    savedPapers: s.savedPapers.filter(p => p.id !== id),
  })),
  setSelectedPaper: (paper) => set({ selectedPaper: paper, aiInsight: null }),
  setAIInsight: (insight) => set({ aiInsight: insight }),
  setLoadingAI: (v) => set({ isLoadingAI: v }),
}))
