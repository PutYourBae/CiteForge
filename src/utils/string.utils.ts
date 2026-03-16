// src/utils/string.utils.ts

export function truncate(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function cleanTitle(raw: string | undefined): string {
  return (raw ?? 'Untitled')
    .replace(/<[^>]+>/g, '') // strip HTML
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeForSearch(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function highlightMatches(text: string, query: string): string {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  let result = text
  for (const word of words) {
    const regex = new RegExp(`(${word})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  }
  return result
}
