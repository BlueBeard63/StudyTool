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
