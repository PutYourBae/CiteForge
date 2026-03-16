import React from 'react'
import { motion } from 'framer-motion'
import { FlaskConical, Sparkles, Tags } from 'lucide-react'
import { SearchBar } from '../components/search/SearchBar'
import { KeywordBar } from '../components/search/KeywordBar'
import { useSearchStore } from '../store/search.store'
import { useUIStore } from '../store/ui.store'

const QUICK_SEARCHES = [
  'machine learning fraud detection',
  'transformer neural network NLP',
  'climate change renewable energy',
  'COVID-19 vaccine efficacy',
  'deep learning image recognition',
  'BERT language model fine-tuning',
]

const SOURCES = ['Semantic Scholar', 'OpenAlex', 'CrossRef', 'arXiv', 'PubMed', 'CORE']

export function HomePage() {
  const { setQuery, setResults, setError, keywords } = useSearchStore()
  const { navigate, setSearching } = useUIStore()

  const handleSearch = async (text: string) => {
    if (!text.trim()) return
    // Append keywords to the search query for richer results
    const fullQuery = keywords ? `${text} ${keywords}` : text
    setQuery(text)
    setSearching(true)
    navigate('results')

    try {
      const result = await (window as any).electronAPI.search({
        text: fullQuery,
        filters: { sortBy: 'relevance', maxResults: 50 },
      })
      setResults(result)
    } catch (err: any) {
      setError(err.message ?? 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#4F8EF7]/15 flex items-center
                          justify-center border border-[#4F8EF7]/30">
            <FlaskConical size={26} className="text-[#4F8EF7]" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">CiteForge</h1>
        <p className="text-[#94A3B8] text-lg">AI-powered academic research assistant</p>
      </motion.div>

      {/* Search area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="w-full max-w-2xl flex flex-col gap-3"
      >
        {/* Main search bar */}
        <SearchBar onSearch={handleSearch} autoFocus placeholder="Search papers, journals, authors..." />

        {/* ── Keyword bar ─────────────────────────────────────────── */}
        <KeywordBar className="rounded-xl" />

        {/* Hint */}
        {keywords && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-[#4F8EF7]/60 text-center"
          >
            Keywords akan digabungkan dengan query pencarian untuk hasil yang lebih relevan
          </motion.p>
        )}
      </motion.div>

      {/* Quick searches */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 flex-wrap justify-center max-w-xl"
      >
        {QUICK_SEARCHES.map(q => (
          <button
            key={q}
            onClick={() => handleSearch(q)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border
                       border-[#2D3149] text-[#94A3B8] text-xs hover:border-[#4F8EF7]/50
                       hover:text-[#4F8EF7] hover:bg-[#4F8EF7]/5 transition-all duration-150"
          >
            <Sparkles size={10} />
            {q}
          </button>
        ))}
      </motion.div>

      {/* Powered by */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-2 text-[11px] text-[#2D3149]"
      >
        {SOURCES.join(' · ')}
      </motion.div>
    </div>
  )
}
