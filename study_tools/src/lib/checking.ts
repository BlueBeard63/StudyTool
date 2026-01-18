import { similarity } from "./similarity"

export interface BlankResult {
  blankIndex: number
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  similarity: number
}

export interface CheckResult {
  blanks: BlankResult[]
  correctCount: number
  totalBlanks: number
  score: number // 0-1
}

/**
 * Check user answers against correct answers.
 * Returns per-blank results and overall score.
 */
export function checkAnswers(
  userAnswers: string[],
  correctAnswers: string[],
  threshold = 0.8
): CheckResult {
  const blanks: BlankResult[] = userAnswers.map((userAnswer, i) => {
    const correctAnswer = correctAnswers[i] || ""
    const sim = similarity(userAnswer, correctAnswer)

    return {
      blankIndex: i,
      userAnswer: userAnswer.trim(),
      correctAnswer,
      isCorrect: sim >= threshold,
      similarity: sim,
    }
  })

  const correctCount = blanks.filter((b) => b.isCorrect).length
  const totalBlanks = blanks.length

  return {
    blanks,
    correctCount,
    totalBlanks,
    score: totalBlanks > 0 ? correctCount / totalBlanks : 1,
  }
}
