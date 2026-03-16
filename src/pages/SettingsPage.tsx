import React, { useEffect, useState } from 'react'
import { Save, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface AppSettings {
  ai_mode: 'local_rules' | 'ollama' | 'gemini' | 'openai'
  gemini_key: string | null
  openai_key: string | null
  enabled_sources: string[]
  max_results: number
  cache_ttl_hours: number
}

const SOURCES = [
  { id: 'semantic_scholar', label: 'Semantic Scholar' },
  { id: 'openalex', label: 'OpenAlex' },
  { id: 'crossref', label: 'CrossRef' },
  { id: 'arxiv', label: 'arXiv' },
  { id: 'pubmed', label: 'PubMed' },
  { id: 'core', label: 'CORE' },
  { id: 'doaj', label: 'DOAJ' },
  { id: 'eric', label: 'ERIC' },
]

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    ai_mode: 'local_rules',
    gemini_key: null,
    openai_key: null,
    enabled_sources: ['semantic_scholar','openalex','arxiv','crossref','pubmed','core'],
    max_results: 50,
    cache_ttl_hours: 24,
  })
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    ;(async () => {
      const s = await (window as any).electronAPI.getSettings()
      if (s) setSettings(prev => ({ ...prev, ...s }))
    })()
  }, [])

  const handleSave = async () => {
    await (window as any).electronAPI.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleSource = (id: string) => {
    setSettings(prev => ({
      ...prev,
      enabled_sources: prev.enabled_sources.includes(id)
        ? prev.enabled_sources.filter(s => s !== id)
        : [...prev.enabled_sources, id]
    }))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2D3149] shrink-0">
        <h2 className="text-white font-bold text-lg">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 max-w-2xl">
        {/* AI Mode */}
        <section>
          <h3 className="text-sm font-semibold text-white mb-1">AI Mode</h3>
          <p className="text-xs text-[#94A3B8] mb-3">
            Choose how AI summaries are generated.
          </p>
          <div className="space-y-2">
            {([
              { value: 'local_rules', label: 'Local Rules Only', desc: 'Fast, free, no AI. TextRank extractive summaries.' },
              { value: 'ollama', label: 'Local AI (Ollama)', desc: 'Requires Ollama + llama3.2:3b installed locally.' },
              { value: 'gemini', label: 'Google Gemini Flash', desc: 'Requires API key. ~$0.001/summary. Best quality.' },
              { value: 'openai', label: 'OpenAI GPT-4o Mini', desc: 'Requires API key. Good quality.' },
            ] as const).map(({ value, label, desc }) => (
              <label
                key={value}
                className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer
                           transition-all duration-150
                           ${settings.ai_mode === value
                             ? 'border-[#4F8EF7]/50 bg-[#4F8EF7]/5'
                             : 'border-[#2D3149] hover:border-[#2D3149]/80'
                           }"
              >
                <input
                  type="radio"
                  name="ai_mode"
                  value={value}
                  checked={settings.ai_mode === value}
                  onChange={() => setSettings(s => ({ ...s, ai_mode: value }))}
                  className="mt-0.5 accent-[#4F8EF7]"
                />
                <div>
                  <p className="text-sm text-white font-medium">{label}</p>
                  <p className="text-xs text-[#94A3B8]">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* API Keys */}
        {(settings.ai_mode === 'gemini' || settings.ai_mode === 'openai') && (
          <section>
            <h3 className="text-sm font-semibold text-white mb-3">API Keys</h3>
            {settings.ai_mode === 'gemini' && (
              <div className="space-y-1">
                <label className="text-xs text-[#94A3B8]">Google Gemini API Key</label>
                <div className="flex gap-2">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={settings.gemini_key ?? ''}
                    onChange={e => setSettings(s => ({ ...s, gemini_key: e.target.value || null }))}
                    placeholder="AIza..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#21253A] border border-[#2D3149]
                               text-white text-sm focus:outline-none focus:border-[#4F8EF7]/50"
                  />
                  <button onClick={() => setShowGeminiKey(v => !v)}
                    className="p-2 rounded-lg bg-[#21253A] border border-[#2D3149] text-[#94A3B8]">
                    {showGeminiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <a
                  onClick={() => (window as any).electronAPI.openExternal('https://aistudio.google.com/app/apikey')}
                  className="flex items-center gap-1 text-[11px] text-[#4F8EF7] cursor-pointer hover:underline mt-1"
                >
                  <ExternalLink size={10} /> Get free API key at Google AI Studio
                </a>
              </div>
            )}
          </section>
        )}

        {/* Data Sources */}
        <section>
          <h3 className="text-sm font-semibold text-white mb-1">Search Sources</h3>
          <p className="text-xs text-[#94A3B8] mb-3">
            Enable or disable individual academic databases.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SOURCES.map(({ id, label }) => {
              const enabled = settings.enabled_sources.includes(id)
              return (
                <label key={id} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleSource(id)}
                    className="accent-[#4F8EF7] w-3.5 h-3.5"
                  />
                  <span className="text-sm text-[#F1F5F9]/80">{label}</span>
                </label>
              )
            })}
          </div>
        </section>

        {/* Max results */}
        <section>
          <h3 className="text-sm font-semibold text-white mb-3">Search Preferences</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#94A3B8] mb-1 block">
                Max results per search: {settings.max_results}
              </label>
              <input
                type="range" min={10} max={100} step={10}
                value={settings.max_results}
                onChange={e => setSettings(s => ({ ...s, max_results: +e.target.value }))}
                className="w-full accent-[#4F8EF7]"
              />
            </div>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                       transition-all active:scale-95
                       ${saved
                         ? 'bg-[#10B981] text-white'
                         : 'bg-[#4F8EF7] text-white hover:bg-[#3b7df6]'
                       }`}
        >
          <Save size={15} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
