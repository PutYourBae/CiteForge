import { create } from 'zustand'

export type Page = 'home' | 'results' | 'saved' | 'graph' | 'settings'

interface UIStore {
  currentPage: Page
  selectedPaperId: string | null
  sidebarCollapsed: boolean
  isSearching: boolean
  navigate: (page: Page) => void
  selectPaper: (id: string | null) => void
  setSidebarCollapsed: (v: boolean) => void
  setSearching: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'home',
  selectedPaperId: null,
  sidebarCollapsed: false,
  isSearching: false,
  navigate: (page) => set({ currentPage: page }),
  selectPaper: (id) => set({ selectedPaperId: id }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSearching: (v) => set({ isSearching: v }),
}))
