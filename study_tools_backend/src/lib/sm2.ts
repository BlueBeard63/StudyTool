/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * Based on the SuperMemo SM-2 algorithm for optimal learning intervals.
 * https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */

import * as Question from "../models/question.js"

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

/**
 * Convert a score (0-1) to SM-2 quality rating (0-5).
 *
 * Mapping:
 * - score === 1.0 -> 5 (perfect)
 * - score >= 0.8 -> 4 (correct with hesitation)
 * - score >= 0.5 -> 3 (correct with difficulty)
 * - score >= 0.3 -> 2 (incorrect, easy to recall)
 * - score > 0 -> 1 (incorrect, remembered)
 * - score === 0 -> 0 (complete blackout)
 */
export function scoreToQuality(score: number): number {
  if (score === 1.0) return 5
  if (score >= 0.8) return 4
  if (score >= 0.5) return 3
  if (score >= 0.3) return 2
  if (score > 0) return 1
  return 0
}

/**
 * Process an attempt and update spaced repetition data for a question.
 *
 * This function combines the SM-2 algorithm with the Question model to:
 * 1. Fetch the question's current SR data
 * 2. Convert the score to a quality rating
 * 3. Calculate new SR values
 * 4. Update the question in the database
 *
 * @param questionId - The ID of the question
 * @param score - The score from 0 to 1 (used to determine quality)
 */
export function processAttemptSR(questionId: string, score: number): void {
  // Get the question
  const question = Question.getById(questionId)
  if (!question) {
    // Graceful fail - question might have been deleted
    return
  }

  // Map score to quality
  const quality = scoreToQuality(score)

  // Get current SR values with defaults
  const currentEaseFactor = question.easeFactor ?? 2.5
  const currentRepetitions = question.repetitions ?? 0
  const currentIntervalDays = question.intervalDays ?? 0

  // Calculate new SR values
  const result = calculateSM2({
    quality,
    easeFactor: currentEaseFactor,
    repetitions: currentRepetitions,
    intervalDays: currentIntervalDays,
  })

  // Update the question with new SR data
  Question.updateSRData(
    questionId,
    result.easeFactor,
    result.repetitions,
    result.intervalDays,
    result.nextReview
  )
}
