import { create } from 'zustand'

export type Page = 'home' | 'results' | 'saved' | 'graph' | 'settings'

interface UIStore {
  currentPage: Page
  selectedPaperIds: Record<string, string | null>
  sidebarCollapsed: boolean
  isSearching: boolean
  navigate: (page: Page) => void
  selectPaper: (page: string, id: string | null) => void
  setSidebarCollapsed: (v: boolean) => void
  setSearching: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'home',
  selectedPaperIds: { home: null, results: null, saved: null, graph: null, settings: null },
  sidebarCollapsed: false,
  isSearching: false,
  navigate: (page) => set({ currentPage: page }),
  selectPaper: (page, id) => set((s) => ({
    selectedPaperIds: { ...s.selectedPaperIds, [page]: id }
  })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSearching: (v) => set({ isSearching: v }),
}))
