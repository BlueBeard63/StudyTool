/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * Based on the SuperMemo SM-2 algorithm for optimal learning intervals.
 * https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */

export interface SM2Input {
  quality: number // 0-5 (0=complete blackout, 5=perfect response)
  easeFactor: number // current EF (default 2.5)
  repetitions: number // current reps (default 0)
  intervalDays: number // current interval (default 0)
}

export interface SM2Result {
  easeFactor: number
  repetitions: number
  intervalDays: number
  nextReview: string // ISO date string
}

/**
 * Calculate the next spaced repetition values using the SM-2 algorithm.
 *
 * Quality scale:
 * 5 - perfect response
 * 4 - correct response after hesitation
 * 3 - correct response recalled with serious difficulty
 * 2 - incorrect response; correct one seemed easy to recall
 * 1 - incorrect response; correct one remembered
 * 0 - complete blackout
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, easeFactor, repetitions, intervalDays } = input

  let newEaseFactor = easeFactor
  let newRepetitions = repetitions
  let newIntervalDays = intervalDays

  if (quality < 3) {
    // Failed recall - reset to beginning
    newRepetitions = 0
    newIntervalDays = 1
  } else {
    // Successful recall - increase interval
    if (repetitions === 0) {
      newIntervalDays = 1
    } else if (repetitions === 1) {
      newIntervalDays = 6
    } else {
      newIntervalDays = Math.round(intervalDays * easeFactor)
    }
    newRepetitions = repetitions + 1
  }

  // Update ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const qDiff = 5 - quality
  newEaseFactor = easeFactor + (0.1 - qDiff * (0.08 + qDiff * 0.02))

  // Ensure ease factor doesn't drop below 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor)

  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newIntervalDays)
  const nextReview = nextReviewDate.toISOString().split("T")[0]

  return {
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    intervalDays: newIntervalDays,
    nextReview,
  }
}
