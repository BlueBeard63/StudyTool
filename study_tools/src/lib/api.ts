declare global {
    interface Window {
        __RUNTIME_CONFIG__?: {
            API_BASE_URL?: string;
        };
    }
}

export const API_BASE =
    window.__RUNTIME_CONFIG__?.API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:3001/api";

export interface QuestionSet {
  id: string
  name: string
  createdAt: string
  questionCount: number
  dueCount?: number
}

export async function fetchSets(): Promise<QuestionSet[]> {
  const res = await fetch(`${API_BASE}/sets`)
  if (!res.ok) throw new Error("Failed to fetch sets")
  return res.json()
}

export async function fetchSet(setId: string): Promise<QuestionSet> {
  const res = await fetch(`${API_BASE}/sets/${setId}`)
  if (!res.ok) throw new Error("Failed to fetch set")
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
  bookmarked?: boolean
  easeFactor?: number
  repetitions?: number
  intervalDays?: number
  nextReview?: string | null
}

export interface QuestionWithScore extends Question {
  score: number | null
}

export async function fetchQuestions(setId: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/sets/${setId}/questions`)
  if (!res.ok) throw new Error("Failed to fetch questions")
  const data = await res.json()
  // Handle both old (array) and new (paginated) response formats
  return Array.isArray(data) ? data : data.questions
}

export interface PaginatedQuestions {
  questions: Question[]
  total: number
  offset: number
  limit: number
}

export async function fetchQuestionsPaginated(
  setId: string,
  offset = 0,
  limit = 32
): Promise<PaginatedQuestions> {
  const res = await fetch(
    `${API_BASE}/sets/${setId}/questions?offset=${offset}&limit=${limit}`
  )
  if (!res.ok) throw new Error("Failed to fetch questions")
  return res.json()
}

/**
 * Fetch questions for study mode with smart ordering and scores.
 * Returns questions ordered by score (prioritizes weak/unanswered questions).
 */
export async function fetchStudyQuestions(
  setId: string,
  limit?: number,
  bookmarkedOnly?: boolean
): Promise<QuestionWithScore[]> {
  const params = new URLSearchParams()
  if (limit) params.append("limit", String(limit))
  if (bookmarkedOnly) params.append("bookmarkedOnly", "true")
  const queryString = params.toString()
  const url = queryString
    ? `${API_BASE}/sets/${setId}/study?${queryString}`
    : `${API_BASE}/sets/${setId}/study`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch study questions")
  const data = await res.json()
  return data.questions
}

export interface Attempt {
  id: string
  correct: boolean
  createdAt: string
  sessionId?: string | null
}

// Session types
export interface Session {
  id: string
  setId: string
  mode: "practice" | "timed"
  difficulty: "easy" | "medium" | "hard" | "extreme"
  inputMethod: "typing" | "wordbank"
  duration: number | null
  startedAt: string
  completedAt: string
  score: number
  questionsAnswered: number
  correctCount: number
}

export interface CreateSessionInput {
  setId: string
  mode: Session["mode"]
  difficulty: Session["difficulty"]
  inputMethod: Session["inputMethod"]
  duration: number | null
  startedAt: string
  completedAt: string
  score: number
  questionsAnswered: number
  correctCount: number
}

export interface QuestionStats {
  question: Question
  attempts: Attempt[]
  totalAttempts: number
  score: number | null
}

export async function recordAttempt(
  questionId: string,
  correct: boolean,
  score?: number,
  sessionId?: string
): Promise<void> {
  const body: {
    questionId: string
    correct: boolean
    score?: number
    sessionId?: string
  } = {
    questionId,
    correct,
  }
  if (score !== undefined) {
    body.score = score
  }
  if (sessionId !== undefined) {
    body.sessionId = sessionId
  }
  const res = await fetch(`${API_BASE}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

// Set management
export async function updateSet(
  setId: string,
  name: string
): Promise<QuestionSet> {
  const res = await fetch(`${API_BASE}/sets/${setId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error("Failed to update set")
  return res.json()
}

export async function deleteSet(setId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sets/${setId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete set")
}

// Question management
export async function addQuestion(
  setId: string,
  question: string,
  answer: string
): Promise<Question> {
  const res = await fetch(`${API_BASE}/sets/${setId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer }),
  })
  if (!res.ok) throw new Error("Failed to add question")
  return res.json()
}

export async function updateQuestion(
  questionId: string,
  question: string,
  answer: string
): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions/${questionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer }),
  })
  if (!res.ok) throw new Error("Failed to update question")
  return res.json()
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/questions/${questionId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete question")
}

// Bookmark functions
export async function toggleQuestionBookmark(
  questionId: string,
  bookmarked: boolean
): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions/${questionId}/bookmark`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookmarked }),
  })
  if (!res.ok) throw new Error("Failed to toggle bookmark")
  return res.json()
}

export async function fetchBookmarkedQuestions(
  setId: string
): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/sets/${setId}/bookmarked`)
  if (!res.ok) throw new Error("Failed to fetch bookmarked questions")
  return res.json()
}

// Stats types and functions
export interface StatsOverview {
  total: number
  correct: number
  accuracy: number
  streak: number
  today: number
  thisWeek: number
  uniqueQuestions: number
}

export interface DailyStat {
  date: string
  count: number
  correct: number
  accuracy: number
}

export async function fetchStats(): Promise<StatsOverview> {
  const res = await fetch(`${API_BASE}/stats`)
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}

export async function fetchDailyStats(days?: number): Promise<DailyStat[]> {
  const params = days ? `?days=${days}` : ""
  const res = await fetch(`${API_BASE}/stats/daily${params}`)
  if (!res.ok) throw new Error("Failed to fetch daily stats")
  return res.json()
}

export async function fetchDueQuestions(setId?: string): Promise<Question[]> {
  const params = setId ? `?setId=${setId}` : ""
  const res = await fetch(`${API_BASE}/questions/due${params}`)
  if (!res.ok) throw new Error("Failed to fetch due questions")
  return res.json()
}

// Session functions
export async function createSession(
  input: CreateSessionInput
): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create session")
  }
  return res.json()
}

export async function fetchSessions(
  setId?: string,
  limit?: number
): Promise<Session[]> {
  const params = new URLSearchParams()
  if (setId) params.append("setId", setId)
  if (limit) params.append("limit", String(limit))
  const queryString = params.toString()
  const url = queryString
    ? `${API_BASE}/sessions?${queryString}`
    : `${API_BASE}/sessions`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch sessions")
  return res.json()
}

export async function fetchSession(id: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions/${id}`)
  if (!res.ok) throw new Error("Failed to fetch session")
  return res.json()
}
