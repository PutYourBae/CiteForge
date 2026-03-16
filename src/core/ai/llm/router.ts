// src/core/ai/llm/router.ts
// Routes AI requests to the best available LLM tier

import { PaperContext, AIMode } from '../../../types/ai.types'

export interface LLMResult {
  summary: string
  provider: AIMode
}

export class LLMRouter {
  async summarize(ctx: PaperContext): Promise<LLMResult | null> {
    const settings = await this.getSettings()
    const text = ctx.abstract.substring(0, 3000)

    if (!text) return null

    // Try each tier in order
    if (settings.ai_mode === 'gemini' && settings.gemini_key) {
      try { return await this.callGemini(text, settings.gemini_key) }
      catch { /* fall through */ }
    }

    if (settings.ai_mode === 'openai' && settings.openai_key) {
      try { return await this.callOpenAI(text, settings.openai_key) }
      catch { /* fall through */ }
    }

    if (settings.ai_mode === 'ollama') {
      try { return await this.callOllama(text) }
      catch { /* fall through */ }
    }

    return null
  }

  private async getSettings() {
    try {
      const s = await (window as any).electronAPI.getSettings()
      return s ?? {}
    } catch {
      return {}
    }
  }

  private async callGemini(text: string, apiKey: string): Promise<LLMResult> {
    const prompt = this.buildPrompt(text)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    )
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
    const data = await res.json()
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return { summary: summary.trim(), provider: 'gemini' }
  }

  private async callOpenAI(text: string, apiKey: string): Promise<LLMResult> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an academic research assistant. Summarize papers clearly and concisely for graduate students.' },
          { role: 'user', content: this.buildPrompt(text) },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
    const data = await res.json()
    const summary = data?.choices?.[0]?.message?.content ?? ''
    return { summary: summary.trim(), provider: 'openai' }
  }

  private async callOllama(text: string): Promise<LLMResult> {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: this.buildPrompt(text),
        stream: false,
        options: { num_predict: 300, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) throw new Error('Ollama not available')
    const data = await res.json()
    return { summary: (data.response ?? '').trim(), provider: 'ollama' }
  }

  private buildPrompt(abstract: string): string {
    return `Summarize the following academic paper abstract in 2-3 clear sentences for a graduate student. Focus on: what problem is solved, what method was used, and what the main result is.

Abstract:
${abstract}

Summary:`
  }
}
