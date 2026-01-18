import type { Attempt } from "../types/index.js"

const WEIGHTS = [1.0, 0.8, 0.6, 0.4, 0.2]

/**
 * Calculate weighted score from recent attempts.
 * Uses weights [1.0, 0.8, 0.6, 0.4, 0.2] for most recent 5 attempts.
 * Returns null if no attempts, otherwise returns weighted average (0-1).
 */
export function calculateWeightedScore(attempts: Attempt[]): number | null {
  if (attempts.length === 0) {
    return null
  }

  const recentAttempts = attempts.slice(0, 5)
  let weightedSum = 0
  let totalWeight = 0

  for (let i = 0; i < recentAttempts.length; i++) {
    const weight = WEIGHTS[i]
    weightedSum += recentAttempts[i].correct ? weight : 0
    totalWeight += weight
  }

  return weightedSum / totalWeight
}
