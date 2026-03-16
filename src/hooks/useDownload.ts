import { useCallback } from 'react'
import { toast } from 'sonner'
import { useDownloadStore } from '../store/download.store'

export function useDownload() {
  const { updateProgress, markDone, markFailed, removeDownload } = useDownloadStore()

  const downloadPaper = useCallback(async (paper: any) => {
    try {
      const result = await (window as any).electronAPI.downloadPaper(paper)
      if (!result || result.cancelled) return null

      toast.info(`Downloading: ${paper.title.substring(0, 40)}...`)

      // Listen for progress events from this specific download
      const cleanup = (window as any).electronAPI.onDownloadProgress(
        (data: any) => {
          if (data.downloadId !== result.downloadId) return
          if (data.status === 'done') {
            markDone(data.downloadId, data.filePath)
            toast.success(`Download complete: ${paper.title.substring(0, 40)}...`)
            cleanup?.()
          } else if (data.status === 'failed') {
            markFailed(data.downloadId, data.error ?? 'Download failed')
            toast.error(`Failed to download: ${paper.title.substring(0, 40)}...`)
            cleanup?.()
          } else {
            updateProgress(data.downloadId, data.progress)
          }
        }
      )
      return result
    } catch (err: any) {
      console.error('[useDownload]', err.message)
      return null
    }
  }, [])

  const cancel = useCallback(async (downloadId: number) => {
    await (window as any).electronAPI.cancelDownload(downloadId)
    removeDownload(downloadId)
  }, [])

  return { downloadPaper, cancel }
}
