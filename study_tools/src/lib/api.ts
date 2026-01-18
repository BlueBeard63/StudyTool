const API_BASE = "http://localhost:3001/api"

export interface QuestionSet {
  id: string
  name: string
  createdAt: string
  questionCount: number
}

export async function fetchSets(): Promise<QuestionSet[]> {
  const res = await fetch(`${API_BASE}/sets`)
  if (!res.ok) throw new Error("Failed to fetch sets")
  return res.json()
}

export interface CreateSetInput {
  name: string
  questions: { question: string; answer: string }[]
}

export async function createSet(input: CreateSetInput): Promise<QuestionSet> {
  const res = await fetch(`${API_BASE}/sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create set")
  }
  return res.json()
}

export interface Question {
  id: string
  setId: string
  question: string
  answer: string
}

export async function fetchQuestions(setId: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/sets/${setId}/questions`)
  if (!res.ok) throw new Error("Failed to fetch questions")
  return res.json()
}

export interface Attempt {
  id: string
  correct: boolean
  createdAt: string
}

export interface QuestionStats {
  question: Question
  attempts: Attempt[]
  totalAttempts: number
  score: number | null
}

export async function recordAttempt(
  questionId: string,
  correct: boolean
): Promise<void> {
  const res = await fetch(`${API_BASE}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, correct }),
  })
  if (!res.ok) throw new Error("Failed to record attempt")
}

export async function fetchQuestionStats(
  questionId: string
): Promise<QuestionStats> {
  const res = await fetch(`${API_BASE}/questions/${questionId}/stats`)
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}
