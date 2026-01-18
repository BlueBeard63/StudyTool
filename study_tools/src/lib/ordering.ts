/**
 * Calculate selection weight from score.
 * Lower scores = higher weights (prioritize weak questions).
 * null (no attempts) treated as 0.5 (medium priority).
 */
export function getWeight(score: number | null): number {
  return 1 - (score ?? 0.5)
}

/**
 * Weighted random selection from an array.
 * Returns the index of the selected item.
 */
export function weightedRandomIndex(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total === 0) return Math.floor(Math.random() * weights.length)

  let random = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i]
    if (random <= 0) return i
  }
  return weights.length - 1
}

/**
 * Create smart-ordered question indices.
 * Weighted shuffle prioritizing low scores.
 */
export function createSmartOrder(scores: (number | null)[]): number[] {
  const indices = scores.map((_, i) => i)
  const remaining = [...indices]
  const result: number[] = []
  const weights = scores.map(getWeight)

  while (remaining.length > 0) {
    const remainingWeights = remaining.map((i) => weights[i])
    const selectedIdx = weightedRandomIndex(remainingWeights)
    result.push(remaining[selectedIdx])
    remaining.splice(selectedIdx, 1)
  }

  return result
}

/**
 * Pick next question index for timed mode (weighted random).
 * Excludes recently answered questions to avoid immediate repeats.
 */
export function pickNextIndex(
  scores: (number | null)[],
  recentIndices: number[]
): number {
  // Exclude recent questions (up to half the set, min 1)
  const excludeCount = Math.min(
    Math.max(1, Math.floor(scores.length / 2)),
    recentIndices.length
  )
  const excluded = new Set(recentIndices.slice(-excludeCount))

  const candidates = scores.map((_, i) => i).filter((i) => !excluded.has(i))

  // If all excluded, allow all
  const pool = candidates.length > 0 ? candidates : scores.map((_, i) => i)

  // Weighted random from pool
  const weights = pool.map((i) => getWeight(scores[i]))
  const selectedIdx = weightedRandomIndex(weights)
  return pool[selectedIdx]
}
