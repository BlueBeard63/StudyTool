import { v4 as uuidv4 } from "uuid"
import db from "../db/index.js"
import type { Question, QuestionRow, QuestionWithScore } from "../types/index.js"
import { calculateWeightedScore } from "../lib/score.js"

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    setId: row.set_id,
    question: row.question,
    answer: row.answer,
    bookmarked: row.bookmarked === 1,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    intervalDays: row.interval_days,
    nextReview: row.next_review,
  }
}

export function getBySetId(setId: string): Question[] {
  const stmt = db.prepare("SELECT * FROM questions WHERE set_id = ?")
  const rows = stmt.all(setId) as QuestionRow[]
  return rows.map(rowToQuestion)
}

export function getBySetIdPaginated(
  setId: string,
  offset = 0,
  limit = 32
): Question[] {
  const stmt = db.prepare(
    "SELECT * FROM questions WHERE set_id = ? LIMIT ? OFFSET ?"
  )
  const rows = stmt.all(setId, limit, offset) as QuestionRow[]
  return rows.map(rowToQuestion)
}

export function countBySetId(setId: string): number {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM questions WHERE set_id = ?")
  const row = stmt.get(setId) as { count: number }
  return row.count
}

export function getById(id: string): Question | null {
  const stmt = db.prepare("SELECT * FROM questions WHERE id = ?")
  const row = stmt.get(id) as QuestionRow | undefined
  return row ? rowToQuestion(row) : null
}

export function create(
  setId: string,
  question: string,
  answer: string
): Question {
  const id = uuidv4()
  const stmt = db.prepare(
    "INSERT INTO questions (id, set_id, question, answer) VALUES (?, ?, ?, ?)"
  )
  stmt.run(id, setId, question, answer)
  return { id, setId, question, answer }
}

export function createMany(
  setId: string,
  questions: Array<{ question: string; answer: string }>
): Question[] {
  const stmt = db.prepare(
    "INSERT INTO questions (id, set_id, question, answer) VALUES (?, ?, ?, ?)"
  )

  const insertMany = db.transaction((items: typeof questions) => {
    const results: Question[] = []
    for (const item of items) {
      const id = uuidv4()
      stmt.run(id, setId, item.question, item.answer)
      results.push({ id, setId, question: item.question, answer: item.answer })
    }
    return results
  })

  return insertMany(questions)
}

export function update(
  id: string,
  question: string,
  answer: string
): Question | null {
  const stmt = db.prepare(
    "UPDATE questions SET question = ?, answer = ? WHERE id = ?"
  )
  const result = stmt.run(question, answer, id)
  if (result.changes === 0) return null
  return getById(id)
}

export function deleteById(id: string): boolean {
  const stmt = db.prepare("DELETE FROM questions WHERE id = ?")
  const result = stmt.run(id)
  return result.changes > 0
}

export function toggleBookmark(id: string, bookmarked: boolean): Question | null {
  const stmt = db.prepare("UPDATE questions SET bookmarked = ? WHERE id = ?")
  const result = stmt.run(bookmarked ? 1 : 0, id)
  if (result.changes === 0) return null
  return getById(id)
}

export function getBookmarkedBySetId(setId: string): Question[] {
  const stmt = db.prepare("SELECT * FROM questions WHERE set_id = ? AND bookmarked = 1")
  const rows = stmt.all(setId) as QuestionRow[]
  return rows.map(rowToQuestion)
}

export function updateSRData(
  id: string,
  easeFactor: number,
  repetitions: number,
  intervalDays: number,
  nextReview: string | null
): Question | null {
  const stmt = db.prepare(
    "UPDATE questions SET ease_factor = ?, repetitions = ?, interval_days = ?, next_review = ? WHERE id = ?"
  )
  const result = stmt.run(easeFactor, repetitions, intervalDays, nextReview, id)
  if (result.changes === 0) return null
  return getById(id)
}

export function getDueQuestions(setId?: string): Question[] {
  let query = `SELECT * FROM questions WHERE next_review <= DATE('now') OR next_review IS NULL`
  const params: string[] = []

  if (setId) {
    query += ` AND set_id = ?`
    params.push(setId)
  }

  query += ` ORDER BY next_review ASC`

  const stmt = db.prepare(query)
  const rows = stmt.all(...params) as QuestionRow[]
  return rows.map(rowToQuestion)
}

export function countDueBySetId(setId: string): number {
  const stmt = db.prepare(
    `SELECT COUNT(*) as count FROM questions
     WHERE set_id = ? AND (next_review <= DATE('now') OR next_review IS NULL)`
  )
  const row = stmt.get(setId) as { count: number }
  return row.count
}

/**
 * Get all questions for a set with their weighted scores.
 * Efficiently fetches attempts and calculates scores in bulk.
 */
export function getBySetIdWithScores(setId: string): QuestionWithScore[] {
  // Get all questions
  const questions = getBySetId(setId)

  if (questions.length === 0) return []

  // Get all attempts for these questions in one query
  const questionIds = questions.map((q) => q.id)
  const placeholders = questionIds.map(() => "?").join(",")
  const attemptsStmt = db.prepare(
    `SELECT question_id, correct, timestamp
     FROM attempts
     WHERE question_id IN (${placeholders})
     ORDER BY timestamp DESC`
  )
  const attemptRows = attemptsStmt.all(...questionIds) as Array<{
    question_id: string
    correct: number
    timestamp: string
  }>

  // Group attempts by question
  const attemptsByQuestion = new Map<
    string,
    Array<{ correct: boolean; timestamp: string }>
  >()
  for (const row of attemptRows) {
    if (!attemptsByQuestion.has(row.question_id)) {
      attemptsByQuestion.set(row.question_id, [])
    }
    attemptsByQuestion.get(row.question_id)!.push({
      correct: row.correct === 1,
      timestamp: row.timestamp,
    })
  }

  // Calculate scores for each question
  return questions.map((q) => {
    const attempts = attemptsByQuestion.get(q.id) || []
    const score = calculateWeightedScore(
      attempts.map((a) => ({
        id: "",
        questionId: q.id,
        correct: a.correct,
        timestamp: a.timestamp,
      }))
    )
    return { ...q, score }
  })
}
