import { v4 as uuidv4 } from "uuid"
import db from "../db/index.js"
import type { Question, QuestionRow } from "../types/index.js"

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    setId: row.set_id,
    question: row.question,
    answer: row.answer,
  }
}

export function getBySetId(setId: string): Question[] {
  const stmt = db.prepare("SELECT * FROM questions WHERE set_id = ?")
  const rows = stmt.all(setId) as QuestionRow[]
  return rows.map(rowToQuestion)
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
