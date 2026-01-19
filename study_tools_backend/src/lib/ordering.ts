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
 * Create smart-ordered indices from scores.
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
 * Reorder an array based on a smart order of indices.
 */
export function applySmartOrder<T>(items: T[], scores: (number | null)[]): T[] {
  const order = createSmartOrder(scores)
  return order.map((i) => items[i])
}
