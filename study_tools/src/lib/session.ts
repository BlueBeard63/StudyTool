export type SessionMode = "practice" | "timed"
export type Difficulty = "easy" | "medium" | "hard" | "extreme"
export type InputMethod = "typing" | "wordbank"

export const DIFFICULTY_PERCENT: Record<Difficulty, number> = {
  easy: 0.2,
  medium: 0.4,
  hard: 0.6,
  extreme: 0.8,
}

export interface SessionState {
  status: "not-started" | "in-progress" | "completed"
  mode: SessionMode
  difficulty: Difficulty
  inputMethod: InputMethod
  timerDuration: number | null
  timeRemaining: number | null
  startTime: number | null
  currentIndex: number
  questionsAnswered: number
  correctCount: number
  totalScore: number
  results: QuestionResult[]
  questionOrder: number[] // For practice mode: pre-computed smart order
  recentIndices: number[] // For timed mode: track recent questions
}

export interface QuestionResult {
  questionId: string
  question: string
  correct: boolean
  score: number
  userAnswers: string[]
  correctAnswers: string[]
  hintsUsed?: number
}

export function createInitialSession(
  mode: SessionMode = "practice",
  timerDuration: number | null = null,
  difficulty: Difficulty = "medium",
  inputMethod: InputMethod = "typing"
): SessionState {
  return {
    status: "not-started",
    mode,
    difficulty,
    inputMethod,
    timerDuration,
    timeRemaining: timerDuration,
    startTime: null,
    currentIndex: 0,
    questionsAnswered: 0,
    correctCount: 0,
    totalScore: 0,
    results: [],
    questionOrder: [],
    recentIndices: [],
  }
}

export function calculateSessionScore(results: QuestionResult[]): number {
  if (results.length === 0) return 0
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  return totalScore / results.length
}
