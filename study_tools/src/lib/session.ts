export interface SessionState {
  status: "not-started" | "in-progress" | "completed"
  currentIndex: number
  questionsAnswered: number
  correctCount: number
  totalScore: number
  results: QuestionResult[]
}

export interface QuestionResult {
  questionId: string
  question: string
  correct: boolean
  score: number
  userAnswers: string[]
  correctAnswers: string[]
}

export function createInitialSession(): SessionState {
  return {
    status: "not-started",
    currentIndex: 0,
    questionsAnswered: 0,
    correctCount: 0,
    totalScore: 0,
    results: [],
  }
}

export function calculateSessionScore(results: QuestionResult[]): number {
  if (results.length === 0) return 0
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  return totalScore / results.length
}
