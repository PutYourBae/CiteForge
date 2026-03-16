import { create } from 'zustand'

export interface DownloadItem {
  id: number
  paperId: string
  paperTitle: string
  filePath?: string
  status: 'pending' | 'downloading' | 'done' | 'failed' | 'cancelled'
  progress: number
  error?: string
}

interface DownloadStore {
  downloads: DownloadItem[]
  addDownload: (item: DownloadItem) => void
  updateProgress: (id: number, progress: number, status?: DownloadItem['status']) => void
  markDone: (id: number, filePath: string) => void
  markFailed: (id: number, error: string) => void
  remove: (id: number) => void
  removeDownload: (id: number) => void
}

export const useDownloadStore = create<DownloadStore>((set) => ({
  downloads: [],
  addDownload: (item) => set((s) => ({ downloads: [item, ...s.downloads] })),
  updateProgress: (id, progress, status) => set((s) => ({
    downloads: s.downloads.map(d =>
      d.id === id ? { ...d, progress, ...(status ? { status } : {}) } : d
    ),
  })),
  markDone: (id, filePath) => set((s) => ({
    downloads: s.downloads.map(d =>
      d.id === id ? { ...d, status: 'done', progress: 1, filePath } : d
    ),
  })),
  markFailed: (id, error) => set((s) => ({
    downloads: s.downloads.map(d =>
      d.id === id ? { ...d, status: 'failed', error } : d
    ),
  })),
  remove: (id) => set((s) => ({ downloads: s.downloads.filter(d => d.id !== id) })),
  removeDownload: (id) => set((s) => ({ downloads: s.downloads.filter(d => d.id !== id) })),
}))
