import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Network, Loader2, RefreshCw, Info } from 'lucide-react'
import { ResearchGraph } from '../components/graph/ResearchGraph'
import { usePapersStore } from '../store/papers.store'
import { useUIStore } from '../store/ui.store'
import { GraphEngine } from '../core/ai/graph/engine'
import { ResearchGraph as GraphData } from '../types/ai.types'

const graphEngine = new GraphEngine()

const LEGEND = [
  { color: '#4F8EF7', label: 'Current Paper' },
  { color: '#10B981', label: 'Open Access' },
  { color: '#F59E0B', label: 'Paid' },
  { color: '#2D3149', label: 'Unknown' },
  { color: '#4F8EF7', label: 'Cites (→)', edge: true },
  { color: '#7C3AED', label: 'Cited By (→)', edge: true },
]

export function ResearchGraphPage() {
  const { selectedPaper, setSelectedPaper } = usePapersStore()
  const { navigate, selectPaper } = useUIStore()
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedPaper) return
    loadGraph()
  }, [selectedPaper?.id])

  const loadGraph = async () => {
    if (!selectedPaper) return
    setLoading(true)
    setError(null)
    try {
      const g = await graphEngine.buildGraph(selectedPaper)
      setGraph(g)
    } catch (e: any) {
      setError(e.message ?? 'Failed to build graph')
    } finally {
      setLoading(false)
    }
  }

  const handleNodeClick = (nodeId: string) => {
    // Navigate to paper detail if we find the node
    if (graph) {
      const node = graph.nodes.find(n => n.id === nodeId)
      if (node && !node.isCenter) {
        // Could navigate to that paper — for now just select it
        selectPaper(nodeId)
        navigate('results')
      }
    }
  }

  if (!selectedPaper) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <Network size={48} className="text-[#2D3149]" />
        <h2 className="text-white font-semibold text-lg">No Paper Selected</h2>
        <p className="text-[#94A3B8] text-sm max-w-xs">
          Open a paper from your search results to visualize its research network.
        </p>
        <button
          onClick={() => navigate('home')}
          className="px-4 py-2 rounded-lg bg-[#4F8EF7] text-white text-sm font-semibold
                     hover:bg-[#3b7df6] transition-colors"
        >
          Search Papers
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#2D3149] shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Network size={16} className="text-[#4F8EF7]" />
            Research Network
          </h2>
          <p className="text-[#94A3B8] text-xs mt-0.5 line-clamp-1 max-w-md">
            {selectedPaper.title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {LEGEND.map(({ color, label, edge }) => (
              <div key={label} className="flex items-center gap-1.5">
                {edge
                  ? <div className="w-5 h-0.5 rounded" style={{ background: color }} />
                  : <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                }
                <span className="text-[10px] text-[#94A3B8]">{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={loadGraph}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#21253A] text-[#94A3B8] hover:text-white
                       transition-colors disabled:opacity-50"
            title="Refresh graph"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
                          bg-[#0F1117]/80 z-10 gap-3">
            <Loader2 size={32} className="text-[#4F8EF7] animate-spin" />
            <p className="text-[#94A3B8] text-sm">Building research network…</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="text-[#EF4444] text-sm">{error}</p>
            <button onClick={loadGraph} className="text-[#4F8EF7] text-xs hover:underline">
              Retry
            </button>
          </div>
        )}
        {graph && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            <ResearchGraph data={graph} onNodeClick={handleNodeClick} />
          </motion.div>
        )}
        {!graph && !loading && !error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#94A3B8] text-sm">Graph will appear here</p>
          </div>
        )}

        {/* Info hint */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[10px]
                        text-[#2D3149] pointer-events-none">
          <Info size={10} />
          Scroll to zoom · Drag nodes · Click to navigate
        </div>
      </div>
    </div>
  )
}
