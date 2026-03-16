import { create } from 'zustand'

export type AIMode = 'local_rules' | 'ollama' | 'gemini' | 'openai'

interface SettingsStore {
  aiMode: AIMode
  geminiKey: string | null
  openaiKey: string | null
  enabledSources: string[]
  maxResults: number
  theme: 'dark'
  loaded: boolean
  setAIMode: (mode: AIMode) => void
  setGeminiKey: (key: string | null) => void
  setOpenAIKey: (key: string | null) => void
  setEnabledSources: (sources: string[]) => void
  setMaxResults: (n: number) => void
  load: () => Promise<void>
  save: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  aiMode: 'local_rules',
  geminiKey: null,
  openaiKey: null,
  enabledSources: ['semantic_scholar','openalex','arxiv','crossref','pubmed','core'],
  maxResults: 50,
  theme: 'dark',
  loaded: false,

  setAIMode: (mode) => set({ aiMode: mode }),
  setGeminiKey: (key) => set({ geminiKey: key }),
  setOpenAIKey: (key) => set({ openaiKey: key }),
  setEnabledSources: (sources) => set({ enabledSources: sources }),
  setMaxResults: (n) => set({ maxResults: n }),

  load: async () => {
    try {
      const s = await (window as any).electronAPI.getSettings()
      if (s) set({
        aiMode: s.ai_mode ?? 'local_rules',
        geminiKey: s.gemini_key ?? null,
        openaiKey: s.openai_key ?? null,
        enabledSources: s.enabled_sources ?? get().enabledSources,
        maxResults: s.max_results ?? 50,
        loaded: true,
      })
    } catch { /* ignore */ }
  },

  save: async () => {
    const { aiMode, geminiKey, openaiKey, enabledSources, maxResults } = get()
    await (window as any).electronAPI.saveSettings({
      ai_mode: aiMode,
      gemini_key: geminiKey,
      openai_key: openaiKey,
      enabled_sources: enabledSources,
      max_results: maxResults,
    })
  },
}))
