import { v4 as uuidv4 } from "uuid"
import db from "../db/index.js"
import type { QuestionSet, QuestionSetRow } from "../types/index.js"

function rowToQuestionSet(row: QuestionSetRow): QuestionSet {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }
}

export function getAll(): QuestionSet[] {
  const stmt = db.prepare("SELECT * FROM question_sets ORDER BY created_at DESC")
  const rows = stmt.all() as QuestionSetRow[]
  return rows.map(rowToQuestionSet)
}

export function getById(id: string): QuestionSet | null {
  const stmt = db.prepare("SELECT * FROM question_sets WHERE id = ?")
  const row = stmt.get(id) as QuestionSetRow | undefined
  return row ? rowToQuestionSet(row) : null
}

export function create(name: string): QuestionSet {
  const id = uuidv4()
  const createdAt = new Date().toISOString()
  const stmt = db.prepare(
    "INSERT INTO question_sets (id, name, created_at) VALUES (?, ?, ?)"
  )
  stmt.run(id, name, createdAt)
  return { id, name, createdAt }
}

export function deleteById(id: string): boolean {
  const stmt = db.prepare("DELETE FROM question_sets WHERE id = ?")
  const result = stmt.run(id)
  return result.changes > 0
}

export function update(id: string, name: string): QuestionSet | null {
  const stmt = db.prepare("UPDATE question_sets SET name = ? WHERE id = ?")
  const result = stmt.run(name, id)
  if (result.changes === 0) return null
  return getById(id)
}

export function getQuestionCount(id: string): number {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM questions WHERE set_id = ?")
  const row = stmt.get(id) as { count: number }
  return row.count
}
