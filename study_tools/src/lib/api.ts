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
