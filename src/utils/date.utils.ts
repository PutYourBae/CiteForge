// src/utils/date.utils.ts

export function formatYear(year: number | undefined): string {
  return year ? String(year) : 'n.d.'
}

export function yearAgo(year: number): number {
  return new Date().getFullYear() - year
}

export function isRecent(year: number | undefined, withinYears = 5): boolean {
  if (!year) return false
  return yearAgo(year) <= withinYears
}

export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
