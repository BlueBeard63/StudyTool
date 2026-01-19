import { v4 as uuidv4 } from "uuid"
import db from "../db/index.js"
import type { Attempt, AttemptRow } from "../types/index.js"

function rowToAttempt(row: AttemptRow): Attempt {
  return {
    id: row.id,
    questionId: row.question_id,
    correct: row.correct === 1,
    timestamp: row.timestamp,
    sessionId: row.session_id,
  }
}

export function create(
  questionId: string,
  correct: boolean,
  sessionId?: string
): Attempt {
  const id = uuidv4()
  const timestamp = new Date().toISOString()
  const stmt = db.prepare(
    "INSERT INTO attempts (id, question_id, correct, timestamp, session_id) VALUES (?, ?, ?, ?, ?)"
  )
  stmt.run(id, questionId, correct ? 1 : 0, timestamp, sessionId ?? null)
  return { id, questionId, correct, timestamp, sessionId }
}

export function getRecentByQuestionId(
  questionId: string,
  limit: number = 5
): Attempt[] {
  const stmt = db.prepare(
    "SELECT * FROM attempts WHERE question_id = ? ORDER BY timestamp DESC LIMIT ?"
  )
  const rows = stmt.all(questionId, limit) as AttemptRow[]
  return rows.map(rowToAttempt)
}

export function getAllByQuestionId(questionId: string): Attempt[] {
  const stmt = db.prepare(
    "SELECT * FROM attempts WHERE question_id = ? ORDER BY timestamp DESC"
  )
  const rows = stmt.all(questionId) as AttemptRow[]
  return rows.map(rowToAttempt)
}
