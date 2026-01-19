export interface QuestionSet {
  id: string
  name: string
  createdAt: string
}

export interface Question {
  id: string
  setId: string
  question: string
  answer: string
  bookmarked?: boolean
  easeFactor?: number
  repetitions?: number
  intervalDays?: number
  nextReview?: string | null
}

export interface Attempt {
  id: string
  questionId: string
  correct: boolean
  timestamp: string
}

export interface QuestionWithScore extends Question {
  score: number | null
}

export interface QuestionSetRow {
  id: string
  name: string
  created_at: string
}

export interface QuestionRow {
  id: string
  set_id: string
  question: string
  answer: string
  bookmarked: number
  ease_factor: number
  repetitions: number
  interval_days: number
  next_review: string | null
}

export interface AttemptRow {
  id: string
  question_id: string
  correct: number
  timestamp: string
}
