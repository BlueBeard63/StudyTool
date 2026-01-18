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
}

export interface Attempt {
  id: string
  questionId: string
  correct: boolean
  timestamp: string
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
}

export interface AttemptRow {
  id: string
  question_id: string
  correct: number
  timestamp: string
}
