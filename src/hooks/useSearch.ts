import { useSearchStore } from '../store/search.store'
import { useUIStore } from '../store/ui.store'
import { useSettingsStore } from '../store/settings.store'

export function useSearch() {
  const setQuery = useSearchStore(s => s.setQuery)
  const setResults = useSearchStore(s => s.setResults)
  const setError = useSearchStore(s => s.setError)
  const setSearching = useUIStore(s => s.setSearching)
  const navigate = useUIStore(s => s.navigate)
  const filters = useSearchStore(s => s.filters)

  const search = async (text: string) => {
    if (!text.trim()) return
    setQuery(text)
    setSearching(true)
    navigate('results')
    try {
      const result = await (window as any).electronAPI.search({ text, filters })
      setResults(result)
    } catch (err: any) {
      setError(err?.message ?? 'Search failed. Check your connection.')
    } finally {
      setSearching(false)
    }
  }

  return { search }
}
