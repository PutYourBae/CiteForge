// src/utils/jaro-winkler.ts
// Jaro-Winkler string similarity — used by deduplicator for fuzzy title matching

export function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1.0

  const len1 = s1.length
  const len2 = s2.length
  if (len1 === 0 || len2 === 0) return 0.0

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1
  const s1Matches = new Array(len1).fill(false)
  const s2Matches = new Array(len2).fill(false)

  let matches = 0
  let transpositions = 0

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance)
    const end = Math.min(i + matchDistance + 1, len2)
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue
      s1Matches[i] = true
      s2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0.0

  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (s1[i] !== s2[k]) transpositions++
    k++
  }

  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3

  // Winkler prefix boost
  const prefixLen = Math.min(
    4,
    [...s1].findIndex((c, i) => c !== s2[i]) === -1
      ? Math.min(len1, len2)
      : [...s1].findIndex((c, i) => c !== s2[i])
  )

  return jaro + prefixLen * 0.1 * (1 - jaro)
}
