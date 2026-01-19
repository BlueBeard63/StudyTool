import { v4 as uuidv4 } from "uuid"
import db from "../db/index.js"
import type { Session, SessionRow } from "../types/index.js"

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    setId: row.set_id,
    mode: row.mode as Session["mode"],
    difficulty: row.difficulty as Session["difficulty"],
    inputMethod: row.input_method as Session["inputMethod"],
    duration: row.duration,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    score: row.score,
    questionsAnswered: row.questions_answered,
    correctCount: row.correct_count,
  }
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

export function create(input: CreateSessionInput): Session {
  const id = uuidv4()
  const stmt = db.prepare(`
    INSERT INTO sessions (
      id, set_id, mode, difficulty, input_method, duration,
      started_at, completed_at, score, questions_answered, correct_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(
    id,
    input.setId,
    input.mode,
    input.difficulty,
    input.inputMethod,
    input.duration,
    input.startedAt,
    input.completedAt,
    input.score,
    input.questionsAnswered,
    input.correctCount
  )
  return {
    id,
    ...input,
  }
}

export function getById(id: string): Session | null {
  const stmt = db.prepare("SELECT * FROM sessions WHERE id = ?")
  const row = stmt.get(id) as SessionRow | undefined
  return row ? rowToSession(row) : null
}

export function getBySetId(setId: string, limit: number = 50): Session[] {
  const stmt = db.prepare(
    "SELECT * FROM sessions WHERE set_id = ? ORDER BY completed_at DESC LIMIT ?"
  )
  const rows = stmt.all(setId, limit) as SessionRow[]
  return rows.map(rowToSession)
}

export function getAll(limit: number = 50): Session[] {
  const stmt = db.prepare(
    "SELECT * FROM sessions ORDER BY completed_at DESC LIMIT ?"
  )
  const rows = stmt.all(limit) as SessionRow[]
  return rows.map(rowToSession)
}
